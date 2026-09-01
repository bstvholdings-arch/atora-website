/**
 * /robots.txt
 *
 *  - Explicitly ALLOWS the AI / answer-engine crawlers (GPTBot, OAI-SearchBot,
 *    ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, ...) so ATORA can
 *    be read and cited by ChatGPT, Google AI Overviews, Gemini, Copilot,
 *    Perplexity and Claude.
 *  - Explicitly PROTECTS private surface area: /admin, /api, env files,
 *    secrets, build artefacts and parameter-heavy filtered URLs.
 */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const origin = base.replace(/\/+$/, '');

  // Crawlers that should be able to read and cite ATORA.
  const aiBots = [
    'GPTBot', // OpenAI — training + grounding
    'OAI-SearchBot', // OpenAI — ChatGPT search indexing
    'ChatGPT-User', // OpenAI — user-triggered browsing
    'PerplexityBot', // Perplexity
    'Perplexity-User',
    'ClaudeBot', // Anthropic
    'Claude-User',
    'anthropic-ai',
    'Google-Extended', // Google AI Overviews / Gemini grounding
    'Applebot-Extended', // Apple Intelligence
    'Amazonbot',
    'cohere-ai',
    'Diffbot',
    'omgili',
    'YouBot',
  ];

  const body = `# ATORA — robots.txt
# Public marketing + catalogue pages are open to search engines and AI answer engines.

# ------------------------------------------------------------------
# AI / answer-engine crawlers — explicitly allowed
# ------------------------------------------------------------------
${aiBots
  .map(
    (bot) => `User-agent: ${bot}
Allow: /
Disallow: /admin
Disallow: /api/
`
  )
  .join('\n')}
# ------------------------------------------------------------------
# Everyone else
# ------------------------------------------------------------------
User-agent: *
Allow: /

# Private / non-content surface
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /*.env$
Disallow: /*.env.*
Disallow: /_next/
Disallow: /*.tsbuildinfo$
Disallow: /*?*add-to-cart
# Filtered catalogue URLs create near-duplicate combinations — keep them out of
# the index (AI crawlers still get the canonical catalogue pages).
Disallow: /*?q=
Disallow: /*?brand=
Disallow: /*?category=
Disallow: /*?service=

# ------------------------------------------------------------------
# Discovery
# ------------------------------------------------------------------
Sitemap: ${origin}/sitemap.xml
LLM-Txt: ${origin}/llms.txt
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
