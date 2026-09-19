"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { IdentityDraft, SignupProfileInput } from "../api/auth-types";

type AuthFlowContextValue = {
  identityDraft: IdentityDraft | null;
  profileDraft: SignupProfileInput | null;
  resetFlow: () => void;
  selectedTermCodes: string[];
  setIdentityDraft: (draft: IdentityDraft) => void;
  setProfileDraft: (draft: SignupProfileInput) => void;
  setSelectedTermCodes: (codes: string[]) => void;
  setVerificationToken: (token: string | null) => void;
  verificationToken: string | null;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [selectedTermCodes, setSelectedTermCodes] = useState<string[]>([]);
  const [identityDraft, setIdentityDraftState] = useState<IdentityDraft | null>(null);
  const [verificationToken, setVerificationTokenState] = useState<string | null>(null);
  const [profileDraft, setProfileDraftState] = useState<SignupProfileInput | null>(null);

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      identityDraft,
      profileDraft,
      resetFlow() {
        setSelectedTermCodes([]);
        setIdentityDraftState(null);
        setVerificationTokenState(null);
        setProfileDraftState(null);
      },
      selectedTermCodes,
      setIdentityDraft: setIdentityDraftState,
      setProfileDraft: setProfileDraftState,
      setSelectedTermCodes,
      setVerificationToken: setVerificationTokenState,
      verificationToken,
    }),
    [identityDraft, profileDraft, selectedTermCodes, verificationToken],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) throw new Error("useAuthFlow must be used within AuthFlowProvider");
  return context;
}
