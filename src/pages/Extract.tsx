import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VideoDropzone from "@/components/VideoDropzone";
import ExtractionControls from "@/components/ExtractionControls";
import FrameGallery from "@/components/FrameGallery";
import {
  captureFrame,
  extractByInterval,
  extractByCount,
  generateFrameId,
  type ExtractedFrame,
  type ExtractionMode,
  type ImageFormat,
} from "@/lib/video-extractor";
import { toast } from "@/hooks/use-toast";

const Extract = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const [mode, setMode] = useState<ExtractionMode>("interval");
  const [interval, setInterval_] = useState(2);
  const [frameCount, setFrameCount] = useState(10);
  const [format, setFormat] = useState<ImageFormat>("png");

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);

  const handleVideoSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setFrames([]);
    setProgress(0);
  }, []);

  const handleMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleExtract = async () => {
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
        await extractByInterval(video, interval, format, setProgress, addFrame);
      } else {
        await extractByCount(video, frameCount, format, setProgress, addFrame);
      }
      toast({ title: "Extraction terminée !" });
    } catch {
      toast({ title: "Erreur lors de l'extraction", variant: "destructive" });
    }
    setExtracting(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const dataUrl = captureFrame(videoRef.current, format);
    const frame: ExtractedFrame = {
      id: generateFrameId(),
      timestamp: videoRef.current.currentTime,
      dataUrl,
      selected: true,
    };
    setFrames((prev) => [...prev, frame]);
    toast({ title: `Image capturée à ${videoRef.current.currentTime.toFixed(2)}s` });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Extraction vidéo</h1>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {!videoUrl ? (
          <VideoDropzone onVideoSelect={handleVideoSelect} />
        ) : (
          <>
            <div className="grid lg:grid-cols-[1fr_340px] gap-8">
              {/* Video player */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-foreground/5 border border-border">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full"
                    onLoadedMetadata={handleMetadata}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVideoUrl(null);
                    setFrames([]);
                  }}
                >
                  Changer de vidéo
                </Button>
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
                  extracting={extracting}
                  videoDuration={videoDuration}
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

            {/* Gallery */}
            <FrameGallery
              frames={frames}
              format={format}
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
