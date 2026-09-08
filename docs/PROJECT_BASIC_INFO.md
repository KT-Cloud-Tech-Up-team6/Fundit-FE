# 판매자 기본 정보·리워드 목업

## Design Source

- [Figma 지정 영역](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=281-5059), [Issue #42](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/42).
- 기준 프레임은 `532:12231`, `532:12333`, `532:12478`, `532:12622`입니다. 카테고리 예시는 `418:5765`를 참고합니다.
- 경로는 `/seller/projects/new`이며 기존 SellerShell을 사용합니다.

## 구현 범위

- 사업자 유형, 제목, 카테고리, 목표 금액 입력과 금액 증액·초기화.
- 리워드 빈 상태, 추가, 목록, 수정, 삭제.
- 작성 중 하단 저장은 리워드를 현재 목록에 반영합니다. 작성 패널이 닫혀 있으면 기본 정보의 목업 입력을 검사합니다.
- 수량 제한을 해제하면 저장 시 수량을 비웁니다. 얼리버드·옵션은 승인된 범위에 따라 체크 상태만 유지하며 상세 설정 패널은 만들지 않습니다.
- 임시저장·저장은 서버나 브라우저 저장소를 사용하지 않습니다. 새로고침·이동 시 초기화되며 다음 화면으로 이동하지 않습니다.
- 이미지 업로드는 미구현으로 비활성화했습니다. 실제 API·인증·소유권 검증도 포함하지 않습니다.
- 상세 카테고리는 원본에 있는 홈 · 리빙 목록만 제공합니다. 나머지 대분류의 상세 목록은 비활성 상태로 연동 예정 안내를 표시합니다.
- 목표 금액 500,000원, 리워드 이름·양의 정수 가격·제한 수량 검사는 화면 목업용이며 BE 계약을 확정하지 않습니다.

## 공통 요소 재사용

- 기존 Button, Input, Textarea, Chip, Checkbox, Icon을 사용합니다.
- 하단 임시저장·저장은 Figma `532:12232` 기준 180×46px, Body 16px·Semibold 600·줄 높이 24px입니다. 저장은 Button의 CTA 옵션, 임시저장 글자는 text-body-strong 토큰을 재사용합니다. 관련 수정은 [Issue #50](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/50)이며 FooterButtons 스토리에서 타이포·크기·기존 클릭 동작을 검증합니다.
- 카테고리는 화면 전용 CategoryDropdown을 사용합니다. 원본의 입력 높이 46px, 목록 간격 8px, 항목 높이 40px·간격 4px, 최대 목록 높이 218px를 반영합니다. 색상은 프로젝트 시맨틱 토큰을 사용하고, 목록이 넘칠 때 실제 스크롤을 제공합니다.
- 방향키·Home·End로 탐색하고 Enter·Space로 선택합니다. Escape는 선택을 변경하지 않고 닫으며, Tab·바깥 클릭도 목록을 닫습니다. 기존 공통 Select는 변경하지 않습니다.
- Checkbox에는 원본 사각 외곽선을 사용하는 square 모양을 추가했습니다. 기존 기본 모양은 유지합니다.
- 동일한 기존 아이콘이 없는 경우에만 Figma 원본 SVG를 추가했습니다. arrow_down, reset_amount, plus_circle, plus_square, gift, checkbox_empty, close_small은 원본 바이트를 사용합니다.

## 확인 방법

- Storybook `Features/Project Basic Info`의 Empty, Adding, RewardList, AddToList에서 원본 상태를 확인합니다.
- RewardLifecycle은 입력 오류, 추가, 수정, 수량 제한 해제, 삭제를 검증합니다. CategoriesAndAmount는 상세 카테고리 초기화와 금액 조작을 검증합니다.
- MainCategoryOpen과 SubcategoryOpen에서 펼침 상태를 확인합니다. CategoriesAndAmount는 키보드 선택·취소·포커스 이동·바깥 클릭도 검증합니다.
- `pnpm test`는 금액·리워드 검증 및 목록 갱신 모델 테스트를 포함합니다.
