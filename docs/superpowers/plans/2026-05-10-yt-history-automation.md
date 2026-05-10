# YouTube History Channel Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that walks users through a 10-stage AI pipeline to generate all content needed for a faceless YouTube history channel video.

**Architecture:** Next.js 14 App Router with API route handlers streaming Claude responses via Vercel AI SDK. Client holds all state in React + sessionStorage. DuckDuckGo search feeds topic research. Final export bundles all outputs into a downloadable zip.

**Tech Stack:** Next.js 14, TypeScript, `ai` + `@ai-sdk/anthropic` (Vercel AI SDK v4), `duck-duck-scrape`, `jszip`, `file-saver`, Jest + React Testing Library.

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/types.ts` | Shared TypeScript types (PipelineState, Stage, Tone, Length) |
| `lib/claude.ts` | Anthropic client + system prompt builder + per-stage user prompt builders |
| `lib/search.ts` | DuckDuckGo search wrapper (3 parallel queries, returns merged results) |
| `lib/export.ts` | JSZip bundle builder — takes PipelineState, returns Blob |
| `hooks/usePipeline.ts` | React hook managing PipelineState + sessionStorage persistence |
| `app/api/research/route.ts` | Stage 1: search + Claude angle analysis (streaming) |
| `app/api/hooks/route.ts` | Stage 2: hook generation (streaming) |
| `app/api/script/route.ts` | Stage 3: full script (streaming) |
| `app/api/editing-notes/route.ts` | Stage 4: retention/editing notes (streaming) |
| `app/api/thumbnails/route.ts` | Stage 5: thumbnail prompts (streaming) |
| `app/api/shorts/route.ts` | Stage 6: shorts ideas (streaming) |
| `app/api/titles/route.ts` | Stage 7: SEO titles (streaming) |
| `app/api/description/route.ts` | Stage 8: video description (streaming) |
| `app/api/hashtags/route.ts` | Stage 9: hashtags (streaming) |
| `app/api/checklist/route.ts` | Stage 10: upload checklist (streaming) |
| `components/StageNav.tsx` | Progress dots for 10 stages |
| `components/PipelineStage.tsx` | Reusable stage card: stream display + textarea + nav buttons |
| `components/AngleSelector.tsx` | Stage 1: parse + display 5 selectable angle cards |
| `components/HookSelector.tsx` | Stage 2: parse + display 3 selectable hook cards |
| `components/ExportButton.tsx` | Triggers JSZip download |
| `app/page.tsx` | Landing page: topic input + tone/length selectors |
| `app/pipeline/page.tsx` | Pipeline orchestration: renders correct component per stage |
| `app/globals.css` | Tailwind base styles |
| `app/layout.tsx` | Root layout with metadata |
| `.env.local` | ANTHROPIC_API_KEY |
| `jest.config.ts` | Jest config for Next.js |
| `jest.setup.ts` | Testing Library setup |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via CLI)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "d:/Claude/YT/Video Gen"
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

When prompted: accept all defaults.

- [ ] **Step 2: Install dependencies**

```bash
npm install ai @ai-sdk/anthropic duck-duck-scrape jszip file-saver
npm install --save-dev @types/file-saver @types/jszip jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
```

- [ ] **Step 4: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create .env.local**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 6: Verify scaffold**

```bash
npm run dev
```

Expected: Next.js dev server starts at http://localhost:3000 with no errors.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js app with deps"
```

---

## Task 2: Types

**Files:**
- Create: `lib/types.ts`
- Create: `lib/types.test.ts`

- [ ] **Step 1: Write test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/types.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create lib/types.ts**

