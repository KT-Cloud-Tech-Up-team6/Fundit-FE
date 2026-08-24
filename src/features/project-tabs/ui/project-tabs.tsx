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
          className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold ${activeTab === tab ? "bg-brand text-white" : "bg-slate-100"}`}
        >
          {tab}
        </Link>
      ))}
    </nav>
  );
}
