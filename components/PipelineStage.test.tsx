// components/PipelineStage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineStage } from './PipelineStage';

const baseProps = {
  title: 'Script',
  description: 'Full narration script',
  isStreaming: false,
  streamedContent: 'Script content here',
  editedContent: 'Script content here',
  onEdit: jest.fn(),
  onNext: jest.fn(),
  onBack: jest.fn(),
  isFirstStage: false,
  isLastStage: false,
};

describe('PipelineStage', () => {
  it('renders title and description', () => {
    render(<PipelineStage {...baseProps} />);
    expect(screen.getByText('Script')).toBeInTheDocument();
    expect(screen.getByText('Full narration script')).toBeInTheDocument();
  });

  it('disables Next button while streaming', () => {
    render(<PipelineStage {...baseProps} isStreaming={true} />);
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('calls onNext when Next clicked', () => {
    render(<PipelineStage {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /next stage/i }));
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  it('calls onEdit when textarea changes', () => {
    render(<PipelineStage {...baseProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited' } });
    expect(baseProps.onEdit).toHaveBeenCalledWith('edited');
  });

  it('hides Back on first stage', () => {
    render(<PipelineStage {...baseProps} isFirstStage={true} />);
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});
