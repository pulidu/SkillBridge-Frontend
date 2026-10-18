import { useId } from 'react';
import { cn } from '@/lib/cn';

export interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

/**
 * Wraps a control with its label, hint and error text, and wires up the
 * `aria-describedby` / `aria-invalid` relationships so validation messages are
 * announced by screen readers.
 */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  required,
  className,
  wrapperClassName,
  ...rest
}: InputProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL,
            invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            className,
          )}
          {...rest}
        />
      )}
    </Field>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  error,
  hint,
  required,
  className,
  wrapperClassName,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL,
            'resize-y',
            invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            className,
          )}
          {...rest}
        />
      )}
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
  wrapperClassName?: string;
}

export function Select({
  label,
  options,
  error,
  hint,
  required,
  placeholder,
  className,
  wrapperClassName,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL,
            invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            className,
          )}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
