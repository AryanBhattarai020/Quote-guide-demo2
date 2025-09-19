(function () {
  const data = QG.loadState('qg_quote');
  if (!data) { window.location.href = '/builder.html'; return; }

  const currency = data.estimate?.currency || 'USD';
  const f = QG.formatCurrency;

  document.getElementById('q-field').textContent = data.field || '';
  document.getElementById('q-date').textContent = new Date(data.createdAt || Date.now()).toLocaleDateString();
  document.getElementById('q-location').textContent = data.country || '';
  document.getElementById('q-hours').textContent = `${data.estimate?.hours ?? 0} h`;
  document.getElementById('q-rate').textContent = f(data.estimate?.baseRate ?? 0, currency);
  document.getElementById('q-labor').textContent = f(data.estimate?.labor ?? 0, currency);
  document.getElementById('q-items').textContent = f(data.estimate?.itemsTotal ?? 0, currency);
  document.getElementById('q-contingency').textContent = f(data.estimate?.contingency ?? 0, currency);
  document.getElementById('q-total').textContent = f(data.estimate?.total ?? 0, currency);
  // Client info
  document.getElementById('q-client-name').textContent = (document.getElementById('client_name').value || '');
  document.getElementById('q-client-email').textContent = (document.getElementById('client_email').value || '');
  document.getElementById('q-client-address').textContent = (document.getElementById('client_address').value || '');

  const notesEl = document.getElementById('notes');
  notesEl.addEventListener('input', () => {
    document.getElementById('q-notes').textContent = notesEl.value || 'This quotation is an estimate based on provided details. Final pricing may vary with scope changes.';
  });

  document.getElementById('download-pdf').addEventListener('click', () => {
    const preview = document.getElementById('quote-preview');
    const filename = `Quote_${(data.field || 'Quotation').replace(/\s+/g,'_')}.pdf`;
    QG.generatePDF(preview, filename);
  });

  // Render items table
  const tbody = document.getElementById('items-tbody');
  const emptyRow = document.getElementById('items-empty');
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length) {
    emptyRow.remove();
    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-4 py-2 text-slate-700">${(it.description || '').replace(/</g,'&lt;')}</td>
        <td class="px-4 py-2 text-right text-slate-600">${Number(it.quantity || 0)}</td>
        <td class="px-4 py-2 text-right text-slate-600">${f(Number(it.unitPrice || 0), currency)}</td>
        <td class="px-4 py-2 text-right font-medium">${f(Number(it.quantity || 0) * Number(it.unitPrice || 0), currency)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
})();


