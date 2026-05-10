import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from './ExportButton';
import type { PipelineState } from '../lib/types';

jest.mock('../lib/export', () => ({
  downloadZip: jest.fn().mockResolvedValue(undefined),
}));

const mockState: PipelineState = {
  topic: 'Roman Empire',
  tone: 'dramatic',
  length: '10-15min',
  stages: { script: 'content', checklist: 'checklist content' },
  selectedAngle: 'angle',
  selectedHook: 'hook',
};

describe('ExportButton', () => {
  it('renders download button', () => {
    render(<ExportButton state={mockState} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls downloadZip on click', async () => {
    const { downloadZip } = await import('@/lib/export');
    render(<ExportButton state={mockState} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(downloadZip).toHaveBeenCalledWith(mockState));
  });
});
