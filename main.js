// ページを開いた時の初期設定
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
};

// 行を追加する機能
function addRow() {
    const tbody = document.getElementById('input-items-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="item-name" placeholder="例: Web制作"></td>
        <td><input type="number" class="item-price" placeholder="単価"></td>
        <td><input type="number" class="item-qty" placeholder="数量" value="1"></td>
        <td><button type="button" class="delete-btn" onclick="removeRow(this)">削除</button></td>
    `;
    tbody.appendChild(tr);
}

// 行を削除する機能
function removeRow(btn) {
    btn.closest('tr').remove();
}

// PDFを作成する機能
function generatePDF() {
    // 自社情報を保存
    localStorage.setItem('myZip', document.getElementById('myZip').value);
    localStorage.setItem('myAddress', document.getElementById('myAddress').value);
    localStorage.setItem('myCompany', document.getElementById('myCompany').value);
    localStorage.setItem('myPhone', document.getElementById('myPhone').value);
    localStorage.setItem('myEmail', document.getElementById('myEmail').value);

    // 基本情報を流し込む
    const clientName = document.getElementById('clientName').value;
    document.getElementById('pdf-client').innerText = clientName + " 御中";
    
    const dateVal = document.getElementById('issueDate').value;
    document.getElementById('pdf-date').innerText = dateVal.replace(/-/g, '/');

    document.getElementById('pdf-zip').innerText = "〒" + document.getElementById('myZip').value;
    document.getElementById('pdf-address').innerText = document.getElementById('myAddress').value;
    document.getElementById('pdf-company').innerText = document.getElementById('myCompany').value;
    
    const phone = document.getElementById('myPhone').value;
    document.getElementById('pdf-phone').innerText = phone ? "TEL: " + phone : "";
    const email = document.getElementById('myEmail').value;
    document.getElementById('pdf-email').innerText = email ? "Email: " + email : "";

    // 品目リストの計算と流し込み
    const rows = document.querySelectorAll('#input-items-body tr');
    let pdfItemsHTML = '';
    let subtotal = 0;

    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const price = Number(row.querySelector('.item-price').value) || 0;
        const qty = Number(row.querySelector('.item-qty').value) || 0;
        const lineTotal = price * qty;
        
        if(name || lineTotal > 0) {
            subtotal += lineTotal;
            pdfItemsHTML += `
                <tr>
                    <td>${name}</td>
                    <td>¥${price.toLocaleString()}</td>
                    <td>${qty}</td>
                    <td>¥${lineTotal.toLocaleString()}</td>
                </tr>
            `;
        }
    });

    document.getElementById('pdf-items').innerHTML = pdfItemsHTML;

    // 消費税と合計の計算
    const useTax = document.getElementById('useTax').checked;
    const tax = useTax ? Math.floor(subtotal * 0.1) : 0;
    const total = subtotal + tax;

    document.getElementById('pdf-subtotal').innerText = "¥" + subtotal.toLocaleString();
    document.getElementById('pdf-tax').innerText = "¥" + tax.toLocaleString();
    document.getElementById('pdf-total').innerText = "¥" + total.toLocaleString();
    document.getElementById('pdf-amount').innerText = "¥" + total.toLocaleString() + " -";

    // 消費税オフなら税金の行を隠す
    document.getElementById('pdf-tax-row').style.display = useTax ? "table-row" : "none";

    // PDF化を実行
    const invoiceElement = document.getElementById('invoice-layout');
    invoiceElement.style.display = "block";

    const opt = {
        margin:       0,
        filename:     '請求書_' + clientName + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(invoiceElement).save().then(() => {
        invoiceElement.style.display = "none";
    });
}