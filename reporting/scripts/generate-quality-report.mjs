import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputDirectory = path.join(root, 'quality-report');
const checksConfiguration = [
  ['prettier', 'Prettier', 'format:check', 'Vérification du formatage du projet.'],
  ['eslint', 'ESLint', 'lint', 'Analyse statique et bonnes pratiques Playwright.'],
  ['typescript', 'TypeScript', 'typecheck', 'Vérification du typage sans émission de fichiers.'],
];

function run(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    shell: false,
    windowsHide: true,
  });
}

function executeCheck([id, name, script, description]) {
  const startedAt = Date.now();
  const result =
    process.platform === 'win32'
      ? run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm run ${script}`])
      : run('npm', ['run', script]);
  const exitCode = result.status ?? 1;
  return {
    id,
    name,
    description,
    command: `npm run ${script}`,
    status: exitCode === 0 ? 'passed' : 'failed',
    exitCode,
    durationMs: Date.now() - startedAt,
    output:
      [result.stdout, result.stderr].filter(Boolean).join('\n').trim() ||
      result.error?.message ||
      'Aucune sortie.',
  };
}

function gitValue(args, fallback) {
  const result = run('git', args);
  return result.status === 0 ? result.stdout.trim() || fallback : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const checks = checksConfiguration.map(executeCheck);
const overallStatus = checks.every(({ status }) => status === 'passed') ? 'passed' : 'failed';
const compact = (id) => {
  const check = checks.find((item) => item.id === id);
  return { status: check.status, exitCode: check.exitCode, durationMs: check.durationMs };
};
const summary = {
  schemaVersion: 1,
  overallStatus,
  generatedAt: new Date().toISOString(),
  branch:
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    gitValue(['branch', '--show-current'], 'local'),
  commit:
    process.env.GITHUB_SHA?.slice(0, 8) ||
    gitValue(['rev-parse', '--short', 'HEAD'], 'non versionné'),
  environment: {
    platform: `${os.platform()} ${os.release()}`,
    nodeVersion: process.version,
    ci: Boolean(process.env.CI),
  },
  prettier: compact('prettier'),
  eslint: compact('eslint'),
  typescript: compact('typescript'),
  checks,
};

const cards = checks
  .map(
    (check) =>
      `<article class="check check--${check.status}"><header><div><span>Contrôle qualité</span><h2>${escapeHtml(check.name)}</h2></div><strong>${check.status === 'passed' ? 'PASS' : 'ÉCHEC'}</strong></header><p>${escapeHtml(check.description)}</p><dl><div><dt>Commande</dt><dd><code>${escapeHtml(check.command)}</code></dd></div><div><dt>Durée</dt><dd>${check.durationMs} ms</dd></div><div><dt>Code</dt><dd>${check.exitCode}</dd></div></dl><details ${check.status === 'failed' ? 'open' : ''}><summary>Sortie détaillée</summary><pre>${escapeHtml(check.output)}</pre></details></article>`,
  )
  .join('\n');
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Qualité — French Companies Explorer Playwright Agents</title><style>:root{color-scheme:light;--bg:#f4f7fc;--surface:#fff;--text:#172033;--muted:#647089;--border:#dbe3f1;--blue:#245af5;--ok:#08783e;--ok-bg:#e5f8ed;--bad:#ba2537;--bad-bg:#ffeaed} @media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0c111c;--surface:#151d2b;--text:#eef3ff;--muted:#aab5cb;--border:#2a3750;--blue:#7da4ff;--ok:#60d894;--ok-bg:#143b29;--bad:#ff8f9c;--bad-bg:#492029}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif}.container{width:min(1160px,calc(100% - 32px));margin:auto}header.top{padding:24px 0;border-bottom:1px solid var(--border);background:var(--surface)}a{color:var(--blue);font-weight:700}.hero{padding:64px 0 32px}.eyebrow{color:var(--blue);font-weight:800;text-transform:uppercase;letter-spacing:.15em}.hero h1{font-size:clamp(2.2rem,5vw,4rem);margin:.3em 0}.hero p{color:var(--muted);font-size:1.1rem}.verdict{padding:20px;border-radius:18px;background:${overallStatus === 'passed' ? 'var(--ok-bg)' : 'var(--bad-bg)'};color:${overallStatus === 'passed' ? 'var(--ok)' : 'var(--bad)'};font-weight:800}.checks{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:28px 0 64px}.check{padding:22px;border:1px solid var(--border);border-radius:18px;background:var(--surface)}.check header{display:flex;justify-content:space-between;gap:16px}.check header span,.check p,dt{color:var(--muted)}.check h2{margin:.25rem 0}.check strong{color:var(--ok)}.check--failed strong{color:var(--bad)}dl{display:grid;gap:10px;padding:14px;background:var(--bg);border-radius:12px}dl div{display:flex;justify-content:space-between;gap:10px}dd{margin:0;text-align:right}details{margin-top:16px}summary{cursor:pointer;color:var(--blue);font-weight:700}pre{overflow:auto;max-height:360px;white-space:pre-wrap;font-size:.78rem}a:focus-visible,summary:focus-visible{outline:3px solid var(--blue);outline-offset:3px}@media(max-width:850px){.checks{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}</style></head><body><header class="top"><div class="container"><strong>French Companies Explorer Playwright Agents</strong> · <a href="../index.html">Portail QA</a></div></header><main class="container"><section class="hero"><p class="eyebrow">Qualité du code</p><h1>Rapport de qualité</h1><p>Résultats réels des contrôles Prettier, ESLint et TypeScript.</p></section><div class="verdict">Quality Gate : ${overallStatus === 'passed' ? 'PASS' : 'ÉCHEC'}</div><section class="checks">${cards}</section></main></body></html>`;

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(path.join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(path.join(outputDirectory, 'index.html'), html);
console.log(`Rapport qualité : ${path.relative(root, outputDirectory)} (${overallStatus})`);
if (overallStatus === 'failed') process.exitCode = 1;
