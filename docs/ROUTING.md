# 라우팅 설계

IA v1.2와 `FE_화면명세_컴포넌트계층_라우팅설계서_v1.2_최신화.docx`를 기준으로 한 프론트엔드 canonical route입니다. 모달·드로어·시트·패널은 독립 URL을 만들지 않고 상위 화면에서 상태로 관리합니다.

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

| URL                                                  | 화면                    | 접근 조건               | 상태        |
| ---------------------------------------------------- | ----------------------- | ----------------------- | ----------- |
| `/seller/projects`                                   | 프로젝트 목록           | member + seller consent | implemented |
| `/seller/live`                                       | LIVE 스튜디오 홈        | member + seller consent | placeholder |
| `/seller/projects/new`                               | 프로젝트 기본정보 등록  | member + seller consent | placeholder |
| `/seller/projects/[projectId]`                       | 프로젝트 작성·운영 탭   | owner                   | placeholder |
| `/seller/projects/[projectId]/preview`               | 구매자 화면 미리보기    | owner                   | placeholder |
| `/seller/projects/[projectId]/settlement/refunds`    | 환불·교환 관리          | owner                   | placeholder |
| `/seller/projects/[projectId]/settlement/statements` | 정산 내역               | owner                   | placeholder |
| `/seller/projects/[projectId]/live/new`              | LIVE 생성               | owner                   | placeholder |
| `/seller/live/[liveId]/cue-sheet`                    | AI 큐시트               | live owner              | placeholder |
| `/seller/live/[liveId]/console`                      | LIVE 송출·채팅·Copilot  | live owner              | placeholder |
| `/seller/live/[liveId]/review`                       | 방송 후 검증·하이라이트 | live owner              | placeholder |

`/seller/live`는 판매자 GNB의 LIVE 스튜디오 진입점이고, 프로젝트별 회차 관리는 `/seller/projects/[projectId]?tab=live`에서 처리합니다. 판매자 최초 개인정보 동의는 `/seller` 진입 시 모달로 처리합니다.

## 쿼리 규칙

- 프로젝트 상세 `tab`은 `story`, `live-proof`, `news`, `community`, `supporters`, `refund-policy`, `reward-info`, `maker`를 허용합니다.
- LIVE `mode`는 `live`, `replay`를 사용하며 서버 LIVE 상태를 최종 기준으로 삼습니다.
- 환불 `type`은 `cancel`, `defect`, `delay`를 사용하며 서버 eligibility가 진입 가능 여부를 결정합니다.
- 판매자 프로젝트 목록 `status`는 `active`, `draft`, `closed`를 사용하고 미지정·잘못된 값은 `active`로 정규화합니다.
- 판매자 프로젝트 목록 `page`는 1부터 시작하고 API 호출 시 서버 기준으로 변환합니다.
- 판매자 프로젝트 `tab`은 `story`, `rewards`, `refund-policy`, `news`, `funding`, `community`, `fulfillment`, `settlement`, `live`를 허용합니다.
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

## 접근 제어 원칙

- public 화면은 로그인 없이 읽을 수 있고 쓰기 동작에서 로그인을 요청합니다.
- member 화면은 Access Token을 확인하고 원래 목적지 `returnTo`를 보존합니다.
- seller 화면은 회원 인증과 판매자 개인정보 동의를 확인합니다.
- owner 화면은 URL 식별자를 신뢰하지 않고 서버에서 리소스 소유권을 재검증합니다.
- 환불·취소 등 조건부 화면은 FE 시간 계산이 아니라 서버 eligibility와 불가 사유를 따릅니다.
