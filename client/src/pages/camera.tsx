import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Download, CheckCircle, Upload, Heart, FileText, ImagePlus } from "lucide-react";
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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const initializeGoogleDrive = async () => {
    if (!isGapiLoaded) {
      toast({
        title: "Caricamento in corso...",
        description: "Google Drive API si sta inizializzando",
      });
      return;
    }

    try {
      await window.gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_CLIENT_ID, // TODO: Inserisci qui la tua API_KEY da Google Cloud Console
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      });

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_SECRET, // TODO: Inserisci qui il tuo CLIENT_ID da Google Cloud Console
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (response: any) => {
          if (response.error) {
            toast({
              title: "Errore di autenticazione",
              description: response.error,
              variant: "destructive",
            });
          } else {
            setIsSignedIn(true);
            toast({
              title: "Autenticazione riuscita",
              description: "Sei connesso a Google Drive!",
            });
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error("Errore inizializzazione Google Drive:", error);
      toast({
        title: "Errore",
        description: "Impossibile connettersi a Google Drive",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Fotocamera non supportata",
        description:
          "Questo dispositivo o browser non supporta l'accesso alla fotocamera.",
        variant: "destructive",
      });
      return;
    }

    const constraints = {
      video: {
        facingMode: { ideal: "user" }, // usa "environment" per quella posteriore
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;

      // 👇 nuovo fix: forza la riproduzione anche su Safari e Chrome mobile
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video avviato correttamente");
          })
          .catch((err) => {
            console.warn("Autoplay bloccato, serve click manuale:", err);
          });
      }
    }

    setStream(mediaStream);
    setIsCameraActive(true);

    toast({
      title: "Fotocamera attiva!",
      description: "Puoi scattare la foto appena vedi il video.",
    });
  } catch (error) {
    console.error("Errore accesso fotocamera:", error);
    toast({
      title: "Errore fotocamera",
      description:
        "Verifica i permessi e che il sito sia aperto in HTTPS (non dentro app come Instagram).",
      variant: "destructive",
    });
  }
};

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

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);

      toast({
        title: "Foto scattata!",
        description: "La cornice è stata applicata",
      });
    };
  };

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

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

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

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const uploadToGoogleDrive = async () => {
    if (!capturedPhoto || !originalPhoto) return;

    if (!isSignedIn) {
      await initializeGoogleDrive();
      return;
    }

    setIsLoading(true);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filenameOriginal = `Noemi30_${timestamp}_originale.png`;
      const filenameWithFrame = `Noemi30_${timestamp}_cornice.png`;

      const blobOriginal = await fetch(originalPhoto).then((r) => r.blob());
      const blobWithFrame = await fetch(capturedPhoto).then((r) => r.blob());

      const metadataOriginal = {
        name: filenameOriginal,
        mimeType: "image/png",
      };

      const metadataWithFrame = {
        name: filenameWithFrame,
        mimeType: "image/png",
      };

      const formOriginal = new FormData();
      formOriginal.append(
        "metadata",
        new Blob([JSON.stringify(metadataOriginal)], { type: "application/json" })
      );
      formOriginal.append("file", blobOriginal);

      const formWithFrame = new FormData();
      formWithFrame.append(
        "metadata",
        new Blob([JSON.stringify(metadataWithFrame)], { type: "application/json" })
      );
      formWithFrame.append("file", blobWithFrame);

      const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      const authHeader = {
        Authorization: `Bearer ${window.gapi.client.getToken().access_token}`,
      };

      const [responseOriginal, responseWithFrame] = await Promise.all([
        fetch(uploadUrl, {
          method: "POST",
          headers: authHeader,
          body: formOriginal,
        }),
        fetch(uploadUrl, {
          method: "POST",
          headers: authHeader,
          body: formWithFrame,
        }),
      ]);

      if (responseOriginal.ok && responseWithFrame.ok) {
        toast({
          title: "Foto salvate nel Drive del compleanno di Noemi!",
          description: `2 file salvati: originale e con cornice`,
        });
        setCapturedPhoto(null);
        setOriginalPhoto(null);
      } else {
        throw new Error("Upload fallito");
      }
    } catch (error) {
      console.error("Errore upload Google Drive:", error);
      toast({
        title: "Errore salvataggio",
        description: "Impossibile salvare la foto su Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    
    if (photoSource === "camera") {
      startCamera();
    }
    setPhotoSource(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-secondary via-background to-accent/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary/40 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4 mb-8">
            <h1
              className="text-6xl md:text-8xl font-serif text-primary drop-shadow-lg"
              data-testid="text-title"
            >
              Buon 30° Compleanno Noemi!
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light" data-testid="text-subtitle">
              Scatta una foto ricordo con la cornice speciale
            </p>
          </div>

          {!capturedPhoto ? (
            <Card className="overflow-hidden shadow-2xl border-2" data-testid="card-camera">
              <div className="relative bg-card">
                {isCameraActive ? (
                  <div className="relative aspect-[3/4] bg-black">
                    <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  onClick={() => videoRef.current?.play()} // 👈 Safari richiede un tap per partire
  className="w-full h-full object-cover bg-black"
  style={{ minHeight: "300px", maxHeight: "80vh", borderRadius: "8px" }}
  data-testid="video-camera"
/>

                    <div className="absolute inset-0 pointer-events-none">
                      <img
                        src={frameImage}
                        alt="Cornice"
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-secondary/20 to-accent/20">
                    <div className="text-center space-y-4 p-8">
                      <Camera className="w-20 h-20 mx-auto text-primary opacity-30" />
                      <p className="text-muted-foreground">
                        Premi il pulsante per attivare la fotocamera
                      </p>
                    </div>
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
                  data-testid="input-file"
                />
                {isCameraActive ? (
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="w-full text-lg"
                    data-testid="button-capture"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scatta la Foto
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={startCamera}
                      size="lg"
                      className="w-full text-lg"
                      data-testid="button-start-camera"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Attiva Fotocamera
                    </Button>
                    <Button
                      onClick={openGallery}
                      size="lg"
                      variant="outline"
                      className="w-full text-lg"
                      data-testid="button-open-gallery"
                    >
                      <ImagePlus className="mr-2 h-5 w-5" />
                      Scegli dalla Galleria
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden shadow-2xl border-2" data-testid="card-preview">
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Foto scattata"
                  className="w-full h-auto"
                  data-testid="img-captured"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2" data-testid="status-photo-ready">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Foto pronta!</span>
                </div>
              </div>

              <div className="p-6 space-y-3 bg-card">
                <Button
                  onClick={uploadToGoogleDrive}
                  size="lg"
                  className="w-full text-lg"
                  disabled={isLoading}
                  data-testid="button-upload"
                >
                  {isLoading ? (
                    <>Caricamento in corso...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Salva su Google Drive
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={downloadPhoto}
                    variant="outline"
                    size="lg"
                    data-testid="button-download"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    size="lg"
                    data-testid="button-retake"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Rifai
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="text-center space-y-4">
            <div className="bg-accent/30 backdrop-blur-sm rounded-lg p-4 border border-accent">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-foreground/70 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-foreground/70">
                    <strong>Nota:</strong> Per salvare le foto su Google Drive, è necessario configurare
                    le credenziali API nel file <code className="bg-background/50 px-2 py-1 rounded text-xs">client/src/pages/camera.tsx</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cerca "TODO" nel codice per trovare dove inserire CLIENT_ID e API_KEY
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center bg-secondary/30 backdrop-blur-sm border-t" data-testid="footer">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-foreground/80 font-light">
            Creato con amore per Noemi
          </p>
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <p className="text-sm text-foreground/80 font-light">
            da Davide
          </p>
        </div>
      </footer>
    </div>
  );
}
