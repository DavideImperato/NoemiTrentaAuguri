import { google } from "googleapis";
import { Readable } from "stream";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Metodo non consentito" });
    }

    const { imageData, filename } = req.body;
    if (!imageData || !filename) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    // 🔐 Carica le credenziali OAuth (dal tuo account)
    const credentials = JSON.parse(process.env.GOOGLE_OAUTH_CREDENTIALS);
    const token = JSON.parse(process.env.GOOGLE_OAUTH_TOKEN);

    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    oAuth2Client.setCredentials(token);

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    // 📸 Decodifica l’immagine base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const stream = Readable.from(buffer);

    // 📁 Metadati file
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "image/png",
      body: stream,
    };

    // 📤 Upload file
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink",
    });

    // 🔓 Rende la foto accessibile pubblicamente
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    res.status(200).json({
      success: true,
      link: file.data.webViewLink,
      id: file.data.id,
    });
  } catch (error) {
    console.error("❌ Errore upload:", error);
    res.status(500).json({ error: error.message });
  }
}
