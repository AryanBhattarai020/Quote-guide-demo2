// Shared utilities and simple state helpers
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  window.QG = window.QG || {};

  // Persist and load simple flow state
  QG.saveState = function saveState(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  };
  QG.loadState = function loadState(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  };
  QG.clearState = function clearState(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  };

  // Basic currency formatter
  QG.formatCurrency = function formatCurrency(amount, currency = 'USD', locale = undefined) {
    try {
      return new Intl.NumberFormat(locale || navigator.language, { style: 'currency', currency }).format(amount);
    } catch (e) {
      return `$${amount.toFixed(2)}`;
    }
  };

  // Unified PDF generator for consistent output
  QG.generatePDF = function generatePDF(previewEl, filename) {
    try {
      if (!previewEl) return;
      if (typeof html2pdf === 'undefined') {
        alert('PDF generator not loaded yet. Please try again in a moment.');
        return;
      }
      const originalBg = previewEl.style.backgroundColor;

      // Create a clean, offscreen clone to avoid rendering issues
      const clone = previewEl.cloneNode(true);
      clone.style.backgroundColor = '#ffffff';
      clone.style.color = getComputedStyle(previewEl).color || '#0f172a';
      clone.style.width = '794px'; /* ~A4 width at 96dpi */
      clone.style.maxWidth = 'unset';
      // Place clone in normal flow at (0,0) but hidden, to ensure layout/styles compute correctly
      clone.style.position = 'absolute';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.visibility = 'hidden';
      clone.style.pointerEvents = 'none';
      clone.style.boxShadow = 'none';
      clone.style.transform = 'none';
      // Remove problematic filtered overlays (can render blank in html2canvas)
      try {
        clone.querySelectorAll('[class*="blur"], [class*="backdrop"], .pointer-events-none').forEach(n => n.remove());
      } catch(_) {}
      document.body.appendChild(clone);

      const options = {
        margin: [10, 10, 10, 10],
        filename: filename || 'Quote.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: Math.max(document.documentElement.clientWidth, clone.scrollWidth, 794),
          windowHeight: Math.max(document.documentElement.clientHeight, clone.scrollHeight),
          allowTaint: true,
          foreignObjectRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] }
      };

      const doHtml2Pdf = async () => {
        try { await (document.fonts && document.fonts.ready); } catch(_) {}
        // Use explicit pipeline to reduce race conditions
        return html2pdf().set(options).from(clone).toPdf().get('pdf').then(pdf => pdf.save(options.filename));
      };
      doHtml2Pdf().then(() => {
        document.body.removeChild(clone);
        previewEl.style.backgroundColor = originalBg;
      }).catch(async (err) => {
        console.warn('Primary PDF path failed, attempting fallback via html2canvas:', err);
        try {
          const canvas = await (window.html2canvas ? window.html2canvas(clone, options.html2canvas) : null);
          if (!canvas) throw err;
          const imgData = canvas.toDataURL('image/png');
          const JsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
          if (!JsPDFCtor) throw new Error('jsPDF not available');
          const pdf = new JsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const usableWidth = pageWidth - 20; // approx margins
          const imgWidth = usableWidth;
          const imgHeight = (canvas.height / canvas.width) * imgWidth;
          const x = (pageWidth - imgWidth) / 2;
          let y = 10;
          if (imgHeight <= pageHeight - 20) {
            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
          } else {
            // Split into multiple pages
            let sY = 0;
            const pagePxHeight = (pageHeight - 20) * (canvas.width / imgWidth);
            while (sY < canvas.height) {
              const pageCanvas = document.createElement('canvas');
              pageCanvas.width = canvas.width;
              pageCanvas.height = Math.min(pagePxHeight, canvas.height - sY);
              const ctx = pageCanvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
              ctx.drawImage(canvas, 0, sY, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
              const pageImg = pageCanvas.toDataURL('image/png');
              if (sY > 0) pdf.addPage();
              pdf.addImage(pageImg, 'PNG', x, y, imgWidth, (pageCanvas.height / pageCanvas.width) * imgWidth, undefined, 'FAST');
              sY += pageCanvas.height;
            }
          }
          pdf.save(filename || 'Quote.pdf');
        } catch (fallbackErr) {
          console.error('PDF fallback failed:', fallbackErr);
          // Final fallback: open a print-friendly window
          try {
            const win = window.open('', '_blank');
            if (win) {
              const css = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(el => el.outerHTML).join('\n');
              win.document.write(`<!doctype html><html><head><meta charset="utf-8">${css}</head><body>`);
              win.document.write(clone.outerHTML);
              win.document.write('</body></html>');
              win.document.close();
              setTimeout(() => { try { win.focus(); win.print(); } catch(_) {} }, 300);
            } else {
              alert('Unable to generate PDF. Please try again.');
            }
          } catch(_) {
            alert('Unable to generate PDF. Please try again.');
          }
        } finally {
          try { document.body.removeChild(clone); } catch(_) {}
          previewEl.style.backgroundColor = originalBg;
        }
      });
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('Unable to generate PDF. Please try again.');
    }
  };

  // Render review data into the unified preview on index.html
  QG.renderReview = function renderReview(data) {
    const f = QG.formatCurrency;
    const currency = data.estimate.currency || 'USD';
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('q-field', data.field || '');
    set('q-date', new Date(data.createdAt || Date.now()).toLocaleDateString());
    set('q-location', data.country || '');
    set('q-hours', `${data.estimate.hours} h`);
    set('q-rate', f(data.estimate.baseRate, currency));
    set('q-labor', f(data.estimate.labor, currency));
    set('q-items', f(data.estimate.itemsTotal, currency));
    set('q-contingency', f(data.estimate.contingency, currency));
    set('q-total', f(data.estimate.total, currency));

    // Client details if present on page
    const name = document.getElementById('client_name');
    const email = document.getElementById('client_email');
    const addr = document.getElementById('client_address');
    set('q-client-name', name ? name.value : '');
    set('q-client-email', email ? email.value : '');
    set('q-client-address', addr ? addr.value : '');

    const tbody = document.getElementById('items-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        const tr = document.createElement('tr');
        tr.id = 'items-empty';
        tr.innerHTML = '<td colspan="4" class="px-4 py-3 text-slate-500">No additional line items</td>';
        tbody.appendChild(tr);
      } else {
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
    }
  };
  // Country to currency map (ISO 3166-1 to ISO 4217). Selected common currencies; default USD.
  QG.countryToCurrency = {
    'United States': 'USD','Canada': 'CAD','Mexico': 'MXN','Brazil': 'BRL','Argentina': 'ARS','Chile': 'CLP','Colombia': 'COP','Peru': 'PEN',
    'United Kingdom': 'GBP','Ireland': 'EUR','France': 'EUR','Germany': 'EUR','Spain': 'EUR','Italy': 'EUR','Portugal': 'EUR','Netherlands': 'EUR','Belgium': 'EUR','Luxembourg': 'EUR','Austria': 'EUR','Finland': 'EUR','Estonia': 'EUR','Latvia': 'EUR','Lithuania': 'EUR','Slovakia': 'EUR','Slovenia': 'EUR','Greece': 'EUR','Cyprus': 'EUR','Malta': 'EUR',
    'Norway': 'NOK','Sweden': 'SEK','Denmark': 'DKK','Switzerland': 'CHF','Iceland': 'ISK','Czechia': 'CZK','Poland': 'PLN','Hungary': 'HUF','Romania': 'RON','Bulgaria': 'BGN','Croatia': 'EUR','Serbia': 'RSD','Turkey': 'TRY','Russia': 'RUB','Ukraine': 'UAH',
    'Australia': 'AUD','New Zealand': 'NZD','Japan': 'JPY','South Korea': 'KRW','China': 'CNY','Hong Kong': 'HKD','Taiwan': 'TWD','Singapore': 'SGD','Malaysia': 'MYR','Thailand': 'THB','Vietnam': 'VND','Indonesia': 'IDR','Philippines': 'PHP',
    'India': 'INR','Pakistan': 'PKR','Bangladesh': 'BDT','Sri Lanka': 'LKR','Nepal': 'NPR',
    'United Arab Emirates': 'AED','Saudi Arabia': 'SAR','Qatar': 'QAR','Kuwait': 'KWD','Bahrain': 'BHD','Oman': 'OMR','Israel': 'ILS',
    'South Africa': 'ZAR','Nigeria': 'NGN','Kenya': 'KES','Egypt': 'EGP','Morocco': 'MAD','Ghana': 'GHS','Ethiopia': 'ETB','Tanzania': 'TZS','Algeria': 'DZD','Tunisia': 'TND'
  };
  // Full country list for the selector (UN members and common territories)
  QG.countryList = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
    'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
    'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Congo-Brazzaville)','Costa Rica','Cote d’Ivoire','Croatia','Cuba','Cyprus','Czechia',
    'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
    'Fiji','Finland','France',
    'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
    'Haiti','Honduras','Hungary',
    'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
    'Jamaica','Japan','Jordan',
    'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan',
    'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
    'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
    'Oman',
    'Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
    'Qatar',
    'Romania','Russia','Rwanda',
    'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
    'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
    'Vanuatu','Venezuela','Vietnam',
    'Yemen',
    'Zambia','Zimbabwe'
  ];
})();


