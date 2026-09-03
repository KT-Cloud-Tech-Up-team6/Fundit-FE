import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function NewLivePage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="신규 LIVE"
      description="새롭게 등록된 LIVE를 상태와 시작 시각 순으로 탐색합니다."
      screenIds="FL_B_LV_NEW"
      access="public"
      sections={["신규 LIVE 목록", "상태 배지", "무한 스크롤"]}
    />
  );
}
