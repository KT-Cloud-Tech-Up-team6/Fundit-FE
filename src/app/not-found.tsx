import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-label-l text-text-default">404</p>
        <h1 className="text-display-s mt-2">요청한 화면을 찾을 수 없습니다.</h1>
        <Link
          href="/"
          className="bg-layer-surface-primary text-body-strong text-text-inverse mt-6 inline-block rounded-full px-5 py-3"
        >
          홈으로 이동
        </Link>
      </div>
    </main>
  );
}
