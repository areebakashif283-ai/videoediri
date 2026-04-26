import { resetProject } from '../api';

export default function Header({ onReset }) {
  const handleReset = async () => {
    if (!window.confirm('Reset all project data? This cannot be undone.')) return;
    await resetProject();
    onReset();
  };

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Video Generator</h1>
            <p className="text-xs text-gray-400">Script to Video Pipeline</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-800 rounded-lg transition-colors"
        >
          Reset Project
        </button>
      </div>
    </header>
  );
}
