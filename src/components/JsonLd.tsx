/**
 * Renders a JSON-LD (schema.org) block.
 *
 * The payload is serialised defensively: `<`, `>` and `&` are escaped to their
 * unicode form so a stray `</script>` inside DB content can never break out of
 * the tag and inject markup.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export default function JsonLd({ data, id }: { data: unknown; id?: string }) {
  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}

/** Render several nodes as a single `@graph`. */
export function JsonLdGraph({ nodes, id }: { nodes: unknown[]; id?: string }) {
  const graph = nodes.filter(Boolean).map((n) => ({ ...(n as object), '@context': undefined }));
  return <JsonLd id={id} data={{ '@context': 'https://schema.org', '@graph': graph }} />;
}
