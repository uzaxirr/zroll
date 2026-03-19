interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  options?: { label: string; value: string }[];
}

export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  options,
}: FormInputProps) {
  const baseClasses =
    "w-full px-4 py-2.5 border rounded-btn text-sm focus:outline-none transition-colors";
  const stateClasses = error
    ? "border-error focus:border-error"
    : "border-card-border focus:border-green";

  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} ${stateClasses}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseClasses} ${stateClasses}`}
        />
      )}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
