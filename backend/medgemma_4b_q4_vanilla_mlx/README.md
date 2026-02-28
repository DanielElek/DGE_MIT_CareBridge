---
license: other
license_name: health-ai-developer-foundations
license_link: https://developers.google.com/health-ai-developer-foundations/terms
library_name: transformers
pipeline_tag: image-text-to-text
extra_gated_heading: Access MedGemma on Hugging Face
extra_gated_prompt: To access MedGemma on Hugging Face, you're required to review
  and agree to [Health AI Developer Foundation's terms of use](https://developers.google.com/health-ai-developer-foundations/terms).
  To do this, please ensure you're logged in to Hugging Face and click below. Requests
  are processed immediately.
extra_gated_button_content: Acknowledge license
tags:
- medical
- radiology
- clinical-reasoning
- dermatology
- pathology
- ophthalmology
- chest-x-ray
- mlx
---

# mlx-community/medgemma-1.5-4b-it-bf16
This model was converted to MLX format from [`google/medgemma-1.5-4b-it`]() using mlx-vlm version **0.3.9**.
Refer to the [original model card](https://huggingface.co/google/medgemma-1.5-4b-it) for more details on the model.
## Use with mlx

```bash
pip install -U mlx-vlm
```

```bash
python -m mlx_vlm.generate --model mlx-community/medgemma-1.5-4b-it-4bit --max-tokens 100 --temperature 0.0 --prompt "Describe this image." --image <path_to_image>
```