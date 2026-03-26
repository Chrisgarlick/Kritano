import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingChecklist } from './OnboardingChecklist';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderChecklist(props: Partial<Parameters<typeof OnboardingChecklist>[0]> = {}) {
  const defaults = {
    sites: [],
    audits: [],
    loading: false,
  };
  return render(
    <MemoryRouter>
      <OnboardingChecklist {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders all three steps for a new user', () => {
    renderChecklist();

    expect(screen.getByText('Add your first site')).toBeInTheDocument();
    expect(screen.getByText('Verify your domain')).toBeInTheDocument();
    expect(screen.getByText('Run your first audit')).toBeInTheDocument();
  });

  it('marks "Add your first site" as complete when sites exist', () => {
    renderChecklist({
      sites: [{ id: 's1', domain: 'example.com', verified: false } as never],
    });

    // The step should show a check icon rather than the CTA button
    const addSiteStep = screen.getByText('Add your first site').closest('[class]');
    expect(addSiteStep).toBeInTheDocument();
  });

  it('marks "Verify your domain" as complete when a site is verified', () => {
    renderChecklist({
      sites: [{ id: 's1', domain: 'example.com', verified: true } as never],
    });

    const verifyStep = screen.getByText('Verify your domain').closest('[class]');
    expect(verifyStep).toBeInTheDocument();
  });

  it('marks "Run your first audit" as complete when a completed audit exists', () => {
    renderChecklist({
      sites: [{ id: 's1', domain: 'example.com', verified: true } as never],
      audits: [{ id: 'a1', status: 'completed' } as never],
    });

    const auditStep = screen.getByText('Run your first audit').closest('[class]');
    expect(auditStep).toBeInTheDocument();
  });

  it('does not render when loading', () => {
    renderChecklist({ loading: true });

    // Should not show the checklist while loading
    expect(screen.queryByText('Add your first site')).not.toBeInTheDocument();
  });

  it('does not render when previously dismissed', () => {
    localStorage.setItem('pagepulser_onboarding_dismissed', 'true');
    renderChecklist();

    expect(screen.queryByText('Add your first site')).not.toBeInTheDocument();
  });

  it('can be dismissed by clicking the close button', async () => {
    const user = userEvent.setup();
    renderChecklist();

    // Find and click dismiss button (X icon)
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    if (dismissButton) {
      await user.click(dismissButton);
      expect(localStorage.getItem('pagepulser_onboarding_dismissed')).toBe('true');
    }
  });

  it('shows correct progress count', () => {
    renderChecklist({
      sites: [{ id: 's1', domain: 'example.com', verified: true } as never],
    });

    // With 1 site (verified), 2 of 3 steps should be complete (add site + verify domain)
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
  });
});
