import { useState, useEffect } from 'react';
import { generatePrompts, getPrompts } from '../api';

export default function PromptsSection({ status, onUpdate, isActive }) {
  const [prompts, setPrompts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status?.has_prompts) {
      getPrompts().then((data) => setPrompts(data.prompts || []));
    }
  }, [status?.has_prompts]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generatePrompts();
      setPrompts(data.prompts || []);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!isActive) return null;

  return (
    <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Step 2: Generate Prompts</h2>
          <p className="text-sm text-gray-400">AI generates cinematic image prompts for each scene</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !status?.has_script || !status?.has_audio}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Prompts
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {prompts.length > 0 && (
        <div className="space-y-3">
          {prompts.map((p) => (
            <div
              key={p.scene_id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-mono rounded">
                      Scene {p.scene_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.duration}s
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {p.image}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{p.text}</p>
                  <p className="text-xs text-gray-500 italic">{p.prompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
