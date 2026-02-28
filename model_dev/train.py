import torch
import torch._dynamo
import gc
import numpy as np
import pandas as pd
from tqdm import tqdm
from dataclasses import dataclass
from typing import Any
from functools import partial

# --- 0. Disable dynamo BEFORE anything else ---
torch._dynamo.config.suppress_errors = True
torch._dynamo.disable()

from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig
from datasets import Dataset
from transformers import DataCollatorForSeq2Seq, AutoTokenizer

# --- Hardware Check ---
gpu_stats = torch.cuda.get_device_properties(0)
start_gpu_memory = round(gpu_stats.total_memory / 1024**3, 2)
print(f"GPU: {gpu_stats.name}. Total VRAM: {start_gpu_memory} GB.")

# --- 1. Configuration ---
model_path = "/home/elek/Documents/buda_hackathon/medgemma-1.5-4b-q4"
dataset_path = "/home/elek/Documents/buda_hackathon/soap_dataset_structured.csv"
max_seq_length = 4096
dtype = None
load_in_4bit = True

# --- 2. Prepare Dataset and Tokenizer (Done once) ---
tokenizer = AutoTokenizer.from_pretrained(model_path)

df = pd.read_csv(dataset_path)
dataset_full = Dataset.from_pandas(df)

dataset_full = dataset_full.shuffle(seed=42)
print(f"Full dataset size after shuffle: {len(dataset_full)} samples.")

# =============================================================================
# PROMPT TEMPLATE v2 — "Faithful Scribe" (All Synthesis Recommendations Applied)
#
# CHANGES vs v1:
#
# [SYSTEMIC] Entire task reframed from "summarize into SOAP" to "accurately
#   document only what occurred in this specific encounter." This directly
#   counters the core failure pattern: the model defaulting to standard-of-care
#   medical knowledge to complete notes rather than transcribing what was said.
#
# [Rec #4] Added a mandatory pre-generation DETAIL EXTRACTION CHECKLIST as an
#   explicit scanning instruction. The model is told to mentally identify these
#   items BEFORE composing the JSON. This keeps the training target format
#   unchanged (still raw JSON) while forcing attention to the details most
#   commonly dropped: sputum characteristics, positional effects, sleep
#   disruption, failed OTC treatments, adverse reactions, and severity ratings.
#
# [Rec #1] Strengthened faithfulness constraint with explicit anti-hallucination
#   examples drawn from the synthesis report's fabrication list (ENT referrals,
#   hydration, chest X-rays, antibiotic courses).
#
# [Rec #2 + #5] Objective section definition now includes an explicit two-part
#   rule: (a) what IS included, (b) what MUST NOT be included, with the
#   subjective-vs-objective misclassification named directly as the error to
#   avoid. Home/self-reported vitals now explicitly routed to Subjective.
#
# [Rec #3] Added incomplete encounter instruction: if the exam was not performed
#   during the dialogue, Objective must say "Physical examination pending" —
#   not fabricated findings.
#
# [Rec #6] Assessment section now explicitly encouraged to use specific
#   diagnostic terms (e.g. "acute sinusitis") when the dialogue supports it.
#
# [Rec #7] Adverse reactions and medication intolerances now explicitly called
#   out as safety-critical details that must be captured in Subjective.
# =============================================================================

