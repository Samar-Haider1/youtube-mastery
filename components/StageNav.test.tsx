import { render, screen } from '@testing-library/react';
import { StageNav } from './StageNav';
import { STAGE_CONFIGS } from '@/lib/types';

describe('StageNav', () => {
  it('renders all 10 stage dots', () => {
    render(<StageNav currentIndex={0} completedIndices={[]} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(10);
  });

  it('highlights current stage', () => {
    render(<StageNav currentIndex={2} completedIndices={[0, 1]} />);
    expect(screen.getByLabelText(`Current stage: ${STAGE_CONFIGS[2].label}`)).toBeInTheDocument();
  });

  it('marks completed stages', () => {
    render(<StageNav currentIndex={2} completedIndices={[0, 1]} />);
    expect(screen.getByLabelText(`Completed: ${STAGE_CONFIGS[0].label}`)).toBeInTheDocument();
  });
});
