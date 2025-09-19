(function(){
  const state = QG.loadState('qg_invoice');
  if (!state) { window.location.href = '/invoice.html'; return; }
  const f = QG.formatCurrency;

  const inv = state.invoice;
  const currency = 'USD';
  document.getElementById('i-number').textContent = inv.number || '';
  document.getElementById('i-date').textContent = inv.date || '';
  document.getElementById('i-due').textContent = inv.due || '';
  document.getElementById('i-client').textContent = inv.client || '';
  document.getElementById('i-email').textContent = inv.email || '';

  const tbody = document.getElementById('i-items');
  const empty = document.getElementById('i-empty');
  tbody.innerHTML = '';
  if (!inv.items || !inv.items.length) {
    tbody.appendChild(empty);
  } else {
    inv.items.forEach(it => {
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

  document.getElementById('i-subtotal').textContent = f(state.totals.subtotal, currency);
  document.getElementById('i-tax').textContent = f(state.totals.tax, currency);
  document.getElementById('i-total').textContent = f(state.totals.total, currency);
  document.getElementById('i-notes').textContent = inv.notes || 'Thank you for your business.';

  document.getElementById('download-invoice').addEventListener('click', () => {
    const el = document.getElementById('invoice-preview');
    const filename = `Invoice_${(inv.number || 'Invoice').replace(/\s+/g,'_')}.pdf`;
    QG.generatePDF(el, filename);
  });
})();




