import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SellerLiveStudioPage() {
  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE"
      title="LIVE 스튜디오"
      description="판매자 GNB의 LIVE 스튜디오 진입점입니다. IA에는 LIVE가 프로젝트 상세 하위 탭(FL_S_LV_HOME)으로만 정의돼 있어 이 화면의 범위는 확인이 필요합니다."
      screenIds="S-09~S-10"
      access="seller"
      sections={["LIVE 목록", "LIVE 생성", "송출 콘솔 진입"]}
    />
  );
}
