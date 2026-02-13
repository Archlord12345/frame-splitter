import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Scissors, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VideoDropzone from "@/components/VideoDropzone";
import ExtractionControls from "@/components/ExtractionControls";
import FrameGallery from "@/components/FrameGallery";
import WaveSurferPlayer from "@/components/WaveSurferPlayer";
import {
  captureFrame,
  extractByInterval,
  extractByCount,
  generateFrameId,
  type MediaSnippet,
  type ExtractedFrame,
  type ExtractionMode,
  type ImageFormat,
} from "@/lib/video-extractor";
import { toast } from "@/hooks/use-toast";

const SESSION_ID = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const Extract = () => {
  // Generate a unique session ID for cleanup tracking
  const sessionIdRef = useRef(SESSION_ID);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Cleanup function when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        'http://localhost:3001/api/cleanup',
        JSON.stringify({})
      );
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const [mode, setMode] = useState<ExtractionMode>("interval");
  const [interval, setInterval_] = useState(2);
  const [frameCount, setFrameCount] = useState(10);
  const [format, setFormat] = useState<ImageFormat>("png");

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<MediaSnippet[]>([]);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isAudio, setIsAudio] = useState(false);
  const [serverFilename, setServerFilename] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("media", file);

    try {
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        headers: {
          'x-session-id': sessionIdRef.current,
        },
        body: formData,
      });
      const data = await response.json();
      setServerFilename(data.filename);
      toast({ title: "Fichier synchronisé avec le serveur" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erreur de synchronisation serveur", variant: "destructive" });
    }
  };

  const handleVideoSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setSourceLabel(file.name);
    setFrames([]);
    setProgress(0);
    setIsAudio(file.type.startsWith("audio/"));
    uploadFile(file);
  }, []);

  const [urlLoading, setUrlLoading] = useState(false);

  const handleUrlSelect = useCallback(async (url: string) => {
    setUrlLoading(true);
    setSourceLabel(url);
    setFrames([]);
    setProgress(0);
    
    try {
      const response = await fetch("http://localhost:3001/api/download-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionIdRef.current,
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.hint || "Failed to download");
      }
      
      // Use the downloaded file from server
      const serverUrl = `http://localhost:3001${data.path}`;
      setVideoUrl(serverUrl);
      setServerFilename(data.filename);
      setIsAudio(false); // Videos from URLs are treated as video by default
      
      toast({ 
        title: data.source === 'youtube' ? "Vidéo YouTube chargée" : "Média chargé",
        description: "Prêt pour l'extraction"
      });
    } catch (error: any) {
      console.error("URL download error:", error);
      toast({ 
        title: "Erreur de chargement",
        description: error.message || "Impossible de charger le média depuis cette URL",
        variant: "destructive"
      });
      // Reset on error
      setVideoUrl(null);
      setSourceLabel(null);
    } finally {
      setUrlLoading(false);
    }
  }, []);

  const handleMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
    }
  };

  const handleTrim = async () => {
    if (!serverFilename) {
      toast({ title: "Attente de la synchronisation serveur...", variant: "destructive" });
      return;
    }
    setExtracting(true);
    setProgress(0);

    try {
      const response = await fetch("http://localhost:3001/api/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: serverFilename,
          startTime,
          duration: endTime - startTime,
          isAudio,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const downloadUrl = `http://localhost:3001${data.path}`;
      const snippet: MediaSnippet = {
        id: generateFrameId(),
        timestamp: startTime,
        dataUrl: downloadUrl,
        type: isAudio ? "audio" : "video",
        selected: true,
        filename: data.filename,
      };

      setFrames((prev) => [...prev, snippet]);

      const downloadResponse = await fetch(downloadUrl);
      const blob = await downloadResponse.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `cut-${sourceLabel?.split(".")[0] || "media"}.${isAudio ? "mp3" : "mp4"}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({ title: isAudio ? "Extrait audio ajouté à la galerie" : "Extrait vidéo ajouté à la galerie" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors du découpage serveur", variant: "destructive" });
    } finally {
      setExtracting(false);
      setProgress(100);
    }
  };

  const handleExtract = async () => {
    if (!serverFilename) {
      toast({ title: "Attente de la synchronisation serveur...", variant: "destructive" });
      return handleExtractNative();
    }

    setExtracting(true);
    setProgress(0);
    setFrames([]);

    try {
      const response = await fetch("http://localhost:3001/api/extract-frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: serverFilename,
          mode,
          interval,
          count: frameCount,
          duration: videoDuration,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setFrames(data.frames.map((f: any) => ({ ...f, type: 'image' })));
      toast({ title: "Extraction haute performance terminée !" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur serveur, passage à l'extracteur natif", variant: "destructive" });
      handleExtractNative();
    } finally {
      setExtracting(false);
      setProgress(100);
    }
  };

  const handleExtractNative = async () => {
    if (!videoRef.current) return;
    setExtracting(true);
    setProgress(0);
    setFrames([]);

    const video = videoRef.current;
    const wasPaused = video.paused;
    if (!wasPaused) video.pause();

    try {
      const addFrame = (frame: ExtractedFrame) =>
        setFrames((prev) => [...prev, frame]);

      if (mode === "interval") {
        await extractByInterval(video, interval, format, setProgress, (f) => addFrame({ ...f, type: 'image' }));
      } else {
        await extractByCount(video, frameCount, format, setProgress, (f) => addFrame({ ...f, type: 'image' }));
      }
      toast({ title: "Extraction native terminée !" });
    } catch {
      toast({ title: "Erreur lors de l'extraction", variant: "destructive" });
    }
    setExtracting(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const dataUrl = captureFrame(videoRef.current, format);
    const frame: MediaSnippet = {
      id: generateFrameId(),
      timestamp: videoRef.current.currentTime,
      dataUrl,
      type: 'image',
      selected: true,
    };
    setFrames((prev) => [...prev, frame]);
    toast({ title: `Image capturée à ${videoRef.current.currentTime.toFixed(2)}s` });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <nav className="sticky top-0 z-50 flex items-center gap-3 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2 rounded-full shadow-sm pr-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <img src="/logo/logo.png" alt="InstantCut" className="h-7 w-7 object-contain" />
          <h1 className="text-lg font-semibold">Extraction vidéo</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {!videoUrl ? (
          <VideoDropzone
            onVideoSelect={handleVideoSelect}
            onUrlSelect={handleUrlSelect}
            urlLoading={urlLoading}
          />
        ) : (
          <>
            <div className="grid lg:grid-cols-[1fr_340px] gap-8">
              {/* Video player */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-foreground/5 border border-border">
                  {isAudio ? (
                    <div className="p-8">
                      <WaveSurferPlayer
                        url={videoUrl}
                        onReady={(d) => {
                          setVideoDuration(d);
                          setEndTime(d);
                        }}
                        onTimeUpdate={(t) => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = t;
                          }
                        }}
                        startTime={startTime}
                        endTime={endTime}
                      />
                      {/* Hidden audio element for duration tracking if needed, 
                          but WaveSurfer handles it better */}
                      <audio ref={videoRef} src={videoUrl} className="hidden" />
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      className="w-full"
                      onLoadedMetadata={handleMetadata}
                    />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVideoUrl(null);
                    setSourceLabel(null);
                    setFrames([]);
                  }}
                >
                  Changer de vidéo
                </Button>
                {sourceLabel && (
                  <p className="text-xs text-muted-foreground break-all">
                    Source: {sourceLabel}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <ExtractionControls
                  mode={mode}
                  onModeChange={setMode}
                  interval={interval}
                  onIntervalChange={setInterval_}
                  frameCount={frameCount}
                  onFrameCountChange={setFrameCount}
                  format={format}
                  onFormatChange={setFormat}
                  onExtract={handleExtract}
                  onCapture={handleCapture}
                  onTrim={handleTrim}
                  extracting={extracting}
                  videoDuration={videoDuration}
                  startTime={startTime}
                  onStartTimeChange={setStartTime}
                  endTime={endTime}
                  onEndTimeChange={setEndTime}
                />
              </div>
            </div>

            {/* Progress */}
            {extracting && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {Math.round(progress)}% — extraction en cours…
                </p>
              </div>
            )}

            <FrameGallery
              frames={frames}
              format={format}
              onClear={() => setFrames([])}
              onToggleSelect={(id) =>
                setFrames((prev) =>
                  prev.map((f) =>
                    f.id === id ? { ...f, selected: !f.selected } : f
                  )
                )
              }
              onDelete={(id) =>
                setFrames((prev) => prev.filter((f) => f.id !== id))
              }
              onSelectAll={() =>
                setFrames((prev) =>
                  prev.map((f) => ({ ...f, selected: true }))
                )
              }
              onDeselectAll={() =>
                setFrames((prev) =>
                  prev.map((f) => ({ ...f, selected: false }))
                )
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Extract;
