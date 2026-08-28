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
        <p className="text-brand text-sm font-bold">ERROR</p>
        <h1 className="mt-2 text-3xl font-black">화면을 불러오지 못했습니다.</h1>
        <button
          onClick={reset}
          className="bg-brand mt-6 rounded-full px-5 py-3 font-bold text-white"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
