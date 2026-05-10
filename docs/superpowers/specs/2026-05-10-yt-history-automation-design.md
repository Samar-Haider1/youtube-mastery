# YouTube History Channel Automation System — Design Spec

**Date:** 2026-05-10
**Status:** Approved

---

## Overview

Web app that automates the full content pipeline for a faceless YouTube history channel. User inputs a topic, steps through 10 generation stages powered by Claude API, edits each output, then downloads a zip package ready for production.

---

## Architecture

**Stack:** Next.js 14 App Router (TypeScript), Claude API (claude-sonnet-4-6), DuckDuckGo search (duck-duck-scrape), Vercel AI SDK for streaming.

```
d:/Claude/YT/Video Gen/
├── app/
│   ├── page.tsx                  # Landing — topic input + channel settings
│   ├── pipeline/
│   │   └── page.tsx              # Step-by-step pipeline UI
│   └── api/
│       ├── research/route.ts     # DuckDuckGo search → Claude angle analysis
│       ├── hooks/route.ts        # 3 hook variants (30s cold opens)
│       ├── script/route.ts       # Full narration script
│       ├── editing-notes/route.ts# B-roll cues + retention notes
│       ├── thumbnails/route.ts   # 3 Midjourney-ready image prompts
│       ├── shorts/route.ts       # 5 clip ideas with timestamps
│       ├── titles/route.ts       # 5 SEO title variants
│       ├── description/route.ts  # Full video description
│       ├── hashtags/route.ts     # 30 hashtags
│       └── checklist/route.ts    # Populated upload checklist
├── components/
│   ├── PipelineStage.tsx         # Reusable stage card: streamed output + editable textarea + nav
│   ├── StageNav.tsx              # Progress indicator (10 stages)
│   └── ExportButton.tsx          # JSZip download trigger
└── lib/
    ├── claude.ts                 # Anthropic SDK wrapper + per-stage system prompts
    ├── search.ts                 # DuckDuckGo search via duck-duck-scrape
    └── export.ts                 # JSZip bundle builder + file-saver
```

**Environment variables:**
```
ANTHROPIC_API_KEY=
```
No other API keys required. DuckDuckGo search needs no authentication.

---

## Pipeline Stages

Stages run sequentially. Each stage output is editable before proceeding. All prior outputs are passed as context to each subsequent stage for coherence.

| # | Stage | Primary Input | Output |
|---|-------|--------------|--------|
| 1 | Topic Research | user topic + DuckDuckGo results | 5 ranked angles with viral potential notes |
| 2 | Hook Generation | chosen angle | 3 hook variants (30s cold open scripts) |
| 3 | Script | angle + chosen hook | full narration (~1500–4000 words scaled to length setting) |
| 4 | Retention Editing Notes | full script | B-roll cues, pattern interrupts, pacing notes per scene |
| 5 | Thumbnail Prompts | script + topic | 3 Midjourney-ready image prompts |
| 6 | Shorts Ideas | full script | 5 clip ideas with timestamps + suggested captions |
| 7 | SEO Titles | script + angle | 5 title variants with keyword rationale |
| 8 | Description | script + titles + hooks | full description with timestamp outline, CTA, placeholder links |
| 9 | Hashtags | topic + description | 30 hashtags (mix: broad / niche / trending) |
| 10 | Upload Checklist | all outputs | pre-populated checklist with generated values |

**Stage ordering rationale:** Hook before script so the cold open shapes the narrative arc. Editing notes after script so they reference actual scene content. Titles/description/hashtags last so they reflect the final script and hook.

---

## Claude Integration

**Model:** `claude-sonnet-4-6`

**Streaming:** Vercel AI SDK `StreamingTextResponse` on API routes + `useCompletion` hook on client. Text streams word-by-word into editable textarea.

**System prompt pattern (per stage):**
```
You are a viral history YouTube content creator. 
Channel tone: {tone}. Target video length: {length}.
You produce content for a faceless channel — no personal anecdotes.

Previous pipeline outputs for context:
{priorStageOutputs}
```

**Context passing:** Each API route receives `{ topic, tone, length, stages }` where `stages` is a map of all completed stage outputs. Passed in user message as structured context block.

---

## Search Integration (Topic Research)

Package: `duck-duck-scrape` (no API key, free, MIT)

Queries run in parallel:
1. `"{topic} history youtube viral"`
2. `"{topic} history documentary interesting facts"`
3. `"{topic} history controversies mysteries"`

Top 10 results from each query passed to Claude. Claude synthesizes into 5 ranked content angles, each with: angle title, hook potential score (1-10), key facts to cover, suggested emotional angle (mystery / drama / tragedy / triumph).

---

## UI Flow

### Landing Page (`/`)
- Topic text input
- Tone selector: `Dramatic | Educational | Thriller | Documentary`
- Length selector: `5-8 min | 10-15 min | 20+ min` (maps to word count targets: ~800 / 1500 / 3500)
- Start Pipeline button → navigates to `/pipeline`

### Pipeline Page (`/pipeline`)
- Top: `StageNav` — numbered progress dots, current stage highlighted
- Center: `PipelineStage` card:
  - Stage title + description
  - Streamed output rendered in read-only view while generating
  - Editable textarea (pre-filled with generated output once stream completes)
  - Copy to clipboard button
  - Back / Next Stage buttons (Next disabled during streaming)
- Stage 1 (Research): shows 5 angles as selectable cards — user picks one before proceeding
- Stage 2 (Hooks): shows 3 hooks as selectable cards — user picks one before proceeding
- All other stages: freeform editable textarea

### Final Stage (Upload Checklist)
- Checklist populated with actual generated values (title options listed, hashtag count shown, etc.)
- Download Full Package button → triggers zip

---

## State Management

- `usePipeline` custom hook holds all 10 stage outputs in React state
- `sessionStorage` serializes state on every update — survives page refresh
- No backend database — purely client-side until export
- State shape:
```typescript
interface PipelineState {
  topic: string;
  tone: 'dramatic' | 'educational' | 'thriller' | 'documentary';
  length: '5-8min' | '10-15min' | '20min+';
  stages: {
    [stageKey: string]: string; // editable final output per stage
  };
  selectedAngle: string;
  selectedHook: string;
}
```

---

## Export

Package: `jszip` + `file-saver` (both free, MIT)

Zip contents:
```
{topic-slug}-{YYYY-MM-DD}.zip
├── 01-research-angles.md
├── 02-hooks.md
├── 03-script.md
├── 04-editing-notes.md
├── 05-thumbnail-prompts.md
├── 06-shorts-ideas.md
├── 07-seo-titles.md
├── 08-description.md
├── 09-hashtags.md
└── 10-upload-checklist.md
```

Each file prefixed with stage number for logical ordering. Export uses the final edited textarea content, not the raw Claude output.

---

## Cost

| Item | Cost |
|------|------|
| Claude API | ~$0.01–0.05 per full pipeline run (Sonnet pricing) |
| DuckDuckGo search | Free, no account |
| Vercel hosting | Free tier (100GB bandwidth/mo) |
| All npm packages | Free / MIT |

Only recurring cost: Claude API usage.

---

## Out of Scope

- User accounts / auth
- Saved project history
- Direct YouTube upload integration
- Image generation (thumbnail prompts are text only)
- Multiple channel support
