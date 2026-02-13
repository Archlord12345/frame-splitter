import { useCallback, useState } from "react";
import { Upload, Film } from "lucide-react";

interface VideoDropzoneProps {
  onVideoSelect: (file: File) => void;
}

const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];

const VideoDropzone = ({ onVideoSelect }: VideoDropzoneProps) => {
  const [dragging, setDragging] = useState(false);

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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onVideoSelect(file);
    },
    [onVideoSelect]
  );

  return (
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
        <p className="text-lg font-medium">
          Glissez-déposez votre vidéo ici
        </p>
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
  );
};

export default VideoDropzone;
