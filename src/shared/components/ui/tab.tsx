import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactElement,
} from "react";

type TabProps = ComponentPropsWithRef<"button"> & {
  selected?: boolean;
  size?: "md" | "lg";
  variant?: "primary" | "primaryLive";
};

const sizeClasses: Record<NonNullable<TabProps["size"]>, string> = {
  md: "w-[130px] text-body-emphasis",
  lg: "w-[195px] text-title-s font-medium",
};

export function Tab({
  className,
  disabled,
  selected = false,
  size = "lg",
  tabIndex,
  type = "button",
  variant = "primary",
  ...props
}: TabProps) {
  const active = selected && !disabled;
  const activeClasses =
    variant === "primary"
      ? "border-border-primary text-text-default"
      : "border-border-primary-live text-text-primary-live";
  const activeBorderClass = size === "md" ? "border-b-[1.5px]" : "border-b-[1.8px]";

  return (
    <button
      type={type}
      className={[
        "bg-layer-surface-default flex h-13 items-center justify-center overflow-hidden p-2 whitespace-nowrap",
        "focus-visible:outline-border-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
        active
          ? `${activeClasses} ${activeBorderClass}`
          : "border-border-default text-text-disabled border-b",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-selected={selected}
      disabled={disabled}
      role="tab"
      tabIndex={tabIndex ?? 0}
      {...props}
    />
  );
}

type TabListProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
  defaultSelectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  selectedIndex?: number;
};

export function TabList({
  children,
  className,
  defaultSelectedIndex,
  onKeyDown,
  onSelectedIndexChange,
  selectedIndex,
  ...props
}: TabListProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> =>
      isValidElement<TabProps>(child) && child.type === Tab,
  );
  const [uncontrolledIndex, setUncontrolledIndex] = useState(() => {
    const selectedChildIndex = tabs.findIndex((tab) => tab.props.selected && !tab.props.disabled);

    if (defaultSelectedIndex !== undefined) return defaultSelectedIndex;
    if (selectedChildIndex >= 0) return selectedChildIndex;

    return tabs.findIndex((tab) => !tab.props.disabled);
  });
  const activeIndex = selectedIndex ?? uncontrolledIndex;

  const selectTab = (index: number) => {
    if (selectedIndex === undefined) setUncontrolledIndex(index);
    onSelectedIndexChange?.(index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    const enabledTabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    const currentTab = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
    const currentIndex = currentTab ? enabledTabs.indexOf(currentTab) : -1;
    if (currentIndex < 0) return;

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? enabledTabs.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + enabledTabs.length) %
            enabledTabs.length;
    enabledTabs[nextIndex]?.focus();
    enabledTabs[nextIndex]?.click();
  };

  return (
    <div
      className={["flex w-[390px] items-center", className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
      role="tablist"
      {...props}
    >
      {tabs.map((tab, index) =>
        cloneElement(tab, {
          key: tab.key ?? index,
          onClick: (event) => {
            tab.props.onClick?.(event);
            if (!event.defaultPrevented && !tab.props.disabled) selectTab(index);
          },
          selected: index === activeIndex,
          tabIndex: index === activeIndex ? 0 : -1,
        }),
      )}
    </div>
  );
}
