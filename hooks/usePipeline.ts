'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PipelineState, Tone, VideoLength, StageKey } from '@/lib/types';
import { EMPTY_PIPELINE_STATE, STAGE_CONFIGS } from '@/lib/types';

const SESSION_KEY = 'yt-pipeline-state';
const SESSION_INDEX_KEY = 'yt-pipeline-index';

function loadFromSession(): { state: PipelineState; index: number } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const idx = sessionStorage.getItem(SESSION_INDEX_KEY);
    return {
      state: raw ? JSON.parse(raw) : EMPTY_PIPELINE_STATE,
      index: idx ? parseInt(idx, 10) : 0,
    };
  } catch {
    return { state: EMPTY_PIPELINE_STATE, index: 0 };
  }
}

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(EMPTY_PIPELINE_STATE);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const { state: saved, index } = loadFromSession();
    setState(saved);
    setCurrentStageIndex(index);
  }, []);

  const persist = useCallback((newState: PipelineState, newIndex: number) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newState));
    sessionStorage.setItem(SESSION_INDEX_KEY, String(newIndex));
  }, []);

  const setTopic = useCallback((topic: string) => {
    setState((prev) => { const next = { ...prev, topic }; persist(next, currentStageIndex); return next; });
  }, [currentStageIndex, persist]);

  const setTone = useCallback((tone: Tone) => {
    setState((prev) => { const next = { ...prev, tone }; persist(next, currentStageIndex); return next; });
  }, [currentStageIndex, persist]);

  const setLength = useCallback((length: VideoLength) => {
    setState((prev) => { const next = { ...prev, length }; persist(next, currentStageIndex); return next; });
  }, [currentStageIndex, persist]);

  const setStageOutput = useCallback((key: StageKey, output: string) => {
    setState((prev) => {
      const next = { ...prev, stages: { ...prev.stages, [key]: output } };
      persist(next, currentStageIndex);
      return next;
    });
  }, [currentStageIndex, persist]);

  const setSelectedAngle = useCallback((angle: string) => {
    setState((prev) => { const next = { ...prev, selectedAngle: angle }; persist(next, currentStageIndex); return next; });
  }, [currentStageIndex, persist]);

  const setSelectedHook = useCallback((hook: string) => {
    setState((prev) => { const next = { ...prev, selectedHook: hook }; persist(next, currentStageIndex); return next; });
  }, [currentStageIndex, persist]);

  const nextStage = useCallback(() => {
    const next = Math.min(currentStageIndex + 1, STAGE_CONFIGS.length - 1);
    setCurrentStageIndex(next);
    persist(state, next);
  }, [currentStageIndex, state, persist]);

  const prevStage = useCallback(() => {
    const prev = Math.max(currentStageIndex - 1, 0);
    setCurrentStageIndex(prev);
    persist(state, prev);
  }, [currentStageIndex, state, persist]);

  const reset = useCallback(() => {
    setState(EMPTY_PIPELINE_STATE);
    setCurrentStageIndex(0);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_INDEX_KEY);
  }, []);

  const currentStage = STAGE_CONFIGS[currentStageIndex];
  const isFirstStage = currentStageIndex === 0;
  const isLastStage = currentStageIndex === STAGE_CONFIGS.length - 1;

  return {
    state,
    currentStageIndex,
    currentStage,
    isFirstStage,
    isLastStage,
    setTopic,
    setTone,
    setLength,
    setStageOutput,
    setSelectedAngle,
    setSelectedHook,
    nextStage,
    prevStage,
    reset,
  };
}
