# 구매자 프로젝트 상세 와이어프레임

## Design Source

- [공유 Figma 지정 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=645-6663)의 9월 9일 17:51 변경 이력에 추가된 화면을 반영한다.
- 프로젝트 상세 `FL_B_PJ_DTL`(784:7696), LIVE 체크 `FL_B_PJ_LIVE`(784:7795)가 대상이다. 관련 작업은 [Issue #65](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/65)다.

## 확인 경로

- `/projects/demo-project`에서 리워드 정보를 확인한다. 기존 canonical 쿼리 `?tab=story`를 유지한다.
- `/projects/demo-project?tab=live-proof`에서 다시보기·숏 클립·LIVE Q&A를 확인한다.
- Storybook `Features/BuyerProject/Detail`의 Default, LiveCheck, InformationTip, FundingSelection에서 상태와 동작을 확인한다.
- 원본은 390px 기준이며 넓은 화면에서는 중앙 정렬한다. 기기 상태바·홈 인디케이터는 복제하지 않는다.

## 구현 범위

- 전용 헤더, 상품 이미지 목업, 판매자·펀딩 정보, AI 요약, 가로 탭, 상품 소개 이미지, LIVE 콘텐츠 목록, 찜·펀딩 하단 버튼을 구현한다.
- 원본 SVG와 상품 소개 이미지를 사용한다. 동일한 공유·찜·질문 아이콘과 기존 리워드 선택 시트를 재사용한다.
- 찜은 로컬 상태다. 공유는 현재 프로젝트 탭 URL을 복사한다. 안내 버튼은 클릭으로 열고 Escape 또는 포커스 이탈로 닫는다.
- 안내 툴팁(784:7996)은 회색 배경·왼쪽 꼬리·11px Medium·두 문단을 원본대로 적용한다. 작은 화면에서는 화면 안에 들어오도록 너비를 줄인다. Storybook LiveInformationTip에서 LIVE Q&A 안내도 확인한다.
- LIVE 체크의 찜 수는 원본의 `9999+` 축약 표시를 유지하고, 리워드 정보 탭은 로컬 찜 수를 표시한다.
- 영상 식별자와 재생 주소가 없어 다시보기·숏 클립 클릭은 목업 안내만 표시한다. 상품 이미지 카운터와 진행 중 라이브 썸네일도 정적 예시다.
- 원본의 달성률 `10,000%`와 모금액 `2,000,000 / 10,000,000원`은 서로 맞지 않지만 임의로 계산하거나 변경하지 않는다. 탭의 `000`도 디자인 예시다.
- 리워드 선택 시트의 기존 목업 상품 데이터는 유지한다. 상세 예시와 실제 데이터 연동은 별도 작업이다.
- API·실제 영상 재생·영구 저장·권한 검증은 포함하지 않는다.

## 라우팅 경계

- 프로젝트 페이지를 `(buyer-project)` 그룹에 두고 두 구현 탭에만 전용 화면을 적용한다. URL은 바뀌지 않는다.
- 나머지 기존 허용 탭은 BuyerShell과 placeholder를 유지한다. 알 수 없는 탭은 기존처럼 story로 처리한다.
- app에서 상세 화면과 FundingCta를 조합한다. 상세 기능은 리워드 선택 기능을 직접 import하지 않는다.
