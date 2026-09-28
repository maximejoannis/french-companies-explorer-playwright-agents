const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const rel = (file) => path.relative(root, file).replaceAll(path.sep, '/');
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
      })
    : [];
const rate = (part, total) => (total ? Number(((part / total) * 100).toFixed(1)) : 0);
const duplicate = (values) =>
  [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map())]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
const commit = () => {
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};
const github =
  'https://github.com/maximejoannis/french-companies-explorer-playwright-agents/blob/main/';
const specsRoot = path.join(root, 'specs');

const stories = walk(specsRoot)
  .filter((file) => path.basename(file).startsWith('US-') && file.endsWith('.md'))
  .map((file) => {
    const source = fs.readFileSync(file, 'utf8');
    const heading = source.match(/^#\s+(US-[A-Z0-9-]+-\d+)\s+[—-]\s+(.+)$/mu);
    if (!heading) throw new Error(`Titre de User Story illisible : ${rel(file)}`);
    return {
      id: heading[1],
      title: heading[2].trim(),
      source: rel(file),
      criteria: [...source.matchAll(/^#{2,3}\s+(AC-\d+)\s+[—-]\s+(.+)$/gmu)].map((match) => ({
        id: match[1],
        title: match[2].trim(),
      })),
    };
  });

const requirementsFile = path.join(specsRoot, 'v1.1.1', 'REQUIREMENTS.md');
const requirements = fs.readFileSync(requirementsFile, 'utf8');
const requirementMatches = [
  ...requirements.matchAll(/^##\s+(FEAT-[A-Z0-9-]+)\s+[—-]\s+(US-[A-Z0-9-]+)\s*$/gmu),
];
requirementMatches.forEach((match, index) => {
  const section = requirements.slice(
    match.index + match[0].length,
    requirementMatches[index + 1]?.index ?? requirements.length,
  );
  stories.push({
    id: match[2],
    title: section.match(/^En tant qu[^\r\n]+/mu)?.[0]?.replace(/\.$/u, '') ?? match[1],
    source: `${rel(requirementsFile)}#${match[1].toLowerCase()}`,
    criteria: [...section.matchAll(/^-\s+`(AC-\d+)`\s+(.+)$/gmu)].map((criterion) => ({
      id: criterion[1],
      title: criterion[2].trim(),
    })),
  });
});
stories.sort((left, right) => left.id.localeCompare(right.id));
const duplicateStories = duplicate(stories.map(({ id }) => id));
if (duplicateStories.length)
  throw new Error(`User Stories dupliquées : ${duplicateStories.join(', ')}`);

const plannedOccurrences = [];
const plannedTrace = new Map();
for (const file of walk(specsRoot).filter((item) => path.basename(item).startsWith('TEST-PLAN-'))) {
  const source = fs.readFileSync(file, 'utf8');
  const matches = [...source.matchAll(/^###\s+(TC-[A-Z-]+-\d+)\b/gmu)];
  matches.forEach((match, index) => {
    plannedOccurrences.push(match);
    const before = source.slice(0, match.index);
    const storyIds = [...before.matchAll(/US-[A-Z0-9-]+/gu)];
    const storyId = storyIds.at(-1)?.[0] ?? path.basename(file).match(/US-[A-Z0-9-]+/)?.[0] ?? null;
    const section = source.slice(match.index, matches[index + 1]?.index ?? source.length);
    plannedTrace.set(match[1], {
      storyId,
      criteria: [...new Set(section.match(/AC-\d+/gu) ?? [])],
    });
  });
}
const plannedIds = [...new Set(plannedOccurrences.map((match) => match[1]))].sort();

const resultPath = path.join(root, 'test-results', 'results.json');
const resultReport = fs.existsSync(resultPath)
  ? JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  : null;
const executions = [];
const visit = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const tcId = spec.title.match(/^(TC-[A-Z-]+-\d+)/u)?.[1];
      if (!tcId) continue;
      const last = test.results?.at(-1);
      let outcome = 'unknown';
      if (test.status === 'flaky') outcome = 'flaky';
      else if (
        test.expectedStatus === 'skipped' ||
        test.status === 'skipped' ||
        last?.status === 'skipped'
      )
        outcome = 'skipped';
      else if (test.expectedStatus === 'failed' && test.status === 'expected')
        outcome = 'expected-failed';
      else if (
        test.expectedStatus === 'failed' &&
        test.status === 'unexpected' &&
        last?.status === 'passed'
      )
        outcome = 'unexpected-passed';
      else if (test.status === 'unexpected') outcome = 'unexpected-failed';
      else if (test.status === 'expected' && last?.status === 'passed') outcome = 'passed';
      executions.push({
        tcId,
        key: `${test.projectName ?? test.projectId}:${spec.file}:${spec.title}`,
        outcome,
      });
    }
  }
  for (const child of suite.suites ?? []) visit(child);
};
for (const suite of resultReport?.suites ?? []) visit(suite);
const uniqueExecutions = [...new Map(executions.map((item) => [item.key, item])).values()];
const runsByTc = new Map();
uniqueExecutions.forEach((run) => runsByTc.set(run.tcId, [...(runsByTc.get(run.tcId) ?? []), run]));
const countOutcome = (outcome) => uniqueExecutions.filter((run) => run.outcome === outcome).length;

