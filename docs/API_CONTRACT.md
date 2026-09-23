# API 계약 초안

## 판매자 관리 조회 계약 보완 (#232)

- 2026-09-21 BE develop `ae1e032`와 FE를 대조했다. 후속 `3d23bc7`은 LIVE 변경만 포함해 이 절의 계약은 동일하다. 실제 배포 응답 검증과 소스 대조를 구분한다.
- preview의 `businessType`으로 사업자 유형을 복원한다. 리워드 목록의 `options`(groupId/groupName/values.valueId/value)를 복원하고 BE PR #108 계약에 따라 그룹 ID를 보존해 편집한다. 옵션 미변경은 생략, 전체 해제는 빈 배열로 전송한다. `simpleRefundDisabled`는 읽기 전용이다.
- 공지 목록과 별개로 `GET /api/v1/notices/{noticeId}`의 `content`를 조회한다. BE PR #108의 PATCH로 소유 판매자가 제목·본문을 수정한다. 비공개 프로젝트의 GET 제한은 남아 있다.
- 펀딩 통계의 `rewardStats`는 rewardId/optionValueId/purchasedQuantity/purchasedAmount를 사용한다. optionValueId=null은 리워드 전체 합계, 값이 있는 행은 개별 옵션 통계다. 전체·옵션 행 또는 서로 다른 옵션 그룹을 더해 매출/수량 합계를 만들지 않는다. 옵션명은 서버 리워드 옵션 ID로 연결한다.

## 알림함·수신설정과 팔로우 계약 (#257)

2026-09-22 BE develop `ce5d882`의 `NotificationController`, `NotificationService`, `NotifType`, `FollowController`, `SellerController`와 Gateway `application.yml`을 확인했다. 코드를 읽은 결과이며 실제 호출 검증은 아니다. 두 영역 모두 **BE와 Gateway는 준비됐고 FE가 막힌 이유는 서로 다르다.**

### 알림함·수신설정

Gateway는 `/api/v1/notifications/**`, `/api/v1/notification-settings/**`를 notification-service로 라우팅한다(live-service보다 먼저 매칭).

| 경로                                                | 요청 → 응답                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| GET `/api/v1/notifications`                         | page(기본 0, ≥0), size(기본 20, 1~100) → 페이지 응답. 최신순.     |
| PATCH `/api/v1/notifications/{notificationId}/read` | → `{notificationId, readAt}`                                      |
| GET `/api/v1/notifications/unread-count`            | → 안읽음 개수                                                     |
| GET `/api/v1/notification-settings`                 | → `[{notifType, enabled}]`                                        |
| PUT `/api/v1/notification-settings`                 | `{notifType, enabled}` → 성공 여부. **한 번에 한 유형만** 바꾼다. |

- 페이지 응답은 `{content, page, size, totalElements, totalPages, hasNext}`다.
- 목록 항목은 `{notificationId, notifType, title, relatedUrl, readAt, createdAt}`뿐이다. 본문·이미지 필드가 없으므로 목록에서 상세 본문을 기대하지 않는다. **`readAt`이 null이면 안 읽음**이다.
- `notifType`은 8종이다: `LIVE_START`, `COMMUNITY_ANSWER`, `SHIPPING_UPDATE`, `REFUND_STATUS`, `PROJECT_OPEN`, `REWARD_RESTOCK`, `COUPON_EXPIRING`, `SELLER_UPDATE_DUE`. 배송 알림 3종(단계 변경·진행 내용·일정 변경)은 수신설정이 유형 단위라 BE가 `SHIPPING_UPDATE` 하나로 묶었다. 세부 구분은 문구와 `relatedUrl`로 처리하므로 FE가 유형을 더 쪼개지 않는다.
- 읽음 처리는 멱등이다. 이미 읽은 알림은 기존 `readAt`을 그대로 돌려주고 덮어쓰지 않는다.
- **없는 알림과 타인의 알림은 403이 아니라 404다.** 403이면 ID를 넣어보며 타인 알림의 존재 여부를 캐낼 수 있기 때문이다. FE가 이 404를 권한 오류로 표시하지 않는다.
- 목록이 페이지 단위라 전체 안읽음 개수를 셀 수 없어 `unread-count`가 따로 있다. 목록 응답의 `totalElements`를 안읽음 수로 쓰지 않는다.
- 수신설정을 한 번도 바꾸지 않은 유형은 `enabled=true`로 나온다. 목록에 없다고 꺼진 것으로 해석하지 않는다.

**연결 대기 사유는 계약이 아니라 화면 원본이다.** Figma `[6하원칙] 공유용_파일`의 화면 ID 246개를 전수 확인했으나 알림함·수신설정에 해당하는 화면이 없다. `FL_B_MY_*`는 DLVR/FUND/HOME/RFND뿐이고, 마이페이지의 "알림함"·"알림 설정"은 목적지 없는 텍스트 항목이다. 화면을 임의로 만들지 않는다.

### 팔로우

Gateway는 `/api/v1/follows/**`를 member-service로 라우팅한다.

| 경로                                | 요청 → 응답                                          |
| ----------------------------------- | ---------------------------------------------------- |
| GET `/api/v1/follows`               | page(기본 0, ≥0), size(기본 20, 1~100) → 페이지 응답 |
| PUT `/api/v1/follows/{sellerId}`    | sellerId는 **UUID** → `{sellerId, following}`        |
| DELETE `/api/v1/follows/{sellerId}` | → 204                                                |

- 목록 항목은 `{sellerId, sellerName, sellerNickname, createdAt}`뿐이다.
- 찜 목록(`GET /api/v1/wishes`)과 합치지 않은 이유는 항목 모양이 다르고, 한 엔드포인트에 섞으면 페이지네이션이 하나로 묶여 탭 전환마다 커서가 꼬이기 때문이다. FE도 두 탭의 페이지 상태를 분리한다.

**연결 대기 사유는 표시 필드 부족이다.** 원본 `FL_B_LK_LIST_2`(`1249:24108`)의 한 행은 아바타 46px·LIVE 배지·판매자명·"팔로워 151 · ♥ 2,000"·"팔로잉" 버튼으로 구성된다. 판매자 프로필 API `GET /api/v1/sellers/{sellerId}`도 `{sellerId, businessType, pastProjects[]}`라 아바타·팔로워 수·좋아요 수·LIVE 상태를 제공하지 않는다. 화면의 다섯 정보 중 이름 하나만 채울 수 있어, 값을 지어내지 않는 원칙에 따라 연결을 보류한다.

BE에 요청할 필드는 아래와 같다. 목록 응답에 포함하는 방법과 판매자 프로필 조회를 확장하는 방법 모두 가능하다.

| 필요한 값                    | 쓰임                                          |
| ---------------------------- | --------------------------------------------- |
| 판매자 프로필 이미지 URL     | 행 좌측 아바타 46px                           |
| 팔로워 수                    | "팔로워 N"                                    |
| 좋아요(찜) 수                | 하트 아이콘 옆 수치                           |
| 진행 중 LIVE 여부            | 아바타 위 LIVE 배지                           |
| 판매자 상세 경로에 쓸 식별자 | 행 선택 시 이동. 목적지 자체도 아직 미정이다. |

## 검색·카테고리 카드의 공개 상세 연결 (#216)

- 2026-09-21 BE develop `ae1e032`의 `ProjectCardProjection.projectPublicId`를 사용한다. 숫자 `projectId`는 카드 식별자로 유지하며 상세 URL에는 검증한 공개 UUID만 전달한다.
- `/search`에서 유효한 UUID가 있는 카드만 `/projects/{UUID}`로 연결한다. 필드 누락·null·잘못된 값은 상세 연결 대기 상태를 유지하며 숫자 ID나 데모 ID로 대체하지 않는다.
- 찜 목록 `WishListItemResponse`에는 당시 공개 UUID가 없어 이 작업의 연결 범위에서 제외했다. 이후 BE PR #110이 필드를 추가해 아래 #250에서 연결했다. 검색 카드 UUID를 찜 ID 변환표로 사용하지 않는 원칙은 그대로다.
- 단위 테스트, lint, typecheck, production build와 격리 Playwright의 모바일 390×844·데스크톱 1440×900 검색/카테고리 클릭·새로고침·뒤로/앞으로가기·누락/잘못된 UUID·404 표시를 확인했다. API 응답은 계약 기반 fixture이며 실제 QA 배포·색인 데이터 연결은 미검증이다.

## 찜 목록의 공개 상세 연결 (#250)

- BE PR #110의 `WishListItemResponse.projectPublicId`(nullable UUID)를 사용한다. 숫자 `projectId`는 찜 등록·해제 식별자로 유지하며 상세 URL에는 검증한 공개 UUID만 전달한다.
- `/my/wishlist`의 제목·썸네일은 유효한 UUID가 있는 항목만 `/projects/{UUID}`로 연결한다. #216과 같은 기준으로 필드 누락·null·잘못된 값은 상세 연결 대기로 두고 숫자 ID나 데모 ID로 대체하지 않는다. 형식 검증은 `src/shared/lib/project-detail-id.ts`를 공용으로 쓴다.
- 기존 찜 데이터의 UUID 스냅샷 동기화와 실제 배포 BE 연동은 미검증이다.

## 프로젝트 스토리의 서식 저장 계약 (#234)

