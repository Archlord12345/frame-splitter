import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Clock, Hash, Hand, Scissors } from "lucide-react";
import type { ExtractionMode, ImageFormat } from "@/lib/video-extractor";

interface ExtractionControlsProps {
  mode: ExtractionMode;
  onModeChange: (mode: ExtractionMode) => void;
  interval: number;
  onIntervalChange: (v: number) => void;
  frameCount: number;
  onFrameCountChange: (v: number) => void;
  format: ImageFormat;
  onFormatChange: (f: ImageFormat) => void;
  onExtract: () => void;
  onCapture: () => void;
  onTrim: () => void;
  extracting: boolean;
  videoDuration: number;
  startTime: number;
  onStartTimeChange: (v: number) => void;
  endTime: number;
  onEndTimeChange: (v: number) => void;
}

const ExtractionControls = ({
  mode,
  onModeChange,
  interval,
  onIntervalChange,
  frameCount,
  onFrameCountChange,
  format,
  onFormatChange,
  onExtract,
  onCapture,
  onTrim,
  extracting,
  videoDuration,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
}: ExtractionControlsProps) => {
  const estimatedFrames =
    mode === "interval"
      ? Math.ceil(videoDuration / interval)
      : mode === "count"
        ? frameCount
        : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as ExtractionMode)}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="interval" className="gap-1.5 px-2">
            <Clock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Intervalle</span>
          </TabsTrigger>
          <TabsTrigger value="count" className="gap-1.5 px-2">
            <Hash className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Nombre</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1.5 px-2">
            <Hand className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Manuel</span>
          </TabsTrigger>
          <TabsTrigger value="trim" className="gap-1.5 px-2">
            <Scissors className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Découper</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interval" className="space-y-4 pt-4">
          <div>
            <Label>Intervalle : {interval}s</Label>
            <Slider
              value={[interval]}
              onValueChange={([v]) => onIntervalChange(v)}
              min={0.5}
              max={Math.max(10, videoDuration / 2)}
              step={0.5}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              ≈ {estimatedFrames} images estimées
            </p>
          </div>
        </TabsContent>

        <TabsContent value="count" className="space-y-4 pt-4">
          <div>
            <Label>Nombre d'images</Label>
            <Input
              type="number"
              min={2}
              max={500}
              value={frameCount}
              onChange={(e) => onFrameCountChange(Number(e.target.value))}
              className="mt-2"
            />
          </div>
        </TabsContent>

        <TabsContent value="manual" className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Naviguez dans la vidéo puis cliquez sur « Capturer » pour extraire l'image à l'instant courant.
          </p>
          <Button onClick={onCapture} className="w-full gap-2">
            <Camera className="h-4 w-4" /> Capturer l'image
          </Button>
        </TabsContent>

        <TabsContent value="trim" className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Début (s)</Label>
                <span className="text-xs text-muted-foreground">{formatTime(startTime)}</span>
              </div>
              <div className="flex gap-4 items-center">
                <Slider
                  value={[startTime]}
                  onValueChange={([v]) => onStartTimeChange(v)}
                  min={0}
                  max={Math.max(0, endTime - 0.1)}
                  step={0.1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      onStartTimeChange(Math.max(0, Math.min(val, endTime - 0.1)));
                    }
                  }}
                  step={0.1}
                  min={0}
                  max={endTime - 0.1}
                  className="w-20 h-8"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Fin (s)</Label>
                <span className="text-xs text-muted-foreground">{formatTime(endTime)}</span>
              </div>
              <div className="flex gap-4 items-center">
                <Slider
                  value={[endTime]}
                  onValueChange={([v]) => onEndTimeChange(v)}
                  min={Math.min(startTime + 0.1, videoDuration)}
                  max={Math.max(0.1, videoDuration)}
                  step={0.1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      onEndTimeChange(Math.max(startTime + 0.1, Math.min(val, videoDuration)));
                    }
                  }}
                  step={0.1}
                  min={startTime + 0.1}
                  max={videoDuration}
                  className="w-20 h-8"
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                Durée de l'extrait : {(endTime - startTime).toFixed(1)}s
              </p>
              <Button onClick={onTrim} disabled={extracting} className="w-full gap-2">
                <Scissors className="h-4 w-4" /> Enregistrer l'extrait
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Format */}
      <div>
        <Label className="mb-2 block">Format de sortie</Label>
        <RadioGroup
          value={format}
          onValueChange={(v) => onFormatChange(v as ImageFormat)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="png" id="png" />
            <Label htmlFor="png">PNG</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="jpeg" id="jpeg" />
            <Label htmlFor="jpeg">JPEG</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Extract button */}
      {mode !== "manual" && (
        <Button
          onClick={onExtract}
          disabled={extracting}
          className="w-full gap-2"
          size="lg"
        >
          {extracting ? "Extraction en cours…" : "Lancer l'extraction"}
        </Button>
      )}
    </div>
  );
};

export default ExtractionControls;
