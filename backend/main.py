import os
import json
import subprocess
import math
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from mutagen import File as MutagenFile

from prompt_generator import generate_prompts_from_script

app = FastAPI(title="AI Video Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"
IMAGES_DIR = ASSETS_DIR / "images"
OUTPUT_DIR = BASE_DIR / "output"

for d in [ASSETS_DIR, IMAGES_DIR, OUTPUT_DIR]:
    d.mkdir(parents=True, exist_ok=True)


class ProjectStatus(BaseModel):
    has_script: bool = False
    has_audio: bool = False
    has_prompts: bool = False
    prompt_count: int = 0
    images_uploaded: int = 0
    images_required: int = 0
    has_video: bool = False
    audio_duration: Optional[float] = None


def get_audio_duration(audio_path: Path) -> float:
    audio = MutagenFile(str(audio_path))
    if audio is None or audio.info is None:
        raise HTTPException(status_code=400, detail="Could not read audio file duration")
    return audio.info.length


def get_prompt_count() -> int:
    prompts_path = ASSETS_DIR / "prompts.json"
    if not prompts_path.exists():
        return 0
    with open(prompts_path) as f:
        data = json.load(f)
    return len(data)


def count_scene_images() -> int:
    if not IMAGES_DIR.exists():
        return 0
    return len([f for f in IMAGES_DIR.iterdir() if f.name.startswith("scene_") and f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")])


@app.get("/api/status")
def get_status():
    script_exists = (ASSETS_DIR / "script.txt").exists()
    audio_exists = (ASSETS_DIR / "voice.mp3").exists()
    prompts_exist = (ASSETS_DIR / "prompts.json").exists()
    video_exists = (OUTPUT_DIR / "final_video.mp4").exists()

    audio_duration = None
    if audio_exists:
        try:
            audio_duration = get_audio_duration(ASSETS_DIR / "voice.mp3")
        except Exception:
            pass

    prompt_count = get_prompt_count() if prompts_exist else 0

    return ProjectStatus(
        has_script=script_exists,
        has_audio=audio_exists,
        has_prompts=prompts_exist,
        prompt_count=prompt_count,
        images_uploaded=count_scene_images(),
        images_required=prompt_count,
        has_video=video_exists,
        audio_duration=audio_duration,
    )


@app.post("/api/upload/script")
async def upload_script(file: UploadFile = File(...)):
    content = await file.read()
    script_path = ASSETS_DIR / "script.txt"
    script_path.write_bytes(content)
    return {"message": "Script uploaded successfully", "size": len(content)}


@app.post("/api/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    content = await file.read()
    audio_path = ASSETS_DIR / "voice.mp3"
    audio_path.write_bytes(content)
    try:
        duration = get_audio_duration(audio_path)
    except Exception:
        duration = None
    return {"message": "Audio uploaded successfully", "duration": duration}


@app.post("/api/generate-prompts")
async def generate_prompts():
    script_path = ASSETS_DIR / "script.txt"
    audio_path = ASSETS_DIR / "voice.mp3"

    if not script_path.exists():
        raise HTTPException(status_code=400, detail="Script file not found. Please upload a script first.")
    if not audio_path.exists():
        raise HTTPException(status_code=400, detail="Audio file not found. Please upload audio first.")

    script_text = script_path.read_text(encoding="utf-8").strip()
    if not script_text:
        raise HTTPException(status_code=400, detail="Script file is empty.")

    audio_duration = get_audio_duration(audio_path)

    prompts = generate_prompts_from_script(script_text, audio_duration)

    prompts_path = ASSETS_DIR / "prompts.json"
    with open(prompts_path, "w") as f:
        json.dump(prompts, f, indent=2)

    return {"message": "Prompts generated successfully", "prompts": prompts}


@app.get("/api/prompts")
def get_prompts():
    prompts_path = ASSETS_DIR / "prompts.json"
    if not prompts_path.exists():
        return {"prompts": []}
    with open(prompts_path) as f:
        data = json.load(f)
    return {"prompts": data}


@app.post("/api/upload/image/{scene_id}")
async def upload_image(scene_id: int, file: UploadFile = File(...)):
    prompts_path = ASSETS_DIR / "prompts.json"
    if not prompts_path.exists():
        raise HTTPException(status_code=400, detail="Generate prompts first.")

    with open(prompts_path) as f:
        prompts = json.load(f)

    if scene_id < 1 or scene_id > len(prompts):
        raise HTTPException(status_code=400, detail=f"Invalid scene_id. Must be between 1 and {len(prompts)}.")

    ext = Path(file.filename).suffix.lower() if file.filename else ".png"
    if ext not in (".png", ".jpg", ".jpeg", ".webp"):
        ext = ".png"

    filename = f"scene_{scene_id:02d}{ext}"
    image_path = IMAGES_DIR / filename
    content = await file.read()
    image_path.write_bytes(content)

    # Update prompts.json with the actual filename
    prompts[scene_id - 1]["image"] = filename
    with open(prompts_path, "w") as f:
        json.dump(prompts, f, indent=2)

    return {"message": f"Image for scene {scene_id} uploaded", "filename": filename}


@app.post("/api/upload/images")
async def upload_images(files: list[UploadFile] = File(...)):
    prompts_path = ASSETS_DIR / "prompts.json"
    if not prompts_path.exists():
        raise HTTPException(status_code=400, detail="Generate prompts first.")

    with open(prompts_path) as f:
        prompts = json.load(f)

    uploaded = []
    for file in files:
        name = Path(file.filename).stem if file.filename else ""
        ext = Path(file.filename).suffix.lower() if file.filename else ".png"
        if ext not in (".png", ".jpg", ".jpeg", ".webp"):
            ext = ".png"

        # Try to extract scene number from filename
        scene_num = None
        if name.startswith("scene_"):
            try:
                scene_num = int(name.replace("scene_", ""))
            except ValueError:
                pass

        if scene_num is None:
            # Assign to next available scene
            existing = {f.stem for f in IMAGES_DIR.iterdir() if f.name.startswith("scene_")}
            for i in range(1, len(prompts) + 1):
                candidate = f"scene_{i:02d}"
                if candidate not in existing:
                    scene_num = i
                    break

        if scene_num is None or scene_num < 1 or scene_num > len(prompts):
            continue

        filename = f"scene_{scene_num:02d}{ext}"
        image_path = IMAGES_DIR / filename
        content = await file.read()
        image_path.write_bytes(content)
        prompts[scene_num - 1]["image"] = filename
        uploaded.append(filename)

    with open(prompts_path, "w") as f:
        json.dump(prompts, f, indent=2)

    return {"message": f"Uploaded {len(uploaded)} images", "files": uploaded}


@app.get("/api/validate-images")
def validate_images():
    prompts_path = ASSETS_DIR / "prompts.json"
    if not prompts_path.exists():
        raise HTTPException(status_code=400, detail="No prompts.json found.")

    with open(prompts_path) as f:
        prompts = json.load(f)

    missing = []
    found = []
    for p in prompts:
        scene_id = p["scene_id"]
        # Check for any supported extension
        image_found = False
        for ext in (".png", ".jpg", ".jpeg", ".webp"):
            candidate = IMAGES_DIR / f"scene_{scene_id:02d}{ext}"
            if candidate.exists():
                image_found = True
                p["image"] = candidate.name
                found.append(candidate.name)
                break
        if not image_found:
            missing.append(f"scene_{scene_id:02d}")

    valid = len(missing) == 0
    return {
        "valid": valid,
        "total_scenes": len(prompts),
        "found": len(found),
        "missing": missing,
    }


@app.post("/api/render")
def render_video():
    prompts_path = ASSETS_DIR / "prompts.json"
    audio_path = ASSETS_DIR / "voice.mp3"

    if not prompts_path.exists():
        raise HTTPException(status_code=400, detail="No prompts.json found.")
    if not audio_path.exists():
        raise HTTPException(status_code=400, detail="No audio file found.")

    with open(prompts_path) as f:
        prompts = json.load(f)

    # Validate all images exist
    for p in prompts:
        scene_id = p["scene_id"]
        image_found = False
        for ext in (".png", ".jpg", ".jpeg", ".webp"):
            candidate = IMAGES_DIR / f"scene_{scene_id:02d}{ext}"
            if candidate.exists():
                p["image"] = candidate.name
                image_found = True
                break
        if not image_found:
            raise HTTPException(
                status_code=400,
                detail=f"Missing image for scene {scene_id}. Upload all images first.",
            )

    audio_duration = get_audio_duration(audio_path)

    # Build FFmpeg concat file
    concat_path = ASSETS_DIR / "concat.txt"
    filter_parts = []
    inputs = []

    for i, p in enumerate(prompts):
        img_path = IMAGES_DIR / p["image"]
        duration = p["duration"]
        inputs.append(f"-loop 1 -t {duration} -i {img_path}")

    # Build complex filter for fade transitions
    fade_duration = 0.5
    n = len(prompts)

    if n == 1:
        # Single scene - just use the image
        input_args = inputs[0]
        filter_complex = f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[outv]"
    else:
        input_args = " ".join(inputs)
        # Scale all inputs
        filter_lines = []
        for i in range(n):
            filter_lines.append(f"[{i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[s{i}];")

        # Apply crossfade transitions
        if n == 2:
            offset = prompts[0]["duration"] - fade_duration
            filter_lines.append(f"[s0][s1]xfade=transition=fade:duration={fade_duration}:offset={offset}[outv]")
        else:
            # Chain xfade for multiple scenes
            offset = prompts[0]["duration"] - fade_duration
            filter_lines.append(f"[s0][s1]xfade=transition=fade:duration={fade_duration}:offset={offset}[x1];")
            cumulative_offset = offset
            for i in range(2, n):
                cumulative_offset += prompts[i - 1]["duration"] - fade_duration
                if i == n - 1:
                    filter_lines.append(f"[x{i-1}][s{i}]xfade=transition=fade:duration={fade_duration}:offset={cumulative_offset}[outv]")
                else:
                    filter_lines.append(f"[x{i-1}][s{i}]xfade=transition=fade:duration={fade_duration}:offset={cumulative_offset}[x{i}];")

        filter_complex = "".join(filter_lines)

    output_path = OUTPUT_DIR / "final_video.mp4"

    cmd = (
        f"ffmpeg -y {input_args} "
        f"-i {audio_path} "
        f'-filter_complex "{filter_complex}" '
        f"-map [outv] -map {n}:a "
        f"-c:v libx264 -preset medium -crf 23 "
        f"-c:a aac -b:a 192k "
        f"-shortest "
        f"-movflags +faststart "
        f"{output_path}"
    )

    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"FFmpeg error: {result.stderr[-500:] if result.stderr else 'Unknown error'}",
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Video rendering timed out.")

    return {"message": "Video rendered successfully", "path": str(output_path)}


@app.get("/api/video")
def get_video():
    video_path = OUTPUT_DIR / "final_video.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="No video found. Render first.")
    return FileResponse(
        str(video_path),
        media_type="video/mp4",
        filename="final_video.mp4",
    )


@app.get("/api/images/{filename}")
def get_image(filename: str):
    image_path = IMAGES_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(str(image_path))


@app.post("/api/reset")
def reset_project():
    for f in IMAGES_DIR.iterdir():
        f.unlink()
    for name in ["script.txt", "voice.mp3", "prompts.json", "concat.txt"]:
        p = ASSETS_DIR / name
        if p.exists():
            p.unlink()
    for f in OUTPUT_DIR.iterdir():
        f.unlink()
    return {"message": "Project reset successfully"}
