# 라우팅 설계

로그인과 계정 복구는 와이어프레임이 구현되었고 나머지 페이지는 레이아웃과 화면 목적을 확인할 수 있는 placeholder 상태다. 접근 조건은 설계 계약이며 실제 인증·소유권 가드는 API 계약 후 구현한다.

| 사용자 유형 | URL                                              | Route Group | 페이지 목적            | 레이아웃    | 접근 조건                 | 상태        | 관련 요구사항               |
| ----------- | ------------------------------------------------ | ----------- | ---------------------- | ----------- | ------------------------- | ----------- | --------------------------- |
| 공통        | `/auth/signup/terms`                             | `(auth)`    | 약관 확인              | AuthShell   | guest                     | placeholder | C-01, FL_C_ME_01_01         |
| 공통        | `/auth/signup/verify`                            | `(auth)`    | 본인 인증              | AuthShell   | terms complete            | placeholder | C-02, FL_C_ME_01_02         |
| 공통        | `/auth/signup/profile`                           | `(auth)`    | 회원정보 입력          | AuthShell   | verified guest            | placeholder | C-03, FL_C_ME_01_03         |
| 공통        | `/auth/login`                                    | `(auth)`    | 로그인                 | AuthShell   | guest                     | implemented | C-04, FL_C_ME_02_01         |
| 공통        | `/auth/recovery`                                 | `(auth)`    | 계정 복구              | AuthShell   | guest                     | implemented | C-05, FL_C_ME_02_01         |
| 구매자      | `/`                                              | `(buyer)`   | 홈 피드                | BuyerShell  | public                    | placeholder | B-01, FL_B_HM_01_01         |
| 구매자      | `/categories/[slug]`                             | `(buyer)`   | 카테고리 목록          | BuyerShell  | public                    | placeholder | B-02, FL_B_HM_01_02         |
| 구매자      | `/search`                                        | `(buyer)`   | 통합 검색              | BuyerShell  | public                    | placeholder | B-03, FL_B_HM_01_03         |
| 구매자      | `/my/wishlist`                                   | `(buyer)`   | 찜 목록                | BuyerShell  | member                    | placeholder | B-04, FL_B_HM_01_04         |
| 구매자      | `/live`                                          | `(buyer)`   | LIVE 목록              | BuyerShell  | public                    | placeholder | B-05, FL_B_LV_01_01         |
| 구매자      | `/live/[liveId]`                                 | `(buyer)`   | 실시간 시청·채팅       | BuyerShell  | read public, write member | placeholder | B-06–B-07, FL_B_LV_01_02–03 |
| 구매자      | `/live/[liveId]?mode=replay`                     | `(buyer)`   | LIVE 다시보기          | BuyerShell  | public                    | placeholder | B-08, FL_B_LV_01_04         |
| 구매자      | `/projects/[projectId]`                          | `(buyer)`   | 프로젝트 상세 허브     | BuyerShell  | public                    | placeholder | B-09, FL_B_PJ_01_01         |
| 구매자      | `/projects/[projectId]?tab=...`                  | `(buyer)`   | 상세 7개 탭            | BuyerShell  | public 또는 조건부        | placeholder | B-10–B-16, FL_B_PJ_01_01–07 |
| 구매자      | `/funding/[projectId]/rewards`                   | `(buyer)`   | 리워드 선택            | BuyerShell  | member                    | placeholder | B-17, FL_B_PY_01_01         |
| 구매자      | `/funding/[projectId]/checkout`                  | `(buyer)`   | 주문서                 | BuyerShell  | member + selection        | placeholder | B-18, FL_B_PY_01_02         |
| 구매자      | `/funding/[projectId]/payment`                   | `(buyer)`   | 결제 요청              | BuyerShell  | member + valid order      | placeholder | B-19, FL_B_PY_01_03         |
| 구매자      | `/payment/result`                                | `(buyer)`   | 결제 결과              | BuyerShell  | member                    | placeholder | B-20, FL_B_PY_01_03         |
| 구매자      | `/my/fundings`                                   | `(buyer)`   | 펀딩 내역              | BuyerShell  | member                    | placeholder | B-21, FL_B_MY_01_01         |
| 구매자      | `/my/fundings/[fundingId]`                       | `(buyer)`   | 개별 펀딩 관리         | BuyerShell  | owner                     | placeholder | B-22, FL_B_MY_01_02         |
| 구매자      | `/my/fundings/[fundingId]/fulfillment`           | `(buyer)`   | 제작·배송 현황         | BuyerShell  | owner                     | placeholder | B-23, FL_B_MY_02_01         |
| 구매자      | `/my/fundings/[fundingId]/refund/new?type=...`   | `(buyer)`   | 환불 신청              | BuyerShell  | owner + eligible          | placeholder | B-25, FL_B_RF_01_03~04      |
| 구매자      | `/my/refunds`                                    | `(buyer)`   | 환불 목록·상태         | BuyerShell  | member                    | placeholder | B-24, FL_B_RF_01_01~05      |
| 구매자      | `/my/notifications`                              | `(buyer)`   | 알림함·설정            | BuyerShell  | member                    | placeholder | B-26, FL_B_MY_04_01         |
| 판매자      | `/seller/projects?status=...`                    | `(seller)`  | 프로젝트 관리 홈       | SellerShell | seller                    | implemented | S-01, FL_S_PR_LIST          |
| 판매자      | `/seller/live`                                   | `(seller)`  | LIVE 스튜디오 홈       | SellerShell | seller                    | placeholder | FL_S_LV_HOME 확인 필요      |
| 판매자      | `/seller/projects/new`                           | `(seller)`  | 프로젝트 기본정보      | SellerShell | seller                    | placeholder | S-02, FL_S_PR_02_01~02      |
| 판매자      | `/seller/projects/[projectId]/edit?section=...`  | `(seller)`  | 직접·AI 상세 작성      | SellerShell | owner seller              | placeholder | S-03~S-06, FL_S_PR_03_01    |
| 판매자      | `/seller/projects/[projectId]/preview`           | `(seller)`  | 구매자 화면 미리보기   | SellerShell | owner seller              | placeholder | S-07, FL_S_PR_03_02         |
| 판매자      | `/seller/projects/[projectId]/live/new`          | `(seller)`  | 프로젝트 LIVE 생성     | SellerShell | owner seller              | placeholder | S-08, FL_S_LV_01_01         |
| 판매자      | `/seller/live/[liveId]/setup`                    | `(seller)`  | LIVE 설정·AI 큐시트    | SellerShell | live owner                | placeholder | S-09, FL_S_LV_01_02         |
| 판매자      | `/seller/live/[liveId]/console`                  | `(seller)`  | 송출·채팅·Copilot 콘솔 | SellerShell | live owner                | placeholder | S-10, FL_S_LV_01_03~04      |
| 판매자      | `/seller/projects/[projectId]/live-proof`        | `(seller)`  | 방송 종료 후 검증      | SellerShell | owner seller              | placeholder | S-11, FL_S_LV_01_05         |
| 판매자      | `/seller/projects/[projectId]/funding`           | `(seller)`  | 펀딩 현황              | SellerShell | owner seller              | placeholder | S-12, FL_S_FD_01_01         |
| 판매자      | `/seller/projects/[projectId]/community`         | `(seller)`  | 문의 관리              | SellerShell | owner seller              | placeholder | S-13, FL_S_FD_02_01         |
| 판매자      | `/seller/projects/[projectId]/fulfillment`       | `(seller)`  | 5단계 제작·배송 관리   | SellerShell | owner seller              | placeholder | S-14, FL_S_DL_01_01         |
| 판매자      | `/seller/projects/[projectId]/fulfillment/delay` | `(seller)`  | 일정 변경·지연 등록    | SellerShell | owner seller              | placeholder | S-15, FL_S_DL_02_01         |
| 판매자      | `/seller/projects/[projectId]/shipping`          | `(seller)`  | 발송 정보 등록         | SellerShell | owner seller              | placeholder | S-16, FL_S_DL_03_01         |

