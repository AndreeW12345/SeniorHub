import { existsSync } from 'node:fs';
import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = pathResolve(__dirname, '../src');

function resolveSrcFile(subpath) {
  const candidates = [
    pathResolve(srcRoot, subpath),
    pathResolve(srcRoot, `${subpath}.ts`),
    pathResolve(srcRoot, `${subpath}.tsx`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  return pathToFileURL(pathResolve(srcRoot, subpath)).href;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const subpath = specifier.slice(2);
    return nextResolve(resolveSrcFile(subpath), context);
  }

  return nextResolve(specifier, context, nextResolve);
}
