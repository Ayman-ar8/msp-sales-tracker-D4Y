#!/usr/bin/env node
/**
 * Builds apps-script/SalesTracker.gs: the single file the founder pastes into
 * Extensions > Apps Script. It is schema.json + every file in apps-script/src,
 * in name order. Run: npm run bundle   Check only: npm run bundle -- --check
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'apps-script', 'src');
const outFile = join(root, 'apps-script', 'SalesTracker.gs');

export function bundle() {
  const schema = JSON.parse(readFileSync(join(root, 'schema.json'), 'utf8'));
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort();
  const parts = [
    '/**',
    ' * Sales Tracker – Apps Script (generated file, do not edit by hand).',
    ` * Schema version ${schema.version}. Source: apps-script/src/*.js + schema.json`,
    ' *',
    ' * Paste this whole file into Extensions > Apps Script (replace everything),',
    ' * save, then choose the function "setup" and click Run.',
    ' */',
    '',
    `var SCHEMA = ${JSON.stringify(schema, null, 2)};`,
    ''
  ];
  for (const f of files) {
    parts.push(`/* ===== ${f} ===== */`, readFileSync(join(srcDir, f), 'utf8').trimEnd(), '');
  }
  return parts.join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const output = bundle();
  if (process.argv.includes('--check')) {
    const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    if (current !== output) {
      console.error('apps-script/SalesTracker.gs is out of date. Run: npm run bundle');
      process.exit(1);
    }
    console.log('apps-script/SalesTracker.gs is up to date.');
  } else {
    writeFileSync(outFile, output);
    console.log(`Wrote ${outFile}`);
  }
}
