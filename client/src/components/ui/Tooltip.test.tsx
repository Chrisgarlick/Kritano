import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Hint text">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not show tooltip content initially', () => {
    render(
      <Tooltip content="Hint text">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hint text">
        <span>Hover me</span>
      </Tooltip>
    );

    await user.hover(screen.getByText('Hover me').parentElement!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hint text');
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hint text">
        <span>Hover me</span>
      </Tooltip>
    );

    const wrapper = screen.getByText('Hover me').parentElement!;
    await user.hover(wrapper);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.unhover(wrapper);
    // Wait for the 100ms hide timeout
    await new Promise(r => setTimeout(r, 150));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Focus hint">
        <span>Focus me</span>
      </Tooltip>
    );

    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus hint');
  });

  it('sets aria-describedby when visible', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Accessible hint">
        <span>Trigger</span>
      </Tooltip>
    );

    const wrapper = screen.getByText('Trigger').parentElement!;
    // Initially no aria-describedby
    expect(wrapper).not.toHaveAttribute('aria-describedby');

    await user.hover(wrapper);
    const tooltipId = screen.getByRole('tooltip').id;
    expect(wrapper).toHaveAttribute('aria-describedby', tooltipId);
  });

  it('positions tooltip at bottom by default', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Bottom tip">
        <span>Trigger</span>
      </Tooltip>
    );

    await user.hover(screen.getByText('Trigger').parentElement!);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('top-full');
  });

  it('positions tooltip at top when specified', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Top tip" position="top">
        <span>Trigger</span>
      </Tooltip>
    );

    await user.hover(screen.getByText('Trigger').parentElement!);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('bottom-full');
  });
});
