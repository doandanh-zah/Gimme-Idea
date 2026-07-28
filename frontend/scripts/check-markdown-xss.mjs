#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const root = process.cwd();
const scanRoots = ['app', 'components', 'contexts', 'hooks', 'lib'];
const allowedDangerousHtmlFiles = new Set(['app/head.tsx', 'app/layout.tsx']);
const failures = [];

function walk(dir) {
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(absolute);
  }

  return files;
}

for (const file of scanRoots.flatMap((dir) => walk(path.join(root, dir)))) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const source = fs.readFileSync(file, 'utf8');

  if (/rehype-raw|rehypeRaw/.test(source)) {
    failures.push(`${rel}: raw HTML markdown plugin is forbidden`);
  }

  if (/dangerouslySetInnerHTML/.test(source) && !allowedDangerousHtmlFiles.has(rel)) {
    failures.push(`${rel}: dangerouslySetInnerHTML is not allowed outside reviewed static metadata files`);
  }
}

const payloads = [
  '<script>window.__xss = true</script>',
  '<img src=x onerror=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '[click](javascript:alert(1))',
  '[click](data:text/html,<script>alert(1)</script>)',
  '<a href="javascript:alert(1)">click</a>',
  '![x](javascript:alert(1))',
];

const dangerousRenderedPatterns = [
  /<script[\s>]/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<style[\s>]/i,
  /<img\b[^>]*\son[a-z]+\s*=/i,
  /<svg\b[^>]*\son[a-z]+\s*=/i,
  /\s(?:href|src)=["']javascript:/i,
  /\s(?:href|src)=["']data:text\/html/i,
];

for (const payload of payloads) {
  const html = renderToStaticMarkup(
    React.createElement(
      ReactMarkdown,
      {
        remarkPlugins: [remarkGfm, remarkBreaks],
        urlTransform: defaultUrlTransform,
        components: {
          a: ({node: _node, ...props}) =>
            React.createElement('a', {
              ...props,
              target: '_blank',
              rel: 'noopener noreferrer',
            }),
        },
      },
      payload
    )
  );

  const match = dangerousRenderedPatterns.find((pattern) => pattern.test(html));
  if (match) {
    failures.push(`Rendered dangerous markdown for payload ${JSON.stringify(payload)}: ${html}`);
  }
}

if (failures.length > 0) {
  console.error('Markdown XSS guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Markdown XSS guard passed for ${payloads.length} payloads.`);
