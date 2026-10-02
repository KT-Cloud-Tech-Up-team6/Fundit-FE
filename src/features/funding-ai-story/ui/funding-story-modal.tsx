"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { ChatDialogue } from "@/shared/components/ui/chat-dialogue";
import { Chip } from "@/shared/components/ui/chip";
import { InputChat } from "@/shared/components/ui/input-chat";
import { TextButton } from "@/shared/components/ui/text-button";
import { Modal } from "@/shared/components/ui/modal";
import { createStoryState, storyBody, storyQuestions, storyReducer } from "../model/story-demo";
import type { StoryDemoState } from "../model/story-demo";
import styles from "./funding-story-modal.module.css";
import { StoryTextBlock } from "@/features/project-story/ui/story-html";
import { StoryPreview } from "./story-preview";
import {
  confirmFundingStorySession,
  createFundingStoryRun,
  createFundingStorySession,
  discardFundingStoryRun,
  getFundingStoryRun,
  getFundingStorySession,
  getLatestFundingStorySession,
  isFundingStorySessionSynchronized,
  sendFundingStoryMessage,
  startFundingStorySession,
  streamFundingStoryChat,
  waitForFundingStoryRun,
  type FundingStoryMessage,
  type FundingStoryMessageRequest,
  type FundingStoryRun,
  type FundingStorySession,
  type IntroBlock,
} from "@/entities/project/api/story-api";
import { uploadProjectMedia, validateProjectMedia } from "@/entities/project/api/media-api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { applyStory } from "../model/apply-story";
import { chatMessageRequest } from "../model/chat-message";
import { partialSuccessMessage } from "../model/run-feedback";
import { resolveFundingStoryRunId } from "../model/run-resume";
import { ChatAttachmentTray, ChatImages, type ChatAttachmentDraft } from "./chat-attachments";

type FundingStoryModalProps = {
  projectTitle: string;
  onClose: () => void;
  onImport: (body: string, introContent?: IntroBlock[], coverImageUrl?: string | null) => void;
  initialState?: StoryDemoState;
  pauseDemo?: boolean;
  projectId?: string;
};

type PendingSessionSync = {
  sessionId: string;
  minimumRevision: number;
};

/** 화면에 그리는 메시지. 사용자 메시지의 첨부는 세션의 `file_url`이나 전송 중 미리보기 주소다. */
type DisplayMessage = Pick<FundingStoryMessage, "role" | "text"> & { images?: string[] };

/* 204가 폐기 성공을 확정한 뒤의 조회는 안내 문구를 고르기 위한 것뿐이다. 응답이 오지 않는
   조회가 닫기를 막지 않도록 상한을 둔다. api client에는 요청 제한 시간이 없다. */
const DISCARD_LOOKUP_TIMEOUT_MS = 5_000;

const nextRemoteStage = (session: FundingStorySession) =>
  session.missing.length === 0 && session.summary ? "summary" : "collecting";

const summaryText = (session: FundingStorySession) => {
  if (!session.summary) return "";
  return [
    `제품\n${session.summary.product}`,
    `스토리\n${session.summary.story}`,
    `핵심 강점\n${session.summary.strengths
      .map((strength) => `${strength.title}: ${strength.description}`)
      .join("\n")}`,
  ].join("\n\n");
};