```typescript
export type Tone = 'dramatic' | 'educational' | 'thriller' | 'documentary';
export type VideoLength = '5-8min' | '10-15min' | '20min+';

export const STAGE_KEYS = [
  'research',
  'hooks',
  'script',
  'editingNotes',
  'thumbnails',
  'shorts',
  'titles',
  'description',
  'hashtags',
  'checklist',
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export interface StageConfig {
  key: StageKey;
  label: string;
  description: string;
  apiRoute: string;
  selectable: boolean; // true for research (angle picker) and hooks (hook picker)
}

export const STAGE_CONFIGS: StageConfig[] = [
  { key: 'research',     label: 'Topic Research',      description: 'Finding the best angles for your topic',        apiRoute: '/api/research',      selectable: true },
  { key: 'hooks',        label: 'Hook Generation',      description: 'Crafting attention-grabbing cold opens',        apiRoute: '/api/hooks',         selectable: true },
  { key: 'script',       label: 'Script',               description: 'Full narration script',                         apiRoute: '/api/script',        selectable: false },
  { key: 'editingNotes', label: 'Editing Notes',        description: 'B-roll cues and retention techniques',          apiRoute: '/api/editing-notes', selectable: false },
  { key: 'thumbnails',   label: 'Thumbnail Prompts',    description: 'Midjourney-ready image prompts',                apiRoute: '/api/thumbnails',    selectable: false },
  { key: 'shorts',       label: 'Shorts Ideas',         description: '5 clip ideas with timestamps',                  apiRoute: '/api/shorts',        selectable: false },
  { key: 'titles',       label: 'SEO Titles',           description: '5 title variants with keyword rationale',       apiRoute: '/api/titles',        selectable: false },
  { key: 'description',  label: 'Description',          description: 'Full video description with timestamps',        apiRoute: '/api/description',   selectable: false },
  { key: 'hashtags',     label: 'Hashtags',             description: '30 hashtags across broad/niche/trending',       apiRoute: '/api/hashtags',      selectable: false },
  { key: 'checklist',    label: 'Upload Checklist',     description: 'Pre-populated upload checklist',                apiRoute: '/api/checklist',     selectable: false },
];

export const WORD_COUNT_TARGETS: Record<VideoLength, number> = {
  '5-8min': 800,
  '10-15min': 1500,
  '20min+': 3500,
};

export interface PipelineState {
  topic: string;
  tone: Tone;
  length: VideoLength;
  stages: Partial<Record<StageKey, string>>;
  selectedAngle: string;
  selectedHook: string;
}

export const EMPTY_PIPELINE_STATE: PipelineState = {
  topic: '',
  tone: 'dramatic',
  length: '10-15min',
  stages: {},
  selectedAngle: '',
  selectedHook: '',
};

export interface ApiRoutePayload {
  topic: string;
  tone: Tone;
  length: VideoLength;
  stages: Partial<Record<StageKey, string>>;
  selectedAngle: string;
  selectedHook: string;
}
```

- [ ] **Step 4: Run test**

```bash
npx jest lib/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/types.test.ts
git commit -m "feat: add shared pipeline types"
```

---

## Task 3: Claude Library

**Files:**
- Create: `lib/claude.ts`
- Create: `lib/claude.test.ts`

- [ ] **Step 1: Write tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest lib/claude.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create lib/claude.ts**

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Tone, VideoLength, ApiRoutePayload } from './types';
import { WORD_COUNT_TARGETS } from './types';

export function createAnthropicClient() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export const MODEL = 'claude-sonnet-4-6';

export function buildSystemPrompt(tone: Tone, length: VideoLength): string {
  return `You are a viral history YouTube content creator writing for a faceless channel.
Channel tone: ${tone}. Target video length: ${length}.
Never use personal anecdotes or reference the creator. Write for voiceover narration only.
Be specific with historical details, dates, names, and events.`;
}

function formatPriorStages(stages: Partial<Record<string, string>>): string {
  const entries = Object.entries(stages).filter(([, v]) => v);
  if (entries.length === 0) return '';
  return '\n\n--- PRIOR PIPELINE OUTPUTS (for context and coherence) ---\n' +
    entries.map(([k, v]) => `[${k.toUpperCase()}]\n${v}`).join('\n\n');
}

export function buildResearchPrompt(topic: string, searchResults: string): string {
  return `Topic: "${topic}"

Search results from the web:
${searchResults}

Generate exactly 5 ranked content angles for a YouTube history video about this topic.
For each angle output:
ANGLE [N]: [Title]
HOOK POTENTIAL: [1-10]/10
KEY FACTS: [3-5 bullet points of specific facts to cover]
EMOTIONAL ANGLE: [mystery|drama|tragedy|triumph]
WHY IT WORKS: [1 sentence]

---
Rank by viral potential. Be specific — use real names, dates, and events.`;
}

export function buildHooksPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
Selected angle: ${payload.selectedAngle}
${formatPriorStages({ research: payload.stages.research })}

Write exactly 3 hook variants for the first 30 seconds of this video.
Each hook must immediately create curiosity or tension.

HOOK 1:
[30-second cold open script — 80-120 words — present tense, dramatic]

HOOK 2:
[30-second cold open script — 80-120 words — question-based open loop]

HOOK 3:
[30-second cold open script — 80-120 words — shocking statistic or quote]`;
}

export function buildScriptPrompt(payload: ApiRoutePayload, wordCount: number): string {
  return `Topic: "${payload.topic}"
Selected angle: ${payload.selectedAngle}
Selected hook: ${payload.selectedHook}
Target word count: approximately ${wordCount} words
${formatPriorStages({ research: payload.stages.research, hooks: payload.stages.hooks })}

Write the full narration script for this history video.
Start AFTER the hook (do not repeat it). Structure:
- INTRO: context setting (100 words)
- SECTION 1-N: chronological or thematic sections with clear headers
- CLIMAX: the most dramatic moment
- CONCLUSION + CTA: wrap up + subscribe prompt

