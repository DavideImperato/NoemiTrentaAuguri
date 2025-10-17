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
  FileText,
  ImagePlus,
} from "lucide-react";
import frameImage from "@assets/generated_images/Birthday_photo_frame_overlay_53195203.png";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

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
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { toast } = useToast();

  // --- Google API load ---
  useEffect(() => {
    const loadGoogleAPI = () => {
      const script1 = document.createElement("script");
      script1.src = "https://apis.google.com/js/api.js";
      script1.async = true;
      script1.defer = true;
      script1.onload = () => {
        window.gapi.load("client", () => {
          setIsGapiLoaded(true);
        });
      };
      document.body.appendChild(script1);

      const script2 = document.createElement("script");
      script2.src = "https://accounts.google.com/gsi/client";
      script2.async = true;
      script2.defer = true;
      document.body.appendChild(script2);
    };

    loadGoogleAPI();
  }, []);

  // --- stop stream on unmount ---
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  // --- Start camera (iOS safe version) ---
  const startCamera = () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      console.error("Elemento video non trovato");
      return;
    }

    // impostazioni essenziali per iOS
    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("autoplay", "true");
    videoElement.setAttribute("muted", "true");
    videoElement.muted = true;

    const constraints = {
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    console.log("🎥 Tentativo accesso fotocamera...");
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((mediaStream) => {
        console.log("✅ Stream ottenuto");
        videoElement.srcObject = mediaStream;

        // forza il play immediato su iOS
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("⚠️ video.play() fallito:", err);
          });
        }

        setStream(mediaStream);
        setIsCameraActive(true);
        toast({
          title: "📸 Fotocamera attiva",
          description: "Pronta per scattare!",
        });
      })
      .catch((error) => {
        console.error("❌ Errore accesso fotocamera:", error);
        let message = "Impossibile accedere alla fotocamera.";
        if (error.name === "NotAllowedError")
          message = "Accesso negato. Verifica i permessi.";
        else if (error.name === "NotReadableError")
          message = "La fotocamera è in uso da un'altra app.";
        else if (error.name === "NotFoundError")
          message = "Nessuna fotocamera rilevata.";

        toast({
          title: "Errore fotocamera",
          description: message,
          variant: "destructive",
        });
      });
  };

  // --- Capture photo ---
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const originalPhotoDataUrl = canvas.toDataURL("image/png");
    setOriginalPhoto(originalPhotoDataUrl);
    setPhotoSource("camera");

    const frame = new Image();
    frame.src = frameImage;
    frame.onload = () => {
      context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL("image/png");
      setCapturedPhoto(photoDataUrl);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
      toast({
        title: "Foto scattata!",
        description: "La cornice è stata applicata",
      });
    };
  };

  // --- File upload ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setOriginalPhoto(imageDataUrl);
      setPhotoSource("gallery");

      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const frame = new Image();
        frame.src = frameImage;
        frame.onload = () => {
          context.drawImage(frame, 0, 0, canvas.width, canvas.height);
          const photoWithFrame = canvas.toDataURL("image/png");
          setCapturedPhoto(photoWithFrame);
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast({
            title: "Foto caricata!",
            description: "Cornice applicata con successo",
          });
        };
      };
      img.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const openGallery = () => fileInputRef.current?.click();

  // --- Download ---
  const downloadPhoto = () => {
    if (!capturedPhoto) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = capturedPhoto;
    link.download = `Noemi30_${timestamp}.png`;
    link.click();
    toast({
      title: "Download completato",
      description: "Foto salvata sul dispositivo",
    });
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setOriginalPhoto(null);
    if (photoSource === "camera") startCamera();
    setPhotoSource(null);
  };

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
                {/* VIDEO SEMPRE PRESENTE */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    isCameraActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                {/* CORNICE */}
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={frameImage}
                    alt="Cornice"
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                {/* OVERLAY */}
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
                    <Camera className="mr-2 h-5 w-5" />
                    Scatta la Foto
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={startCamera}
                      size="lg"
                      className="w-full text-lg"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Attiva Fotocamera
                    </Button>
                    <Button
                      onClick={openGallery}
                      size="lg"
                      variant="outline"
                      className="w-full text-lg"
                    >
                      <ImagePlus className="mr-2 h-5 w-5" />
                      Scegli dalla Galleria
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden shadow-2xl border-2">
              <div className="relative">
                <img src={capturedPhoto} alt="Foto scattata" className="w-full h-auto" />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Foto pronta!</span>
                </div>
              </div>

              <div className="p-6 space-y-3 bg-card">
                <Button onClick={downloadPhoto} size="lg" className="w-full text-lg">
                  <Download className="mr-2 h-5 w-5" /> Download
                </Button>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  size="lg"
                  className="w-full text-lg"
                >
                  <Camera className="mr-2 h-5 w-5" /> Rifai
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      <footer className="py-6 text-center bg-secondary/30 backdrop-blur-sm border-t">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-foreground/80 font-light">Creato con amore per Noemi</p>
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <p className="text-sm text-foreground/80 font-light">da Davide</p>
        </div>
      </footer>
    </div>
  );
}
