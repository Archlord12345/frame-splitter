import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Clock, Hash, Hand } from "lucide-react";
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
  extracting: boolean;
  videoDuration: number;
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
  extracting,
  videoDuration,
}: ExtractionControlsProps) => {
  const estimatedFrames =
    mode === "interval"
      ? Math.ceil(videoDuration / interval)
      : mode === "count"
      ? frameCount
      : 0;

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as ExtractionMode)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="interval" className="gap-1.5">
            <Clock className="h-4 w-4" /> Intervalle
          </TabsTrigger>
          <TabsTrigger value="count" className="gap-1.5">
            <Hash className="h-4 w-4" /> Nombre
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1.5">
            <Hand className="h-4 w-4" /> Manuel
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
