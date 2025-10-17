export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { imageData, filename } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "Nessuna immagine ricevuta" });
    }

    const apiKey = process.env.FREEIMAGE_API_KEY || "anonymous";

    // ✅ Rimuove "data:image/png;base64," se presente
    const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");

    // ✅ Crea il corpo della richiesta JSON come indicato nella documentazione
    const body = {
      key: apiKey,
      action: "upload",
      source: cleanBase64,
      format: "json",
    };

    const response = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("📦 Risposta API:", data);

    if (!data?.image?.url) {
      console.error("❌ Errore risposta API:", data);
      return res.status(400).json({
        error: "Errore risposta API FreeImage",
        details: data,
      });
    }

    res.status(200).json({
      success: true,
      link: data.image.url,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    res.status(500).json({ error: "Errore durante l'upload", details: error.message });
  }
}
