import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { ads, managerSettings } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Button from '../components/ui/Button';

const c = (k) => colors[k];

const DIMENSION_PRESETS = [
  { label: 'Square', w: 1024, h: 1024, icon: '⬜' },
  { label: 'Landscape', w: 1920, h: 1080, icon: '🟥' },
  { label: 'Portrait', w: 1080, h: 1920, icon: '🟦' },
  { label: 'Story', w: 1080, h: 1920, icon: '📱' },
  { label: 'Banner', w: 1200, h: 628, icon: '📄' },
  { label: 'Wide', w: 2560, h: 1440, icon: '🖥️' },
];

const MEDIA_TYPES = [
  { key: 'image', label: 'Image', icon: '🖼️' },
  { key: 'video', label: 'Video', icon: '🎬' },
];

const APP_MODES = [
  { key: 'generate', label: 'Generate', icon: '✨' },
  { key: 'merge', label: 'Video Merger', icon: '🎞️' },
];

const STYLE_OPTIONS = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: '3d-render', label: '3D Render' },
  { value: 'anime', label: 'Anime' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'sketch', label: 'Sketch' },
];

const DURATION_OPTIONS = [
  { value: 4, label: '4 sec' },
  { value: 8, label: '8 sec' },
  { value: 15, label: '15 sec' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
];

const TRANSITION_OPTIONS = [
  { value: 'fade', label: 'Fade', icon: '🌫️' },
  { value: 'dissolve', label: 'Dissolve', icon: '✨' },
  { value: 'wipe-right', label: 'Wipe →', icon: '➡️' },
  { value: 'wipe-left', label: 'Wipe ←', icon: '⬅️' },
  { value: 'wipe-up', label: 'Wipe ↑', icon: '⬆️' },
  { value: 'wipe-down', label: 'Wipe ↓', icon: '⬇️' },
  { value: 'slide-right', label: 'Slide →', icon: '▶️' },
  { value: 'slide-left', label: 'Slide ←', icon: '◀️' },
  { value: 'zoom-in', label: 'Zoom In', icon: '🔍' },
  { value: 'zoom-out', label: 'Zoom Out', icon: '🔎' },
];

const TRANSITION_DURATION = 0.5; // seconds

/* ───────── Canvas-based video merge engine ───────── */
function renderTransition(ctx, fromVideo, toVideo, progress, type, w, h) {
  const p = Math.max(0, Math.min(1, progress));
  switch (type) {
    case 'fade':
      ctx.globalAlpha = 1 - p;
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.globalAlpha = p;
      ctx.drawImage(toVideo, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    case 'dissolve':
      ctx.globalAlpha = 1 - p * 0.5;
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.globalAlpha = p;
      ctx.drawImage(toVideo, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    case 'wipe-right': {
      const x = Math.floor(w * p);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, x, 0, w - x, h, x, 0, w - x, h);
      break;
    }
    case 'wipe-left': {
      const xr = w - Math.floor(w * p);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, 0, 0, xr, h, 0, 0, xr, h);
      break;
    }
    case 'wipe-up': {
      const yh = h - Math.floor(h * p);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, 0, 0, w, yh, 0, 0, w, yh);
      break;
    }
    case 'wipe-down': {
      const yd = Math.floor(h * p);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, 0, yd, w, h - yd, 0, yd, w, h - yd);
      break;
    }
    case 'slide-right': {
      const sx = Math.floor(w * p);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, sx - w, 0, w, h, 0, 0, w, h);
      break;
    }
    case 'slide-left': {
      const sl = Math.floor(w * p);
      ctx.drawImage(toVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(fromVideo, w - sl, 0, w, h, 0, 0, w, h);
      break;
    }
    case 'zoom-in': {
      const scale = 1 + p * 0.3;
      const ox = w / 2;
      const oy = h / 2;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);
      ctx.translate(-ox, -oy);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.restore();
      ctx.globalAlpha = p;
      ctx.drawImage(toVideo, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    }
    case 'zoom-out': {
      const scaleOut = 1 - p * 0.3;
      const ox2 = w / 2;
      const oy2 = h / 2;
      ctx.save();
      ctx.translate(ox2, oy2);
      ctx.scale(scaleOut, scaleOut);
      ctx.translate(-ox2, -oy2);
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.restore();
      ctx.globalAlpha = 1 - p;
      ctx.drawImage(toVideo, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    }
    default: // no transition - just cut
      ctx.drawImage(toVideo, 0, 0, w, h);
  }
}

