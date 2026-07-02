// ① ページを開いた時に「今日の日付」と「保存された自社情報」をセットする
window.onload = function() {
    // ローカルストレージ（ブラウザの記憶）からデータを呼び出す
    document.getElementById('myZip').value = localStorage.getItem('myZip') || '';
    document.getElementById('myAddress').value = localStorage.getItem('myAddress') || '';
    document.getElementById('myCompany').value = localStorage.getItem('myCompany') || '';
    document.getElementById('myPhone').value = localStorage.getItem('myPhone') || '';
    document.getElementById('myEmail').value = localStorage.getItem('myEmail') || '';

    // 今日の日付を YYYY-MM-DD 形式で作ってセットする
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('issueDate').value = `${yyyy}-${mm}-${dd}`;
};

// ② PDF作成ボタンを押した時の処理
function generatePDF() {
    // 1. 今回入力された自社情報をブラウザに記憶させる（次回から入力不要！）
    localStorage.setItem('myZip', document.getElementById('myZip').value);
    localStorage.setItem('myAddress', document.getElementById('myAddress').value);
    localStorage.setItem('myCompany', document.getElementById('myCompany').value);
    localStorage.setItem('myPhone', document.getElementById('myPhone').value);
    localStorage.setItem('myEmail', document.getElementById('myEmail').value);

    // 2. 入力された文字を、隠してあるPDF用レイアウトに流し込む
    const clientName = document.getElementById('clientName').value;
    document.getElementById('pdf-client').innerText = clientName + " 御中";
    
    // 金額にカンマをつけて表示
    const amountVal = document.getElementById('amount').value;
    const formattedAmount = Number(amountVal).toLocaleString();
    document.getElementById('pdf-amount').innerText = "¥" + formattedAmount + " -";
    document.getElementById('pdf-item-price').innerText = "¥" + formattedAmount;

    // 品目と日付
    document.getElementById('pdf-item').innerText = document.getElementById('itemName').value;
    const dateVal = document.getElementById('issueDate').value;
    document.getElementById('pdf-date').innerText = dateVal.replace(/-/g, '/'); // 2026-07-02 を 2026/07/02 に変換

    // 自社情報を流し込む
    document.getElementById('pdf-zip').innerText = "〒" + document.getElementById('myZip').value;
    document.getElementById('pdf-address').innerText = document.getElementById('myAddress').value;
    document.getElementById('pdf-company').innerText = document.getElementById('myCompany').value;
    
    const phone = document.getElementById('myPhone').value;
    document.getElementById('pdf-phone').innerText = phone ? "TEL: " + phone : ""; // 空欄ならTELごと消す
    
    const email = document.getElementById('myEmail').value;
    document.getElementById('pdf-email').innerText = email ? "Email: " + email : "";

    // 3. 隠していたレイアウトを一瞬だけ表示して、PDF化を実行する
    const invoiceElement = document.getElementById('invoice-layout');
    invoiceElement.style.display = "block"; // 一瞬表示

    const opt = {
        margin:       0,
        filename:     '請求書_' + clientName + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(invoiceElement).save().then(() => {
        invoiceElement.style.display = "none"; // PDF化が終わったらまた隠す
    });
}