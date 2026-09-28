(() => {
  const data = window.COVERAGE_DATA;
  if (!data) return;

  const byId = (id) => document.getElementById(id);
  const escape = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  const normalize = (value) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/gu, '')
      .toLowerCase();
  const asArray = (value) => (Array.isArray(value) ? value : []);
  const text = (id, value, fallback = 'Non déterminé') => {
    const node = byId(id);
    if (node) node.textContent = value === null || value === undefined ? fallback : String(value);
  };
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(value),
        )
      : null;

  const statusInfo = {
    validated: { label: 'Validé', kind: 'success' },
    'known-defect': { label: 'Partiel · anomalie connue', kind: 'danger' },
    'not-validated': { label: 'Non validé', kind: 'warning' },
    'not-covered': { label: 'Non couvert', kind: 'unknown' },
  };
  const outcomeReason = {
    'expected-failed': 'Un test.fail() confirme une anomalie connue : le produit n’est pas validé.',
    'unexpected-failed': 'Au moins un test a échoué de façon inattendue.',
    'unexpected-passed': 'Un test marqué test.fail() a réussi : l’anomalie doit être réévaluée.',
    flaky: 'Au moins un test est instable ; le résultat n’est pas suffisamment fiable.',
    skipped: 'Au moins un test a été ignoré lors de cette exécution.',
    'not-run': 'Au moins un test n’a pas de résultat dans l’exécution publiée.',
    mixed: 'Les exécutions disponibles ont des résultats différents.',
  };

  text('applicableMetric', data.validation?.applicableCriteria);
  text('coveredMetric', data.validation?.coveredCriteria);
  text('validatedMetric', data.validation?.validatedCriteria);
  text('passedMetric', data.execution?.available ? data.execution.passed : null);
  text('expectedFailedMetric', data.execution?.available ? data.execution.expectedFailures : null);
  text(
    'unexpectedFailedMetric',
    data.execution?.available ? data.execution.unexpectedFailures : null,
  );
  text(
    'unexpectedPassedMetric',
    data.execution?.available ? data.execution.unexpectedSuccesses : null,
  );
  text('flakyMetric', data.execution?.available ? data.execution.flaky : null);
  text('skippedMetric', data.execution?.available ? data.execution.skipped : null);
  text('commit', data.execution?.commit ? data.execution.commit.slice(0, 7) : null);
  text('executedAt', date(data.execution?.generatedAt));
  text('generatedAt', date(data.generatedAt));
  text('validationRule', data.validation?.statusRule);
  text(
    'featureSummary',
    `${data.validation?.completeFeatures ?? 0}/${data.validation?.totalFeatures ?? 0} fonctionnalités ont tous leurs critères applicables effectivement validés.`,
  );
  text(
    'defectNotice',
    `${data.defects?.open ?? 0} anomalie(s) ouverte(s), dont ${asArray(data.defects?.expectedFailureIds).length} reliée(s) à test.fail(). Aucune conclusion de release entièrement validée n’est produite tant qu’elles compromettent un critère.`,
  );

  const features = asArray(data.features?.items).map((feature) => ({
    ...feature,
    criteria: asArray(feature.criteria).map((criterion) => ({
      ...criterion,
      categories: asArray(criterion.categories),
      testCases: asArray(criterion.testCases).map((testCase) => ({
        ...testCase,
        categories: asArray(testCase.categories),
        defectIds: asArray(testCase.defectIds),
      })),
    })),
  }));
  const expanded = new Set();
  const controls = {
    form: byId('filters'),
    query: byId('searchFilter'),
    feature: byId('featureFilter'),
    category: byId('categoryFilter'),
    status: byId('statusFilter'),
    defect: byId('defectFilter'),
  };

  const option = (value, label) => `<option value="${escape(value)}">${escape(label)}</option>`;
  controls.feature.insertAdjacentHTML(
    'beforeend',
    features
      .map((feature) => option(feature.storyId, `${feature.storyId} — ${feature.name}`))
      .join(''),
  );
  const categories = [
    ...new Set(
      features.flatMap((feature) => feature.criteria.flatMap((criterion) => criterion.categories)),
    ),
  ];
  controls.category.insertAdjacentHTML(
    'beforeend',
    categories.map((category) => option(category, category)).join(''),
  );
  const statuses = [
    ...new Set(
      features.flatMap((feature) =>
        feature.criteria.map((criterion) => criterion.validationStatus),
      ),
    ),
  ];
  controls.status.insertAdjacentHTML(
    'beforeend',
    statuses.map((status) => option(status, statusInfo[status]?.label ?? 'Non déterminé')).join(''),
  );

  const openDefects = new Set(asArray(data.defects?.openIds));
  const hasDefect = (criterion) =>
    criterion.validationStatus === 'known-defect' ||
    criterion.testCases.some(
      (testCase) =>
        testCase.expectedFailure ||
        testCase.defectIds.some((defectId) => openDefects.has(defectId)),
    );
  const searchable = (feature, criterion) =>
    normalize(
      [
        feature.storyId,
        feature.name,
        feature.story,
        criterion.id,
        criterion.title,
        ...criterion.categories,
        ...criterion.testCases.flatMap((testCase) => [
          testCase.id,
          testCase.title,
          ...testCase.categories,
          ...testCase.defectIds,
        ]),
      ].join(' '),
    );
  const filters = () => ({
    query: normalize(controls.query.value.trim()),
    feature: controls.feature.value,
    category: controls.category.value,
    status: controls.status.value,
    defect: controls.defect.value,
  });
  const matches = (feature, criterion, active) =>
    (!active.feature || feature.storyId === active.feature) &&
    (!active.category || criterion.categories.includes(active.category)) &&
    (!active.status || criterion.validationStatus === active.status) &&
    (!active.defect || (active.defect === 'with' ? hasDefect(criterion) : !hasDefect(criterion))) &&
    (!active.query || searchable(feature, criterion).includes(active.query));

  const reason = (criterion) => {
    if (criterion.validated)
      return 'Tous les Test Cases associés ont réussi lors de la dernière exécution.';
    if (!criterion.covered)
      return 'Aucun Test Case automatisé n’est relié à ce critère : sa validation est non déterminée.';
    const reasons = [
      ...new Set(
        criterion.testCases.map((testCase) => outcomeReason[testCase.outcome]).filter(Boolean),
      ),
    ];
    return (
      reasons.join(' ') ||
      'Le critère est couvert, mais les résultats disponibles ne permettent pas de le valider.'
    );
  };
  const testCaseTemplate = (item) => {
    const tags = item.categories.map((tag) => `<span class="tag">${escape(tag)}</span>`).join('');
    const defects = item.defectIds
      .map((id) => `<span class="defect">${escape(id)}</span>`)
      .join('');
    const proofLinks = item.evidence
      ? `<span class="evidence-links"><a href="${escape(item.evidence)}">Playwright</a><a href="../allure/">Allure</a></span>`
      : '<span class="muted">Preuve d’exécution non disponible</span>';
    return `<li class="test-case"><div><div class="test-identifiers"><a href="${escape(item.sourceUrl)}"><strong>${escape(item.id)}</strong><span class="sr-only"> — ouvrir le test source</span></a>${tags}${defects}</div><p>${escape(item.title || 'Intitulé non déterminé')}</p></div><div class="test-result"><span class="outcome outcome--${escape(item.outcome || 'not-run')}">${escape(item.outcomeLabel || 'Non déterminé')}</span><small>${escape(item.level || 'Niveau non déterminé')}</small>${proofLinks}</div></li>`;
  };
  const criterionTemplate = (criterion) => {
    const info = statusInfo[criterion.validationStatus] ?? {
      label: 'Non déterminé',
      kind: 'unknown',
    };
    const categoriesMarkup = criterion.categories.length
      ? criterion.categories.map((tag) => `<span class="tag">${escape(tag)}</span>`).join('')
      : '<span class="muted">Catégorie non déterminée</span>';
    const tests = criterion.testCases.length
      ? `<ul class="test-cases">${criterion.testCases.map(testCaseTemplate).join('')}</ul>`
      : '<p class="empty">Aucun Test Case automatisé rattaché.</p>';
    return `<article class="criterion"><header><div><span class="criterion-id">${escape(criterion.id || 'AC non déterminé')}</span><h3>${escape(criterion.title || 'Critère sans intitulé')}</h3></div><span class="badge badge--${info.kind}">${escape(info.label)}</span></header><div class="criterion-meta"><span>${criterion.covered ? 'Couvert par des tests' : 'Sans test couvrant'}</span><span>${criterion.validated ? 'Comportement validé' : 'Comportement non validé'}</span><span class="categories">${categoriesMarkup}</span></div><p class="validation-reason"><strong>Pourquoi ?</strong> ${escape(reason(criterion))}</p>${tests}</article>`;
  };

  function render() {
    const active = filters();
    const visible = features
      .map((feature) => ({
        feature,
        criteria: feature.criteria.filter((criterion) => matches(feature, criterion, active)),
      }))
      .filter(({ criteria }) => criteria.length > 0);
    const criteriaCount = visible.reduce((total, item) => total + item.criteria.length, 0);
    text(
      'visibleCount',
      `${visible.length} fonctionnalité${visible.length > 1 ? 's' : ''} · ${criteriaCount} critère${criteriaCount > 1 ? 's' : ''} visible${criteriaCount > 1 ? 's' : ''}`,
    );
    byId('emptyState').hidden = criteriaCount > 0;
    byId('featureOverview').innerHTML = visible
      .map(({ feature, criteria }) => {
        const isExpanded = expanded.has(feature.storyId);
        const info = feature.complete
          ? { label: 'Validation complète', kind: 'success' }
          : hasDefect({
                validationStatus: '',
                testCases: feature.criteria.flatMap((criterion) => criterion.testCases),
              })
            ? { label: 'Validation partielle · anomalies', kind: 'danger' }
            : { label: 'Validation partielle', kind: 'warning' };
        const validated = criteria.filter((criterion) => criterion.validated).length;
        return `<button class="feature-summary" type="button" data-feature-toggle="${escape(feature.storyId)}" aria-expanded="${isExpanded}" aria-controls="feature-${escape(feature.storyId)}"><span class="feature-summary__top"><span><strong>${escape(feature.name)}</strong><small>${escape(feature.storyId)}</small></span><span class="badge badge--${info.kind}">${info.label}</span></span><span class="progress" aria-label="${validated} critères validés sur ${criteria.length} visibles"><span style="width:${criteria.length ? (validated / criteria.length) * 100 : 0}%"></span></span><span class="feature-summary__counts">${validated}/${criteria.length} critères visibles validés · ${feature.testCases ?? 0} TC au total</span><span class="feature-summary__action">${isExpanded ? 'Masquer les critères' : 'Voir les critères'}</span></button>`;
      })
      .join('');
    byId('features').innerHTML = visible
      .map(({ feature, criteria }) => {
        const isExpanded = expanded.has(feature.storyId);
        return `<section id="feature-${escape(feature.storyId)}" class="feature panel" ${isExpanded ? '' : 'hidden'}><header class="feature-header"><div><p class="eyebrow">${escape(feature.name)}</p><h2><a href="${escape(feature.sourceUrl)}">${escape(feature.story)}</a></h2><p>${criteria.length} critère(s) correspondant aux filtres · ${feature.coveredCriteria}/${feature.applicableCriteria} couverts au total</p></div><div class="feature-actions"><a href="../functional/">Playwright</a><a href="../allure/">Allure</a></div></header><div class="criteria">${criteria.map(criterionTemplate).join('')}</div></section>`;
      })
      .join('');
    document.querySelectorAll('[data-feature-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const featureId = button.dataset.featureToggle;
        if (expanded.has(featureId)) expanded.delete(featureId);
        else expanded.add(featureId);
        render();
        if (expanded.has(featureId))
          byId(`feature-${featureId}`)?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  controls.form.addEventListener('input', render);
  controls.form.addEventListener('change', (event) => {
    if (event.target === controls.feature && controls.feature.value)
      expanded.add(controls.feature.value);
    render();
  });
  controls.form.addEventListener('reset', () => {
    expanded.clear();
    requestAnimationFrame(render);
  });
  document
    .querySelector('[data-clear-filters]')
    ?.addEventListener('click', () => controls.form.reset());
  render();

  const traceability = [
    ['TC planifiés', data.testCases?.planned],
    ['TC automatisés', data.testCases?.automated],
    ['TC planifiés manquants', asArray(data.testCases?.missingAutomated).length],
    ['TC sans AC déterminable', asArray(data.testCases?.untracedTestCases).length],
    ['Références AC inconnues', asArray(data.testCases?.unknownCriteria).length],
    ['Rattachements US incohérents', asArray(data.testCases?.mismatchedStoryTestCases).length],
  ];
  byId('traceability').innerHTML = traceability
    .map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value ?? 0)}</dd></div>`)
    .join('');
  const warnings = [];
  if (asArray(data.testCases?.untracedTestCases).length)
    warnings.push(`TC sans AC : ${data.testCases.untracedTestCases.join(', ')}`);
  if (asArray(data.testCases?.unknownCriteria).length)
    warnings.push(
      `AC inconnus : ${data.testCases.unknownCriteria.map(({ testCase, criterion }) => `${testCase}/${criterion}`).join(', ')}`,
    );
  text(
    'traceabilityWarnings',
    warnings.join(' · ') || 'Aucune référence US → AC → TC invalide détectée.',
  );
})();
