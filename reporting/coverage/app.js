(() => {
  const data = window.COVERAGE_DATA;
  if (!data) return;
  const text = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };
  text('featuresMetric', `${data.features.automated} / ${data.features.defined}`);
  text('testsMetric', data.testCases.automated);
  text('activeMetric', data.testCases.ordinary);
  text('testFailMetric', data.testCases.expectedFailure);
  text('fixmeMetric', data.testCases.fixme);
  text(
    'coverageSummary',
    `${data.features.automated}/${data.features.defined} US possèdent au moins un TC automatisé. Cet indicateur ne mesure pas la couverture de chaque AC.`,
  );
  text(
    'generatedAt',
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(data.generatedAt),
    ),
  );
  document.getElementById('levels').innerHTML = Object.entries(data.levels)
    .map(
      ([level, count]) =>
        `<article class="level"><strong>${count}</strong><span>${level}</span></article>`,
    )
    .join('');
  document.getElementById('featuresTable').innerHTML = data.features.items
    .map(
      (feature) =>
        `<tr><td><strong>${feature.name}</strong></td><td><a href="https://github.com/maximejoannis/french-companies-explorer-playwright-agents/blob/main/${feature.source}">${feature.story}</a></td><td>${feature.testCases}</td><td>${feature.ordinary}</td><td>${feature.expectedFailure}</td><td>${feature.fixme}</td><td>API ${feature.levels.API} · UI ${feature.levels.UI_MOCKED} · E2E ${feature.levels.E2E_REAL}</td></tr>`,
    )
    .join('');
  const entries = [
    ['TC définis dans les plans', data.testCases.planned],
    ['TC automatisés', data.testCases.automated],
    ['TC planifiés manquants', data.testCases.missingAutomated.length],
    ['IDs automatisés dupliqués', data.testCases.duplicateAutomatedIds.length],
    ['US inconnues référencées', data.testCases.unknownStoryIds.length],
    ['Rattachements US incohérents', data.testCases.mismatchedStoryTestCases.length],
  ];
  document.getElementById('traceability').innerHTML = entries
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
  const warnings = [];
  if (data.testCases.automatedOutsidePlans.length)
    warnings.push(`Automatisés hors plans : ${data.testCases.automatedOutsidePlans.join(', ')}`);
  if (data.testCases.missingAutomated.length)
    warnings.push(`Planifiés non automatisés : ${data.testCases.missingAutomated.join(', ')}`);
  if (data.testCases.unknownStoryIds.length)
    warnings.push(`US inconnues référencées : ${data.testCases.unknownStoryIds.join(', ')}`);
  if (data.testCases.mismatchedStoryTestCases.length)
    warnings.push(
      `Rattachements US incohérents : ${data.testCases.mismatchedStoryTestCases.map(({ id }) => id).join(', ')}`,
    );
  document.getElementById('traceabilityWarnings').textContent =
    warnings.join(' · ') || 'Aucun écart de traçabilité détecté.';
  const executionEntries = data.execution.available
    ? [
        ['Exécutions uniques', data.execution.total],
        ['Tests ordinaires réussis', data.execution.ordinaryPassed],
        ['Échecs attendus observés', data.execution.expectedFailures],
        ['Succès inattendus', data.execution.unexpectedSuccesses],
        ['Échecs inattendus', data.execution.unexpectedFailures],
        ['Tests ignorés', data.execution.skipped],
        ['Tests instables', data.execution.flaky],
      ]
    : [];
  document.getElementById('execution').innerHTML = executionEntries
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
  text(
    'executionNotice',
    data.execution.available
      ? 'Ces nombres proviennent de test-results/results.json. Un test.fail() réussi est un succès inattendu, pas un échec attendu.'
      : 'Aucun résultat d’exécution disponible : seuls les statuts statiques du code sont affichés.',
  );
  document.getElementById('tags').innerHTML = Object.entries(data.tags)
    .map(([tag, count]) => `<span class="chip">${tag} · ${count}</span>`)
    .join('');
  document.getElementById('defects').innerHTML = [
    ['Fiches de défaut historiques', data.defects.documented],
    ['Anomalies encore ouvertes', data.defects.open],
    ['Défauts résolus', data.defects.resolved],
    ['Statuts à clarifier', data.defects.toClarify],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
  text('defectStatusRule', data.defects.statusRule);
})();
