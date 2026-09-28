(() => {
  const data = window.COVERAGE_DATA;
  if (!data) return;
  const text = (id, value, fallback = 'Non déterminé') => {
    const node = document.getElementById(id);
    if (node) node.textContent = value === null || value === undefined ? fallback : String(value);
  };
  const escape = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(value),
        )
      : null;

  text('applicableMetric', data.validation.applicableCriteria);
  text('coveredMetric', data.validation.coveredCriteria);
  text('validatedMetric', data.validation.validatedCriteria);
  text('passedMetric', data.execution.available ? data.execution.passed : null);
  text('expectedFailedMetric', data.execution.available ? data.execution.expectedFailures : null);
  text(
    'unexpectedFailedMetric',
    data.execution.available ? data.execution.unexpectedFailures : null,
  );
  text(
    'unexpectedPassedMetric',
    data.execution.available ? data.execution.unexpectedSuccesses : null,
  );
  text('flakyMetric', data.execution.available ? data.execution.flaky : null);
  text('skippedMetric', data.execution.available ? data.execution.skipped : null);
  text('commit', data.execution.commit ? data.execution.commit.slice(0, 7) : null);
  text('executedAt', date(data.execution.generatedAt));
  text('generatedAt', date(data.generatedAt));
  text('validationRule', data.validation.statusRule);
  text(
    'featureSummary',
    `${data.validation.completeFeatures}/${data.validation.totalFeatures} fonctionnalités ont tous leurs critères applicables effectivement validés.`,
  );
  text(
    'defectNotice',
    `${data.defects.open} anomalie(s) ouverte(s), dont ${data.defects.expectedFailureIds.length} reliée(s) à test.fail(). Aucune conclusion de release entièrement validée n’est produite tant qu’elles compromettent un critère.`,
  );

  const status = {
    validated: ['Validé', 'success'],
    'known-defect': ['Non validé · anomalie connue', 'danger'],
    'not-validated': ['Non validé', 'warning'],
    'not-covered': ['Non couvert', 'unknown'],
  };
  const testCase = (item) => {
    const tags = item.categories.map((tag) => `<span class="tag">${escape(tag)}</span>`).join('');
    const defects = item.defectIds
      .map((id) => `<span class="defect">${escape(id)}</span>`)
      .join('');
    const evidence = item.evidence
      ? `<a href="${escape(item.evidence)}" aria-label="Preuve Playwright pour ${escape(item.id)}">Preuve Playwright</a>`
      : '<span class="muted">Preuve non disponible</span>';
    return `<li class="test-case"><div><a href="${escape(item.sourceUrl)}"><strong>${escape(item.id)}</strong></a>${tags}${defects}<p>${escape(item.title)}</p></div><div class="test-result"><span class="outcome outcome--${escape(item.outcome)}">${escape(item.outcomeLabel)}</span><small>${escape(item.level)}</small>${evidence}</div></li>`;
  };
  document.getElementById('features').innerHTML = data.features.items
    .map((feature) => {
      const badge = feature.complete
        ? '<span class="badge badge--success">Validation complète</span>'
        : `<span class="badge badge--warning">${feature.validatedCriteria}/${feature.applicableCriteria} critères validés</span>`;
      const criteria = feature.criteria
        .map((criterion) => {
          const [label, kind] = status[criterion.validationStatus];
          const categories = criterion.categories.length
            ? criterion.categories.map((tag) => `<span class="tag">${escape(tag)}</span>`).join('')
            : '<span class="muted">Aucune catégorie applicable déterminée</span>';
          const tests = criterion.testCases.length
            ? `<ul class="test-cases">${criterion.testCases.map(testCase).join('')}</ul>`
            : '<p class="empty">Aucun Test Case automatisé rattaché.</p>';
          return `<article class="criterion"><header><div><span class="criterion-id">${escape(criterion.id)}</span><h3>${escape(criterion.title)}</h3></div><span class="badge badge--${kind}">${label}</span></header><div class="criterion-meta"><span>${criterion.covered ? 'Couvert par un test' : 'Sans test couvrant'}</span><span>${criterion.validated ? 'Comportement validé' : 'Comportement non validé'}</span><span class="categories">${categories}</span></div>${tests}</article>`;
        })
        .join('');
      return `<section class="feature panel"><header class="feature-header"><div><p class="eyebrow">${escape(feature.name)}</p><h2><a href="${escape(feature.sourceUrl)}">${escape(feature.story)}</a></h2><p>${feature.coveredCriteria}/${feature.applicableCriteria} critères couverts · ${feature.testCases} TC associés</p></div>${badge}</header><div class="criteria">${criteria || '<p class="empty">Critères non déterminés dans les spécifications.</p>'}</div></section>`;
    })
    .join('');

  const traceability = [
    ['TC planifiés', data.testCases.planned],
    ['TC automatisés', data.testCases.automated],
    ['TC planifiés manquants', data.testCases.missingAutomated.length],
    ['TC sans AC déterminable', data.testCases.untracedTestCases.length],
    ['Références AC inconnues', data.testCases.unknownCriteria.length],
    ['Rattachements US incohérents', data.testCases.mismatchedStoryTestCases.length],
  ];
  document.getElementById('traceability').innerHTML = traceability
    .map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`)
    .join('');
  const warnings = [];
  if (data.testCases.untracedTestCases.length)
    warnings.push(`TC sans AC : ${data.testCases.untracedTestCases.join(', ')}`);
  if (data.testCases.unknownCriteria.length)
    warnings.push(
      `AC inconnus : ${data.testCases.unknownCriteria.map(({ testCase, criterion }) => `${testCase}/${criterion}`).join(', ')}`,
    );
  text(
    'traceabilityWarnings',
    warnings.join(' · ') || 'Aucune référence US → AC → TC invalide détectée.',
  );
})();
