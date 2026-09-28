import { SignupVerifyFlow } from "@/features/auth/ui/signup-verify-flow";

/* 가입 정보 입력 중 본인인증 결과가 만료되면(`TOKEN_INVALID`) `?expired=1`로 돌아온다. */
export default async function SignupVerifyPage({ searchParams }: PageProps<"/auth/signup/verify">) {
  const { expired } = await searchParams;
  return <SignupVerifyFlow initialView={expired === "1" ? "verification-failed" : undefined} />;
}
