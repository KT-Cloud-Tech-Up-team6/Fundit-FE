# Docker 이미지와 ECR 인계

인프라 공유 문서 「개발팀 CI 전달사항 (AWS ECR 연동 및 GitOps 인계)」를 기준으로 프론트엔드 이미지를 AWS ECR에 업로드한다. GitOps 저장소의 이미지 태그 변경과 ArgoCD 배포는 별도 CD 단계다.

## 이미지 구성

- Node.js 24 Debian slim과 pnpm 10.33.2를 사용한다. CI의 Node.js도 이미지와 같은 메이저 버전을 사용한다.
- 빌드 단계에서 lockfile을 고정해 의존성을 설치하고 `pnpm build`를 실행한다. 같은 origin API 프록시가 필요한 이미지는 `API_PROXY_TARGET` build argument를 함께 전달한다. 이 값은 Next.js rewrite에 빌드 시 포함되므로 컨테이너 실행 시에만 주입해도 프록시가 활성화되지 않는다.
- 실행 단계에는 `.next/standalone`, `.next/static`, `public`만 복사한다.
- `node` 사용자로 `node server.js`를 실행한다.
- 기본 주소는 `0.0.0.0:3000`이다. `PORT` 환경변수로 변경할 수 있으며, 포트를 변경하면 호스트 포트 매핑과 인프라 서비스 설정도 함께 맞춰야 한다.
- `.dockerignore`는 로컬 의존성, 빌드 산출물, Git, 환경변수 파일 및 에이전트 설정을 빌드 컨텍스트에서 제외한다.

## 로컬 검증

Docker가 Linux 컨테이너를 실행할 수 있는 환경에서 저장소 루트를 작업 디렉터리로 사용한다. 아래 명령은 ECR에 업로드하지 않는다.

```powershell
docker build --platform linux/amd64 --tag fundit-frontend:local .
docker run --rm --name fundit-frontend-local --publish 127.0.0.1:3000:3000 fundit-frontend:local
```

Gateway 프록시까지 확인할 때는 Gateway의 공개 가능한 주소를 build argument로 전달한다. 이 주소는 이미지에 포함될 수 있으므로 비밀값을 사용하지 않는다.

```powershell
docker build --platform linux/amd64 --build-arg API_PROXY_TARGET=http://host.docker.internal:8080 --tag fundit-frontend:local .
```

빌드 성공 후 실행하고, 다른 터미널 또는 브라우저에서 `http://localhost:3000/`, `/live`, `/logo.svg`와 화면의 CSS·JavaScript 응답을 확인한다. 실행 터미널에서 Ctrl+C로 종료한다. 포트가 사용 중이면 `127.0.0.1:3100:3000`처럼 호스트 포트만 바꾼다.

Docker가 없는 환경에서 `pnpm build`와 standalone 서버 실행은 일부 검증만 제공한다. Linux 이미지 빌드, 네이티브 의존성, 컨테이너 권한 및 네트워크 검증을 대신하지 않는다.

## GitHub Actions

기존 `validate` 작업은 PR과 `main` push에서 포맷·린트·타입·빌드·테스트를 실행한다. 성공 후 이벤트에 따라 다음 작업을 실행한다.

- PR에서는 `verify-image`가 `linux/amd64` 이미지 빌드와 컨테이너의 `/`, `/logo.svg` 응답을 확인한다. PR과 대상 브랜치를 합친 테스트 커밋으로 검증하며, `contents: read` 권한만 사용한다. AWS 인증과 ECR 업로드는 실행하지 않는다.
- `main` push에서는 기존 `publish-image`가 아래 순서로 실행되고 `verify-image`는 생략된다. PR에서는 `publish-image`가 생략된다.

`verify-image`는 실패를 PR 검사 결과로 보고한다. 브랜치 보호의 필수 검사 등록은 별도 설정이며, 이 워크플로 변경으로 자동 등록되지는 않는다.

1. `linux/amd64` Docker 이미지를 빌드한다.
2. 컨테이너를 실행해 `/`와 `/logo.svg` 응답을 확인하고 종료한다. 이 검사는 운영 헬스체크 정책이 아닌 CI의 기동 확인이다.
3. GitHub Actions OIDC로 AWS Role을 수임한다.
4. ECR에 로그인하고 `sha-<전체 Git 커밋 SHA>` 태그로 업로드한다.
5. 성공한 실행의 Job Summary에 이미지 URI와 플랫폼, 커밋을 기록한다.