const testCases = [];
for (const file of walk(path.join(root, 'tests')).filter((item) => item.endsWith('.spec.ts'))) {
  const source = fs.readFileSync(file, 'utf8');
  const feature = source.match(/allure\.feature\(['"]([^'"]+)['"]\)/u)?.[1] ?? 'Non renseignée';
  const story = source.match(/allure\.story\(['"]([^'"]+)['"]\)/u)?.[1] ?? 'Non renseignée';
  const storyId = story.match(/^US-[A-Z0-9-]+/u)?.[0] ?? null;
  const filename = rel(file);
  const level = filename.startsWith('tests/api/')
    ? 'API'
    : filename.endsWith('-real.spec.ts')
      ? 'E2E_REAL'
      : 'UI_MOCKED';
  const declarations = [
    ...source.matchAll(/test(?<fixme>\.fixme)?\(\s*['"](?<title>TC-[A-Z-]+-\d+[^'"]*)['"]/gu),
  ];
  declarations.forEach((match, index) => {
    const title = match.groups.title;
    const body = source.slice(match.index, declarations[index + 1]?.index ?? source.length);
    const trace = body.match(/Couvre\s+(US-[A-Z0-9-]+)\s*\/([^\r\n]+)/u);
    const id = title.match(/^TC-[A-Z-]+-\d+/u)[0];
    const planned = plannedTrace.get(id);
    const runs = runsByTc.get(id) ?? [];
    const outcomes = [...new Set(runs.map(({ outcome }) => outcome))];
    testCases.push({
      id,
      title,
      feature,
      storyId,
      tracedStoryId: trace?.[1] ?? planned?.storyId ?? null,
      acceptanceCriteria: [...new Set(trace?.[2].match(/AC-\d+/gu) ?? planned?.criteria ?? [])],
      level,
      fixme: Boolean(match.groups.fixme),
      expectedFailure: /\btest\.fail\s*\(/u.test(body),
      defectIds: [...new Set(body.match(/BUG-\d+/gu) ?? [])],
      categories: ['@positive', '@negative', '@error'].filter((tag) => title.includes(tag)),
      tags: [...title.matchAll(/@[\w-]+/gu)].map((tag) => tag[0]),
      file: filename,
      sourceUrl: `${github}${filename}`,
      outcome: outcomes.length === 0 ? 'not-run' : outcomes.length === 1 ? outcomes[0] : 'mixed',
      evidence: resultReport && runs.length ? '../functional/' : null,
    });
  });
}

const labels = {
  passed: 'Réussi',
  'expected-failed': 'Échec attendu — anomalie connue',
  'unexpected-failed': 'Échec inattendu',
  'unexpected-passed': 'Succès inattendu',
  flaky: 'Instable',
  skipped: 'Ignoré',
  mixed: 'Résultats multiples',
  'not-run': 'Non déterminé — non exécuté',
};
const knownStories = new Map(stories.map((story) => [story.id, story]));
const features = stories.map((story) => {
  const related = testCases.filter((test) => (test.tracedStoryId ?? test.storyId) === story.id);
  const criteria = story.criteria.map((criterion) => {
    const linked = related.filter((test) => test.acceptanceCriteria.includes(criterion.id));
    const covered = linked.length > 0;
    const validated = covered && linked.every(({ outcome }) => outcome === 'passed');
    return {
      ...criterion,
      applicable: true,
      covered,
      validated,
      validationStatus: !covered
        ? 'not-covered'
        : validated
          ? 'validated'
          : linked.some(({ outcome }) => outcome === 'expected-failed')
            ? 'known-defect'
            : 'not-validated',
      categories: [...new Set(linked.flatMap(({ categories }) => categories))],
      testCases: linked.map((test) => ({
        id: test.id,
        title: test.title
          .replace(/^TC-[A-Z-]+-\d+\s*/u, '')
          .replace(/(?:^|\s)@[\w-]+/gu, '')
          .trim(),
        categories: test.categories,
        level: test.level,
        outcome: test.outcome,
        outcomeLabel: labels[test.outcome] ?? 'Non déterminé',
        expectedFailure: test.expectedFailure,
        defectIds: test.defectIds,
        evidence: test.evidence,
        sourceUrl: test.sourceUrl,
      })),
    };
  });
  const validatedCriteria = criteria.filter(({ validated }) => validated).length;
  return {
    name: related[0]?.feature ?? story.id,
    story: `${story.id} — ${story.title}`,
    storyId: story.id,
    source: story.source,
    sourceUrl: `${github}${story.source}`,
    automated: related.length > 0,
    testCases: related.length,
    ordinary: related.filter(({ fixme, expectedFailure }) => !fixme && !expectedFailure).length,
    expectedFailure: related.filter(({ expectedFailure }) => expectedFailure).length,
    fixme: related.filter(({ fixme }) => fixme).length,
    criteria,
    applicableCriteria: criteria.length,
    coveredCriteria: criteria.filter(({ covered }) => covered).length,
    validatedCriteria,
    complete: criteria.length > 0 && validatedCriteria === criteria.length,
    levels: Object.fromEntries(
      ['API', 'UI_MOCKED', 'E2E_REAL'].map((level) => [
        level,
        related.filter((test) => test.level === level).length,
      ]),
    ),
  };
});

const featureOrder = ['US-SEARCH-01', 'US-FILTERS-01', 'US-FILTERS-02'];
features.sort((left, right) => {
  const leftIndex = featureOrder.indexOf(left.storyId);
  const rightIndex = featureOrder.indexOf(right.storyId);
  if (leftIndex >= 0 || rightIndex >= 0)
    return (
      (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex)
    );
  return left.story.localeCompare(right.story, 'fr');
});

const automatedIds = testCases.map(({ id }) => id);
const automatedSet = new Set(automatedIds);
const plannedSet = new Set(plannedIds);
const unknownStoryIds = [
  ...new Set(testCases.map(({ storyId }) => storyId).filter((id) => !knownStories.has(id))),
].sort();
const mismatchedStoryTestCases = testCases
  .filter(({ storyId, tracedStoryId }) => tracedStoryId && tracedStoryId !== storyId)
  .map(({ id, storyId, tracedStoryId }) => ({ id, allureStoryId: storyId, tracedStoryId }));
const untracedTestCases = testCases
  .filter(({ acceptanceCriteria }) => acceptanceCriteria.length === 0)
  .map(({ id }) => id);
const unknownCriteria = testCases.flatMap((test) => {
  const story = knownStories.get(test.tracedStoryId ?? test.storyId);
  const ids = new Set(story?.criteria.map(({ id }) => id) ?? []);
  return test.acceptanceCriteria
    .filter((criterion) => !ids.has(criterion))
    .map((criterion) => ({
      testCase: test.id,
      story: test.tracedStoryId ?? test.storyId,
      criterion,
    }));
});

const defectStatus = (source) => {
  const value =
    source
      .match(/^[ \t]*[-*]?[ \t]*\*{0,2}(?:Statut|Status)\*{0,2}\s*:\s*\*{0,2}([^*\r\n]+)/imu)?.[1]
      ?.trim() ?? '';
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase();
  if (/^(ouvert|ouverte|open)\b/u.test(normalized)) return 'open';
  if (/^(resolu|resolue|resolved|corrige|corrigee|fixed|closed|ferme|fermee)\b/u.test(normalized))
    return 'resolved';
  return 'clarify';
};
const expectedDefects = new Set(
  testCases.filter(({ expectedFailure }) => expectedFailure).flatMap(({ defectIds }) => defectIds),
);
const defects = walk(path.join(root, 'defects'))
  .filter((file) => /^BUG-\d+.*\.md$/u.test(path.basename(file)))
  .map((file) => {
    const id = path.basename(file).match(/^BUG-\d+/u)[0];
    const documentedStatus = defectStatus(fs.readFileSync(file, 'utf8'));
    return {
      id,
      file: rel(file),
      documentedStatus,
      status: expectedDefects.has(id) ? 'open' : documentedStatus,
      associatedWithTestFail: expectedDefects.has(id),
      statusConflict: expectedDefects.has(id) && documentedStatus === 'resolved',
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const allCriteria = features.flatMap(({ criteria }) => criteria);
const levels = Object.fromEntries(
  ['API', 'UI_MOCKED', 'E2E_REAL'].map((level) => [
    level,
    testCases.filter((test) => test.level === level).length,
  ]),
);
const tags = Object.fromEntries(
  [...new Set(testCases.flatMap(({ tags }) => tags))]
    .sort()
    .map((tag) => [tag, testCases.filter((test) => test.tags.includes(tag)).length]),
);
const data = {
  schemaVersion: 4,
  generatedAt: new Date().toISOString(),
  execution: {
    available: Boolean(resultReport),
    generatedAt: resultReport?.stats?.startTime ?? null,
    commit: commit(),
    total: uniqueExecutions.length,
    passed: countOutcome('passed'),
    ordinaryPassed: countOutcome('passed'),
    expectedFailures: countOutcome('expected-failed'),
    unexpectedSuccesses: countOutcome('unexpected-passed'),
    unexpectedFailures: countOutcome('unexpected-failed'),
    skipped: countOutcome('skipped'),
    flaky: countOutcome('flaky'),
    unknown: countOutcome('unknown'),
  },
  validation: {
    applicableCriteria: allCriteria.length,
    coveredCriteria: allCriteria.filter(({ covered }) => covered).length,
    validatedCriteria: allCriteria.filter(({ validated }) => validated).length,
    coverageRate: rate(allCriteria.filter(({ covered }) => covered).length, allCriteria.length),
    validationRate: rate(
      allCriteria.filter(({ validated }) => validated).length,
      allCriteria.length,
    ),
    completeFeatures: features.filter(({ complete }) => complete).length,
    totalFeatures: features.length,
    statusRule:
      'Un critère est couvert si au moins un TC automatisé lui est relié. Il est validé uniquement si tous ses TC reliés sont réussis dans la dernière exécution. test.fail(), succès inattendu, échec inattendu, instabilité, test ignoré ou résultat absent empêchent la validation.',
  },
  features: {
    defined: features.length,
    automated: features.filter(({ automated }) => automated).length,
    rate: rate(features.filter(({ automated }) => automated).length, features.length),
    items: features,
  },
  testCases: {
    planned: plannedIds.length,
    automated: testCases.length,
    ordinary: testCases.filter(({ fixme, expectedFailure }) => !fixme && !expectedFailure).length,
    expectedFailure: testCases.filter(({ expectedFailure }) => expectedFailure).length,
    active: testCases.filter(({ fixme }) => !fixme).length,
    fixme: testCases.filter(({ fixme }) => fixme).length,
    missingAutomated: plannedIds.filter((id) => !automatedSet.has(id)),
    automatedOutsidePlans: [...new Set(automatedIds.filter((id) => !plannedSet.has(id)))].sort(),
    duplicateAutomatedIds: duplicate(automatedIds),
    duplicatePlannedIds: duplicate(plannedOccurrences.map((match) => match[1])),
    unknownStoryIds,
    mismatchedStoryTestCases,
    untracedTestCases,
    unknownCriteria,
    items: testCases,
  },
  levels,
  tags,
  defects: {
    documented: defects.length,
    open: defects.filter(({ status }) => status === 'open').length,
    resolved: defects.filter(({ status }) => status === 'resolved').length,
    toClarify: defects.filter(({ status }) => status === 'clarify').length,
    openIds: defects.filter(({ status }) => status === 'open').map(({ id }) => id),
    expectedFailureIds: [...expectedDefects].sort(),
    statusConflictIds: defects.filter(({ statusConflict }) => statusConflict).map(({ id }) => id),
    statusRule:
      'Une fiche liée à test.fail() reste ouverte et son TC ne valide pas le comportement produit.',
    items: defects,
  },
};

const output = path.join(root, 'coverage-report');
fs.mkdirSync(output, { recursive: true });
for (const asset of ['index.html', 'styles.css', 'app.js'])
  fs.copyFileSync(path.join(root, 'reporting', 'coverage', asset), path.join(output, asset));
fs.writeFileSync(path.join(output, 'data.json'), `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(
  path.join(output, 'coverage-data.js'),
  `window.COVERAGE_DATA = ${JSON.stringify(data)};\n`,
);
console.log(
  `Validation fonctionnelle : ${data.validation.validatedCriteria}/${data.validation.applicableCriteria} critères validés`,
);
console.log(
  `Couverture : ${data.validation.coveredCriteria}/${data.validation.applicableCriteria} critères avec TC`,
);

const errors = [
  ...unknownStoryIds.map((id) => `US inconnue ${id}`),
  ...mismatchedStoryTestCases.map(({ id }) => `rattachement US incohérent ${id}`),
  ...unknownCriteria.map(
    ({ testCase, story, criterion }) => `${testCase}: ${story}/${criterion} inconnu`,
  ),
];
if (errors.length) {
  console.error(`Erreurs de traçabilité : ${errors.join(', ')}`);
  process.exitCode = 1;
}
if (untracedTestCases.length)
  console.warn(`TC sans AC déterminable : ${untracedTestCases.join(', ')}`);
