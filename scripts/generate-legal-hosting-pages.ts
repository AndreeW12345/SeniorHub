import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import type {
  LegalBlock,
  LegalDocumentDefinition,
  LegalInlineSegment,
} from '../src/components/legal/legal-document-renderer';
import { anvandarvillkorDocument } from '../src/content/legal/anvandarvillkor';
import { integritetspolicyDocument } from '../src/content/legal/integritetspolicy';
import { raderaKontoDocument } from '../src/content/legal/radera-konto';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(segments: LegalInlineSegment[]): string {
  return segments
    .map((segment) => {
      if (typeof segment === 'string') {
        return escapeHtml(segment);
      }

      if ('link' in segment) {
        const href = segment.href.startsWith('/')
          ? escapeHtml(segment.href)
          : escapeHtml(segment.href);
        return `<a href="${href}">${escapeHtml(segment.link)}</a>`;
      }

      if (segment.bold) {
        return `<strong>${escapeHtml(segment.text)}</strong>`;
      }

      return escapeHtml(segment.text);
    })
    .join('');
}

function renderBlocks(blocks: LegalBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'docTitle':
        parts.push(`<h1>${escapeHtml(block.text)}</h1>`);
        break;
      case 'lead':
        parts.push(`<p class="legal-lead">${renderInline(block.content)}</p>`);
        break;
      case 'meta':
        parts.push(`<p class="legal-meta">${renderInline(block.content)}</p>`);
        break;
      case 'h2':
        parts.push(`<h2>${escapeHtml(block.text)}</h2>`);
        break;
      case 'h3':
        parts.push(`<h3>${escapeHtml(block.text)}</h3>`);
        break;
      case 'p':
        parts.push(`<p>${renderInline(block.content)}</p>`);
        break;
      case 'ul':
        parts.push(
          `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`,
        );
        break;
      case 'hr':
        parts.push('<hr class="legal-hr" />');
        break;
      default:
        break;
    }
  }

  return parts.join('\n');
}

function renderPage(document: LegalDocumentDefinition, pageTitle: string): string {
  const body = renderBlocks(document.blocks);

  return `<!DOCTYPE html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)} – SeniorHub</title>
    <link rel="icon" href="/images/icon.png" type="image/png" />
    <link rel="stylesheet" href="/legal/legal.css" />
  </head>
  <body>
    <div class="page">
      <header class="site-header">
        <a class="brand" href="/">
          <img class="brand-logo" src="/images/icon.png" width="48" height="48" alt="" />
          <span class="brand-name">SeniorHub</span>
        </a>
      </header>
      <main class="legal-main">
        <article class="legal-inner">
          ${body}
          <nav class="nav-links" aria-label="Relaterade sidor">
            <a href="/integritet">Integritetspolicy</a>
            <a href="/villkor">Användarvillkor</a>
            <a href="/radera-konto">Radera konto</a>
            <a href="/app/">Öppna appen</a>
          </nav>
        </article>
      </main>
      <footer class="site-footer">
        <p>© SeniorHub · <a href="mailto:support@seniorhub.se">support@seniorhub.se</a></p>
      </footer>
    </div>
  </body>
</html>
`;
}

const pages: { slug: string; document: LegalDocumentDefinition; title: string }[] = [
  {
    slug: 'integritet',
    document: integritetspolicyDocument,
    title: 'Integritetspolicy',
  },
  {
    slug: 'villkor',
    document: anvandarvillkorDocument,
    title: 'Användarvillkor',
  },
  {
    slug: 'radera-konto',
    document: raderaKontoDocument,
    title: 'Radera konto',
  },
];

const hostingPublic = resolve(process.cwd(), 'hosting-public');

for (const page of pages) {
  const dir = resolve(hostingPublic, page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), renderPage(page.document, page.title), 'utf8');
  console.log(`Wrote hosting-public/${page.slug}/index.html`);
}
