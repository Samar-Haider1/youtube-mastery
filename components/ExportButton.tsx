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
      {isExporting ? 'Preparing zip...' : 'Download Full Package'}
    </button>
  );
}
