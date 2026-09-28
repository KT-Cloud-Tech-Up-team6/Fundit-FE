import Image from "next/image";
import { Icon } from "@/shared/components/ui/icon";
import type { LiveProjectSummary } from "../model/live-project";

const won = (value: number | null, missing: string) =>
  value === null ? missing : `${value.toLocaleString("ko-KR")}원`;

/** LIVE 생성 화면의 프로젝트 요약 카드(FL_S_LV_CREATE_5·8). 값이 없는 칸은 없다고 적는다. */
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
            /* 업로드 이미지는 S3 원격 주소다. next/image 원격 호스트 허용이 없어 최적화를 거치면
               개발 서버는 오류, 운영은 400이 난다. 내 프로젝트 카드(seller-project-card)와 같게 둔다. */
            unoptimized={/^https?:\/\//.test(project.image)}
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
