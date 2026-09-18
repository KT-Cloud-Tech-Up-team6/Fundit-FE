# Docker 이미지와 ECR 인계

인프라 공유 문서 「개발팀 CI 전달사항 (AWS ECR 연동 및 GitOps 인계)」를 기준으로 프론트엔드 이미지를 AWS ECR에 업로드한다. GitOps 저장소의 이미지 태그 변경과 ArgoCD 배포는 별도 CD 단계다.

## 이미지 구성

- Node.js 24 Debian slim과 pnpm 10.33.2를 사용한다. CI의 Node.js도 이미지와 같은 메이저 버전을 사용한다.
- 빌드 단계에서 lockfile을 고정해 의존성을 설치하고 `pnpm build`를 실행한다.
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

현재 앱의 필수 환경변수는 없다. `.env*`는 이미지 빌드 컨텍스트에 포함되지 않는다. 이후 서버 비밀값은 배포 환경에서 주입하며 이미지에 넣지 않는다. `NEXT_PUBLIC_*`는 빌드 시 고정되므로, 도입 시 빌드 인자 및 환경별 이미지 정책을 함께 정해야 한다.

인프라 팀에는 성공한 이미지 URI, Git SHA, 이미지 digest, 플랫폼, 컨테이너 포트, 환경변수 목록과 검증 결과를 전달한다. 별도의 이미지 tar 파일 전달은 필요하지 않다.

배포 전 컨테이너 포트, 운영 헬스체크 경로와 배포 환경변수는 인프라 팀과 합의해야 한다. 현재 기본 포트 3000은 변경 가능한 실행 기본값이며, 운영 헬스체크 엔드포인트나 GitOps·ArgoCD 설정은 이 변경에서 추가하지 않는다.

## 참고 문서

- [Next.js standalone 출력](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
- [GitHub Actions의 AWS OIDC 인증](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
- [Docker 다단계 빌드](https://docs.docker.com/build/building/multi-stage/).
