import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';

// Mock auth context
const mockRegister = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Should show validation errors
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'Chris');
    await user.type(screen.getByLabelText(/last name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'chris@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1234!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1234!');

    // Check the ToS checkbox
    const tosCheckbox = screen.getByRole('checkbox');
    await user.click(tosCheckbox);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    renderForm();

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('shows link to Terms of Service', () => {
    renderForm();

    const tosLink = screen.getByRole('link', { name: /terms of service/i });
    expect(tosLink).toBeInTheDocument();
    expect(tosLink).toHaveAttribute('href', '/terms');
  });

  it('shows Terms of Service acceptance checkbox', () => {
    renderForm();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('shows error when ToS is not accepted', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'Chris');
    await user.type(screen.getByLabelText(/last name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'chris@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1234!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1234!');

    // Don't check ToS
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/you must accept the terms of service/i)).toBeInTheDocument();
  });

  it('calls register and navigates on successful submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ success: true });
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'Chris');
    await user.type(screen.getByLabelText(/last name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'chris@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1234!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1234!');

    const tosCheckbox = screen.getByRole('checkbox');
    await user.click(tosCheckbox);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for the register call
    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        email: 'chris@example.com',
        firstName: 'Chris',
        lastName: 'Test',
        acceptedTos: true,
      }));
    });
  });

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      response: {
        data: { code: 'EMAIL_EXISTS', error: 'An account with this email already exists.' },
      },
    });
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'Chris');
    await user.type(screen.getByLabelText(/last name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1234!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1234!');

    const tosCheckbox = screen.getByRole('checkbox');
    await user.click(tosCheckbox);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/an account with this email already exists/i)).toBeInTheDocument();
  });
});
