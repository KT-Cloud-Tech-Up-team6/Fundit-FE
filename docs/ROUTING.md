# 라우팅 설계

IA v1.2와 `FE_화면명세_컴포넌트계층_라우팅설계서_v1.2_최신화.docx`를 기준으로 한 프론트엔드 canonical route입니다. 모달·드로어·시트·패널은 독립 URL을 만들지 않고 상위 화면에서 상태로 관리합니다.

표의 `상태`는 화면 구현 상태만 나타냅니다. `접근 조건`은 목표 설계 계약이며, 실제 인증·판매자 동의·소유권 가드는 세션과 API 계약 확정 후 별도 구현합니다.

## Design Source

- 구매자 라이브 시청·다시보기·숏 클립의 데스크톱 확장은 [Figma `1525:43622`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1525-43622)와 #156 기준이다. 기존 `/live/[liveId]`, `?mode=replay`, `?mode=replay&view=clip`을 유지하며 1200px 이상에서 3열 UI를 표시한다. 원본 지시와 승인된 다시보기 로컬 채팅·세로 타임라인 처리는 [BUYER_LIVE_ROOM.md](./BUYER_LIVE_ROOM.md#데스크톱-확장-156), [BUYER_LIVE_REPLAY.md](./BUYER_LIVE_REPLAY.md#데스크톱-확장-156)에 기록한다.

- 구매자 LIVE 목록·프로젝트 상세의 1200px 이상 데스크톱 확장은 [Figma `1419:48997`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1419-48997)와 #154 기준이다. 텍스트·박스 지시 및 구현·미연동 범위는 [BUYER_LIVE_MAIN.md](./BUYER_LIVE_MAIN.md#데스크톱-확장-154), [BUYER_PROJECT_DETAIL.md](./BUYER_PROJECT_DETAIL.md#데스크톱-확장-154)에 기록한다. 기존 구매자 URL과 모바일 흐름을 유지한다.

