"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/shared/components/ui/icon";

type CategoryDropdownProps = {
  label: string;
  placeholder: string;
  value: string;
  options: readonly string[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function CategoryDropdown({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: CategoryDropdownProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const expanded = open && !disabled;

  useEffect(() => {
    if (!expanded) return;
    function dismiss(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [expanded]);

  useEffect(() => {
    if (expanded)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, id]);

  function show(last = false) {
    const selected = options.indexOf(value);
    setActive(selected >= 0 ? selected : last ? options.length - 1 : 0);
    setOpen(true);
  }

  function select(index: number) {
    onChange(options[index]);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-list` : undefined}
        aria-haspopup="listbox"
        aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        className={`border-border-default text-caption-m focus-visible:outline-border-primary flex h-11.5 w-full items-center justify-between rounded-xs border pr-1 pl-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 ${disabled ? "bg-layer-surface-disabled text-text-disabled cursor-not-allowed border-transparent" : "bg-layer-surface-default"}`}
        onClick={() => (expanded ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!expanded) show(event.key === "ArrowUp" || event.key === "End");
            else
              setActive((current) =>
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? options.length - 1
                    : Math.max(
                        0,
                        Math.min(
                          options.length - 1,
                          current + (event.key === "ArrowDown" ? 1 : -1),
                        ),
                      ),
              );
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (expanded) select(active);
            else show();
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "Tab") setOpen(false);
          else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const index = options.findIndex((option) => option.startsWith(event.key));
            if (index >= 0) {
              event.preventDefault();
              setActive(index);
              setOpen(true);
            }
          }
        }}
      >
        <span className={value ? "" : "text-text-disabled"}>{value || placeholder}</span>
        <span className="flex size-8.5 shrink-0 items-center justify-center">
          <Icon name="arrowDown" className="size-3" />
        </span>
      </button>
      {expanded && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="border-border-default bg-layer-surface-default absolute top-full z-20 mt-2 flex max-h-54.5 w-full [scrollbar-width:thin] [scrollbar-color:var(--color-text-disabled)_var(--color-layer-surface-disabled)] flex-col gap-1 overflow-y-auto overscroll-contain rounded-xs border"
        >
          {options.map((option, index) => (
            <li
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={value === option}
              className={`text-caption-m flex h-10 shrink-0 cursor-pointer items-center px-4 ${active === index ? "bg-layer-surface-disabled" : ""}`}
              onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
