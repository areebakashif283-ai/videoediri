# Testing: AI Video Generator

## Overview
End-to-end testing of the AI-powered video generation pipeline: script upload → audio upload → prompt generation → image upload → validation → FFmpeg video rendering → playback.

## Prerequisites

### Servers
- **Backend**: `cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000`
- **Frontend**: `cd frontend && npm run dev` (serves on `http://localhost:5173`)
- Backend venv must have: `fastapi`, `uvicorn`, `mutagen`, `openai`
- FFmpeg must be installed on the system

### Test Data
- **Script**: Any `.txt` file with 2+ paragraphs (the system splits by sentence, grouping into scenes with min 8 words each)
- **Audio**: Generate a test audio with FFmpeg: `ffmpeg -f lavfi -i "sine=frequency=440:duration=20" -ar 44100 -ac 1 test_audio.mp3 -y`
- **Images**: Generate colored test images per scene: `ffmpeg -f lavfi -i "color=c=0xFF6B35:size=1920x1080:d=1" -frames:v 1 -update 1 scene_01.png -y`
  - Use different hex colors per scene for visual verification of transitions
  - Naming must match `scene_XX.png` format (zero-padded, 1-indexed)

## Test Workflow

### 1. Upload Files (Step 1)
- Upload script via UI or API: `curl -F "file=@script.txt" http://localhost:8000/api/upload/script`
- Upload audio via UI or API: `curl -F "file=@audio.mp3" http://localhost:8000/api/upload/audio`
- Status bar should show green badges for both
- Step 2 should become visible only after both are uploaded

### 2. Generate Prompts (Step 2)
- Click "Generate Prompts" button
- Without OpenAI API key, the system uses fallback prompts (cinematic template)
- Verify: scene count matches sentence grouping, all durations >= 1.0s
- The number of scenes depends on script length and audio duration

### 3. Upload Images (Step 3)
- Upload per-scene via API: `curl -F "file=@scene_01.png" http://localhost:8000/api/upload/image/1`
- Or use "Bulk Upload" button in UI
- **Key assertion**: "Uploaded" badge should NOT appear until image actually loads (onLoad event)
- Click "Validate" to verify all images are present

### 4. Render Video (Step 4)
- Click "Render Video" — shows progress spinner
- FFmpeg combines images with xfade transitions (0.5s fade) and syncs audio
- Rendering may take 15-30 seconds depending on scene count
- Video player appears with playback controls and "Download Video" button

## Key Assertions for Review Fixes

| Fix | What to Check |
|---|---|
| Duration safety | All scene durations >= 1.0s (check prompts.json or API response) |
| FFmpeg path quoting | Video renders without errors (paths use shlex.quote) |
| Image badge detection | No "Uploaded" badge before images are uploaded; badge appears after upload |
| Path traversal | `curl http://localhost:8000/api/images/..%2F..%2Fetc%2Fpasswd` returns 404 |

## Reset
- `curl -X POST http://localhost:8000/api/reset` clears all project state
- Useful between test runs

## Tips
- File uploads via browser file dialog require Playwright scripting (CDP at `http://localhost:29229`)
- For quick iteration, use curl for API uploads then refresh the browser page
- The app uses polling (`/api/status`) to update UI state, so refreshing after API changes works
- Video duration will be shorter than audio if xfade transitions overlap scenes

## Devin Secrets Needed
- `OPENAI_API_KEY` (optional — fallback prompts work without it)
