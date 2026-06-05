"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({ value, onChange, className }: {
  value: number; onChange: (value: number) => void; className?: string;
}) => (
  <motion.div
    className={cn("relative w-full h-1 bg-white/20 rounded-full cursor-pointer", className)}
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      onChange(Math.min(Math.max(percentage, 0), 100));
    }}
  >
    <motion.div
      className="absolute top-0 left-0 h-full bg-white rounded-full"
      animate={{ width: `${value}%` }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  </motion.div>
);

/* YouTube wrapper — uses the same visual shell as VideoPlayer */
function YouTubePlayer({ youtubeId }: { youtubeId: string }) {
  return (
    <motion.div
      className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden bg-black shadow-[0_0_60px_rgba(0,0,0,0.6)]"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
          allowFullScreen
          style={{ border: "none" }}
        />
      </div>
    </motion.div>
  );
}

/* Direct video file player with custom controls */
export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      const v = value / 100;
      videoRef.current.volume = v;
      setVolume(v);
      setIsMuted(v === 0);
    }
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(p) ? p : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };
  const handleSeek = (value: number) => {
    if (videoRef.current?.duration) {
      const t = (value / 100) * videoRef.current.duration;
      if (isFinite(t)) { videoRef.current.currentTime = t; setProgress(value); }
    }
  };
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      setVolume(!isMuted ? 0 : 1);
      if (isMuted) videoRef.current.volume = 1;
    }
  };
  const setSpeed = (speed: number) => {
    if (videoRef.current) { videoRef.current.playbackRate = speed; setPlaybackSpeed(speed); }
  };

  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video ref={videoRef} className="w-full" onTimeUpdate={handleTimeUpdate} src={src} onClick={togglePlay} />
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-0 mx-auto max-w-xl left-0 right-0 p-4 m-2 bg-[#11111198] backdrop-blur-md rounded-2xl"
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <CustomSlider value={progress} onChange={handleSeek} className="flex-1" />
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button onClick={togglePlay} variant="ghost" size="icon" className="text-white hover:bg-[#111111d1] hover:text-white">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-x-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white hover:bg-[#111111d1] hover:text-white">
                      {isMuted ? <VolumeX className="h-5 w-5" /> : volume > 0.5 ? <Volume2 className="h-5 w-5" /> : <Volume1 className="h-5 w-5" />}
                    </Button>
                  </motion.div>
                  <div className="w-24"><CustomSlider value={volume * 100} onChange={handleVolumeChange} /></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={speed}>
                    <Button onClick={() => setSpeed(speed)} variant="ghost" size="icon"
                      className={cn("text-white hover:bg-[#111111d1] hover:text-white", playbackSpeed === speed && "bg-[#111111d1]")}>
                      {speed}x
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Universal player — uses YouTubePlayer for yt IDs, VideoPlayer for direct URLs */
export default function UniversalPlayer({ src }: { src: string }) {
  const isYouTube = /^[A-Za-z0-9_-]{11}$/.test(src);
  return isYouTube ? <YouTubePlayer youtubeId={src} /> : <VideoPlayer src={src} />;
}
