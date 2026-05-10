'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePipeline } from '@/hooks/usePipeline';
import { StageNav } from '@/components/StageNav';
import { PipelineStage } from '@/components/PipelineStage';
import { ExportButton } from '@/components/ExportButton';
import { STAGE_CONFIGS } from '@/lib/types';
import type { ApiRoutePayload, StageKey } from '@/lib/types';

export default function PipelinePage() {
  const router = useRouter();
  const pipeline = usePipeline();
  const { state, hydrated, currentStageIndex, currentStage, isFirstStage, isLastStage } = pipeline;

  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Only redirect after sessionStorage has hydrated — avoids race condition
  useEffect(() => {
    if (hydrated && !state.topic) router.push('/');
  }, [hydrated, state.topic, router]);

  const complete = useCallback(
    async (promptJson: string, apiRoute: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setCompletion('');
      setError(null);

      try {
        const res = await fetch(apiRoute, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: promptJson,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setError('Generation failed. Click Retry to try again.');
          setIsLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setCompletion(accumulated);
        }
        accumulated += decoder.decode(); // flush remaining bytes

        const trimmed = accumulated.trim();
        setCompletion(trimmed);
        pipeline.setStageOutput(currentStage.key as StageKey, trimmed);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Streaming error:', err);
          setError('Connection error. Click Retry to try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStage.key]
  );

  const buildPayload = useCallback((): ApiRoutePayload => ({
    topic: state.topic,
    tone: state.tone,
    length: state.length,
    stages: state.stages as Record<StageKey, string>,
    selectedAngle: state.selectedAngle,
    selectedHook: state.selectedHook,
  }), [state]);

  const handleRetry = useCallback(() => {
    setError(null);
    complete(JSON.stringify(buildPayload()), currentStage.apiRoute);
  }, [buildPayload, complete, currentStage.apiRoute]);

  // Auto-trigger generation when entering a stage with no output.
  useEffect(() => {
    setCompletion(''); // clear stale content immediately on stage change
    if (!hydrated || !state.topic) return;
    const key = currentStage.key as StageKey;
    const hasOutput = !!state.stages[key];
    if (hasOutput) {
      setCompletion(state.stages[key] ?? '');
      return;
    }
    if (isLoading) return;
    complete(JSON.stringify(buildPayload()), currentStage.apiRoute);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStageIndex, hydrated]);

  const displayContent = state.stages[currentStage.key as StageKey] ?? completion;

  const handleEdit = (value: string) => {
    pipeline.setStageOutput(currentStage.key as StageKey, value);
    setCompletion(value);
  };

  const completedIndices = STAGE_CONFIGS
    .map((s, i) => (state.stages[s.key as StageKey] ? i : -1))
    .filter((i) => i !== -1);

  const stageType =
    currentStage.key === 'research'
      ? 'angle-select'
      : currentStage.key === 'hooks'
      ? 'hook-select'
      : 'text';

  if (!hydrated) return <div className="min-h-screen bg-gray-950" />;
  if (!state.topic) return null;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          New topic
        </button>
        <h1 className="text-lg font-bold text-white truncate max-w-xs">{state.topic}</h1>
        <button
          onClick={pipeline.reset}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      </div>

      <StageNav currentIndex={currentStageIndex} completedIndices={completedIndices} />

      <PipelineStage
        title={currentStage.label}
        description={currentStage.description}
        isStreaming={isLoading}
        streamedContent={completion}
        editedContent={displayContent}
        onEdit={handleEdit}
        onNext={pipeline.nextStage}
        onBack={pipeline.prevStage}
        isFirstStage={isFirstStage}
        isLastStage={isLastStage}
        stageType={stageType}
        selectedAngle={state.selectedAngle}
        selectedHook={state.selectedHook}
        onSelectAngle={pipeline.setSelectedAngle}
        onSelectHook={pipeline.setSelectedHook}
        error={error}
        onRetry={handleRetry}
      />

      {isLastStage && !isLoading && (
        <ExportButton state={state} />
      )}
    </main>
  );
}
