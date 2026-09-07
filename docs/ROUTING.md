# 라우팅 설계

IA v1.2와 `FE_화면명세_컴포넌트계층_라우팅설계서_v1.2_최신화.docx`를 기준으로 한 프론트엔드 canonical route입니다. 모달·드로어·시트·패널은 독립 URL을 만들지 않고 상위 화면에서 상태로 관리합니다.

표의 `상태`는 화면 구현 상태만 나타냅니다. `접근 조건`은 목표 설계 계약이며, 실제 인증·판매자 동의·소유권 가드는 세션과 API 계약 확정 후 별도 구현합니다.

## Design Source

- 판매자 라이브 진행 콘솔은 [공유 Figma의 판매자_라이브 진행 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=310-5061)을 기준으로 합니다. 관련 작업은 [Issue #36](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/36)입니다.
- `/seller/live/demo-live/console`에서 시작 전 → 목업 방송 시작 → 질문·답변·채팅 → 종료 → LIVE 체크 선택 흐름을 확인할 수 있습니다. 상태별 화면은 Storybook `Features/LiveConsole/Console`에서 확인합니다.
- 콘솔은 전용 헤더를 위해 `(live-console)` 그룹에 두며 일반 `SellerShell`을 사용하지 않습니다. URL은 바뀌지 않습니다. 인증·소유권 가드는 아직 구현하지 않았습니다.
- 실제 송출·카메라·마이크·AI·API·실시간 채팅·영구 저장은 포함하지 않습니다. 설정·리허설은 미구현으로 비활성화하고, LIVE 체크 생성은 로컬 결과만 표시합니다.
- 질문·답변·큐시트는 예시입니다. 기존 큐시트 편집 화면과 데이터 전달은 아직 연결하지 않았습니다. 목업 시작 시 예시 답변을 채우고, 전송한 답변은 완료 목록과 채팅에 반영합니다. 목록 건수는 실제 목업 데이터에서 계산합니다.
- 콘솔 상태는 기능 내부에서만 유지하며 새로고침·페이지 이동·`liveId` 변경 시 초기화합니다. 질문 상세·모달·입력값을 URL 또는 브라우저 저장소에 복사하지 않습니다.
- 판매자 AI 큐시트는 [공유 Figma의 판매자_AI큐시트 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=415-9981)을 기준으로 합니다.
- 구현 범위는 지정 영역의 질문·요약·유형 선택·생성 상태·결과 편집·저장 후 LIVE 생성 화면입니다. 관련 작업은 [Issue #32](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/32)입니다.
- `/seller/live`에서 라이브 생성하기로 진입하거나 `/seller/live/demo-live/cue-sheet`에서 질문 화면을 바로 확인할 수 있습니다.
- AI 생성과 목록은 목업입니다. 저장은 현재 화면의 메모리 상태에만 유지되며 새로고침이나 페이지 이동 시 초기화됩니다. 실제 AI·API·송출·권한 검증은 포함하지 않습니다.
- 방송 시간은 최대 10분이며, 구간 추가 시 선택 구간의 시간을 둘로 나누어 전체 시간을 유지합니다. 제목·순서·진행 개요·대사를 수정할 수 있습니다. 건너뛴 질문은 목업 생성 시 예시 내용으로 대체합니다.

## 공통·인증

| URL                       | 화면                           | 접근 조건      | 상태        |
| ------------------------- | ------------------------------ | -------------- | ----------- |
| `/auth/signup`            | 가입 방식·약관                 | guest          | implemented |
| `/auth/signup/verify`     | 포트원 본인인증 진행·결과 확인 | terms complete | implemented |
| `/auth/signup/profile`    | 회원정보 입력                  | verified guest | implemented |
| `/auth/signup/complete`   | 가입 완료                      | verified guest | implemented |
| `/auth/login`             | 로그인                         | guest          | implemented |
| `/auth/recovery/email`    | 이메일 찾기                    | guest          | implemented |
| `/auth/recovery/password` | 비밀번호 재설정                | guest          | implemented |

약관은 `/auth/signup`의 시트로 표시합니다. `/auth/signup/verify`는 포트원 SDK 호출과 서버 검증 결과를 연결하는 프론트엔드 진행 경로이며, 본인인증 입력 화면을 직접 구현하지 않습니다.

## 구매자 탐색·LIVE

| URL                     | 화면                    | 접근 조건                 | 상태        |
| ----------------------- | ----------------------- | ------------------------- | ----------- |
| `/`                     | 홈                      | public                    | placeholder |
| `/categories/[slug]`    | 카테고리                | public                    | placeholder |
| `/search`               | 통합 검색               | public                    | placeholder |
| `/live`                 | LIVE 메인               | public                    | placeholder |
| `/live/new`             | 신규 LIVE               | public                    | placeholder |
| `/live/rank`            | 실시간 순위             | public                    | placeholder |
| `/live/recommended`     | 추천 LIVE               | public                    | placeholder |
| `/live/following`       | 팔로우 LIVE             | member                    | placeholder |
| `/live/upcoming`        | 예정 LIVE               | public                    | placeholder |
| `/live/search`          | LIVE 검색·결과          | public                    | placeholder |
| `/live/[liveId]`        | LIVE 방송·채팅·다시보기 | read public, write member | placeholder |
| `/projects/[projectId]` | 프로젝트 상세 탭        | public 또는 조건부        | placeholder |

## 펀딩·결제

| URL                             | 화면                         | 접근 조건          | 상태        |
| ------------------------------- | ---------------------------- | ------------------ | ----------- |
| `/funding/[projectId]/rewards`  | 리워드 선택                  | member             | placeholder |
| `/funding/[projectId]/checkout` | 주문서·배송지·쿠폰·결제 약관 | member + selection | placeholder |
| `/payment/result`               | 결제 결과                    | member             | placeholder |

PG 결제 화면은 외부 SDK·창으로 처리하고 결과는 `/payment/result`에서 서버 재조회로 복구합니다.

## 마이·고객센터

| URL                                    | 화면                     | 접근 조건        | 상태        |
| -------------------------------------- | ------------------------ | ---------------- | ----------- |
| `/my`                                  | 마이페이지               | member           | placeholder |
| `/my/fundings`                         | 펀딩내역                 | member           | placeholder |
| `/my/fundings/[fundingId]`             | 개별 펀딩 관리           | owner            | placeholder |
| `/my/fundings/[fundingId]/cancel`      | 펀딩 취소                | owner + eligible | placeholder |
| `/my/fundings/[fundingId]/fulfillment` | 제작·배송 현황           | owner            | placeholder |
| `/my/fundings/[fundingId]/refund/new`  | 취소·하자·지연 환불 신청 | owner + eligible | placeholder |
| `/my/refunds`                          | 환불내역                 | member           | placeholder |
| `/my/wishlist`                         | 찜                       | member           | placeholder |
| `/my/notifications`                    | 알림함                   | member           | placeholder |
| `/my/notifications/settings`           | 알림 설정                | member           | placeholder |
| `/my/preferences`                      | 맞춤 정보                | member           | placeholder |
| `/my/support/inquiries`                | 1:1 문의                 | member           | placeholder |
| `/my/settings`                         | 설정                     | member           | placeholder |
| `/my/profile`                          | 회원정보 관리            | member           | placeholder |
| `/my/addresses`                        | 배송지 관리              | member           | placeholder |
| `/support/faq`                         | FAQ                      | public           | placeholder |
| `/support/notices`                     | 공지사항                 | public           | placeholder |

## 판매자

| URL                                                  | 화면                    | 접근 조건               | 상태                                           |
| ---------------------------------------------------- | ----------------------- | ----------------------- | ---------------------------------------------- |
| `/seller/projects`                                   | 프로젝트 목록           | member + seller consent | implemented                                    |
| `/seller/live`                                       | LIVE 스튜디오 홈        | member + seller consent | implemented                                    |
| `/seller/projects/new`                               | 프로젝트 기본정보 등록  | member + seller consent | placeholder                                    |
| `/seller/projects/[projectId]`                       | 프로젝트 작성·운영 탭   | owner                   | 부분 구현 (`story`만 구현, 나머지 placeholder) |
| `/seller/projects/[projectId]/preview`               | 구매자 화면 미리보기    | owner                   | placeholder                                    |
| `/seller/projects/[projectId]/settlement/refunds`    | 환불·교환 관리          | owner                   | placeholder                                    |
| `/seller/projects/[projectId]/settlement/statements` | 정산 내역               | owner                   | placeholder                                    |
| `/seller/projects/[projectId]/live/new`              | LIVE 생성               | owner                   | placeholder                                    |
| `/seller/live/[liveId]/cue-sheet`                    | AI 큐시트               | live owner              | implemented                                    |
| `/seller/live/[liveId]/console`                      | LIVE 송출·채팅·Copilot  | live owner              | implemented                                    |
| `/seller/live/[liveId]/review`                       | 방송 후 검증·하이라이트 | live owner              | placeholder                                    |

`/seller/live`는 판매자 GNB의 LIVE 스튜디오 진입점이고, 프로젝트별 회차 관리는 `/seller/projects/[projectId]?tab=live`에서 처리합니다. 판매자 최초 개인정보 동의는 접근 제어 구현 후 `/seller/projects`, `/seller/live` 등 실제 판매자 진입 경로의 공통 경계에서 모달로 처리합니다.

## 쿼리 규칙

판매자 프로젝트의 `story` 탭은 [AI 스토리 목업](./FUNDING_AI_STORY.md)을 제공합니다. 다른 작성·운영 탭은 기존 placeholder를 유지합니다. AI 대화·생성 결과·본문 미리보기는 편집기 내부 모달이며 별도 URL을 만들지 않습니다.

- 프로젝트 상세 `tab`은 `story`, `live-proof`, `news`, `community`, `supporters`, `refund-policy`, `reward-info`, `maker`를 허용합니다.
- LIVE `mode`는 `live`, `replay`를 사용하며 서버 LIVE 상태를 최종 기준으로 삼습니다.
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
| `/auth/signup/terms`                             | `/auth/signup`                                 |
| `/auth/signup/done`                              | `/auth/signup/complete`                        |
| `/auth/recovery?view=email`                      | `/auth/recovery/email`                         |
| `/auth/recovery?view=password`                   | `/auth/recovery/password`                      |
| `/funding/[projectId]/payment`                   | `/funding/[projectId]/checkout`                |
| `/seller/projects/[projectId]/edit?section=...`  | `/seller/projects/[projectId]?tab=...`         |
| `/seller/projects/[projectId]/funding`           | `/seller/projects/[projectId]?tab=funding`     |
| `/seller/projects/[projectId]/community`         | `/seller/projects/[projectId]?tab=community`   |
| `/seller/projects/[projectId]/fulfillment`       | `/seller/projects/[projectId]?tab=fulfillment` |
| `/seller/projects/[projectId]/fulfillment/delay` | `/seller/projects/[projectId]?tab=fulfillment` |
| `/seller/projects/[projectId]/shipping`          | `/seller/projects/[projectId]?tab=fulfillment` |
| `/seller/projects/[projectId]/live-proof`        | `/seller/projects/[projectId]?tab=live`        |
| `/seller/live/[liveId]/setup`                    | `/seller/live/[liveId]/cue-sheet`              |

## 접근 제어 계약

현재 접근 제어 코드는 구현하지 않았습니다. 인증 세션과 판매자 동의 API가 확정되면 아래 원칙에 따라 공통 경계에서 적용합니다.

- public 화면은 로그인 없이 읽을 수 있고 쓰기 동작에서 로그인을 요청합니다.
- member 화면은 Access Token을 확인하고 원래 목적지 `returnTo`를 보존합니다.
- seller 화면은 회원 인증과 판매자 개인정보 동의를 확인합니다.
- owner 화면은 URL 식별자를 신뢰하지 않고 서버에서 리소스 소유권을 재검증합니다.
- 환불·취소 등 조건부 화면은 FE 시간 계산이 아니라 서버 eligibility와 불가 사유를 따릅니다.
