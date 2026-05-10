// lib/types.test.ts
import type { PipelineState, Tone, VideoLength, StageKey } from './types';

describe('types', () => {
  it('PipelineState has correct shape', () => {
    const state: PipelineState = {
      topic: 'Roman Empire',
      tone: 'dramatic',
      length: '10-15min',
      stages: { research: 'angle text', hooks: 'hook text' },
      selectedAngle: 'angle 1',
      selectedHook: 'hook 1',
    };
    expect(state.topic).toBe('Roman Empire');
    expect(state.tone).toBe('dramatic');
  });
});
