import type { Tone, VideoLength, ApiRoutePayload } from './types';

export function createAnthropicClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createOllama } = require('ollama-ai-provider');
  const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  return createOllama({ baseURL });
}

export const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

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

Generate exactly 5 angles ranked content angles for a YouTube history video about this topic.
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
- Premiere scheduled or published immediately

This is a checklist — output the word "checklist" somewhere in your response.`;
}