async function mergeVideosClientSide(clips, outputW, outputH, fps = 30, onProgress) {
  const totalClips = clips.length;
  if (totalClips === 0) throw new Error('No videos to merge');

  // Pre-load all videos
  const videos = await Promise.all(clips.map((clip, i) => new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.preload = 'auto';
    v.src = clip.url;
    v.onloadedmetadata = () => { v.currentTime = 0; resolve(v); };
    v.onerror = () => reject(new Error(`Failed to load video ${i + 1}`));
    // Fallback: some browsers need timeupdate
    v.addEventListener('loadeddata', () => { if (v.readyState >= 2) resolve(v); });
    setTimeout(() => { if (!v.readyState) reject(new Error(`Timeout loading video ${i + 1}`)); }, 15000);
  })));

  // Calculate total frames
  const clipDurations = clips.map((c, i) => {
    const v = videos[i];
    const dur = v.duration || c.duration || 5;
    return dur;
  });

  let totalDuration = 0;
  const clipStartTimes = [];
  for (let i = 0; i < totalClips; i++) {
    clipStartTimes.push(totalDuration);
    totalDuration += clipDurations[i];
    if (i < totalClips - 1) totalDuration += TRANSITION_DURATION;
  }

  const totalFrames = Math.ceil(totalDuration * fps);

  // Set up canvas
  const canvas = document.createElement('canvas');
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext('2d');

  // Set up MediaRecorder
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

  const recordedChunks = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };

  const resultPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  // Render frames
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;

    // Find which clip and local time
    let clipIndex = 0;
    let localTime = time;
    let inTransition = false;
    let transitionProgress = 0;

    for (let i = totalClips - 1; i >= 0; i--) {
      const start = clipStartTimes[i];
      const end = start + clipDurations[i];
      if (time >= start && time < end) {
        clipIndex = i;
        localTime = time - start;
        inTransition = false;
        break;
      }
      // Check transition region
      if (i < totalClips - 1) {
        const transStart = clipStartTimes[i] + clipDurations[i];
        const transEnd = transStart + TRANSITION_DURATION;
        if (time >= transStart && time < transEnd) {
          clipIndex = i;
          localTime = time - clipStartTimes[i];
          inTransition = true;
          transitionProgress = (time - transStart) / TRANSITION_DURATION;
          break;
        }
      }
    }

    // Seek clips
    try {
      const currentClip = videos[clipIndex];
      currentClip.currentTime = Math.min(localTime, currentClip.duration - 0.01);

      if (inTransition && clipIndex + 1 < totalClips) {
        const nextClip = videos[clipIndex + 1];
        const nextLocalTime = time - clipStartTimes[clipIndex + 1] + TRANSITION_DURATION;
        nextClip.currentTime = Math.min(nextLocalTime, nextClip.duration - 0.01);
        // Wait for seek
        await Promise.all([
          new Promise(r => { if (currentClip.readyState >= 2) r(); else { currentClip.onseeked = r; setTimeout(r, 100); } }),
          new Promise(r => { if (nextClip.readyState >= 2) r(); else { nextClip.onseeked = r; setTimeout(r, 100); } }),
        ]);
        renderTransition(ctx, currentClip, nextClip, transitionProgress, clips[clipIndex].transition || 'fade', outputW, outputH);
      } else {
        await new Promise(r => { if (currentClip.readyState >= 2) r(); else { currentClip.onseeked = r; setTimeout(r, 100); } });
        ctx.clearRect(0, 0, outputW, outputH);
        ctx.drawImage(currentClip, 0, 0, outputW, outputH);
      }
    } catch (e) {
      // Fallback frame
      ctx.clearRect(0, 0, outputW, outputH);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outputW, outputH);
    }

    // Report progress
    if (frame % Math.max(1, Math.floor(totalFrames / 20)) === 0) {
      onProgress?.(Math.round((frame / totalFrames) * 100));
    }
  }

  recorder.stop();
  const blob = await resultPromise;
  return blob;
}

/* ───────── Sub-components ───────── */

