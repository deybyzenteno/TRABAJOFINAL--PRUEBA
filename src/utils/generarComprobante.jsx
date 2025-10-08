import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generarComprobantePDF(servicio, cliente, urlSeguimiento) {
    const doc = new jsPDF();

    // Logo (si tienes)
    // doc.addImage(logoDataUrl, "PNG", 10, 10, 50, 20);

    doc.setFontSize(18);
    doc.text("Comprobante de Servicio", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text(`ID Servicio: ${servicio.id}`, 10, 40);
    doc.text(`Cliente: ${cliente.nombreCompleto}`, 10, 50);
    doc.text(`Marca: ${servicio.marcaProducto}`, 10, 60);
    doc.text(`Tipo de Servicio: ${servicio.tipoServicio}`, 10, 70);
    doc.text(`Detalles: ${servicio.detalles || "N/A"}`, 10, 80);
    doc.text(`Estado: ${servicio.estado}`, 10, 90);
    doc.text(`Fecha Entrada: ${new Date(servicio.fechaEntrada).toLocaleDateString()}`, 10, 100);
    if (servicio.fechaSalida) {
        doc.text(`Fecha Salida: ${new Date(servicio.fechaSalida).toLocaleDateString()}`, 10, 110);
    }

    doc.text("Presupuesto:", 10, 120);
    let y = 130;
    servicio.presupuesto.items.forEach((item) => {
        doc.text(`${item.descripcion}: $${item.costo.toFixed(2)}`, 15, y);
        y += 10;
    });
    doc.text(`Total: $${servicio.presupuesto.total.toFixed(2)}`, 10, y + 5);

    // Generar QR y agregar al PDF
    const qrDataUrl = await QRCode.toDataURL(urlSeguimiento);
    doc.addImage(qrDataUrl, "PNG", 150, 20, 50, 50);

    return doc;
}
