# 개발 환경

README에서 옮긴 로컬 실행·환경변수·명령어·테스트·배포 안내입니다. 브랜치·커밋·PR 규칙은 [기여 가이드](../CONTRIBUTING.md)를 따릅니다.

## 요구 사항

CI·Docker와 같은 **Node.js 24**, **pnpm 10.33.2**를 사용합니다.

## 로컬 실행

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`http://localhost:3000`에 접속하면 홈 화면이 열립니다.

## 환경변수

필요하면 `.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

PowerShell에서는 `Copy-Item .env.example .env.local`을 사용합니다.

| 변수                              | 용도                                                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | 브라우저에서 부를 API 주소. 비우면 같은 origin의 `/api/...`로 요청합니다.                                                                                                                             |
| `API_PROXY_TARGET`                | 로컬 개발용. 값을 주면 `next.config.ts`가 `/api/*`를 이 주소(BE Gateway)로 프록시해 CORS·SameSite 쿠키 문제를 피합니다. 이때 `NEXT_PUBLIC_API_BASE_URL`은 비워 둡니다. 값이 없으면 프록시는 꺼집니다. |
| `NEXT_PUBLIC_MSW_ENABLED`         | 개발 모드에서 MSW 목업 응답을 켤지 여부. 실제 BE에 연결하면 `false`입니다.                                                                                                                            |
| `NEXT_PUBLIC_PORTONE_STORE_ID`    | PortOne 본인인증용 공개 상점 식별자                                                                                                                                                                   |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PortOne 본인인증용 공개 채널 식별자                                                                                                                                                                   |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY`     | Toss 결제위젯 클라이언트 키. BE가 승인에 쓰는 위젯 시크릿 키와 같은 상점의 키여야 하며, 비어 있으면 결제 화면이 비활성화됩니다.                                                                       |

`NEXT_PUBLIC_*`는 브라우저에 노출되고 빌드할 때 고정됩니다. 비밀키를 넣지 않습니다. 배포 이미지는 PortOne·Toss 값을 GitHub Repository Variables에서 Docker 빌드 인자로 받습니다. 등록·재빌드 방법은 [컨테이너 배포 문서](./CONTAINER_DEPLOYMENT.md#portone-본인인증-빌드-설정)를 따릅니다. `.env*`는 Docker 빌드 컨텍스트에서 제외됩니다.

## 명령어

| 명령어                 | 설명                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm dev`             | 개발 서버 실행                                              |
| `pnpm build`           | 프로덕션 빌드와 standalone 산출물 생성                      |
| `pnpm start`           | `next start` 실행. 컨테이너는 아래 standalone 방식으로 실행 |
| `pnpm test`            | tsx로 Node.js 테스트 실행                                   |
| `pnpm test:e2e`        | Playwright E2E 실행                                         |
| `pnpm lint`            | ESLint 검사                                                 |
| `pnpm lint:bom`        | 추적 파일의 UTF-8 BOM 검사                                  |
| `pnpm typecheck`       | Next.js 라우트 타입 생성과 TypeScript 검사                  |
| `pnpm format`          | Prettier로 파일 정리                                        |
| `pnpm format:check`    | 포맷 검사                                                   |
| `pnpm storybook`       | Storybook 개발 서버 실행(기본 포트 6006)                    |
| `pnpm build-storybook` | Storybook 정적 빌드                                         |

PR을 올리기 전에는 [기여 가이드의 제출 전 검증](../CONTRIBUTING.md#제출-전-검증)을 실행합니다.

## 테스트

- **단위 테스트**: `pnpm test`가 `*.test.mjs`를 Node.js 테스트 러너로 실행합니다.
- **Storybook**: `pnpm storybook`으로 컴포넌트와 화면 상태를 확인합니다. 접근성 애드온과 play 테스트가 있습니다.
- **E2E**: `pnpm test:e2e`가 MSW를 켠 개발 서버를 직접 띄워 실행합니다. 3000번 포트가 이미 쓰이고 있으면 멈추므로 먼저 개발 서버를 종료합니다. 범위와 실행 옵션은 [E2E 문서](./E2E_TESTING.md)를 따릅니다.

## Docker·CI·배포

Next.js의 `output: "standalone"`을 사용합니다. Docker 이미지는 실행 산출물·정적 파일을 포함하고 비루트 사용자로 `node server.js`를 실행합니다. 기본 컨테이너 포트는 3000입니다.

```bash
docker build --platform linux/amd64 --tag fundit-frontend:local .
docker run --rm --publish 127.0.0.1:3000:3000 fundit-frontend:local
```

| 이벤트       | 실행 흐름                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- |
| PR 생성·갱신 | `validate`의 포맷·BOM·린트·타입·빌드·테스트 → `verify-image`의 Docker 빌드·컨테이너 기동 확인 |
| main push    | `validate` → `publish-image`의 Docker 빌드·기동 확인·OIDC 인증·ECR 업로드                     |

PR의 `publish-image`, main push의 `verify-image`가 생략되는 것은 정상입니다. 이미지 태그는 `sha-<전체 Git 커밋 SHA>`, 플랫폼은 `linux/amd64`, ECR 저장소는 `fundit-frontend`입니다. 업로드된 이미지 주소는 Actions Job Summary에서 확인합니다.

dev 배포는 Fundit-GitOps 저장소의 프론트엔드 이미지 태그를 바꿔 반영합니다. 이미지 구성·인증·인계 절차는 [컨테이너 배포 문서](./CONTAINER_DEPLOYMENT.md)를 확인하세요.
