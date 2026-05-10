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
  selectable: boolean;
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
