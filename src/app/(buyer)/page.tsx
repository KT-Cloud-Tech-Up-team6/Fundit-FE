import Link from "next/link";
import { ProjectStatusCard } from "@/entities/project/ui/project-status-card";
import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function HomePage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · Home"
      title="라이브로 발견하고, 펀딩으로 함께 만드세요."
      description="추천 프로젝트와 진행 중인 LIVE, 카테고리 탐색의 진입점입니다."
      screenIds="B-01"
      access="public"
      sections={["LIVE 히어로", "추천 프로젝트", "카테고리 탐색"]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <ProjectStatusCard label="프로젝트" value="목록 연결 예정" />
        <ProjectStatusCard label="진행 중 LIVE" value="스트림 연결 예정" />
        <Link href="/search" className="rounded-2xl bg-brand p-5 font-bold text-white">
          프로젝트 검색하기 →
        </Link>
      </div>
    </PagePlaceholder>
  );
}
