const steps = [
  { id: 1, label: 'Upload', desc: 'Script & Audio' },
  { id: 2, label: 'Generate', desc: 'AI Prompts' },
  { id: 3, label: 'Images', desc: 'Upload & Map' },
  { id: 4, label: 'Render', desc: 'Final Video' },
];

export default function StatusBar({ status, activeStep }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isComplete = activeStep > step.id;
          const isCurrent = activeStep === step.id;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isComplete
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                      : isCurrent
                        ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500'
                        : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 rounded ${
                    isComplete ? 'bg-green-500/50' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {status && (
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-400">
          {status.has_script && <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">Script uploaded</span>}
          {status.has_audio && (
            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">
              Audio: {status.audio_duration ? `${Math.round(status.audio_duration)}s` : 'uploaded'}
            </span>
          )}
          {status.has_prompts && (
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
              {status.prompt_count} prompts generated
            </span>
          )}
          {status.images_uploaded > 0 && (
            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
              {status.images_uploaded}/{status.images_required} images
            </span>
          )}
          {status.has_video && <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">Video ready</span>}
        </div>
      )}
    </div>
  );
}
