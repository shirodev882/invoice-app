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

function addRow() {
    const container = document.getElementById('input-items-container');
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
        <div class="item-row">
            <input type="date" class="item-date">
            <input type="text" class="item-name" placeholder="品名 (例: 出張費)">
        </div>
        <div class="item-row col-3">
            <input type="number" class="item-price" placeholder="単価">
            <input type="number" class="item-qty" placeholder="数量" value="1">
            <select class="item-tax">
                <option value="0.1">10%</option>
                <option value="0.08">8%</option>
                <option value="0">対象外</option>
            </select>
        </div>
        <div class="item-row">
            <input type="text" class="item-note" placeholder="備考 (任意)">
            <button type="button" class="delete-btn" onclick="removeRow(this)">削除</button>
        </div>
    `;
    container.appendChild(div);
}

function removeRow(btn) {
    btn.closest('.item-card').remove();
}

function generatePDF() {
    localStorage.setItem('myZip', document.getElementById('myZip').value);
    localStorage.setItem('myAddress', document.getElementById('myAddress').value);
    localStorage.setItem('myCompany', document.getElementById('myCompany').value);
    localStorage.setItem('myPhone', document.getElementById('myPhone').value);
    localStorage.setItem('myEmail', document.getElementById('myEmail').value);

    const clientName = document.getElementById('clientName').value;
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

    // 💡【修正ポイント】画面の遥か左（-9999px）に置くのをやめて、
    // 今見ている画面の「一番上」の「裏側（z-index: -1）」に配置します。
    // こうすることでスマホが「画面外だから切り捨てよう」とするのを防ぎます。
    const invoiceElement = document.getElementById('invoice-layout');
    invoiceElement.style.display = "block";
    invoiceElement.style.position = "absolute";
    invoiceElement.style.top = "0";
    invoiceElement.style.left = "0";
    invoiceElement.style.zIndex = "-1"; 
    invoiceElement.style.width = "800px";  

    // 💡【修正ポイント】html2canvasのオプションに「scrollX: 0, scrollY: 0」を追加し、
    // 勝手に画面幅でクロップされるのを強制的にブロックします。
    const opt = {
        margin:       0,
        filename:     '請求書_' + clientName + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            windowWidth: 800, 
            width: 800,
            scrollX: 0, 
            scrollY: 0 
        }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(invoiceElement).save().then(() => {
        // 撮影が終わったら元に戻す
        invoiceElement.style.display = "none";
        invoiceElement.style.position = "static";
        invoiceElement.style.zIndex = "auto";
        invoiceElement.style.width = "auto";
    });
}