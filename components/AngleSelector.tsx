'use client';

interface Angle {
  number: number;
  title: string;
  raw: string;
}

function parseAngles(content: string): Angle[] {
  // Strip markdown bold markers before parsing
  const cleaned = content.replace(/\*\*/g, '').replace(/\*/g, '');

  const blocks = cleaned.split(/ANGLE\s*\[(\d+)\]:/i).slice(1);
  const angles: Angle[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const number = parseInt(blocks[i], 10);
    const raw = blocks[i + 1]?.trim() ?? '';
    const titleMatch = raw.match(/^([^\n]+)/);
    angles.push({ number, title: titleMatch?.[1]?.trim() ?? `Angle ${number}`, raw });
  }

  if (angles.length > 0) return angles;

  // Fallback: numbered list "1. ..." or "1) ..."
  const lines = cleaned.match(/^\s*\d+[.)]\s+.+/gm);
  if (lines && lines.length > 0) {
    return lines.map((line, idx) => {
      const raw = line.replace(/^\s*\d+[.)]\s+/, '').trim();
      return { number: idx + 1, title: raw.slice(0, 80), raw };
    });
  }

  return [];
}

interface AngleSelectorProps {
  content: string;
  selectedAngle: string;
  onSelect: (angle: string) => void;
}

export function AngleSelector({ content, selectedAngle, onSelect }: AngleSelectorProps) {
  const angles = parseAngles(content);

  // Auto-select raw content so Next Stage is never blocked when parsing yields nothing
  if (angles.length === 0) {
    if (content && !selectedAngle) {
      // Defer selection to avoid state update during render
      setTimeout(() => onSelect(content), 0);
    }
    return <pre className="text-gray-300 whitespace-pre-wrap text-sm">{content}</pre>;
  }

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
