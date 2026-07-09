import { useState, useEffect, useRef, useCallback } from 'react';

/* ───────── Video Trimmer Component ─────────
   Provides a trim bar with two draggable handles (start & end)
   similar to Google Veo's video trimming interface.
   Shows a video preview and time labels for the selected range.
*/
export default function VideoTrimmer({
  videoUrl,
  videoDuration,
  initialTrimStart = 0,
  initialTrimEnd,
  onApply,
  onCancel,
  dark,
}) {
  const [trimStart, setTrimStart] = useState(initialTrimStart);
  const [trimEnd, setTrimEnd] = useState(initialTrimEnd ?? videoDuration ?? 0);
  const [dragging, setDragging] = useState(null); // 'start' | 'end' | null
  const [previewTime, setPreviewTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [videoMetaLoaded, setVideoMetaLoaded] = useState(false);
  const barRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const duration = videoDuration || trimEnd || 8;

  // Update trimEnd when video metadata loads
  useEffect(() => {
    if (videoDuration && !initialTrimEnd) {
      setTrimEnd(videoDuration);
    }
  }, [videoDuration, initialTrimEnd]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = previewTime;
    }
  }, [previewTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !dragging) {
      setPreviewTime(videoRef.current.currentTime);
    }
  }, [dragging]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = trimStart;
      videoRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  // Clean up animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Preview loop when playing in trim range
  useEffect(() => {
    if (!playing || !videoRef.current) return;
    const loop = () => {
      if (videoRef.current) {
        const ct = videoRef.current.currentTime;
        setPreviewTime(ct);
        if (ct >= trimEnd) {
          videoRef.current.pause();
          videoRef.current.currentTime = trimStart;
          setPlaying(false);
        } else {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [playing, trimStart, trimEnd]);

  // Mouse/ touch handlers for dragging handles
  const getPositionFromEvent = (e) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  };

  const handleMouseDown = (handle) => (e) => {
    e.preventDefault();
    setDragging(handle);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const seconds = getPositionFromEvent(e);
      if (dragging === 'start') {
        setTrimStart(Math.max(0, Math.min(seconds, trimEnd - 0.1)));
      } else if (dragging === 'end') {
        setTrimEnd(Math.min(duration, Math.max(seconds, trimStart + 0.1)));
      }
    };

    const handleUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, trimStart, trimEnd, duration]);

  const selectedDuration = Math.max(0, trimEnd - trimStart);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  const leftPct = (trimStart / duration) * 100;
  const rightPct = ((duration - trimEnd) / duration) * 100;
  const selectedPct = ((trimEnd - trimStart) / duration) * 100;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
      dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-stone-200 shadow-lg'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16M18 4v16M4 9h16M4 15h16" />
            </svg>
            <h4 className={`text-xs font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
              Trim Video
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`p-1.5 rounded-lg transition-colors ${
                dark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-700'
              }`}
              title={playing ? 'Pause' : 'Preview trimmed clip'}
            >
              {playing ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Video Preview */}
        <div className={`rounded-xl overflow-hidden mb-3 ${dark ? 'bg-black' : 'bg-black'}`} style={{ aspectRatio: '16/9', maxHeight: 200 }}>
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => {
              setVideoMetaLoaded(true);
              if (!initialTrimEnd) {
                const dur = e.target.duration;
                setTrimEnd(dur);
              }
            }}
            className="w-full h-full object-contain"
            muted
            playsInline
          />
        </div>

        {/* Time info row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold ${
              dark ? 'bg-neutral-800 text-neutral-300' : 'bg-stone-100 text-stone-700'
            }`}>
              Start: {fmt(trimStart)}
            </div>
            <div className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold ${
              dark ? 'bg-neutral-800 text-neutral-300' : 'bg-stone-100 text-stone-700'
            }`}>
              End: {fmt(trimEnd)}
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold ${
            dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
          }`}>
            {fmt(selectedDuration)} selected
          </div>
        </div>

        {/* Trim Bar */}
        <div
          ref={barRef}
          className={`relative h-10 rounded-xl cursor-pointer select-none overflow-hidden ${
            dark ? 'bg-neutral-800' : 'bg-stone-100'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Full range background */}
          <div className={`absolute inset-0 ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`} />

          {/* Selected range highlight */}
          <div
            className={`absolute top-0 bottom-0 ${
              dark ? 'bg-amber-500/20' : 'bg-amber-100'
            }`}
            style={{
              left: `${leftPct}%`,
              width: `${selectedPct}%`,
            }}
          />

          {/* Waveform / time indicators */}
          <div className="absolute inset-0 flex items-center px-1">
            {Array.from({ length: Math.min(Math.ceil(duration), 30) }).map((_, i) => {
              const pct = (i / Math.max(Math.ceil(duration), 1)) * 100;
              const inSelected = i * (duration / Math.max(Math.ceil(duration), 30)) >= trimStart &&
                                i * (duration / Math.max(Math.ceil(duration), 30)) <= trimEnd;
              return (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full mx-px ${
                    inSelected
                      ? dark ? 'bg-amber-400/40' : 'bg-amber-500/30'
                      : dark ? 'bg-neutral-700' : 'bg-stone-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Start handle */}
          <div
            onMouseDown={handleMouseDown('start')}
            onTouchStart={handleMouseDown('start')}
            className={`absolute top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize z-10 group ${
              dragging === 'start' ? 'z-20' : ''
            }`}
            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-1 h-full rounded-full transition-all ${
              dragging === 'start'
                ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
            <div className={`absolute left-1/2 -translate-x-1/2 top-0 w-3 h-2 rounded-b-sm ${
              dragging === 'start' ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
            <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-3 h-2 rounded-t-sm ${
              dragging === 'start' ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
          </div>

          {/* End handle */}
          <div
            onMouseDown={handleMouseDown('end')}
            onTouchStart={handleMouseDown('end')}
            className={`absolute top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize z-10 group ${
              dragging === 'end' ? 'z-20' : ''
            }`}
            style={{ left: `${100 - rightPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-1 h-full rounded-full transition-all ${
              dragging === 'end'
                ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
            <div className={`absolute left-1/2 -translate-x-1/2 top-0 w-3 h-2 rounded-b-sm ${
              dragging === 'end' ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
            <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-3 h-2 rounded-t-sm ${
              dragging === 'end' ? 'bg-amber-400' : 'bg-amber-500 group-hover:bg-amber-400'
            }`} />
          </div>

          {/* Time labels on bar */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-1.5" style={{ pointerEvents: 'none' }}>
            <span className="text-[7px] font-mono text-neutral-500" style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>
              0:00
            </span>
            <span className={`text-[7px] font-mono ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Bottom labels */}
        <div className="flex justify-between mt-1 mb-3">
          <span className={`text-[8px] font-mono ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
            {fmt(trimStart)}
          </span>
          <span className={`text-[8px] font-mono ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
            {fmt(trimEnd)}
          </span>
        </div>

        {/* Second time row: absolute timestamps on bar ends */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            <span>Source duration: {fmt(duration)}</span>
          </div>
          <div className={`text-[9px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
            {(selectedDuration / duration * 100).toFixed(0)}% of source
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${
        dark ? 'border-neutral-800' : 'border-stone-200'
      }`}>
        <button
          onClick={onCancel}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
          }`}
        >
          Cancel
        </button>
        {/* Reset button */}
        <button
          onClick={() => {
            setTrimStart(0);
            setTrimEnd(duration);
            setPreviewTime(0);
          }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
          }`}
        >
          Reset
        </button>
        <button
          onClick={() => onApply(trimStart, trimEnd)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
            dark
              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          Apply Trim
        </button>
      </div>
    </div>
  );
}
