window.onload = function() {
    document.getElementById('myZip').value = localStorage.getItem('myZip') || '';
    document.getElementById('myAddress').value = localStorage.getItem('myAddress') || '';
    document.getElementById('myCompany').value = localStorage.getItem('myCompany') || '';
    document.getElementById('myInvoiceNumber').value = localStorage.getItem('myInvoiceNumber') || '';
    document.getElementById('myPhone').value = localStorage.getItem('myPhone') || '';
    document.getElementById('myEmail').value = localStorage.getItem('myEmail') || '';
    // 💡新たに追加：自由記入欄の読み込み
    document.getElementById('myFreeText').value = localStorage.getItem('myFreeText') || '';

    const today = new Date();
    document.getElementById('issueDate').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    loadItems();
    document.getElementById('input-items-container').addEventListener('input', saveItems);
    document.getElementById('input-items-container').addEventListener('change', saveItems);
};

function saveItems() {
    const cards = document.querySelectorAll('.item-card');
    const items = [];
    cards.forEach(card => {
        items.push({
            date: card.querySelector('.item-date').value,
            name: card.querySelector('.item-name').value,
            price: card.querySelector('.item-price').value,
            qty: card.querySelector('.item-qty').value,
            tax: card.querySelector('.item-tax').value,
            note: card.querySelector('.item-note').value
        });
    });
    localStorage.setItem('myInvoiceItems', JSON.stringify(items));
}

function loadItems() {
    const savedStr = localStorage.getItem('myInvoiceItems');
    document.getElementById('input-items-container').innerHTML = ''; 
    if (savedStr) {
        const items = JSON.parse(savedStr);
        if (items.length > 0) { items.forEach(data => addRow(data)); return; }
    }
    addRow(); 
}

function clearAllItems() {
    if(confirm("品目リストをすべてリセットしますか？")) {
        localStorage.removeItem('myInvoiceItems');
        document.getElementById('input-items-container').innerHTML = '';
        addRow();
    }
}

function addRow(data = {}) {
    const container = document.getElementById('input-items-container');
    const div = document.createElement('div');
    div.className = 'item-card';
    const dDate = data.date || '';
    const dateType = dDate ? 'date' : 'text'; 
    const dName = data.name || '';
    const dPrice = data.price || '';
    const dQty = data.qty || '1';
    const dTax = data.tax || '0.1';
    const dNote = data.note || '';

    div.innerHTML = `
        <div style="text-align: right; margin-bottom: 5px;">
            <span onclick="removeRow(this)" style="color: #dc3545; font-size: 13px; cursor: pointer; font-weight: bold;">✖ 削除</span>
        </div>
        <div class="item-row">
            <input type="${dateType}" class="item-date" placeholder="日付" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" value="${dDate}">
            <input type="text" class="item-name" placeholder="品名 (例: 出張費)" value="${dName}">
        </div>
        <div class="item-row col-3">
            <input type="number" class="item-price" placeholder="単価" value="${dPrice}">
            <input type="number" class="item-qty" placeholder="数量" value="${dQty}">
            <select class="item-tax">
                <option value="0.1" ${dTax === '0.1' ? 'selected' : ''}>10%</option>
                <option value="0.08" ${dTax === '0.08' ? 'selected' : ''}>8%</option>
                <option value="0" ${dTax === '0' ? 'selected' : ''}>対象外</option>
            </select>
        </div>
        <div class="item-row">
            <input type="text" class="item-note" placeholder="備考 (任意)" value="${dNote}">
        </div>
    `;
    container.appendChild(div);
    saveItems();
}

function removeRow(btn) {
    btn.closest('.item-card').remove();
    saveItems();
}

