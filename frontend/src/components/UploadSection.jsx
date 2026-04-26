import { useState, useRef } from 'react';
import { uploadScript, uploadAudio } from '../api';

function FileUploadBox({ label, accept, icon, onUpload, uploaded, info }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        dragging
          ? 'border-purple-500 bg-purple-500/10'
          : uploaded
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto" />
      ) : (
        <div className="text-4xl mb-3">{icon}</div>
      )}

      <p className="text-sm font-medium text-gray-300">{label}</p>
      <p className="text-xs text-gray-500 mt-1">
        {uploaded ? 'Click to replace' : 'Drag & drop or click to browse'}
      </p>
      {info && <p className="text-xs text-green-400 mt-2">{info}</p>}
    </div>
  );
}

export default function UploadSection({ status, onUpdate, isActive }) {
  if (!isActive) return null;

  return (
    <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-1">Step 1: Upload Files</h2>
      <p className="text-sm text-gray-400 mb-6">Upload your script and voice-over audio file</p>

      <div className="grid md:grid-cols-2 gap-6">
        <FileUploadBox
          label="Upload Script (.txt)"
          accept=".txt,.text"
          icon="📝"
          uploaded={status?.has_script}
          info={status?.has_script ? 'Script uploaded' : null}
          onUpload={async (file) => {
            await uploadScript(file);
            onUpdate();
          }}
        />
        <FileUploadBox
          label="Upload Voice-Over (.mp3, .wav)"
          accept=".mp3,.wav,.ogg,.m4a"
          icon="🎙️"
          uploaded={status?.has_audio}
          info={
            status?.has_audio
              ? `Audio uploaded${status.audio_duration ? ` (${Math.round(status.audio_duration)}s)` : ''}`
              : null
          }
          onUpload={async (file) => {
            await uploadAudio(file);
            onUpdate();
          }}
        />
      </div>
    </section>
  );
}
