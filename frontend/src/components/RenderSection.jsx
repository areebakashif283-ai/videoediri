import { useState } from 'react';
import { renderVideo, getVideoUrl } from '../api';

export default function RenderSection({ status, onUpdate, isActive }) {
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleRender = async () => {
    setRendering(true);
    setError(null);
    setProgress('Preparing video...');
    try {
      setProgress('Rendering with FFmpeg...');
      await renderVideo();
      setProgress('Complete!');
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setRendering(false);
    }
  };

  if (!isActive) return null;

  const canRender = status?.has_prompts && status?.has_audio && status?.images_uploaded > 0;

  return (
    <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Step 4: Render Video</h2>
          <p className="text-sm text-gray-400">Combine images and audio into the final video</p>
        </div>
        <button
          onClick={handleRender}
          disabled={rendering || !canRender}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {rendering ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Rendering...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Render Video
            </>
          )}
        </button>
      </div>

      {rendering && progress && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500" />
            <span className="text-sm text-green-400">{progress}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {status?.has_video && (
        <div className="mt-4">
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <video
              controls
              className="w-full"
              src={getVideoUrl()}
              key={Date.now()}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="mt-3 flex justify-end">
            <a
              href={getVideoUrl()}
              download="final_video.mp4"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Video
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
