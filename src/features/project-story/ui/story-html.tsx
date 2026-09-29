import { Fragment, useMemo, type ReactNode } from "react";
import {
  isStoryHtml,
  safeStoryHtml,
  type SafeStoryHtmlNode,
} from "@/features/project-story/model/story-content";

/* API HTML을 그대로 넣지 않고 허용 태그·스타일만 React 요소로 만든다. style 키는 CSS 속성의
   camelCase라 그대로 넘긴다. */
function renderStoryHtml(nodes: SafeStoryHtmlNode[], keyPrefix = "story"): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === "string") return <Fragment key={key}>{node}</Fragment>;
    const children = renderStoryHtml(node.children, key);
    const style = node.style;
    if (node.tag === "br") return <br key={key} />;
    if (node.tag === "hr") return <hr key={key} style={style} />;
    if (node.tag === "strong" || node.tag === "b")
      return (
        <strong key={key} style={style}>
          {children}
        </strong>
      );
    if (node.tag === "em" || node.tag === "i")
      return (
        <em key={key} style={style}>
          {children}
        </em>
      );
    if (node.tag === "u")
      return (
        <u key={key} style={style}>
          {children}
        </u>
      );
    if (node.tag === "span")
      return (
        <span key={key} style={style}>
          {children}
        </span>
      );
    if (node.tag === "p")
      return (
        <p key={key} style={style}>
          {children.length ? children : <br />}
        </p>
      );
    if (node.tag === "div")
      return (
        <div key={key} style={style}>
          {children}
        </div>
      );
    /* AI Funding Story 하단(#331). 섹션 안 문단도 본문과 같은 간격을 두고, Tailwind 기본
       스타일이 지운 제목 굵기를 되살린다(AI 결과는 브라우저 기본 제목 모양을 전제로 만든다). */
    if (node.tag === "section")
      return (
        <section key={key} style={style} className="space-y-4">
          {children}
        </section>
      );
    if (node.tag === "h2" || node.tag === "h3") {
      const Heading = node.tag;
      return (
        <Heading key={key} style={style} className="font-bold">
          {children}
        </Heading>
      );
    }
    if (node.tag === "ul" || node.tag === "ol") {
      const List = node.tag;
      return (
        <List
          key={key}
          style={style}
          className={node.tag === "ul" ? "list-disc pl-5" : "list-decimal pl-5"}
        >
          {children}
        </List>
      );
    }
    if (node.tag === "li")
      return (
        <li key={key} style={style}>
          {children}
        </li>
      );
    return null;
  });
}

/* 리워드·환불·라이브 등 무관한 쿼리가 갱신될 때마다 정규식 토크나이저를 다시 돌리지 않도록
   블록 단위 컴포넌트로 분리해 값이 그대로면 파싱 결과를 재사용한다. */
export function StoryTextBlock({ value }: { value: string }) {
  const story = useMemo(() => ({ html: isStoryHtml(value), nodes: safeStoryHtml(value) }), [value]);
  return (
    <div className={story.html ? "space-y-4" : "whitespace-pre-wrap"}>
      {renderStoryHtml(story.nodes)}
    </div>
  );
}
