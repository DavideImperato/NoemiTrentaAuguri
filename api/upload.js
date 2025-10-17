import { createClient } from "@supabase/supabase-js";

// ✅ Inizializza Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Gestione POST con FormData
export const config = {
  api: {
    bodyParser: false, // ❗ Disabilita il body parser JSON di default
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    // 🔍 Legge il corpo della richiesta come FormData
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const data = Buffer.concat(buffers);
    const boundary = req.headers["content-type"].split("boundary=")[1];
    const parts = data.toString().split(`--${boundary}`);

    // 🔎 Cerca il file nel FormData
    const filePart = parts.find((part) => part.includes("filename="));
    if (!filePart) {
      return res.status(400).json({ error: "Nessun file trovato" });
    }

    const match = filePart.match(/filename="(.+)"/);
    const filename = match ? match[1] : `foto-${Date.now()}.jpg`;

    // Rimuove header e prende solo il contenuto binario
    const fileContent = filePart.split("\r\n\r\n")[1];
    const end = fileContent.lastIndexOf("\r\n");
    const fileBuffer = Buffer.from(fileContent.slice(0, end), "binary");

    // 📤 Upload su Supabase Storage
    const { data: uploaded, error } = await supabase.storage
      .from("noemi30") // <-- usa il nome esatto del tuo bucket
      .upload(filename, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("❌ Errore upload:", error);
      return res.status(500).json({ error: error.message });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/noemi30/${filename}`;

    return res.status(200).json({ message: "✅ Upload completato", url: publicUrl });
  } catch (err) {
    console.error("❌ Errore generale:", err);
    return res.status(500).json({ error: err.message });
  }
}
