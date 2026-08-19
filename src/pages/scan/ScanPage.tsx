import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ScanLine, Package, CreditCard, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { parseQrValue, formatCurrency, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Card as CardType } from "@/lib/types";

export function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CardType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(false);
    setResult(null);
    setNotFound(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      scanningRef.current = true;
      requestAnimationFrame(scanLoop);
    } catch {
      setCameraError(true);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const scanLoop = async () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const jsqr = (await import("jsqr")).default;
          const code = jsqr(imageData.data, imageData.width, imageData.height);
          if (code) {
            await handleQrResult(code.data);
            return;
          }
        } catch {
          // jsqr not loaded yet
        }
      }
    }
    if (scanningRef.current) requestAnimationFrame(scanLoop);
  };

  const handleQrResult = async (qrValue: string) => {
    const parsed = parseQrValue(qrValue);
    if (!parsed || parsed.type !== "card") {
      toast.error("Not a valid DatCARDVault QR code");
      return;
    }

    stopCamera();

    const { data: card } = await supabase
      .from("cards")
      .select("*")
      .eq("id", parsed.cardId)
      .eq("user_id", user!.id)
      .maybeSingle();

    if (card) {
      setResult(card as CardType);
      await supabase.from("scan_logs").insert({
        user_id: user!.id,
        card_id: card.id,
        qr_value: qrValue,
        scanned_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } else {
      setNotFound(true);
    }
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    const cardId = manualInput.trim();
    const { data: card } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", user!.id)
      .maybeSingle();
    if (card) {
      setResult(card as CardType);
      setNotFound(false);
      await supabase.from("scan_logs").insert({
        user_id: user!.id,
        card_id: card.id,
        qr_value: `datcardvault://card/${cardId}`,
        scanned_at: new Date().toISOString(),
      });
    } else {
      setNotFound(true);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display font-bold text-xl text-app mb-4">Scan QR Code</h1>

      <canvas ref={canvasRef} className="hidden" />

      {!scanning && !result && !notFound && (
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-600/10 flex items-center justify-center mb-4">
              <ScanLine className="w-10 h-10 text-primary-600" />
            </div>
            <p className="text-sm text-app-secondary mb-1">Scan a card's QR label</p>
            <p className="text-xs text-app-muted mb-4">Point your camera at a DatCARDVault QR code</p>
            {cameraError && (
              <p className="text-xs text-error-500 mb-3">Camera access denied. Check permissions or use manual entry below.</p>
            )}
            <Button onClick={startCamera}>
              <ScanLine className="w-4 h-4" /> Start Scanning
            </Button>
          </div>
        </Card>
      )}

      {scanning && (
        <Card className="overflow-hidden">
          <div className="relative w-full aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary-500 rounded-2xl" />
            </div>
            <button onClick={stopCamera} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 text-center">
            <p className="text-sm text-app-muted">Scanning...</p>
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-4 animate-scale-in">
          <div className="flex items-center gap-3 mb-3">
            <Check className="w-6 h-6 text-success-500" />
            <p className="font-display font-bold text-lg text-app">Card Found!</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-lg bg-app-tertiary flex items-center justify-center overflow-hidden">
              {result.image_storage_id ? (
                <img src={getImageUrl(result.image_storage_id) || ""} alt={result.name} className="w-full h-full object-cover" />
              ) : (
                <CreditCard className="w-6 h-6 text-app-muted" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-app">{result.name}</p>
              <p className="text-xs text-app-muted">{result.game} · {result.condition}</p>
              <p className="font-semibold text-app mt-1">{formatCurrency(result.market_value, user?.currency || "GBP")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setManualInput(""); }}>
              Scan Again
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/cards/${result.id}`)}>View Card</Button>
          </div>
        </Card>
      )}

      {notFound && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <X className="w-5 h-5 text-error-500" />
            <p className="font-medium text-app">Card not found</p>
          </div>
          <p className="text-sm text-app-muted mb-4">This QR code doesn't match any card in your inventory.</p>
          <Button variant="outline" className="w-full" onClick={() => { setNotFound(false); setManualInput(""); }}>
            Try Again
          </Button>
        </Card>
      )}

      {!scanning && !result && (
        <Card className="p-4 mt-4">
          <p className="text-sm font-medium text-app mb-2">Manual Entry</p>
          <p className="text-xs text-app-muted mb-3">Enter a card ID directly</p>
          <div className="flex gap-2">
            <Input value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Card ID" />
            <Button onClick={handleManualSearch}>Search</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
