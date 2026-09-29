<div align="center">

# Fundit

**LIVE로 보고, 묻고, 바로 펀딩하는 리워드 펀딩 서비스**

라이브 커머스형 리워드 펀딩 서비스 Fundit의 프론트엔드 저장소입니다.

<img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
<img src="https://img.shields.io/badge/TanStack_Query_5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query 5" />

</div>

<br />

## 소개

판매자는 프로젝트를 만들고 LIVE 방송으로 제품을 직접 보여 줍니다. 구매자는 방송을 보면서 채팅으로 묻고, 그 자리에서 리워드를 골라 펀딩에 참여합니다.

AI가 판매자의 일을 돕습니다. 스토리 초안을 쓰고, 방송 큐시트를 만들고, 방송 중 쏟아지는 질문을 묶어 답변 초안을 제안합니다. 구매자에게는 프로젝트 요약을 보여 줍니다.

## 주요 기능

<table>
  <tr>
    <th width="33%">🛍️ 구매자</th>
    <th width="33%">🧑‍💼 판매자</th>
    <th width="33%">📺 LIVE · AI</th>
  </tr>
  <tr valign="top">
    <td>
      <ul>
        <li>홈 · 카테고리 · 통합 검색</li>
        <li>프로젝트 상세와 리워드 선택</li>
        <li>주문서 · 쿠폰 · 배송지, Toss 결제</li>
        <li>펀딩 내역, 취소 · 반품 · 교환 신청과 내역</li>
        <li>제작 · 배송 현황</li>
        <li>찜 · 판매자 팔로잉</li>
        <li>본인인증 회원가입 · 로그인 · 계정 찾기</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>프로젝트 기본정보 · 리워드 · 스토리 작성</li>
        <li>Funding Story AI로 스토리 초안 생성</li>
        <li>공개 전 미리보기와 프로젝트 공개</li>
        <li>펀딩 현황 관리</li>
        <li>제작 · 배송 진행 기록과 발송 정보</li>
        <li>LIVE 스튜디오: 생성 · 예약 · 임시저장 · 시작</li>
        <li>LIVE 클립 관리(숏 클립 공개)</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>LIVE 시청(HLS)과 실시간 채팅(Amazon IVS Chat)</li>
        <li>좋아요 · 공유 · Q&amp;A</li>
        <li>다시보기 구간 탐색 · 구간 채팅, 숏 클립</li>
        <li>AI 큐시트 생성</li>
        <li>LIVE 콘솔: 송출 모니터링, 주문 건수 · 매출, AI 라이브 매니저(질문 요약 · 답변 초안 · 자동 답변)</li>
        <li>방송 뒤 LIVE 체크 게시</li>
        <li>AI 프로젝트 요약</li>
      </ul>
    </td>
  </tr>
</table>

> 소셜 로그인, 홈 히어로 배너처럼 서비스 결정에 따라 목업으로 둔 기능이 있습니다. 화면별 범위는 [라우팅 문서](./docs/ROUTING.md)를 참고하세요.

## 기술 스택

<table>
  <tr>
    <th width="130">분류</th>
    <th>기술</th>
  </tr>
  <tr>
    <td>프레임워크 · 언어</td>
    <td>
      <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
      <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    </td>
  </tr>
  <tr>
    <td>스타일</td>
    <td>
      <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
      <img src="https://img.shields.io/badge/CSS_Modules-000000?style=for-the-badge&logo=cssmodules&logoColor=white" alt="CSS Modules" />
    </td>
  </tr>
  <tr>
    <td>서버 상태 · 폼</td>
    <td>
      <img src="https://img.shields.io/badge/TanStack_Query_5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query 5" />
      <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white" alt="React Hook Form" />
      <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
    </td>
  </tr>
  <tr>
    <td>에디터 · 미디어</td>
    <td>
      <img src="https://img.shields.io/badge/Tiptap_3-1A1A1A?style=for-the-badge" alt="Tiptap 3" />
      <img src="https://img.shields.io/badge/hls.js-3A3A3A?style=for-the-badge" alt="hls.js" />
      <img src="https://img.shields.io/badge/Amazon_IVS_Chat-FF9900?style=for-the-badge" alt="Amazon IVS Chat" />
    </td>
  </tr>
  <tr>
    <td>결제 · 인증</td>
    <td>
      <img src="https://img.shields.io/badge/Toss_Payments-0064FF?style=for-the-badge" alt="Toss Payments" />
      <img src="https://img.shields.io/badge/PortOne-222222?style=for-the-badge" alt="PortOne" />
    </td>
  </tr>
  <tr>
    <td>목업 · 테스트</td>
    <td>
      <img src="https://img.shields.io/badge/MSW-FF6A33?style=for-the-badge&logo=mockserviceworker&logoColor=white" alt="MSW" />
      <img src="https://img.shields.io/badge/Node.js_Test_Runner-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Test Runner" />
      <img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge" alt="Playwright" />
      <img src="https://img.shields.io/badge/Storybook_10-FF4785?style=for-the-badge&logo=storybook&logoColor=white" alt="Storybook 10" />
    </td>
  </tr>
  <tr>
    <td>코드 품질</td>
    <td>
      <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
      <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" />
    </td>
  </tr>
  <tr>
    <td>빌드 · 배포</td>
    <td>
      <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
      <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
      <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
      <img src="https://img.shields.io/badge/Amazon_ECR-FF9900?style=for-the-badge" alt="Amazon ECR" />
    </td>
  </tr>
  <tr>
    <td>협업</td>
    <td>
      <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma" />
      <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white" alt="Notion" />
      <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
    </td>
  </tr>
