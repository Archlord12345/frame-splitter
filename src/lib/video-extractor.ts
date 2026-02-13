export interface MediaSnippet {
  id: string;
  timestamp: number;
  dataUrl: string; // URL or Base64
  selected: boolean;
  type: 'image' | 'video' | 'audio';
  filename?: string;
}

// Keep the old name for backward compatibility if needed, or just alias it
export type ExtractedFrame = MediaSnippet;

export type ExtractionMode = 'interval' | 'count' | 'manual' | 'trim';
export type ImageFormat = 'png' | 'jpeg';

export function captureFrame(
  video: HTMLVideoElement,
  format: ImageFormat = 'png',
  quality: number = 0.92
): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL(`image/${format}`, quality);
}

export function generateFrameId(): string {
  return `frame-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export async function extractByInterval(
  video: HTMLVideoElement,
  intervalSeconds: number,
  format: ImageFormat,
  onProgress: (progress: number) => void,
  onFrame: (frame: ExtractedFrame) => void
): Promise<void> {
  const duration = video.duration;
  const timestamps: number[] = [];
  for (let t = 0; t < duration; t += intervalSeconds) {
    timestamps.push(t);
  }
  await extractAtTimestamps(video, timestamps, format, onProgress, onFrame);
}

export async function extractByCount(
  video: HTMLVideoElement,
  count: number,
  format: ImageFormat,
  onProgress: (progress: number) => void,
  onFrame: (frame: ExtractedFrame) => void
): Promise<void> {
  const duration = video.duration;
  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    timestamps.push((i / (count - 1 || 1)) * duration);
  }
  await extractAtTimestamps(video, timestamps, format, onProgress, onFrame);
}

async function extractAtTimestamps(
  video: HTMLVideoElement,
  timestamps: number[],
  format: ImageFormat,
  onProgress: (progress: number) => void,
  onFrame: (frame: ExtractedFrame) => void
): Promise<void> {
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    video.currentTime = t;
    await new Promise<void>((resolve) => {
      const handler = () => {
        video.removeEventListener('seeked', handler);
        resolve();
      };
      video.addEventListener('seeked', handler);
    });
    const dataUrl = captureFrame(video, format);
    onFrame({
      id: generateFrameId(),
      timestamp: t,
      dataUrl,
      selected: true,
    });
    onProgress(((i + 1) / timestamps.length) * 100);
  }
}
