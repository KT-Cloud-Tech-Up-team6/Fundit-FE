"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent } from "react";

type DropdownOption = { value: string; label: string; disabled?: boolean };
type DropdownProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "value" | "onChange" | "children" | "defaultValue"
> & {
  options: readonly DropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  size?: "xs" | "sm" | "lg";
  name?: string;
};

const sizes = {
  lg: "h-13 rounded-xs border border-border-default pl-4 pr-1 text-body-m",
  sm: "h-8 gap-2 rounded-xs border border-border-default px-3 text-body-s leading-[1.42]",
  xs: "h-[30px] gap-1 text-body-s font-medium leading-[1.42]",
};
const optionSizes = { lg: "min-h-[46px] px-4", sm: "min-h-10 px-4", xs: "min-h-9 px-2" };

export function Dropdown({
  options,
  value,
  onValueChange,
  placeholder = "선택해 주세요",
  size = "lg",
  disabled,
  className,
  id,
  name,
  onKeyDown,
  onClick,
  ...props
}: DropdownProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listId = `${triggerId}-options`;
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const search = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  if (disabled && open) setOpen(false);
  const selected = options.findIndex((option) => option.value === value);
  const available = options.flatMap((option, index) => (option.disabled ? [] : [index]));

  useEffect(() => {
    if (!open) return;
    function handleOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [open]);

  function focusOption(index: number) {
    setActive(index);
    optionRefs.current[index]?.focus();
  }

  function showMenu(last = false) {
    if (!available.length) return;
    setActive(
      selected >= 0 && !options[selected].disabled
        ? selected
        : available[last ? available.length - 1 : 0],
    );
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    trigger.current?.focus();
  }

  function choose(index: number) {
    if (!options[index] || options[index].disabled) return;
    onValueChange(options[index].value);
    closeMenu();
  }

  function handleMenuKey(event: KeyboardEvent<HTMLUListElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Tab") {
      closeMenu();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? available.length - 1
            : (available.indexOf(active) + offset + available.length) % available.length;
      focusOption(available[next]);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = event.timeStamp;
      search.current = {
        text:
          (now - search.current.time < 500 ? search.current.text : "") +
          event.key.toLocaleLowerCase(),
        time: now,
      };
      const match = available.find((index) =>
        options[index].label.toLocaleLowerCase().startsWith(search.current.text),
      );
      if (match !== undefined) focusOption(match);
    }
  }

  return (
    <div
      ref={container}
      className={["relative min-w-0", className].filter(Boolean).join(" ")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
      <button
        {...props}
        id={triggerId}
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={open && !disabled ? listId : undefined}
        className={[
          "bg-layer-surface-default text-text-default focus-visible:outline-border-primary disabled:text-text-disabled flex w-full items-center justify-between text-left focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
          sizes[size],
        ].join(" ")}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            if (open) setOpen(false);
            else showMenu();
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            showMenu(event.key === "ArrowUp");
          }
        }}
      >
        <span
          className={[
            "min-w-0 flex-1 truncate",
            size === "xs" && "px-2",
            selected < 0 && "text-text-disabled",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {options[selected]?.label ?? placeholder}
        </span>
        <span
          className={
            size === "lg"
              ? "flex size-[34px] shrink-0 items-center justify-center"
              : "flex shrink-0 items-center justify-center"
          }
        >
          <span
            aria-hidden
            className={[
              "size-3 bg-current [mask-image:url('/icons/molecules/dropdown-arrow.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]",
              open && !disabled && "rotate-180",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </span>
      </button>
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className="bg-layer-surface-default border-border-default shadow-light-m absolute top-full z-10 mt-2 max-h-60 w-full overflow-auto rounded-xs border py-0"
          onKeyDown={handleMenuKey}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              tabIndex={active === index ? 0 : -1}
              ref={(node) => {
                optionRefs.current[index] = node;
                if (node && active === index && document.activeElement === trigger.current)
                  node.focus();
              }}
              onFocus={() => setActive(index)}
              onClick={() => choose(index)}
              className={[
                "text-body-s flex items-center py-2 leading-[1.42] break-words outline-none",
                optionSizes[size],
                option.disabled
                  ? "text-text-disabled cursor-not-allowed"
                  : "hover:bg-layer-surface-primary-hover hover:text-text-inverse focus:bg-layer-surface-primary-hover focus:text-text-inverse cursor-pointer",
                option.value === value &&
                  !option.disabled &&
                  "bg-layer-surface-primary text-text-inverse",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
