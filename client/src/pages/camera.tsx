import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Download,
  CheckCircle,
  Upload,
  Heart,
  ImagePlus,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import frameImage from "@assets/generated_images/Birthday_photo_frame_overlay_53195203.png";

// 🔗 Inizializza Supabase (usando variabili da .env)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<"camera" | "gallery" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  // ✅ Stop fotocamera su unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // ✅ Avvia la fotocamera (compatibile iPhone)
  const startCamera = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("autoplay", "true");
    videoElement.setAttribute("muted", "true");
    videoElement.muted = true;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((mediaStream) => {
        videoElement.srcObject = mediaStream;
        videoElement.play().catch(() => {});
        setStream(mediaStream);
        setIsCameraActive(true);
        toast({ title: "📸 Fotocamera attiva", description: "Pronta per scattare!" });
      })
      .catch((error) => {
        console.error("❌ Errore fotocamera:", error);
        let msg = "Impossibile accedere alla fotocamera.";
        if (error.name === "NotAllowedError")
          msg = "Accesso negato. Verifica i permessi.";
        else if (error.name === "NotFoundError")
          msg = "Nessuna fotocamera trovata.";
        toast({ title: "Errore fotocamera", description: msg, variant: "destructive" });
      });
  };

  // ✅ Scatta foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const original = canvas.toDataURL("image/png");
    setOriginalPhoto(original);
    setPhotoSource("camera");

    const frame = new Image();
    frame.src = frameImage;
    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/png");
      setCapturedPhoto(photo);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setIsCameraActive(false);
      toast({ title: "✅ Foto scattata", description: "Cornice applicata!" });
    };
  };

  // ✅ Upload diretto su Supabase
  const uploadToSupabase = async () => {
    if (!capturedPhoto) {
      toast({
        title: "Errore",
        description: "Nessuna foto trovata da caricare",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const blob = await (await fetch(capturedPhoto)).blob();
      const fileName = `Noemi30_${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from("noemi30")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/noemi30/${fileName}`;

      toast({
        title: "✅ Foto salvata!",
        description: "Caricata correttamente su Supabase.",
      });

      console.log("📤 Upload riuscito:", publicUrl);
    } catch (error) {
      console.error("❌ Errore upload:", error);
      toast({
        title: "Errore upload",
        description: "Impossibile salvare la foto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Gestione immagini da galleria
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine valida",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const frame = new Image();
        frame.src = frameImage;
        frame.onload = () => {
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
          setCapturedPhoto(canvas.toDataURL("image/png"));
          toast({
            title: "✅ Foto caricata",
            description: "Cornice applicata correttamente",
          });
        };
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openGallery = () => fileInputRef.current?.click();
  const downloadPhoto = () => {
    if (!capturedPhoto) return;
    const link = document.createElement("a");
    link.href = capturedPhoto;
    link.download = `Noemi30_${new Date().toISOString()}.png`;
    link.click();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setOriginalPhoto(null);
    if (photoSource === "camera") startCamera();
  };

  // ✅ UI
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-secondary via-background to-accent/30">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-6xl md:text-8xl font-serif text-primary drop-shadow-lg">
              Buon 30° Compleanno Noemi!
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light">
              Scatta una foto ricordo con la cornice speciale
            </p>
          </div>

          {!capturedPhoto ? (
            <Card className="overflow-hidden shadow-2xl border-2">
              <div className="relative aspect-[3/4] bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    isCameraActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={frameImage}
                    alt="Cornice"
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/20 to-accent/20 z-10">
                    <Camera className="w-20 h-20 text-primary opacity-30" />
                    <p className="text-muted-foreground mt-2">
                      Premi il pulsante per attivare la fotocamera
                    </p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="p-6 space-y-4 bg-card">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isCameraActive ? (
                  <Button onClick={capturePhoto} size="lg" className="w-full text-lg">
                    <Camera className="mr-2 h-5 w-5" /> Scatta la Foto
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button onClick={startCamera} size="lg" className="w-full text-lg">
                      <Camera className="mr-2 h-5 w-5" /> Attiva Fotocamera
                    </Button>
                    <Button
                      onClick={openGallery}
                      size="lg"
                      variant="outline"
                      className="w-full text-lg"
                    >
                      <ImagePlus className="mr-2 h-5 w-5" /> Scegli dalla Galleria
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden shadow-2xl border-2">
              <div className="relative">
                <img src={capturedPhoto} alt="Foto scattata" className="w-full h-auto" />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Foto pronta!</span>
                </div>
              </div>

              <div className="p-6 space-y-3 bg-card">
                <Button
                  onClick={uploadToSupabase}
                  size="lg"
                  className="w-full text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Caricamento..." : (
                    <>
                      <Upload className="mr-2 h-5 w-5" /> Salva ricordo
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={downloadPhoto} variant="outline" size="lg">
                    <Download className="mr-2 h-5 w-5" /> Download
                  </Button>
                  <Button onClick={retakePhoto} variant="outline" size="lg">
                    <Camera className="mr-2 h-5 w-5" /> Rifai
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <footer className="py-6 text-center bg-secondary/30 backdrop-blur-sm border-t">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-foreground/80 font-light">
            Creato con amore per Noemi
          </p>
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <p className="text-sm text-foreground/80 font-light">da Davide</p>
        </div>
      </footer>
    </div>
  );
}
