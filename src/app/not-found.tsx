import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-bold text-brand">404</p>
        <h1 className="mt-2 text-3xl font-black">요청한 화면을 찾을 수 없습니다.</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand px-5 py-3 font-bold text-white"
        >
          홈으로 이동
        </Link>
      </div>
    </main>
  );
}