prompt_template = """<start_of_turn>user
You are a faithful medical scribe. Your sole task is to accurately document what actually occurred in the following doctor-patient dialogue. You are NOT writing a clinically ideal SOAP note — you are recording only what was explicitly said, observed, or decided during this specific encounter.

STEP 1 — SCAN THE DIALOGUE FIRST. Before writing anything, mentally identify:
  - Sputum/discharge characteristics (color, consistency, amount) if mentioned
  - Positional effects (symptoms better or worse lying flat, bending over, etc.)
  - Sleep disruption caused by symptoms
  - Failed self-treatments (OTC medications tried before this visit)
  - Adverse reactions or intolerances to any medication mentioned
  - Symptom severity ratings given by the patient (e.g. "7 out of 10")
  - Unusual sensations described by the patient (e.g. "choking feeling", "pressure like a bowling ball")
  - Whether the physical examination was actually completed during this dialogue
These details are frequently overlooked. Capture every one that appears.

STEP 2 — COMPOSE the SOAP note as a single JSON object with exactly these four keys:
"subjective", "objective", "assessment", "plan"

STRICT SECTION DEFINITIONS:

- "subjective": Everything the PATIENT (or their caregiver) verbally reported.
  INCLUDE: symptoms, timeline, severity ratings, sensations, positional effects,
  sleep impact, home-measured vitals (label them as self-reported), OTC medications
  tried before the visit, adverse reactions to any medication, and their own
  description of how they feel.
  DO NOT INCLUDE: anything the doctor observed, measured, or decided.

- "objective": ONLY findings the doctor or clinical staff directly observed or
  measured during THIS encounter.
  INCLUDE: in-clinic vital signs, physical exam findings actually performed,
  lab or imaging results reviewed during the visit.
  CRITICAL — DO NOT INCLUDE:
    (a) Symptoms or sensations the patient described — those are Subjective.
    (b) Home or self-reported measurements — those are Subjective
        (e.g. "patient reports fever of 38.5°C at home" → Subjective).
    (c) Exam steps that are planned but not yet performed.
  INCOMPLETE ENCOUNTER RULE: If the physical examination had not yet been
  performed when the dialogue ends, write exactly: "Physical examination pending."
  Do not fabricate findings.

- "assessment": The physician's explicit diagnostic impression or differential
  diagnosis as stated in the dialogue. Use specific clinical terminology when
  the dialogue supports it (e.g. "acute sinusitis", "acute bronchitis") rather
  than vague descriptors. Do not infer diagnoses not mentioned.

- "plan": ONLY the treatments, medications, referrals, diagnostics, and follow-up
  steps the doctor explicitly stated during this encounter.
  THE FOLLOWING ARE HALLUCINATIONS UNLESS THE DOCTOR SAID THEM:
    - Specialist or ENT referrals
    - Hydration, rest, or general wellness advice
    - Antibiotic or bronchodilator prescriptions
    - Chest X-rays or other imaging
    - Follow-up appointment scheduling
  If the doctor did not say it, it does not belong here.

ZERO HALLUCINATION POLICY:
  Do not complete, extend, or improve the note using your medical knowledge.
  Do not add standard-of-care steps that seem appropriate but were not discussed.
  Only transcribe what was explicitly said. A shorter, accurate plan is far
  preferable to a complete-looking plan containing fabricated elements.

MISSING INFO: If a section genuinely was not discussed, use exactly: "Not discussed."

OUTPUT: Return only the raw JSON object. No markdown, no code fences, no extra text.

Dialogue:
{}<end_of_turn>
<start_of_turn>model
{}<end_of_turn>"""


def formatting_prompts_func(examples):
    inputs  = examples["input_text"]
    outputs = examples["output_text_json"]
    texts = []
    for input_text, output_text in zip(inputs, outputs):
        text = prompt_template.format(input_text, output_text)
        texts.append(text)
    return {"text": texts}

dataset_full = dataset_full.map(formatting_prompts_func, batched=True)

# =============================================================================
# VRAM TEARDOWN UTILITY
# del + empty_cache alone is not sufficient: the optimizer (adamw_8bit) holds
# its own tensor buffers, the SFTTrainer keeps references to the model and
# dataset collator, and gradient checkpointing leaves activation buffers alive
# until the computation graph is explicitly broken. This function tears all of
# that down in the correct order before the next run loads a fresh model.
# =============================================================================

def teardown_run(model, trainer, tokenizer):
    """Aggressively free all GPU memory after a training run."""

    # 1. Break the trainer's internal references to model, optimizer, scheduler,
    #    and data collator before deleting anything, so Python's reference
    #    counting can actually reach zero and trigger __del__ on CUDA tensors.
    try:
        trainer.model = None
        trainer.optimizer = None
        trainer.lr_scheduler = None
        trainer.data_collator = None
        trainer.train_dataset = None
        trainer.tokenizer = None
    except Exception:
        pass

    # 2. Zero out the model's parameter gradients before deletion so the
    #    autograd graph doesn't hold the tensors alive through grad references.
    try:
        for param in model.parameters():
            param.grad = None
    except Exception:
        pass

    # 3. Delete in dependency order: trainer first (holds optimizer state,
    #    which holds moment tensors), then model, then tokenizer.
    del trainer
    del model
    del tokenizer

    # 4. Multiple GC passes — the first pass frees Python objects and breaks
    #    reference cycles; the second pass catches anything freed by the first.
    for _ in range(3):
        gc.collect()

    # 5. Synchronize the CUDA stream so all pending kernel launches finish and
    #    their associated allocations become reclaimable before we clear cache.
    torch.cuda.synchronize()
    torch.cuda.empty_cache()

    # 6. Reset the per-device memory stats so peak memory tracking is accurate
    #    for the next run, and log the residual allocation as a sanity check.
    torch.cuda.reset_peak_memory_stats()
    residual = torch.cuda.memory_allocated() / 1024**3
    reserved = torch.cuda.memory_reserved() / 1024**3
    print(f"\n[VRAM] Post-teardown — allocated: {residual:.2f} GB | reserved: {reserved:.2f} GB")
    if residual > 0.5:
        print(f"[VRAM] WARNING: {residual:.2f} GB still allocated after teardown. "
              f"A tensor reference may have leaked outside the run scope.")


