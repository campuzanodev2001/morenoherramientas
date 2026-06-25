'use client'

type Props = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string | null
  type?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  maxLength?: number
  required?: boolean
  className?: string
}

export default function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  inputMode,
  maxLength,
  required,
  className,
}: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <label htmlFor={name} className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
        {label}
        {required && <span className="text-accent-red"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`border-2 bg-surface-container-lowest px-3 py-2.5 text-sm font-medium text-on-surface outline-none transition-colors focus:border-primary-container ${
          error ? 'border-accent-red' : 'border-outline'
        }`}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs font-bold text-accent-red">
          {error}
        </span>
      )}
    </div>
  )
}
