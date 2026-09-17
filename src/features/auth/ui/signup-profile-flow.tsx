"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { checkEmail, signup } from "@/features/auth/api/auth-api";
import type { SignupAddress } from "@/features/auth/api/auth-types";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";
import { DaumPostcodeButton } from "@/shared/components/ui/daum-postcode-button";
import { Select } from "@/shared/components/ui/select";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthScreen, AuthTitle } from "./auth-screen";

export type SignupProfileView = "email" | "password" | "address";

const emailDomains = ["@gmail.com", "@naver.com", "@daum.com"];
const CUSTOM_DOMAIN = "custom";

function passwordCategoryCount(value: string) {
  return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z\d]/].filter((pattern) => pattern.test(value)).length;
}

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .refine((value) => passwordCategoryCount(value) >= 3, {
    message: "대문자, 소문자, 숫자, 특수문자 중 3종 이상을 포함해 주세요.",
  });

const profileSchema = z
  .object({
    customDomain: z.string(),
    domain: z.string().min(1, "이메일 도메인을 선택해 주세요."),
    emailLocal: z.string().min(1, "이메일을 입력해 주세요."),
    nickname: z
      .string()
      .trim()
      .min(1, "닉네임을 입력해 주세요.")
      .max(50, "50자 이하로 입력해 주세요."),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .superRefine((value, context) => {
    if (value.domain === CUSTOM_DOMAIN && !/^@?[^\s@]+\.[^\s@]+$/.test(value.customDomain)) {
      context.addIssue({
        code: "custom",
        message: "이메일 도메인을 확인해 주세요.",
        path: ["customDomain"],
      });
    }
    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: "custom",
        message: "비밀번호가 일치하지 않습니다.",
        path: ["passwordConfirm"],
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

type SignupProfileFlowProps = {
  initialEmailTaken?: boolean;
  initialView?: SignupProfileView;
};

export function SignupProfileFlow({
  initialEmailTaken = false,
  initialView = "email",
}: SignupProfileFlowProps) {
  const router = useRouter();
  const { authenticate } = useAuth();
  const {
    identityDraft,
    profileDraft,
    resetFlow,
    selectedTermCodes,
    setProfileDraft,
    setVerificationToken,
    verificationToken,
  } = useAuthFlow();
  const [view, setView] = useState<SignupProfileView>(initialView);
  const [zipcode, setZipcode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [emailTaken, setEmailTaken] = useState(initialEmailTaken);
  const [submitError, setSubmitError] = useState<string>();
  const initialEmailParts = profileDraft?.email.split("@");
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      customDomain: "",
      domain: initialEmailParts?.[1]
        ? `@${initialEmailParts[1]}`
        : initialEmailTaken
          ? emailDomains[0]
          : "",
      emailLocal: initialEmailParts?.[0] ?? (initialEmailTaken ? "taken" : ""),
      nickname: profileDraft?.nickname ?? "",
      password: profileDraft?.password ?? "",
      passwordConfirm: profileDraft?.password ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(profileSchema),
  });
  const [domain, password, passwordConfirm] = useWatch({
    control: form.control,
    name: ["domain", "password", "passwordConfirm"],
  });
  const usesCustomDomain = domain === CUSTOM_DOMAIN;
  /* onChange을 감싸 쓰는 자리라 register()를 한 번만 호출해 재사용한다
     (매 입력마다 새 registration을 만들지 않는다). */
  const emailLocalField = form.register("emailLocal");
  const passwordLongEnough = password.length >= 8;
  const passwordCategoriesMet = passwordCategoryCount(password) >= 3;
  const passwordMatched = password.length > 0 && password === passwordConfirm;
  const emailMutation = useMutation({ mutationFn: (email: string) => checkEmail(email) });
  const signupMutation = useMutation({
    mutationFn: (request: Parameters<typeof signup>[0]) => signup(request),
  });

  function resolveEmail(values: ProfileFormValues) {
    const selectedDomain = values.domain === CUSTOM_DOMAIN ? values.customDomain : values.domain;
    return `${values.emailLocal}${selectedDomain.startsWith("@") ? selectedDomain : `@${selectedDomain}`}`;
  }

  async function submitEmail() {
    setEmailTaken(false);
    form.clearErrors("emailLocal");
    const valid = await form.trigger(["emailLocal", "domain", "customDomain", "nickname"]);
    if (!valid) return;

    try {
      const result = await emailMutation.mutateAsync(resolveEmail(form.getValues()));
      if (!result.available) {
        setEmailTaken(true);
        return;
      }
      setView("password");
    } catch (error) {
      form.setError("emailLocal", {
        message: isApiError(error) ? error.message : "이메일을 확인하지 못했습니다.",
      });
    }
  }

  async function submitPassword() {
    const valid = await form.trigger(["password", "passwordConfirm"]);
    if (valid) setView("address");
  }

  async function submitSignup(values: ProfileFormValues) {
    setSubmitError(undefined);
    if (!identityDraft || !verificationToken) {
      setVerificationToken(null);
      router.replace("/auth/signup/verify");
      return;
    }
    if (selectedTermCodes.length === 0) {
      router.replace("/auth/signup");
      return;
    }

    const profile = {
      email: resolveEmail(values),
      nickname: values.nickname.trim(),
      password: values.password,
    };
    setProfileDraft(profile);

    /* 배송지는 전부 선택이라 우편번호·기본주소가 없으면 아예 보내지 않는다(스킵과 동일 취급).
       받는사람·연락처는 본인인증 정보로 채운다. 대리 수령인 입력이 필요해지면 별도 필드로 확장한다. */
    const address: SignupAddress | undefined =
      zipcode && baseAddress
        ? {
            addressLine1: baseAddress,
            addressLine2: detailAddress || undefined,
            phoneNumber: identityDraft.phoneNumber,
            recipientName: identityDraft.name,
            zipcode,
          }
        : undefined;

    try {
      const result = await signupMutation.mutateAsync({
        ...profile,
        address,
        agreedTerms: selectedTermCodes,
        name: identityDraft.name,
        phoneNumber: identityDraft.phoneNumber,
        verificationToken,
      });
      const authentication = authenticate(result.accessToken);
      resetFlow();
      await authentication;
      router.push("/auth/signup/complete");
    } catch (error) {
      if (isApiError(error) && error.code === "EMAIL_ALREADY_EXISTS") {
        setEmailTaken(true);
        setView("email");
        return;
      }
      if (isApiError(error) && error.code === "TOKEN_INVALID") {
        setVerificationToken(null);
        router.replace("/auth/signup/verify");
        return;
      }
      setSubmitError(
        isApiError(error) && error.code === "DEPENDENCY_FAILURE"
          ? "가입 처리 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : "회원가입을 완료하지 못했습니다. 입력 내용을 확인해 주세요.",
      );
    }
  }

  if (view === "password") {
    return (
      <AuthScreen onBack={() => setView("email")}>
        <AuthTitle>비밀번호를 설정해주세요</AuthTitle>
        <form
          className="mt-16"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPassword();
          }}
        >
          <AuthInput
            aria-label="비밀번호"
            autoComplete="new-password"
            errorMessage={form.formState.errors.password?.message}
            placeholder="비밀번호를 입력해주세요"
            type="password"
            {...form.register("password")}
          />
          <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
            <RuleItem label="8자 이상" met={passwordLongEnough} />
            <RuleItem label="대문자/소문자/숫자/특수문자 중 3종 이상" met={passwordCategoriesMet} />
          </ul>

          <h2 className="text-title-s text-text-default mt-6">다시 한번 입력해주세요</h2>
          <div className="mt-2">
            <AuthInput
              aria-label="비밀번호 확인"
              autoComplete="new-password"
              errorMessage={form.formState.errors.passwordConfirm?.message}
              placeholder="다시 한번 입력해주세요"
              type="password"
              {...form.register("passwordConfirm")}
            />
          </div>
          <ul className="mt-2">
            <RuleItem label="비밀번호 일치" met={passwordMatched} />
          </ul>

          <AuthButton
            className="mt-6"
            disabled={!passwordLongEnough || !passwordCategoriesMet || !passwordMatched}
            type="submit"
          >
            다음
          </AuthButton>
        </form>
      </AuthScreen>
    );
  }

  if (view === "address") {
    const submit = form.handleSubmit(submitSignup);
    return (
      <AuthScreen onBack={() => setView("password")}>
        <AuthTitle>{"배송지를 입력해두면\n이용이 편리해져요"}</AuthTitle>
        <div className="mt-16 flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <AuthInput aria-label="우편번호" placeholder="우편번호" readOnly value={zipcode} />
            </div>
            <DaumPostcodeButton
              className="bg-layer-surface-primary text-text-inverse text-body-s enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary flex h-13 shrink-0 items-center justify-center rounded-sm px-4 font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              onComplete={(result) => {
                setZipcode(result.zipCode);
                setBaseAddress(result.baseAddress);
                setDetailAddress("");
              }}
            />
          </div>
          <AuthInput
            aria-label="주소"
            placeholder="도로명, 지번, 건물명 검색"
            readOnly
            value={baseAddress}
          />
          <AuthInput
            aria-label="상세주소"
            onChange={(event) => setDetailAddress(event.target.value)}
            onClear={() => setDetailAddress("")}
            placeholder="상세주소를 입력해주세요"
            value={detailAddress}
          />
        </div>
        {submitError ? (
          <p className="text-caption-s text-text-warning mt-3" role="alert">
            {submitError}
          </p>
        ) : null}
        <AuthButton
          className="mt-3"
          disabled={!zipcode || signupMutation.isPending}
          onClick={() => void submit()}
        >
          {signupMutation.isPending ? "가입 처리 중" : "다음"}
        </AuthButton>
        <button
          className="text-caption-s text-text-secondary mx-auto mt-16 block h-10 px-2 underline underline-offset-2 disabled:cursor-not-allowed"
          disabled={signupMutation.isPending}
          onClick={() => void submit()}
          type="button"
        >
          다음에 설정할게요
        </button>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthTitle>{"회원 가입을\n시작해볼까요?"}</AuthTitle>
      <form
        className="mt-16"
        onSubmit={(event) => {
          event.preventDefault();
          void submitEmail();
        }}
      >
        <h2 className="text-title-s text-text-default mb-3">이메일 주소를 입력해주세요</h2>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <AuthInput
              {...emailLocalField}
              aria-label="이메일 아이디"
              autoComplete="username"
              disabled={emailMutation.isPending}
              errorMessage={
                emailTaken ? "이미 가입된 주소입니다." : form.formState.errors.emailLocal?.message
              }
              id="signup-email-local"
              onChange={(event) => {
                setEmailTaken(false);
                void emailLocalField.onChange(event);
              }}
              placeholder="이메일"
            />
          </div>
          <div className="w-[148px] shrink-0">
            {usesCustomDomain ? (
              <AuthInput
                aria-label="이메일 도메인 직접 입력"
                disabled={emailMutation.isPending}
                errorMessage={form.formState.errors.customDomain?.message}
                placeholder="@직접 입력"
                {...form.register("customDomain")}
              />
            ) : (
              <Select
                aria-label="이메일 도메인"
                disabled={emailMutation.isPending}
                shape="compact"
                {...form.register("domain")}
              >
                <option value="">@ 선택</option>
                <option value={CUSTOM_DOMAIN}>직접 입력</option>
                {emailDomains.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>

        <h2 className="text-title-s text-text-default mt-6 mb-3">닉네임을 입력해주세요</h2>
        <AuthInput
          aria-label="닉네임"
          autoComplete="nickname"
          disabled={emailMutation.isPending}
          errorMessage={form.formState.errors.nickname?.message}
          maxLength={50}
          placeholder="닉네임 (최대 50자)"
          {...form.register("nickname")}
        />

        <AuthButton className="mt-6" disabled={emailMutation.isPending} type="submit">
          {emailMutation.isPending ? "중복 확인 중" : "다음"}
        </AuthButton>
      </form>
    </AuthScreen>
  );
}

function RuleItem({ label, met }: { label: string; met: boolean }) {
  return (
    <li
      className={[
        "text-caption-s flex items-center gap-1",
        met ? "text-text-success" : "text-text-secondary",
      ].join(" ")}
    >
      {label}
      <span
        aria-hidden
        className={[
          "border-r-w-s border-b-w-s h-2 w-1.5 rotate-45",
          met ? "border-text-success" : "border-text-disabled",
        ].join(" ")}
      />
      <span className="sr-only">{met ? "충족" : "미충족"}</span>
    </li>
  );
}
