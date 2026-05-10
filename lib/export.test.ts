// lib/export.test.ts
import { buildZipFilename, buildFileContents } from './export';
import type { PipelineState } from './types';

const mockState: PipelineState = {
  topic: 'The Fall of Rome',
  tone: 'dramatic',
  length: '10-15min',
  stages: {
    research: 'Angle 1 content',
    hooks: 'Hook 1 content',
    script: 'Script content',
    editingNotes: 'Editing notes',
    thumbnails: 'Thumbnail prompts',
    shorts: 'Shorts ideas',
    titles: 'SEO titles',
    description: 'Description content',
    hashtags: '#history #rome',
    checklist: '[ ] Upload video',
  },
  selectedAngle: 'Angle 1',
  selectedHook: 'Hook 1',
};

describe('buildZipFilename', () => {
  it('slugifies topic and includes date', () => {
    const filename = buildZipFilename('The Fall of Rome', '2026-05-10');
    expect(filename).toBe('the-fall-of-rome-2026-05-10.zip');
  });

  it('handles special characters', () => {
    const filename = buildZipFilename('Rome: Empire & Fall!', '2026-05-10');
    expect(filename).toBe('rome-empire-fall-2026-05-10.zip');
  });
});

describe('buildFileContents', () => {
  it('returns entry for each stage with content', () => {
    const files = buildFileContents(mockState);
    expect(files).toHaveLength(10);
    expect(files[0].filename).toBe('01-research-angles.md');
    expect(files[0].content).toContain('Angle 1 content');
  });

  it('skips stages with no content', () => {
    const state = { ...mockState, stages: { research: 'content' } };
    const files = buildFileContents(state);
    expect(files).toHaveLength(1);
  });
});
