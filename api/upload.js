import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Metodo non consentito" });
    }

    const { imageData, filename } = req.body;
    if (!imageData || !filename) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    // 🔐 Carica le credenziali del service account
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 🧩 Rimuove il prefisso data:image/png;base64,
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 📁 Upload verso Drive
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "image/png",
      body: Buffer.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: "image/png",
        body: buffer, // ✅ Passiamo direttamente il buffer, non una stringa
      },
      fields: "id, name, webViewLink",
    });

    const file = response.data;
    console.log("✅ Upload completato:", file);

    return res.status(200).json({
      success: true,
      link: file.webViewLink,
      id: file.id,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    return res.status(500).json({ error: error.message });
  }
}