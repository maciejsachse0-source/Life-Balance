"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
};

export function InlineTextarea({
  value,
  onChange,
  placeholder,
  className,
  minRows = 2,
}: Props) {
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setLocal(value), [value]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [local]);

  return (
    <textarea
      ref={ref}
      value={local}
      placeholder={placeholder}
      rows={minRows}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      className={cn(
        "w-full bg-transparent resize-none outline-none border-0 p-0 leading-relaxed",
        "text-neutral-800 placeholder:text-neutral-400",
        className,
      )}
    />
  );
}
