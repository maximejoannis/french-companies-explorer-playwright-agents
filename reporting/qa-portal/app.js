(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('qa_portal_theme');
  if (storedTheme === 'light' || storedTheme === 'dark') root.dataset.theme = storedTheme;
  toggle?.addEventListener('click', () => {
    const dark =
      root.dataset.theme === 'dark' ||
      (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
    localStorage.setItem('qa_portal_theme', root.dataset.theme);
  });

  const setText = (id, value, fallback = '—') => {
    const node = document.getElementById(id);
    if (node) node.textContent = value === undefined || value === null ? fallback : String(value);
  };
  const statusLabel = (status) =>
    status === 'passed' ? 'Disponible' : status === 'failed' ? 'Échec' : 'Indisponible';
  const updateReport = (name, report) => {
    const card = document.querySelector(`[data-report="${name}"]`);
    if (!card) return;
    const badge = card.querySelector('[data-report-status]');
    const status = report?.available ? (report.status ?? 'passed') : 'unknown';
    badge.textContent = statusLabel(status);
    badge.className = `status status--${status}`;
    if (!report?.available)
      card.querySelector('[data-report-link]')?.setAttribute('aria-disabled', 'true');
  };

  fetch('./build-info.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('build-info indisponible');
      return response.json();
    })
    .then((data) => {
      const global = document.getElementById('globalStatus');
      global.textContent = data.status === 'passed' ? 'PASS' : 'ÉCHEC';
      global.className = `status status--${data.status === 'passed' ? 'passed' : 'failed'}`;
      setText('branchValue', data.branch);
      setText('commitValue', data.commit);
      setText(
        'generatedAtValue',
        data.generatedAt
          ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
              new Date(data.generatedAt),
            )
          : null,
      );
      const workflow = document.getElementById('workflowLink');
      if (data.workflowUrl) workflow.href = data.workflowUrl;
      Object.entries(data.reports ?? {}).forEach(([name, report]) => updateReport(name, report));
      const coverage = data.coverage ?? {};
      setText('featuresValue', coverage.features?.defined);
      setText('testsValue', coverage.testCases?.automated);
      setText('levelsValue', coverage.levels ? Object.keys(coverage.levels).length : null);
      setText('fixmeValue', coverage.testCases?.fixme);
      setText('apiCount', coverage.levels?.API === undefined ? null : `${coverage.levels.API} TC`);
      setText(
        'mockedCount',
        coverage.levels?.UI_MOCKED === undefined ? null : `${coverage.levels.UI_MOCKED} TC`,
      );
      setText(
        'e2eCount',
        coverage.levels?.E2E_REAL === undefined ? null : `${coverage.levels.E2E_REAL} TC`,
      );
      setText('knownFixme', coverage.testCases?.fixme);
      setText('unexpectedFailures', data.runtime?.failed);
      setText(
        'runtimeSummary',
        data.runtime
          ? `${data.runtime.passed} réussis · ${data.runtime.failed} échec · ${data.runtime.skipped} ignorés/fixme.`
          : null,
        'Résultats runtime indisponibles.',
      );
      setText(
        'coverageSummary',
        coverage.features
          ? `${coverage.features.automated}/${coverage.features.defined} Features couvertes · ${coverage.testCases.automated} TC automatisés.`
          : null,
        'Données de couverture indisponibles.',
      );
      const quality = data.quality;
      setText(
        'qualitySummary',
        quality
          ? `Prettier ${quality.prettier.status} · ESLint ${quality.eslint.status} · TypeScript ${quality.typescript.status}.`
          : null,
        'Données qualité indisponibles.',
      );
    })
    .catch(() => {
      const global = document.getElementById('globalStatus');
      global.textContent = 'Indisponible';
      global.className = 'status status--unknown';
      document
        .querySelectorAll('[data-report]')
        .forEach((card) => updateReport(card.dataset.report, null));
    });
})();
