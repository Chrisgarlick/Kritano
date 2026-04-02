import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders an SVG with role img', () => {
    render(<ProgressRing value={50} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('displays aria-label with score value', () => {
    render(<ProgressRing value={75} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score: 75 out of 100');
  });

  it('clamps value to max', () => {
    render(<ProgressRing value={150} max={100} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score: 100 out of 100');
  });

  it('clamps value to 0 minimum', () => {
    render(<ProgressRing value={-10} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score: 0 out of 100');
  });

  it('respects custom max value', () => {
    render(<ProgressRing value={5} max={10} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score: 5 out of 10');
  });

  it('renders children in center', () => {
    render(
      <ProgressRing value={80}>
        <span data-testid="center">80%</span>
      </ProgressRing>
    );
    expect(screen.getByTestId('center')).toHaveTextContent('80%');
  });

  it('renders background track by default', () => {
    const { container } = render(<ProgressRing value={50} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2); // track + progress
  });

  it('hides background track when showTrack is false', () => {
    const { container } = render(<ProgressRing value={50} showTrack={false} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(1); // only progress
  });

  it('applies animation class when animated', () => {
    const { container } = render(<ProgressRing value={50} animated />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.classList.contains('animate-progress-fill')).toBe(true);
  });

  it('does not apply animation class when not animated', () => {
    const { container } = render(<ProgressRing value={50} animated={false} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.classList.contains('animate-progress-fill')).toBe(false);
  });

  it('uses auto-color based on value (green for 90+)', () => {
    const { container } = render(<ProgressRing value={95} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#059669');
  });

  it('uses auto-color based on value (amber for 70-89)', () => {
    const { container } = render(<ProgressRing value={75} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#f59e0b');
  });

  it('uses auto-color based on value (orange for 50-69)', () => {
    const { container } = render(<ProgressRing value={55} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#f97316');
  });

  it('uses auto-color based on value (red for <50)', () => {
    const { container } = render(<ProgressRing value={30} />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#dc2626');
  });

  it('uses custom color when provided', () => {
    const { container } = render(<ProgressRing value={95} color="#ff00ff" />);
    const progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle.getAttribute('stroke')).toBe('#ff00ff');
  });

  it('merges custom className', () => {
    const { container } = render(<ProgressRing value={50} className="my-ring" />);
    expect((container.firstChild as HTMLElement).className).toContain('my-ring');
  });
});
