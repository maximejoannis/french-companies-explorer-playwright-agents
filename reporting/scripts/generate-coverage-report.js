const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const specsRoot = path.join(root, 'specs');
const testsRoot = path.join(root, 'tests');
const defectsRoot = path.join(root, 'defects');
const templateRoot = path.join(root, 'reporting', 'coverage');
const outputRoot = path.join(root, 'coverage-report');

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function rate(part, total) {
  return total ? Number(((part / total) * 100).toFixed(1)) : 0;
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value);
}

const userStories = walk(specsRoot)
  .filter((file) => path.basename(file).startsWith('US-') && file.endsWith('.md'))
  .map((file) => {
    const source = fs.readFileSync(file, 'utf8');
    const heading = source.match(/^#\s+(US-[A-Z-]+-\d+)\s+—\s+(.+)$/mu);
    if (!heading) throw new Error(`Titre de User Story illisible : ${relative(file)}`);
    return { id: heading[1], title: heading[2].trim(), file: relative(file) };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const plannedOccurrences = [];
for (const file of walk(specsRoot).filter((item) => path.basename(item).startsWith('TEST-PLAN-'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/^###\s+(TC-[A-Z-]+-\d+)\b/gmu)) {
    plannedOccurrences.push({ id: match[1], file: relative(file) });
  }
}
const plannedIds = [...new Set(plannedOccurrences.map(({ id }) => id))].sort();

const testCases = [];
for (const file of walk(testsRoot).filter((item) => item.endsWith('.spec.ts'))) {
  const source = fs.readFileSync(file, 'utf8');
  const feature = source.match(/allure\.feature\(['"]([^'"]+)['"]\)/u)?.[1] ?? 'Non renseignée';
  const story = source.match(/allure\.story\(['"]([^'"]+)['"]\)/u)?.[1] ?? 'Non renseignée';
  const storyId = story.match(/^US-[A-Z-]+-\d+/u)?.[0] ?? null;
  const normalizedFile = relative(file);
  const level = normalizedFile.startsWith('tests/api/')
    ? 'API'
    : normalizedFile.endsWith('-real.spec.ts')
      ? 'E2E_REAL'
      : 'UI_MOCKED';
  const declaration = /test(?<fixme>\.fixme)?\(\s*['"](?<title>TC-[A-Z-]+-\d+[^'"]*)['"]/gu;
  for (const match of source.matchAll(declaration)) {
    const title = match.groups.title;
    testCases.push({
      id: title.match(/^TC-[A-Z-]+-\d+/u)[0],
      title,
      feature,
      story,
      storyId,
      level,
      fixme: Boolean(match.groups.fixme),
      tags: [...title.matchAll(/@[\w-]+/gu)].map((tag) => tag[0]),
      file: normalizedFile,
    });
  }
}

const automatedIds = testCases.map(({ id }) => id);
const duplicateAutomatedIds = duplicates(automatedIds);
const duplicatePlannedIds = duplicates(plannedOccurrences.map(({ id }) => id));

const automatedSet = new Set(automatedIds);
const plannedSet = new Set(plannedIds);
const missingAutomated = plannedIds.filter((id) => !automatedSet.has(id));
const automatedOutsidePlans = [...new Set(automatedIds.filter((id) => !plannedSet.has(id)))].sort();

const features = userStories.map((story) => {
  const related = testCases.filter((testCase) => testCase.storyId === story.id);
  return {
    name: related[0]?.feature ?? story.id,
    story: `${story.id} — ${story.title}`,
    storyId: story.id,
    defined: true,
    automated: related.length > 0,
    testCases: related.length,
    active: related.filter(({ fixme }) => !fixme).length,
    fixme: related.filter(({ fixme }) => fixme).length,
    levels: Object.fromEntries(
      ['API', 'UI_MOCKED', 'E2E_REAL'].map((level) => [
        level,
        related.filter((item) => item.level === level).length,
      ]),
    ),
  };
});

const levels = Object.fromEntries(
  ['API', 'UI_MOCKED', 'E2E_REAL'].map((level) => [
    level,
    testCases.filter((testCase) => testCase.level === level).length,
  ]),
);
const tagNames = [...new Set(testCases.flatMap(({ tags }) => tags))].sort();
const tags = Object.fromEntries(
  tagNames.map((tag) => [tag, testCases.filter((testCase) => testCase.tags.includes(tag)).length]),
);
const fixme = testCases.filter((testCase) => testCase.fixme);
const defectFiles = walk(defectsRoot).filter((file) =>
  /^BUG-\d+.*\.md$/u.test(path.basename(file)),
);
const documentedDefects = defectFiles
  .map((file) => path.basename(file).match(/^BUG-\d+/u)[0])
  .sort();
const fixmeDefects = [
  ...new Set(fixme.flatMap(({ title }) => title.match(/BUG-\d+/gu) ?? [])),
].sort();

const data = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  features: {
    defined: features.length,
    automated: features.filter(({ automated }) => automated).length,
    rate: rate(features.filter(({ automated }) => automated).length, features.length),
    items: features,
  },
  testCases: {
    planned: plannedIds.length,
    automated: testCases.length,
    active: testCases.filter(({ fixme: knownFixme }) => !knownFixme).length,
    fixme: fixme.length,
    missingAutomated,
    automatedOutsidePlans,
    duplicateAutomatedIds,
    duplicatePlannedIds,
    items: testCases,
  },
  levels,
  tags,
  defects: {
    documented: documentedDefects.length,
    associatedWithFixme: fixmeDefects.length,
    withoutFixme: documentedDefects.filter((id) => !fixmeDefects.includes(id)).length,
    fixmeIds: fixmeDefects,
  },
};

fs.mkdirSync(outputRoot, { recursive: true });
for (const asset of ['index.html', 'styles.css', 'app.js']) {
  fs.copyFileSync(path.join(templateRoot, asset), path.join(outputRoot, asset));
}
fs.writeFileSync(path.join(outputRoot, 'data.json'), `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(
  path.join(outputRoot, 'coverage-data.js'),
  `window.COVERAGE_DATA = ${JSON.stringify(data)};\n`,
);

console.log(`Rapport de couverture généré dans ${relative(outputRoot)}`);
console.log(
  `Features : ${data.features.automated}/${data.features.defined} (${data.features.rate} %)`,
);
console.log(
  `TC : ${data.testCases.automated} automatisés, ${data.testCases.active} actifs, ${data.testCases.fixme} fixme`,
);
console.log(
  `Niveaux : API ${levels.API}, UI_MOCKED ${levels.UI_MOCKED}, E2E_REAL ${levels.E2E_REAL}`,
);
if (automatedOutsidePlans.length)
  console.warn(`TC automatisés hors plans : ${automatedOutsidePlans.join(', ')}`);
if (missingAutomated.length)
  console.warn(`TC planifiés non automatisés : ${missingAutomated.join(', ')}`);
if (duplicateAutomatedIds.length) {
  console.error(`IDs TC automatisés dupliqués : ${duplicateAutomatedIds.join(', ')}`);
  process.exitCode = 1;
}