function previewPDF() {
    saveItems();
    localStorage.setItem('myZip', document.getElementById('myZip').value);
    localStorage.setItem('myAddress', document.getElementById('myAddress').value);
    localStorage.setItem('myCompany', document.getElementById('myCompany').value);
    localStorage.setItem('myInvoiceNumber', document.getElementById('myInvoiceNumber').value);
    localStorage.setItem('myPhone', document.getElementById('myPhone').value);
    localStorage.setItem('myEmail', document.getElementById('myEmail').value);
    
    // 💡新たに追加：自由記入欄の保存
    const freeTextVal = document.getElementById('myFreeText').value;
    localStorage.setItem('myFreeText', freeTextVal);

    document.getElementById('pdf-client').innerText = (document.getElementById('clientName').value || 'お客様') + " 御中";
    document.getElementById('pdf-date').innerText = document.getElementById('issueDate').value.replace(/-/g, '/');
    document.getElementById('pdf-zip').innerText = "〒" + document.getElementById('myZip').value;
    document.getElementById('pdf-address').innerText = document.getElementById('myAddress').value;
    document.getElementById('pdf-company').innerText = document.getElementById('myCompany').value;
    document.getElementById('pdf-invoice-number').innerText = document.getElementById('myInvoiceNumber').value ? "登録番号: " + document.getElementById('myInvoiceNumber').value : "";
    document.getElementById('pdf-phone').innerText = document.getElementById('myPhone').value ? "TEL: " + document.getElementById('myPhone').value : "";
    document.getElementById('pdf-email').innerText = document.getElementById('myEmail').value ? "Email: " + document.getElementById('myEmail').value : "";

    let pdfItemsHTML = '', subtotal = 0, totalTax = 0;
    document.querySelectorAll('.item-card').forEach(card => {
        const itemDateVal = card.querySelector('.item-date').value;
        const name = card.querySelector('.item-name').value;
        const note = card.querySelector('.item-note').value;
        const price = Number(card.querySelector('.item-price').value) || 0;
        const qty = Number(card.querySelector('.item-qty').value) || 0;
        const taxRate = Number(card.querySelector('.item-tax').value);
        const lineTotal = price * qty;
        const lineTax = Math.floor(lineTotal * taxRate);
        
        if(name || lineTotal > 0) {
            subtotal += lineTotal;
            totalTax += lineTax;
            pdfItemsHTML += `<tr>
                <td>${itemDateVal ? itemDateVal.replace(/-/g, '/') : ''}</td>
                <td><div class="pdf-name">${name}</div>${note ? `<div class="pdf-note">※${note}</div>` : ''}</td>
                <td class="text-right">¥${price.toLocaleString()}</td>
                <td>${qty}</td>
                <td>${taxRate === 0.1 ? '10%' : (taxRate === 0.08 ? '8%' : '-')}</td>
                <td class="text-right">¥${lineTotal.toLocaleString()}</td>
            </tr>`;
        }
    });

    document.getElementById('pdf-items').innerHTML = pdfItemsHTML;
    document.getElementById('pdf-subtotal').innerText = "¥" + subtotal.toLocaleString();
    document.getElementById('pdf-tax').innerText = "¥" + totalTax.toLocaleString();
    document.getElementById('pdf-total').innerText = "¥" + (subtotal + totalTax).toLocaleString();
    document.getElementById('pdf-amount').innerText = "¥" + (subtotal + totalTax).toLocaleString() + " -";
    document.getElementById('pdf-tax-row').style.display = totalTax > 0 ? "table-row" : "none";

    // 💡新たに追加：自由記入欄の表示処理（空っぽなら枠ごと隠す）
    const pdfFreeTextEl = document.getElementById('pdf-free-text');
    if (freeTextVal) {
        pdfFreeTextEl.innerText = freeTextVal;
        pdfFreeTextEl.style.display = "block";
    } else {
        pdfFreeTextEl.style.display = "none";
    }

    document.getElementById('app-container').style.display = "none";
    document.getElementById('preview-container').style.display = "block";
    window.scrollTo(0, 0); 
}

function closePreview() {
    document.getElementById('preview-container').style.display = "none";
    document.getElementById('app-container').style.display = "block";
    window.scrollTo(0, 0);
}

function executePDF() {
    const clientName = document.getElementById('clientName').value || 'お客様';
    const invoiceElement = document.getElementById('invoice-layout');
    const actionButtons = document.querySelector('.preview-actions');
    actionButtons.style.display = "none";

    setTimeout(() => {
        const opt = { margin: 0, filename: '請求書_' + clientName + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, scrollX: 0, scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(invoiceElement).output('blob').then(function(blob) {
            actionButtons.style.display = "flex";
            const file = new File([blob], '請求書_' + clientName + '.pdf', { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: '請求書', text: '請求書のPDFデータをお送りします。' }).catch(e => console.log("シェアをキャンセルしました"));
            } else {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                const a = document.createElement('a');
                a.href = url;
                a.download = '請求書_' + clientName + '.pdf';
                a.click();
            }
        });
    }, 100);
}