Use present tense for dramatic effect. Include scene transition cues in [brackets].
Target exactly ${wordCount} words.`;
}

export function buildEditingNotesPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
${formatPriorStages({ script: payload.stages.script })}

Based on the script above, create detailed retention editing notes.
For each script section, provide:

SECTION: [section name/timestamp estimate]
B-ROLL: [specific visual suggestions — be concrete, e.g. "aerial footage of the Colosseum at sunset"]
PATTERN INTERRUPT: [zoom cut / text overlay / sound effect / music change]
PACING NOTE: [fast cut / slow build / pause for effect]
RETENTION RISK: [where viewers might drop off and why]
FIX: [specific edit to prevent drop-off]`;
}

export function buildThumbnailsPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
Angle: ${payload.selectedAngle}
${formatPriorStages({ script: payload.stages.script })}

Generate 3 Midjourney-ready thumbnail image prompts for this video.
Each prompt must be highly visual, emotionally charged, and clickable.

THUMBNAIL 1 (Dramatic Scene):
Prompt: [full Midjourney prompt with style, lighting, composition, aspect ratio 16:9]
Text overlay suggestion: [bold 3-5 word text for the thumbnail]

THUMBNAIL 2 (Portrait/Character Focus):
Prompt: [full Midjourney prompt]
Text overlay suggestion: [bold 3-5 word text]

THUMBNAIL 3 (Map/Symbol/Object):
Prompt: [full Midjourney prompt]
Text overlay suggestion: [bold 3-5 word text]`;
}

export function buildShortsPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
${formatPriorStages({ script: payload.stages.script })}

Identify 5 moments from the script that would make great YouTube Shorts (60 seconds max).

CLIP 1:
TIMESTAMP ESTIMATE: [e.g. "3:20-4:15 in main video"]
TITLE: [Shorts title — under 60 chars]
HOOK LINE: [first sentence of the short]
SUMMARY: [what happens in this clip]
CAPTION: [suggested Shorts caption with emojis]

[Repeat for clips 2-5]`;
}

export function buildTitlesPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
Angle: ${payload.selectedAngle}
${formatPriorStages({ research: payload.stages.research, script: payload.stages.script })}

Generate 5 SEO-optimized YouTube title variants. Each must:
- Be under 60 characters
- Include a high-search-volume keyword
- Create curiosity or emotional pull

TITLE 1: [title]
KEYWORD: [target keyword]
RATIONALE: [why this works]

[Repeat for titles 2-5]`;
}

export function buildDescriptionPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
${formatPriorStages({
  script: payload.stages.script,
  titles: payload.stages.titles,
  hooks: payload.stages.hooks,
})}

Write a full YouTube video description. Include:
1. Hook paragraph (2-3 sentences pulling from the hook)
2. What the video covers (3-5 bullet points)
3. Timestamp outline (use estimated times based on script sections)
4. CTA: "Subscribe for more history videos every week"
5. Footer: [SOCIAL LINKS PLACEHOLDER] | [CHANNEL LINK PLACEHOLDER]

Use the most compelling title variant from the titles output as context.
Total length: 200-300 words.`;
}

export function buildHashtagsPrompt(payload: ApiRoutePayload): string {
  return `Topic: "${payload.topic}"
${formatPriorStages({
  description: payload.stages.description,
})}

Generate exactly 30 YouTube hashtags for this video.
Format as: #hashtag

Group them:
BROAD (10): high-volume general history hashtags
NICHE (10): specific to this topic/era/region
TRENDING (10): currently popular formats (#shorts adjacent, documentary style)`;
}

