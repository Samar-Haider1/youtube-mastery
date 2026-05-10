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
