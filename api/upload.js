import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Carica le credenziali del service account
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 📸 Dati inviati dal client
    const { image, fileName } = req.body;

    if (!image || !fileName) {
      return res.status(400).json({ error: "Dati mancanti: image o fileName" });
    }

    // 🔄 Converte la stringa base64 in Buffer binario
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 📁 Crea il file su Google Drive
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "image/png",
      body: BufferToStream(imageBuffer), // 👈 serve come stream
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, name, webViewLink",
    });

    console.log("✅ Upload completato:", response.data);

    return res.status(200).json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error("Errore upload:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 🧩 Utility: converte un Buffer in Stream
import { Readable } from "stream";
function BufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}
