// ページを開いた時の処理
window.onload = function() {
    document.getElementById('myZip').value = localStorage.getItem('myZip') || '';
    document.getElementById('myAddress').value = localStorage.getItem('myAddress') || '';
    document.getElementById('myCompany').value = localStorage.getItem('myCompany') || '';
    document.getElementById('myPhone').value = localStorage.getItem('myPhone') || '';
    document.getElementById('myEmail').value = localStorage.getItem('myEmail') || '';

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('issueDate').value = `${yyyy}-${mm}-${dd}`;

    // 品目データを読み込む
    loadItems();

    // 入力するたびに自動セーブする魔法をセット
    document.getElementById('input-items-container').addEventListener('input', saveItems);
    document.getElementById('input-items-container').addEventListener('change', saveItems);
};

// 【新機能】品目データをブラウザに記憶させる
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

// 【新機能】記憶した品目データを復元する
function loadItems() {
    const savedStr = localStorage.getItem('myInvoiceItems');
    const container = document.getElementById('input-items-container');
    container.innerHTML = ''; 

    if (savedStr) {
        const items = JSON.parse(savedStr);
        if (items.length > 0) {
            items.forEach(data => addRow(data));
            return;
        }
    }
    addRow(); // データが無い場合は空の行を1つ出す
}

// 【新機能】品目をすべて削除する
function clearAllItems() {
    if(confirm("品目リストをすべてリセットしますか？")) {
        localStorage.removeItem('myInvoiceItems');
        document.getElementById('input-items-container').innerHTML = '';
        addRow();
    }
}

// 行を追加する（保存データがあればそれを入れる）
function addRow(data = {}) {
    const container = document.getElementById('input-items-container');
    const div = document.createElement('div');
    div.className = 'item-card';

    const dDate = data.date || '';
    const dName = data.name || '';
    const dPrice = data.price || '';
    const dQty = data.qty || '1';
    const dTax = data.tax || '0.1';
    const dNote = data.note || '';

    div.innerHTML = `
        <div class="item-row">
            <input type="date" class="item-date" value="${dDate}">
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
            <button type="button" class="delete-btn" onclick="removeRow(this)">削除</button>
        </div>
    `;
    container.appendChild(div);
    saveItems();
}

function removeRow(btn) {
    btn.closest('.item-card').remove();
    saveItems();
}

// PDFを作成＆自動オープン＆シェアする処理
function generatePDF() {
    // 情報をセーブ
    saveItems();
    localStorage.setItem('myZip', document.getElementById('myZip').value);
    localStorage.setItem('myAddress', document.getElementById('myAddress').value);
    localStorage.setItem('myCompany', document.getElementById('myCompany').value);
    localStorage.setItem('myPhone', document.getElementById('myPhone').value);
    localStorage.setItem('myEmail', document.getElementById('myEmail').value);

    const clientName = document.getElementById('clientName').value || 'お客様';
    document.getElementById('pdf-client').innerText = clientName + " 御中";
    const dateVal = document.getElementById('issueDate').value;
    document.getElementById('pdf-date').innerText = dateVal.replace(/-/g, '/');
    document.getElementById('pdf-zip').innerText = "〒" + document.getElementById('myZip').value;
    document.getElementById('pdf-address').innerText = document.getElementById('myAddress').value;
    document.getElementById('pdf-company').innerText = document.getElementById('myCompany').value;
    document.getElementById('pdf-phone').innerText = document.getElementById('myPhone').value ? "TEL: " + document.getElementById('myPhone').value : "";
    document.getElementById('pdf-email').innerText = document.getElementById('myEmail').value ? "Email: " + document.getElementById('myEmail').value : "";

    const cards = document.querySelectorAll('.item-card');
    let pdfItemsHTML = '';
    let subtotal = 0;
    let totalTax = 0;

    cards.forEach(card => {
        const itemDateVal = card.querySelector('.item-date').value;
        const itemDate = itemDateVal ? itemDateVal.replace(/-/g, '/') : '';
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
            let taxLabel = taxRate === 0.1 ? '10%' : (taxRate === 0.08 ? '8%' : '-');
            const noteHTML = note ? `<div class="pdf-note">※${note}</div>` : '';

            pdfItemsHTML += `
                <tr>
                    <td>${itemDate}</td>
                    <td><div class="pdf-name">${name}</div>${noteHTML}</td>
                    <td class="text-right">¥${price.toLocaleString()}</td>
                    <td>${qty}</td>
                    <td>${taxLabel}</td>
                    <td class="text-right">¥${lineTotal.toLocaleString()}</td>
                </tr>
            `;
        }
    });

    document.getElementById('pdf-items').innerHTML = pdfItemsHTML;

    const finalTotal = subtotal + totalTax;
    document.getElementById('pdf-subtotal').innerText = "¥" + subtotal.toLocaleString();
    document.getElementById('pdf-tax').innerText = "¥" + totalTax.toLocaleString();
    document.getElementById('pdf-total').innerText = "¥" + finalTotal.toLocaleString();
    document.getElementById('pdf-amount').innerText = "¥" + finalTotal.toLocaleString() + " -";
    document.getElementById('pdf-tax-row').style.display = totalTax > 0 ? "table-row" : "none";

    // 💡【真っ白・見切れ防止の究極の魔法】
    // 入力画面を「完全に非表示」にし、PDFレイアウトだけを画面の主役にします！
    const appContainer = document.getElementById('app-container');
    const invoiceElement = document.getElementById('invoice-layout');
    
    appContainer.style.display = "none";
    invoiceElement.style.display = "block";

    const opt = {
        margin:       0,
        filename:     '請求書_' + clientName + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 💡【LINE・メール添付機能＆自動オープン】
    html2pdf().set(opt).from(invoiceElement).output('blob').then(function(blob) {
        // 撮影が終わったら入力画面を元に戻す（一瞬の出来事なので違和感ゼロです）
        invoiceElement.style.display = "none";
        appContainer.style.display = "block";

        // PDFのデータ（File）を作成
        const file = new File([blob], '請求書_' + clientName + '.pdf', { type: 'application/pdf' });

        // スマホのネイティブ機能（LINE、メール、AirDropなど）を呼び出す
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: '請求書',
                text: '請求書のPDFデータをお送りします。'
            }).catch(e => console.log("シェアをキャンセルしました"));
        } else {
            // パソコン等、シェア機能がない場合は「自動で開く」
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // ついでにダウンロードもしておく
            const a = document.createElement('a');
            a.href = url;
            a.download = '請求書_' + clientName + '.pdf';
            a.click();
        }
    });
}