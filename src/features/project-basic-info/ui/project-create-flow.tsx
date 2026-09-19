"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ProjectBasicInfoForm } from "./project-basic-info-form";
import { ProjectConsentModal } from "./project-consent-modal";

export function ProjectCreateFlow() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={formRef} tabIndex={-1}>
        <ProjectBasicInfoForm />
      </div>
      {!agreed && (
        <ProjectConsentModal
          onAgree={() => {
            setAgreed(true);
            requestAnimationFrame(() => formRef.current?.focus());
          }}
          onClose={() => router.replace("/seller/projects")}
        />
      )}
    </>
  );
}
