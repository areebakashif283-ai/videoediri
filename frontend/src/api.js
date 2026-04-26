const API_BASE = '/api';

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function uploadScript(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload/script`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload script');
  return res.json();
}

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload/audio`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload audio');
  return res.json();
}

export async function generatePrompts() {
  const res = await fetch(`${API_BASE}/generate-prompts`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate prompts');
  }
  return res.json();
}

export async function getPrompts() {
  const res = await fetch(`${API_BASE}/prompts`);
  if (!res.ok) throw new Error('Failed to fetch prompts');
  return res.json();
}

export async function uploadImage(sceneId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload/image/${sceneId}`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

export async function uploadImages(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await fetch(`${API_BASE}/upload/images`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload images');
  return res.json();
}

export async function validateImages() {
  const res = await fetch(`${API_BASE}/validate-images`);
  if (!res.ok) throw new Error('Failed to validate images');
  return res.json();
}

export async function renderVideo() {
  const res = await fetch(`${API_BASE}/render`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to render video');
  }
  return res.json();
}

export async function resetProject() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset project');
  return res.json();
}

export function getVideoUrl() {
  return `${API_BASE}/video`;
}

export function getImageUrl(filename) {
  return `${API_BASE}/images/${filename}`;
}
