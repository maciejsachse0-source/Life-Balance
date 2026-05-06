"use client";

import { useState, useEffect } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
};

export function InlineInput({ value, onChange, className, placeholder }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <input
      type="text"
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={
        className ??
        "bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-indigo-500 focus:outline-none px-1"
      }
    />
  );
}
