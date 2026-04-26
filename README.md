# AI Video Generator

An AI-powered automated video generation web application that takes a script and voice-over audio to produce a synced video with AI-generated image prompts.

## Features

- **Script Processing** - Upload a text script, automatically split into scenes based on sentence boundaries
- **AI Prompt Generation** - Uses OpenAI API to generate cinematic image prompts for each scene
- **Smart Scene Timing** - Distributes scene durations proportionally based on word count and total audio length
- **Strict Image Mapping** - Enforced `scene_01.png`, `scene_02.png` naming convention with validation
- **Image Upload** - Per-scene and bulk image upload with drag-and-drop support
- **Video Rendering** - FFmpeg-powered video creation with fade transitions, synced to voice-over audio
- **Video Preview** - In-browser video player with download option
- **Progress Tracking** - Step-by-step workflow with status indicators

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind CSS (Vite) |
| Backend | Python (FastAPI) |
| AI | OpenAI API (GPT-4o-mini) |
| Video | FFmpeg |
| Storage | Local filesystem |

## Project Structure

```
/videoediri
  /backend
    main.py              # FastAPI application
    prompt_generator.py  # AI prompt generation logic
    requirements.txt     # Python dependencies
  /frontend
    /src
      /components        # React UI components
      api.js             # API client
      App.jsx            # Main application
    index.html
    vite.config.js
  /assets
    /images              # Scene images (scene_01.png, etc.)
    script.txt           # User script
    voice.mp3            # Voice-over audio
    prompts.json         # Generated prompts
  /output
    final_video.mp4      # Rendered video
```

## Setup

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **FFmpeg** (must be installed and available in PATH)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Environment Variables (Optional)

```bash
# For AI-powered prompt generation (falls back to rule-based if not set)
export OPENAI_API_KEY=your_api_key_here
```

## Running the Application

### Start Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Development)

```bash
cd frontend
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API requests to the backend on port 8000.

## Workflow

1. **Upload** - Upload your script (.txt) and voice-over audio (.mp3/.wav)
2. **Generate Prompts** - Click "Generate Prompts" to create AI-generated image prompts for each scene
3. **Upload Images** - Generate images using the prompts (Midjourney, Stable Diffusion, etc.) and upload them
4. **Render Video** - Click "Render Video" to combine images and audio with fade transitions
5. **Preview & Download** - Watch the result in the browser and download the final video

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get project status |
| POST | `/api/upload/script` | Upload script file |
| POST | `/api/upload/audio` | Upload audio file |
| POST | `/api/generate-prompts` | Generate AI prompts |
| GET | `/api/prompts` | Get generated prompts |
| POST | `/api/upload/image/{scene_id}` | Upload image for specific scene |
| POST | `/api/upload/images` | Bulk upload images |
| GET | `/api/validate-images` | Validate all images exist |
| POST | `/api/render` | Render final video |
| GET | `/api/video` | Download rendered video |
| POST | `/api/reset` | Reset all project data |

## Image Naming Convention

Images **must** follow strict naming:
- `scene_01.png` (or .jpg, .jpeg, .webp)
- `scene_02.png`
- etc.

The system validates that every scene in `prompts.json` has a corresponding image before rendering.

## Notes

- If no OpenAI API key is set, the system falls back to generating descriptive prompts based on the script text
- FFmpeg must be installed for video rendering to work
- Supported audio formats: MP3, WAV, OGG, M4A
- Supported image formats: PNG, JPG, JPEG, WebP
- Video output is 1920x1080 MP4 with H.264 encoding
