import { useState, useEffect, useRef } from 'react';
import { getPrompts, uploadImage, uploadImages, validateImages, getImageUrl } from '../api';

export default function ImagesSection({ status, onUpdate, isActive }) {
  const [prompts, setPrompts] = useState([]);
  const [validation, setValidation] = useState(null);
  const [uploading, setUploading] = useState(null);
  const bulkInputRef = useRef(null);

  useEffect(() => {
    if (status?.has_prompts) {
      getPrompts().then((data) => setPrompts(data.prompts || []));
    }
  }, [status?.has_prompts, status?.images_uploaded]);

  const handleValidate = async () => {
    const data = await validateImages();
    setValidation(data);
  };

  const handleSingleUpload = async (sceneId, file) => {
    setUploading(sceneId);
    try {
      await uploadImage(sceneId, file);
      onUpdate();
      const data = await getPrompts();
      setPrompts(data.prompts || []);
    } finally {
      setUploading(null);
    }
  };

  const handleBulkUpload = async (files) => {
    setUploading('bulk');
    try {
      await uploadImages(Array.from(files));
      onUpdate();
      const data = await getPrompts();
      setPrompts(data.prompts || []);
    } finally {
      setUploading(null);
    }
  };

  if (!isActive || !status?.has_prompts) return null;

  return (
    <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Step 3: Upload Images</h2>
          <p className="text-sm text-gray-400">
            Upload images for each scene ({status.images_uploaded}/{status.images_required} uploaded)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => bulkInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Bulk Upload
          </button>
          <input
            ref={bulkInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBulkUpload(e.target.files)}
          />
          <button
            onClick={handleValidate}
            className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Validate
          </button>
        </div>
      </div>

      {validation && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            validation.valid
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
          }`}
        >
          {validation.valid
            ? `All ${validation.total_scenes} images validated successfully!`
            : `Missing ${validation.missing.length} images: ${validation.missing.join(', ')}`}
        </div>
      )}

      {uploading === 'bulk' && (
        <div className="mb-4 flex items-center gap-2 text-sm text-purple-400">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500" />
          Uploading images...
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((p) => (
          <SceneImageCard
            key={p.scene_id}
            scene={p}
            uploading={uploading === p.scene_id}
            onUpload={(file) => handleSingleUpload(p.scene_id, file)}
          />
        ))}
      </div>
    </section>
  );
}

function SceneImageCard({ scene, uploading, onUpload }) {
  const inputRef = useRef(null);
  const hasImage = scene.image && !scene.image.includes('scene_00');

  // Try to load the image
  const imageUrl = hasImage ? getImageUrl(scene.image) : null;

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div
        className="aspect-video bg-gray-800 flex items-center justify-center cursor-pointer relative group"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`Scene ${scene.scene_id}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-sm text-white">Replace</span>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">Click to upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files[0])}
        />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-mono rounded">
            Scene {scene.scene_id}
          </span>
          <span className="text-xs text-gray-500">{scene.duration}s</span>
          {imageUrl && (
            <span className="ml-auto text-xs text-green-400">Uploaded</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate" title={scene.prompt}>
          {scene.prompt}
        </p>
      </div>
    </div>
  );
}