export function buildChecklistPrompt(payload: ApiRoutePayload): string {
  const stagesSummary = Object.entries(payload.stages)
    .filter(([, v]) => v)
    .map(([k]) => `✓ ${k} generated`)
    .join('\n');

  return `Topic: "${payload.topic}"
Completed pipeline stages:
${stagesSummary}

Generate a pre-upload checklist for this YouTube video. Use the actual outputs from the pipeline.
For each checklist item, include the specific value from the pipeline (not a placeholder).

Format each item as:
[ ] ITEM: [action]
    VALUE: [the actual content — e.g. the chosen title, first 5 hashtags, etc.]

Include items for:
- Title (list top 2 title options from titles output)
- Description (confirm length and CTA included)
- Thumbnail (list all 3 prompt options)
- Tags/Hashtags (first 10 hashtags)
- End screen set up
- Cards added
- Shorts uploaded
- Community post scheduled
- Premiere scheduled or published immediately`;
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest lib/claude.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/claude.ts lib/claude.test.ts
git commit -m "feat: add Claude prompt builders for all 10 stages"
```

---

## Task 4: Search Library

**Files:**
- Create: `lib/search.ts`
- Create: `lib/search.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// lib/search.test.ts
import { formatSearchResults } from './search';

describe('formatSearchResults', () => {
  it('formats results into readable string', () => {
    const results = [
      { title: 'Fall of Rome', description: 'How Rome fell', url: 'https://example.com' },
      { title: 'Roman History', description: 'Roman facts', url: 'https://example2.com' },
    ];
    const formatted = formatSearchResults(results);
    expect(formatted).toContain('Fall of Rome');
    expect(formatted).toContain('How Rome fell');
    expect(formatted).toContain('Roman History');
  });

  it('handles empty results', () => {
    expect(formatSearchResults([])).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/search.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create lib/search.ts**

```typescript
interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '';
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`)
    .join('\n\n');
}

export async function searchTopic(topic: string): Promise<string> {
  const queries = [
    `${topic} history youtube viral`,
    `${topic} history documentary interesting facts`,
    `${topic} history controversies mysteries`,
  ];

  try {
    // Dynamic import required — duck-duck-scrape is CJS
    const { search, SafeSearchType } = await import('duck-duck-scrape');

    const resultsArrays = await Promise.allSettled(
      queries.map((q) =>
        search(q, { safeSearch: SafeSearchType.OFF })
          .then((r: { results: SearchResult[] }) => r.results.slice(0, 10))
          .catch(() => [] as SearchResult[])
      )
    );

    const merged: SearchResult[] = resultsArrays
      .filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .slice(0, 25);

    return formatSearchResults(merged);
  } catch {
    // Graceful degradation: if search fails, return empty so Claude uses own knowledge
    return '';
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest lib/search.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/search.ts lib/search.test.ts
git commit -m "feat: add DuckDuckGo search wrapper"
```

---

## Task 5: Export Library

**Files:**
- Create: `lib/export.ts`
- Create: `lib/export.test.ts`

- [ ] **Step 1: Write tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest lib/export.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create lib/export.ts**

```typescript
import type { PipelineState, StageKey } from './types';

const STAGE_FILES: Record<StageKey, string> = {
  research:     '01-research-angles.md',
  hooks:        '02-hooks.md',
  script:       '03-script.md',
  editingNotes: '04-editing-notes.md',
  thumbnails:   '05-thumbnail-prompts.md',
  shorts:       '06-shorts-ideas.md',
  titles:       '07-seo-titles.md',
  description:  '08-description.md',
  hashtags:     '09-hashtags.md',
  checklist:    '10-upload-checklist.md',
};

export function buildZipFilename(topic: string, date: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${slug}-${date}.zip`;
}

export function buildFileContents(state: PipelineState): { filename: string; content: string }[] {
  return (Object.entries(STAGE_FILES) as [StageKey, string][])
    .filter(([key]) => state.stages[key])
    .map(([key, filename]) => ({
      filename,
      content: state.stages[key]!,
    }));
}

export async function downloadZip(state: PipelineState): Promise<void> {
  const [{ default: JSZip }, { saveAs }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
  ]);

  const zip = new JSZip();
  const files = buildFileContents(state);
  files.forEach(({ filename, content }) => zip.file(filename, content));

  const blob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, buildZipFilename(state.topic, date));
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest lib/export.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/export.ts lib/export.test.ts
git commit -m "feat: add JSZip export library"
```

---

## Task 6: usePipeline Hook

**Files:**
- Create: `hooks/usePipeline.ts`
- Create: `hooks/usePipeline.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// hooks/usePipeline.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePipeline } from './usePipeline';

const mockSessionStorage: Record<string, string> = {};
beforeEach(() => {
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest hooks/usePipeline.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create hooks/usePipeline.ts**

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx jest hooks/usePipeline.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add hooks/usePipeline.ts hooks/usePipeline.test.ts
git commit -m "feat: add usePipeline hook with sessionStorage persistence"
```

---

## Task 7: API Routes — Research + Hooks (Stages 1–2)

**Files:**
- Create: `app/api/research/route.ts`
- Create: `app/api/hooks/route.ts`

- [ ] **Step 1: Create app/api/research/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildResearchPrompt } from '@/lib/claude';
import { searchTopic } from '@/lib/search';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const { topic, tone, length } = payload;

  const searchResults = await searchTopic(topic);

  const anthropic = createAnthropicClient();
  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(tone, length),
    prompt: buildResearchPrompt(topic, searchResults),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Create app/api/hooks/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildHooksPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildHooksPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 3: Verify routes respond**

Start dev server: `npm run dev`

```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"topic":"Roman Empire","tone":"dramatic","length":"10-15min","stages":{},"selectedAngle":"","selectedHook":""}'
```

Expected: streaming text response with 5 angles.

- [ ] **Step 4: Commit**

```bash
git add app/api/research/route.ts app/api/hooks/route.ts
git commit -m "feat: add research and hooks API routes"
```

---

## Task 8: API Routes — Script + Editing Notes (Stages 3–4)

**Files:**
- Create: `app/api/script/route.ts`
- Create: `app/api/editing-notes/route.ts`

- [ ] **Step 1: Create app/api/script/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildScriptPrompt } from '@/lib/claude';
import { WORD_COUNT_TARGETS } from '@/lib/types';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const wordCount = WORD_COUNT_TARGETS[payload.length];
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildScriptPrompt(payload, wordCount),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Create app/api/editing-notes/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildEditingNotesPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildEditingNotesPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/script/route.ts app/api/editing-notes/route.ts
git commit -m "feat: add script and editing-notes API routes"
```

---

## Task 9: API Routes — Thumbnails, Shorts, Titles (Stages 5–7)

**Files:**
- Create: `app/api/thumbnails/route.ts`
- Create: `app/api/shorts/route.ts`
- Create: `app/api/titles/route.ts`

- [ ] **Step 1: Create app/api/thumbnails/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildThumbnailsPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildThumbnailsPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Create app/api/shorts/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildShortsPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildShortsPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 3: Create app/api/titles/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildTitlesPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildTitlesPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/thumbnails/route.ts app/api/shorts/route.ts app/api/titles/route.ts
git commit -m "feat: add thumbnails, shorts, titles API routes"
```

---

## Task 10: API Routes — Description, Hashtags, Checklist (Stages 8–10)

**Files:**
- Create: `app/api/description/route.ts`
- Create: `app/api/hashtags/route.ts`
- Create: `app/api/checklist/route.ts`

- [ ] **Step 1: Create app/api/description/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildDescriptionPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildDescriptionPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: Create app/api/hashtags/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildHashtagsPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildHashtagsPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 3: Create app/api/checklist/route.ts**

```typescript
import { streamText } from 'ai';
import { createAnthropicClient, MODEL, buildSystemPrompt, buildChecklistPrompt } from '@/lib/claude';
import type { ApiRoutePayload } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: Request) {
  const payload: ApiRoutePayload = await req.json();
  const anthropic = createAnthropicClient();

  const result = await streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt(payload.tone, payload.length),
    prompt: buildChecklistPrompt(payload),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/description/route.ts app/api/hashtags/route.ts app/api/checklist/route.ts
git commit -m "feat: add description, hashtags, checklist API routes"
```

---

## Task 11: StageNav Component

**Files:**
- Create: `components/StageNav.tsx`
- Create: `components/StageNav.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
// components/StageNav.test.tsx
import { render, screen } from '@testing-library/react';
import { StageNav } from './StageNav';
import { STAGE_CONFIGS } from '@/lib/types';

describe('StageNav', () => {
  it('renders all 10 stage dots', () => {
    render(<StageNav currentIndex={0} completedIndices={[]} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(10);
  });

  it('highlights current stage', () => {
    render(<StageNav currentIndex={2} completedIndices={[0, 1]} />);
    expect(screen.getByLabelText(`Current stage: ${STAGE_CONFIGS[2].label}`)).toBeInTheDocument();
  });

  it('marks completed stages', () => {
    render(<StageNav currentIndex={2} completedIndices={[0, 1]} />);
    expect(screen.getByLabelText(`Completed: ${STAGE_CONFIGS[0].label}`)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest components/StageNav.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create components/StageNav.tsx**

```typescript
'use client';

import { STAGE_CONFIGS } from '@/lib/types';

interface StageNavProps {
  currentIndex: number;
  completedIndices: number[];
}

export function StageNav({ currentIndex, completedIndices }: StageNavProps) {
  return (
    <nav className="w-full py-4">
      <ol className="flex items-center justify-center gap-2 flex-wrap">
        {STAGE_CONFIGS.map((stage, i) => {
          const isCompleted = completedIndices.includes(i);
          const isCurrent = i === currentIndex;
          const isPending = !isCompleted && !isCurrent;

          return (
            <li key={stage.key} className="flex items-center">
              <div
                aria-label={
                  isCurrent
                    ? `Current stage: ${stage.label}`
                    : isCompleted
                    ? `Completed: ${stage.label}`
                    : `Pending: ${stage.label}`
                }
                title={stage.label}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${isCurrent ? 'bg-red-600 text-white ring-2 ring-red-400' : ''}
                  ${isCompleted ? 'bg-green-600 text-white' : ''}
                  ${isPending ? 'bg-gray-700 text-gray-400' : ''}
                `}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              {i < STAGE_CONFIGS.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}`} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-center text-sm text-gray-400 mt-2">
        Stage {currentIndex + 1} of {STAGE_CONFIGS.length}: <span className="text-white font-medium">{STAGE_CONFIGS[currentIndex].label}</span>
      </p>
    </nav>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest components/StageNav.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/StageNav.tsx components/StageNav.test.tsx
git commit -m "feat: add StageNav progress component"
```

---

## Task 12: PipelineStage + AngleSelector + HookSelector Components

**Files:**
- Create: `components/PipelineStage.tsx`
- Create: `components/AngleSelector.tsx`
- Create: `components/HookSelector.tsx`
- Create: `components/PipelineStage.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
// components/PipelineStage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineStage } from './PipelineStage';

const baseProps = {
  title: 'Script',
  description: 'Full narration script',
  isStreaming: false,
  streamedContent: 'Script content here',
  editedContent: 'Script content here',
  onEdit: jest.fn(),
  onNext: jest.fn(),
  onBack: jest.fn(),
  isFirstStage: false,
  isLastStage: false,
};

describe('PipelineStage', () => {
  it('renders title and description', () => {
    render(<PipelineStage {...baseProps} />);
    expect(screen.getByText('Script')).toBeInTheDocument();
    expect(screen.getByText('Full narration script')).toBeInTheDocument();
  });

  it('disables Next button while streaming', () => {
    render(<PipelineStage {...baseProps} isStreaming={true} />);
    expect(screen.getByText(/generating/i)).toBeDisabled();
  });

  it('calls onNext when Next clicked', () => {
    render(<PipelineStage {...baseProps} />);
    fireEvent.click(screen.getByText(/next/i));
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  it('calls onEdit when textarea changes', () => {
    render(<PipelineStage {...baseProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited' } });
    expect(baseProps.onEdit).toHaveBeenCalledWith('edited');
  });

  it('hides Back on first stage', () => {
    render(<PipelineStage {...baseProps} isFirstStage={true} />);
    expect(screen.queryByText(/back/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest components/PipelineStage.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create components/AngleSelector.tsx**

```typescript
'use client';

interface Angle {
  number: number;
  title: string;
  raw: string;
}

function parseAngles(content: string): Angle[] {
  const blocks = content.split(/ANGLE\s*\[(\d+)\]:/i).slice(1);
  const angles: Angle[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const number = parseInt(blocks[i], 10);
    const raw = blocks[i + 1]?.trim() ?? '';
    const titleMatch = raw.match(/^([^\n]+)/);
    angles.push({ number, title: titleMatch?.[1]?.trim() ?? `Angle ${number}`, raw });
  }
  return angles;
}

interface AngleSelectorProps {
  content: string;
  selectedAngle: string;
  onSelect: (angle: string) => void;
}

export function AngleSelector({ content, selectedAngle, onSelect }: AngleSelectorProps) {
  const angles = parseAngles(content);
  if (angles.length === 0) return <pre className="text-gray-300 whitespace-pre-wrap text-sm">{content}</pre>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Select the angle to develop:</p>
      {angles.map((angle) => (
        <button
          key={angle.number}
          onClick={() => onSelect(angle.title)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selectedAngle === angle.title
              ? 'border-red-500 bg-red-950 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
          }`}
        >
          <div className="font-semibold text-white">Angle {angle.number}: {angle.title}</div>
          <div className="text-sm mt-1 text-gray-400 line-clamp-2">{angle.raw.split('\n').slice(1, 3).join(' ')}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create components/HookSelector.tsx**

```typescript
'use client';

interface Hook {
  number: number;
  preview: string;
  raw: string;
}

function parseHooks(content: string): Hook[] {
  const blocks = content.split(/HOOK\s+(\d+):/i).slice(1);
  const hooks: Hook[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const number = parseInt(blocks[i], 10);
    const raw = blocks[i + 1]?.trim() ?? '';
    const preview = raw.slice(0, 120) + (raw.length > 120 ? '…' : '');
    hooks.push({ number, preview, raw });
  }
  return hooks;
}

interface HookSelectorProps {
  content: string;
  selectedHook: string;
  onSelect: (hook: string) => void;
}

export function HookSelector({ content, selectedHook, onSelect }: HookSelectorProps) {
  const hooks = parseHooks(content);
  if (hooks.length === 0) return <pre className="text-gray-300 whitespace-pre-wrap text-sm">{content}</pre>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Select the hook to open your video:</p>
      {hooks.map((hook) => (
        <button
          key={hook.number}
          onClick={() => onSelect(hook.raw)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selectedHook === hook.raw
              ? 'border-red-500 bg-red-950 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
          }`}
        >
          <div className="font-semibold text-white mb-1">Hook {hook.number}</div>
          <div className="text-sm italic text-gray-300">"{hook.preview}"</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create components/PipelineStage.tsx**

```typescript
'use client';

import { useRef, useEffect } from 'react';
import { AngleSelector } from './AngleSelector';
import { HookSelector } from './HookSelector';

interface PipelineStageProps {
  title: string;
  description: string;
  isStreaming: boolean;
  streamedContent: string;
  editedContent: string;
  onEdit: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStage: boolean;
  isLastStage: boolean;
  stageType?: 'angle-select' | 'hook-select' | 'text';
  selectedAngle?: string;
  selectedHook?: string;
  onSelectAngle?: (angle: string) => void;
  onSelectHook?: (hook: string) => void;
}

export function PipelineStage({
  title,
  description,
  isStreaming,
  streamedContent,
  editedContent,
  onEdit,
  onNext,
  onBack,
  isFirstStage,
  isLastStage,
  stageType = 'text',
  selectedAngle = '',
  selectedHook = '',
  onSelectAngle,
  onSelectHook,
}: PipelineStageProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isStreaming, editedContent]);

  const canProceed =
    !isStreaming &&
    (stageType === 'text' ||
      (stageType === 'angle-select' && selectedAngle) ||
      (stageType === 'hook-select' && selectedHook));

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedContent);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      {isStreaming ? (
        <div className="bg-gray-950 rounded-lg p-4 min-h-32 text-gray-300 text-sm whitespace-pre-wrap font-mono">
          {streamedContent}
          <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-1" />
        </div>
      ) : stageType === 'angle-select' && onSelectAngle ? (
        <AngleSelector content={editedContent} selectedAngle={selectedAngle} onSelect={onSelectAngle} />
      ) : stageType === 'hook-select' && onSelectHook ? (
        <HookSelector content={editedContent} selectedHook={selectedHook} onSelect={onSelectHook} />
      ) : (
        <textarea
          ref={textareaRef}
          value={editedContent}
          onChange={(e) => onEdit(e.target.value)}
          className="w-full bg-gray-950 text-gray-200 text-sm rounded-lg p-4 border border-gray-700 focus:border-red-500 focus:outline-none resize-none min-h-64 font-mono"
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          {!isFirstStage && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={copyToClipboard}
            disabled={isStreaming}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors disabled:opacity-40"
          >
            📋 Copy
          </button>
        </div>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isStreaming ? '⏳ Generating…' : isLastStage ? 'Finish ✓' : 'Next Stage →'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest components/PipelineStage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/PipelineStage.tsx components/AngleSelector.tsx components/HookSelector.tsx components/PipelineStage.test.tsx
git commit -m "feat: add PipelineStage, AngleSelector, HookSelector components"
```

---

## Task 13: ExportButton Component

**Files:**
- Create: `components/ExportButton.tsx`
- Create: `components/ExportButton.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
// components/ExportButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from './ExportButton';
import type { PipelineState } from '@/lib/types';

jest.mock('@/lib/export', () => ({
  downloadZip: jest.fn().mockResolvedValue(undefined),
}));

const mockState: PipelineState = {
  topic: 'Roman Empire',
  tone: 'dramatic',
  length: '10-15min',
  stages: { script: 'content', checklist: 'checklist content' },
  selectedAngle: 'angle',
  selectedHook: 'hook',
};

describe('ExportButton', () => {
  it('renders download button', () => {
    render(<ExportButton state={mockState} />);
    expect(screen.getByText(/download/i)).toBeInTheDocument();
  });

  it('calls downloadZip on click', async () => {
    const { downloadZip } = await import('@/lib/export');
    render(<ExportButton state={mockState} />);
    fireEvent.click(screen.getByText(/download/i));
    await waitFor(() => expect(downloadZip).toHaveBeenCalledWith(mockState));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest components/ExportButton.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create components/ExportButton.tsx**

```typescript
'use client';

import { useState } from 'react';
import { downloadZip } from '@/lib/export';
import type { PipelineState } from '@/lib/types';

interface ExportButtonProps {
  state: PipelineState;
}

export function ExportButton({ state }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadZip(state);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isExporting ? '⏳ Preparing zip…' : '⬇ Download Full Package'}
    </button>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest components/ExportButton.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ExportButton.tsx components/ExportButton.test.tsx
git commit -m "feat: add ExportButton component"
```

---

## Task 14: Landing Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update app/globals.css**

Replace entire contents with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0a0a0a;
  color: #f5f5f5;
}
```

- [ ] **Step 2: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YT History Pipeline',
  description: 'AI-powered content pipeline for faceless YouTube history channels',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-950`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace app/page.tsx**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tone, VideoLength } from '@/lib/types';
import { EMPTY_PIPELINE_STATE } from '@/lib/types';

const TONES: Tone[] = ['dramatic', 'educational', 'thriller', 'documentary'];
const LENGTHS: { value: VideoLength; label: string }[] = [
  { value: '5-8min', label: '5–8 min (~800 words)' },
  { value: '10-15min', label: '10–15 min (~1500 words)' },
  { value: '20min+', label: '20+ min (~3500 words)' },
];

export default function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('dramatic');
  const [length, setLength] = useState<VideoLength>('10-15min');

  const handleStart = () => {
    if (!topic.trim()) return;
    const state = { ...EMPTY_PIPELINE_STATE, topic: topic.trim(), tone, length };
    sessionStorage.setItem('yt-pipeline-state', JSON.stringify(state));
    sessionStorage.setItem('yt-pipeline-index', '0');
    router.push('/pipeline');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">
            History Channel <span className="text-red-500">Pipeline</span>
          </h1>
          <p className="text-gray-400">Generate a full video package in 10 AI-powered steps</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Video Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. The Fall of the Roman Empire"
              className="w-full bg-gray-950 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-red-500 focus:outline-none placeholder-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Channel Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    tone === t
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Video Length</label>
            <div className="space-y-2">
              {LENGTHS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLength(value)}
                  className={`w-full py-2 px-4 rounded-lg text-sm text-left transition-colors ${
                    length === value
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Pipeline →
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          Powered by Claude claude-sonnet-4-6 · Free DuckDuckGo research · ~$0.01–0.05 per run
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify landing page**

```bash
npm run dev
```

Open http://localhost:3000. Verify: topic input, tone selector, length selector, Start button render correctly and Start is disabled when topic empty.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat: add landing page with topic/tone/length inputs"
```

---

## Task 15: Pipeline Page (Orchestration)

**Files:**
- Create: `app/pipeline/page.tsx`

- [ ] **Step 1: Create app/pipeline/page.tsx**

```typescript
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from 'ai/react';
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

  const { complete, completion, isLoading, setCompletion } = useCompletion({
    api: currentStage.apiRoute,
    onFinish: (_prompt, completion) => {
      pipeline.setStageOutput(currentStage.key as StageKey, completion);
    },
  });

  // Redirect to home if no topic
  useEffect(() => {
    if (!state.topic) router.push('/');
  }, [state.topic, router]);

  // Auto-trigger generation when stage changes and has no output yet
  useEffect(() => {
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
      setCompletion('');
      complete(JSON.stringify(payload));
    } else if (hasOutput) {
      setCompletion(state.stages[currentStage.key as StageKey] ?? '');
    }
  // Only run when stage changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStageIndex]);

  const displayContent = state.stages[currentStage.key as StageKey] ?? completion;

  const handleEdit = (value: string) => {
    pipeline.setStageOutput(currentStage.key as StageKey, value);
    setCompletion(value);
  };

  const handleNext = () => {
    if (isLastStage) return;
    pipeline.nextStage();
  };

  const handleBack = () => {
    pipeline.prevStage();
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
          ← New topic
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
        onNext={handleNext}
        onBack={handleBack}
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
```

- [ ] **Step 2: Verify full pipeline flow**

```bash
npm run dev
```

1. Go to http://localhost:3000
2. Enter topic "The Fall of the Roman Empire", select Dramatic, 10-15 min
3. Click Start Pipeline
4. Verify Stage 1 auto-generates and shows 5 angles
5. Select an angle, click Next
6. Verify Stage 2 generates 3 hooks
7. Select a hook, click Next
8. Verify Stage 3 generates full script with streaming
9. Continue through all 10 stages
10. Verify Export button appears on Stage 10
11. Download zip, verify all 10 files present inside

- [ ] **Step 3: Commit**

```bash
git add app/pipeline/page.tsx
git commit -m "feat: add pipeline orchestration page"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx jest --passWithNoTests
```

Expected: All tests pass.

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run ESLint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Test with real API key**

Confirm `.env.local` has a valid `ANTHROPIC_API_KEY`.
Run full pipeline on topic "The Mongol Empire" — all 10 stages should complete and zip downloads with all files.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete YouTube history channel automation pipeline"
```

---

## Self-Review: Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| Topic research via web search | Task 4 (search.ts), Task 7 (research route) |
| Script generation | Task 3 (claude.ts), Task 8 (script route) |
| Thumbnail prompts | Task 3, Task 9 |
| Shorts ideas | Task 3, Task 9 |
| SEO titles | Task 3, Task 9 |
| Video descriptions | Task 3, Task 10 |
| Hashtags | Task 3, Task 10 |
| Hook generation | Task 3, Task 7 |
| Retention editing notes | Task 3, Task 8 |
| Upload checklist | Task 3, Task 10 |
| Step-by-step UI | Task 12, Task 15 |
| Angle selector (Stage 1) | Task 12 (AngleSelector) |
| Hook selector (Stage 2) | Task 12 (HookSelector) |
| Editable textarea | Task 12 (PipelineStage) |
| sessionStorage persistence | Task 6 (usePipeline) |
| Zip download | Task 5 (export.ts), Task 13 (ExportButton) |
| DuckDuckGo search (no API key) | Task 4 |
| Claude streaming | Tasks 7–10 |
| Tone + length settings | Task 14 (landing page) |
| Progress nav | Task 11 (StageNav) |
