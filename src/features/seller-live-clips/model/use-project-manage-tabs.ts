"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyLives } from "@/entities/live/api/seller-live-api";
import { liveClipTab, projectManageTabs } from "@/entities/project/ui/project-sidebar";
import { useAuth } from "@/providers/auth-provider";

/**
 * 프로젝트 운영 사이드바의 메뉴. 종료된 LIVE가 하나라도 있을 때만 LIVE 클립 관리를 붙인다.
 * 확인 중이거나 조회가 실패하면 메뉴 없이 둔다 — 화면 자체는 주소로 들어와도 열린다.
 * `projectId`를 비우면 확인하지 않는다(운영 사이드바를 그리지 않는 화면).
 */
export function useProjectManageTabs(projectId: string | undefined) {
  const { state } = useAuth();
  const owner = state.user?.memberId;
  const endedLives = useQuery({
    queryKey: ["seller-project-ended-lives", owner, projectId],
    queryFn: ({ signal }) => getMyLives({ projectId, statuses: ["ENDED"], size: 1 }, signal),
    enabled: state.status === "authenticated" && Boolean(owner) && Boolean(projectId),
  });
  return endedLives.data?.totalElements ? [...projectManageTabs, liveClipTab] : projectManageTabs;
}
