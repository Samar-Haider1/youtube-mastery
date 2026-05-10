// hooks/usePipeline.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePipeline } from './usePipeline';

const mockSessionStorage: Record<string, string> = {};
beforeEach(() => {
  Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (k: string) => mockSessionStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockSessionStorage[k] = v; },
      removeItem: (k: string) => { delete mockSessionStorage[k]; },
    },
    writable: true,
  });
});

describe('usePipeline', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => usePipeline());
    expect(result.current.state.topic).toBe('');
    expect(result.current.state.tone).toBe('dramatic');
    expect(result.current.currentStageIndex).toBe(0);
  });

  it('setTopic updates topic', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => result.current.setTopic('Roman Empire'));
    expect(result.current.state.topic).toBe('Roman Empire');
  });

  it('setStageOutput stores output', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => result.current.setStageOutput('research', 'angle content'));
    expect(result.current.state.stages.research).toBe('angle content');
  });

  it('nextStage increments index', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => result.current.nextStage());
    expect(result.current.currentStageIndex).toBe(1);
  });

  it('prevStage decrements index', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => result.current.nextStage());
    act(() => result.current.prevStage());
    expect(result.current.currentStageIndex).toBe(0);
  });

  it('reset clears state', () => {
    const { result } = renderHook(() => usePipeline());
    act(() => result.current.setTopic('Rome'));
    act(() => result.current.reset());
    expect(result.current.state.topic).toBe('');
  });
});