export function FundingStoryModal({
  projectTitle,
  onClose,
  onImport,
  initialState,
  pauseDemo = false,
  projectId,
}: FundingStoryModalProps) {
  const cache = useQueryClient();
  const { state: auth } = useAuth();
  const [state, dispatch] = useReducer(storyReducer, initialState ?? createStoryState());
  const [input, setInput] = useState("");
  const [session, setSession] = useState<FundingStorySession | null>(null);
  const [run, setRun] = useState<FundingStoryRun | null>(null);
  const [remoteStage, setRemoteStage] = useState<
    "connecting" | "collecting" | "summary" | "generating" | "result"
  >("connecting");
  const [streamingText, setStreamingText] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<DisplayMessage | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachmentDraft[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [apiError, setApiError] = useState("");
  const [apiBusy, setApiBusy] = useState(false);
  const [pendingSessionSync, setPendingSessionSync] = useState<PendingSessionSync | null>(null);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState("");
  const apiBusyRef = useRef(false);
  const lifecycleRef = useRef<AbortController | null>(null);
  const pendingRunIdRef = useRef<string | null>(null);
  // run ID 응답 전에 닫기를 확정해도 같은 키로 BE에 폐기를 선기록할 수 있어야 한다.
  const runIdempotencyKeyRef = useRef<string | null>(null);
  const runCreateRequestedRef = useRef(false);
  const discardConfirmOpenRef = useRef(false);
  const discardRequestedRef = useRef(false);
  const completedWhileDiscardingRef = useRef<FundingStoryRun | null>(null);
  // 업로드 결과는 비동기로 와서 그 사이 지운 첨부인지 지금 목록으로 판단해야 한다.
  const attachmentsRef = useRef<ChatAttachmentDraft[]>([]);
  const previewUrlsRef = useRef(new Set<string>());
  // 실패한 전송을 같은 내용으로 다시 보내면 같은 message_id를 써야 AI가 중복으로 받지 않는다.
  const failedMessageRef = useRef<FundingStoryMessageRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateAttachments(update: (items: ChatAttachmentDraft[]) => ChatAttachmentDraft[]) {
    attachmentsRef.current = update(attachmentsRef.current);
    setAttachments(attachmentsRef.current);
  }

  function revokePreview(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(previewUrl);
  }

  function removeAttachment(id: string) {
    const removed = attachmentsRef.current.find((item) => item.id === id);
    if (!removed) return false;
    revokePreview(removed.previewUrl);
    updateAttachments((items) => items.filter((item) => item.id !== id));
    return true;
  }

  function addAttachments(files: File[]) {
    if (!projectId) return;
    const errors: string[] = [];
    for (const file of files) {
      try {
        validateProjectMedia(file, "image");
      } catch (error) {
        errors.push(
          `${file.name}: ${error instanceof Error ? error.message : "올릴 수 없는 파일입니다."}`,
        );
        continue;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      updateAttachments((items) => [...items, { id, name: file.name, previewUrl, fileUrl: null }]);
      uploadProjectMedia(projectId, file, "image").then(
        (fileUrl) =>
          updateAttachments((items) =>
            items.map((item) => (item.id === id ? { ...item, fileUrl } : item)),
          ),
        (error: unknown) => {
          // 업로드 중에 이미 지운 파일이면 실패를 알릴 필요가 없다.
          if (!removeAttachment(id)) return;
          const reason = error instanceof Error ? error.message : "파일을 업로드하지 못했습니다.";
          setAttachmentError((current) =>
            [current, `${file.name}: ${reason}`].filter(Boolean).join("\n"),
          );
        },
      );
    }
    setAttachmentError(errors.join("\n"));
  }

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      for (const previewUrl of previewUrls) URL.revokeObjectURL(previewUrl);
      previewUrls.clear();
    };
  }, []);

  function closeModal() {
    lifecycleRef.current?.abort();
    onClose();
  }

  function setDiscardConfirmationOpen(open: boolean) {
    discardConfirmOpenRef.current = open;
    setDiscardConfirmOpen(open);
  }

  function handleClose() {
    // 이벤트 시점에는 ref로 run ID 응답 전의 생성 요청까지 함께 판단한다.
    const generatingRun =
      !!projectId &&
      (remoteStage === "generating" ||
        pendingRunIdRef.current !== null ||
        runIdempotencyKeyRef.current !== null);
    if (generatingRun) {
      setDiscardError("");
      setDiscardConfirmationOpen(true);
      return;
    }
    closeModal();
  }

  function clearRunTracking() {
    pendingRunIdRef.current = null;
    runIdempotencyKeyRef.current = null;
    runCreateRequestedRef.current = false;
    setPendingRunId(null);
  }

  function showTerminalRun(completed: FundingStoryRun, notice?: string) {
    if (discardRequestedRef.current) {
      // 폐기 응답이 오기 전에는 결과 화면을 열지 않는다. 결과 반영 동작도 함께 막는다.
      completedWhileDiscardingRef.current = completed;
      return;
    }
    const wasConfirmingDiscard = discardConfirmOpenRef.current;
    clearRunTracking();
    // 확인창을 보는 사이 생성이 끝나면 폐기 버튼 대신 실제 종료 결과를 보여준다.
    setDiscardConfirmationOpen(false);
    setDiscarding(false);
    const completedNotice =
      notice ??
      (wasConfirmingDiscard
        ? "생성이 이미 완료되어 결과를 폐기할 수 없습니다. 스토리를 수정해주세요."
        : undefined);
    if (completed.status === "discarded") {
      setApiError(completedNotice ?? "생성 결과가 폐기되었습니다.");
      setRemoteStage("summary");
      return;
    }
    if (completed.status === "failed" || !completed.result) {
      setApiError(completedNotice ?? completed.error?.message ?? "상세페이지 생성에 실패했습니다.");
      setRemoteStage("summary");
      return;
    }
    setRun(completed);
    setRemoteStage("result");
    setApiError(
      completedNotice ??
        (completed.status === "partially_succeeded"
          ? partialSuccessMessage(completed.failed_slots)
          : ""),
    );
  }

  /* 폐기 응답을 기다리는 사이 폴링이 종결 상태를 관측한 경우를 처리한다. 폐기로 끝났으면
     목적을 달성했으니 닫고, 완료로 끝났으면 되돌릴 수 없으므로 결과 화면으로 안내한다. */
  function settleRunObservedWhileDiscarding(observed: FundingStoryRun) {
    discardRequestedRef.current = false;
    completedWhileDiscardingRef.current = null;
    if (observed.status === "discarded") {
      closeModal();
      return;
    }
    showTerminalRun(
      observed,
      "생성이 이미 완료되어 결과를 폐기할 수 없습니다. 스토리를 수정해주세요.",
    );
  }

  async function discardRunAndClose() {
    if (!projectId || discarding) return;
    const runId = pendingRunIdRef.current;
    const idempotencyKey = runIdempotencyKeyRef.current;
    if (!runId && !idempotencyKey) {
      setDiscardError("생성 작업을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setDiscarding(true);
    setDiscardError("");
    discardRequestedRef.current = true;
    try {
      await discardFundingStoryRun(
        projectId,
        runId ? { runId } : { idempotencyKey: idempotencyKey! },
      );
      /* 폐기를 기다리는 사이 폴링이 종결 상태를 관측했다면 그 결과가 조회보다 정확하다. run ID를
         늦게 받은 경우에도 여기서 완료를 잡아내므로 왕복을 한 번 줄인다. */
      const observed = completedWhileDiscardingRef.current;
      if (observed) {
        settleRunObservedWhileDiscarding(observed);
        return;
      }
      if (runId) {
        // 204은 폐기 성공의 권위다. 조회는 이미 완료돼 되돌릴 수 없는 경우만 감지한다.
        const signal = lifecycleRef.current?.signal;
        const latest = await getFundingStoryRun(
          projectId,
          runId,
          AbortSignal.timeout(DISCARD_LOOKUP_TIMEOUT_MS),
        ).catch(() => null);
        if (signal?.aborted) return;
        if (latest && ["succeeded", "partially_succeeded", "failed"].includes(latest.status)) {
          settleRunObservedWhileDiscarding(latest);
          return;
        }
      }
      // 폐기 성공 전에는 폴링을 끊지 않는다. 요청 실패 시 사용자가 재시도할 수 있어야 한다.
      closeModal();
    } catch (error) {
      discardRequestedRef.current = false;
      // 폐기 요청이 실패해도 그 사이 run이 끝났다면 오류 대신 종결 결과를 보여줘야 한다.
      const observed = completedWhileDiscardingRef.current;
      if (observed) {
        settleRunObservedWhileDiscarding(observed);
        return;
      }
      setDiscardError(
        error instanceof Error
          ? `${error.message} 다시 시도해주세요.`
          : "생성 결과를 폐기하지 못했습니다. 다시 시도해주세요.",
      );
      setDiscarding(false);
    }
  }

  async function discardUnknownRunAndRegenerate() {
    if (!projectId || apiBusyRef.current || !runIdempotencyKeyRef.current) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    // 폐기는 생명주기 signal을 받지 않으므로, 재생성 여부는 시작 시점의 controller로 판단한다.
    const controller = lifecycleRef.current;
    try {
      // POST 응답이 유실된 요청은 같은 key로 다시 생성하면 409가 난다. 먼저 결과를 폐기한다.
      await discardFundingStoryRun(projectId, { idempotencyKey: runIdempotencyKeyRef.current });
      clearRunTracking();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? `${error.message} 다시 시도해주세요.`
          : "이전 생성 요청을 폐기하지 못했습니다. 다시 시도해주세요.",
      );
      return;
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
    /* 폐기를 기다리는 사이 모달이 사라졌거나 프로젝트가 바뀌면, generate()가 아무도 끊을 수 없는
       새 controller로 run을 만든다. 그 run의 key는 사라진 ref에만 남아 폐기할 수단이 없다. */
    if (!controller || lifecycleRef.current !== controller || controller.signal.aborted) return;
    void generate();
  }
  const remoteBlocks = run?.result?.intro_content;
  const generatedBody = projectId
    ? (remoteBlocks
        ?.filter((block) => block.type === "TEXT")
        .map((block) => block.value)
        .join("\n\n") ?? "")
    : storyBody(state);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    lifecycleRef.current = controller;
    const refreshAfterChat = async (current: FundingStorySession, chatId: string) => {
      setApiBusy(true);
      setStreamingText("");
      const done = await streamFundingStoryChat(
        projectId,
        chatId,
        setStreamingText,
        controller.signal,
      );
      const pending = {
        sessionId: current.session_id,
        minimumRevision: done.revision,
      };
      setPendingSessionSync(pending);
      const refreshed = await getFundingStorySession(
        projectId,
        current.session_id,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pending.minimumRevision)) {
        throw new Error("완료된 AI 응답을 세션과 동기화하지 못했습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setStreamingText("");
      setOptimisticMessage(null);
      setRemoteStage(nextRemoteStage(refreshed));
    };
    const bootstrap = async () => {
      setApiError("");
      setApiBusy(true);
      try {
        const latest = await getLatestFundingStorySession(projectId, controller.signal);
        const current =
          latest.session ?? (await createFundingStorySession(projectId, controller.signal));
        setSession(current);
        if (current.active_chat_id) {
          setRemoteStage("collecting");
          await refreshAfterChat(current, current.active_chat_id);
        } else if (current.messages.length === 0) {
          setRemoteStage("collecting");
          const accepted = await startFundingStorySession(
            projectId,
            current.session_id,
            controller.signal,
          );
          await refreshAfterChat(current, accepted.chat_id);
        } else {
          setRemoteStage(nextRemoteStage(current));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setApiError(error instanceof Error ? error.message : "AI 세션을 불러오지 못했습니다.");
        }
      } finally {
        setApiBusy(false);
      }
    };
    // 개발 Strict Mode의 effect 재실행 전에 첫 호출이 서버 세션을 중복 생성하지 않게 다음 tick에 시작한다.
    const bootstrapTimer = window.setTimeout(() => void bootstrap(), 0);
    return () => {
      window.clearTimeout(bootstrapTimer);
      controller.abort();
      if (lifecycleRef.current === controller) lifecycleRef.current = null;
    };
  }, [projectId]);

  async function generate() {
    if (apiBusyRef.current || pendingSessionSync || discardRequestedRef.current) return;
    if (!projectId) {
      dispatch({ type: "generate" });
      return;
    }
    if (!session || !session.summary || session.missing.length) return;
    if (!pendingRunIdRef.current && runCreateRequestedRef.current && runIdempotencyKeyRef.current) {
      void discardUnknownRunAndRegenerate();
      return;
    }
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    const idempotencyKey = runIdempotencyKeyRef.current ?? crypto.randomUUID();
    runIdempotencyKeyRef.current = idempotencyKey;
    let runId = pendingRunIdRef.current;
    const controller = lifecycleRef.current ?? new AbortController();
    try {
      // run ID를 받기 전 X를 눌러도 idempotency key로 폐기할 수 있게 먼저 생성 중 화면으로 전환한다.
      setRemoteStage("generating");
      runId = await resolveFundingStoryRunId(pendingRunIdRef.current, async () => {
        const confirmed = await confirmFundingStorySession(
          projectId,
          session.session_id,
          session.revision,
          controller.signal,
        );
        // fetch 실패가 서버 처리 전인지 후인지 알 수 없으므로, 이 시점부터 키를 보존해 폐기할 수 있게 한다.
        runCreateRequestedRef.current = true;
        return createFundingStoryRun(
          projectId,
          session.session_id,
          confirmed.confirmed_revision,
          idempotencyKey,
          controller.signal,
        );
      });
      controller.signal.throwIfAborted();
      pendingRunIdRef.current = runId;
      setPendingRunId(runId);
      const completed = await waitForFundingStoryRun(projectId, runId, controller.signal);
      controller.signal.throwIfAborted();
      showTerminalRun(completed);
    } catch (error) {
      if (
        !controller.signal.aborted &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        const message = error instanceof Error ? error.message : "생성 요청에 실패했습니다.";
        setApiError(
          runId ? `${message} 다시 시도하면 같은 생성 작업의 상태를 이어서 확인합니다.` : message,
        );
        setRemoteStage("summary");
        if (!runId && !runCreateRequestedRef.current) runIdempotencyKeyRef.current = null;
      }
    } finally {
      apiBusyRef.current = false;
      if (!controller.signal.aborted) setApiBusy(false);
    }
  }
  async function importResult() {
    if (apiBusyRef.current || discardRequestedRef.current) return;
    if (!projectId) {
      onImport(generatedBody);
      return;
    }
    if (!run?.result) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      if (!auth.user?.memberId) throw new Error("로그인이 필요합니다.");
      await applyStory(cache, auth.user.memberId, projectId, run);
      onImport(generatedBody, run.result.intro_content, run.result.cover_image_url);
    } catch {
      setApiError("스토리에 반영하지 못했습니다. 다시 시도해주세요.");
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followBottom = useRef(true);
  const displayStage = projectId ? remoteStage : state.stage;
  const stageRef = useRef(displayStage);
  const busy = projectId
    ? apiBusy ||
      pendingSessionSync !== null ||
      pendingRunId !== null ||
      ["connecting", "generating"].includes(remoteStage)
    : apiBusy || ["summarizing", "generating", "ready"].includes(state.stage);
  const result = displayStage === "result";
  const loading = displayStage === "generating" || displayStage === "ready";

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, []);

  useEffect(() => {
    if (pauseDemo || projectId) return;
    const action =
      state.stage === "summarizing"
        ? "summary-ready"
        : state.stage === "generating"
          ? "ready"
          : state.stage === "ready"
            ? "result"
            : null;
    if (!action) return;
    const timer = window.setTimeout(
      () => dispatch({ type: action }),
      state.stage === "generating" ? 1800 : 800,
    );
    return () => window.clearTimeout(timer);
  }, [state.stage, pauseDemo, projectId]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    function resizeInput() {
      if (!textarea) return;
      textarea.style.height = "28px";
      textarea.style.height = `${Math.max(28, Math.min(textarea.scrollHeight, 160))}px`;
    }
    resizeInput();
    window.addEventListener("resize", resizeInput);
    const history = historyRef.current;
    if (history && followBottom.current) history.scrollTop = history.scrollHeight;
    if (stageRef.current !== displayStage && !busy && !result) textarea?.focus();
    stageRef.current = displayStage;
    return () => window.removeEventListener("resize", resizeInput);
  }, [input, state.messages, displayStage, busy, result]);

  const uploadingAttachment = attachments.some((item) => item.fileUrl === null);
  // 업로드가 끝난 첨부만 보내므로 올리는 중에는 전송을 막는다.
  const canSendComposer =
    !uploadingAttachment && (input.trim().length > 0 || (!!projectId && attachments.length > 0));

  /** 입력창의 글과 첨부를 보낸다. 「해당 사항 없음」 같은 고정 답변은 입력창을 건드리지 않는다. */
  function send(text: string, fromComposer = false) {
    if (busy) return;
    if (projectId) {
      if (fromComposer ? !canSendComposer : !text.trim()) return;
      void sendRemote(text.trim(), fromComposer);
      return;
    }
    if (!text.trim()) return;
    followBottom.current = true;
    dispatch({ type: "send", text });
    setInput("");
    textareaRef.current?.focus();
  }

  async function sendRemote(text: string, fromComposer: boolean) {
    if (!projectId || !session || apiBusyRef.current) return;
    const sent = fromComposer ? attachmentsRef.current : [];
    const request = chatMessageRequest(failedMessageRef.current, {
      revision: session.revision,
      text,
      attachmentUrls: sent.flatMap((item) => (item.fileUrl ? [item.fileUrl] : [])),
    });
    failedMessageRef.current = null;
    // AI 답변까지 끝나면 메시지가 세션에 들어간 것이라, 그 뒤 실패는 입력창으로 되돌리지 않는다.
    let answered = false;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    setOptimisticMessage({ role: "user", text, images: sent.map((item) => item.previewUrl) });
    setRemoteStage("collecting");
    if (fromComposer) {
      setInput("");
      updateAttachments(() => []);
      setAttachmentError("");
    }
    setStreamingText("");
    try {
      const controller = lifecycleRef.current ?? new AbortController();
      const accepted = await sendFundingStoryMessage(
        projectId,
        session.session_id,
        request,
        controller.signal,
      );
      const done = await streamFundingStoryChat(
        projectId,
        accepted.chat_id,
        setStreamingText,
        controller.signal,
      );
      answered = true;
      const pending = {
        sessionId: session.session_id,
        minimumRevision: done.revision,
      };
      setPendingSessionSync(pending);
      const refreshed = await getFundingStorySession(
        projectId,
        session.session_id,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pending.minimumRevision)) {
        throw new Error("완료된 AI 응답을 세션과 동기화하지 못했습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setRemoteStage(nextRemoteStage(refreshed));
      setOptimisticMessage(null);
      setStreamingText("");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setApiError(error instanceof Error ? error.message : "메시지를 보내지 못했습니다.");
      }
      setOptimisticMessage(null);
      setStreamingText("");
      setRemoteStage(nextRemoteStage(session));
      if (!answered) {
        // 보낸 내용을 입력창에 되돌려 그대로 다시 보내면 같은 message_id로 재요청한다.
        failedMessageRef.current = request;
        if (fromComposer) {
          setInput(text);
          updateAttachments(() => sent);
        }
      }
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
      // 세션에 들어간 첨부는 이제 file_url로 그린다.
      if (answered) for (const item of sent) revokePreview(item.previewUrl);
    }
  }

  async function synchronizeSession() {
    if (!projectId || !pendingSessionSync || apiBusyRef.current) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      const controller = lifecycleRef.current ?? new AbortController();
      const refreshed = await getFundingStorySession(
        projectId,
        pendingSessionSync.sessionId,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pendingSessionSync.minimumRevision)) {
        throw new Error("완료된 AI 응답이 아직 세션에 반영되지 않았습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setOptimisticMessage(null);
      setStreamingText("");
      setRemoteStage(nextRemoteStage(refreshed));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "AI 세션을 다시 동기화하지 못했습니다.");
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }

  // 모달을 열고 프로젝트 내용을 가져오는 첫 응답 전까지 빈 대화창 대신 대기 말풍선을 보인다.
  const initialLoading =
    !!projectId &&
    apiBusy &&
    ["connecting", "collecting"].includes(remoteStage) &&
    !session?.messages.length &&
    !optimisticMessage &&
    !streamingText;
  const displayedMessages: (DisplayMessage & {
    question?: number;
    isSummary?: boolean;
    isPending?: boolean;
  })[] = projectId
    ? [
        ...(initialLoading
          ? [{ role: "assistant" as const, text: "스토리를 불러오는 중이에요...", isPending: true }]
          : []),
        ...(session?.messages ?? []).map(({ role, text, attachments: sentAttachments }) => ({
          role,
          text,
          images: sentAttachments?.map((attachment) => attachment.file_url),
        })),
        ...(optimisticMessage ? [optimisticMessage] : []),
        ...(streamingText ? [{ role: "assistant" as const, text: streamingText }] : []),
        ...(remoteStage === "summary" && session?.summary
          ? [
              {
                role: "assistant" as const,
                text: `요약본이 준비됐어요!\n\n${summaryText(session)}\n\n확인해보시고, 그대로 진행하시거나 수정해주세요.`,
                isSummary: true,
              },
            ]
          : []),
      ]
    : state.messages;

  return (
    <Modal
      open
      closeDisabled={discardConfirmOpen && discarding}
      title={discardConfirmOpen ? "AI 스토리 생성을 그만둘까요?" : "AI 스토리 작성"}
      onClose={
        discardConfirmOpen
          ? discarding
            ? () => {}
            : () => setDiscardConfirmationOpen(false)
          : handleClose
      }
      className={
        discardConfirmOpen
          ? undefined
          : `h-168 sm:mt-[clamp(20px,calc((100dvh-672px)/2),114px)] [&>div]:gap-6 ${loading ? styles.loading : ""}`
      }
      size={discardConfirmOpen ? "m" : result ? "l" : "m"}
    >
      {discardConfirmOpen ? (
        <div className="flex h-full flex-col justify-center" aria-busy={discarding}>
          {discarding && (
            <p role="status" aria-live="polite" className="sr-only">
              생성 결과를 폐기 중입니다.
            </p>
          )}
          <p className="text-body-m text-center break-keep">
            생성 작업은 서버에서 계속될 수 있지만,
            <br />
            생성 결과는 스토리에 반영되지 않습니다.
          </p>
          {discardError && (
            <p role="alert" className="text-body-s text-text-error mt-4 text-center break-keep">
              {discardError}
            </p>
          )}
          <div className="mt-10 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              appearance="cta"
              size="md"
              className="flex-1"
              disabled={discarding}
              onClick={() => setDiscardConfirmationOpen(false)}
            >
              계속 생성하기
            </Button>
            <Button
              type="button"
              appearance="cta"
              size="md"
              className="flex-1"
              disabled={discarding}
              onClick={() => void discardRunAndClose()}
            >
              {discarding ? "폐기 중" : "생성 결과 폐기"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {apiError && <p role="alert">{apiError}</p>}
          {pendingSessionSync && !apiBusy && (
            <Button size="xs" className="self-start" onClick={() => void synchronizeSession()}>
              세션 다시 동기화
            </Button>
          )}
          {loading ? (
            <div className="flex h-full flex-col items-center pt-[139px] text-center" role="status">
              <p className="text-title-s leading-[1.42] font-semibold">
                AI가 스토리를 생성중이에요...
              </p>
              <div
                className="mt-6 flex size-40 shrink-0 items-center justify-center rounded-full bg-[var(--grey-white)]"
                aria-hidden
              >
                <Image
                  src="/icons/funding-story/loading-logo.svg"
                  alt=""
                  width={144}
                  height={121}
                  className={styles.loadingLogo}
                />
              </div>
            </div>
          ) : result ? (
            <div className="mx-auto flex h-full max-w-203 flex-col gap-6">
              <p role="status" className="sr-only">
                {apiBusy ? "스토리에 반영하는 중입니다." : ""}
              </p>
              <div
                className="bg-layer-surface-disabled min-h-0 flex-1 overflow-y-auto"
                aria-label="AI 스토리 결과 본문"
                tabIndex={0}
              >
                <p className="text-caption-s mb-2 break-words">{projectTitle} · AI 생성 결과</p>
                {projectId && remoteBlocks ? (
                  <article className="border-border-default bg-layer-surface-default space-y-6 rounded-xs border p-6 sm:p-10">
                    {remoteBlocks.map((block, index) =>
                      block.type === "IMAGE" ? (
                        <Image
                          key={`${block.value}-${index}`}
                          src={block.value}
                          alt="AI가 생성한 상세페이지 이미지"
                          width={1200}
                          height={800}
                          unoptimized
                          className="h-auto w-full rounded-xs"
                        />
                      ) : (
                        /* 하단 TEXT는 섹션·제목·구분선 HTML이다(#331). 글자로 보이지 않게 구매자 상세와
                       같은 안전 렌더러로 그린다. */
                        <div key={index} className="text-body-m break-words">
                          <StoryTextBlock value={block.value} />
                        </div>
                      ),
                    )}
                  </article>
                ) : (
                  <StoryPreview body={generatedBody} />
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  size="xs"
                  className="h-10! w-36 leading-[1.42] font-medium"
                  disabled={apiBusy || discarding}
                  onClick={() => {
                    if (projectId) {
                      setRemoteStage("summary");
                      setRun(null);
                    } else {
                      dispatch({ type: "back" });
                    }
                  }}
                >
                  이전으로
                </Button>
                <TextButton
                  className="ml-auto h-10 no-underline!"
                  disabled={apiBusy || discarding}
                  onClick={() => void generate()}
                >
                  재생성
                </TextButton>
                <Button
                  size="xs"
                  className="h-10! w-36 leading-[1.42] font-medium"
                  disabled={apiBusy || discarding}
                  onClick={() => void importResult()}
                >
                  불러오기
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-layer-bg border-border-default flex h-full min-h-0 flex-col rounded-xs border px-4 pb-4">
              <div
                ref={historyRef}
                role="log"
                aria-label="스토리 작성 대화"
                aria-live="polite"
                tabIndex={0}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
                onScroll={() => {
                  const el = historyRef.current;
                  if (el)
                    followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
                }}
              >
                <div className="flex min-h-full flex-col gap-2">
                  {displayedMessages.map((message, index) => {
                    const latest = index === displayedMessages.length - 1;
                    return (
                      <ChatDialogue
                        key={index}
                        appearance="story"
                        sender={message.role === "assistant" ? "ai" : "user"}
                        avatar={
                          state.messages[index - 1]?.role === "assistant" ? (
                            <span />
                          ) : (
                            <Image
                              src="/icons/funding-story/avatar.svg"
                              alt=""
                              width={32}
                              height={32}
                            />
                          )
                        }
                        progress={
                          message.question
                            ? `${message.question}/${storyQuestions.length}`
                            : undefined
                        }
                        actions={
                          projectId &&
                          latest &&
                          message.role === "assistant" &&
                          remoteStage === "collecting" &&
                          !message.isPending &&
                          !streamingText ? (
                            <Chip
                              appearance="outline"
                              className="text-text-secondary border-border-default! bg-layer-surface-default! text-label-m h-[26px] font-semibold"
                              disabled={busy}
                              onClick={() => send("해당 사항 없음")}
                            >
                              해당 사항 없음
                            </Chip>
                          ) : projectId && message.isSummary ? (
                            <Chip
                              appearance="outline"
                              className="text-text-secondary bg-layer-surface-default text-label-m h-[26px] font-semibold"
                              disabled={apiBusy || pendingSessionSync !== null}
                              onClick={() => void generate()}
                            >
                              그대로 생성하기
                            </Chip>
                          ) : message.question ? (
                            <Chip
                              appearance="outline"
                              className="text-text-secondary border-border-default! bg-layer-surface-default! text-label-m h-[26px] font-semibold"
                              disabled={state.stage !== "questions" || !latest}
                              onClick={() => send("해당 사항 없음")}
                            >
                              해당 사항 없음
                            </Chip>
                          ) : displayStage === "summary" && latest ? (
                            <Chip
                              appearance="outline"
                              className="text-text-secondary bg-layer-surface-default text-label-m h-[26px] font-semibold"
                              disabled={apiBusy}
                              onClick={() => void generate()}
                            >
                              그대로 생성하기
                            </Chip>
                          ) : undefined
                        }
                        attachments={
                          message.images?.length ? <ChatImages urls={message.images} /> : undefined
                        }
                      >
                        {message.text}
                      </ChatDialogue>
                    );
                  })}
                </div>
              </div>
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={
                  displayStage === "summarizing" || (projectId && apiBusy && !initialLoading)
                    ? "text-caption-s text-text-secondary mb-2 pl-10"
                    : "sr-only"
                }
              >
                {displayStage === "summarizing"
                  ? "요약 중 …"
                  : projectId && remoteStage === "connecting"
                    ? "AI 세션 연결 중 …"
                    : projectId && apiBusy
                      ? "AI 응답 생성 중 …"
                      : ""}
              </p>
              {projectId && (
                <>
                  <ChatAttachmentTray
                    items={attachments}
                    error={attachmentError}
                    disabled={busy}
                    onRemove={removeAttachment}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(event) => {
                      addAttachments(Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                </>
              )}
              <InputChat
                ref={textareaRef}
                appearance="story"
                className="shrink-0"
                aria-label="스토리 메시지"
                value={input}
                disabled={busy}
                canSend={canSendComposer}
                // 데모 대화는 업로드할 서버 프로젝트가 없어 첨부를 열지 않는다.
                attachDisabled={!projectId}
                attachLabel={projectId ? "파일 첨부" : "파일 첨부 (준비 중)"}
                onAttach={projectId ? () => fileInputRef.current?.click() : undefined}
                placeholder="답변을 작성해주세요"
                onChange={(event) => setInput(event.target.value)}
                onSend={(text) => send(text, true)}
              />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
