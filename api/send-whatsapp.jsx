// 📁 api/send-whatsapp.js
export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { phone, mensaje } = req.body;

  // Validar datos
  if (!phone || !mensaje) {
    return res.status(400).json({ error: "Faltan datos (phone o mensaje)" });
  }

  try {
    const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    const TOKEN = process.env.WHATSAPP_TOKEN;

    if (!PHONE_ID || !TOKEN) {
      return res.status(500).json({ error: "Faltan variables de entorno en el servidor" });
    }

    // Endpoint oficial Meta v22
    const url = `https://graph.facebook.com/v22.0/${PHONE_ID}/messages`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,     // ejemplo: 1 555 646 1480
        
        type: "text",
        text: { body: mensaje },
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("❌ Error al enviar:", data);
      return res.status(500).json({ error: data });
    }

    // ✅ Respuesta exitosa
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("⚠️ Error interno al enviar WhatsApp:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
