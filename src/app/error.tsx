"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-bold text-brand">ERROR</p>
        <h1 className="mt-2 text-3xl font-black">화면을 불러오지 못했습니다.</h1>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-brand px-5 py-3 font-bold text-white"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
