(function () {
  const fieldInput = document.getElementById('field');
  const countrySelect = document.getElementById('country');
  const suggestions = document.getElementById('field-suggestions');
  const questionsContainer = document.getElementById('dynamic-questions');
  const itemsContainer = document.getElementById('items');
  const addItemBtn = document.getElementById('add-item');
  const resetBtn = document.getElementById('reset');
  const form = document.getElementById('builder-form');
  const adjustRange = document.getElementById('adjust');
  const adjustVal = document.getElementById('adjustVal');

  // If not on the builder page, abort safely.
  if (!form) return;

  // Seed suggestions for popular categories. Free text still allowed.
  const popularFields = [
    'Web Development', 'Mobile App Development', 'Graphic Design', 'Branding', 'UI/UX Design', 'Copywriting', 'SEO', 'Digital Marketing',
    'Consulting', 'Accounting', 'Legal Services', 'Real Estate', 'Event Planning', 'Photography', 'Videography',
    'Plumbing', 'Electrical Work', 'Carpentry', 'Landscaping', 'Painting', 'Cleaning Services', 'Roofing', 'HVAC',
    'Catering', 'Baking', 'Personal Training', 'Tutoring', 'Translation', 'Interior Design', 'Architecture'
  ];
  if (suggestions) {
    popularFields.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f; suggestions.appendChild(opt);
    });
  }

  // Populate countries
  if (countrySelect) {
    (QG.countryList || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c; countrySelect.appendChild(opt);
    });
  }

  // Define dynamic question templates by broad category
  const categoryQuestions = {
    software: [
      { id: 'hours', label: 'Estimated hours', type: 'number', min: 1, max: 400, step: 1, placeholder: 'e.g., 20' },
      { id: 'scope', label: 'Scope complexity', type: 'select', options: ['Basic', 'Standard', 'Advanced'] },
      { id: 'deadline', label: 'Deadline urgency', type: 'select', options: ['Flexible', 'Normal', 'Urgent'] },
      { id: 'revisions', label: 'Revisions included', type: 'number', min: 0, max: 10, step: 1, placeholder: 'e.g., 2' },
      { id: 'hosting', label: 'Include hosting/infrastructure?', type: 'select', options: ['No', 'Yes'] }
    ],
    trades: [
      { id: 'hours', label: 'Estimated hours', type: 'number', min: 1, max: 400, step: 1, placeholder: 'e.g., 8' },
      { id: 'materials', label: 'Materials provided by you?', type: 'select', options: ['No', 'Yes'] },
      { id: 'site_size', label: 'Site size', type: 'select', options: ['Small', 'Medium', 'Large'] },
      { id: 'urgency', label: 'Job urgency', type: 'select', options: ['Flexible', 'Normal', 'Urgent'] },
      { id: 'warranty', label: 'Warranty months', type: 'number', min: 0, max: 36, step: 1, placeholder: 'e.g., 6' }
    ],
    creative: [
      { id: 'hours', label: 'Estimated hours', type: 'number', min: 1, max: 400, step: 1, placeholder: 'e.g., 12' },
      { id: 'deliverables', label: 'Number of deliverables', type: 'number', min: 1, max: 50, step: 1, placeholder: 'e.g., 5' },
      { id: 'usage', label: 'Usage rights', type: 'select', options: ['Personal', 'Commercial', 'Exclusive'] },
      { id: 'deadline', label: 'Deadline urgency', type: 'select', options: ['Flexible', 'Normal', 'Urgent'] },
      { id: 'revisions', label: 'Revisions included', type: 'number', min: 0, max: 10, step: 1, placeholder: 'e.g., 2' }
    ],
    consulting: [
      { id: 'hours', label: 'Estimated hours', type: 'number', min: 1, max: 400, step: 1, placeholder: 'e.g., 20' },
      { id: 'seniority', label: 'Consultant seniority', type: 'select', options: ['Associate', 'Senior', 'Principal'] },
      { id: 'on_site', label: 'On-site required?', type: 'select', options: ['No', 'Yes'] },
      { id: 'deadline', label: 'Deadline urgency', type: 'select', options: ['Flexible', 'Normal', 'Urgent'] }
    ],
    generic: [
      { id: 'hours', label: 'Estimated hours', type: 'number', min: 1, max: 400, step: 1, placeholder: 'e.g., 10' },
      { id: 'complexity', label: 'Overall complexity', type: 'select', options: ['Basic', 'Standard', 'Advanced'] },
      { id: 'timeline', label: 'Timeline urgency', type: 'select', options: ['Flexible', 'Normal', 'Urgent'] },
      { id: 'quantity', label: 'Quantity/Units', type: 'number', min: 1, max: 1000, step: 1, placeholder: 'e.g., 10' },
      { id: 'extras', label: 'Include extras/support?', type: 'select', options: ['No', 'Yes'] }
    ]
  };

  function categorizeField(text) {
    const t = (text || '').toLowerCase();
    if (/(web|app|software|dev|engineer|it|saas|data|ai|ml)/.test(t)) return 'software';
    if (/(plumb|electric|carpentr|landscap|paint|roof|hvac|mechanic)/.test(t)) return 'trades';
    if (/(design|photo|video|creative|brand|illustrat|art|music)/.test(t)) return 'creative';
    if (/(consult|advis|coach|account|legal|law|audit|tax)/.test(t)) return 'consulting';
    return 'generic';
  }

  function renderQuestions(category) {
    questionsContainer.innerHTML = '';
    const schema = categoryQuestions[category] || categoryQuestions.generic;
    schema.forEach(q => {
      const w = document.createElement('div');
      w.className = 'space-y-2';
      const label = document.createElement('label');
      label.className = 'block text-sm text-slate-600';
      label.textContent = q.label;
      let input;
      if (q.type === 'select') {
        input = document.createElement('select');
        input.className = 'w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 bg-white';
        q.options.forEach(o => {
          const opt = document.createElement('option'); opt.value = o; opt.textContent = o; input.appendChild(opt);
        });
      } else {
        input = document.createElement('input');
        input.type = 'number';
        input.placeholder = q.placeholder || '';
        if (q.min !== undefined) input.min = String(q.min);
        if (q.max !== undefined) input.max = String(q.max);
        if (q.step !== undefined) input.step = String(q.step);
        input.className = 'w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500';
      }
      input.id = `q_${q.id}`;
      w.appendChild(label); w.appendChild(input);
      questionsContainer.appendChild(w);
    });
  }

  function addLineItem(item) {
    const idx = itemsContainer.children.length;
    const row = document.createElement('div');
    row.className = 'grid md:grid-cols-6 gap-3 items-center';
    row.innerHTML = `
      <input placeholder="Item description" class="md:col-span-3 rounded-xl border border-slate-300 px-4 py-2" value="${item?.description || ''}">
      <input type="number" min="0" step="1" placeholder="Qty" class="rounded-xl border border-slate-300 px-4 py-2" value="${item?.quantity || ''}">
      <input type="number" min="0" step="0.01" placeholder="Unit price" class="rounded-xl border border-slate-300 px-4 py-2" value="${item?.unitPrice || ''}">
      <button type="button" class="text-sm text-red-600 hover:underline">Remove</button>
    `;
    const removeBtn = row.querySelector('button');
    removeBtn.addEventListener('click', () => row.remove());
    // Recompute when user edits line items
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', recomputeAndRender);
      inp.addEventListener('change', recomputeAndRender);
    });
    itemsContainer.appendChild(row);
  }

  function collectLineItems() {
    const arr = [];
    itemsContainer.querySelectorAll('.grid').forEach(row => {
      const [desc, qty, unit] = row.querySelectorAll('input');
      const quantity = Number(qty.value || '0');
      const unitPrice = Number(unit.value || '0');
      if ((desc.value || '').trim() && (quantity > 0 || unitPrice > 0)) {
        arr.push({ description: desc.value.trim(), quantity, unitPrice });
      }
    });
    return arr;
  }

  // Lightweight "AI" estimator (heuristic). No external calls.
  function estimateTotal(field, country, answers, items) {
    const category = categorizeField(field);
    // Prefer country-specific local currency baselines, fall back to global USD baselines.
    const local = (QG.countryRates && QG.countryRates[country]) || null;
    const baseRateByCategory = { software: 85, trades: 60, creative: 70, consulting: 120, generic: 55 };
    let base = local ? (local[category] || local.generic) : (baseRateByCategory[category] || baseRateByCategory.generic);

    const regionAdj = /(United States|Canada|United Kingdom|Ireland|France|Germany|Netherlands|Belgium|Luxembourg|Austria|Finland|Norway|Sweden|Denmark|Switzerland|Australia|New Zealand|United Arab Emirates|Singapore)/i.test(country || '') ? 1.2 :
                      /(India|Pakistan|Bangladesh|Sri Lanka|Nepal|Nigeria|Kenya|Ghana|Ethiopia|Tanzania|Vietnam|Philippines|Indonesia)/i.test(country || '') ? 0.85 : 1.0;

    let complexity = 1.0;
    const val = v => (v || '').toString().toLowerCase();
    Object.keys(answers || {}).forEach(k => {
      const v = val(answers[k]);
      if (/advanced|urgent|exclusive|principal|large/.test(v)) complexity += 0.35;
      if (/standard|normal|medium|senior/.test(v)) complexity += 0.15;
      if (/basic|flexible|small|associate|personal|no/.test(v)) complexity += 0.0;
    });

    // Hours estimate from user input (preferred). If missing, infer.
    let hours;
    const parsedHours = Number(answers.hours);
    if (!Number.isNaN(parsedHours) && parsedHours > 0) {
      hours = Math.max(1, Math.min(400, parsedHours));
    } else {
      hours = 8; // fallback baseline
      if (answers.deliverables) hours += Number(answers.deliverables) * 1.5;
      if (answers.revisions) hours += Number(answers.revisions) * 1.25;
      if (answers.scope === 'Advanced' || answers.complexity === 'Advanced') hours *= 1.8;
      if (answers.scope === 'Basic' || answers.complexity === 'Basic') hours *= 0.8;
    }

    // Material/line items
    const itemsTotal = (items || []).reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice)), 0);

    // Stochastic tiny spread to simulate AI nuance
    const jitter = 1 + (Math.random() - 0.5) * 0.06; // ±3%

    const labor = base * regionAdj * complexity * hours;
    // Apply user adjustment (70-130%) to labor only
    const adjustPct = Number((adjustRange && adjustRange.value) || 100) / 100;
    const laborAdjusted = labor * adjustPct;
    const subtotal = laborAdjusted + itemsTotal;
    const contingency = subtotal * 0.07; // 7%
    const total = Math.max(50, (subtotal + contingency) * jitter);
    // Set currency by country
    const currency = local?.currency || ((QG.countryToCurrency && QG.countryToCurrency[country]) ? QG.countryToCurrency[country] : 'USD');
    return { currency, baseRate: base, hours: Math.round(hours), labor: laborAdjusted, itemsTotal, contingency, total, adjustPct };
  }

  function onFieldChanged() {
    const cat = categorizeField(fieldInput.value);
    renderQuestions(cat);
  }

  addItemBtn.addEventListener('click', () => addLineItem());
  fieldInput.addEventListener('change', onFieldChanged);
  fieldInput.addEventListener('input', onFieldChanged);
  resetBtn.addEventListener('click', () => { form.reset(); questionsContainer.innerHTML = ''; itemsContainer.innerHTML=''; });
  if (adjustRange && adjustVal) {
    const upd = () => { adjustVal.textContent = `${adjustRange.value}%`; };
    adjustRange.addEventListener('input', upd);
    upd();
  }

  // Initialize default questions
  renderQuestions('generic');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const field = fieldInput.value.trim();
    if (!field) { fieldInput.focus(); return; }
    const country = (countrySelect.value || '').trim();

    const answers = {};
    questionsContainer.querySelectorAll('select, input').forEach(inp => {
      answers[inp.id.replace('q_', '')] = inp.value;
    });

    const items = collectLineItems();
    const estimate = estimateTotal(field, country, answers, items);

    const state = { field, country, answers, items, estimate, createdAt: new Date().toISOString() };
    QG.saveState('qg_quote', state);
    // If unified preview exists on the page, render inline; otherwise navigate to review page.
    if (document.getElementById('quote-preview') && typeof QG.renderReview === 'function') {
      QG.renderReview(state);
      try { document.getElementById('quote-preview').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(e) {}
    } else {
      window.location.href = '/review.html';
    }
  });

  // Recompute and render preview (if present) when options change
  function recomputeAndRender() {
    const field = fieldInput.value.trim();
    if (!field) return;
    const country = (countrySelect.value || '').trim();
    const answers = {};
    questionsContainer.querySelectorAll('select, input').forEach(inp => {
      answers[inp.id.replace('q_', '')] = inp.value;
    });
    const items = collectLineItems();
    const estimate = estimateTotal(field, country, answers, items);
    const state = { field, country, answers, items, estimate, createdAt: QG.loadState('qg_quote')?.createdAt || new Date().toISOString() };
    QG.saveState('qg_quote', state);
    if (document.getElementById('quote-preview') && typeof QG.renderReview === 'function') {
      QG.renderReview(state);
    }
  }

  // Hook changes to trigger live updates in inline preview
  [fieldInput, countrySelect, adjustRange].forEach(el => {
    if (!el) return;
    el.addEventListener('input', recomputeAndRender);
    el.addEventListener('change', recomputeAndRender);
  });
  questionsContainer.addEventListener('input', recomputeAndRender);
  questionsContainer.addEventListener('change', recomputeAndRender);
})();