| 항목             | 값                                                       |
| ---------------- | -------------------------------------------------------- |
| 리전             | `ap-northeast-2`                                         |
| ECR 저장소       | `fundit-frontend`                                        |
| IAM Role         | `arn:aws:iam::899957568205:role/fundit-frontend-ci-role` |
| 인증 허용 브랜치 | `main`                                                   |
| Job 권한         | `contents: read`, `id-token: write`                      |
| 플랫폼           | `linux/amd64`                                            |
| 이미지 태그      | `sha-${{ github.sha }}`                                  |

최종 이미지 URI는 다음과 같다.

```text
899957568205.dkr.ecr.ap-northeast-2.amazonaws.com/fundit-frontend:sha-<전체 Git 커밋 SHA>
```

장기 AWS Access Key와 Secret Key를 GitHub Secrets에 추가하지 않는다. OIDC 인증에는 인프라 팀이 구성한 신뢰 정책과 ECR push 권한이 필요하다. 인증 또는 push 실패 시 해당 Actions 단계의 오류를 확인하고 인프라 팀과 정책을 점검한다. ECR push 성공 여부는 Actions 결과와 ECR 이미지 digest로 확인하며, 업로드 성공은 서비스 배포 완료를 뜻하지 않는다.

## 환경변수와 인프라 인계

화면 기동 검증은 실제 PortOne 설정 없이 가능하지만, 실제 본인인증과 main 이미지 발행에는 아래 두 공개 설정이 필요하다. `.env*`는 이미지 빌드 컨텍스트에 포함되지 않는다. 서버 비밀값은 배포 환경에서 주입하며 이미지에 넣지 않는다.

인프라 팀에는 성공한 이미지 URI, Git SHA, 이미지 digest, 플랫폼, 컨테이너 포트, 환경변수 목록과 검증 결과를 전달한다. 별도의 이미지 tar 파일 전달은 필요하지 않다.

배포 전 컨테이너 포트, 운영 헬스체크 경로와 배포 환경변수는 인프라 팀과 합의해야 한다. 현재 기본 포트 3000은 변경 가능한 실행 기본값이며, 운영 헬스체크 엔드포인트나 GitOps·ArgoCD 설정은 이 변경에서 추가하지 않는다.

## 참고 문서

- [Next.js standalone 출력](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
- [GitHub Actions의 AWS OIDC 인증](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
- [Docker 다단계 빌드](https://docs.docker.com/build/building/multi-stage/).

## PortOne 본인인증 빌드 설정

GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables → New repository variable**에서 다음 이름으로 등록한다. Repository Variables를 사용하며, 같은 이름의 Secrets나 서버 실행 환경에만 등록한 값은 이 워크플로에서 읽지 않는다.

- `NEXT_PUBLIC_PORTONE_STORE_ID`: 본인인증에 사용할 상점 ID.
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`: 해당 상점의 본인인증 채널 키.

두 값은 브라우저에 공개되는 식별자다. PortOne 서버 API Secret을 넣지 않는다. 코드·PR 본문에 실제 값을 기록하지 않는다.

main의 `publish-image`는 두 값이 비어 있으면 빌드와 ECR 업로드 전에 실패한다. 설정값은 Actions env → `docker build --build-arg` → Dockerfile builder ARG → `pnpm build` 순서로 전달된다. PR의 `verify-image`는 고정된 테스트용 값만 사용하므로 빌드 통과는 실제 PortOne 인증 성공을 뜻하지 않는다.

로컬 개발은 `.env.local`에 두 값을 설정하고 개발 서버를 재시작한다. 로컬 Docker 빌드는 두 값을 현재 셸 환경변수에 설정한 후 다음과 같이 이름만 전달한다. `.env.local`을 Docker에 복사하지 않는다.

```powershell
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_PORTONE_STORE_ID --build-arg NEXT_PUBLIC_PORTONE_CHANNEL_KEY --tag fundit-frontend:local .
```

값을 바꾸면 새 이미지 빌드와 배포가 필요하다. Repository Variables 변경만으로 Actions가 자동 실행되지는 않는다. 기존 main push 실행의 `publish-image` 재실행 또는 새 main 커밋으로 이미지를 다시 빌드하고, 이미지 digest를 확인해 인프라 배포를 진행한다. 같은 커밋 재실행은 동일한 sha 태그를 사용하므로 인프라 담당자가 새 digest 반영을 확인한다. 컨테이너 런타임 env 변경이나 재시작만으로 이미 만들어진 브라우저 번들은 바뀌지 않는다.

배포 후 실제 회원가입에서 PortOne 인증창/모바일 리다이렉트와 BE 인증 결과 검증까지 확인해야 한다. 이 작업은 #236의 회원가입 화면 변경과 독립적이며, 상점·채널·도메인 설정 및 BE 환경의 실제 유효성은 별도로 확인한다.
