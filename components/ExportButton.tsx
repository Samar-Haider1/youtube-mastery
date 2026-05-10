'use client';

import { useState } from 'react';
import { downloadZip } from '@/lib/export';
import type { PipelineState } from '@/lib/types';

interface ExportButtonProps {
  state: PipelineState;
}

export function ExportButton({ state }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadZip(state);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isExporting ? 'Preparing zip...' : 'Download Full Package'}
      </button>
      {exportError && (
        <p className="text-center text-sm text-red-400">{exportError}</p>
      )}
    </div>
  );
}
