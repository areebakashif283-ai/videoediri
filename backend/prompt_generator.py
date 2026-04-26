import os
import json
import math
import re
from typing import Optional


def split_script_into_scenes(script: str, total_duration: float) -> list[dict]:
    """Split script text into scenes based on sentences, distributing duration evenly."""
    # Split by sentence-ending punctuation
    sentences = re.split(r'(?<=[.!?])\s+', script.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return []

    # Group short sentences together to avoid too many tiny scenes
    scenes = []
    current_text = ""
    min_words_per_scene = 8

    for sentence in sentences:
        if current_text and len(current_text.split()) >= min_words_per_scene:
            scenes.append(current_text.strip())
            current_text = sentence
        else:
            current_text = f"{current_text} {sentence}".strip() if current_text else sentence

    if current_text:
        scenes.append(current_text.strip())

    # Calculate duration per scene based on word count
    total_words = sum(len(s.split()) for s in scenes)
    result = []
    for i, text in enumerate(scenes):
        word_count = len(text.split())
        proportion = word_count / total_words if total_words > 0 else 1.0 / len(scenes)
        duration = round(proportion * total_duration, 2)
        duration = max(duration, 2.0)  # Minimum 2 seconds per scene

        result.append({
            "scene_id": i + 1,
            "text": text,
            "prompt": "",
            "image": f"scene_{i + 1:02d}.png",
            "duration": duration,
        })

    # Adjust durations to match total audio length
    current_total = sum(s["duration"] for s in result)
    if current_total > 0 and abs(current_total - total_duration) > 0.1:
        ratio = total_duration / current_total
        for s in result:
            s["duration"] = round(s["duration"] * ratio, 2)

    return result


def generate_prompts_with_openai(scenes: list[dict]) -> list[dict]:
    """Use OpenAI API to generate cinematic image prompts for each scene."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Fallback: generate descriptive prompts without API
        return generate_prompts_fallback(scenes)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        scene_texts = "\n".join([f"Scene {s['scene_id']}: {s['text']}" for s in scenes])

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cinematic visual designer. Given script scenes, generate detailed, "
                        "vivid image prompts suitable for AI image generation (Midjourney/Stable Diffusion). "
                        "Each prompt should describe: setting, lighting, mood, camera angle, and visual style. "
                        "Return ONLY a JSON array with objects having 'scene_id' (int) and 'prompt' (string). "
                        "No markdown, no explanation."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Generate cinematic image prompts for these scenes:\n\n{scene_texts}",
                },
            ],
            temperature=0.8,
            max_tokens=2000,
        )

        content = response.choices[0].message.content.strip()
        # Remove markdown code fences if present
        if content.startswith("```"):
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content)

        ai_prompts = json.loads(content)

        # Merge AI prompts back into scenes
        prompt_map = {p["scene_id"]: p["prompt"] for p in ai_prompts}
        for scene in scenes:
            if scene["scene_id"] in prompt_map:
                scene["prompt"] = prompt_map[scene["scene_id"]]
            else:
                scene["prompt"] = generate_single_fallback_prompt(scene["text"])

        return scenes

    except Exception:
        return generate_prompts_fallback(scenes)


def generate_single_fallback_prompt(text: str) -> str:
    """Generate a descriptive prompt from scene text without AI."""
    words = text.split()[:20]
    base = " ".join(words)
    return (
        f"Cinematic wide-angle shot depicting: {base}. "
        f"Professional photography, dramatic lighting, vivid colors, "
        f"8k ultra HD, photorealistic, film grain"
    )


def generate_prompts_fallback(scenes: list[dict]) -> list[dict]:
    """Generate prompts without OpenAI API as fallback."""
    for scene in scenes:
        scene["prompt"] = generate_single_fallback_prompt(scene["text"])
    return scenes


def generate_prompts_from_script(script: str, audio_duration: float) -> list[dict]:
    """Main function: split script and generate prompts."""
    scenes = split_script_into_scenes(script, audio_duration)
    scenes = generate_prompts_with_openai(scenes)
    return scenes
