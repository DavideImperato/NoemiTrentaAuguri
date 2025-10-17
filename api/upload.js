import { createClient } from "@supabase/supabase-js";
import Busboy from "busboy";

export const config = {
  api: {
    bodyParser: false, // Disattiva parsing automatico
  },
  runtime: "nodejs", // ✅ Forza runtime Node.js (non Edge)
};

// Inizializza Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const busboy = Busboy({ headers: req.headers });
    const fileBuffers = [];

    let filename = `noemi30_${Date.now()}.jpg`;

    // 🔍 Cattura file
    busboy.on("file", (fieldname, file, info) => {
      filename = info.filename || filename;
      file.on("data", (data) => fileBuffers.push(data));
    });

    // ✅ Quando finisce di leggere
    busboy.on("finish", async () => {
      const fileBuffer = Buffer.concat(fileBuffers);

      console.log(`📸 Ricevuto file: ${filename} (${fileBuffer.length} bytes)`);

      const { data, error } = await supabase.storage
        .from("noemi30")
        .upload(filename, fileBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("❌ Errore Supabase:", error);
        return res.status(500).json({ error: error.message });
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/noemi30/${filename}`;
      return res.status(200).json({ url: publicUrl });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error("❌ Errore generale:", err);
    return res.status(500).json({ error: err.message });
  }
}
