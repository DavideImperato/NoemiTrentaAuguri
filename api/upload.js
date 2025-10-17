export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { imageData, filename } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: "Nessuna immagine ricevuta" });
  }

  try {
    // Preleva la chiave API da Vercel
    const apiKey = process.env.FREEIMAGE_API_KEY;

    // Invia la foto a FreeImage.host
    const response = await fetch(
      `https://freeimage.host/api/1/upload?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: imageData, // base64 completa: "data:image/png;base64,..."
          format: "json",
          name: filename || "foto_noemi.png",
        }),
      }
    );

    const data = await response.json();

    if (!data?.image?.url) {
      console.error("Errore risposta API:", data);
      throw new Error("Errore upload su FreeImage");
    }

    // ✅ Successo
    res.status(200).json({
      success: true,
      link: data.image.url,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    res.status(500).json({ error: "Errore durante l'upload" });
  }
}
