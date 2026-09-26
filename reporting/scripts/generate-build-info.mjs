import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const coverage = readJson('coverage-report/data.json');
const quality = readJson('quality-report/summary.json');
const playwright = readJson('test-results/results.json');
const outputFile = process.argv[2] ?? 'build-info.json';

const outcomes = {
  quality: process.env.QUALITY_OUTCOME,
  coverage: process.env.COVERAGE_OUTCOME,
  functional: process.env.FUNCTIONAL_OUTCOME,
  allure: process.env.ALLURE_OUTCOME,
};

const runtime = {
  total: 0,
  passed: 0,
  expectedFailed: 0,
  unexpectedFailed: 0,
  unexpectedPassed: 0,
  skipped: 0,
  flaky: 0,
};

const visit = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      runtime.total += 1;
      const resultStatus = test.results?.at(-1)?.status;
      if (test.status === 'skipped' || resultStatus === 'skipped') runtime.skipped += 1;
      else if (test.status === 'flaky') runtime.flaky += 1;
      else if (test.status === 'unexpected' && resultStatus === 'passed')
        runtime.unexpectedPassed += 1;
      else if (test.status === 'unexpected') runtime.unexpectedFailed += 1;
      else if (test.status === 'expected' && resultStatus !== 'passed') runtime.expectedFailed += 1;
      else runtime.passed += 1;
    }
  }
  for (const child of suite.suites ?? []) visit(child);
};
for (const suite of playwright.suites ?? []) visit(suite);

const controlsPassed = Object.values(outcomes).every((outcome) => outcome === 'success');
const noUnexpectedResult = runtime.unexpectedFailed === 0 && runtime.unexpectedPassed === 0;
const status =
  controlsPassed && noUnexpectedResult
    ? runtime.expectedFailed > 0
      ? 'known-issues'
      : 'passed'
    : 'failed';

const report = (name, directory) => ({
  available: fs.existsSync(`${directory}/index.html`),
  status: outcomes[name] === 'success' ? 'passed' : 'failed',
});

const buildInfo = {
  schemaVersion: 2,
  status,
  statusLabel:
    status === 'known-issues'
      ? 'CI conforme avec anomalies connues'
      : status === 'passed'
        ? 'CI conforme'
        : 'CI non conforme',
  generatedAt: new Date().toISOString(),
  branch: process.env.BRANCH_NAME,
  commit: process.env.COMMIT_SHA?.slice(0, 7),
  workflowUrl: process.env.WORKFLOW_URL,
  reports: {
    functional: report('functional', 'playwright-report'),
    allure: report('allure', 'allure-report'),
    quality: report('quality', 'quality-report'),
    coverage: report('coverage', 'coverage-report'),
  },
  coverage: {
    features: coverage.features,
    testCases: {
      planned: coverage.testCases.planned,
      automated: coverage.testCases.automated,
      active: coverage.testCases.active,
      fixme: coverage.testCases.fixme,
    },
    levels: coverage.levels,
    tags: coverage.tags,
    defects: coverage.defects,
  },
  runtime,
  quality: {
    overallStatus: quality.overallStatus,
    eslint: quality.eslint,
    prettier: quality.prettier,
    typescript: quality.typescript,
  },
};

fs.writeFileSync(outputFile, `${JSON.stringify(buildInfo, null, 2)}\n`);
console.log(buildInfo.statusLabel);