def vram_snapshot(label: str):
    """Log current VRAM state at a named checkpoint."""
    allocated = torch.cuda.memory_allocated() / 1024**3
    reserved  = torch.cuda.memory_reserved()  / 1024**3
    peak      = torch.cuda.max_memory_allocated() / 1024**3
    print(f"[VRAM:{label}] allocated={allocated:.2f}GB | reserved={reserved:.2f}GB | peak={peak:.2f}GB")


# --- 3. Training Loop ---
# Runs are structured to compare shallow vs. deeper training exposure under the
# new "faithful scribe" prompt. A third run (4000 rows × 2 true epochs) is added
# compared to v1 to test whether the more complex prompt instruction set — which
# asks for a pre-generation scan step and has more constraints to internalize —
# benefits from additional repetition. The 1ep and 2ep-equiv runs from v1 are
# preserved for a direct before/after comparison on eval.
runs = [
    {"label": "2ep_equiv",  "num_rows": 4000, "epochs": 1},
    {"label": "1ep_equiv",  "num_rows": 2000, "epochs": 1},
    {"label": "4ep_equiv",  "num_rows": 4000, "epochs": 2},  # NEW: deeper pass for complex prompt
]

for run in runs:
    label     = run["label"]
    num_rows  = run["num_rows"]
    epochs    = run["epochs"]

    print(f"\n" + "="*50)
    print(f"STARTING RUN: {label}  ({num_rows} rows, {epochs} epoch(s))")
    print("="*50 + "\n")

    dataset = dataset_full.select(range(num_rows))
    print(f"Dataset size for this run: {len(dataset)} samples.")

    vram_snapshot("pre-load")
    model, current_tokenizer = FastLanguageModel.from_pretrained(
        model_name = model_path,
        max_seq_length = max_seq_length,
        dtype = dtype,
        load_in_4bit = load_in_4bit,
    )

    vision_tower = model.model.vision_tower
    vision_tower.to("cpu")
    for param in vision_tower.parameters():
        param.requires_grad = False

    torch.cuda.empty_cache()
    gc.collect()
    vram_snapshot("post-load (vision tower offloaded)")

    model = FastLanguageModel.get_peft_model(
        model,
        r = 16,
        target_modules = [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha = 32,
        lora_dropout = 0,
        bias = "none",
        use_gradient_checkpointing = "unsloth",
        random_state = 42,
    )

    _original_forward = model.forward

    def _patched_forward(*args, **kwargs):
        if kwargs.get("token_type_ids") is None:
            input_ids = kwargs.get("input_ids", args[0] if args else None)
            if input_ids is not None:
                kwargs["token_type_ids"] = torch.zeros_like(input_ids)
        return _original_forward(*args, **kwargs)

    model.forward = _patched_forward

    @dataclass
    class TextOnlyCollator:
        base_collator: Any

        def __call__(self, features):
            batch = self.base_collator(features)
            batch["token_type_ids"] = torch.zeros(
                batch["input_ids"].shape, dtype=torch.long
            )
            return batch

    base_collator = DataCollatorForSeq2Seq(
        tokenizer=current_tokenizer,
        model=model,
        padding=True,
        pad_to_multiple_of=8,
    )
    collator = TextOnlyCollator(base_collator=base_collator)

    # v2_faithful suffix distinguishes these checkpoints from v1 runs so evals
    # can be compared directly against the same label (e.g. 1ep_equiv v1 vs v2).
    output_name = f"medgemma_soap_lora_v2_faithful_{label}_lr2e4_r16"

    trainer = SFTTrainer(
        model = model,
        tokenizer = current_tokenizer,
        train_dataset = dataset,
        eval_dataset = None,
        data_collator = collator,
        args = SFTConfig(
            dataset_text_field = "text",
            max_seq_length = max_seq_length,
            dataset_num_proc = 2,
            packing = True,
            per_device_train_batch_size = 1,
            gradient_accumulation_steps = 4,
            warmup_steps = 10,
            num_train_epochs = epochs,
            learning_rate = 2e-4,
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 10,
            optim = "adamw_8bit",
            weight_decay = 0.01,
            lr_scheduler_type = "constant_with_warmup",
            seed = 42,
            output_dir = f"{output_name}_checkpoints",
            report_to = "none",
            eval_strategy = "no",
            torch_compile = False,
            gradient_checkpointing = True,
            gradient_checkpointing_kwargs = {"use_reentrant": False},
        ),
    )

    torch.cuda.empty_cache()
    gc.collect()

    print(f"Training model: {output_name}...")
    trainer.train()
    vram_snapshot("post-train")

    model.save_pretrained(output_name)
    current_tokenizer.save_pretrained(output_name)
    print(f"Training complete. Adapters saved to '{output_name}'.")

    vram_snapshot("pre-teardown")
    teardown_run(model, trainer, current_tokenizer)

print("\nAll scheduled training runs have completed successfully.")