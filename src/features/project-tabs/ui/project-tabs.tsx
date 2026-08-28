import Link from "next/link";

const tabs = [
  "story",
  "live-proof",
  "news",
  "community",
  "supporters",
  "refund-policy",
  "reward-info",
] as const;

export function ProjectTabs({ projectId, activeTab }: { projectId: string; activeTab: string }) {
  return (
    <nav aria-label="프로젝트 상세 탭" className="flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={`/projects/${projectId}?tab=${tab}`}
          className={`text-label-l rounded-full px-3 py-2 whitespace-nowrap ${activeTab === tab ? "bg-layer-surface-primary text-text-inverse" : "bg-layer-surface-disabled"}`}
        >
          {tab}
        </Link>
      ))}
    </nav>
  );
}
