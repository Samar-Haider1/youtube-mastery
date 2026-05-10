'use client';

import { useState, useRef, useEffect } from 'react';
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
  error?: string | null;
  onRetry?: () => void;
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
  error,
  onRetry,
}: PipelineStageProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isStreaming, editedContent]);

  const canProceed =
    !isStreaming &&
    !error &&
    (stageType === 'text' ||
      (stageType === 'angle-select' && selectedAngle) ||
      (stageType === 'hook-select' && selectedHook));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const copyLabel = copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Copy failed' : 'Copy';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-700 p-3 flex items-center justify-between">
          <span className="text-red-300 text-sm">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

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
              Back
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={isStreaming}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors disabled:opacity-40"
          >
            {copyLabel}
          </button>
        </div>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isStreaming ? 'Generating' : isLastStage ? 'Finish' : 'Next Stage'}
        </button>
      </div>
    </div>
  );
}
