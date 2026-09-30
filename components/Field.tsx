import type { InputHTMLAttributes } from "react";
import { inputCls } from "./ui";

type Props = { label: string; error?: string[] } & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, error, className, ...props }: Props) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={className ?? inputCls}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-expense">
          {error[0]}
        </p>
      )}
    </div>
  );
}
