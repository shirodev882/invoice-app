function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const client = document.getElementById("clientName").value;
    const amount = document.getElementById("amount").value;
    const item = document.getElementById("itemName").value;

    doc.setFontSize(22);
    doc.text("INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("To: " + client, 20, 40);
    doc.text("Item: " + item, 20, 60);
    doc.text("Total: $" + amount, 20, 80);

    doc.save("seikyusho.pdf");
}