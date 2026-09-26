(() => {
  const data = window.COVERAGE_DATA;
  if (!data) return;
  const text = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };
  text('featuresMetric', `${data.features.automated} / ${data.features.defined}`);
  text('testsMetric', data.testCases.automated);
  text('activeMetric', data.testCases.active);
  text('fixmeMetric', data.testCases.fixme);
  text(
    'coverageSummary',
    `${data.features.rate} % du périmètre fonctionnel défini possède au moins un TC automatisé.`,
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
        `<tr><td><strong>${feature.name}</strong></td><td>${feature.story}</td><td>${feature.testCases}</td><td>${feature.active}</td><td>${feature.fixme}</td><td>API ${feature.levels.API} · UI ${feature.levels.UI_MOCKED} · E2E ${feature.levels.E2E_REAL}</td></tr>`,
    )
    .join('');
  const entries = [
    ['TC définis dans les plans', data.testCases.planned],
    ['TC automatisés', data.testCases.automated],
    ['TC planifiés manquants', data.testCases.missingAutomated.length],
    ['IDs automatisés dupliqués', data.testCases.duplicateAutomatedIds.length],
  ];
  document.getElementById('traceability').innerHTML = entries
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
  const warnings = [];
  if (data.testCases.automatedOutsidePlans.length)
    warnings.push(`Automatisés hors plans : ${data.testCases.automatedOutsidePlans.join(', ')}`);
  if (data.testCases.missingAutomated.length)
    warnings.push(`Planifiés non automatisés : ${data.testCases.missingAutomated.join(', ')}`);
  document.getElementById('traceabilityWarnings').textContent =
    warnings.join(' · ') || 'Aucun écart de traçabilité détecté.';
  document.getElementById('tags').innerHTML = Object.entries(data.tags)
    .map(([tag, count]) => `<span class="chip">${tag} · ${count}</span>`)
    .join('');
  document.getElementById('defects').innerHTML = [
    ['Défauts documentés', data.defects.documented],
    ['Défauts associés à fixme', data.defects.associatedWithFixme],
    ['Dettes sans fixme', data.defects.withoutFixme],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
})();
