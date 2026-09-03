"use client";

import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from "react";

type TabSize = "sm" | "md" | "lg";
type TabVariant = "primary" | "primaryLive";

type TabStyleProps = {
  selected?: boolean;
  size?: TabSize;
  variant?: TabVariant;
};

/**
 * `href`가 있으면 URL로 전환하는 링크가 된다. 이때는 ARIA 탭 위젯이 아니라
 * 현재 위치 표시(`aria-current`)를 쓴다. 탭처럼 보이지만 페이지를 이동하는
 * 내비게이션이라 `role="tab"`을 붙이면 스크린리더에 잘못 전달된다.
 */
type TabProps =
  | (TabStyleProps & ComponentPropsWithRef<"button"> & { href?: never })
  | (TabStyleProps & Omit<ComponentPropsWithRef<"a">, "href"> & { href: string });

/* sm(데스크톱)은 배경과 패딩이 없고 인디케이터를 요소 밖에 겹쳐 그린다.
   md·lg(모바일)는 각 탭이 자기 밑줄을 그려 이어 붙는 구조라 overflow-hidden 이 필요하다. */
const sizeClasses: Record<TabSize, string> = {
  sm: "h-10 min-w-0 flex-1 text-body-s md:w-30 md:flex-none",
  md: "bg-layer-surface-default h-13 w-[130px] overflow-hidden p-2 text-body-emphasis",
  lg: "bg-layer-surface-default h-13 w-[195px] overflow-hidden p-2 text-title-s font-medium",
};

const activeTextClasses: Record<TabVariant, string> = {
  primary: "text-text-default",
  primaryLive: "text-text-primary-live",
};

/* sm은 TabList가 그린 트랙 위에 인디케이터를 덮는다. 탭 사이에 간격이 있어
   각 탭이 자기 밑줄을 그리면 선이 끊긴다. */
const indicatorClasses: Record<TabVariant, string> = {
  primary: "after:bg-layer-surface-primary",
  primaryLive: "after:bg-layer-surface-primary-live",
};

const activeBorderClasses: Record<TabVariant, string> = {
  primary: "border-border-primary",
  primaryLive: "border-border-primary-live",
};

function stateClasses(size: TabSize, variant: TabVariant, active: boolean) {
  if (size === "sm") {
    return active
      ? `relative ${activeTextClasses[variant]} ${indicatorClasses[variant]} after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full`
      : "text-text-secondary";
  }

  return active
    ? `${activeTextClasses[variant]} ${activeBorderClasses[variant]} ${size === "md" ? "border-b-[1.5px]" : "border-b-[1.8px]"}`
    : "border-border-default text-text-disabled border-b";
}

export function Tab({
  className,
  href,
  selected = false,
  size = "lg",
  variant = "primary",
  ...props
}: TabProps) {
  const disabled = "disabled" in props ? props.disabled : false;
  const active = selected && !disabled;
  const classes = [
    "flex items-center justify-center gap-1 whitespace-nowrap",
    "focus-visible:outline-border-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
    stateClasses(size, variant, active),
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href !== undefined) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={classes}
        {...(props as ComponentPropsWithRef<"a">)}
      />
    );
  }

  const { tabIndex, type = "button", ...buttonProps } = props as ComponentPropsWithRef<"button">;

  return (
    <button
      type={type}
      className={classes}
      aria-selected={selected}
      role="tab"
      tabIndex={tabIndex ?? 0}
      {...buttonProps}
    />
  );
}

type TabListProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
  defaultSelectedIndex?: number;
  /** `fill`은 탭이 붙어 밑줄을 잇는다. `track`은 목록이 트랙을 그리고 탭이 그 위에 인디케이터를 덮는다. */
  layout?: "fill" | "track";
  /**
   * `nav`는 URL로 전환하는 링크 목록이다. 선택 상태가 URL에서 오므로 내부 상태도
   * 로빙 tabindex도 두지 않고 children을 그대로 렌더한다.
   *
   * children을 훑어 링크 여부를 판별하지 않는다. Server Component에서 만든
   * `<Tab>`은 element.type이 client reference라 `child.type === Tab` 비교가
   * 항상 false다. 그러면 탭이 통째로 사라진다.
   */
  mode?: "tabs" | "nav";
  onSelectedIndexChange?: (index: number) => void;
  selectedIndex?: number;
};

const layoutClasses: Record<NonNullable<TabListProps["layout"]>, string> = {
  fill: "w-[390px]",
  track: "border-border-default border-b-w-xl w-full gap-3 md:w-fit",
};

/* TabProps는 유니온이라 링크형(`<a>`)에는 disabled가 없다. `in`으로 좁혀서 읽는다. */
function isDisabled(tab: ReactElement<TabProps>) {
  return "disabled" in tab.props && Boolean(tab.props.disabled);
}

export function TabList({
  children,
  className,
  defaultSelectedIndex,
  layout = "fill",
  mode = "tabs",
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
    if (defaultSelectedIndex !== undefined) return defaultSelectedIndex;

    /* disabled 탭은 초기 선택에서 제외한다. Tab이 active = selected && !disabled 로
       계산해 시각적 선택 상태가 사라지는데, 로빙 tabindex의 유일한 0이 포커스를
       못 받는 버튼에 박혀 탭리스트 전체가 키보드로 진입 불가가 된다. */
    const selectedChildIndex = tabs.findIndex((tab) => tab.props.selected && !isDisabled(tab));
    if (selectedChildIndex >= 0) return selectedChildIndex;

    return tabs.findIndex((tab) => !isDisabled(tab));
  });
  const activeIndex = selectedIndex ?? uncontrolledIndex;
  const classes = ["flex items-center", layoutClasses[layout], className].filter(Boolean).join(" ");

  if (mode === "nav") {
    return (
      <nav className={classes} {...props}>
        {children}
      </nav>
    );
  }

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
    <div className={classes} onKeyDown={handleKeyDown} role="tablist" {...props}>
      {tabs.map((tab, index) => {
        // 이 분기의 탭은 전부 버튼형이다. 유니온이라 좁혀서 꺼낸다.
        const { disabled, onClick } = tab.props as ComponentPropsWithRef<"button">;

        return cloneElement(tab, {
          key: tab.key ?? index,
          onClick: (event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);
            if (!event.defaultPrevented && !disabled) selectTab(index);
          },
          selected: index === activeIndex,
          tabIndex: index === activeIndex ? 0 : -1,
        } as Partial<TabProps>);
      })}
    </div>
  );
}
