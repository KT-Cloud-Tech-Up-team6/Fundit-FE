# 구매자 관심 목록

## Design Source

- [찜 프로젝트 `889:8761`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=889-8761), [팔로잉 `889:8856`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=889-8856).
- `/my/wishlist`와 `?tab=sellers`에서 확인한다. 전용 `(buyer-wishlist)` 그룹을 사용한다.

## 구현 범위

- 프로젝트 목록·종료 표시·판매자 목록·광고 자리와 탭을 구현한다. 실제 광고 서비스는 연결하지 않는다.
- 찜·팔로우 해제는 현재 화면의 목업 목록에서 즉시 제거하고 개수를 갱신한다. 모두 제거하면 빈 상태를 표시한다.
- 탭은 URL로 복원하며 목업 목록은 새로고침·페이지 이탈 시 초기화한다. 검색 화면과 동기화하거나 서버에 저장하지 않는다.
- 프로젝트는 기존 상세 경로로 연결하며 판매자 상세 목적지는 미정이라 링크를 만들지 않는다.
- 검색 PR의 공통 판매자 행을 재사용한다. 공통 계정 상단바는 마이페이지·환불 내역에서도 사용한다.
- Tailwind CSS로 작성하며 OS 상태 표시줄·홈 인디케이터를 그리지 않는다.

## 검증

- Storybook `Features/BuyerWishlist`의 Projects, Sellers, Empty, RemoveItems.
- RemoveItems에서 전체 해제·개수 갱신·빈 상태·키보드 탭 전환을 검증한다.
- 원본의 종료 프로젝트 글자색 `#959595`는 흰 배경 대비가 2.99:1로 접근성 검사에서 경고된다. 비선택 탭에도 같은 색상 경고가 남아 있으며 색상 변경은 디자인 확인 후 반영한다.
