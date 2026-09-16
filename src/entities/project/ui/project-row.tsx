import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function ProjectRow({
  project,
  thumbnailClassName,
  children,
}: {
  project: {
    id: string;
    title: string;
    seller: string;
    progress: number;
    closed: boolean;
    image?: string;
    thumbnail?: string;
  };
  thumbnailClassName: string;
  children?: ReactNode;
}) {
  return (
    <article aria-label={project.title} className="flex items-start gap-3">
      <Link
        href={`/projects/${project.id}`}
        aria-label={`${project.title} 상세 보기`}
        className={`bg-layer-surface-default relative flex aspect-[4/3] shrink-0 items-center justify-center overflow-hidden rounded-xs ${thumbnailClassName}`}
      >
        {project.image && (
          <Image
            src={project.thumbnail ?? project.image}
            alt=""
            fill
            sizes="144px"
            className={`object-cover ${project.closed ? "opacity-30" : ""}`}
          />
        )}
        {project.closed && (
          <span className="bg-layer-surface-disabled text-label-m absolute top-5 left-6 rounded-xs px-2 py-1">
            종료
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1 pt-1">
        <Link
          href={`/projects/${project.id}`}
          className={`block ${project.closed ? "text-text-disabled" : ""}`}
        >
          <p className="text-label-m text-text-disabled mb-1">{project.seller}</p>
          <h2 className="line-clamp-2 min-h-10 text-[0.875rem] leading-5 font-medium">
            {project.title}
          </h2>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-1">
          <p className={`text-body-strong ${project.closed ? "text-text-disabled" : ""}`}>
            {project.progress.toLocaleString("ko-KR")}%달성
          </p>
          {children}
        </div>
      </div>
    </article>
  );
}
