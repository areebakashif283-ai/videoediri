import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import PromptsSection from './components/PromptsSection';
import ImagesSection from './components/ImagesSection';
import RenderSection from './components/RenderSection';
import StatusBar from './components/StatusBar';
import { fetchStatus } from './api';

export default function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);

      if (data.has_video) setActiveStep(4);
      else if (data.has_prompts && data.images_uploaded > 0) setActiveStep(3);
      else if (data.has_prompts) setActiveStep(3);
      else if (data.has_script && data.has_audio) setActiveStep(2);
      else setActiveStep(1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header onReset={refreshStatus} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <StatusBar status={status} activeStep={activeStep} />

        <div className="grid gap-8">
          <UploadSection
            status={status}
            onUpdate={refreshStatus}
            isActive={activeStep >= 1}
          />

          <PromptsSection
            status={status}
            onUpdate={refreshStatus}
            isActive={activeStep >= 2}
          />

          <ImagesSection
            status={status}
            onUpdate={refreshStatus}
            isActive={activeStep >= 3}
          />

          <RenderSection
            status={status}
            onUpdate={refreshStatus}
            isActive={activeStep >= 3}
          />
        </div>
      </main>
    </div>
  );
}
