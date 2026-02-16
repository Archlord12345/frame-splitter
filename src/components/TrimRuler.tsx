import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Scissors, RotateCcw, Zap } from "lucide-react";

interface TrimRulerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onTrim: () => void;
  isAudio?: boolean;
}

const TrimRuler = ({
  videoRef,
  duration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onTrim,
  isAudio = false,
}: TrimRulerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isHoveringStart, setIsHoveringStart] = useState(false);
  const [isHoveringEnd, setIsHoveringEnd] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          
          // Auto-loop within selection
          if (previewMode && videoRef.current.currentTime >= endTime) {
            videoRef.current.currentTime = startTime;
          }
        }
      }, 50);
    }
  }, [isPlaying, videoRef, startTime, endTime, previewMode]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [videoRef]);

  const handleStartChange = (value: number[]) => {
    const newTime = value[0];
    if (newTime < endTime - 1) {
      onStartTimeChange(newTime);
      handleSeek(newTime);
    }
  };

  const handleEndChange = (value: number[]) => {
    const newTime = value[0];
    if (newTime > startTime + 1) {
      onEndTimeChange(newTime);
      handleSeek(newTime);
    }
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = (clickX / rect.width) * duration;
    handleSeek(clickTime);
  };

  const setPointA = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      onStartTimeChange(newTime);
      setCurrentTime(newTime);
      
      // Add visual feedback
      setIsHoveringStart(true);
      setTimeout(() => setIsHoveringStart(false), 500);
    }
  };

  const setPointB = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      onEndTimeChange(newTime);
      setCurrentTime(newTime);
      
      // Add visual feedback
      setIsHoveringEnd(true);
      setTimeout(() => setIsHoveringEnd(false), 500);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode && videoRef.current) {
      // Jump to start when entering preview mode
      videoRef.current.currentTime = startTime;
    }
  };

  const resetSelection = () => {
    onStartTimeChange(0);
    onEndTimeChange(duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current || (!isDraggingStart && !isDraggingEnd)) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newTime = Math.max(0, Math.min(duration, (mouseX / rect.width) * duration));

      if (isDraggingStart && newTime < endTime - 1) {
        onStartTimeChange(newTime);
        handleSeek(newTime);
      } else if (isDraggingEnd && newTime > startTime + 1) {
        onEndTimeChange(newTime);
        handleSeek(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, duration, startTime, endTime, onStartTimeChange, onEndTimeChange, handleSeek]);

  // Update current time from video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', updateTime);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
    };
  }, [videoRef]);

  return (
    <div className="space-y-4">
      {/* Enhanced Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className={`gap-2 transition-all duration-200 ${
            previewMode 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' 
              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600'
          } shadow-sm`}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={setPointA}
          className={`gap-2 transition-all duration-200 ${
            isHoveringStart 
              ? 'bg-blue-100 dark:bg-blue-900/40 scale-105 shadow-md' 
              : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          } border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm`}
        >
          Point A
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={setPointB}
          className={`gap-2 transition-all duration-200 ${
            isHoveringEnd 
              ? 'bg-blue-100 dark:bg-blue-900/40 scale-105 shadow-md' 
              : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          } border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm`}
        >
          Point B
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onTrim}
          className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          disabled={startTime >= endTime}
        >
          <Scissors className="h-4 w-4" />
          <span>Couper</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={togglePreview}
          className={`gap-2 transition-all duration-200 ${
            previewMode 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' 
              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700'
          } shadow-sm`}
        >
          <Zap className="h-4 w-4" />
          <span>{previewMode ? "Aperçu ON" : "Aperçu OFF"}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={resetSelection}
          className="gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Réinitialiser</span>
        </Button>
        
        <div className="flex-1 text-sm text-slate-600 dark:text-slate-300 text-center font-medium bg-slate-100 dark:bg-slate-800 rounded-lg py-2 px-3">
          {formatTime(currentTime)} / {formatTime(duration)}
          {previewMode && <span className="ml-2 text-green-600 dark:text-green-400">🔴 Aperçu</span>}
        </div>
      </div>

      {/* Enhanced Visual Ruler */}
      <div 
        ref={rulerRef}
        className={`relative h-20 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl border overflow-hidden shadow-inner transition-all duration-200 ${
          previewMode ? 'border-green-400 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {/* Timeline background */}
        <div 
          className="absolute inset-0 cursor-pointer hover:bg-primary/5 transition-colors"
          onClick={handleRulerClick}
        />
        
        {/* Preview mode overlay */}
        {previewMode && (
          <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
        )}
        
        {/* Progress indicator with enhanced styling */}
        <div
          className={`absolute top-0 bottom-0 w-1 pointer-events-none shadow-lg transition-all duration-100 z-20 ${
            previewMode ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full shadow-md animate-pulse ${
            previewMode ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        
        {/* Selection area with enhanced styling */}
        <div
          className={`absolute top-3 bottom-3 rounded-lg pointer-events-none border transition-all duration-200 ${
            previewMode 
              ? 'bg-gradient-to-r from-green-400/40 to-green-500/40 border-green-400/60' 
              : 'bg-gradient-to-r from-blue-400/30 to-blue-500/30 border-blue-400/50'
          }`}
          style={{
            left: `${(startTime / duration) * 100}%`,
            width: `${((endTime - startTime) / duration) * 100}%`
          }}
        />
        
        {/* Enhanced Start handle */}
        <div
          className={`absolute top-0 bottom-0 w-6 rounded-l-lg cursor-ew-resize flex items-center justify-center shadow-lg transition-all duration-150 z-10 ${
            isDraggingStart 
              ? 'scale-110 shadow-xl' 
              : 'hover:scale-105 hover:shadow-lg'
          } ${
            previewMode 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
          style={{ left: `${(startTime / duration) * 100}%` }}
          onMouseDown={() => setIsDraggingStart(true)}
          onMouseEnter={() => setIsHoveringStart(true)}
          onMouseLeave={() => setIsHoveringStart(false)}
        >
          <div className="w-2 h-8 bg-white rounded-full shadow-inner" />
        </div>
        
        {/* Enhanced End handle */}
        <div
          className={`absolute top-0 bottom-0 w-6 rounded-r-lg cursor-ew-resize flex items-center justify-center shadow-lg transition-all duration-150 z-10 ${
            isDraggingEnd 
              ? 'scale-110 shadow-xl' 
              : 'hover:scale-105 hover:shadow-lg'
          } ${
            previewMode 
              ? 'bg-gradient-to-r from-green-600 to-green-500' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500'
          }`}
          style={{ left: `${(endTime / duration) * 100}%` }}
          onMouseDown={() => setIsDraggingEnd(true)}
          onMouseEnter={() => setIsHoveringEnd(true)}
          onMouseLeave={() => setIsHoveringEnd(false)}
        >
          <div className="w-2 h-8 bg-white rounded-full shadow-inner" />
        </div>
        
        {/* Enhanced Time labels */}
        <div className="absolute bottom-1 left-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
          00:00
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
          {formatTime(duration)}
        </div>
        <div 
          className={`absolute -top-6 text-xs px-2 py-1 rounded-md font-medium shadow-md whitespace-nowrap transition-all duration-200 ${
            isHoveringStart 
              ? 'bg-blue-600 text-white scale-105' 
              : previewMode 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
          }`}
          style={{ left: `${(startTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
        >
          A: {formatTime(startTime)}
        </div>
        <div 
          className={`absolute -top-6 text-xs px-2 py-1 rounded-md font-medium shadow-md whitespace-nowrap transition-all duration-200 ${
            isHoveringEnd 
              ? 'bg-blue-600 text-white scale-105' 
              : previewMode 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white'
          }`}
          style={{ left: `${(endTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
        >
          B: {formatTime(endTime)}
        </div>
      </div>

      {/* Enhanced Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`space-y-3 rounded-lg p-4 border transition-all duration-200 ${
          isHoveringStart 
            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600' 
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }`}>
          <label className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isHoveringStart ? 'bg-blue-600 animate-pulse' : 'bg-blue-500'
            }`} />
            Point A (Début)
          </label>
          <Slider
            value={[startTime]}
            onValueChange={handleStartChange}
            max={duration}
            step={0.1}
            className="w-full"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400 text-center font-mono">
            {formatTime(startTime)}
          </div>
        </div>
        <div className={`space-y-3 rounded-lg p-4 border transition-all duration-200 ${
          isHoveringEnd 
            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600' 
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }`}>
          <label className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isHoveringEnd ? 'bg-blue-600 animate-pulse' : 'bg-blue-500'
            }`} />
            Point B (Fin)
          </label>
          <Slider
            value={[endTime]}
            onValueChange={handleEndChange}
            max={duration}
            step={0.1}
            className="w-full"
          />
          <div className="text-xs text-slate-600 dark:text-slate-400 text-center font-mono">
            {formatTime(endTime)}
          </div>
        </div>
      </div>

      {/* Enhanced Selection info */}
      <div className={`rounded-lg p-4 border transition-all duration-200 ${
        previewMode 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse transition-all duration-200 ${
              previewMode ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <span className={`text-sm font-medium transition-all duration-200 ${
              previewMode ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
            }`}>
              {previewMode ? 'Aperçu actif' : 'Sélection active'}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold transition-all duration-200 ${
              previewMode ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
            }`}>
              {formatTime(endTime - startTime)}
            </div>
            <div className={`text-xs transition-all duration-200 ${
              previewMode ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {Math.round(((endTime - startTime) / duration) * 100)}% de la vidéo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimRuler;
