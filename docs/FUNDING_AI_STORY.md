# 판매자 펀딩 AI 스토리 목업

- 이슈. [#38](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/38).
- 디자인 원본. [판매자 펀딩 AI 스토리](https://www.figma.com/design/ifJ8lcDbezIb223WrS5m6d/?node-id=281-5027).
- 진입 경로. `/seller/projects/demo-story?tab=story`에서 `AI로 펀딩 스토리 작성`을 선택합니다.
- Storybook. `Features/Funding AI Story`의 Initial, Questions, Summarizing, Summary, Generating, Ready, Result, Editor를 제공합니다.

## 구현 범위

제품 설명 → 추가 질문 3개 → 요약·수정 요청 → 생성 중·완료 → 결과 → 본문 불러오기를 제공합니다. 질문은 `storyQuestions`가 단일 원본이며 안내 문구와 진행 분모도 배열 길이를 사용합니다. `해당 사항 없음`은 해당 질문의 답변으로 기록합니다. 수정 요청은 요약과 결과에 명시적으로 추가하는 목업이며 자연어를 해석해 이전 답변을 자동 교정하지 않습니다.

입력창 전체(form)는 최대 178px까지 위로 확장되고 이후 textarea 내부 스크롤을 사용합니다. 178px은 textarea 최대 높이 160px에 상하 패딩 16px과 테두리 2px을 더한 값입니다. Enter로 전송하고 Shift+Enter로 줄을 바꿉니다. 한글 조합 중 Enter는 전송하지 않습니다. 전송하면 textarea 높이는 24px로 초기화됩니다. 이전 대화로 스크롤한 동안에는 자동 하단 이동을 중단하고, 하단으로 돌아오면 다시 따라갑니다.

결과 모달은 본문만 스크롤하고 헤더·하단 버튼을 유지합니다. 이전으로 돌아가면 기존 답변을 보존합니다. 재생성은 동일한 입력을 유지하면서 두 목업 제목을 번갈아 표시합니다. 불러오기는 현재 소개 본문을 결과로 교체하며 실제 저장이나 게시를 하지 않습니다.

## 상태와 경계

- 프로젝트 식별자와 탭은 URL이 소유합니다. 다른 프로젝트로 이동하면 `key={projectId}`로 편집 상태를 초기화합니다.
- 대화와 생성 단계는 기능 내부 reducer, 제목·소개 본문·모달은 편집기 로컬 상태가 소유합니다.
- 모달을 닫으면 대화는 초기화되고, 불러온 본문은 현재 편집기에 남습니다. 새로고침이나 화면 이탈 시 초기화됩니다.
- 지연 타이머는 상태 변경·모달 닫기 때 해제합니다. `pauseDemo`는 Storybook의 생성·요약 정지 상태 검사용입니다.
- AI API, MSW 가상 계약, 외부 HTML iframe, 이미지·영상 업로드, 범용 리치 텍스트 편집기, 서버 저장 및 권한 가드는 포함하지 않습니다.
- 입력은 React 텍스트로 렌더링하며 임의 HTML을 실행하지 않습니다. 임시저장·저장은 목업 안내만 표시합니다.
- 썸네일·첨부·서식 도구는 연동 예정으로 비활성화합니다. 원본 SVG는 `public/icons/funding-story`에 다운로드한 바이트 그대로 보관합니다.

## 디자인 적용과 미확정 항목

2026-09-07 15:09 변경 이력(`532:16494`)은 `cta_button` 텍스트를 Body 16 Semibold로 지정합니다. 사용자 승인에 따라 개별 노드에 남아 있는 이전 값보다 변경 이력을 우선하여 텍스트 CTA에 `text-body-strong`(16px / 600 / 24px)을 적용합니다. 아이콘 전용 버튼·내비게이션·공통 Button 기본값은 변경하지 않습니다. 관련 수정은 [#45](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/45)입니다.

현재 프레임 이름은 `FL_S_PR_AI_1`부터 `FL_S_PR_AI_9`(추가 상태 `FL_S_PR_AI_3.1`), `FL_S_PR_AI_loading_1`, `FL_S_PR_AI_loading_2`, `FL_S_PR_AI_AIEDIT`입니다. 채팅 시작 프레임은 `532:13342`, 결과는 `532:14668`입니다. 이미 반영된 말풍선 반경 12px·처음부터 채팅으로 시작하는 흐름·입력창 확장 동작은 유지합니다.

사용자 승인에 따라 원본의 `1/5`와 `3가지만` 불일치는 3문항으로 통일하고, 결과의 AI 큐시트 표기는 AI 스토리로 수정합니다. 이는 UI 목업 기준이며 BE 계약이나 최종 질문 수 확정이 아닙니다.

공통 Modal·Button·Input·Textarea 및 semantic 토큰을 재사용합니다. 원본의 회색 AI 말풍선은 텍스트 대비를 위해 기존 `layer-surface-primary-hover`와 `text-inverse` 조합으로 매핑합니다. 결과 본문은 원본 레이아웃에 맞춘 신뢰 가능한 로컬 React 미리보기이며 원본의 외부 HTML 이미지나 미확인 제품 성능을 실제 생성 결과로 사용하지 않습니다.

AI 질문·요약·생성·재생성 API와 오류·취소 계약, 구조화 본문 스키마, 업로드 및 임시저장 계약은 별도 합의가 필요합니다. 기존 API 계약 초안은 변경하지 않습니다.

## 검증 명령

PR #46 리뷰 반영으로 공통 Button의 `appearance="cta"`를 사용한다. 이 옵션은 Body 16px / 600 / 24px과 sm 36px·md 40px·lg 46px 높이를 제공하며, `shape="pill"`은 완전 둥근 모서리와 좌우 16px 패딩을 제공한다. 기존 appearance·shape 기본값과 색상 variant는 유지한다. 공통 Button을 사용하는 생성·불러오기·저장 CTA만 전환하며, 별도 보조 버튼 클래스의 공용화는 이번 범위에 포함하지 않는다.

`pnpm test`로 콘솔·큐시트와 함께 상태 전이·건너뛰기·수정 요청·재생성을 검증합니다. CI에서도 같은 명령을 실행하며, `tsx`를 사용해 Node 20에서 TypeScript 모델을 불러옵니다. 프로젝트의 format, lint, typecheck, build, build-storybook 기준을 함께 적용합니다.

2026-09-07 검증에서 모델 테스트 4개와 전체 format·lint·typecheck, Next.js·Storybook 빌드를 통과했습니다. Chrome에서 1440×900 및 390×844의 8개 상태와 다크 테마 3개 상태의 WCAG 2 A/AA·2.1 AA 자동 검사를 통과했습니다. Enter·한글 조합, 입력 높이 제한, 요약 수정, 재생성, 본문 가져오기, 미리보기, Escape·포커스 복원, 이전 대화 읽기·하단 추적 재개도 확인했습니다. Storybook의 기존 번들 크기 경고는 남아 있습니다.
