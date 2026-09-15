export type RequestOptions = { signal?: AbortSignal };

export type SignupTerm = {
  code: string;
  content: string;
  required: boolean;
  title: string;
  version: string;
};

export type IdentityDraft = {
  birthDate: string;
  name: string;
  phoneNumber: string;
};

export type SignupProfileInput = {
  email: string;
  nickname: string;
  password: string;
};

export type SignupRequest = SignupProfileInput & {
  agreedTerms: string[];
  name: string;
  phoneNumber: string;
  verificationToken: string;
};

export type AuthResult = {
  accessToken: string;
  accountId: string;
  memberId: string;
};

export type AuthUser = {
  isBuyer: boolean;
  isSeller: boolean;
  memberId: string;
  name: string;
  nickname: string;
  phoneNumber: string;
};

export type SocialProvider = "KAKAO" | "GOOGLE";
export type SocialLoginResult =
  | { accessToken: string; status: "authenticated" }
  | { signupToken: string; status: "needsSignup" }
  | { linkToken: string; status: "needsLink" };

export type SocialSignupRequest = {
  agreedTerms: string[];
  nickname: string;
  signupToken: string;
  verificationToken: string;
};
