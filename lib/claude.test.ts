// lib/claude.test.ts
import { buildSystemPrompt, buildResearchPrompt, buildHooksPrompt, buildScriptPrompt, buildEditingNotesPrompt, buildThumbnailsPrompt, buildShortsPrompt, buildTitlesPrompt, buildDescriptionPrompt, buildHashtagsPrompt, buildChecklistPrompt } from './claude';
import type { ApiRoutePayload } from './types';

const basePayload: ApiRoutePayload = {
  topic: 'The Fall of Rome',
  tone: 'dramatic',
  length: '10-15min',
  stages: {
    research: 'Angle: The military collapse',
    hooks: 'Hook: It happened overnight...',
    script: 'Script content here',
  },
  selectedAngle: 'The military collapse of Rome',
  selectedHook: 'It happened overnight...',
};

describe('buildSystemPrompt', () => {
  it('includes tone and length', () => {
    const prompt = buildSystemPrompt('dramatic', '10-15min');
    expect(prompt).toContain('dramatic');
    expect(prompt).toContain('10-15min');
    expect(prompt).toContain('faceless');
  });
});

describe('buildResearchPrompt', () => {
  it('includes topic and search results', () => {
    const prompt = buildResearchPrompt('The Fall of Rome', 'search result 1\nsearch result 2');
    expect(prompt).toContain('The Fall of Rome');
    expect(prompt).toContain('search result 1');
    expect(prompt).toContain('5 angles');
  });
});

describe('buildScriptPrompt', () => {
  it('includes selected angle and hook and word count', () => {
    const prompt = buildScriptPrompt(basePayload, 1500);
    expect(prompt).toContain('The military collapse of Rome');
    expect(prompt).toContain('It happened overnight');
    expect(prompt).toContain('1500');
  });
});

describe('buildChecklistPrompt', () => {
  it('includes all stage outputs', () => {
    const prompt = buildChecklistPrompt(basePayload);
    expect(prompt).toContain('The Fall of Rome');
    expect(prompt).toContain('checklist');
  });
});
