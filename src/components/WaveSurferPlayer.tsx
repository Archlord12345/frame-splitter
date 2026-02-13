import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface WaveSurferPlayerProps {
    url: string;
    onTimeUpdate?: (time: number) => void;
    onReady?: (duration: number) => void;
    startTime?: number;
    endTime?: number;
}

const WaveSurferPlayer: React.FC<WaveSurferPlayerProps> = ({
    url,
    onTimeUpdate,
    onReady,
    startTime = 0,
    endTime = 0,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "rgb(200, 200, 200)",
            progressColor: "rgb(100, 100, 255)",
            cursorColor: "rgb(100, 100, 255)",
            height: 100,
            barWidth: 2,
            barGap: 3,
            barRadius: 3,
        });

        ws.load(url);

        ws.on("ready", () => {
            onReady?.(ws.getDuration());
        });

        ws.on("audioprocess", () => {
            onTimeUpdate?.(ws.getCurrentTime());
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [url]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    // Synchronize current time with start/end if needed
    useEffect(() => {
        if (wavesurferRef.current && (startTime !== undefined || endTime !== undefined)) {
            // Logic to show region or handle start/end visualization could go here
        }
    }, [startTime, endTime]);

    return (
        <div className="w-full space-y-4">
            <div ref={containerRef} className="rounded-lg bg-foreground/5 p-4" />
            <div className="flex justify-center">
                <Button onClick={togglePlay} variant="outline" size="icon" className="h-12 w-12 rounded-full">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    );
};

export default WaveSurferPlayer;
