import { useState, useRef, useCallback, useId, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** Placement relative to the trigger element */
  position?: 'top' | 'bottom';
  /** Additional class names on the wrapper */
  className?: string;
}

export function Tooltip({ content, children, position = 'bottom', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = useId();

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 z-50 px-3 py-2 text-xs text-white bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-w-xs w-max pointer-events-none ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-slate-700 rotate-45 ${
              position === 'top'
                ? 'top-full -mt-1 border-r border-b'
                : 'bottom-full -mb-1 border-l border-t'
            }`}
          />
        </div>
      )}
    </div>
  );
}
