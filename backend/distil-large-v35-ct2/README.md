---
language:
  - en
tags:
  - audio
  - automatic-speech-recognition
license: mit
library_name: ctranslate2
---

# Distil-Whisper: Distil-Large-v3.5 for CTranslate2

This repository contains the model weights for [distil-large-v3.5](https://huggingface.co/distil-whisper/distil-large-v3.5)
converted to [CTranslate2](https://github.com/OpenNMT/CTranslate2) format. CTranslate2 is a fast inference engine for 
Transformer models and is the supported backend for the [Faster-Whisper](https://github.com/systran/faster-whisper) package.

## Usage

To use the model in Faster-Whisper, first install the PyPi package according to the [official instructions](https://github.com/SYSTRAN/faster-whisper#installation).

For this example, we'll also install 🤗 Datasets to load a toy audio dataset from the Hugging Face Hub:

```bash
pip install --upgrade pip
pip install --upgrade git+https://github.com/SYSTRAN/faster-whisper datasets[audio]
```

The following code snippet loads the distil-large-v3 model and runs inference on an example file from the LibriSpeech ASR
dataset:

```python
import torch
from faster_whisper import WhisperModel
from datasets import load_dataset

# define our torch configuration
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if torch.cuda.is_available() else "float32"

# load model on GPU if available, else cpu
model = WhisperModel("distil-whisper/distil-large-v3.5-ct2", device=device, compute_type=compute_type)

# load toy dataset for example
dataset = load_dataset("hf-internal-testing/librispeech_asr_dummy", "clean", split="validation")
sample = dataset[1]["audio"]["path"]

segments, info = model.transcribe(sample, beam_size=5, language="en")

for segment in segments:
    print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
```

To transcribe a local audio file, simply pass the path to the audio file as the `audio` argument to transcribe:

```python
segments, info = model.transcribe("audio.mp3", beam_size=5, language="en")
```

## Model Details

For more information about the Distil-Large-v3.5 model, refer to the original [model card](https://huggingface.co/distil-whisper/distil-large-v3.5).

## License

Distil-Whisper inherits the [MIT license](https://github.com/huggingface/distil-whisper/blob/main/LICENSE) from OpenAI's Whisper model.

## Citation

If you use this model, please consider citing the [Distil-Whisper paper](https://arxiv.org/abs/2311.00430):
```
@misc{gandhi2023distilwhisper,
      title={Distil-Whisper: Robust Knowledge Distillation via Large-Scale Pseudo Labelling}, 
      author={Sanchit Gandhi and Patrick von Platen and Alexander M. Rush},
      year={2023},
      eprint={2311.00430},
      archivePrefix={arXiv},
      primaryClass={cs.CL}
}
```