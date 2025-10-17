import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Metodo non consentito" });

  try {
    const { imageData, filename } = req.body;
    if (!imageData) return res.status(400).json({ error: "Nessuna immagine ricevuta" });

    const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    // 🔹 Salva nella cartella 'uploads/'
    const { data, error } = await supabase.storage
      .from("noemi30")
      .upload(`uploads/${filename}`, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    // 🔹 Ottieni URL pubblico o privato
    const { data: publicUrl } = supabase.storage
      .from("noemi30")
      .getPublicUrl(`uploads/${filename}`);

    res.status(200).json({
      success: true,
      link: publicUrl.publicUrl,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    res.status(500).json({ error: error.message });
  }
}
