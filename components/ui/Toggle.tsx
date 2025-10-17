"use client";
import * as React from "react";

type ToggleProps = {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

export default function Toggle({
  id,
  name,
  checked,
  onChange,
  label,
  description,
  className,
}: ToggleProps) {
  return (
    <div className={["flex items-center justify-between gap-3", className || ""].join(" ")}>
      <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500">
        <span
          className={[
            "size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
        <input
          id={id}
          name={name ?? id}
          type="checkbox"
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-description` : undefined}
          className="absolute inset-0 appearance-none focus:outline-hidden cursor-pointer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      <div className="text-sm">
        <label id={`${id}-label`} htmlFor={id} className="font-medium text-gray-900 dark:text-white cursor-pointer">
          {label}
        </label>{" "}
        {description ? (
          <span id={`${id}-description`} className="text-gray-500 dark:text-gray-400">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}