export function StoryPreview({ body }: { body: string }) {
  const [heading, ...paragraphs] = body.split("\n\n");
  return (
    <article className="border-border-default bg-layer-surface-default overflow-hidden rounded-xs border">
      <h3 className="bg-layer-surface-primary text-text-inverse text-heading-m px-6 py-10 text-center break-words whitespace-pre-wrap">
        {heading}
      </h3>
      <div className="text-body-m space-y-6 p-6 sm:p-10">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="break-words whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
