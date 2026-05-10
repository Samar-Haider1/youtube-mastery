'use client';

interface Hook {
  number: number;
  preview: string;
  raw: string;
}

function parseHooks(content: string): Hook[] {
  // Strip markdown bold markers before parsing
  const cleaned = content.replace(/\*\*/g, '').replace(/\*/g, '');

  const blocks = cleaned.split(/HOOK\s+(\d+):/i).slice(1);
  const hooks: Hook[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const number = parseInt(blocks[i], 10);
    const raw = blocks[i + 1]?.trim() ?? '';
    const preview = raw.slice(0, 120) + (raw.length > 120 ? '…' : '');
    hooks.push({ number, preview, raw });
  }

  if (hooks.length > 0) return hooks;

  // Fallback: numbered list "1. ..." or "1) ..."
  const lines = cleaned.match(/^\s*\d+[.)]\s+.+/gm);
  if (lines && lines.length > 0) {
    return lines.map((line, idx) => {
      const raw = line.replace(/^\s*\d+[.)]\s+/, '').trim();
      const preview = raw.slice(0, 120) + (raw.length > 120 ? '…' : '');
      return { number: idx + 1, preview, raw };
    });
  }

  return [];
}

interface HookSelectorProps {
  content: string;
  selectedHook: string;
  onSelect: (hook: string) => void;
}

export function HookSelector({ content, selectedHook, onSelect }: HookSelectorProps) {
  const hooks = parseHooks(content);

  // Auto-select raw content so Next Stage is never blocked when parsing yields nothing
  if (hooks.length === 0) {
    if (content && !selectedHook) {
      setTimeout(() => onSelect(content), 0);
    }
    return <pre className="text-gray-300 whitespace-pre-wrap text-sm">{content}</pre>;
  }

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
