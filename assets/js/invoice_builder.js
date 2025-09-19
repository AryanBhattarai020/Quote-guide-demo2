(function(){
  const form = document.getElementById('invoice-form');
  if (!form) return;
  const itemsContainer = document.getElementById('inv_items');
  const addBtn = document.getElementById('add-inv-item');
  const resetBtn = document.getElementById('inv_reset');

  function addItem(item){
    const row = document.createElement('div');
    row.className = 'grid md:grid-cols-6 gap-3 items-center';
    row.innerHTML = `
      <input placeholder="Item description" class="md:col-span-3 rounded-xl border border-slate-300 px-4 py-2" value="${item?.description || ''}">
      <input type="number" min="0" step="1" placeholder="Qty" class="rounded-xl border border-slate-300 px-4 py-2" value="${item?.quantity || ''}">
      <input type="number" min="0" step="0.01" placeholder="Unit price" class="rounded-xl border border-slate-300 px-4 py-2" value="${item?.unitPrice || ''}">
      <button type="button" class="text-sm text-red-600 hover:underline">Remove</button>
    `;
    row.querySelector('button').addEventListener('click', ()=> row.remove());
    itemsContainer.appendChild(row);
  }
  addBtn.addEventListener('click', ()=> addItem());

  function collectItems(){
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

  function computeTotals(items, taxPct){
    const subtotal = (items || []).reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
    const tax = subtotal * (Number(taxPct || 0) / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  resetBtn.addEventListener('click', ()=> { itemsContainer.innerHTML = ''; });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = {
      client: document.getElementById('inv_client').value.trim(),
      email: document.getElementById('inv_email').value.trim(),
      number: document.getElementById('inv_number').value.trim(),
      date: document.getElementById('inv_date').value,
      due: document.getElementById('inv_due').value,
      taxPct: Number(document.getElementById('inv_tax').value || '0'),
      notes: document.getElementById('inv_notes').value || '',
      items: collectItems()
    };
    const totals = computeTotals(data.items, data.taxPct);
    const state = { invoice: data, totals, createdAt: new Date().toISOString() };
    QG.saveState('qg_invoice', state);
    window.location.href = '/invoice-review.html';
  });
})();



