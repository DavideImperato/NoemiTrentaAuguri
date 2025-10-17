import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { image, fileName } = req.body;
    if (!image) return res.status(400).json({ error: "Nessuna immagine ricevuta" });

    // 🔐 Carica le credenziali dal tuo file JSON (salvato su Vercel come variabile)
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 📂 ID della cartella condivisa in Drive
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 📸 Converte il base64 in buffer
    const buffer = Buffer.from(image.split(",")[1], "base64");

    const fileMetadata = {
      name: fileName || `Noemi30_${Date.now()}.png`,
      parents: [folderId],
    };

    const media = {
      mimeType: "image/png",
      body: Buffer.from(buffer),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: { mimeType: "image/png", body: buffer },
      fields: "id, name, webViewLink",
    });

    res.status(200).json({ success: true, file: response.data });
  } catch (err) {
    console.error("Errore upload:", err);
    res.status(500).json({ error: "Errore durante l'upload su Drive" });
  }
}
