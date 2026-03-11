import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed
            ${error ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