function Sidebar({ dark, mode, activeMediaType, onModeChange, onMediaTypeChange, onNewTemplate }) {
  const [showRecent, setShowRecent] = useState(true);

  return (
    <div className={`w-[280px] flex-shrink-0 flex flex-col h-full overflow-hidden ${
      dark ? 'bg-neutral-900/90 border-r border-neutral-800' : 'bg-white/90 border-r border-stone-200'
    }`}>
      {/* Sidebar Header */}
      <div className={`px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
        <h2 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Creative Studio</h2>
        <p className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
          AI-powered content creator
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 pt-4 pb-2">
        <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
          Tools
        </h3>
        <div className="space-y-1.5">
          {APP_MODES.map((md) => (
            <button
              key={md.key}
              onClick={() => onModeChange(md.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === md.key
                  ? dark
                    ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25 shadow-[0_0_15px_rgba(217,160,50,0.06)]'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                  : dark
                    ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-transparent'
              }`}
            >
              <span className="text-lg">{md.icon}</span>
              <span>{md.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Media Type (only in generate mode) */}
      {mode === 'generate' && (
        <>
          <div className="px-4 py-2">
            <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Create New
            </h3>
            <div className="space-y-2">
              {MEDIA_TYPES.map((mt) => (
                <button
                  key={mt.key}
                  onClick={() => onMediaTypeChange(mt.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeMediaType === mt.key
                      ? dark
                        ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25 shadow-[0_0_15px_rgba(217,160,50,0.06)]'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                      : dark
                        ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{mt.icon}</span>
                  <span>{mt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimension Templates */}
          <div className="px-4 pb-3">
            <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Templates
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DIMENSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onNewTemplate(preset)}
                  className={`flex flex-col items-center gap-1 px-2.5 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                    dark
                      ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="font-medium">{preset.label}</span>
                  <span className={`text-[9px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                    {preset.w}×{preset.h}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recent Section */}
      <div className={`flex-1 overflow-auto px-4 pb-4 ${!showRecent ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            Recent
          </h3>
          <button
            onClick={() => setShowRecent(!showRecent)}
            className={`text-[10px] ${dark ? 'text-neutral-600 hover:text-neutral-400' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {showRecent ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="space-y-1.5">
          {RECENT_PLACEHOLDERS.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                dark
                  ? 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                dark ? 'bg-neutral-800' : 'bg-stone-100'
              }`}>
                {item.type === 'video' ? '🎬' : '🖼️'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className={`font-medium truncate ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {item.label}
                </div>
                <div className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                  {item.date}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DimensionInput({ label, value, onChange, dark }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-[10px] font-medium ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={`w-full px-3 py-2 rounded-lg text-sm text-center outline-none transition-all duration-200 ${
          dark
            ? 'bg-neutral-800/80 border border-neutral-700 text-neutral-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
            : 'bg-white border border-stone-300 text-neutral-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/15'
        }`}
        min={64}
        max={4096}
      />
    </div>
  );
}

function StyleSelector({ value, onChange, dark }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style.value}
          onClick={() => onChange(style.value === value ? null : style.value)}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
            value === style.value
              ? dark
                ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              : dark
                ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-transparent'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-transparent'
          }`}
        >
          {style.label}
        </button>
      ))}
    </div>
  );
}

function TransitionSelector({ value, onChange, dark }) {
  const [open, setOpen] = useState(false);
  const selected = TRANSITION_OPTIONS.find(t => t.value === value) || TRANSITION_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
          dark
            ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 border border-neutral-700'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 border border-stone-200'
        }`}
      >
        <span>{selected.icon}</span>
        <span>{selected.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute top-full left-0 mt-1 z-20 w-44 rounded-xl border shadow-lg overflow-hidden ${
            dark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-stone-200'
          }`}>
            {TRANSITION_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => { onChange(t.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  value === t.value
                    ? dark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700'
                    : dark ? 'text-neutral-400 hover:bg-neutral-700' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────── Video Merger Panel ───────── */
const RECENT_PLACEHOLDERS = [
  { id: 1, label: 'Summer Sale Banner', type: 'image', date: '2 hours ago' },
  { id: 2, label: 'Product Showcase', type: 'video', date: '5 hours ago' },
  { id: 3, label: 'Brand Story Ad', type: 'image', date: '1 day ago' },
  { id: 4, label: 'Festival Promo', type: 'video', date: '2 days ago' },
];

function VideoMergerPanel({ dark, generatedAssets, setGeneratedAssets, setError }) {
  const [timeline, setTimeline] = useState([]);
  const [merging, setMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [mergeWidth, setMergeWidth] = useState(1920);
  const [mergeHeight, setMergeHeight] = useState(1080);
  // Filter only video assets
  const videoAssets = generatedAssets.filter(a => a.type === 'video');

  const addToTimeline = (asset) => {
    if (timeline.some(t => t.id === asset.id)) return;
    setTimeline(prev => [...prev, { ...asset, transition: 'fade', id: asset.id + '-tl-' + Date.now() }]);
  };

  const removeFromTimeline = (tlId) => {
    setTimeline(prev => prev.filter(t => t.id !== tlId));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setTimeline(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    if (index >= timeline.length - 1) return;
    setTimeline(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const setTransition = (index, value) => {
    setTimeline(prev => prev.map((t, i) => i === index ? { ...t, transition: value } : t));
  };

  const handleMerge = async () => {
    if (timeline.length < 2) {
      setError('Add at least 2 videos to the timeline');
      return;
    }
    setMerging(true);
    setMergeProgress(0);
    setPreviewBlob(null);
    setError('');
    try {
      const blob = await mergeVideosClientSide(timeline, mergeWidth, mergeHeight, 30, setMergeProgress);
      setPreviewBlob(blob);
      // Add to generated assets
      const url = URL.createObjectURL(blob);
      const totalDur = timeline.reduce((acc, t, i) => {
        return acc + (t.duration || 5) + (i < timeline.length - 1 ? TRANSITION_DURATION : 0);
      }, 0);
      setGeneratedAssets(prev => [...prev, {
        type: 'video',
        url,
        prompt: `Merged video (${timeline.length} clips, ${Math.round(totalDur)}s)`,
        width: mergeWidth,
        height: mergeHeight,
        duration: Math.round(totalDur),
        id: Date.now(),
        isMerged: true,
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
      setMergeProgress(0);
    }
  };

  const downloadMerged = () => {
    if (!previewBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(previewBlob);
    a.download = `merged-video-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Merge Settings */}
      <div className={`rounded-2xl p-5 border transition-all duration-300 ${
        dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <h3 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            Video Merger
          </h3>
          <span className={`ml-auto text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            {timeline.length} clip{timeline.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Output resolution */}
        <div className="flex items-center gap-3 mb-4">
          <label className={`text-[10px] font-medium flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            Output:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={mergeWidth}
              onChange={(e) => setMergeWidth(parseInt(e.target.value) || 1920)}
              className={`w-20 px-2 py-1.5 rounded-lg text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-white border border-stone-300 text-neutral-900'
              }`}
              min={320}
              max={7680}
            />
            <span className={`text-xs ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>×</span>
            <input
              type="number"
              value={mergeHeight}
              onChange={(e) => setMergeHeight(parseInt(e.target.value) || 1080)}
              className={`w-20 px-2 py-1.5 rounded-lg text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-white border border-stone-300 text-neutral-900'
              }`}
              min={320}
              max={7680}
            />
          </div>
        </div>

        {/* Video list with add button */}
        <div className={`mb-4 p-3 rounded-xl border border-dashed ${
          dark ? 'border-neutral-700 bg-neutral-800/30' : 'border-stone-300 bg-stone-50/50'
        }`}>
          <p className={`text-[10px] font-medium mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
            Available Videos
          </p>
          {videoAssets.length === 0 ? (
            <p className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
              Generate some videos first, then add them here
            </p>
          ) : (
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {videoAssets.map((v) => {
                const inTimeline = timeline.some(t => t.id === v.id || t.id.startsWith(v.id));
                return (
                  <div key={v.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                    dark ? 'hover:bg-neutral-700/50' : 'hover:bg-stone-100'
                  }`}>
                    <video src={v.url} className="w-10 h-7 rounded object-cover flex-shrink-0" muted />
                    <span className={`flex-1 truncate text-[10px] ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                      {v.prompt?.slice(0, 30)}...
                    </span>
                    <button
                      onClick={() => addToTimeline(v)}
                      disabled={inTimeline}
                      className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors flex-shrink-0 ${
                        inTimeline
                          ? dark ? 'text-neutral-600 bg-neutral-800' : 'text-stone-400 bg-stone-100'
                          : dark ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                      }`}
                    >
                      {inTimeline ? 'Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className={`text-[10px] font-medium ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Timeline
            </p>
            {timeline.map((clip, index) => (
              <div key={clip.id}>
                {/* Clip row */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                  dark ? 'bg-neutral-800/60 border border-neutral-700/50' : 'bg-stone-50/80 border border-stone-200'
                }`}>
                  <span className={`text-[9px] font-bold w-4 text-center flex-shrink-0 ${
                    dark ? 'text-neutral-500' : 'text-stone-400'
                  }`}>
                    {index + 1}
                  </span>
                  <video src={clip.url} className="w-12 h-8 rounded object-cover flex-shrink-0" muted />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-medium truncate ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {clip.prompt?.slice(0, 35) || 'Video clip'}
                    </div>
                    <div className={`text-[8px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                      {clip.duration || '~5'}s · {clip.width || '-'}×{clip.height || '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''} ${
                        dark ? 'text-neutral-400 hover:text-neutral-200' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === timeline.length - 1}
                      className={`p-1 rounded transition-colors ${index === timeline.length - 1 ? 'opacity-20 cursor-not-allowed' : ''} ${
                        dark ? 'text-neutral-400 hover:text-neutral-200' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFromTimeline(clip.id)}
                      className={`p-1 rounded ${
                        dark ? 'text-neutral-500 hover:text-red-400' : 'text-stone-400 hover:text-red-500'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Transition selector between clips */}
                {index < timeline.length - 1 && (
                  <div className="flex items-center gap-2 py-1.5 pl-6">
                    <div className={`flex-1 h-px ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />
                    <TransitionSelector
                      value={clip.transition || 'fade'}
                      onChange={(v) => setTransition(index, v)}
                      dark={dark}
                      clipIndex={index}
                    />
                    <div className={`flex-1 h-px ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Merge Button */}
        <Button
          onClick={handleMerge}
          loading={merging}
          disabled={timeline.length < 2 || merging}
          className="w-full !py-3.5 !text-sm !font-bold !rounded-2xl"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25\" />
          </svg>
          {merging
            ? `Merging... ${mergeProgress}%`
            : timeline.length < 2
              ? 'Add at least 2 videos'
              : `Merge ${timeline.length} Videos${timeline.length > 0 ? ` (${timeline.reduce((a, t, i) => a + (t.duration || 5) + (i < timeline.length - 1 ? TRANSITION_DURATION : 0), 0).toFixed(0)}s)` : ''}`
          }
        </Button>

        {/* Progress bar */}
        {merging && (
          <div className="mt-3">
            <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-300"
                style={{ width: `${mergeProgress}%` }}
              />
            </div>
            <p className={`text-[9px] mt-1 text-center ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
              Rendering {mergeProgress}% · Processing in browser, please wait...
            </p>
          </div>
        )}

        {/* Preview after merge */}
        {previewBlob && !merging && (
          <div className="mt-4">
            <div className={`rounded-xl overflow-hidden ${dark ? 'bg-black' : 'bg-black'}`} style={{ aspectRatio: `${mergeWidth}/${mergeHeight}` }}>
              <video src={URL.createObjectURL(previewBlob)} controls className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={downloadMerged} variant="secondary" className="!py-2 !text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download .webm
              </Button>
              <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                Merged at {mergeWidth}×{mergeHeight}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const IMAGE_MODELS_DEFAULT = [
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', credit_cost: 2, description: 'Fast, efficient (Gemini 2.5 Flash)', provider: 'google', api_type: 'interactions' },
  { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2', credit_cost: 3, description: 'High-efficiency (Gemini 3.1 Flash)', provider: 'google', api_type: 'interactions' },
  { id: 'gemini-3-pro-image', name: 'Nano Banana Pro', credit_cost: 5, description: 'Professional quality', provider: 'google', is_premium: true, api_type: 'interactions' },
];

const VIDEO_MODELS_DEFAULT = [
  { id: 'veo-3.1-generate-preview', name: 'Veo 3.1', credit_cost: 8, description: 'Latest cinematic video generation' },
  { id: 'veo-3.0-generate-001', name: 'Veo 3.0', credit_cost: 5, description: 'High-quality video generation' },
  { id: 'veo-3.0-fast-001', name: 'Veo 3.0 Fast', credit_cost: 4, description: 'Faster video generation' },
];

export default function ManagerCreateCreative() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('generate');
  const [mediaType, setMediaType] = useState('image');
  const baseDescription = location.state?.prompt || '';
  const campaignLanguages = location.state?.languages || [];
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  // Build prompt from base description + selected language
  const [prompt, setPrompt] = useState(baseDescription);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [style, setStyle] = useState(null);
  const [duration, setDuration] = useState(5);
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showNegative, setShowNegative] = useState(false);
  const [error, setError] = useState('');
  // Model selection state
  const [imageModels, setImageModels] = useState(IMAGE_MODELS_DEFAULT);
  const [videoModels, setVideoModels] = useState(VIDEO_MODELS_DEFAULT);
  const [selectedImageModel, setSelectedImageModel] = useState(IMAGE_MODELS_DEFAULT[0].id); // Nano Banana
  const [selectedVideoModel, setSelectedVideoModel] = useState(VIDEO_MODELS_DEFAULT[1].id);
  // Google API daily usage quota (real credits)
  const [googleApiQuota, setGoogleApiQuota] = useState(null);
  // Manager's own API key
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [myApiKey, setMyApiKey] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);

  // Fetch models and Google API usage stats on mount
  useEffect(() => {
    fetchModels();
    fetchUsageStats();
    fetchMyApiKey();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const data = await ads.getUsageStats();
      if (data?.daily_limit) setGoogleApiQuota(data);
    } catch (err) {
      // Ignore if API unavailable
    }
  };

  const fetchMyApiKey = async () => {
    try {
      const data = await managerSettings.getApiKey();
      if (data?.api_key) setMyApiKey(data.api_key);
    } catch (err) {
      // Ignore
    }
  };

  const handleSaveApiKey = async () => {
    setApiKeySaving(true);
    try {
      await managerSettings.setApiKey(myApiKey);
    } catch (err) {
      setError(err.message);
    } finally {
      setApiKeySaving(false);
    }
  };

  const fetchModels = async () => {
    try {
      const data = await ads.getModels();
      if (data?.image_models?.length) setImageModels(data.image_models);
      if (data?.video_models?.length) setVideoModels(data.video_models);
    } catch (err) {
      // Use defaults if API fails
    }
  };

  const selectedModel = mediaType === 'image' ? selectedImageModel : selectedVideoModel;
  const setSelectedModel = (id) => {
    if (mediaType === 'image') setSelectedImageModel(id);
    else setSelectedVideoModel(id);
  };

  const handleLanguageSelect = (lang) => {
    // If same language clicked, deselect
    if (selectedLanguage?.id === lang.id) {
      setSelectedLanguage(null);
      setPrompt(baseDescription);
    } else {
      setSelectedLanguage(lang);
      setPrompt(`Create in ${lang.name}: ${baseDescription}`);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    setError('');
    try {
      const result = await ads.enhancePrompt({
        prompt: prompt.trim(),
        media_type: mediaType,
        width,
        height,
      });
      setPrompt(result.enhanced);
      if (result.negative_prompt) {
        setNegativePrompt(result.negative_prompt);
        setShowNegative(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnhancing(false);
    }
  };

  const handleNewTemplate = (preset) => {
    setWidth(preset.w);
    setHeight(preset.h);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const aspectRatio = `${width}:${height}`;
      if (mediaType === 'image') {
        const result = await ads.generateImage({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          model: selectedImageModel,
        });
        setGeneratedAssets(prev => [...prev, {
          type: 'image', url: result.url, prompt: prompt.trim(),
          width, height, style, model: result.model_used, id: Date.now()
        }]);
        // Refresh Google API quota after generation
        fetchUsageStats();
      } else {
        const result = await ads.generateVideoClip({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
          model: selectedVideoModel,
        });
        setGeneratedAssets(prev => [...prev, {
          type: 'video', url: result.url, prompt: prompt.trim(),
          width, height, duration, model: result.model_used, id: Date.now()
        }]);
        // Refresh Google API quota after generation
        fetchUsageStats();
      }
    } catch (err) {
      if (err.data?.google_api_quota) setGoogleApiQuota(err.data.google_api_quota);
      else fetchUsageStats();
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleEditAsset = (asset) => {
    setMode('generate');
    setMediaType(asset.type);
    setPrompt(asset.prompt || '');
    setWidth(asset.width || 1024);
    setHeight(asset.height || 1024);
    setStyle(asset.style || null);
    if (asset.type === 'video' && asset.duration) {
      setDuration(asset.duration);
    }
    setSelectedAsset(asset);
    setTimeout(() => {
      const promptEl = document.querySelector('textarea');
      if (promptEl) promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const removeAsset = (id) => {
    setGeneratedAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  return (
    <AppLayout fullWidth>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          dark={dark}
          mode={mode}
          activeMediaType={mediaType}
          onModeChange={setMode}
          onMediaTypeChange={setMediaType}
          onNewTemplate={handleNewTemplate}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className={`${mode === 'merge' ? 'max-w-[900px]' : 'max-w-[1100px]'} mx-auto p-6 lg:p-8`}>
            {/* Header Bar */}
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${
                  mode === 'merge' ? 'from-purple-500 to-pink-500' : 'from-amber-500 to-amber-400'
                }`} />
                <div>
                  <h1 className={`text-xl font-bold tracking-tight ${c(dark ? 'dark' : 'light').text}`}>
                    {mode === 'generate'
                      ? (mediaType === 'image' ? 'Generate Image' : 'Generate Video')
                      : 'Video Merger'
                    }
                  </h1>
                  <p className={`text-xs mt-0.5 ${c(dark ? 'dark' : 'light').textMuted}`}>
                    {mode === 'generate'
                      ? 'Describe what you want to create'
                      : 'Join multiple videos with transition effects'
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => navigate('/manager/dashboard')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Dashboard
              </Button>
            </div>

            {/* Google API Quota — only shows REAL data from Google's responses */}
            {googleApiQuota?.exhausted && (
              <div className={`mb-6 rounded-2xl p-4 border ${
                dark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-red-500/20">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                      Google API Response
                    </div>
                    <div className={`text-sm font-mono ${dark ? 'text-red-400' : 'text-red-600'}`}>
                      {googleApiQuota.error || 'Quota exceeded'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {googleApiQuota?.google_rate_limit?.hasOwnProperty('x-ratelimit-remaining-requests') && !googleApiQuota?.exhausted && (
              <div className={`mb-6 rounded-2xl p-4 border transition-all duration-300 ${
                dark ? 'bg-gradient-to-r from-emerald-500/8 to-amber-500/8 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-amber-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    (googleApiQuota.google_rate_limit['x-ratelimit-remaining-requests'] || 0) <= 5 ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      (googleApiQuota.google_rate_limit['x-ratelimit-remaining-requests'] || 0) <= 5 ? 'text-amber-500' : 'text-emerald-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                      Google API Quota
                    </div>
                    <div className={`text-lg font-bold ${
                      (googleApiQuota.google_rate_limit['x-ratelimit-remaining-requests'] || 0) <= 5 ? 'text-amber-500' : dark ? 'text-emerald-300' : 'text-emerald-700'
                    }`}>
                      {googleApiQuota.google_rate_limit['x-ratelimit-remaining-requests']} req/min
                      <span className={`text-xs font-normal ml-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                        · {googleApiQuota.google_rate_limit['x-ratelimit-remaining-tokens']?.toLocaleString()} tokens/min
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                      From Google API response — updates after each generation
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'merge' ? (
              /* ─── Video Merger Mode ─── */
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up animate-delay-100">
                <div className="lg:col-span-5">
                  <ErrorAlert message={error} onDismiss={() => setError('')} />
                  <VideoMergerPanel
                    dark={dark}
                    generatedAssets={generatedAssets}
                    setGeneratedAssets={setGeneratedAssets}
                    setError={setError}
                  />
                </div>
                {/* Gallery also visible in merge mode */}
                {generatedAssets.length > 0 && (
                  <div className="lg:col-span-5">
                    <div className={`rounded-2xl p-5 border transition-all duration-300 ${
                      dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                          Generated Assets
                        </h3>
                        <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                          {generatedAssets.length} {generatedAssets.length === 1 ? 'asset' : 'assets'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                        {generatedAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 group ${
                              selectedAsset?.id === asset.id
                                ? dark
                                  ? 'ring-2 ring-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(217,160,50,0.12)]'
                                  : 'ring-2 ring-amber-400 border-amber-400 shadow-md'
                                : dark
                                  ? 'border-neutral-700 hover:border-amber-500/30'
                                  : 'border-stone-200 hover:border-amber-300'
                            }`}
                          >
                            {asset.type === 'video' ? (
                              <video src={asset.url} className="w-full h-16 object-cover" muted />
                            ) : (
                              <img src={asset.url} alt="" className="w-full h-16 object-cover" />
                            )}
                            <div className="flex items-center justify-center gap-0.5 absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {asset.type === 'video' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMode('merge'); }}
                                  className="p-0.5 rounded bg-amber-500/80 text-white hover:bg-amber-500"
                                  title="Merge this video"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                                className="p-0.5 rounded bg-red-500/80 text-white hover:bg-red-500"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className={`absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded text-[7px] font-medium ${
                              dark ? 'bg-neutral-900/80 text-neutral-500' : 'bg-white/80 text-stone-400'
                            }`}>
                              {asset.width}×{asset.height}
                              {asset.type === 'video' && asset.duration ? ` · ${asset.duration}s` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── Generate Mode ─── */
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up animate-delay-100">
                {/* Left Column - Prompt & Settings */}
                <div className="lg:col-span-3 space-y-5">
                  <ErrorAlert message={error} onDismiss={() => setError('')} />

                  {/* API Settings — manager can use their own Google API key */}
                  <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <button
                      onClick={() => setShowApiSettings(!showApiSettings)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                        dark ? 'text-neutral-300 hover:text-neutral-100' : 'text-neutral-700 hover:text-neutral-900'
                      }`}
                    >
                      <svg className={`w-4 h-4 transition-transform ${showApiSettings ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m0 0a3 3 0 01-3 3m3-3H5.25M5.25 15.75a3 3 0 01-3-3m3 3a3 3 0 013-3m-3 3v6" />
                      </svg>
                      <span className="flex-1 text-left">API Settings</span>
                      <span className={`text-[10px] font-mono ${myApiKey ? (dark ? 'text-emerald-400' : 'text-emerald-600') : (dark ? 'text-neutral-500' : 'text-stone-400')}`}>
                        {myApiKey ? 'Custom key set' : 'Using default'}
                      </span>
                    </button>

                    {showApiSettings && (
                      <div className={`px-5 pb-4 border-t ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
                        <p className={`text-[11px] mt-3 mb-2.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                          Set your own Google AI API key to use your personal quota instead of the shared workspace key.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={myApiKey}
                            onChange={(e) => setMyApiKey(e.target.value)}
                            placeholder="Enter your Google AI API key..."
                            className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none transition-all duration-200 ${
                              dark
                                ? 'bg-neutral-800/80 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
                                : 'bg-stone-50/80 border border-stone-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/15'
                            }`}
                          />
                          <button
                            onClick={handleSaveApiKey}
                            disabled={apiKeySaving}
                            className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                              apiKeySaving
                                ? dark ? 'bg-neutral-800 text-neutral-500' : 'bg-stone-100 text-stone-400'
                                : dark
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {apiKeySaving ? 'Saving...' : 'Save'}
                          </button>
                          {myApiKey && (
                            <button
                              onClick={async () => {
                                setMyApiKey('');
                                try { await managerSettings.setApiKey(''); } catch {}
                              }}
                              className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                                dark
                                  ? 'text-neutral-500 hover:text-red-400 hover:bg-neutral-800/60'
                                  : 'text-stone-400 hover:text-red-500 hover:bg-stone-100'
                              }`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prompt Input */}
                  <div className={`rounded-2xl p-5 border transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${mediaType === 'image' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <h3 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        Prompt
                      </h3>
                      <span className={`ml-auto text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                        {prompt.length} chars
                      </span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        mediaType === 'image'
                          ? 'Describe the image in detail... style, lighting, colors, composition, mood...'
                          : 'Describe the video scene... motion, camera angles, transitions, atmosphere...'
                      }
                      rows={4}
                      className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-300 resize-none ${
                        dark
                          ? 'bg-neutral-800/80 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/15'
                          : 'bg-stone-50/80 border border-stone-300 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                      }`}
                    />

                    {/* Enhance Prompt Button */}
                    <div className="flex items-center justify-end mt-2">
                      <button
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim() || enhancing}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                          enhancing
                            ? dark
                              ? 'bg-amber-500/10 text-amber-400/60 border border-amber-500/15'
                              : 'bg-amber-50 text-amber-400 border border-amber-200'
                            : prompt.trim()
                              ? dark
                                ? 'bg-gradient-to-r from-amber-500/15 to-purple-500/15 text-amber-300 border border-amber-500/25 hover:from-amber-500/25 hover:to-purple-500/25 hover:shadow-[0_0_20px_rgba(217,160,50,0.08)]'
                                : 'bg-gradient-to-r from-amber-50 to-purple-50 text-amber-700 border border-amber-200 hover:from-amber-100 hover:to-purple-100 hover:shadow-md'
                              : dark
                                ? 'text-neutral-600 border border-neutral-800 cursor-not-allowed'
                                : 'text-stone-400 border border-stone-200 cursor-not-allowed'
                        }`}
                      >
                        {enhancing ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Enhancing with AI...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            Enhance with AI ✨
                          </>
                        )}
                      </button>
                    </div>

                    {/* Negative Prompt Toggle */}
                    <button
                      onClick={() => setShowNegative(!showNegative)}
                      className={`mt-2 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                        dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <svg className={`w-3 h-3 transition-transform ${showNegative ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      Negative prompt
                    </button>

                    {showNegative && (
                      <div className="mt-2 animate-fade-in-up">
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="Things to avoid... blurry, low quality, distorted..."
                          rows={2}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-300 resize-none ${
                            dark
                              ? 'bg-neutral-800/60 border border-neutral-700 text-neutral-400 placeholder-neutral-600 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
                              : 'bg-stone-50/60 border border-stone-300 text-neutral-500 placeholder-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Settings Panel */}
                  <div className={`rounded-2xl p-5 border transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <h3 className={`text-sm font-bold mb-4 ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      Settings
                    </h3>

                    {/* Model Selector */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2.5">
                        <label className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                          Google AI Model
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(mediaType === 'image' ? imageModels : videoModels).map((m) => {
                          const isSelected = selectedModel === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setSelectedModel(m.id)}
                              className={`relative text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                                isSelected
                                  ? dark
                                    ? 'bg-amber-500/12 text-amber-300 border-2 border-amber-500/25 shadow-[0_0_10px_rgba(217,160,50,0.06)]'
                                    : 'bg-amber-50 text-amber-700 border-2 border-amber-200 shadow-sm'
                                  : dark
                                    ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700'
                                    : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-semibold">{m.name}</span>
                              </div>
                              <p className={`text-[9px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                                {m.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <label className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                          Dimensions (px)
                        </label>
                        <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                          {width} × {height} · {Math.round(width/height * 100) / 100}:1 ratio
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DimensionInput label="Width" value={width} onChange={setWidth} dark={dark} />
                        <span className={`text-lg font-light mt-5 ${dark ? 'text-neutral-600' : 'text-stone-300'}`}>
                          ×
                        </span>
                        <DimensionInput label="Height" value={height} onChange={setHeight} dark={dark} />
                        <button
                          onClick={() => { const tmp = width; setWidth(height); setHeight(tmp); }}
                          className={`mt-5 p-2 rounded-lg transition-colors ${
                            dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                          }`}
                          title="Swap dimensions"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        </button>
                      </div>

                      {/* Dimension Presets */}
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {DIMENSION_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => handleNewTemplate(preset)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                              width === preset.w && height === preset.h
                                ? dark
                                  ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                : dark
                                  ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-transparent'
                                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-transparent'
                            }`}
                          >
                            {preset.label} ({preset.w}×{preset.h})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Selector (from campaign) */}
                    {campaignLanguages.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <label className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                            Campaign Language
                          </label>
                          {selectedLanguage && (
                            <button
                              onClick={() => handleLanguageSelect(selectedLanguage)}
                              className={`text-[9px] font-medium transition-colors ${
                                dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'
                              }`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {campaignLanguages.map((lang) => {
                            const isActive = selectedLanguage?.id === lang.id;
                            return (
                              <button
                                key={lang.id}
                                onClick={() => handleLanguageSelect(lang)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                                  isActive
                                    ? dark
                                      ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25 shadow-[0_0_10px_rgba(217,160,50,0.06)]'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                                    : dark
                                      ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700'
                                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                {lang.flag && <span className="mr-1.5">{lang.flag}</span>}
                                {lang.name}
                                {isActive && (
                                  <span className="ml-1.5 text-amber-400">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className={`text-[9px] mt-1.5 ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                          {selectedLanguage
                            ? `"Create in ${selectedLanguage.name}" will be prefixed to your prompt`
                            : 'Select a language to target this generation'}
                        </p>
                      </div>
                    )}

                    {/* Duration - Video only */}
                    {mediaType === 'video' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <label className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                            Duration
                          </label>
                          <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                            {duration >= 60
                              ? `${Math.floor(duration / 60)} min ${duration % 60 > 0 ? `${duration % 60}s` : ''}`
                              : `${duration}s`
                            }
                          </span>
                        </div>

                        {/* Presets */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {DURATION_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setDuration(opt.value)}
                              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                duration === opt.value
                                  ? dark
                                    ? 'bg-amber-500/12 text-amber-300 border border-amber-500/25 shadow-[0_0_10px_rgba(217,160,50,0.06)]'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                                  : dark
                                    ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700'
                                    : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Custom Duration Input */}
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                          dark ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-stone-50/60 border-stone-200/80'
                        }`}>
                          <span className={`text-[10px] font-medium flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            Custom
                          </span>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="range"
                              min={1}
                              max={120}
                              value={duration}
                              onChange={(e) => setDuration(parseInt(e.target.value))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500 bg-neutral-600/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(217,160,50,0.3)]"
                            />
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={duration}
                              onChange={(e) => setDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                              className={`w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                dark
                                  ? 'bg-neutral-800 border border-neutral-700 text-neutral-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
                                  : 'bg-white border border-stone-300 text-neutral-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/15'
                              }`}
                            />
                            <span className={`text-[11px] flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                              sec
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Style - Image only */}
                    {mediaType === 'image' && (
                      <div>
                        <label className={`text-xs font-medium block mb-2.5 ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                          Style
                        </label>
                        <StyleSelector value={style} onChange={setStyle} dark={dark} />
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={!prompt.trim() || generating}
                    className="w-full !py-4 !text-base !font-bold !rounded-2xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    {generating
                      ? `Generating ${mediaType === 'image' ? 'Image' : 'Video'}...`
                      : `Generate ${mediaType === 'image' ? 'Image' : 'Video'} — ${width}×${height}${mediaType === 'video' ? ` · ${duration}s` : ''}`
                    }
                  </Button>
                </div>

                {/* Right Column - Preview & Gallery */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Live Preview */}
                  <div className={`rounded-2xl p-5 border transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        Preview
                      </h3>
                      <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                        {width}×{height}px
                      </span>
                    </div>
                    <div className={`max-h-[300px] rounded-xl overflow-hidden flex items-center justify-center ${
                      dark ? 'bg-neutral-800/80' : 'bg-stone-100/80'
                    }`} style={{ aspectRatio: `${width}/${height}` }}>
                      {selectedAsset ? (
                        selectedAsset.type === 'video' ? (
                          <video src={selectedAsset.url} controls className="max-w-full max-h-full object-contain" />
                        ) : (
                          <img src={selectedAsset.url} alt="Preview" className="max-w-full max-h-full object-contain" />
                        )
                      ) : (
                        <div className="text-center p-6">
                          <div className={`text-4xl mb-2 ${mediaType === 'image' ? '' : 'opacity-50'}`}>
                            {mediaType === 'image' ? '🖼️' : '🎬'}
                          </div>
                          <p className={`text-[11px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            {generatedAssets.length > 0
                              ? 'Select an asset below to preview'
                              : 'Generate your first asset to see it here'}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedAsset && (
                      <div className="flex items-center justify-between mt-3">
                        <div className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                          {selectedAsset.prompt?.slice(0, 60)}...
                        </div>
                        <button
                          onClick={() => setSelectedAsset(null)}
                          className={`text-[10px] font-medium ${
                            dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Generated Assets Gallery */}
                  {generatedAssets.length > 0 && (
                    <div className={`rounded-2xl p-5 border transition-all duration-300 ${
                      dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                          Generated Assets
                        </h3>
                        <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                          {generatedAssets.length} {generatedAssets.length === 1 ? 'asset' : 'assets'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {generatedAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 group ${
                              selectedAsset?.id === asset.id
                                ? dark
                                  ? 'ring-2 ring-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(217,160,50,0.12)]'
                                  : 'ring-2 ring-amber-400 border-amber-400 shadow-md'
                                : dark
                                  ? 'border-neutral-700 hover:border-amber-500/30'
                                  : 'border-stone-200 hover:border-amber-300'
                            }`}
                          >
                            {asset.type === 'video' ? (
                              <video src={asset.url} className="w-full h-20 object-cover" muted />
                            ) : (
                              <img src={asset.url} alt="" className="w-full h-20 object-cover" />
                            )}
                            <div className={`absolute inset-0 flex items-center justify-center ${
                              selectedAsset?.id === asset.id ? '' : 'opacity-0 group-hover:opacity-100'
                            } transition-opacity`}>
                              {selectedAsset?.id === asset.id && (
                                <div className="w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {/* Edit button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }}
                              className={`absolute top-1 left-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                dark ? 'bg-neutral-900/80 text-amber-400 hover:bg-amber-500/20' : 'bg-white/80 text-amber-600 hover:bg-amber-50 shadow'
                              }`}
                              title="Edit this asset"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {/* Merge button (video only) */}
                            {asset.type === 'video' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setMode('merge'); }}
                                className={`absolute top-8 left-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                  dark ? 'bg-neutral-900/80 text-purple-400 hover:bg-purple-500/20' : 'bg-white/80 text-purple-600 hover:bg-purple-50 shadow'
                                }`}
                                title="Add to video merge"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                                </svg>
                              </button>
                            )}
                            {/* Delete button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                              className={`absolute top-1 right-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                dark ? 'bg-neutral-900/80 text-red-400 hover:bg-red-500/20' : 'bg-white/80 text-red-500 hover:bg-red-50 shadow'
                              }`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-medium ${
                              dark ? 'bg-neutral-900/80 text-neutral-500' : 'bg-white/80 text-stone-400'
                            }`}>
                              {asset.width}×{asset.height}
                              {asset.type === 'video' && asset.duration ? ` · ${asset.duration}s` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