- 2026-09-21 BE develop `ae1e032`의 `RichTextSanitizer`를 기준으로 TEXT 블록에 허용 HTML을 저장한다. b/strong/i/em/u/p/br/span/div/ul/ol/li와 제한된 color/text-align/font-weight만 허용한다. 링크·스크립트·이벤트·임의 CSS를 추가로 허용하지 않는다.
- 기존 일반 텍스트·줄바꿈은 복원 호환을 유지하며 이미지·영상은 별도 IMAGE/VIDEO_URL 블록으로 유지한다. 서버가 보존하지 못하는 레이아웃·서식은 저장 성공으로 가장하지 않는다.
- 공개 화면은 허용 태그·스타일만 React 요소로 표시하며 API HTML을 그대로 삽입하지 않는다. 편집 저장·재진입·공개 표시를 함께 검증한다. AI 생성 API 및 실제 BE 배포 확인은 이번 범위와 구분한다.
- 에디터는 저장 계약에 없는 heading·codeBlock·horizontalRule·code·strike·link를 등록하지 않는다.
- 인용구(blockquote)도 등록하지 않고 툴바 컨트롤을 제거했다(#259). 2026-09-22 BE 확인 결과 `RichTextSanitizer`의 허용 태그는 b·strong·i·em·u·p·br·span·div·ul·ol·li이며 blockquote는 보존되지 않는다. 다 작성한 뒤 저장 단계에서야 막히는 대신 만들 수 없게 한다. 저장할 수 없는 노드·마크가 편집기 스키마에 없다는 것은 `story-extensions.test.mjs`가 확인한다.
- Figma 스토리 본문 화면(`1403:37656`) 툴바에는 `btn_insert_quote`가 남아 있다. 원본과 저장 계약이 어긋난 상태이므로 디자인 확인이 필요하다. BE가 blockquote를 허용하게 되면 툴바 컨트롤과 `blockHtml`·`htmlBlocks` 직렬화를 함께 되돌린다.

## 제작·배송 코드 대조 및 FE 연결 (#198)

- 2026-09-20 BE develop `e435378f`(#78) 기준으로 주문 목록은 `/api/v1/orders`의 UUID 계약으로 통합됐으며 `/api/v2/orders`는 제거됐다. 제작·배송의 `/api/v2/projects/{projectId}/fulfillment` 및 `/api/v2/projects/{projectId}/fundings/{fundingId}/shipment` UUID 계약은 유지한다.
- `/seller/projects/{UUID}?tab=fulfillment`에서 소유자 preview 조회 후 단계 전환·최신 상세 기록·일정 변경을 저장하고 재조회한다. 날짜 입력은 한국 시간 기준으로 Instant에 변환한다. 기록 수정·삭제 API는 없어 저장된 것처럼 처리하지 않는다.
- #327에서 진행 기록 사진 첨부를 연결했다. BE develop `47bee6ed` 기준으로 `POST .../fulfillment/stage-details`는 `photoUrls`(선택, 최대 5장)를 받고 `GET .../fulfillment`의 `stages[].photoUrls`로 돌려준다. 사진마다 `POST /api/v1/projects/{projectId}/media/upload-url`로 발급받은 `uploadUrl`에 PUT한 뒤 그 `fileUrl`만 보낸다. 이미지는 JPG·PNG·WebP 10MB 이하다. 하나라도 업로드에 실패하면 실패한 파일명을 안내하고 기록을 등록하지 않는다. 동영상은 BE가 받지 않아 첨부 한도를 사진 5장·동영상 0개로 둔다(Figma 첨부 영역 `1319:40988`의 10장·1개 문구는 이 계약에 맞춰 조정했다).
- 단계 전환·기록 등록이 규칙에 어긋나면 422 `INVALID_STAGE_TRANSITION`("이미 지난 단계입니다.")이 온다. 이 코드만 따로 안내하고 서버의 최신 진행 상태를 다시 불러온다. 다른 실패는 기존 저장 실패 안내를 유지한다.
- `/my/fundings/{UUID}/fulfillment`와 `/history`는 내 주문 v1 목록을 페이지 순회해 프로젝트 UUID 관계를 확인한 뒤 제작·배송을 조회한다. 서버 `canConfirmReceipt`가 참일 때 수령 확인을 제공한다. 외부 택배 추적은 연결하지 않는다.
- 단계 조회는 단계별 최신 상세 1건만 제공한다. 전체 기록 이력이 아닌 최신 기록과 별도의 일정 변경 이력을 표시한다. 미갱신 경고는 서버 `isUpdateOverdue`를 사용한다.
- 판매자 목록 `GET /api/v1/projects/{projectId}/orders`는 #232에서 배송 화면에 연결했다. orderId는 기존 shipment 경로의 fundingId UUID다.
  - BE PR #130(`develop` `5898de5`)부터 응답이 `PageResponse`(`content`·`page`·`size`·`totalElements`·`totalPages`·`hasNext`)이고 `q`(수령인 이름·주문번호 부분 일치)·`shippingFilter`(`ALL`·`WAITING`·`SHIPPED`, 발송일 유무)·`page`(0부터)·`size`를 받는다. 대상은 목표 달성 주문이고 최신순이다. 탭 건수는 `GET /api/v1/projects/{projectId}/orders/shipping-status-counts`의 `{waiting, shipped}`이며 검색어와 무관하다.
  - #312에서 발송정보 화면의 탭·검색·페이지를 서버 조회로 연결했다. 판매자 프로젝트 목록처럼 `status`(`all`·`pending`·`shipped`)·`search`·`page`(1부터)를 URL에 둔다. 전체 탭 건수는 발송 대기와 발송 완료의 합이다.
  - Figma 주문번호 칸(`488:7625`)은 100px 한 줄의 짧은 번호(`0000 - 000000`)인데 응답에는 UUID만 있다. 표시용 주문번호가 없어 UUID 마지막 묶음(12자리)을 보여 주고 전체 UUID는 마우스를 올리면 보인다(2026-09-23 사용자 결정). 부분 일치 검색이라 이 12자리로도 찾을 수 있다.
  - 응답에 주문별 발송 상태와 송장 정보가 없다. 발송 대기·완료 탭의 행은 탭 상태로 표시한다. Figma 상태 명세(`488:8247`)는 발송 처리·발송 완료 두 가지뿐이라 전체 탭의 행은 우선 발송 처리로 둔다(2026-09-23 사용자 결정). 주문별 발송 여부 필드가 생기면 실제 상태로 바꾼다. `ShipmentService.getShipment`는 구매자 본인만 허용해 판매자 송장 조회도 없어, 발송 완료 행의 택배사·운송장은 비어 보인다.
  - 발송 처리(행·일괄)는 `POST /api/v2/projects/{projectId}/fundings/{fundingId}/shipment` `{carrier, trackingNumber}`로 등록한다. `carrier`는 자유 문자열이라 Figma 택배사 이름을 그대로 보낸다. 등록하면 서버에서 곧바로 SHIPPED가 되고 발송 이벤트로 주문 발송일이 비동기 갱신되므로, 화면에서 처리한 주문은 목록 반영 전에도 발송 완료로 표시하고 목록·건수를 다시 조회한다. 409 `ALREADY_SHIPPED`는 이미 발송된 건으로 표시하고 입력값을 지운다. 택배사·운송장이 빈 건은 보내지 않고, 실패한 건은 입력과 선택을 남겨 다시 시도하게 한다.
  - 택배사·운송장만 저장하는 API가 없어 일괄 작업 바의 저장 버튼은 준비중(비활성)이다(2026-09-23 사용자 결정). 등록 API를 쓰면 저장만 하려던 주문이 발송 완료가 되기 때문이다.
- 실제 Gateway·판매자/구매자 테스트 계정·자동 택배 상태 연동은 미검증이다. 실서버 연결 전 판매자 송장 조회 권한, 전체 기록 계약과 실제 S3 업로드를 확인해야 한다.
- 주문 생성 재시도는 사용자·프로젝트별로 요청 내용의 해시와 생성 결과를 보관합니다. 결제 대기 주문의 동일 요청만 재사용하며, 다른 요청은 기존 주문 확인·취소를 안내합니다. 서버에서 확인한 비대기 상태의 주문은 새 요청 결과로 재사용하지 않습니다. 결과가 불확실하거나 상태 조회가 실패하면 추가 생성하지 않습니다. 목표 달성 주문의 상세에서는 제작·배송 API 현황으로 이동합니다.

## 쿠폰 조건 표시·발급자별 선택 보완 (#218, #233)

- BE develop `d7ea517`의 `CouponBoxItemResponse`, `Coupon`, `CouponIssuanceService`를 대조했다. `minFundingAmount`는 배송비를 제외한 리워드 합계의 최소 펀딩 금액, `perMemberLimit`은 인당 발급 한도다. 사용 가능 횟수로 해석하지 않는다.
- 쿠폰 선택 카드에 최소 금액·적용 대상·발급 한도·한국 시간 기준 유효기간을 표시한다. `targetScope`는 ALL/CATEGORY/PROJECT/MAKER이며 카테고리는 BE 대분류명, 프로젝트는 주문의 UUID와 비교한다. 대상 판매자 이름은 응답에 없으므로 임의 ID 매핑 없이 지정 판매자 전용으로 안내한다.
- BE의 원본 쿠폰 누락 응답(null 대상·유효기간, 0 한도·금액)과 알 수 없는 값은 확인 필요로 표시한다. 최소 금액 0은 대상 메타데이터가 있을 때만 제한 없음으로 표현한다.
- 조건 표시는 안내이며 선택·적용 판정과 최종 금액은 주문 preview 응답을 유지한다. 2026-09-21 BE develop `ae1e032`의 `issuerType`·`maxDiscountAmount`를 반영한다. 발급자는 PLATFORM/MAKER이며 각 1개를 선택해 `couponCodes`에 전달한다. 숫자로 제공된 할인 한도를 표시하며 0은 할인 0원 상한이다. null 한도는 원본 쿠폰 누락에서도 발생하므로 무조건 무제한으로 해석하지 않는다.
- 디자인 확인 범위: 쿠폰 프레임 `746:7329`·`746:7389`, 화면정의 `737:7172`·`737:7177`·`737:7182`, 이력 `643:9086`, 결제 섹션 `643:9085`의 주변 텍스트 지침. 확인한 쿠폰 노드에는 prototype 연결·annotations가 없다. 문서의 과거 결제 지침 `1132:15072`는 이번 도구 조회에서 찾을 수 없어 최신 해당 노드의 재확인은 미완료다. 이번 작업은 기존 카드의 조건 표시만 보완한다.

## 주문·결제 코드 대조 및 FE 연결 (#197)

- 2026-09-20 BE develop `e435378f`(#78) 기준으로 주문 preview/생성/목록은 `/api/v1/orders`의 UUID 계약을 사용한다. 이전 `/api/v2/orders` 컨트롤러와 Gateway 매핑은 제거됐다. 상세/취소는 기존 `/api/v1/orders/{orderId}`를 유지한다. 리워드·옵션은 조회 응답의 숫자 ID를 전달한다.
- `/funding/{UUID}/checkout`은 실제 리워드·배송지와 서버 미리보기 금액을 사용한다. 주문 생성 후 `/my/fundings/{orderId}`로 이동한다. BE develop `ae1e032`에서 주문 목록의 `finalAmount`는 리워드 합계+배송비−할인액으로 보완됐다. #233은 목록에도 서버 최종 금액을 표시하며 FE가 할인을 다시 차감하지 않는다.
- `/my/fundings`는 서버 상태/페이지 필터를 사용하며 기존 목업 검색·기간 필터는 서버 계약에 없어 적용하지 않는다. 상세의 `availableActions`에 CANCEL이 있을 때만 취소를 제공한다. `/payment/result?orderId={UUID}`는 새로고침 가능한 주문 조회다.
- `/api/v2/payments`의 시도 생성은 서버 주문 UUID를 사용한다. `/confirm`의 `orderId`는 별도의 `pgOrderId`이며 주문 UUID와 혼용하지 않는다.
- 현재 BE의 결제 승인은 실제 Toss 클라이언트를 호출한다. 목업은 테스트 코드에서만 확인됐으므로 FE는 임의 paymentKey를 생성하거나 결제 성공을 합성하지 않는다. PortOne 본인인증과 별개다.
- 결제위젯 연동(BE develop `3d23bc7` payment-service 코드 대조): PG는 Toss 결제위젯이며 결제수단·약관 UI와 결제창은 FE가 `@tosspayments/tosspayments-sdk`로 렌더링한다. 흐름은 `POST /api/v2/payments {fundingId: 주문 UUID}` → `{paymentId, pgOrderId, amount, orderName, couponIssuanceIds}` → 위젯 `setAmount(amount)`·`requestPayment({orderId: pgOrderId, …})` → 복귀 `?paymentKey&orderId(=pgOrderId)&amount` → `POST /api/v2/payments/confirm`(응답 `fundingId`가 주문 UUID)이다. 금액은 주문 미리보기가 아니라 시도 생성 응답의 `amount`를 쓴다.
- `customerKey`는 BE가 주지 않고 로그인 회원의 `memberId`(UUID)를 그대로 쓴다. 클라이언트 키는 `NEXT_PUBLIC_TOSS_CLIENT_KEY`이며 BE의 위젯 시크릿 키와 같은 상점의 결제위젯 연동 키여야 한다. Toss 문서 기준으로 위젯 클라이언트 키는 `test_gck_…`/`live_gck_…`(시크릿은 `gsk`)이고, API 개별 연동 키(`ck`/`sk`)로는 위젯 SDK가 `NOT_SUPPORTED_API_INDIVIDUAL_KEY`로 실패하며 키 세트를 섞으면 `INVALID_API_KEY`다. `customerKey`는 2~50자, 영문·숫자·`-_=.@` 중 1개 이상 포함이어야 하며 UUID(36자, `-` 포함)는 충족한다.
- 결제 성공의 기준은 confirm 응답의 `status: "COMPLETED"`다. 주문 상태 반영은 Kafka로 비동기라 직후 조회가 잠시 `PENDING`일 수 있다. 같은 `paymentKey`의 confirm 재호출은 멱등이다. 확정 오류는 `PAYMENT_AMOUNT_MISMATCH`(422)·`PG_CONFIRM_FAILED`(422)·`PAYMENT_EXPIRED`(410)·`PAYMENT_NOT_PENDING`(409)이며 5xx·네트워크 실패는 승인 여부를 모르므로 재결제를 권하지 않고 참여 내역 확인을 안내한다. BE는 세션 만료를 뺀 Toss 4xx를 모두 `PG_CONFIRM_FAILED`로 합치므로(카드 거절과 `ALREADY_PROCESSED_PAYMENT`가 구분되지 않는다) FE는 "결제되지 않았다"고 단정하지 않는다. 사용자가 결제창을 닫으면 Toss 문서상 `PAY_PROCESS_CANCELED`이고 failUrl에 `orderId`가 오지 않으므로(SDK reject 코드는 `USER_CANCEL`) 재결제 링크는 마지막 시도로 복원한다. successUrl의 `paymentType=BRANDPAY`는 별도 승인 API가 필요해 승인 요청을 보내지 않는다.
- BE 보완 요청: ① `createPayment`가 COMPLETED 결제가 있는 펀딩을 거부하지 않는다(주문 상태 반영 전 이중 결제 위험). ② `paymentExpiresAt`이 주문 생성 응답에만 있고 상세 응답에는 없어 재진입 시 결제 만료 시각을 알 수 없다. ③ 승인 실패 시 `Payment`를 FAILED로 기록한다고 명세돼 있으나 같은 트랜잭션에서 `BusinessException`을 던져 그 기록이 롤백된다. 결제 시도가 PENDING으로 남아 재시도 때 같은 `pgOrderId`가 재사용되므로, Toss가 이미 인증된 주문번호를 거부하면 재결제가 막힐 수 있다(FE에서 확인 불가, 샌드박스 확인 필요). Toss 문서에는 승인 실패(ABORTED)한 `orderId`의 재사용 가부가 없다(`DUPLICATED_ORDER_ID`는 "이미 승인 및 취소가 진행된" 주문번호만 정의한다). ④ 승인 응답의 `status`를 확인하지 않고 `markCompleted`한다. 결제 UI 어드민에서 가상계좌가 켜져 있으면 `WAITING_FOR_DEPOSIT`(입금 전)도 COMPLETED로 기록되고, 휴대폰·상품권은 `fromTossMethod`가 예외를 던져 Toss 승인 뒤 500이 난다. 가상계좌·휴대폰·상품권·브랜드페이는 결제 UI 어드민에서 끄거나 BE가 `DONE`만 완료로 다루도록 보완해야 한다. ⑤ Toss confirm 호출에 `Idempotency-Key`를 보내지 않는다(Toss는 모든 POST에서 지원, UUID v4 권장, 15일 유효). ⑥ Toss 오류 코드를 `PG_CONFIRM_FAILED`로 합치지 말고 최소한 `ALREADY_PROCESSED_PAYMENT`·`DUPLICATED_ORDER_ID`(결제됐을 수 있음)와 카드 거절을 구분해 달라.
- 결제 흐름의 sessionStorage 사용은 주문 생성 중복 방지와 같은 성격의 예외다. Toss 복귀 URL에는 주문 UUID가 없어 `pgOrderId→주문 UUID`를 같은 탭에 잠깐 남겨 재결제 링크를 복원하고, 승인 직후 주문 상태가 반영되기 전 재결제 진입을 가린다. 둘 다 권한·결제 성공 판정이 아니라 화면 복원용이며 저장소 접근이 막혀도 흐름은 그대로 동작한다.
- 주문 생성 `POST /api/v1/orders`는 선택 헤더 `Idempotency-Key`를 받는다(BE #124, #215). 키는 회원 범위이며 같은 키·같은 본문은 새 주문 없이 기존 주문을 200으로, 새 주문은 201로 돌려준다. 같은 키에 다른 본문이거나 같은 키 요청이 처리 중이면 409 `CONFLICT`, 재고 부족은 409 `INSUFFICIENT_STOCK`이다. BE 코드에 키 유효기간은 없다.
- FE는 시도마다 UUID 키를 만들고 요청 전에 회원·프로젝트별 sessionStorage에 키·본문을 남긴다. 네트워크·5xx·파싱 실패·주문 ID 누락·새로고침 뒤에는 새 주문 대신 같은 키·같은 본문으로 다시 보내 서버 결과를 확정한다. `CONFLICT`와 401·403·408·429(이 응답만으로는 이전 요청의 생성 여부를 확정할 수 없음)는 시도를 유지하고, 그 밖의 4xx 확정 실패만 시도를 버려 다음 주문에 새 키를 쓴다. 확정된 주문이 결제 대기면 재사용하고 종료 상태면 새 키로 주문한다. 같은 탭 동시 호출은 요청 하나를 공유한다. sessionStorage는 탭 복제 시에만 공유되므로 서로 다른 탭·기기의 주문은 별개 시도로 처리되며 동일 프로젝트 재주문 정책은 BE 보완이 필요하다.
- 쿠폰은 보유 목록·주문 미리보기·플랫폼/메이커 각 1개 선택을 연결한다. `appliedCoupons` 항목은 BE의 `couponCode`·`issuerType`·`discountType`을 사용하며 쿠폰별 할인액을 가정하지 않는다. 적립금·결제수단 선택·승인 완료 화면의 API 연결은 제외한다. 실제 Gateway/PG 검증은 미완료이며 HTTP 테스트 대역 검증과 구분한다.

이하 계약 초안은 2026-09-07 작성, 2026-09-14 갱신 당시 전달 명세를 기록한 내용이다. 이후 구현에 확인한 차이는 위 도메인별 코드 대조 절과 각 기능 문서에 기록하며, 전체 계약 확정을 뜻하지 않는다. 관련 작업은 [#47](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/47)이다.

## 1. 목적·근거·우선순위

이 문서는 전달받은 자료를 정리한 문서다. 인증·회원의 일부 코드를 읽어 명세와 비교했지만 BE 서버 실행·테스트 실행·실제 응답 대조는 하지 않았다.

- API 버저닝·표준 에러 형식 정의서.
- 2026-09-14 FE에 전달된 OpenAPI 3.1.0 `auth-api.yaml`, `member-api.yaml`(각 info.version은 v1). BE 설명은 “지금 작업중인 내용 제외하고 develop 브랜치 최신버전으로 작성된 auth, member”다. 기준 커밋·추출 시점·제외된 API 목록은 전달되지 않았다.
- 2026-09-08 FE에 전달된 이전 BE 추가 답변과 서비스별 로컬 포트 이미지.
- [Auth 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/auth-service/docs/AuthDomainApiSpec.md).
- [Member 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/member-service/docs/MemberDomainApiSpec.md).
- BE가 전달한 `project-service_API_명세서.md`의 35개 엔드포인트. Notion 첨부 블록 ID는 `3d49e3e3-35cc-8064-b924-d74d56ddd7b7`이다. 만료되는 서명 다운로드 URL은 계약 링크로 저장하지 않는다.

최종 계약과 계약 변경의 기준은 **Swagger/OpenAPI**다. 인증·회원은 이번에 직접 전달받은 YAML을 최신 전달 명세로 우선한다. 이전 답변·Markdown의 보완 내용은 출처를 구분해 유지하며, YAML에 없는 API를 최신 연동 범위나 미구현으로 단정하지 않는다. 저장소 코드가 YAML보다 최신이라고 판단하거나 코드로 명세를 덮어쓰지 않는다. 불일치는 4.6에서 별도로 기록하고 BE에 연동 기준을 확인한다. 프로젝트 등 다른 서비스는 기존 근거를 유지한다.

원본 파일 식별용 SHA-256은 다음과 같다. 저장소에 YAML 원본을 복사하지 않았으며 공유 위치와 기준 버전 고정은 후속 확인 대상이다.

- `auth-api.yaml`: `127fc4d515650fb2c63249dfb130714e4f67e4157bd175a7788246db0ad891c0`.
- `member-api.yaml`: `a714da3da5281213dcd5a5c05eb21851ab08705f90605ddfb073e64c34797f20`.

| 구분           | 의미                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| 정의서 기준    | 공통 정의서의 규칙.                                                                      |
| 최신 전달 명세 | 2026-09-14 YAML에 명시된 계약. 실제 배포·호출 가능 여부는 별도 확인한다.                 |
| 코드 대조      | 특정 커밋의 소스·기존 테스트를 읽어 확인한 내용. 최신 전달 명세를 대체하지 않는다.       |
| 구현 답변 기준 | 최신 BE가 설명한 현재 구현이며 PM 정책 확정·배포 완료를 뜻하지 않는다.                   |
| 명세 보완      | 최신 답변에 없는 정보를 BE Markdown 명세로 보완했다. 실제 구현 여부까지 확정하지 않는다. |
| 미구현         | BE가 미구현이라고 답변했다.                                                              |
| 기술 확인      | Swagger·실제 응답·구현 상태로 확인할 사실 또는 누락된 계약.                              |
| 협의           | FE·BE·PM·인프라 등이 결정해야 할 정책·환경.                                              |

## 2. 환경과 경로

### 2.1. 로컬 서비스

BE는 로컬 MSA 환경을 사용하며 운영 주소는 배포 전으로 미정이다. 아래는 전달된 앱 포트를 HTTP 로컬 주소로 표현한 것이며 실제 접속 검증 결과가 아니다.

이번 Auth·Member YAML의 servers는 `/`(명세를 받아온 곳과 같은 origin)뿐이다. 이 값으로 FE에서 접근할 개발 Gateway 주소나 현재 배포 환경을 확정할 수 없으며 아래 주소는 2026-09-08 자료 기준이다.

| 서비스                   | 로컬 주소               |
| ------------------------ | ----------------------- |
| platform:gateway-service | `http://localhost:8080` |
| auth-service             | `http://localhost:8081` |
| member-service           | `http://localhost:8082` |
| project-service          | `http://localhost:8083` |
| order-service            | `http://localhost:8084` |
| payment-service          | `http://localhost:8085` |
| live-service             | `http://localhost:8086` |
| shipping-service         | `http://localhost:8087` |
| notification-service     | `http://localhost:8088` |

DB 포트 5432~5439는 FE 호출 대상이 아니다. `localhost`는 호출하는 PC를 뜻한다. FE PC에서 BE를 실행하거나 접근 가능한 BE 주소를 별도로 제공해야 한다. Gateway 포트가 있다는 것만으로 라우팅·인증 구현 완료를 가정하지 않는다.

브라우저 직접 호출/BFF 경유와 Gateway/서비스별 라우팅은 서로 다른 결정이다. FE Origin, 호출 구조, 서비스 접근 경로를 함께 정한다.

### 2.2. 경로와 버전

- URL 경로 버전 `/api/v1/...`을 사용한다.
- project-service는 `/projects/**`로 통일되지 않는다. `/rewards/**`, `/notices/**`, `/community/posts/**`, `/api/v1/ai/**`, `/sellers/**`, `/live-verifications/**`, `/admin/projects/**`도 사용한다.
- 필드 추가만으로 버전을 올리지 않으며 FE는 모르는 응답 필드를 무시해야 한다. 실제 파서에서 이 호환성을 검증해야 한다.
- 필드 삭제·이름 변경·타입 변경 등 브레이킹 체인지는 `/api/v2/...`로 병행 운영한다.
- 구버전 최소 유지 기간과 종료 공지는 팀 협의 후 확정한다.

## 3. 공통 응답과 값 표현

### 3.1. 성공 응답

도메인 DTO를 HTTP 상태 코드와 함께 별도 공통 래퍼 없이 반환한다. `data` 래퍼를 FE가 임의로 기대하지 않는다. 특정 DTO의 `message` 필드는 허용되며 공통 성공 래퍼와 구분한다. 204는 본문을 파싱하지 않는다. 개별 API의 성공 상태는 Swagger에서 확인하며 POST라는 이유만으로 201을 가정하지 않는다.

일반 로그인 `POST /api/v1/auth/login`의 성공 본문은 구현 답변 기준 다음과 같다. 소셜 로그인 응답은 4.2·4.3에서 별도로 설명한다.

```json
{
  "accessToken": "string",
  "mustChangePassword": false
}
```

페이지네이션은 다음 6개 필드다. 빈 목록도 같은 구조를 사용한다.

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false
}
```

### 3.2. 오류 응답

기본 필드는 문자열 `code`, 문자열 `message`, 구조가 고정되지 않은 `detail`이다. 최신 답변의 `non_null` 설정에 따라 값이 null이면 키가 생략된다. 따라서 FE에서는 `detail`의 누락과 null을 모두 처리한다. 기존 정의서의 `detail: null` 예시를 필수 키 계약으로 해석하지 않는다.

| 상황               | HTTP·코드            | detail                            |
| ------------------ | -------------------- | --------------------------------- |
| `@Valid` 검증 실패 | 400 `INVALID_INPUT`  | `[{field, reason}]` 배열.         |
| 계정 잠금          | 423 `ACCOUNT_LOCKED` | `{lockedUntil}` 객체.             |
| 그 외 현재 사례    | 해당 오류별          | null이며 응답에서 생략될 수 있다. |

```json
{
  "code": "INVALID_INPUT",
  "message": "입력값 유효성 오류 (Body 누락·JSON 형식 오류 포함)",
  "detail": [{ "field": "email", "reason": "이메일 형식이 올바르지 않습니다" }]
}
```

```json
{
  "code": "ACCOUNT_LOCKED",
  "message": "계정이 잠겨 있습니다.",
  "detail": { "lockedUntil": "2026-09-07T10:30:00Z" }
}
```

일반화된 detail 규격은 아직 없다. FE는 알 수 없는 값을 특정 배열·객체로 단정하지 않고 구조를 검사한 뒤 사용한다. 모든 400이 필드 오류 배열을 반환하는 것은 아니다. `fieldErrors`, `timestamp`, `traceId`는 전달된 표준 필드가 아니다.

이번 두 YAML은 ErrorResponse 설명에 검증 오류 배열·그 외 대부분 null을 적었지만 detail 스키마는 `type: object`만 선언한다. 배열·null 설명과 스키마가 불일치하므로 생성 타입으로 확정하지 않는다. 위 계정 잠금 detail과 null 키 생략 규칙은 2026-09-08 답변을 보존한 내용이다. YAML의 공통 코드 목록만으로 API별 발생 가능한 오류를 모두 확정하지 않으며, 실제 오류 예시와 스키마 보완이 필요하다.

### 3.3. HTTP 상태·오류 코드

| HTTP | 공통 코드 또는 의미                               |
| ---- | ------------------------------------------------- |
| 200  | 성공.                                             |
| 201  | 리소스 생성 성공.                                 |
| 204  | 성공, 본문 없음.                                  |
| 400  | `INVALID_INPUT` — Body 누락·JSON 오류·입력 오류.  |
| 401  | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`. |
| 403  | `FORBIDDEN`.                                      |
| 404  | `NOT_FOUND`.                                      |
| 405  | `METHOD_NOT_ALLOWED`.                             |
| 409  | `CONFLICT`.                                       |
| 410  | `RESOURCE_EXPIRED`.                               |
| 422  | `BUSINESS_RULE_VIOLATION`.                        |
| 423  | `RESOURCE_LOCKED`.                                |
| 429  | `TOO_MANY_REQUESTS`.                              |
| 500  | `INTERNAL_ERROR`.                                 |
| 503  | `SERVICE_UNAVAILABLE`, `DEPENDENCY_FAILURE`.      |

최신 답변에서 확인한 도메인 코드는 다음과 같다. 서비스는 이 외에도 전용 코드를 추가할 수 있다.

| HTTP | 도메인 코드               | 의미                                     |
| ---- | ------------------------- | ---------------------------------------- |
| 409  | `EMAIL_ALREADY_EXISTS`    | 이메일 중복. 회원가입 토큰 소비 전 검사. |
| 423  | `ACCOUNT_LOCKED`          | 계정 잠금.                               |
| 422  | `PROJECT_NOT_DELETABLE`   | DRAFT 외 프로젝트 삭제 불가.             |
| 422  | `PROJECT_NOT_SUBMITTABLE` | 심사 제출 상태·필수 조건 불충족.         |
| 422  | `PROJECT_NOT_REVIEWABLE`  | PENDING_REVIEW 외 심사 처리 불가.        |

`TOKEN_INVALID`는 Access Token뿐 아니라 본인인증 토큰에도 쓰인다. HTTP·코드만으로 자동 갱신 또는 로그아웃하지 않고 요청 경로·용도를 함께 구분한다.

### 3.4. 날짜·ID·금액·null

| 항목               | 현재 기준                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 날짜·시간          | 최신 답변은 `Instant`의 ISO 8601 UTC 문자열(`2026-09-07T01:00:00Z`). 현재 구현 관행이며 공식 정책 확정은 아님. 기존 명세의 Z 없는 예시보다 답변을 우선한다.              |
| accountId/memberId | UUID 문자열, 두 서비스 공유 식별자.                                                                                                                                      |
| projectId          | 프로젝트 명세 보완상 외부 공개 ID는 UUID v7 문자열. 모든 프로젝트 경로에 사용하며 표시용 `projectDisplayCode`와 다르다.                                                  |
| 기타 ID            | 답변의 addressId/wishId 등은 Long. 프로젝트 명세의 rewardId/noticeId 등도 숫자 예시. Member 주소 응답의 필드명은 `id`다. 모든 서비스 ID를 한 타입으로 일반화하지 않는다. |
| 금액               | 최신 공통 답변에는 미정. 프로젝트 명세는 goalAmount/price 숫자와 원 단위를 사용한다. 공통 직렬화 타입·범위·소수 허용 정책은 별도 협의한다.                               |
| null/생략          | 응답의 null 필드는 키 생략. FE에서는 둘 다 값 없음으로 처리한다. PATCH 요청에서 생략과 명시적 null의 의미까지 같다고 확대하지 않는다.                                    |

Java Long 전체 범위는 JavaScript 안전 정수 범위를 넘을 수 있다. 숫자 ID·금액의 허용 범위와 문자열 직렬화 필요성은 연동 전 확인·협의하며 임의 변환으로 정밀도를 잃지 않는다.

null 키 생략은 오류 detail에서 추론한 규칙이 아니라 최신 BE의 공통 응답 답변을 반영한 것이다. 다만 모든 서비스·DTO의 실제 직렬화를 직접 검증한 것은 아니므로 연동 대상 응답과 대조한다. 생략/null을 모두 수용한다는 것이 모든 필드의 비즈니스 의미가 같다는 뜻은 아니다. 명세상 quantity는 isLimited=false일 때 무제한을 표현하며, remainingStock의 null은 재고 조회 실패 상황으로 설명된다. 둘을 0이나 품절로 자동 치환하지 않는다. remainingStock의 실제 실패 응답(null을 포함한 성공 응답 또는 503)은 8.1의 확인 대상으로 유지한다. 요청 quantity의 null과 PATCH 생략 의미는 응답 직렬화 규칙으로 결정하지 않는다.

## 4. 인증·회원

### 4.1. 인증 경계와 쿠키

최신 전달 명세의 보호 API는 `Authorization: Bearer <token>`을 사용한다. bearerAuth 설명은 Gateway가 토큰을 검증해 `X-User-Id`로 변환하고 클라이언트가 직접 보낸 해당 헤더는 제거한다고 명시한다. 이전 Member Markdown의 임시 `X-Account-Id` 설명을 FE 인증 계약으로 사용하지 않는다. 실제 Gateway 배포·연결은 별도 확인하며 내부 전용 헤더·키는 FE에 포함하지 않는다.

최신 YAML의 로그인 200 응답은 다음 Refresh 쿠키 속성을 명시한다. Domain·Max-Age는 이 YAML에 명시되지 않았다.

```http
Set-Cookie: refreshToken=<value>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/token/refresh
```

이전 답변·Markdown에는 가입·갱신 시 쿠키 발급과 Refresh 14일(Max-Age=1209600)이 설명돼 있으나, 이번 YAML에는 가입·갱신 응답의 Set-Cookie 정의가 없다. 갱신 요청은 본문 없이 refreshToken 쿠키를 받으며 required는 false다. 쿠키 누락 시 성공한다는 의미로 해석하지 않고 오류 응답을 확인한다. Domain·환경별 CORS·Credential은 미확정이며 이전 답변에서 CORS는 미구현이었다. FE의 직접 호출/BFF, Origin 및 Gateway 경로를 정한 후 쿠키 전달·재발급을 함께 검증한다. BFF를 쓰면 Set-Cookie 릴레이 방식도 협의한다.

호출 방식은 이번 문서에서 확정하지 않는다. 다음은 방식 선택 후 충족해야 할 전달 조건이며 현재 구현 완료를 뜻하지 않는다.

- 브라우저가 다른 Origin의 Gateway 또는 auth-service를 직접 호출해 쿠키를 발급·갱신·전송한다면 Fetch의 `credentials: "include"`가 필요하다. 서버는 허용 목록으로 검증한 요청 Origin을 `Access-Control-Allow-Origin`에 명시하고 `Access-Control-Allow-Credentials: true`를 반환해야 한다. 자격 증명 요청에 Origin 와일드카드 `*`를 사용하지 않는다. 필요한 preflight의 메소드·헤더도 허용해야 한다.
- `credentials: "include"`는 SameSite 제한을 해제하지 않는다. 제시된 `SameSite=Strict` 쿠키와 실제 FE/API의 사이트 관계가 맞는지 별도로 확인한다. 관련 브라우저 조건은 [MDN Fetch 자격 증명 설명](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)을 참고한다.
- BFF를 경유해 Refresh 쿠키를 브라우저에 보관하는 구조를 선택한다면 BFF의 Set-Cookie 릴레이와 갱신 요청의 쿠키 전달을 함께 정의해야 한다. 브라우저 기준 Domain·Path를 검토하며 위 Auth 예시의 Path가 BFF 경로에서도 그대로 유효하다고 가정하지 않는다. 브라우저와 BFF가 다른 Origin이면 위 CORS 조건도 적용한다. Refresh Token을 BFF 서버에만 보관하는 별도 세션 구조는 아직 합의된 계약이 아니다.

### 4.2. 주요 엔드포인트

아래는 이번 YAML에 포함된 전체 경로·메서드이며 모두 성공 상태가 200으로 기재돼 있다. 표는 핵심 필드 요약이며 전체 스키마를 대신하지 않는다. 찜 삭제는 코드와의 차이를 4.6에서 확인해야 한다.

| Method·Path                                | 요청                                                                             | 응답·설명                                                                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/v1/auth/login`                  | email, password                                                                  | accessToken, mustChangePassword. 회원정보는 제외.                                                                                                                                |
| GET `/api/v1/auth/check-email`             | query email                                                                      | available.                                                                                                                                                                       |
| POST `/api/v1/auth/identity-verifications` | 필수 identityVerificationId, minLength 1                                         | verificationToken, expiresAt(date-time).                                                                                                                                         |
| POST `/api/v1/auth/signup`                 | password, email, verificationToken, name, phoneNumber, agreedTerms, 선택 address | accountId, memberId, accessToken. 쿠키는 이전 근거로 분리.                                                                                                                       |
| POST `/api/v1/auth/token/refresh`          | 본문 없음, Refresh 쿠키                                                          | accessToken. 새 쿠키는 이전 근거로 분리.                                                                                                                                         |
| GET `/api/v1/auth/jwks`                    | 인증 불필요                                                                      | 자유 객체로 정의된 공개키 응답.                                                                                                                                                  |
| PATCH `/api/v1/auth/password`              | currentPassword, newPassword, Access 인증                                        | message. 로그인 상태 비밀번호 변경.                                                                                                                                              |
| GET `/api/v1/members/me`                   | 인증, 본문 없음                                                                  | memberId, name, nickname, phoneNumber, isSeller, isBuyer.                                                                                                                        |
| GET `/api/v1/terms`                        | 인증 불필요                                                                      | code, title, content, required, version의 배열.                                                                                                                                  |
| GET `/api/v1/addresses`                    | 인증                                                                             | id, recipientName, phoneNumber, zipcode, addressLine1, addressLine2, isDefault의 배열.                                                                                           |
| POST `/api/v1/addresses`                   | 인증, 주소 입력                                                                  | id, recipientName, isDefault.                                                                                                                                                    |
| PUT `/api/v1/wishes/{projectId}`           | 인증, int64 projectId, 본문 없음                                                 | projectId, wished.                                                                                                                                                               |
| DELETE `/api/v1/wishes/{projectId}`        | 인증, int64 projectId, 본문 없음                                                 | 200, 응답 content 정의 없음.                                                                                                                                                     |
| GET `/api/v1/wishes`                       | 인증, page 기본 0, size 기본 20                                                  | content, page, size, totalElements, totalPages, hasNext. 항목은 projectId(int64), projectPublicId(nullable UUID, BE PR #110 추가), projectTitle, projectThumbnailUrl, createdAt. |

로그인·이메일 중복 확인·일반 가입·본인인증·갱신·JWKS·약관 조회는 YAML에 인증 요구가 없다. 비밀번호 변경과 Member의 회원 조회·주소·찜 API는 bearerAuth를 명시한다.

SignupRequest의 required는 password, email, verificationToken, name, phoneNumber, agreedTerms다. 문자열은 minLength 1, email은 email 형식, agreedTerms는 문자열 배열·minItems 1이며 address는 선택 자유 객체다. nickname은 이번 YAML에 없다. PasswordChangeRequest의 두 비밀번호는 required·minLength 1이다. 로그인은 본문 자체가 필수지만 email/password의 required 목록이 없고, 응답 DTO들도 required 목록이 없어 필드의 존재 보장·null 허용을 이 파일만으로 확정하지 않는다.

다음은 **이전 Markdown 근거를 보존한 항목이며 당시 YAML에는 없는 경로**다. 이메일 찾기·재설정의 현재 계약은 아래 4.7의 BE 코드 대조로 갱신했다. 나머지 경로의 구현 상태는 이 표만으로 추정하지 않는다.

| 경로                                                           | 이전 근거와 남은 확인                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/v1/auth/find-email`                                 | phoneNumber, verificationToken → 안내 message, 이메일은 SMS 전달 설명.                                                        |
| POST `/api/v1/auth/reset-password`                             | email → 안내 message, 재설정 링크 이메일 발송 설명.                                                                           |
| POST `/api/v1/auth/reset-password/confirm`                     | resetToken, newPassword → message, 단기·일회성 토큰 설명.                                                                     |
| POST `/api/v1/auth/login/social`, `/api/v1/auth/signup/social` | KAKAO/GOOGLE, needsSignup·signupToken 분기는 이전 명세 설명. 이번 연동 범위·최종 DTO·TTL 확인 필요.                           |
| POST `/api/v1/members`                                         | 이전 명세의 auth-service 전용 프로필 생성. YAML에 MemberCreateRequest/Response 스키마만 있다고 FE 공개 API로 취급하지 않는다. |

### 4.3. 로그인·로그아웃·비밀번호

- 일반 로그인 `POST /api/v1/auth/login`에만 최신 답변의 accessToken·mustChangePassword 두 필드 규칙을 적용한다. 이전 Auth 명세의 `member` 객체를 필수로 기대하지 않는다.
- 소셜 응답에는 일반 로그인 두 필드 규칙을 확대하지 않는다. 이전 명세의 needsSignup 분기는 참고로 유지하며 최신 연동 범위와 needsLink를 포함한 코드 차이는 4.6에서 확인한다.
- 이전 답변은 mustChangePassword가 항상 포함되지만 당시 true로 만드는 코드 경로가 없다고 설명했다. 이번 YAML의 required 누락은 보완 대상이며, 필드를 삭제하거나 영구적으로 false라고 가정하지 않는다.
- **로그아웃 `POST /api/v1/auth/logout`은 이번 YAML에 없지만 BE 코드에서 확정해 #254에서 연결했다.** 인증 헤더가 필요 없고(Access Token 만료 뒤에도 로그아웃할 수 있어야 한다), 쿠키가 없거나 무효·만료·이미 폐기돼도 200인 멱등 요청이다. 제출된 토큰 하나만 폐기하며 재사용 탐지로 전체 세션을 끊지 않는다. 응답은 만료된 `refreshToken` 쿠키를 `Set-Cookie`로 내린다. refresh 쿠키의 `Path`는 `/api/v1/auth`라 재발급·로그아웃 두 경로에 모두 실린다 — 이 Path가 좁아지면 FE 폐기가 조용히 무효가 되므로 계약 변경 시 함께 확인한다. 실제 배포 Gateway 연동은 미검증이다.
- 이전 답변의 Access 30분, Refresh 14일은 개발 가정값이며 PM 확정치는 아니다. 이번 YAML은 TTL을 명시하지 않는다.
- 이전 답변의 비밀번호 최소 8자·대문자/소문자/숫자/특수문자 중 3종류 이상은 개발 가정값이다. 이번 YAML의 minLength 1과 구분하고 실제 검증 규칙·최종 정책을 확인한다.
- 재설정 이메일 링크 방식은 명세 보완이다. 즉시 변경 관련 회의의 최종 사용자 흐름과 재설정 링크 FE 경로는 협의한다.
- 이전 Markdown은 Refresh Token 회전과 재사용 탐지 시 계정의 Refresh 세션 폐기를 설명했다. 이번 YAML에는 이 동작 설명이 없다. FE 갱신 요청 중복 방지와 여러 탭의 경합·실패 복구는 구현 시 검증해야 한다. 이미 발급된 Access Token까지 즉시 폐기된다고 단정하지 않는다.

### 4.4. 본인인증과 회원가입 실패

`POST /api/v1/auth/identity-verifications`는 Authorization 불필요, 성공은 **200 OK**다.

요청 본문. FE가 PortOne SDK의 인증 완료 결과에서 받은 identityVerificationId를 이 서버 검증 API에 전달한다.

```json
{ "identityVerificationId": "PortOne SDK 인증 완료 결과의 식별자" }
```

200 OK 응답 본문. BE 검증 후 발급된 verificationToken을 일반 회원가입 `POST /api/v1/auth/signup` 요청의 같은 이름 필드로 전달한다. identityVerificationId는 이 BE 응답의 필드가 아니다.

```json
{
  "verificationToken": "string",
  "expiresAt": "2026-09-07T10:30:00Z"
}
```

이하 오류·TTL·소비·재시도 규칙은 2026-09-08 답변을 보존한 내용이며 이번 YAML이 새로 명시한 계약은 아니다. 당시 답변은 인증 실패 401 TOKEN_INVALID, PortOne 연동 실패 503 DEPENDENCY_FAILURE, verificationToken 30분·1회성과 Redis get-and-delete 소비, 이름·휴대폰번호 일치 검증을 설명했다.

| 회원가입 결과                        | 최신 구현 답변 기준 FE 처리                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 409 EMAIL_ALREADY_EXISTS             | 소비 전 중복 검사이므로 이메일을 변경해 동일 토큰으로 재시도 가능. 토큰 자체의 만료시간은 연장되지 않는다. |
| 토큰 만료·재사용·이름/휴대폰 불일치  | 모두 401 TOKEN_INVALID. 본인인증부터 재진행.                                                               |
| 그 외 서버가 실패로 응답             | 소비 이후 실패·프로필 생성 보상 트랜잭션 포함, 본인인증부터 재진행하는 기본 분기.                          |
| 네트워크 단절·타임아웃으로 결과 불명 | 서버 실패가 확정된 응답과 구분. 성공 여부 확인·재시도 계약은 기술 확인 대상으로 남긴다.                    |

이메일 예외는 모든 409가 아니라 **409 EMAIL_ALREADY_EXISTS**다. 위 본인인증/회원가입의 TOKEN_INVALID 메시지가 “Access Token 유효성 검증 실패”여도 Access 갱신을 자동 실행하지 않는다. 이 재시도 규칙은 최신 BE 답변의 일반 회원가입 범위이며 소셜 가입으로 확대하지 않는다.

### 4.5. 주소·약관

이번 Member YAML의 배송지 등록 필수값은 recipientName, phoneNumber, zipcode, addressLine1이며 모두 minLength 1이다. addressLine2·isDefault는 선택이다. isDefault 기본 false는 이전 Markdown 설명이고 YAML에 default는 없다. 주소 목록·등록 응답은 4.2를 따른다. Auth 가입 address는 자유 객체이며 Member AddressPayload에도 required가 없어 배송지 등록 규칙을 그대로 확대하지 않는다. 빈 객체·부분 입력·기본값 계약은 보완 대상이다.

회원가입 agreedTerms는 동의한 약관 코드 문자열 배열이다. Member 약관 조회의 SERVICE_USE·PRIVACY는 예시이며 전체 확정 코드 목록으로 하드코딩하지 않는다. Member 명세는 회원가입 시 구매자·판매자 권한 모두 부여한다고 명시한다. 이는 프로젝트 개인정보 동의·판매자 별도 절차와 다른 범위다. 프로젝트 약관은 최신 BE 답변상 미구현이며 별도 협의한다. 두 종류의 약관을 같은 계약으로 합치지 않는다.

### 4.6. 코드 대조와 화면 연동의 빈칸

비교 대상은 BE develop의 [931d6f80f85b84bb669e064556b7a716374365ab](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/tree/931d6f80f85b84bb669e064556b7a716374365ab)다. 코드·기존 테스트를 읽은 결과이며 테스트 실행·배포 확인 결과가 아니다. YAML의 추출 커밋이 없어 어느 쪽이 더 최신인지 단정하지 않는다. 아래 차이는 YAML을 임의로 수정하거나 코드 값을 FE 계약으로 채택할 근거가 아니다.

| 항목                | 최신 YAML                                        | 코드 대조·확인할 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 회원가입 nickname   | SignupRequest에 없음.                            | [SignupRequest](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/dto/SignupRequest.java)는 필수·최대 50자. 연동 대상 필드 확인.                                                                                                                                                                                                                                                                                                           |
| 소셜 인증           | 경로 없음.                                       | [AuthController](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/controller/AuthController.java)에 login/social, signup/social, social/link가 있음. [SocialLoginResponse](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/dto/SocialLoginResponse.java)는 needsSignup·needsLink로 분기. 포함 여부·최종 DTO 확인. |
| 찜 삭제·페이지 범위 | DELETE 200, page 기본 0·size 기본 20, 범위 없음. | [WishController](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/member-service/src/main/java/com/fundit/member/presentation/controller/WishController.java)는 DELETE 204, page ≥ 0·size 1~100. 성공 상태와 검증 제약 확인.                                                                                                                                                                                                                                                                      |
| 반복 찜 등록·해제   | 반복 호출 결과 설명 없음.                        | [WishJpaRepository](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/member-service/src/main/java/com/fundit/member/infrastructure/persistence/wish/WishJpaRepository.java)는 중복 등록을 무시하고 없는 항목 삭제도 정상 처리. 공식 계약 반영 여부 확인.                                                                                                                                                                                                                                          |
| 가입·갱신 쿠키      | 응답 Set-Cookie 정의 없음.                       | AuthController는 가입·갱신 성공 시 쿠키를 설정. 명세 보완과 실제 환경 대조 필요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

마이페이지의 이메일·프로필 이미지·등급·혜택은 MemberMeResponse에 없다. 찜 목록에는 판매자명·달성률·종료 상태가 없으며 판매자 팔로우 API도 이번 파일에 없다. 다른 API에서 조합할지 DTO를 확장할지 확인한다. 프로젝트 공개 UUID와 찜 int64 projectId 연결은 BE PR #110의 projectPublicId로 확정해 #250에서 연결했다. 통합 검색·LIVE 알림·취소/환불/교환 내역은 담당 서비스의 별도 명세가 필요하며 Auth·Member 파일에 없다는 이유로 미구현으로 분류하지 않는다.

### 4.7. 로그인·계정 복구 코드 대조 (#217)

2026-09-20 `Fundit-backend` develop `d7ea517`의 `AuthController`, `LoginFailureHandler`, `PasswordResetService`를 확인했다. 4.2의 과거 복구 명세 대신 아래 계약을 사용한다.

| 경로                                       | 요청 → 응답                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| POST `/api/v1/auth/find-email`             | name, phoneNumber → maskedEmail. 없는 계정은 null.                             |
| POST `/api/v1/auth/find-email/reveal`      | verificationToken → email. PortOne 서버 검증 토큰을 일회 소비.                 |
| POST `/api/v1/auth/reset-password`         | name, phoneNumber, email → message. 계정 유무와 무관한 동일 안내.              |
| POST `/api/v1/auth/reset-password/confirm` | token, newPassword → message. token은 UUID이며 만료·소비 후 401 TOKEN_INVALID. |
| PATCH `/api/v1/auth/password`              | Bearer + currentPassword, newPassword → message.                               |

- 로그인 실패는 401 INVALID_CREDENTIALS, 잠금은 423 ACCOUNT_LOCKED와 detail.lockedUntil이다. FE가 실패 횟수로 잠금을 추정하지 않는다.
- `mustChangePassword`는 true도 처리하며 새 비밀번호 정책은 회원가입과 공유한다.
- 재설정 메일 기본·개발 링크는 `/reset-password?token=%s`다. 운영 URL 템플릿·실제 메일 발송·PortOne 채널/복구 콜백은 BE/인프라 확인 대상으로 남긴다.
- FE 검증은 HTTP 대역과 독립 브라우저 기준이며 운영 외부 인증·메일 수신 성공을 의미하지 않는다.

## 5. 프로젝트

### 5.1. 상태·수정·제출

enum은 DRAFT, ONGOING, SUCCEEDED, FAILED다. BE develop `47bee6ed`에서 관리자 심사(PENDING_REVIEW)가 폐지됐다.

| 동작       | 최신 구현 답변 기준                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 공개(제출) | DRAFT → ONGOING(관리자 승인 없음). 기본정보(사업자유형·카테고리·제목·목표금액), 소개 콘텐츠, 리워드 1개 이상, 개인정보 동의가 모두 필요. 불충족은 422 PROJECT_NOT_SUBMITTABLE. |
| 삭제       | DRAFT만 가능. 나머지는 422 PROJECT_NOT_DELETABLE.                                                                                                                              |
| 그 외 수정 | 기본정보·소개·리워드·고시·환불정책은 현재 프로젝트 상태와 무관하게 호출 가능. 허용 정책이 확정됐다는 의미는 아님.                                                              |

공개 시점이 펀딩 시작이고 마감은 30일 뒤다. PROJECT_NOT_SUBMITTABLE 메시지 끝에는 빠진 키 목록(`basicInfo, story, rewards, privacyConsent`)이 붙고 `detail`은 비어 있다. FE는 이 목록으로 빠진 항목을 안내한다(#322).

진행 중 목표금액·가격 수정도 현재 서버가 막지 않는다. FE 비활성화만으로 보안을 대신하지 않으며 상태별 허용 필드와 BE 검증을 협의한다. ONGOING에서 SUCCEEDED/FAILED로 전환하는 시점·주체는 전달된 답변으로 확정하지 않는다.

### 5.2. 작성 흐름·주요 경로

다음은 프로젝트 명세 보완이다.

| 동작             | Method·Path                                         | 핵심 계약                                                                      |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| 목록             | GET `/api/v1/projects`                              | 판매자 본인 목록, 선택 status와 page/size. status 미지정은 전체.               |
| 신규 생성        | POST `/api/v1/projects`                             | 본문 없음 → projectId(UUID v7), status=DRAFT.                                  |
| 기본정보         | PATCH `/api/v1/projects/{projectId}/basic-info`     | businessType, categoryMajor, categoryMinor, title, goalAmount 부분 갱신.       |
| 개인정보 동의    | POST `/api/v1/projects/{projectId}/privacy-consent` | agreed. 프로젝트 약관 코드 목록과 별개. false는 422 PRIVACY_CONSENT_REQUIRED.  |
| 소개             | PATCH `/api/v1/projects/{projectId}/story`          | title, coverImageUrl, introContent.                                            |
| 리워드 등록      | POST `/api/v1/projects/{projectId}/rewards`         | name, description, imageUrl, price, isLimited, quantity, isEarlyBird, options. |
| 리워드 수정/삭제 | PATCH/DELETE `/api/v1/rewards/{rewardId}`           | 수정은 부분 필드, 삭제 성공은 본문 없는 204.                                   |
| 고시             | PUT `/api/v1/rewards/{rewardId}/disclosure`         | categoryType, disclosure.                                                      |
| 환불 특이사항    | PATCH `/api/v1/rewards/{rewardId}/refund-policy`    | simpleRefundDisabled.                                                          |
| 공개(제출)       | POST `/api/v1/projects/{projectId}/submit`          | 본문 없음 → projectId, status. 조건·오류는 5.1 적용.                           |
| 판매자 미리보기  | GET `/api/v1/projects/{projectId}/preview`          | 본인 미공개 프로젝트 조회용.                                                   |
| 공개 상세        | GET `/api/v1/projects/{projectId}`                  | 미공개 DRAFT는 404.                                                            |

명세상 DRAFT를 먼저 생성하고 해당 ID로 개별 작성 API를 호출한다. FE의 현재 /new 화면 저장 목업이 실제 API 호출 순서를 구현한 것은 아니다.

기본정보 명세는 제목 40자, goalAmount 최소 500,000원, 등록된 카테고리 조합을 요구한다. businessType은 SOLE 예시만 있어 전체 enum을 추측하지 않는다. 카테고리 표시 문자열·공백도 저장 계약과 구분한다.

리워드 명세에서 isLimited=true이면 quantity는 0 이상, false이면 null이다. options는 `[{groupName, values: string[]}]`이며 현재 목업의 options 체크값과 다르다. 명세 보완값은 Swagger로 대조한 후 연동한다. PATCH에서 수량 제한 해제 시 null과 생략의 갱신 의미도 확인한다.

### 5.3. 콘텐츠·업로드

- introContent는 최신 답변 기준 순서 있는 평면 배열 `[{type: "TEXT" | "IMAGE" | "VIDEO_URL", value: "..."}]`이다. 이전 자유형 Map 설명을 폐기한다.
- disclosure는 `Map<String,String>`이며 현재 카테고리별 필수 키 검증은 없다. 필수 키 목록을 FE·BE가 협의해 BE 검증에 반영한다.
- 프로젝트 약관은 미구현이며 기존 agreedTerms의 비어 있지 않음 검사 설명을 최종 프로젝트 동의 규격으로 사용하지 않는다.
- 이미지·영상은 업로드 완료 URL을 받아 저장하는 상태다. 실제 업로드 방식·제한은 인프라 협의 전이며 명세의 10MB·확장자 검증을 구현 완료로 기록하지 않는다.
- 현재 리치 텍스트/HTML 및 base64 목업을 introContent·업로드 URL 계약으로 변환하는 규칙이 필요하다. TEXT에서 서식·HTML을 어떻게 표현할지 별도 협의하며 임의 HTML 실행을 허용하지 않는다.

### 5.4. 페이지네이션·기타 조회

프로젝트 목록·새소식 목록(#17)·새소식 댓글(#19)·커뮤니티 게시글(#21)은 content, page, size, totalElements, totalPages, hasNext를 모두 반환한다. page는 0부터, 기본 size는 20이며 현재 최대 size 제한은 없다.

LIVE검증 조회(#33) `GET /api/v1/projects/{projectId}/live-verifications`는 페이지 정보 없이 `{content: [...]}`만 반환한다. 기타 리워드/고시 조회처럼 단순 배열인 API까지 페이지 래퍼로 강제하지 않는다.

명세상 프로젝트 목록 status 필터는 단일 enum이다. FE 준비중/진행중/종료 탭을 서버 페이지 일부에서만 필터링하면 건수·목록이 틀릴 수 있으므로 상태 그룹별 조회·페이지 처리 방식은 연동 시 정한다.

### 5.5. AI 스토리

모든 공개 요청은 `X-Project-Id: <project UUID>`를 포함하고 `/api/v1/ai`를 사용한다.

| 동작        | Method·Path                                     |
| ----------- | ----------------------------------------------- |
| 최신 세션   | GET `/api/v1/ai/sessions/latest`                |
| 세션 생성   | POST `/api/v1/ai/sessions` + `{}`               |
| 세션 조회   | GET `/api/v1/ai/sessions/{sessionId}`           |
| 첫 질문     | POST `/api/v1/ai/sessions/{sessionId}/start`    |
| 메시지      | POST `/api/v1/ai/sessions/{sessionId}/messages` |
| 채팅 스트림 | GET `/api/v1/ai/chats/{chatId}/events` (SSE)    |
| 요약 확인   | POST `/api/v1/ai/sessions/{sessionId}/confirm`  |
| 전체 생성   | POST `/api/v1/ai/runs`                          |
| 상태·결과   | GET `/api/v1/ai/runs/{runId}`                   |

- FE는 Core 프로젝트·리워드 DTO를 만들지 않는다. BE가 최신 Core 사실을 AI 요청에 추가한다.
- 메시지는 `message_id`, 현재 `revision`, `text`를 보내며 SSE `message`·`done`을 처리한다.
- 전체 생성은 `session_id`, `confirmed_revision`, 새 `idempotency_key`만 보낸다. 부분 재생성 API는 없다.
- run 상태는 `queued|running|succeeded|partially_succeeded|failed`다. 부분 성공도 `result`를 표시·불러오고 실패 슬롯을 안내한다.
- 완료 callback 시 BE가 검증된 결과를 프로젝트에 저장한다. 별도 export/apply API는 없으며 FE의 “불러오기”는 현재 에디터와 캐시를 BE 결과에 맞춘다.
- 확인 뒤 Core 정보가 바뀐 `409`의 `detail.action=reconfirm_summary`는 새 요약 확인이 필요한 상태다.

### 5.6. 라이브 플레이어·AI Q&A (#227)

기준은 [BE PR #95](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/pull/95)의 병합 커밋 `b1f3b23d17f1726b900e7e06f8edc981e6ddeff9`에 있는 공개 컨트롤러·DTO다. 아래 경로의 접두사는 `/api/v1/lives/{liveId}`이며 `liveId`와 공개 `questionId`는 UUID다. FE는 AI 내부 `qid`를 요청 식별자로 사용하지 않는다.

| 동작                | Method·Path                                   | 인증·결과                                                                                     |
| ------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 재생 정보           | GET `/playback`                               | 공개. `liveId`, `type` (`LIVE`/`VOD`), `playbackUrl`, `projectId`, `likeCount`, `vodReadyAt`. |
| 다시보기 정보       | GET `/vod`                                    | 공개. 같은 재생 DTO.                                                                          |
| 집계 Q&A            | GET `/chat/insights?topN=10`                  | 판매자 소유권 확인. `{aiStatus, qna: [...]}`.                                                 |
| 미답변 질문         | GET `/chat/unanswered?topN=10`                | 판매자 소유권 확인. `{pending: [...], answered: [...]}`.                                      |
| 원본 댓글           | GET `/chat/questions/{questionId}`            | 판매자 소유권 확인. `{commentId, content, atMs}[]`.                                           |
| 초안 조회·답변 등록 | POST `/chat/questions/{questionId}/ai-answer` | 판매자 소유권 확인. `{action: "GENERATE"}` 또는 `{action: "SEND", finalAnswer}`.              |
| 구매자 Q&A          | GET `/chat/answered-questions`                | 공개. `{questionId, summaryText, questionCount, answerText, answeredBy, answeredAt}[]`.       |

- 집계 Q&A 항목은 `questionId`, `summaryText`, `count`, `category`, `answeredBy`, `answeredAt`, `answerText`, `promoted`를 제공한다. 서버 순서를 유지하며 답변 주체는 `answeredBy`로 구분한다.
- `aiStatus`는 `PREPARING`(AI 상품정보 색인 전)·`READY`다. 질문이 없을 때 두 상태를 다른 문구로 안내한다(요구사항 6.4.4.4). insights 호출이 BE에 AI 집계를 반영(upsert)하게 하므로 판매자 화면이 주기적으로 부른다.
- 미답변 목록 항목은 `questionId`, `representativeText`, `count`다. `pending`은 답변 대기, `answered`는 판매자가 답변한 질문이다. 초안·등록 응답은 `{draftAnswer, referenceChunks, sent}`이며 `draftAnswer`는 `null`일 수 있다. `referenceChunks`는 판매자 참고자료이지 답변이 검증됐다는 보증이 아니다.
- `GENERATE`는 초안 조회이며 저장하지 않는다. `SEND`는 AI에 판매자 답변을 등록한 뒤 BE에 기록한다. `sent=true`를 실제 채팅 게시 완료로 해석하지 않는다. 실제 채팅 게시 책임은 PR 설명과 코드 주석이 달라 별도 합의 대상이다.
- `/playback`은 종료된 방송의 VOD를 반환할 수 있다. 아직 VOD가 없으면 409, 진행 중이 아닌 방송 등은 404를 반환한다. 미준비·오류를 성공한 재생으로 표시하지 않는다.
- BE의 댓글 배치 간격은 FE 갱신 SLA가 아니다. 판매자 콘솔의 갱신 주기는 FE가 정한다(#320, 아래 절).
- IVS 구축, 채팅 송수신·게시, 큐시트·하이라이트 생성, 방송 시작·종료 변경은 #227 범위 밖이다. HTTP AI 모드의 큐시트·하이라이트 요청은 이 BE 커밋에서 미구현이다.
- 실제 BE 배포·IVS 송출 검증과 모의 API·테스트 영상 검증은 구분한다. 테스트 환경이 준비되지 않아도 이 공개 계약을 기준으로 FE 구현을 진행할 수 있다.
- 공개 하이라이트 GET `/highlights/public`(#270·#317, BE develop `9a0290bb`): 비인증이며 `{markers: [...], clips: [...]}`다. 항목은 `highlightId`, `sceneLabel`, `title`, `startSec`, `endSec`, `clipUrl`, `caption`, `isPublic`, `generationStatus`이고 `kind` 필드는 없다(배열로 구분).
  - 판매자가 공개한 항목(`isPublic=true`, 사실상 완료분)만 온다. 호출할 때마다 공개 항목 조회수가 올라가므로 FE는 화면당 한 번만 부른다.
  - `sceneLabel`은 영문 enum이라 FE가 표시명으로 바꾼다: INTRO 도입, PRICE_BENEFIT 가격·혜택, DEMO 시연, SPEC 스펙·기능, COMPARISON 비교, AUDIENCE_REACTION 질문 응답, CLOSING 마무리(AI 요구서 기준). 모르는 값은 기타로 적는다. BE develop은 아직 5종이고 INTRO·CLOSING은 BE 브랜치에서 추가 중이다.
  - `clipUrl`은 AI 서버가 서빙하는 9:16 mp4이며 제목·자막이 영상에 번인돼 있다. FE는 `<video>`로 직접 재생하고 화면 자막을 겹쳐 그리지 않는다. 쇼츠 배지는 DEMO면 시연 영상, 그 외는 하이라이트다.
  - BE는 VOD 길이를 주지 않는다. 구간 진행률은 플레이어 메타데이터의 길이로 계산한다.
- 구간 채팅 GET `/vod/chat?fromSec&toSec`(#270): 비인증, `{senderId, content, offsetSec}[]`. 구간이 600초를 넘거나 역전되면 400이다.

### 5.7. 판매자 LIVE 생성·설정·AI 큐시트 (#289)

기준은 `KT-Cloud-Tech-Up-team6/Fundit-backend`의 `live-service` 공개 컨트롤러·DTO(`LiveController`, `LiveAiController`)다. `liveId`·`projectId`는 UUID이며 인가는 전부 **소유권 검증**이다.

| 동작           | Method·Path                              | 요청 → 응답                                                                                                                                  |
| -------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| LIVE 생성      | POST `/api/v1/lives`                     | `{projectId}` → 201 `{liveId, status}`. 생성 직후는 항상 `DRAFT`다.                                                                          |
| 기본 설정 저장 | PATCH `/api/v1/lives/{liveId}/settings`  | `{category:{major,minor}?, introText?, thumbnailUrl?, scheduledStartAt?}` → `{liveId, status, scheduledStartAt, actualStartAt, actualEndAt}` |
| 큐시트 생성    | POST `/api/v1/lives/{liveId}/cue-sheet`  | `{mode, targetDurationSec, demoAvailable?, emphasisPoints?, tone?, mandatoryPhrases?}` → 202 `GENERATING`                                    |
| 큐시트 조회    | GET `/api/v1/lives/{liveId}/cue-sheet`   | `{status, mode, totalDurationSec, segments, failureReason}`                                                                                  |
| 큐시트 수정    | PATCH `/api/v1/lives/{liveId}/cue-sheet` | `{segments: [...]}` → 같은 조회 DTO                                                                                                          |

- **부분 업데이트다.** `PATCH /settings`에서 보내지 않은 필드는 서버가 건드리지 않는다. 연결 프로젝트는 요청에 없다 — 요구사항정의서 6.2.4.1이 변경 불가로 정했고 바꾸려면 LIVE를 새로 만든다.
- `introText`는 `@Size(max = 200)`이다. 화면 입력 제한도 같은 값을 쓴다.
- `mode`는 `SCENARIO`·`SCRIPT`, `targetDurationSec`는 600초 이하다. 넘기면 400이고 이미 생성 중이면 409다.
- **생성은 비동기다.** `POST`는 `GENERATING`만 돌려주고 BE가 별도 스레드에서 AI를 호출해 결과를 채운다. `jobId`는 없고 세션당 큐시트가 1개라 `GET`의 `status`(`GENERATING`·`COMPLETED`·`FAILED`)를 폴링한다. 실패 사유는 `failureReason`이다.
- `segments`는 **JSON 문자열**이다. BE가 AI 계약을 타입으로 박지 않고 그대로 저장·반환하므로 구조 확인은 FE 몫이다. 현재 구간은 `{id, title, duration, outline, script}`이며 `duration`은 초다.
- 큐시트를 한 번도 요청하지 않은 LIVE는 `GET`이 404다. 오류가 아니라 "아직 없음"이다.
- `FAILED` 화면은 원본에 없어 **`FL_S_LVS_AIC_FAIL`**로 화면 ID를 새로 부여했다. 생성 중(`FL_S_LVS_AIC`)과 같은 자리·배경을 쓰고 `failureReason`과 재시도만 둔다. 재시도는 직전 조건(`mode`·`targetDurationSec`)으로 `POST`를 다시 보낸다.
- 스텁 모드(`live.ai.mode=stub`)의 결과는 `[stub]` 한 구간뿐이다. 실연동과 스텁 결과를 구분한다.
- #289 당시에는 `liveId` 단건 조회 API가 없었다. `/playback`은 공개용이라 `DRAFT`·`SCHEDULED`에서 404여서, LIVE의 `projectId`가 필요한 큐시트 화면은 `/lives/mine`에서 찾는다. 이후 BE #139가 소유자 단건 조회(`GET /api/v1/lives/{liveId}`)를 추가했고 콘솔(#320)은 이를 쓴다. 큐시트 화면의 우회 제거는 별도 작업이다.
- 송출 시작(`POST /start`)은 스트림 키 조회 API가 없어 화면에 붙이지 않았다.

### 5.8. 판매자 LIVE 콘솔 (#320)

`/seller/live/{UUID}/console`은 Figma 콘솔 UI(데모와 같은 패널)에 아래 API를 연결한다. 기준은 BE `develop` `09231959`다.

| 영역                      | API                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| 헤더 LIVE 종료            | POST `/api/v1/lives/{liveId}/end` → `{liveId, status, ...}`. 진행 중이 아니면 409.          |
| 송출 모니터링             | GET `/playback` 영상, GET `/api/v1/lives/{liveId}`의 `viewerCount`·`elapsedSeconds`(소유자) |
| 큐시트 패널               | GET `/cue-sheet`(404는 "큐시트 없음")                                                       |
| 질문 요약·원문·초안·등록  | 5.6의 `/chat/unanswered`·`/chat/questions/{id}`·`ai-answer`                                 |
| AI 상태                   | 5.6의 `/chat/insights` `aiStatus`                                                           |
| 집계된 Q&A·LIVE 체크 목록 | 5.6의 `/chat/answered-questions`(시청자 Q&A와 같은 목록, IA 46)                             |
| LIVE 체크 추가            | POST `/api/v1/projects/{projectId}/live-verifications` `{questionSummaryId, answer}` → 201  |

- `GET /api/v1/lives/{liveId}`는 소유자 전용 단건 조회다(BE #139). `viewerCount`·`elapsedSeconds`는 `LIVE`일 때만 채워지고 그 밖에는 `null`이다. 위 5.7의 `/lives/mine` 우회는 큐시트 화면에 그대로 남아 있다.
- insights·unanswered·answered-questions·단건은 30초마다 다시 부른다. AI 집계 창(3분)보다 짧게 잡아 새 질문이 늦게 보이지 않게 한다. 제목 옆 갱신 시각을 누르면 바로 다시 받는다.
- 질문을 고르면 `GENERATE`로 초안을 바로 받는다(IA 44). 이미 답변한 질문은 등록한 답변을 보여 주고 재생성할 때만 받는다. `draftAnswer=null`이면 Figma 추천 답변 불가 화면(`1299:33974`, 카드 `1299:33990`)처럼 경고 카드와 답변 완료 처리만 두고, 초안을 받아 본 질문은 목록에서도 경고 행(`1475:41746`)으로 표시한다.
- "채팅 보내기"는 `SEND`로 답변을 등록한다. 채팅 게시는 IVS 미연동이라 등록 후 "채팅 게시는 준비 중"을 안내한다(2026-09-23 결정).
- LIVE 검증 등록은 한 번에 한 건이라 고른 질문을 순서대로 보낸다. 실패한 건만 선택에 남겨 다시 보낼 수 있다. BE가 같은 질문의 중복 등록을 막지 않아 한 화면에서 올린 질문은 다시 고르지 못하게 한다. 새로고침하면 이 표시는 사라진다.
- BE API가 없는 답변 완료 처리, 스트림 상태 확인, 방송 중 펀딩 건수·금액, 판매자 채팅은 Figma 자리에 목업으로 둔다. 누르면 "준비 중"을 안내하고 수치는 `-`다(2026-09-23 결정).
- BE는 방송 종료 시 `live.questions-summarized.v1`을 발행하지만 develop의 project-service에는 이 이벤트 소비자가 없다. LIVE 체크는 판매자가 고른 질문만 위 POST로 올린다.

## 6. 최신 답변으로 정리한 차이

아래 표는 2026-09-08 답변으로 정리했던 차이를 보존한다. 2026-09-14 인증·회원 YAML 반영 내용과 코드 불일치는 4장이 우선한다.

| 기존 자료                               | 이번 초안 기준                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 로그인 member 객체 포함 예시            | 최신 답변의 accessToken·mustChangePassword만 사용.                                                                   |
| 날짜 Z 누락·null 키 존재 예시           | 현재 구현 답변의 UTC·null 키 생략 적용.                                                                              |
| 모든 로컬 리소스 ID는 Long이라는 일반화 | 회원 답변의 범위와 프로젝트 공개 UUID를 구분. Member 찜의 숫자 projectId 예시도 프로젝트 UUID 명세와 연동 대조 필요. |
| 제출 400/422 혼재·삭제 공통 오류        | 최신 프로젝트 전용 422 코드 적용.                                                                                    |
| 제출 필수값에 환불 특이사항 포함        | 최신 BE 답변의 5.1 조건 적용.                                                                                        |
| 고시 템플릿 검증·업로드 제한 구현 서술  | 현재 고시 검증 없음·URL 저장만 구현으로 정정.                                                                        |
| MSW 허용 여부·최종 기준 미정            | 합의한 임시 명세 기반 MSW 허용, 최종 기준 Swagger.                                                                   |

## 7. MSW·변경 관리

미구현 API도 **합의한 임시 명세**를 기준으로 MSW 선작성이 가능하다는 BE 답변을 받았다. 누락된 계약을 FE가 임의 확정해도 된다는 뜻은 아니다. 정상·대표 오류·빈 목록·204·detail 생략을 포함하고 실제 계약과 임시 목업을 구분한다.

최종 계약 및 변경 기준은 Swagger다. 이 Markdown은 근거·현재 구현·연동 준비를 정리한 보조 문서이며 Swagger를 대체하지 않는다. Swagger 갱신 책임·변경 알림 채널·목업 동기화 절차는 팀 협의로 정한다. 코드·MSW·환경변수는 이번 문서 갱신에서 변경하지 않는다.

## 8. 남은 항목

이미 답변된 로그인 본문·본인인증 상태·이전 만료시간 가정값·프로젝트 오류 등을 처음부터 다시 묻지 않는다. 최신 YAML에 반영된 항목은 완료로 구분하되, 아래 명세 불일치·누락·정책 최종 확정만 해당 기능 연동 전에 확인한다.

### 8.1. 기술 확인

| 항목                | 확인할 내용                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기준·접근·구현 상태 | YAML 기준 커밋·추출 시점, 제외된 API와 일정, 개발 Gateway 주소·배포 버전·테스트 계정/데이터. 인증 방식은 YAML의 Bearer 기준이며 실제 연결은 확인 필요.         |
| 인증·회원 DTO       | 4.6의 nickname·소셜·찜 삭제/페이지 범위 불일치, 가입 address 내부 구조, 요청·응답 required/null·기본값, 가입·갱신 Set-Cookie 정의.                             |
| 오류 계약           | detail 설명과 object 스키마 불일치, API별 HTTP 상태·도메인 코드·대표 오류 응답 보완.                                                                           |
| 화면 데이터         | 회원 이메일·이미지·등급·혜택, 찜 목록 판매자·달성률·종료 상태의 제공 API, 팔로우 목록·등록·해제와 목록 정렬 기준. 검색·LIVE 알림·환불 내역의 별도 서비스 명세. |
| 프로젝트 DTO 보완   | businessType 전체 enum·카테고리 조회 방식, 성공 상태와 PATCH null 의미.                                                                                        |
| 교차 서비스 ID      | Long JSON 범위. 프로젝트 UUID와 Member 찜의 숫자 projectId 연결은 #250에서 확정.                                                                               |
| AI 세부 계약        | 추가 질문·답변 제출·오류/재시도 필드 및 실제 구현 여부.                                                                                                        |
| 결과 불명 복구      | 가입·생성 등 요청 타임아웃 시 성공 여부 확인·중복 방지 방법.                                                                                                   |
| 재고 조회 실패      | 프로젝트 명세의 remainingStock null 정상 응답과 503 오류 중 실제 응답.                                                                                         |
| 계정 복구·소셜      | 계정 복구 계약은 4.7에서 코드 확인. 실제 메일·PortOne 설정 검증, 소셜 인증의 연동 범위·일정·TTL 확인.                                                          |

### 8.2. 정책·환경 협의

| 항목          | 협의 내용                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| 호출 구조     | 직접 호출/BFF, Gateway/서비스별 호출, FE Origin, CORS·Credential·쿠키 설정.                                    |
| 인증 정책     | Access/Refresh TTL·비밀번호 개발 가정값의 PM 확정, 재설정 사용자 흐름. 로그아웃·Refresh 무효화는 4.3에서 확정. |
| 프로젝트 상태 | 진행 중 수정 가능 필드·가격·리워드 삭제 및 서버 검증, 종료 상태 전환.                                          |
| 동의·고시     | 프로젝트 약관·개인정보 동의의 관계, 카테고리별 고시 필수 키.                                                   |
| 업로드·콘텐츠 | 업로드 절차·용량·확장자, 리치 텍스트와 introContent 변환 및 URL 저장.                                          |
| 금액·ID 표현  | 통화·단위·소수·허용 범위 및 안전한 직렬화.                                                                     |
| 운영          | 구버전 유지 기간, Swagger 갱신·변경 공유·MSW 동기화 절차.                                                      |

남은 항목 전체가 완료되어야 문서나 와이어프레임 작업을 진행할 수 있는 것은 아니다. 실제 연동 대상 기능에 필요한 항목부터 확인·협의한다.

### 새 소식 입력 검증

새 소식 제목은 제출 전에 공백을 제거해 필수값을 검사한다. 제목이 비어 있으면 등록 버튼과 제출 처리를 막되, 안내는 폼 입력을 변경하거나 제출을 시도한 뒤에 표시한다. 처음 진입하거나 등록에 성공해 입력이 초기화되면 경고를 표시하지 않는다. 본문은 기존 필수 검증을 유지한다.

### 2026-09-22 새 소식 재편집 연결 (#232, BE PR #108)

- 소유 판매자가 조회 가능한 게시글의 제목·본문을 `PATCH /api/v1/notices/{noticeId}`로 수정한다. 변경한 필드만 전송하며 제목은 1~100자, noticeType은 변경하지 않는다.
- 성공 응답을 본문 캐시에 반영하고 목록·본문을 재조회한다. 403·404·서버 오류에서는 입력을 유지한다. 구매자 상세는 읽기 전용이다.
- 기존 GET 목록·본문은 공개 프로젝트만 허용하므로 비공개 프로젝트의 재편집 진입은 BE 조회 계약 보완이 필요하다.
- 격리 브라우저의 API fixture로 저장·재편집·부분 변경·403/503 입력 보존을 검증했다. 실제 배포 서버의 권한·저장 지속성은 미검증이다.

### 2026-09-22 구매자 환불 내역 조회 연결 (#261)

Gateway가 `/api/v1/refunds/**`와 `/api/v2/refunds/**`를 payment-service로 보낸다. 목록은 **v2를 쓴다** — v1 `RefundSummaryResponse`의 `fundingId`는 결제 도메인이 UUID만 저장해 항상 null이다.

`GET /api/v2/refunds?page&size` → `PageResponse<RefundSummaryResponseV2>`

| 필드             | 형                                            | 비고                                                                                         |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `refundId`       | Long                                          | 하자환불 결정(`PATCH /api/v1/refunds/{refundId}/decision`)의 경로 값과 같다                  |
| `fundingId`      | UUID                                          | order-service publicId                                                                       |
| `triggerType`    | String                                        | `SIMPLE_CHANGE_OF_MIND`·`GOAL_FAILED_AUTO`·`DEFECT`·`SHIPPING_DELAY`·`SYSTEM_RECONCILIATION` |
| `status`         | String                                        | `REQUESTED`·`UNDER_REVIEW`·`APPROVED`·`PROCESSING`·`COMPLETED`·`REJECTED`                    |
| `amount`         | long                                          | `payment.amount`. 반품비 차감 정책이 없어 현재는 전액이다                                    |
| `requestedAt`    | Instant                                       | 서버 정렬은 이 값 내림차순 고정                                                              |
| `completedAt`    | Instant \| null                               | 최종 결정 전이면 null                                                                        |
| `reasonDetail`   | String \| null                                | DEFECT는 `[DEFECTIVE] 설명`처럼 하자 유형 태그가 앞에 붙어 저장된다                          |
| `rejectedReason` | String \| null                                | 반려된 건에만 채워진다                                                                       |
| `projectTitle`   | String \| null                                | order-service 배치 조회 결과                                                                 |
| `lineItems`      | `{rewardName, quantity, unitPrice}[]` \| null | 위와 같음                                                                                    |

`projectTitle`·`lineItems`는 **부가 정보라 order-service 조회가 실패하면 목록은 그대로 내려오고 이 둘만 null이 된다**(`RefundQueryService`). FE는 이 응답에서도 화면이 깨지지 않게 처리한다.

**서버 필터·정렬 파라미터가 없다.** 유형·진행 여부 필터는 현재 페이지 안에서만 동작한다.

#### 표시 매핑

`RefundTriggerType.toOrderServiceReason()`의 매핑을 근거로 원본의 유형 문구에 대응시킨다.

| triggerType                                           | 유형 |
| ----------------------------------------------------- | ---- |
| `SIMPLE_CHANGE_OF_MIND`, `SHIPPING_DELAY`             | 취소 |
| `DEFECT`, `GOAL_FAILED_AUTO`, `SYSTEM_RECONCILIATION` | 환불 |

| status                                                | 표시                      | Badge     |
| ----------------------------------------------------- | ------------------------- | --------- |
| `REQUESTED`, `UNDER_REVIEW`, `APPROVED`, `PROCESSING` | `{유형} 진행 중`          | `warning` |
| `COMPLETED`                                           | `{유형} 완료`             | `neutral` |
| `REJECTED`                                            | `{유형} 반려` + 반려 사유 | `neutral` |

실 환불 금액은 `COMPLETED`에서만 고지한다. 진행 중·반려는 확정 금액이 아니다.

#### 아직 계약이 없어 채우지 못하는 값

원본에 자리가 있으나 응답에 대응 필드가 없다. 값을 만들지 않고 자리만 유지한다.

| 화면 요소                       | 필요한 것                                                             |
| ------------------------------- | --------------------------------------------------------------------- |
| 유형 필터 "교환"                | 교환 신청·조회 계약 일체. `RefundTriggerType`에 교환이 없다           |
| 펀딩번호 `FD<yyyyMMdd>-<6자리>` | 목록 응답의 주문번호 필드. 현재는 `fundingId`(UUID)뿐이다             |
| 옵션                            | `lineItems`의 옵션명·옵션값                                           |
| 적립금 환불 금액                | 적립금 환불 계약                                                      |
| 유형·진행 여부 서버 필터        | 목록의 필터 파라미터. `totalElements`는 제공되므로 총 개수와는 별개다 |

환불 **신청**(`POST /api/v2/refunds/defect`, `POST /api/v2/refunds/shipping-delay`, `GET /api/v1/refunds/estimate`, `POST /api/v1/refunds/evidence/upload-url`)은 이번 연결 범위가 아니다.

조사 기준은 BE `origin/develop` `ce5d882`다. 실제 서버 응답과의 대조는 BE QA 서버가 뜬 뒤에 한다.

### 2026-09-22 환불 신청 제출 연결 (#263)

조회(#261)와 같은 payment-service이며 Gateway 경로도 같다. 신청은 v2를 쓴다 — v1 요청의 `fundingId`가 Long이라 컨트롤러가 order-service를 한 번 더 조회해 UUID로 바꾸는데, FE는 이미 UUID를 들고 있다.

| 동작              | 경로                                       | 요청                                                           | 응답                                                                 |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| 하자 환불 신청    | `POST /api/v2/refunds/defect`              | `{fundingId(UUID), defectType, reasonDetail?, evidenceUrls[]}` | 201 `{refundId, status}`                                             |
| 발송지연 결제취소 | `POST /api/v2/refunds/shipping-delay`      | `{fundingId(UUID)}`                                            | 201 `{refundId, status}`                                             |
| 예상 환불액       | `GET /api/v1/refunds/estimate?orderId=`    | —                                                              | `{orderId, rewardAmount, shippingFee, discountAmount, refundAmount}` |
| 증빙 업로드 주소  | `POST /api/v1/refunds/evidence/upload-url` | `{orderId(UUID), fileName, contentType, fileSize}`             | `{uploadUrl, fileUrl}`                                               |

`fundingId`와 `orderId`는 같은 값(order-service publicId)이다.

`defectType`은 `DEFECTIVE`·`DAMAGED`·`DIFFERENT_FROM_DESCRIPTION` 3종이다. BE는 `reasonDetail` 앞에 `[DEFECTIVE] `처럼 태그를 붙여 한 컬럼에 저장한다(별도 컬럼이 없다).

`evidenceUrls`는 `@NotEmpty`다. 하자 환불은 증빙 없이 제출하면 400이다.

신청은 `REQUESTED` 상태로 접수될 뿐 이 시점에 결제가 취소되지 않는다. 취소 실행은 판매자 승인(`PATCH /api/v1/refunds/{refundId}/decision`) 이후다.

#### 예상 환불액

`RefundEstimateService`는 결제가 `COMPLETED`인 주문에만 응답하고 본인 확인에 실패하면 403이다. 반품비 차감(R04) 정책이 없어 **`refundAmount`는 현재 항상 `payment.amount`와 같다.** FE는 이 값을 그대로 고지하고 금액을 직접 계산하지 않는다.

`shippingFee`는 **주문 때 낸 배송비**이고 `refundAmount`에 이미 포함돼 있다. 환불에서 빠지는 금액이 아니므로 화면의 "배송비" 행은 비워 둔다 — 반품비 차감(R04) 정책이 생기면 그 값으로 채운다.

신청 화면 진입은 `GET /api/v1/orders/{orderId}`의 `availableActions`를 따른다(`Funding.availableActions`). 배송 완료면 `DEFECT_REFUND_REQUEST`, 목표 달성 후 미발송이면 `SHIPPING_DELAY_REFUND_REQUEST`, 진행 중·대기면 `CANCEL`이다. FE는 이 값에 맞는 링크만 노출한다.

#### 증빙 업로드 제약

`RefundEvidenceUploadService` 기준이다.

| 항목               | 값                                                     |
| ------------------ | ------------------------------------------------------ |
| 확장자             | `jpg`·`jpeg`·`png`·`webp`                              |
| Content-Type       | `image/jpeg`·`image/png`·`image/webp`                  |
| 최대 크기          | 10MB                                                   |
| 발급 주소 유효기간 | 5분(`media.upload.presign-ttl-minutes`)                |
| 권한               | 해당 `orderId`의 구매자 본인                           |
| 오류               | `UNSUPPORTED_MEDIA_TYPE`·`MEDIA_TOO_LARGE`·`FORBIDDEN` |

저장 키는 서버가 `refunds/{orderId}/{UUID}.{ext}`로 새로 만든다. FE가 보낸 `fileName`은 확장자만 쓰인다.

프로젝트 미디어 업로드와 값이 겹치지만 서비스도 상수도 따로 관리돼 한쪽이 바뀌어도 다른 쪽을 따르지 않는다. FE도 검증을 공유하지 않는다.

#### 사유 → 계약 매핑

원본 반품 사유 7종·교환 사유 5종 중 계약이 있는 것은 셋뿐이다.

| 유형 | 사유                                         | 보내는 요청           |
| ---- | -------------------------------------------- | --------------------- |
| 반품 | 불량·하자                                    | `/defect` `DEFECTIVE` |
| 반품 | 상품 파손                                    | `/defect` `DAMAGED`   |
| 반품 | 배송 지연                                    | `/shipping-delay`     |
| 반품 | 단순변심·상품이 잘못 배송됨·구성품 누락·기타 | 계약 없음             |
| 교환 | 전체                                         | 계약 없음             |

`DIFFERENT_FROM_DESCRIPTION`은 "표시광고상이"라 "상품이 잘못 배송됨"과 의미가 겹치지만 같지 않아 매핑하지 않았다. 확인이 필요하다.

`SIMPLE_CHANGE_OF_MIND`는 `RefundTriggerType`에 값만 있고 구매자 신청 엔드포인트가 없다. 펀딩 진행 중 참여 취소는 별개 계약(`POST /api/v1/orders/{orderId}/cancel`)이다.

#### 주문 상세에 없는 값

신청 화면 헤더는 이미지·프로젝트명·리워드옵션·수량·금액을 보여준다. `GET /api/v1/orders/{orderId}`의 `OrderDetailResponse`에는 `projectTitle`·`thumbnailUrl`이 없고 목록 응답(`OrderSummaryResponse`)에만 있다. 리워드명·옵션·수량·금액만 채우고 나머지는 자리를 비운다.

### 2026-09-23 BE #124 환불 계약 반영 (#298)

BE PR #124(`develop` `7dd5bd5`)로 위 두 절의 "계약 없음" 중 아래 항목이 생겨 연결했다. 위 절은 당시 기록이다.

| 항목                  | 계약                                                                                      | FE 동작                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 반품 단순변심         | `POST /api/v2/refunds/simple-change-of-mind` `{fundingId}` → 201 `{refundId, status}`     | 사진·상세 미전송 안내. 발송 후면 409 `ALREADY_SHIPPED`를 사유 변경 안내로 표시             |
| 반품 구성품 누락·기타 | `/defect`의 `defectType` `MISSING_COMPONENTS`·`OTHER`                                     | 하자와 같이 사진 필수                                                                      |
| 교환 사유 5종         | `POST /api/v2/refunds/exchange` `{fundingId, reasonDetail, evidenceUrls(1장 이상)}` → 201 | `reasonDetail` = `"{사유 라벨}: {입력 내용}"`. REQUESTED에서 멈추며 승인·완료는 BE 범위 밖 |
| 내역 교환 유형        | `triggerType` `EXCHANGE`                                                                  | "교환" 유형, 사유는 `라벨 · 내용`으로 표시                                                 |
| 내역 진행 중 필터     | `GET /api/v2/refunds?inProgress=true` (REQUESTED·UNDER_REVIEW·APPROVED·PROCESSING)        | URL `?inProgress=true`로 서버 필터, 전환 시 첫 페이지                                      |
| 내역 옵션             | `lineItems[].options[] {optionGroupName, optionValue}`                                    | `그룹 값`을 `·`로 이어 옵션 행에 표시                                                      |
| 신청 화면 헤더        | `OrderDetailResponse.projectTitle`·`thumbnailUrl` (project-service 실패 시 null)          | null이면 자리만 유지                                                                       |

`triggerType` 필터는 값 하나만 받아 여러 트리거를 묶는 "취소"·"환불" 유형을 표현하지 못한다. 유형 필터는 계속 현재 페이지 안에서만 걸린다. 펀딩번호·적립금 환불 금액은 여전히 계약이 없다.
