"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { getSellerRewards } from "@/entities/project/api/reward-api";
import type { StoryPreviewResponse } from "@/entities/project/api/story-api";
import { projectDemo } from "@/features/buyer-project/model/project-demo";
import { BuyerProjectDetail } from "@/features/buyer-project/ui/buyer-project-detail";
import detailStyles from "@/features/buyer-project/ui/buyer-project-detail.module.css";
import { RewardSummary } from "@/features/buyer-project/ui/reward-summary";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { storyExtensions } from "../model/story-extensions";
import styles from "./story-editor.module.css";

/* 서버에서 불러온 프로젝트는 소유자 미리보기 응답(detail)으로 판매자·목표 금액·펀딩 현황을
   채우고 리워드를 판매자 조회로 붙인다. 데모 프로젝트는 예시 데이터를 그대로 보여준다. */
export function StoryPreview({
  content,
  projectId,
  title,
  thumbnailUrl,
  detail,
  onClose,
}: {
  content: JSONContent;
  projectId: string;
  title: string;
  thumbnailUrl: string | null;
  detail?: StoryPreviewResponse;
  onClose: () => void;
}) {
  const { state } = useAuth();
  const owner = state.user?.memberId;
  const editor = useEditor({
    extensions: storyExtensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { "aria-label": "프로젝트 소개 미리보기", tabindex: "-1" } },
  });
  const funding = detail?.fundingStatus;
  const rewards = useQuery({
    queryKey: ["seller-rewards", owner, projectId],
    queryFn: ({ signal }) => getSellerRewards(projectId, signal),
    enabled: Boolean(funding) && state.status === "authenticated" && Boolean(owner),
  });

  const storyBody = editor?.isEmpty ? (
    <p className="text-body-s text-text-secondary">작성한 프로젝트 소개가 없습니다.</p>
  ) : (
    <EditorContent
      editor={editor}
      className={`${styles.editor} text-body-s leading-[1.42] [&_.tiptap]:outline-none [&_iframe]:max-w-full [&_img]:max-w-full [&_img]:rounded-xs [&_video]:max-w-full [&_video]:rounded-xs`}
    />
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="l"
      title="미리보기"
      className="h-[672px] sm:mt-[clamp(20px,calc((100dvh-672px)/2),114px)] [&>div]:gap-6"
    >
      <div className="bg-layer-surface-disabled mx-auto min-h-full w-full max-w-[812px]">
        <p className="text-caption-s text-text-secondary mx-auto max-w-[390px] px-5 py-3">
          {funding
            ? "제목·썸네일·상품 소개는 현재 작성 내용이며, 나머지 정보는 저장된 프로젝트 정보입니다."
            : "제목·썸네일·상품 소개는 현재 작성 내용이며, 나머지 정보는 예시입니다."}
        </p>
        <BuyerProjectDetail
          projectId={projectId}
          activeTab="story"
          hasLive={false}
          preview
          server={funding}
          project={
            funding
              ? {
                  title: title || "프로젝트 제목",
                  seller: detail?.seller?.displayName ?? "",
                  image: thumbnailUrl ?? "",
                  poster: "",
                  rate: funding.achievementRate.toLocaleString("ko-KR"),
                  amount: funding.currentAmount.toLocaleString("ko-KR"),
                  goal: detail?.goalAmount?.toLocaleString("ko-KR") ?? "—",
                }
              : { ...projectDemo, title: title || "프로젝트 제목", image: thumbnailUrl ?? "" }
          }
          fundingAction={
            <Button disabled className={detailStyles.funding}>
              펀딩하기
            </Button>
          }
          storyContent={storyBody}
          /* 구매자 모바일 상세와 같이 소개 아래에 리워드를 붙인다. tabContent가 있으면
             storyContent 대신 이 내용이 표시된다. */
          tabContent={
            funding ? (
              <>
                {storyBody}
                <RewardSummary
                  rewards={rewards.data}
                  isPending={rewards.isPending}
                  isError={rewards.isError}
                  onRetry={() => void rewards.refetch()}
                />
              </>
            ) : undefined
          }
        />
      </div>
    </Modal>
  );
}
