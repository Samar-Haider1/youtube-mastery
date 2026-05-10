'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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
  const { state, currentStageIndex, currentStage, isFirstStage, isLastStage } = pipeline;

  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Redirect to home if no topic set
  useEffect(() => {
    if (!state.topic) router.push('/');
  }, [state.topic, router]);

  const complete = useCallback(
    async (promptJson: string, apiRoute: string) => {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setCompletion('');

      try {
        const res = await fetch(apiRoute, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: promptJson,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setIsLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setCompletion(accumulated);
        }

        pipeline.setStageOutput(currentStage.key as StageKey, accumulated);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Streaming error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStage.key]
  );

  // Auto-trigger generation when entering a stage with no output
  const triggerGeneration = useCallback(() => {
    const hasOutput = !!state.stages[currentStage.key as StageKey];
    if (!hasOutput && !isLoading) {
      const payload: ApiRoutePayload = {
        topic: state.topic,
        tone: state.tone,
        length: state.length,
        stages: state.stages as Record<StageKey, string>,
        selectedAngle: state.selectedAngle,
        selectedHook: state.selectedHook,
      };
      complete(JSON.stringify(payload), currentStage.apiRoute);
    } else if (hasOutput) {
      setCompletion(state.stages[currentStage.key as StageKey] ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStageIndex]);

  useEffect(() => {
    triggerGeneration();
  }, [triggerGeneration]);

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
      />

      {isLastStage && !isLoading && (
        <ExportButton state={state} />
      )}
    </main>
  );
}