</table>

## FE 개발자 소개

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/intothehead">
        <img
          src="https://github.com/intothehead.png?size=120"
          width="110"
          alt="이중호"
        />
        <br />
        <strong>이중호</strong>
      </a>
      <br />
      FE / 파트장
    </td>
    <td align="center">
      <a href="https://github.com/hanna-um">
        <img
          src="https://github.com/hanna-um.png?size=120"
          width="110"
          alt="엄한나"
        />
        <br />
        <strong>엄한나</strong>
      </a>
      <br />
      FE / 팀원
    </td>
  </tr>
</table>

## 구조

App Router의 Route Group으로 구매자 · 판매자 · 인증 · LIVE 콘솔 화면을 나누고, 코드는 기능 단위로 나눕니다.

```text
src/
├─ app/        # 라우트 (구매자 · 판매자 · 인증 · LIVE 콘솔 Route Group)
├─ features/   # 사용자 기능별 모델 · API · UI
├─ entities/   # 도메인 모델과 공용 API
├─ providers/  # 인증 · 쿼리 Provider
└─ shared/     # 공용 UI · API 클라이언트 · 설정
```

- **상태 관리**: 공유 링크 · 새로고침 · 뒤로가기에 필요한 값은 URL, 서버 데이터는 TanStack Query, 화면 안의 입력 · 단계는 React 지역 상태로 둡니다.
- **반응형**: 1199px 이하는 모바일, 1200px 이상은 웹 레이아웃입니다. 판매자 화면은 PC 기준입니다.
- **디자인**: Figma 기준의 디자인 토큰과 공용 컴포넌트를 쓰고, 기본 글꼴은 Pretendard Variable입니다.

## 품질 관리

<table>
  <tr>
    <th width="130">구분</th>
    <th>내용</th>
  </tr>
  <tr>
    <td>단위 테스트</td>
    <td>Node.js 테스트 러너로 화면 모델 · API 클라이언트 · 유틸리티를 검사합니다.</td>
  </tr>
  <tr>
    <td>Storybook</td>
    <td>공용 컴포넌트와 화면 상태를 스토리로 확인하고, 접근성 애드온과 play 테스트로 동작을 검사합니다.</td>
  </tr>
  <tr>
    <td>E2E</td>
    <td>IA의 유저 플로우(UCS) 단계를 기준으로 구매자 · 판매자 핵심 여정을 Playwright로 검사합니다. <a href="./docs/E2E_TESTING.md">E2E 문서</a></td>
  </tr>
  <tr>
    <td>CI · 배포</td>
    <td>PR마다 포맷 · 린트 · 타입 · 빌드 · 테스트와 Docker 이미지 기동을 확인합니다. main에 병합하면 이미지를 Amazon ECR에 올리고, Fundit-GitOps의 이미지 태그로 dev에 배포합니다.</td>
  </tr>
</table>

## 문서

<table>
  <tr>
    <td>🛠️ <a href="./docs/DEVELOPMENT.md">개발 환경 · 실행 방법</a></td>
    <td>🤝 <a href="./CONTRIBUTING.md">기여 가이드</a></td>
  </tr>
  <tr>
    <td>🧱 <a href="./docs/ARCHITECTURE.md">아키텍처</a></td>
    <td>🧭 <a href="./docs/ROUTING.md">라우팅</a></td>
  </tr>
  <tr>
    <td>🗂️ <a href="./docs/STATE_MANAGEMENT.md">상태 관리</a></td>
    <td>🔌 <a href="./docs/API_CONTRACT.md">API 계약</a></td>
  </tr>
  <tr>
    <td>🎨 <a href="./docs/DESIGN_TOKENS.md">디자인 토큰</a></td>
    <td>🧩 <a href="./docs/SHARED_COMPONENTS.md">공용 컴포넌트</a></td>
  </tr>
  <tr>
    <td>🧪 <a href="./docs/E2E_TESTING.md">E2E 테스트</a></td>
    <td>🐳 <a href="./docs/CONTAINER_DEPLOYMENT.md">컨테이너 배포</a></td>
  </tr>
</table>

<div align="center">

[KT-Cloud-Tech-Up-team6](https://github.com/KT-Cloud-Tech-Up-team6)

</div>
