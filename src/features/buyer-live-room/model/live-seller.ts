/** 실제 LIVE 시청 화면의 판매자 행. onToggleFollow가 없으면(본인 LIVE) 팔로우 버튼을 그리지 않는다. */
export type LiveSeller = { name: string; following: boolean; onToggleFollow?: () => void };
