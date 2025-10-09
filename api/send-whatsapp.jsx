// 📁 api/send-whatsapp.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { phone, mensaje } = req.body;

  if (!phone || !mensaje) {
    return res.status(400).json({ error: "Faltan datos (phone o mensaje)" });
  }

  try {
    // Variables privadas
    const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    const TOKEN = process.env.WHATSAPP_TOKEN;

    const resp = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: mensaje },
      }),
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(500).json({ error: data });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error al enviar WhatsApp:", error);
    res.status(500).json({ error: "Error interno" });
  }
}
