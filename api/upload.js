import { google } from "googleapis";
import fs from "fs";

// ✅ Configurazione handler API per Vercel
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    // ✅ Carica il token OAuth salvato
    const token = JSON.parse(process.env.GOOGLE_OAUTH_TOKEN_JSON);
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

    const { client_id, client_secret, redirect_uris } = credentials.web;

    // ✅ Inizializza l'OAuth2 client con le tue credenziali
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const body = req.body || JSON.parse(await new Promise(res => {
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => res(data));
}));

const { imageData, filename } = body;

    if (!imageData) {
      return res.status(400).json({ error: "Nessuna immagine ricevuta" });
    }

    // ✅ Converte la base64 in buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // ✅ Crea il file su Google Drive
    const fileMetadata = {
      name: filename || `Noemi30_${Date.now()}.png`,
      parents: ["root"], // puoi sostituire con un ID di cartella se vuoi
    };

    const media = {
      mimeType: "image/png",
      body: Buffer.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    console.log("✅ File caricato:", response.data);

    return res.status(200).json({
      message: "Foto salvata su Google Drive!",
      link: response.data.webViewLink,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    return res.status(500).json({ error: error.message });
  }
}
