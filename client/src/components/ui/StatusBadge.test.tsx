import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge, SeverityBadge, CountBadge } from './StatusBadge';

describe('StatusBadge', () => {
  const statuses = [
    { status: 'pending' as const, label: 'Pending', bg: 'bg-amber-100' },
    { status: 'discovering' as const, label: 'Discovering', bg: 'bg-sky-100' },
    { status: 'ready' as const, label: 'Ready', bg: 'bg-amber-100' },
    { status: 'processing' as const, label: 'Processing', bg: 'bg-indigo-100' },
    { status: 'completed' as const, label: 'Completed', bg: 'bg-emerald-100' },
    { status: 'failed' as const, label: 'Failed', bg: 'bg-red-100' },
    { status: 'cancelled' as const, label: 'Cancelled', bg: 'bg-slate-100' },
  ];

  statuses.forEach(({ status, label, bg }) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it(`applies ${bg} background for status "${status}"`, () => {
      const { container } = render(<StatusBadge status={status} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain(bg);
    });
  });

  it('renders custom label when provided', () => {
    render(<StatusBadge status="completed" label="Done!" />);
    expect(screen.getByText('Done!')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<StatusBadge status="pending" showIcon={false} />);
    // With showIcon=false, there should be no dot/icon span before the label
    const badge = container.firstChild as HTMLElement;
    // Only child should be the label span
    expect(badge.children).toHaveLength(1);
    expect(badge.children[0].textContent).toBe('Pending');
  });

  it('applies size classes', () => {
    const { container } = render(<StatusBadge status="pending" size="md" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-sm');
  });

  it('merges custom className', () => {
    const { container } = render(<StatusBadge status="pending" className="my-class" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('my-class');
  });
});

describe('SeverityBadge', () => {
  const severities = [
    { severity: 'critical' as const, label: 'Critical', bg: 'bg-red-100' },
    { severity: 'serious' as const, label: 'Serious', bg: 'bg-orange-100' },
    { severity: 'moderate' as const, label: 'Moderate', bg: 'bg-amber-100' },
    { severity: 'minor' as const, label: 'Minor', bg: 'bg-sky-100' },
    { severity: 'info' as const, label: 'Info', bg: 'bg-slate-100' },
  ];

  severities.forEach(({ severity, label, bg }) => {
    it(`renders "${label}" for severity "${severity}"`, () => {
      render(<SeverityBadge severity={severity} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it(`applies ${bg} background for severity "${severity}"`, () => {
      const { container } = render(<SeverityBadge severity={severity} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain(bg);
    });
  });

  it('renders custom label', () => {
    render(<SeverityBadge severity="critical" label="Urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('hides dot when showDot is false', () => {
    const { container } = render(<SeverityBadge severity="critical" showDot={false} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.children).toHaveLength(1);
  });
});

describe('CountBadge', () => {
  it('renders count number', () => {
    render(<CountBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders 99+ for counts over 99', () => {
    render(<CountBadge count={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders exactly 99 without plus', () => {
    render(<CountBadge count={99} />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { container } = render(<CountBadge count={3} variant="danger" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-red-100');
  });
});
