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

/* API 계약상 자유 객체이며 계약이 아직 보완 대상이다(docs/API_CONTRACT.md 4.5). Member
   AddressPayload와 같은 필드명을 임시로 맞춘다. 채우려면 필수 4개(recipientName·phoneNumber·
   zipcode·addressLine1)를 모두 채워야 한다(all-or-nothing, src/mocks/auth-handlers.ts). */
export type SignupAddress = {
  addressLine1: string;
  addressLine2?: string;
  isDefault?: boolean;
  phoneNumber: string;
  recipientName: string;
  zipcode: string;
};

export type SignupRequest = SignupProfileInput & {
  address?: SignupAddress;
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
