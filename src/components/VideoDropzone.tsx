import { useCallback, useState } from "react";
import { Upload, Film, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface VideoDropzoneProps {
  onVideoSelect: (file: File) => void;
  onUrlSelect: (url: string) => void;
}

const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];

const VideoDropzone = ({ onVideoSelect, onUrlSelect }: VideoDropzoneProps) => {
  const [dragging, setDragging] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && ACCEPTED.includes(file.type)) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect]
  );

  const handleUrlSubmit = useCallback(() => {
    const trimmedUrl = mediaUrl.trim();
    if (!trimmedUrl) {
      toast({ title: "Ajoutez une URL valide", variant: "destructive" });
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("unsupported protocol");
      }
      onUrlSelect(parsed.toString());
      setMediaUrl("");
    } catch {
      toast({
        title: "URL invalide",
        description: "Utilisez un lien commençant par http:// ou https://",
        variant: "destructive",
      });
    }
  }, [mediaUrl, onUrlSelect]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onVideoSelect(file);
    },
    [onVideoSelect]
  );

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        }`}
        onClick={() => document.getElementById("video-input")?.click()}
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          {dragging ? (
            <Film className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">Glissez-déposez votre vidéo ici</p>
          <p className="text-sm text-muted-foreground mt-1">
            ou cliquez pour sélectionner — MP4, WebM, MOV
          </p>
        </div>
        <input
          id="video-input"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-primary" />
          Découper depuis un lien URL
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={mediaUrl}
            placeholder="https://..."
            onChange={(e) => setMediaUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <Button type="button" onClick={handleUrlSubmit}>
            Charger le lien
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Idéal pour les vidéos hébergées en ligne. Selon la source, des limites CORS peuvent s'appliquer.
        </p>
      </div>
    </div>
  );
};

export default VideoDropzone;
