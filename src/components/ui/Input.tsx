import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={clsx(
          "h-9 px-3 rounded-lg text-sm outline-none transition-colors w-full",
          "placeholder:text-[var(--text-muted)]",
          "focus:ring-1",
          className
        )}
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
          color: "var(--text-primary)",
        }}
      />
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className={clsx(
          "px-3 py-2 rounded-lg text-sm outline-none transition-colors w-full resize-none",
          "placeholder:text-[var(--text-muted)]",
          className
        )}
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
          color: "var(--text-primary)",
        }}
      />
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <select
        id={id}
        {...props}
        className={clsx("h-9 px-3 rounded-lg text-sm outline-none w-full cursor-pointer", className)}
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
          color: "var(--text-primary)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--bg-elevated)" }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