- 판매자 펀딩 관리는 [최신 Figma `1328:48252`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1328-48252)와 [Issue #150](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/150)을 기준으로 합니다. 화면 `1328:48253`, 요약 `1328:48257`, 참여 현황 `1328:48313`, 리워드 표 `1328:48370`, 화면 정의 `1328:48379`, 이력 `1328:49904`와 섹션 전체 이미지를 확인했습니다. 섹션 내부 `interaction_spec`·개발자 주석·prototype reaction은 검사 결과 없습니다.
- `/seller/projects/vacuum-cleaner?tab=funding`에서 최신 화면을 확인합니다. 프로젝트 목록의 기존 목업 ID·제목·썸네일·금액·후원자 수를 재사용하며, 다른 프로젝트에 청소기의 상세 통계를 복제하지 않습니다. 알려지지 않은 ID나 준비중 프로젝트로 펀딩 현황을 직접 요청하면 404입니다. 상세 목업이 없는 기존 프로젝트는 추가 집계값을 `—`, 리워드 표를 정보 없음으로 표시합니다.
- 2026-09-18 사용자 승인에 따라 원본의 제작·배송 breadcrumb는 `내 프로젝트 > 펀딩 관리`, 복귀는 `/seller/projects`로 맞춥니다. 원본에서 서로 다른 요약·참여 금액은 같은 데이터로 표시하고, 청소기 리워드 예시 5행의 합계도 모금액 1,280,000원에 맞춥니다. 달성률 128%는 숫자와 접근성 정보로 유지하고 막대는 100%까지 채웁니다. 목표 달성 배지는 목업 금액이 양수 목표액 이상일 때 표시하며 D-day는 기존 목록의 목업 문구입니다. 운영 상태·집계 정책을 확정한 것은 아닙니다.
- PDF 다운로드는 비활성화합니다. 하단은 1페이지와 비활성 이전·다음만 표시하며, PDF 출력 범위와 페이지네이션 대상·크기·정렬 규칙은 정의 확정 후 연결합니다. 실제 집계 API·권한 검증은 미연동입니다. 커뮤니티·정산 링크의 목적지는 기존 placeholder이며 해당 화면 구현은 포함하지 않습니다. 모바일 별도 원본은 지정 섹션에 없으므로 기존 반응형 관례로 카드 줄바꿈과 표 내부 가로 스크롤을 적용합니다.
- #169에서 최신 섹션·화면 정의·히스토리와 기존 승인 결정을 재대조했습니다. 모델 검사 7개와 실제 앱의 목록 진입·탭 이동·뒤로 가기·목록 복귀·기존 URL 리다이렉트, 128%·68%·종료 상태, 상세 집계 없음, 잘못된 ID·준비중 프로젝트의 404를 검증했습니다. 1440px·390px에서 금액 정합성·PDF/페이지 비활성·카드 배치·표 내부 키보드 스크롤·페이지 가로 넘침 없음을 확인했습니다. 추가 소스 변경은 필요하지 않았으며 공통 반응형 #165의 통합 검증과 실제 API 연동은 별도입니다.

- 구매자 취소·환불·교환 내역은 [BUYER_REFUNDS.md](./BUYER_REFUNDS.md)를 참고한다. `/my/refunds`는 전용 `(buyer-refunds)` 그룹의 조회 목업이며 삭제된 저장 버튼은 포함하지 않는다.

- 구매자 마이페이지 메인은 [BUYER_MYPAGE.md](./BUYER_MYPAGE.md)를 참고한다. `/my`는 전용 `(buyer-mypage)` 그룹에서 공통 계정 상단바와 기존 구매자 하단 메뉴를 사용하는 목업 화면이다.

- 구매자 관심 목록은 [BUYER_WISHLIST.md](./BUYER_WISHLIST.md)를 참고한다. `/my/wishlist`는 전용 `(buyer-wishlist)` 그룹의 목업 화면이며 인증·API는 후속 구현한다.

- 구매자 통합 검색은 [BUYER_SEARCH.md](./BUYER_SEARCH.md)를 참고한다. `/search`는 전용 `(buyer-search)` 그룹의 목업 화면이며 인증·API는 후속 구현한다.

- 구매자 프로젝트 상세는 [BUYER_PROJECT_DETAIL.md](./BUYER_PROJECT_DETAIL.md)를 참고한다. `(buyer-project)` 그룹의 story·live-proof 탭은 전용 화면이며 나머지 탭은 기존 BuyerShell을 유지한다.

- 구매자 LIVE 메인은 [구현 범위와 확인 방법](./BUYER_LIVE_MAIN.md)을 참고한다. `/live`, `/live/upcoming`, `/live/[liveId]`를 전용 `(buyer-live)` 그룹에 둔다. 시청·채팅 및 다시보기 구분은 [BUYER_LIVE_ROOM.md](./BUYER_LIVE_ROOM.md)를 참고한다. 다른 구매자 화면은 기존 BuyerShell을 유지한다.

- 구매자 카테고리 리스트 `/categories/[slug]`는 전용 헤더·하단 탭을 사용하는 `(buyer-category)` 그룹에 둔다. 현재 카테고리와 소분류는 화면 확인용 목업이다. `BuyerBottomNavigation`의 카테고리 탭은 `/categories/tech-appliances`(첫 번째 카테고리)로 진입하며, 진입 시 현재 경로를 `sessionStorage`(`buyer-category-return-path`, `src/shared/lib/category-return-path.ts`)에 기록해뒀다가 카테고리 탭을 다시 누르면 그 경로로 돌아간다. 기록이 없으면(예: 카테고리 탭을 거치지 않고 처음 들어온 딥링크) 홈으로 대체하고, 새로고침으로는 기록이 사라지지 않는다.
  이 기록을 "카테고리 영역을 실제로 벗어났을 때만" 정리하는 일은 `BuyerBottomNavigation`이 아니라 루트 레이아웃에 한 번만 마운트되는 `CategoryReturnPathGuard`(`src/providers/`)가 맡는다. 이 컴포넌트가 각 페이지마다 리마운트되거나(Next.js RSC 특성상 SNB로 카테고리 slug만 바꿔도 리마운트될 수 있다) `popstate` 리스너를 마운트/언마운트에 걸면, 뒤로가기가 유발한 같은 리렌더링이 그 리스너를 호출 전에 지워버리는 타이밍 문제가 있었다. `CategoryReturnPathGuard`는 앱 전체 내비게이션 동안 절대 언마운트되지 않으므로 `usePathname()` 변화만으로 안정적으로 감지한다 — pathname이 `/categories` 밖으로 나가면(탭 클릭이든 뒤로가기·앞으로가기든 무엇이든) 정리하고, `/categories` 내부에서 slug만 바뀌는 전환은 유지한다.
  소분류명을 누르면 `/categories/[slug]/[subcategorySlug]`(소분류 결과 목록)로 이동하며, 이 화면은 아직 `PagePlaceholder`다. 실제 진입 slug·카테고리 체계는 여전히 목업이다.

- 판매자 기본 정보·리워드 등록은 [구현 범위와 원본 프레임](./PROJECT_BASIC_INFO.md)을 참고합니다. `/seller/projects/new`에서 목업을 확인할 수 있습니다.
- 판매자 LIVE 생성·AI 큐시트·진행 콘솔은 [최신 판매자 LIVE 진행 플로우 `1230:15609`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1230-15609)와 #146 기준입니다. 기존 #36 콘솔·#32 큐시트 목업을 확장했습니다.
- 화면 정의, 작업 이력 `1230:24887`, 섹션의 관련 텍스트·화살표·제품 설명 이미지 및 프로토타입을 확인했습니다. 별도 `interaction_spec` 노드와 개발자 annotation은 없습니다. 로고 `1230:19148/19153`의 834ms 왕복 회전, 큐시트 장면 전환, 개요 접기·펼치기의 prototype reaction을 확인했습니다.
- `/seller/live`는 진행중 빈 화면 `1230:16296`과 생성 모달 `1230:16309`~`1230:16736`을 반영합니다. 카테고리 hover·선택 상태를 유지하고, 프로젝트 선택·300자 소개·확인·취소·AI 큐시트 저장 후 복귀·저장 툴팁을 제공합니다. 목록·수치는 목업에서 계산하며 Figma의 준비중 1·완료 4를 실제 데이터인 것처럼 고정하지 않습니다.
- 지시문 `1230:19039`에 따라 예약하지 않으면 날짜·시각을 현재 로컬 시간으로 표시하고 비활성화합니다. 모달을 열거나 예약을 해제할 때 갱신합니다. 예약 입력은 로컬 상태이며 서버 예약·임시저장·불러오기는 연동 대기입니다.
- AI 큐시트 `1230:17354`~`1256:26837`은 대화·요약·유형·최대 10분 설정·생성 중·편집 화면을 제공합니다. 새 대화는 하단으로 스크롤하고(`1230:17616`), 편집 진입 시 개요 필드에 포커스합니다. 저장하면 생성 확인 화면으로 복귀하고 저장 툴팁을 표시합니다(`1256:26879`, `1256:26786`). 구간 추가·순서·제목·개요·대사를 수정하며, 전체 시간은 유지합니다. 로컬 생성은 입력값을 템플릿에 반영하며 실제 AI 분석·추천은 아닙니다.
- `/seller/live/demo-live/console`은 송출 전 화면 `1299:32829`입니다. 전용 `(live-console)` 라우트에서 공통 `SellerShell`을 사용합니다. 2026-09-18 사용자 결정으로 최신 Figma에 없는 시작·종료·리허설·설정 조작은 추가하지 않았고, 생성 모달의 LIVE 시작도 비활성화했습니다. 송출 중·종료·LIVE 체크 상태는 Storybook `Features/LiveConsole/Console`에서 검증하며 실제 URL로의 상태 전환은 보류입니다.
- 송출 중 `1299:32857`~`1299:34047`은 원본 포스터, 큐시트 개요 접기·펼치기, 질문 원문, 수정 가능한 답변, 채팅 전송, 별도 답변 완료 처리, 집계 Q&A를 제공합니다. 질문은 목업 원문 수 내림차순이며 실제 질문 수집·AI 집계·자동 답변·주기 갱신은 연동 대기입니다. 수동 완료만으로 답변·채팅을 만들지 않습니다. `1299:33921`의 키워드는 Medium 14px, 나머지는 Regular 14px입니다. 답변 근거 영역의 ‘정보 이미지, 글 (없을 시 생략)’은 구현 지시로 해석해 문구 자체를 UI에 표시하지 않고, 근거 이미지가 있는 질문에만 해당 이미지를 표시합니다.
- 종료 모달·LIVE 체크 `1299:32969`~`1299:33587`은 질문 선택·전체 선택·보낸 답변·원문 탐색과 최하단 스크롤(`1299:34164`)을 제공합니다. 원문 보기에서 돌아와도 선택은 유지됩니다. 실제로 보낸 답변만 로컬 게시 대상으로 선택하며, 서버 게시 없이 로컬 결과만 남깁니다.
- #168에서 오류 카드 `1475:41746`을 반영했습니다. 추천 답변이 없는 미답변 질문은 경고색 테두리·문구·아이콘과 건수 배경으로 구분하며 제목은 기존 답변 불가 화면, 건수는 원문 목록으로 연결됩니다. 수동 완료하면 경고를 해제하고 완료 스타일을 적용하며, 답변·채팅·집계 Q&A를 새로 만들지 않습니다. 회귀 시나리오 `UnavailableQuestionCard`로 원문 6건·완료 전환·집계 2건 유지를 검사합니다. 실제 생성 URL의 예약 비활성·현재 시간, 카테고리 선택, AI 큐시트 자동 포커스·저장·재열기·복귀와 브라우저 history, 콘솔의 답변 전송·완료·LIVE 체크 선택 보존을 재검증했습니다. 송출 중·종료 상태는 Storybook 목업으로 검사했으며 실제 송출 조작은 기존 보류 범위입니다.
- 실제 송출·카메라·마이크·AI·API·실시간 채팅·인증·소유권 검증·영구 저장은 포함하지 않습니다. 큐시트와 콘솔 간 데이터 전달도 송출 진입과 함께 연동 대기입니다. 새로고침·페이지 이동·ID 변경 시 목업 상태는 초기화됩니다. 디자인 예시의 질문·답변에는 서로 다른 내용이 있으므로 제품의 실제 성능으로 사용하지 않습니다.
- 구매자 제작·배송 현황은 [공유 Figma의 제작·배송 현황 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1132-21822)을 기준으로 하며 관련 작업은 [Issue #70](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/70), 최신 디자인 반영은 [Issue #135](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/135), 데스크톱 반응형은 [Issue #186](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/186)입니다. `/my/fundings/[fundingId]/fulfillment`(요약)와 `.../fulfillment/history`(전체 이력)는 판매자와 같은 `fulfillment-tracking` 슬라이스를 확장한 조회 목업입니다. `(buyer-fulfillment)` 그룹으로 OS 상태바·홈 인디케이터는 그리지 않으며, 1199px 이하에서는 자체 프로젝트명 헤더만 쓰고 전역 네비게이션은 그리지 않습니다. 1200px 이상에서는 모바일 트리를 숨기고 `BuyerDesktopHeader`와 데스크톱 레이아웃(793px 콘텐츠 열)을 씁니다.
  - 원본 화면은 1548:51411·51492·51586·51644입니다. 현재 단계 오른쪽 더보기는 전체 이력으로 이동하며 처음에는 진행 중인 단계만 펼칩니다(1548:51734). 각 단계는 독립 토글이고, 생산을 닫고 배송 또는 제작 착수를 펼친 원본 상태를 재현할 수 있습니다.
  - 기록은 날짜 최신순으로 정렬합니다(1548:51730). 요약은 최신 기록을 항상 펼치고 과거 기록은 개별 토글합니다. 전체 이력은 선택한 단계의 모든 기록을 줄 수 제한 없이 표시합니다. 완료 단계에는 업데이트 배지를 표시하지 않습니다.
  - 1165:16037·16046 지시대로 하단 콘텐츠 여백은 32px + 기기 safe area이고, 더보기는 상단 요약에 둡니다. 사진은 Figma 원본 에셋이며 클릭하면 기존 라이트박스를 엽니다. 완료 배지는 Figma의 `#eeeef0/#53545c`가 현재 공통 status/info·text/info 토큰과 달라 화면 한정 색상 예외로 적용합니다.
  - #174에서 최신 4개 화면과 히스토리 `1132:22416`을 대조하고, 구매자 제작 착수의 9월 12일 기록에 누락된 `지연` 상태를 반영했습니다. 완료 단계의 일반 기록에는 지연·업데이트 배지가 붙지 않으며, 단계 아이콘·기간·DLVR4 문구는 기존 구현과 일치합니다. 공통 모바일 전체 폭 변경은 #165에 포함됩니다.
  - 기본 날짜·내용은 Figma 예시(2026.09.28 기준)로 고정합니다. #70의 7일 미갱신 안내·기록 없음·미시작·완료 처리는 유지합니다. 실제 주문별 프로젝트/제작 현황 조회·인증·5단계 ↔ 배송·배송완료 enum 매핑은 `docs/OPEN_DECISIONS.md` P1이며, 판매자 상태 저장과 연동되지 않습니다.
- 구매자 참여/배송 내역은 [공유 Figma의 참여/배송 내역 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=891-8900)(이후 [필수 산출물 섹션 `1143:22492`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1143-22492)로 최신화)을 기준으로 합니다. `FL_B_MY_FUND`(목록)·`FL_B_MY_FUND_MNG`(상세)·`FL_B_MY_FUND_CL`(취소/반품·교환) 원본은 자체 상단 앱바(뒤로가기·제목·알림)를 가져 BuyerShell을 쓰지 않는 `(buyer-funding)` 그룹에 두며, 하단 메뉴는 `/my`와 동일한 공통 `compact` 네비게이션을 사용합니다. `/my/fundings`·`/my/fundings/[fundingId]`·`.../cancel`·`.../refund/new`는 같은 `funding-history` 슬라이스의 목업이고, 카드별 상태(펀딩 진행 중·펀딩 완료·제작 중·배송 중·배송 완료)와 액션 버튼 구성은 Figma를 그대로 옮긴 표시값입니다 — Funding 상태·전이는 `docs/OPEN_DECISIONS.md` P1로 미확정입니다. `FundingCancel` 컴포넌트는 `variant="cancel"`(펀딩 취소, 사진 첨부 없음)과 `variant="return"`(펀딩 반품/교환, 사진 첨부·배송비 포함)을 함께 렌더링합니다. 취소 사유 목록과 환불 계산(수수료 0·적립금 0 고정)은 배송·환불 정책 미확정(P2)에 따른 placeholder이며, 확인 후에는 제출 API가 없어 목록으로 돌아갑니다. `FL_B_MY_FUND_CL_2`(확인 모달)는 별도 URL 없이 같은 화면의 다이얼로그 상태로 구현했습니다.

## 공통·인증

| URL                                    | 화면                                | 접근 조건      | 상태        |
| -------------------------------------- | ----------------------------------- | -------------- | ----------- |
| `/auth/signup`                         | 가입 방식·약관                      | guest          | implemented |
| `/auth/signup/verify`                  | 포트원 본인인증 진행·결과 확인      | terms complete | implemented |
| `/auth/identity-verification/callback` | 모바일 PortOne 리다이렉트 결과 수신 | terms complete | implemented |
| `/auth/signup/profile`                 | 회원정보 입력                       | verified guest | implemented |
| `/auth/signup/complete`                | 가입 완료                           | verified guest | implemented |
| `/auth/login`                          | 로그인                              | guest          | implemented |
| `/auth/recovery/email`                 | 이메일 찾기                         | guest          | implemented |
| `/auth/recovery/password`              | 비밀번호 재설정                     | guest          | implemented |

약관은 `/auth/signup`의 시트로 표시합니다. `/auth/signup/verify`는 이름·생년월일·전화번호를 받아 포트원 SDK 요청에 prefill로 실어 보내고, 그 이후(통신사 선택·SMS 인증번호 입력 등)는 포트원 팝업이 자체적으로 처리합니다. `/auth/identity-verification/callback`은 모바일처럼 포트원이 팝업 대신 전체 페이지 리다이렉트를 쓰는 경우의 결과 수신 전용 라우트이며, `sessionStorage`(`fundit-auth-identity-recovery`, 10분 만료, `src/features/auth/model/auth-flow-session.ts`)로 리다이렉트 전 입력값을 복구한 뒤 원래 가입 흐름(`/auth/signup/verify`)으로 되돌립니다.

## 구매자 탐색·LIVE

| URL                                    | 화면                    | 접근 조건                 | 상태                                                    |
| -------------------------------------- | ----------------------- | ------------------------- | ------------------------------------------------------- |
| `/`                                    | 홈 (→ `/live` redirect) | public                    | 원본 없음                                               |
| `/categories/[slug]`                   | 카테고리                | public                    | implemented (목업)                                      |
| `/categories/[slug]/[subcategorySlug]` | 소분류 결과 목록        | public                    | placeholder                                             |
| `/search`                              | 통합 검색               | public                    | implemented (목업)                                      |
| `/live`                                | LIVE 메인               | public                    | implemented                                             |
| `/live/new`                            | 신규 LIVE               | public                    | placeholder                                             |
| `/live/rank`                           | 실시간 순위             | public                    | placeholder                                             |
| `/live/recommended`                    | 추천 LIVE               | public                    | placeholder                                             |
| `/live/following`                      | 팔로우 LIVE             | member                    | placeholder                                             |
| `/live/upcoming`                       | 예정 LIVE               | public                    | implemented (목업)                                      |
| `/live/search`                         | LIVE 검색·결과          | public                    | placeholder                                             |
| `/live/[liveId]`                       | LIVE 방송·채팅·다시보기 | read public, write member | live / replay implemented (목업)                        |
| `/projects/[projectId]`                | 프로젝트 상세 탭        | public 또는 조건부        | story·live-proof implemented (목업), 나머지 placeholder |

## 펀딩·결제

| URL                             | 화면                    | 접근 조건          | 상태        |
| ------------------------------- | ----------------------- | ------------------ | ----------- |
| `/funding/[projectId]/checkout` | 주문서·배송지·쿠폰·결제 | member + selection | implemented |
| `/payment/result`               | 결제 결과 (주문 완료)   | member             | implemented |

주문서(`FL_B_PY_ORD`)와 결제 결과(`/payment/result` = 주문 완료 `FL_B_PY_CMPL`)는 전용 헤더만 두는 결제 흐름이라 `(checkout)` 그룹에 두고 `BuyerShell`(전역 헤더·하단 탭)을 사용하지 않습니다. `(buyer-live)`·`(live-console)`과 같은 방식이며 URL은 바뀌지 않습니다. 최신 [결제 Figma 1132:11646](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1132-11646)와 #132 기준으로 리워드 누적 선택 → 주문서 → 데모 완료를 메모리 세션으로 연결합니다. 배송지·쿠폰·카드·할부 선택은 모바일에서 주문서의 바텀시트이고, 1200px 이상에서는 같은 시트가 공통 Modal/m(588px) 크기의 중앙 다이얼로그로 전환합니다. 주문서와 완료 화면의 헤더도 모바일은 `CheckoutTopBar`, 1200px 이상은 `BuyerDesktopHeader`를 사용합니다. 배송지와 결제수단을 확인한 뒤 실제 청구 없이 완료 화면으로 교체 이동하며, 최신 지시문 1132:15066에 따라 10초 후 `/my/fundings`로 교체 이동합니다. 프로젝트 공유는 현재 주문의 프로젝트 링크를 복사합니다.

스타터는 정가 219,900원·판매가 199,000원·무료배송이며 누적 수량·얼리버드·유효 쿠폰·적립금으로 최종 금액을 계산합니다. 주문·배송지 정보는 브라우저 저장소에 기록하지 않으며 새로고침 시 초기화합니다. 선택 없는 주문서·영수증 없는 완료 URL은 안내와 복귀 링크를 표시합니다. 기존 펀딩 내역은 별도 조회 목업이며 주문 저장·목록 동기화는 포함하지 않습니다.

결제 시트는 공통 BottomSheet의 내부 간격을 맞추기 위해 범위가 제한된 CSS Module을 사용합니다. 비활성 CTA는 이 영역 Figma의 `button/disabled` 값 `#cdced4`를 사용합니다. 기존 공통 보조 버튼 색과 달라 이 영역에만 예외를 적용합니다.

PG·서버 주문 검증·인증, 실제 쿠폰·적립금·배송지 저장은 외부 연동 대기입니다. 카드별 무이자 정책 API가 없어 신한카드의 Figma 예시만 할부 옵션을 제공하고 다른 카드는 일시불을 제공합니다.

리워드 선택(`FL_B_PY_RWRD`)은 IA에서 프로젝트 상세의 바텀시트이므로 독립 URL을 두지 않습니다. `/funding/[projectId]/rewards`로 들어오면 `/projects/[projectId]`로 redirect하고, 시트는 상세 화면의 `펀딩하기` 상태로 엽니다.

#172에서 최신 주문서 `1534:54000`과 CTA 히스토리 `1534:54171`에 따라 동의 UI·약관 시트를 제거하고 결제 버튼을 상시 활성화했습니다. 클릭 시 배송지·결제수단 오류와 중복 완료 방지는 유지합니다. 일시불 `1441:71942`의 primary 글자색은 기존 #202125와 일치해 변경하지 않았습니다. 리워드 `1441:72103` 누적/수량, 쿠폰·적립금·주소검색 결과 적용·카드/할부 즉시 닫힘, 실제 영수증·공유·10초 자동/수동 이동·뒤로 가기·새로고침 가드를 검사했습니다. 주소검색 공급자는 테스트 목업으로 검증했으며 실제 외부 서비스 연결은 별도입니다. #165와 로컬 통합해 320·768·1199px 전체 흐름을 확인했습니다. #159는 열린 별도 이슈로 관련 원격 브랜치/PR은 검사 시 없었으며 웹 결제 영역은 이번 범위에 포함하지 않았습니다.

향후 PG 결제 화면은 외부 SDK·창으로 처리하고 결과는 `/payment/result`에서 서버 재조회로 복구합니다.

## 마이·고객센터

| URL                                            | 화면                     | 접근 조건        | 상태               |
| ---------------------------------------------- | ------------------------ | ---------------- | ------------------ |
| `/my`                                          | 마이페이지               | member           | implemented (목업) |
| `/my/fundings`                                 | 펀딩내역                 | member           | implemented (목업) |
| `/my/fundings/[fundingId]`                     | 개별 펀딩 관리           | owner            | implemented (목업) |
| `/my/fundings/[fundingId]/cancel`              | 펀딩 취소                | owner + eligible | implemented (목업) |
| `/my/fundings/[fundingId]/fulfillment`         | 제작·배송 현황           | owner            | implemented (목업) |
| `/my/fundings/[fundingId]/fulfillment/history` | 제작·배송 세부 진행 기록 | owner            | implemented (목업) |
| `/my/fundings/[fundingId]/refund/new`          | 펀딩 반품·교환           | owner + eligible | implemented (목업) |
| `/my/refunds`                                  | 취소·환불·교환 내역      | member           | implemented (목업) |
| `/my/wishlist`                                 | 관심 목록                | member           | implemented (목업) |
| `/my/notifications`                            | 알림함                   | member           | placeholder        |
| `/my/notifications/settings`                   | 알림 설정                | member           | placeholder        |
| `/my/preferences`                              | 맞춤 정보                | member           | placeholder        |
| `/my/support/inquiries`                        | 1:1 문의                 | member           | placeholder        |
| `/my/settings`                                 | 설정                     | member           | placeholder        |
| `/my/profile`                                  | 회원정보 관리            | member           | placeholder        |
| `/my/addresses`                                | 배송지 관리              | member           | placeholder        |
| `/support/faq`                                 | FAQ                      | public           | placeholder        |
| `/support/notices`                             | 공지사항                 | public           | placeholder        |

## 판매자

| URL                                                  | 화면                    | 접근 조건               | 상태                                             |
| ---------------------------------------------------- | ----------------------- | ----------------------- | ------------------------------------------------ |
| `/seller/projects`                                   | 프로젝트 목록           | member + seller consent | implemented                                      |
| `/seller/live`                                       | LIVE 스튜디오 홈        | member + seller consent | implemented                                      |
| `/seller/projects/new`                               | 프로젝트 기본정보 등록  | member + seller consent | implemented                                      |
| `/seller/projects/[projectId]`                       | 프로젝트 작성·운영 탭   | owner                   | 부분 구현 (`story`·`funding`·`fulfillment` 구현) |
| `/seller/projects/[projectId]/preview`               | 구매자 화면 미리보기    | owner                   | placeholder                                      |
| `/seller/projects/[projectId]/shipping`              | 발송정보                | owner                   | implemented                                      |
| `/seller/projects/[projectId]/settlement/refunds`    | 환불·교환 관리          | owner                   | placeholder                                      |
| `/seller/projects/[projectId]/settlement/statements` | 정산 내역               | owner                   | placeholder                                      |
| `/seller/projects/[projectId]/live/new`              | LIVE 생성               | owner                   | placeholder                                      |
| `/seller/live/[liveId]/cue-sheet`                    | AI 큐시트               | live owner              | implemented                                      |
| `/seller/live/[liveId]/console`                      | LIVE 송출·채팅·Copilot  | live owner              | implemented                                      |
| `/seller/live/[liveId]/review`                       | 방송 후 검증·하이라이트 | live owner              | placeholder                                      |

`/seller/live`는 판매자 GNB의 LIVE 스튜디오 진입점이고, 프로젝트별 회차 관리는 `/seller/projects/[projectId]?tab=live`에서 처리합니다. 개인정보 동의는 최신 Figma `1539:55349`에 따라 판매자 최초 진입이 아닌 프로젝트 신규 생성마다 `/seller/projects/new`에서 받습니다. 필수 3종 동의 후 기본 정보를 작성하며, 동의 모달을 닫으면 `/seller/projects`로 돌아갑니다. #188의 동의 상태는 현재 화면에만 유지하는 프런트엔드 목업이며 서버 동의 기록은 별도 연동합니다.

## 쿼리 규칙

판매자 프로젝트의 `story` 탭은 `ProjectStoryForm`의 Tiptap 편집기와 [AI 스토리 목업](./FUNDING_AI_STORY.md)을 제공합니다. 화면은 [스토리 작성 Figma 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1242-24173)의 최신 제목·썸네일·본문 화면(`1403:37562`, `1403:37609`, `1403:37656`), 파일 선택 안내(`1403:37773`), 아이콘 선택·호버 설명(`1403:37788`)을 기준으로 합니다. 썸네일은 단일 파일을 선택하며 이름 표시와 로컬 미리보기에 사용합니다. 본문 이미지·영상은 기존 로컬 임베드를 유지합니다. 프로젝트 ID 변경 시 작성 상태를 초기화합니다. 제목 입력은 가능하지만 별도 수정 버튼은 동작 정의 확인 전까지 비활성입니다.

이미지 세로·가로 정렬 버튼은 최신 디자인과 사용자 확인에 따라 제거했습니다. 기존 이미지 묶음의 표현을 잃지 않도록 `storyImageGroup` 확장은 편집기와 미리보기에서 유지합니다. 툴바 아이콘은 상태 설명의 16px 크기를 적용하며 기본 회색에서 선택·호버 시 검정으로 바뀝니다.

#166 검증에서 전체 선택 후 인용구를 적용하면 자동 추가된 빈 문단까지 선택되어 활성 표시가 꺼지는 문제를 수정했습니다. 전체 선택을 본문 텍스트 범위로 변환한 뒤 인용구를 적용하며, 재클릭 해제와 여러 문단의 실행 취소·재실행을 확인했습니다. 원본 섹션의 화면 정의·파일 선택 지시·아이콘 상태·히스토리를 재확인했으며 섹션 내부 prototype reaction은 없습니다.

2026-09-18 격리된 headless 브라우저로 실제 작성 URL의 320·390·768·1199·1200·1440px에서 제목·썸네일·본문 미리보기, 파일 선택 및 취소 이벤트 이후 기존 값 유지, 서식 상태·호버, AI 목업 불러오기 후 편집을 검증했습니다. 본문 이미지의 미리보기 반영, 닫기·Esc·배경 클릭 복귀, 프로젝트 목록 이동과 브라우저 뒤로가기도 확인했습니다. 네이티브 파일 선택 창의 OS별 외형은 검사하지 않았으며, 공통 반응형 #165 / PR #175 병합 후 통합 검증은 별도입니다. 제목 수정·임시저장·저장 및 실제 AI·업로드·저장 연동은 기존 보류 범위입니다.

미리보기는 최신 Figma 화면(`1403:37702`, 모달 `1403:37752`)과 판매자 IA PDF 4페이지의 모달 정의를 반영합니다. 공용 `Modal`의 996px 폭과 672px 높이를 사용하고 작은 화면에서는 뷰포트에 맞춰 축소합니다. 원본의 모달 내부는 자리표시자이며, 사용자에게 전달된 상세페이지 미리보기 요구에 따라 기존 `BuyerProjectDetail`을 재사용합니다. 현재 작성한 제목·썸네일·본문을 상세페이지에 반영하고, 나머지 정보는 기존 예시 데이터임을 안내합니다. 편집기와 동일한 Tiptap 확장을 사용해 서식·이미지·영상을 유지하며, 닫기·Esc·배경 클릭으로 작성 화면에 복귀하고 다시 열면 최신 내용을 반영합니다. URL 이동은 없으며 기존 `/preview` placeholder는 사용하지 않습니다. 미리보기의 뒤로가기·탭 이동·공유·찜·후원 버튼은 비활성화하고, 하단 후원 영역은 모달 내부에 배치합니다. 실제 구매자 페이지의 기존 동작은 유지합니다. 임시저장·저장 CTA도 IA에 정의되어 있고 [소개 저장 API 명세](./API_CONTRACT.md#52-작성-흐름주요-경로)가 있지만, 콘텐츠 변환·업로드·실제 저장 연동 및 두 CTA의 세부 조건은 구현되지 않았습니다. 준비중 프로젝트의 탭 제한, AI 결과 복사하기와 재생성 시 입력 초기화는 IA와 현재 목업 사이의 남은 차이이며 이번 작업에서 변경하지 않습니다. AI 대화·생성 결과는 기존 편집기 내부 모달입니다.

- 프로젝트 상세 `tab`은 `story`, `live-proof`, `news`, `community`, `supporters`, `refund-policy`, `reward-info`, `maker`를 허용합니다.
- LIVE `mode`는 `live`, `replay`를 사용하며 서버 LIVE 상태를 최종 기준으로 삼습니다.
- 다시보기의 `view=clip`은 숏 클립 표시를 선택합니다. 구간 탐색은 화면 내부 상태로 전환합니다. 현재는 서버·영상 미연결 목업이며 [BUYER_LIVE_REPLAY.md](./BUYER_LIVE_REPLAY.md)를 참고합니다.
- 환불 `type`은 `cancel`, `defect`, `delay`를 사용하며 서버 eligibility가 진입 가능 여부를 결정합니다.
- 판매자 프로젝트 목록 `status`는 `active`, `draft`, `closed`를 사용하고 미지정·잘못된 값은 `active`로 정규화합니다.
- 판매자 프로젝트 목록 `page`는 1부터 시작하고 API 호출 시 서버 기준으로 변환합니다.
- 판매자 프로젝트 `tab`은 `story`, `rewards`, `refund-policy`, `news`, `funding`, `community`, `fulfillment`, `settlement`, `live`를 허용합니다.
- 판매자 프로젝트 편집 사이드바의 "기본 정보 수정" 탭은 아직 이 `tab` 값에 대응하는 항목이 없습니다. 값이 정해지면 이 표에 추가합니다(`docs/OPEN_DECISIONS.md` 참고).
- LIVE 검토 `tab`은 `verification`, `highlights`를 허용합니다.

## 이전 경로 호환

기존 북마크와 진행 중인 작업 링크를 보호하기 위해 아래 주소는 canonical route로 임시 redirect합니다.

| 이전 URL                                         | 이동 URL                                       |
| ------------------------------------------------ | ---------------------------------------------- |
| `/`                                              | `/live`                                        |
| `/auth/signup/terms`                             | `/auth/signup`                                 |
| `/auth/signup/done`                              | `/auth/signup/complete`                        |
| `/auth/recovery?view=email`                      | `/auth/recovery/email`                         |
| `/auth/recovery?view=password`                   | `/auth/recovery/password`                      |
| `/funding/[projectId]/payment`                   | `/funding/[projectId]/checkout`                |
| `/funding/[projectId]/rewards`                   | `/projects/[projectId]`                        |
| `/seller/projects/[projectId]/edit?section=...`  | `/seller/projects/[projectId]?tab=...`         |
| `/seller/projects/[projectId]/funding`           | `/seller/projects/[projectId]?tab=funding`     |
| `/seller/projects/[projectId]/community`         | `/seller/projects/[projectId]?tab=community`   |
| `/seller/projects/[projectId]/fulfillment`       | `/seller/projects/[projectId]?tab=fulfillment` |
| `/seller/projects/[projectId]/fulfillment/delay` | `/seller/projects/[projectId]?tab=fulfillment` |
| `/seller/projects/[projectId]/live-proof`        | `/seller/projects/[projectId]?tab=live`        |
| `/seller/live/[liveId]/setup`                    | `/seller/live/[liveId]/cue-sheet`              |

구매자 홈은 Figma에 화면 원본이 없고 [소비자 핵심 플로우 `1087:18097`](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=1087-18097)도 `LIVE 탭 이동`에서 시작합니다. 화면을 임의로 만들지 않고 `next.config.ts`의 라우팅 레벨 redirect로 `/live`에 보냅니다. 정적 라우트라 페이지 `redirect()`는 1초 `meta refresh`가 되므로 사용하지 않으며, 홈 디자인이 확정되면 되돌립니다. 목적지 미정 링크의 비활성 처리와 함께 [BUYER_FLOW_CONTINUITY.md](./BUYER_FLOW_CONTINUITY.md)에 기록합니다.

## 접근 제어 계약

현재 접근 제어 코드는 구현하지 않았습니다. 인증 세션과 API가 확정되면 아래 원칙에 따라 공통 경계에서 적용합니다.

- public 화면은 로그인 없이 읽을 수 있고 쓰기 동작에서 로그인을 요청합니다.
- member 화면은 Access Token을 확인하고 원래 목적지 `returnTo`를 보존합니다.
- seller 화면은 회원 인증을 확인합니다. 프로젝트 개인정보 동의는 신규 생성마다 별도로 받으며 서버 기록·검증은 API 연동 시 적용합니다.
- owner 화면은 URL 식별자를 신뢰하지 않고 서버에서 리소스 소유권을 재검증합니다.
- 환불·취소 등 조건부 화면은 FE 시간 계산이 아니라 서버 eligibility와 불가 사유를 따릅니다.

## 제작·배송 주문 관계 캐시

주문 UUID에서 프로젝트 UUID를 찾는 목록 조회 결과는 회원·주문별 Query Key로 5분간 재사용한다. 요약과 기록 화면을 오갈 때 같은 주문 목록을 다시 순회하지 않는다. 로그아웃 시 캐시 제거와 명시적 무효화는 유지한다. 배송·제작 현황 조회에는 이 staleTime을 적용하지 않아 최신 상태 조회를 유지한다. 회원 접근 게이트는 `providers/member-access.tsx`를 재사용한다.

최초 조회와 캐시 만료 후에는 주문 목록 페이지 순회가 필요하다. 주문 상세에 `projectId`를 제공하는 BE 계약이 생기면 직접 조회로 전환할 수 있다.

# 판매자 API 연결 보완 (#191)

- `/seller/projects`는 인증 후 서버 목록·검색·상태별 개수·페이지를 조회합니다. API 오류를 로컬 목업 목록으로 대체하지 않습니다.
- `/seller/projects/[projectId]?tab=basic-info`와 `/edit?section=basic-info`는 서버 UUID의 기본정보 조회·수정으로 연결합니다. 신규 저장 후 같은 UUID 경로로 이동합니다.
- 기존 데모 ID의 관리 화면은 유지합니다. 서버 UUID는 기본정보·리워드·스토리·펀딩·새 소식·커뮤니티·제작배송 API 화면으로 연결합니다. 환불 정책·정산·LIVE 등 미연결 탭은 준비 중으로 표시하며 다른 프로젝트의 목업을 보여주지 않습니다.
- 준비중의 수정일·작성 단계 등 응답에 없는 값은 임의 생성하지 않습니다. 생성일은 수정일로 사용하지 않습니다.
