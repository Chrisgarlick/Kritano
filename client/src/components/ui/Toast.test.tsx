import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

// Helper component that triggers toasts
function ToastTrigger({ message, variant }: { message: string; variant?: 'success' | 'error' | 'info' | 'warning' }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast(message, variant)}>
      Show Toast
    </button>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast message when triggered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Hello toast" />);

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Hello toast')).toBeInTheDocument();
  });

  it('renders success toast with green background', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Saved" variant="success" />);

    await user.click(screen.getByText('Show Toast'));
    const toast = screen.getByText('Saved').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-emerald-600');
  });

  it('renders error toast with red background and alert role', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Failed" variant="error" />);

    await user.click(screen.getByText('Show Toast'));
    const toast = screen.getByText('Failed').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-red-600');
    expect(toast).toHaveAttribute('role', 'alert');
  });

  it('renders warning toast with amber background', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Warning" variant="warning" />);

    await user.click(screen.getByText('Show Toast'));
    const toast = screen.getByText('Warning').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-amber-600');
  });

  it('renders info toast with indigo background by default', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Info" />);

    await user.click(screen.getByText('Show Toast'));
    const toast = screen.getByText('Info').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-indigo-600');
  });

  it('dismisses toast when dismiss button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Dismiss me" />);

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(<ToastTrigger message="Auto dismiss" />);

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
  });

  it('dismisses all toasts on Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider(
      <>
        <ToastTrigger message="Toast 1" />
        <ToastTrigger message="Toast 2" variant="error" />
      </>
    );

    // Show two toasts
    const buttons = screen.getAllByText('Show Toast');
    await user.click(buttons[0]);
    await user.click(buttons[1]);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow('useToast must be used within ToastProvider');
    spy.mockRestore();
  });
});
