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
