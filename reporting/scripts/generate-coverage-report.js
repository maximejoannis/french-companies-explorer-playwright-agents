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

function documentedDefectStatus(source) {
  const inline = source.match(
    /^[ \t]*[-*]?[ \t]*\*{0,2}(?:Statut|Status)\*{0,2}[ \t]*:[ \t]*\*{0,2}([^*\r\n]+)\*{0,2}/imu,
  )?.[1];
  const heading = source.match(/^##\s+(?:Statut|Status)\s*$/imu);
  const afterHeading = heading
    ? source
        .slice(heading.index + heading[0].length)
        .split(/\r?\n/u)
        .map((line) => line.replaceAll('*', '').trim())
        .find(Boolean)
    : undefined;
  const value = (inline ?? afterHeading ?? '').trim();
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase();

  if (/^(ouvert|ouverte|open)\b/u.test(normalized)) return { status: 'open', value };
  if (/^(resolu|resolue|resolved|corrige|corrigee|fixed|closed|ferme|fermee)\b/u.test(normalized))
    return { status: 'resolved', value };
  return { status: 'clarify', value: value || null };
}

const standaloneUserStories = walk(specsRoot)
  .filter((file) => path.basename(file).startsWith('US-') && file.endsWith('.md'))
  .map((file) => {
    const source = fs.readFileSync(file, 'utf8');
    const heading = source.match(/^#\s+(US-[A-Z-]+-\d+)\s+—\s+(.+)$/mu);
    if (!heading) throw new Error(`Titre de User Story illisible : ${relative(file)}`);
    return { id: heading[1], title: heading[2].trim(), file: relative(file) };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const requirementsFile = path.join(specsRoot, 'v1.1.1', 'REQUIREMENTS.md');
const requirementsSource = fs.readFileSync(requirementsFile, 'utf8');
const requirementsUserStories = [
  ...requirementsSource.matchAll(/^##\s+(FEAT-[A-Z0-9-]+)\s+—\s+(US-[A-Z0-9-]+)\s*$/gmu),
].map((match, index, matches) => {
  const sectionEnd = matches[index + 1]?.index ?? requirementsSource.length;
  const section = requirementsSource.slice(match.index + match[0].length, sectionEnd);
  const statement = section.match(/^En tant qu[^\r\n]+/mu)?.[0]?.replace(/\.$/u, '') ?? match[1];
  return {
    id: match[2],
    title: statement,
    file: relative(requirementsFile),
    anchor: match[1].toLowerCase(),
  };
});

const storyDefinitions = [...standaloneUserStories, ...requirementsUserStories];
const duplicateStoryIds = duplicates(storyDefinitions.map(({ id }) => id));
if (duplicateStoryIds.length) {
  throw new Error(`User Stories définies plusieurs fois : ${duplicateStoryIds.join(', ')}`);
}
const userStories = storyDefinitions.sort((left, right) => left.id.localeCompare(right.id));

const plannedOccurrences = [];
for (const file of walk(specsRoot).filter((item) => path.basename(item).startsWith('TEST-PLAN-'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/^###\s+(TC-[A-Z-]+-\d+)\b/gmu)) {
    plannedOccurrences.push({ id: match[1], file: relative(file) });
  }
}
const plannedIds = [...new Set(plannedOccurrences.map(({ id }) => id))].sort();

const testCases = [];
const expectedFailureDefectIds = new Set();
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
  const declarations = [...source.matchAll(declaration)];
  for (const [index, match] of declarations.entries()) {
    const title = match.groups.title;
    const body = source.slice(match.index, declarations[index + 1]?.index ?? source.length);
    const expectedFailure = /\btest\.fail\s*\(/u.test(body);
    const defectIds = [...new Set(body.match(/BUG-\d+/gu) ?? [])];
    const tracedStoryId = body.match(/Couvre\s+(US-[A-Z0-9-]+-\d+)/u)?.[1] ?? null;
    if (expectedFailure) defectIds.forEach((id) => expectedFailureDefectIds.add(id));
    if (expectedFailure && match.groups.fixme) {
      throw new Error(`${title} combine test.fail() et test.fixme() dans ${normalizedFile}`);
    }
    testCases.push({
      id: title.match(/^TC-[A-Z-]+-\d+/u)[0],
      title,
      feature,
      story,
      storyId,
      tracedStoryId,
      level,
      fixme: Boolean(match.groups.fixme),
      expectedFailure,
      defectIds,
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
const knownStoryIds = new Set(userStories.map(({ id }) => id));
const unknownStoryIds = [
  ...new Set(testCases.map(({ storyId }) => storyId).filter((id) => !knownStoryIds.has(id))),
].sort();
const mismatchedStoryTestCases = testCases
  .filter(({ storyId, tracedStoryId }) => tracedStoryId && tracedStoryId !== storyId)
  .map(({ id, storyId, tracedStoryId }) => ({ id, allureStoryId: storyId, tracedStoryId }));

const features = userStories.map((story) => {
  const related = testCases.filter((testCase) => testCase.storyId === story.id);
  return {
    name: related[0]?.feature ?? story.id,
    story: `${story.id} — ${story.title}`,
    storyId: story.id,
    source: story.anchor ? `${story.file}#${story.anchor}` : story.file,
    defined: true,
    automated: related.length > 0,
    testCases: related.length,
    ordinary: related.filter(({ fixme, expectedFailure }) => !fixme && !expectedFailure).length,
    expectedFailure: related.filter(({ expectedFailure }) => expectedFailure).length,
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
const expectedFailure = testCases.filter((testCase) => testCase.expectedFailure);
const ordinary = testCases.filter((testCase) => !testCase.fixme && !testCase.expectedFailure);

function executionSummary() {
  const resultsFile = path.join(root, 'test-results', 'results.json');
  if (!fs.existsSync(resultsFile)) return { available: false };
  const report = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const executions = [];
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const item of spec.tests ?? []) {
        const finalResult = item.results?.at(-1);
        executions.push({
          key: `${item.projectName ?? item.projectId}:${spec.file}:${spec.title}`,
          expectedStatus: item.expectedStatus,
          status: item.status,
          resultStatus: finalResult?.status ?? null,
        });
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  const unique = [...new Map(executions.map((item) => [item.key, item])).values()];
  return {
    available: true,
    generatedAt: report.stats?.startTime ?? null,
    total: unique.length,
    ordinaryPassed: unique.filter(
      ({ expectedStatus, status }) => expectedStatus === 'passed' && status === 'expected',
    ).length,
    expectedFailures: unique.filter(
      ({ expectedStatus, status }) => expectedStatus === 'failed' && status === 'expected',
    ).length,
    unexpectedSuccesses: unique.filter(
      ({ expectedStatus, status, resultStatus }) =>
        expectedStatus === 'failed' && status === 'unexpected' && resultStatus === 'passed',
    ).length,
    unexpectedFailures: unique.filter(
      ({ expectedStatus, status, resultStatus }) =>
        expectedStatus !== 'failed' && status === 'unexpected' && resultStatus !== 'passed',
    ).length,
    skipped: unique.filter(
      ({ expectedStatus, resultStatus }) =>
        expectedStatus === 'skipped' || resultStatus === 'skipped',
    ).length,
    flaky: unique.filter(({ status }) => status === 'flaky').length,
  };
}
const defectFiles = walk(defectsRoot).filter((file) =>
  /^BUG-\d+.*\.md$/u.test(path.basename(file)),
);
const documentedDefects = defectFiles
  .map((file) => {
    const id = path.basename(file).match(/^BUG-\d+/u)[0];
    const documented = documentedDefectStatus(fs.readFileSync(file, 'utf8'));
    const hasExpectedFailure = expectedFailureDefectIds.has(id);
    return {
      id,
      file: relative(file),
      documentedStatus: documented.status,
      documentedStatusValue: documented.value,
      status: hasExpectedFailure ? 'open' : documented.status,
      associatedWithTestFail: hasExpectedFailure,
      statusConflict: hasExpectedFailure && documented.status === 'resolved',
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id));
const data = {
  schemaVersion: 3,
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
    ordinary: ordinary.length,
    expectedFailure: expectedFailure.length,
    active: ordinary.length + expectedFailure.length,
    fixme: fixme.length,
    missingAutomated,
    automatedOutsidePlans,
    duplicateAutomatedIds,
    duplicatePlannedIds,
    unknownStoryIds,
    mismatchedStoryTestCases,
    items: testCases,
  },
  execution: executionSummary(),
  levels,
  tags,
  defects: {
    documented: documentedDefects.length,
    open: documentedDefects.filter(({ status }) => status === 'open').length,
    resolved: documentedDefects.filter(({ status }) => status === 'resolved').length,
    toClarify: documentedDefects.filter(({ status }) => status === 'clarify').length,
    openIds: documentedDefects.filter(({ status }) => status === 'open').map(({ id }) => id),
    resolvedIds: documentedDefects
      .filter(({ status }) => status === 'resolved')
      .map(({ id }) => id),
    toClarifyIds: documentedDefects
      .filter(({ status }) => status === 'clarify')
      .map(({ id }) => id),
    expectedFailureIds: [...expectedFailureDefectIds].sort(),
    statusConflictIds: documentedDefects
      .filter(({ statusConflict }) => statusConflict)
      .map(({ id }) => id),
    statusRule:
      'Ouvert/Open = anomalie ouverte ; Résolu/Resolved/Corrigé/Fixed/Closed = défaut résolu ; statut absent ou non reconnu = à clarifier. Une fiche liée à test.fail() reste ouverte.',
    items: documentedDefects,
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
  `TC : ${data.testCases.automated} automatisés (${data.testCases.ordinary} ordinaires, ${data.testCases.expectedFailure} avec test.fail(), ${data.testCases.fixme} avec test.fixme())`,
);
console.log(
  `Niveaux : API ${levels.API}, UI_MOCKED ${levels.UI_MOCKED}, E2E_REAL ${levels.E2E_REAL}`,
);
console.log(
  `Défauts : ${data.defects.documented} fiches, ${data.defects.open} ouverts, ${data.defects.resolved} résolus, ${data.defects.toClarify} à clarifier`,
);
if (automatedOutsidePlans.length)
  console.warn(`TC automatisés hors plans : ${automatedOutsidePlans.join(', ')}`);
if (missingAutomated.length)
  console.warn(`TC planifiés non automatisés : ${missingAutomated.join(', ')}`);
if (unknownStoryIds.length) {
  console.error(`US inconnues référencées par les tests : ${unknownStoryIds.join(', ')}`);
  process.exitCode = 1;
}
if (mismatchedStoryTestCases.length) {
  console.error(
    `Rattachements US incohérents : ${mismatchedStoryTestCases.map(({ id, allureStoryId, tracedStoryId }) => `${id} (${allureStoryId} ≠ ${tracedStoryId})`).join(', ')}`,
  );
  process.exitCode = 1;
}
if (duplicateAutomatedIds.length) {
  console.error(`IDs TC automatisés dupliqués : ${duplicateAutomatedIds.join(', ')}`);
  process.exitCode = 1;
}
