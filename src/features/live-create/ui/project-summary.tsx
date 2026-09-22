import Image from "next/image";
import { Icon } from "@/shared/components/ui/icon";

/**
 * LIVE 생성 화면의 프로젝트 요약 카드(FL_S_LV_CREATE_5·8).
 *
 * 숫자·기간이 `null`을 허용하는 이유: 실제 API로 연결하면 프로젝트 하나를 id로 읽는
 * `GET /api/v1/projects/{id}/preview`에 펀딩 기간·참여자 수·현재 모금액이 없다. 0으로 채우면
 * 카드가 사실과 다른 말을 하므로 자리는 두고 값이 없다고 적는다.
 */
export type LiveProjectSummary = {
  id: string;
  title: string;
  category: string;
  period: string;
  participantCount: number | null;
  currentAmount: number | null;
  goalAmount: number | null;
  image: string;
};

const won = (value: number | null, missing: string) =>
  value === null ? missing : `${value.toLocaleString("ko-KR")}원`;

export function ProjectSummary({
  action,
  project,
}: {
  action?: React.ReactNode;
  project: LiveProjectSummary;
}) {
  return (
    <div className="border-w-xs border-border-default flex items-center justify-between gap-3 rounded-xs p-3">
      <div className="flex min-w-0 flex-1 gap-4">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            width={82}
            height={82}
            className="size-[82px] shrink-0 rounded-xs object-cover"
          />
        ) : (
          <span className="bg-layer-bg text-caption-s text-text-secondary flex size-[82px] shrink-0 items-center justify-center rounded-xs">
            이미지 없음
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-body-strong truncate">{project.title}</p>
          <p className="text-caption-m text-text-secondary flex min-w-0 items-center gap-1 truncate">
            <span>{project.category || "카테고리 정보 없음"}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{project.period || "기간 정보 없음"}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Icon name="people" className="size-3.5" />
              {project.participantCount === null
                ? "참여자 정보 없음"
                : `${project.participantCount}명`}
            </span>
          </p>
          <p className="mt-3 flex items-baseline gap-1">
            <span className="text-title-s">{won(project.currentAmount, "모금액 정보 없음")}</span>
            <span className="text-body-s text-text-secondary">
              / {won(project.goalAmount, "목표액 정보 없음")}
            </span>
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}