## 쿼리 규칙

- 프로젝트 상세 `tab`은 `story`, `live-proof`, `news`, `community`, `supporters`, `refund-policy`, `reward-info`를 허용한다. 현재 잘못된 값은 `story` UI로 정규화한다.
- LIVE `mode`는 `live`와 `replay`를 사용한다. 실제 구현에서는 서버 LIVE 상태가 최종 기준이다.
- 판매자 프로젝트 목록 `status`는 `active`, `draft`, `closed`를 사용하고 미지정과 잘못된 값은 `active`로 정규화한다. IA는 `준비중/진행중/종료`, API 명세는 `전체` 포함 4개로 서로 달라 Figma 와이어프레임(`FL_S_PR_LIST`) 기준을 따랐다.
- 판매자 프로젝트 목록 `page`는 1부터 시작한다. API `page`가 0부터라 호출 시점에 변환한다.
- 판매자 편집 `section`은 `story`, `rewards`, `policy`, `news`, `ai-story`를 사용한다.
- 환불 `type`은 `defect`와 `delay`를 사용하고 실제 폼 진입은 서버 eligibility가 결정한다.

## 가드 구현 원칙

- public 화면은 로그인 없이 읽을 수 있고 쓰기 동작에서 로그인 요청을 표시한다.
- buyer protected 화면은 member 여부를 확인하고 원래 목적지 `returnTo`를 보존한다.
- seller protected 화면은 판매자 등록과 역할을 확인한다.
- owner protected 화면은 URL을 신뢰하지 않고 서버에서 리소스 소유권을 다시 확인한다.
