"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Icon } from "@/shared/components/ui/icon";
import { Modal } from "@/shared/components/ui/modal";
import { projectConsentTerms, type ProjectConsentId } from "../model/project-consent-terms";
import styles from "./project-consent-modal.module.css";

const labels: Record<ProjectConsentId, string> = {
  service: "서비스 이용약관 동의 (필수)",
  privacy: "개인정보 수집·이용 동의 (필수)",
  age: "만 14세 이상입니다 (필수)",
  marketing: "마케팅 정보 수신 동의 (선택)",
  ai: "AI 개인화 서비스 활용에 동의합니다.",
};

function TermsContent({ content }: { content: string }) {
  return content.split("\n\n").map((paragraph, index) => (
    <div key={index} className="whitespace-pre-wrap">
      {paragraph.split("\n").map((line, lineIndex) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={lineIndex} className="font-semibold">
              {line.slice(3)}
            </h3>
          );
        }
        return (
          <p key={lineIndex}>
            {line
              .split(/(\*\*.*?\*\*)/g)
              .map((part, partIndex) =>
                part.startsWith("**") ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part,
              )}
          </p>
        );
      })}
    </div>
  ));
}

export function ProjectConsentModal({
  onAgree,
  onClose,
}: {
  onAgree: () => void;
  onClose: () => void;
}) {
  const prefix = useId();
  const [selected, setSelected] = useState<ProjectConsentId[]>([]);
  const [expanded, setExpanded] = useState<ProjectConsentId[]>([]);
  const allSelected = projectConsentTerms.every((term) => selected.includes(term.id));
  const requiredSelected = projectConsentTerms.every(
    (term) => !term.required || selected.includes(term.id),
  );

  function renderTerm(term: (typeof projectConsentTerms)[number]) {
    const isExpanded = expanded.includes(term.id);
    const panelId = `${prefix}-${term.id}`;
    return (
      <div key={term.id} className={term.id === "ai" ? "" : "px-3"}>
        <div className="flex min-h-9 items-center gap-2">
          <Checkbox
            checked={selected.includes(term.id)}
            className="min-w-0 flex-1 gap-3 px-1 py-1 [&>span:last-child]:font-medium"
            onChange={(event) =>
              setSelected((current) =>
                event.target.checked
                  ? [...current, term.id]
                  : current.filter((id) => id !== term.id),
              )
            }
          >
            {labels[term.id]}
          </Checkbox>
          <button
            type="button"
            aria-label={`${term.label} 전문 ${isExpanded ? "접기" : "펼치기"}`}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            className="focus-visible:outline-border-primary flex size-9 shrink-0 items-center justify-end rounded-xs focus-visible:outline-2"
            onClick={() =>
              setExpanded((current) =>
                isExpanded ? current.filter((id) => id !== term.id) : [...current, term.id],
              )
            }
          >
            <Icon name="arrowDown" className={`size-4 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div
          id={panelId}
          role="region"
          aria-label={`${term.label} 전문`}
          hidden={!isExpanded}
          tabIndex={0}
          className="border-border-default bg-layer-bg text-text-default mx-1 mt-2 max-h-[206px] space-y-3 overflow-y-auto overscroll-contain rounded-xs border p-3 text-[13px] leading-[1.4] focus-visible:outline-2"
        >
          <TermsContent content={term.content} />
        </div>
      </div>
    );
  }

  return (
    <Modal open title="개인 정보 동의" onClose={onClose} className={styles.modal}>
      <div className="mt-6 min-h-0 overflow-y-auto overscroll-contain">
        <Checkbox
          checked={allSelected}
          className="min-h-8 w-full gap-3 px-1 [&>span:last-child]:font-medium"
          onChange={(event) =>
            setSelected(event.target.checked ? projectConsentTerms.map((term) => term.id) : [])
          }
        >
          약관 전체 동의
        </Checkbox>
        <div className="mt-2 space-y-1">
          {projectConsentTerms.filter((term) => term.id !== "ai").map(renderTerm)}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-body-s text-text-secondary px-1 leading-[1.42]">
            회원님의 관심 카테고리, 시청·펀딩 이력을 분석해 맞춤 라이브 방송과 펀딩 프로젝트를
            추천해드려요. 동의하지 않아도 서비스 이용에는 제한이 없으며, 마이페이지에서 언제든
            변경할 수 있습니다.
          </p>
          {renderTerm(projectConsentTerms[4])}
        </div>
      </div>
      <Button
        type="button"
        size="xl"
        appearance="cta"
        className="mt-6 w-full shrink-0"
        disabled={!requiredSelected}
        onClick={() => {
          if (requiredSelected) onAgree();
        }}
      >
        동의하기
      </Button>
    </Modal>
  );
}
