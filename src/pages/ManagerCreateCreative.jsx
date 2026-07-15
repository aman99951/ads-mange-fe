import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { API_BASE, proxyMediaUrl } from '../constants';
import { ads, managerSettings, creativeSessions, creditUsage } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Button from '../components/ui/Button';
import VideoTrimmer from '../components/video/VideoTrimmer';
import AssetLightbox from '../components/ui/AssetLightbox';

// Module-level guard that survives React Strict Mode remounts
let _fetchingSessions = false;

const c = (k) => colors[k];

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function toAspectRatio(w, h) {
  const g = gcd(w, h);
  const sw = w / g;
  const sh = h / g;
  const common = {
    '1:1': '1:1', '3:4': '3:4', '4:3': '4:3',
    '9:16': '9:16', '16:9': '16:9',
    '3:2': '3:2', '2:3': '2:3',
  };
  const key = `${sw}:${sh}`;
  if (common[key]) return key;
  const ratio = w / h;
  const entries = Object.entries(common).map(([k, v]) => {
    const [aw, ah] = k.split(':').map(Number);
    return { key: v, diff: Math.abs(aw / ah - ratio) };
  });
  entries.sort((a, b) => a.diff - b.diff);
  return entries[0].key;
}

const VEO_SUPPORTED_RATIOS = new Set(['16:9', '9:16', '3:4', '4:3']);
function clampVideoAspectRatio(aspectRatio) {
  if (VEO_SUPPORTED_RATIOS.has(aspectRatio)) return aspectRatio;
  const ratioMap = { '1:1': '4:3', '3:2': '16:9', '2:3': '9:16' };
  return ratioMap[aspectRatio] || '16:9';
}

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

/* ───────── Canvas-based video merge engine (with trim support) ───────── */
function renderTransition(ctx, fromVideo, toVideo, progress, type, w, h) {
  const p = Math.max(0, Math.min(1, progress));
  switch (type) {
    case 'fade':
      ctx.drawImage(fromVideo, 0, 0, w, h);
      ctx.globalAlpha = p;
      ctx.drawImage(toVideo, 0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    case 'dissolve':
      ctx.globalAlpha = 1 - p;
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
      ctx.drawImage(fromVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(toVideo, sx - w, 0, w, h, 0, 0, w, h);
      break;
    }
    case 'slide-left': {
      const sl = Math.floor(w * p);
      ctx.drawImage(fromVideo, 0, 0, w, h, 0, 0, w, h);
      ctx.drawImage(toVideo, w - sl, 0, w, h, 0, 0, w, h);
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
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.style.position = 'absolute';
    v.style.left = '-9999px';
    v.style.width = '1px';
    v.style.height = '1px';
    document.body.appendChild(v);
    v.src = proxyMediaUrl(clip.url);
    v.onerror = () => reject(new Error(`Failed to load video ${i + 1}`));
    v.addEventListener('loadedmetadata', () => resolve(v), { once: true });
    setTimeout(() => reject(new Error(`Timeout loading video ${i + 1}`)), 15000);
  })));

  // Calculate timings (respecting trimStart/trimEnd)
  const clipDurations = clips.map((c, i) => {
    const fullDur = videos[i].duration || c.duration || 5;
    const start = c.trimStart || 0;
    const end = c.trimEnd || fullDur;
    return Math.max(0.1, end - start);
  });
  let totalDuration = 0;
  const clipStartTimes = [];
  for (let i = 0; i < totalClips; i++) {
    clipStartTimes.push(totalDuration);
    totalDuration += clipDurations[i];
    if (i < totalClips - 1) totalDuration += TRANSITION_DURATION;
  }

  // Canvas + Audio setup
  const canvas = document.createElement('canvas');
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext('2d');

  let audioCtx = null;
  let audioDest = null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioDest = audioCtx.createMediaStreamDestination();
    const audioBuffers = await Promise.all(clips.map(async (clip) => {
      try {
        const resp = await fetch(proxyMediaUrl(clip.url));
        return await audioCtx.decodeAudioData(await resp.arrayBuffer());
      } catch { return null; }
    }));
    const scheduleAhead = audioCtx.currentTime + 0.3;
    for (let i = 0; i < totalClips; i++) {
      const buf = audioBuffers[i];
      if (!buf) continue;
      const source = audioCtx.createBufferSource();
      source.buffer = buf;
      const gain = audioCtx.createGain();
      source.connect(gain);
      gain.connect(audioDest);
      const clipGainStart = scheduleAhead + clipStartTimes[i];
      const clipGainEnd = scheduleAhead + clipStartTimes[i] + clipDurations[i];
      gain.gain.setValueAtTime(0, clipGainStart);
      gain.gain.linearRampToValueAtTime(1, clipGainStart + 0.02);
      gain.gain.setValueAtTime(1, clipGainEnd);
      gain.gain.linearRampToValueAtTime(0, clipGainEnd + TRANSITION_DURATION + 0.02);
      const clipTrimStart = clips[i].trimStart || 0;
      const clipTrimEnd = clips[i].trimEnd || buf.duration;
      const clipTrimmedDur = Math.max(0.1, clipTrimEnd - clipTrimStart);
      source.start(clipGainStart, clipTrimStart, clipTrimmedDur);
      source.stop(clipGainEnd + TRANSITION_DURATION + 0.1);
    }
  } catch { audioCtx = null; audioDest = null; }

  // MediaRecorder
  const canvasStream = canvas.captureStream(fps);
  const stream = audioDest
    ? new MediaStream([...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()])
    : canvasStream;
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const resultPromise = new Promise(r => { recorder.onstop = () => r(new Blob(chunks, { type: mimeType })); });
  // Play-through render: play each clip at normal speed, capture via rAF
  recorder.start();
  let elapsedTotal = 0;

  for (let clipIdx = 0; clipIdx < totalClips; clipIdx++) {
    const video = videos[clipIdx];
    const clipDur = clipDurations[clipIdx];
    const isLast = clipIdx === totalClips - 1;

    // First clip starts from 0; subsequent clips continue from where the
    // transition left them (they were started during the previous clip's transition)
    if (clipIdx === 0) {
      video.currentTime = clips[clipIdx].trimStart || 0;
      video.play().catch(() => {});
    }

    const segmentStart = performance.now();

    // Phase 1: play trimmed clip segment
    await new Promise(resolvePhase => {
      const draw = () => {
        const elapsed = (performance.now() - segmentStart) / 1000;

        if (elapsed >= clipDur) {
          video.pause();
          resolvePhase();
          return;
        }

        ctx.clearRect(0, 0, outputW, outputH);
        ctx.drawImage(video, 0, 0, outputW, outputH);

        elapsedTotal = clipStartTimes[clipIdx] + elapsed;
        onProgress?.(Math.round((elapsedTotal / totalDuration) * 100));

        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });

    // Phase 2: transition to next clip
    if (!isLast) {
      const nextClip = videos[clipIdx + 1];
      const nextTrimStart = clips[clipIdx + 1].trimStart || 0;
      nextClip.currentTime = nextTrimStart;
      nextClip.play().catch(() => {});

      await new Promise(resolvePhase => {
        const transitionStart = performance.now();

        const draw = () => {
          const elapsed = (performance.now() - transitionStart) / 1000;

          if (elapsed >= TRANSITION_DURATION) {
            nextClip.play().catch(() => {}); // keep playing
            resolvePhase();
            return;
          }

          const transProgress = elapsed / TRANSITION_DURATION;
          ctx.clearRect(0, 0, outputW, outputH);
          renderTransition(ctx, video, nextClip, Math.min(1, transProgress), clips[clipIdx].transition || 'fade', outputW, outputH);

          elapsedTotal = clipStartTimes[clipIdx] + clipDur + elapsed;
          onProgress?.(Math.round((elapsedTotal / totalDuration) * 100));

          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      });
    }
  }

  recorder.stop();
  const blob = await resultPromise;
  videos.forEach(v => { if (v.parentNode) v.parentNode.removeChild(v); });
  if (audioCtx) audioCtx.close().catch(() => {});
  return blob;
}

/* ───────── Sub-components ───────── */

function Sidebar({ dark, mode, sessions, currentSessionId, onModeChange, onSelectSession, onNewSession, onDeleteSession }) {
  return (
    <div className={`w-[220px] flex-shrink-0 flex flex-col h-full ${
      dark ? 'bg-neutral-900/90 border-r border-neutral-800' : 'bg-white/90 border-r border-stone-200'
    }`}>
      {/* Sidebar Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
        <h2 className={`text-xs font-bold tracking-tight ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Sessions</h2>
        <button
          onClick={onNewSession}
          className={`text-[9px] font-medium px-2 py-1 rounded-lg transition-colors ${
            dark ? 'bg-neutral-800 text-neutral-400 hover:text-neutral-200' : 'bg-stone-100 text-stone-500 hover:text-stone-800'
          }`}
          title="New session"
        >
          + New
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {sessions.length === 0 && (
          <p className={`text-[10px] text-center py-4 ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
            No sessions yet
          </p>
        )}
        {sessions.map((session) => (
          <div key={session.id} className="group relative">
            <button
              onClick={() => onSelectSession(session.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                currentSessionId === session.id
                  ? dark
                    ? 'bg-amber-500/12 text-amber-300'
                    : 'bg-amber-50 text-amber-700'
                  : dark
                    ? 'text-neutral-400 hover:bg-neutral-800'
                    : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                dark ? 'bg-neutral-800' : 'bg-stone-100'
              }`}>
                {session.media_type === 'video' ? '🎬' : '🖼️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {session.title || 'Untitled'}
                </div>
                <div className={`text-[9px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                  {session.asset_count || 0} assets
                </div>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              className={`absolute right-1 bottom-1 w-5 h-5 rounded flex items-center justify-center text-[9px] transition-colors ${
                dark ? 'text-neutral-500 hover:text-red-400 hover:bg-neutral-800' : 'text-stone-400 hover:text-red-500 hover:bg-stone-100'
              }`}
              title="Delete session"
            >
              ✕
            </button>
          </div>
        ))}
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
function VideoMergerPanel({ dark, generatedAssets, setGeneratedAssets, setError, currentSessionId }) {
  const [timeline, setTimeline] = useState([]);
  const [merging, setMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [savingMerge, setSavingMerge] = useState(false);
  const [mergeSaved, setMergeSaved] = useState(false);
  const [mergeWidth, setMergeWidth] = useState(1920);
  const [mergeHeight, setMergeHeight] = useState(1080);
  // Trim state
  const [trimmingClipIndex, setTrimmingClipIndex] = useState(null);
  const [trimmingVideoUrl, setTrimmingVideoUrl] = useState('');
  const [trimmingDuration, setTrimmingDuration] = useState(0);
  const [trimmingInitialStart, setTrimmingInitialStart] = useState(0);
  const [trimmingInitialEnd, setTrimmingInitialEnd] = useState(0);
  // Filter only video assets
  const videoAssets = generatedAssets.filter(a => a.type === 'video');

  const addToTimeline = (asset) => {
    if (timeline.some(t => t.id === asset.id)) return;
    setTimeline(prev => [...prev, { ...asset, transition: 'fade', id: asset.id + '-tl-' + Date.now(), trimStart: 0, trimEnd: 0 }]);
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

  const openTrimmer = (index) => {
    const clip = timeline[index];
    setTrimmingClipIndex(index);
    setTrimmingVideoUrl(proxyMediaUrl(clip.url));
    setTrimmingDuration(clip.duration || 0);
    setTrimmingInitialStart(clip.trimStart || 0);
    setTrimmingInitialEnd(clip.trimEnd || 0);
  };

  const handleTrimApply = (trimStart, trimEnd) => {
    setTimeline(prev => prev.map((t, i) =>
      i === trimmingClipIndex ? { ...t, trimStart, trimEnd } : t
    ));
    setTrimmingClipIndex(null);
    setTrimmingVideoUrl('');
  };

  const handleTrimCancel = () => {
    setTrimmingClipIndex(null);
    setTrimmingVideoUrl('');
  };

  const hasTrim = (clip) => {
    return clip.trimStart > 0 || (clip.trimEnd > 0 && clip.duration && clip.trimEnd < clip.duration);
  };

  const getTrimmedDuration = (clip) => {
    if (clip.trimEnd > 0 && clip.trimStart >= 0) {
      return clip.trimEnd - clip.trimStart;
    }
    return clip.duration || 5;
  };

  const getTotalTrimmedDuration = () => {
    return timeline.reduce((acc, t, i) => {
      return acc + getTrimmedDuration(t) + (i < timeline.length - 1 ? TRANSITION_DURATION : 0);
    }, 0);
  };

  const handleMerge = async () => {
    if (timeline.length < 2) {
      setError('Add at least 2 videos to the timeline');
      return;
    }
    setMerging(true);
    setMergeProgress(0);
    setPreviewBlob(null);
    setMergeSaved(false);
    setError('');
    try {
      const blob = await mergeVideosClientSide(timeline, mergeWidth, mergeHeight, 30, setMergeProgress);
      setPreviewBlob(blob);
      // Add to generated assets
      const url = URL.createObjectURL(blob);
      const totalDur = getTotalTrimmedDuration();
      setGeneratedAssets(prev => [...prev, {
        type: 'video',
        url,
        prompt: `Merged video (${timeline.length} clips, ${Math.round(totalDur)}s)`,
        width: mergeWidth,
        height: mergeHeight,
        duration: Math.round(totalDur),
        id: Date.now(),
        isMerged: true,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
      setMergeProgress(0);
    }
  };

  const handleSaveMerge = async () => {
    if (!previewBlob || !currentSessionId || mergeSaved) return;
    setSavingMerge(true);
    try {
      const totalDur = getTotalTrimmedDuration();
      const file = new File([previewBlob], 'merged-video.webm', { type: 'video/webm' });
      const uploadRes = await creativeSessions.uploadMedia(file);
      await creativeSessions.addEvent(currentSessionId, {
        event_type: 'merge',
        prompt: `Merged video (${timeline.length} clips)`,
        file: uploadRes.url,
        settings: {
          width: mergeWidth,
          height: mergeHeight,
          duration: Math.round(totalDur),
          clip_count: timeline.length,
        },
      });
      setMergeSaved(true);
      const updated = await creativeSessions.list().catch(() => null);
      if (updated) { /* sessions list refreshed */ }
    } catch {
      setError('Failed to save merged video to session');
    } finally {
      setSavingMerge(false);
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
                    <video src={proxyMediaUrl(v.url)} className="w-10 h-7 rounded object-cover flex-shrink-0" muted />
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

        {/* Video Trimmer overlay */}
        {trimmingClipIndex !== null && trimmingVideoUrl && (
          <div className="mb-4">
            <VideoTrimmer
              videoUrl={trimmingVideoUrl}
              videoDuration={trimmingDuration}
              initialTrimStart={trimmingInitialStart}
              initialTrimEnd={trimmingInitialEnd}
              onApply={handleTrimApply}
              onCancel={handleTrimCancel}
              dark={dark}
            />
          </div>
        )}

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
                  <video src={proxyMediaUrl(clip.url)} className="w-12 h-8 rounded object-cover flex-shrink-0" muted />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-medium truncate ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      {clip.prompt?.slice(0, 35) || 'Video clip'}
                    </div>
                    <div className={`text-[8px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                      {(() => {
                        if (hasTrim(clip)) {
                          const trimmed = (clip.trimEnd - clip.trimStart).toFixed(1);
                          return `✂ ${trimmed}s (of ${clip.duration || '~5'}s) · ${clip.width || '-'}×${clip.height || '-'}`;
                        }
                        return `${clip.duration || '~5'}s · ${clip.width || '-'}×${clip.height || '-'}`;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {/* Trim button */}
                    <button
                      onClick={() => openTrimmer(index)}
                      className={`p-1 rounded transition-colors ${
                        hasTrim(clip)
                          ? dark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50'
                          : dark ? 'text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={hasTrim(clip) ? 'Edit trim' : 'Trim video'}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16M18 4v16M4 9h16M4 15h16" />
                      </svg>
                    </button>
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
                    <div className={`flex-1 h-px ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />                      <span className={`text-[8px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>transition:</span>
                      <TransitionSelector
                        value={clip.transition || 'fade'}
                        onChange={(v) => setTransition(index, v)}
                        dark={dark}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
          </svg>
          {merging
            ? `Merging... ${mergeProgress}%`
            : timeline.length < 2
              ? 'Add at least 2 videos'
              : `Merge ${timeline.length} Videos${timeline.length > 0 ? ` (${getTotalTrimmedDuration().toFixed(0)}s)` : ''}`
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
              {currentSessionId && (
                <Button
                  onClick={handleSaveMerge}
                  loading={savingMerge}
                  disabled={savingMerge || mergeSaved}
                  className="!py-2 !text-xs !px-4"
                >
                  {mergeSaved ? (
                    <>Saved ✓</>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                      </svg>
                      Save Merged Video
                    </>
                  )}
                </Button>
              )}
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
  { id: 'gemini-3.1-flash-lite-image', name: 'Gemini 3.1 Flash Lite', credit_cost: 1, description: 'Fastest, cheapest — 1 credit', provider: 'google', api_type: 'generateContent' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', credit_cost: 2, description: 'Fast image generation — 2 credits', provider: 'google', api_type: 'generateContent' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image', credit_cost: 3, description: 'High-efficiency — 3 credits', provider: 'google', api_type: 'generateContent' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image', credit_cost: 5, description: 'Professional quality — 5 credits', provider: 'google', is_premium: true, api_type: 'generateContent' },
];

const VIDEO_MODELS_DEFAULT = [
  { id: 'veo-3.1-lite-generate-preview', name: 'Veo 3.1 Lite', credit_cost: 4, description: 'Fastest, lightweight option' },
  { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast', credit_cost: 6, description: 'Faster generation, good quality' },
  { id: 'veo-3.1-generate-preview', name: 'Veo 3.1', credit_cost: 8, description: 'Latest cinematic video generation' },
];

// All Veo models generate up to 8s per single clip. Multi-clip splitting removed to save API costs.
const VIDEO_NO_EXTENSION = new Set(['veo-3.1-lite-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview']);

export default function ManagerCreateCreative() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('generate');
  const baseDescription = location.state?.prompt || '';
  const campaignLanguages = location.state?.languages || [];
  const campaignMediaType = location.state?.mediaType || 'image';
  const campaignDimensions = location.state?.dimensions || '';
  const videoFeedback = location.state?.videoFeedback || [];
  const revisionSummary = location.state?.revisionSummary || '';
  const adId = location.state?.adId || null;
  const adFinalAsset = location.state?.finalAsset || null;
  const adLanguageAssets = location.state?.languageAssets || [];
  // Extract session ID from URL path (e.g., /manager/create-creative/123)
  const urlSessionId = (() => {
    const parts = location.pathname.split('/');
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) return parseInt(last, 10);
    return null;
  })();
  const [mediaType, setMediaType] = useState(campaignMediaType);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  // Build prompt from base description + selected language
  const [prompt, setPrompt] = useState(baseDescription);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(
    campaignDimensions ? parseInt(campaignDimensions.split('x')[0], 10) || 1024 : 1024
  );
  const [height, setHeight] = useState(
    campaignDimensions ? parseInt(campaignDimensions.split('x')[1], 10) || 1024 : 1024
  );
  const [style, setStyle] = useState(null);
  const [duration, setDuration] = useState(8);
  // Image input state for video generation
  const [inputImageUpload, setInputImageUpload] = useState(null); // { base64, mimeType, source: 'upload'|'generated', previewUrl? }
  const [lastFrameImage, setLastFrameImage] = useState(null); // { base64, mimeType, source: 'upload'|'generated', fileName? }
  const [inputImageTab, setInputImageTab] = useState('upload'); // 'upload' | 'generated'
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInputImage, setShowInputImage] = useState(false);
  const [showEndFrame, setShowEndFrame] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      compressImage(base64, 1024).then((compressed) => {
        setInputImageUpload({ base64: compressed, mimeType: 'image/jpeg', source: 'upload', fileName: file.name });
      });
    };
    reader.readAsDataURL(file);
  };

  const lastFrameFileRef = useRef(null);
  const handleLastFrameUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file for end frame');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
        compressImage(base64, 1024).then((compressed) => {
          setLastFrameImage({ base64: compressed, mimeType: 'image/jpeg', source: 'upload', fileName: file.name });
          setShowEndFrame(true);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleLastFrameSelectGenerated = async (asset) => {
    try {
      const result = await ads.proxyImage(asset.url);
      setLastFrameImage({ base64: result.data_url, mimeType: result.mime_type, source: 'generated', previewUrl: asset.url });
      setShowEndFrame(true);
    } catch {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const dataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = proxyMediaUrl(asset.url);
        });
        setLastFrameImage({ base64: dataUrl, mimeType: 'image/png', source: 'generated', previewUrl: asset.url });
        setShowEndFrame(true);
      } catch {
        setError('Could not load the end frame image.');
      }
    }
  };

  const compressImage = (dataUrl, maxDim) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w <= maxDim && h <= maxDim) { resolve(dataUrl); return; }
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSelectGeneratedImage = async (asset) => {
    // Use backend proxy to fetch image server-side (bypasses CORS)
    try {
      const result = await ads.proxyImage(asset.url);
      setInputImageUpload({ base64: result.data_url, mimeType: result.mime_type, source: 'generated', previewUrl: asset.url });
      return;
    } catch {
      // Proxy failed — try canvas fallback (same-origin or CORS-enabled)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const dataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = proxyMediaUrl(asset.url);
        });
        setInputImageUpload({ base64: dataUrl, mimeType: 'image/png', source: 'generated', previewUrl: asset.url });
        return;
      } catch {
        setError('Could not load the image for video generation. Please download it and re-upload manually.');
      }
    }
  };

  const handleClearInputImage = () => {
    setInputImageUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Get credit cost for a given model ID
  const getCreditCost = (modelId) => {
    const allModels = [...imageModels, ...videoModels];
    const model = allModels.find(m => m.id === modelId);
    return model?.credit_cost || 0;
  };

  const formatTimestamp = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const handleCaptureReference = (mediaUrl, mediaType) => {
    const url = proxyMediaUrl(mediaUrl);

    if (mediaType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        compressImage(base64, 1024).then((compressed) => {
          setReferenceImage({ base64: compressed, mimeType: 'image/jpeg' });
        });
        img.remove();
        canvas.remove();
      };
      img.onerror = () => {
        setError('Could not load image for reference.');
      };
      img.src = url;
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    video.src = url;
    video.onloadeddata = () => {
      video.currentTime = 0;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      compressImage(base64, 1024).then((compressed) => {
        setReferenceImage({ base64: compressed, mimeType: 'image/jpeg' });
      });
      video.remove();
      canvas.remove();
    };
    video.onerror = () => {
      setError('Could not load video for frame capture.');
      video.remove();
    };
  };
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showRevisionPanel, setShowRevisionPanel] = useState(true);
  const [referenceImage, setReferenceImage] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [generatedAssets, setGeneratedAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [campaignAd, setCampaignAd] = useState(null);
  const [showNegative, setShowNegative] = useState(false);
  const [error, setError] = useState('');
  // Model selection state
  const [imageModels, setImageModels] = useState(IMAGE_MODELS_DEFAULT);
  const [videoModels, setVideoModels] = useState(VIDEO_MODELS_DEFAULT);
  const [selectedImageModel, setSelectedImageModel] = useState(IMAGE_MODELS_DEFAULT[0].id); // Gemini 2.5 Flash Image
  const [selectedVideoModel, setSelectedVideoModel] = useState(VIDEO_MODELS_DEFAULT[0].id);
  // Google API daily usage quota (real credits)
  const [googleApiQuota, setGoogleApiQuota] = useState(null);
  // Monthly credit usage stats
  const [monthlyCreditStats, setMonthlyCreditStats] = useState(null);
  // Manager's own API key
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [myApiKey, setMyApiKey] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recentMedia, setRecentMedia] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const saveTimerRef = useRef(null);
  const loadingSessionRef = useRef(false);
  const campaignAdIdRef = useRef(null);

  // Fetch models and Google API usage stats on mount
  useEffect(() => {
    fetchModels();
    fetchUsageStats();
    fetchMyApiKey();
    fetchSessions();
    fetchRecentMedia();
    fetchMonthlyCreditStats();
  }, []);

  // Auto-save session when prompt or settings change (debounced)
  useEffect(() => {
    if (!currentSessionId || loadingSessionRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCurrentSession();
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [prompt, width, height, duration, style, mediaType, selectedImageModel, selectedVideoModel, currentSessionId]);

  // Watch for URL-based session navigation (handles browser back/forward, not sidebar clicks)
  useEffect(() => {
    if (!urlSessionId) return;
    // Skip if this session is already loaded (e.g., handleSelectSession already loaded it)
    if (currentSessionId === urlSessionId) return;
    const doLoad = async () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await saveCurrentSession();
      campaignAdIdRef.current = null;
      setInputImageUpload(null);
      setReferenceImage(null);
      setGeneratedAssets([]);
      setSelectedAsset(null);
      await loadSession(urlSessionId);
    };
    doLoad();
  }, [location.pathname]);

  const saveCurrentSession = async () => {
    if (!currentSessionId) return;
    setSavingSession(true);
    try {
      // For campaign sessions, preserve the Campaign #N prefix in the title
      const titleToSave = prompt
        ? (campaignAdIdRef.current
            ? `Campaign #${campaignAdIdRef.current} - ${prompt.slice(0, 60)}`.slice(0, 80)
            : prompt.slice(0, 80))
        : undefined;
      await creativeSessions.update(currentSessionId, {
        title: titleToSave,
        media_type: mediaType,
        current_prompt: prompt,
        settings: { width, height, duration, style, mediaType, model: selectedModel, ...(campaignAdIdRef.current ? { adId: campaignAdIdRef.current } : {}) },
      });
    } catch (err) {
      // Ignore
    } finally {
      setSavingSession(false);
    }
  };

  const fetchSessions = async () => {
    if (_fetchingSessions) return; // Prevent double-creation in Strict Mode (uses module-level var to survive remounts)
    _fetchingSessions = true;
    try {
      const data = await creativeSessions.list();
      setSessions(data || []);

      // If URL has a session ID, load that session directly
      if (urlSessionId) {
        const sessionExists = (data || []).some(s => s.id === urlSessionId);
        if (sessionExists) {
          await loadSession(urlSessionId);
          return;
        }
      }

      // When coming from a campaign (adId is set), create a dedicated session for it
      if (adId) {
        // Check if there's already a session for this campaign (via settings.adId)
        const existing = (data || []).find(s => s.settings?.adId === adId);
        if (existing) {
          campaignAdIdRef.current = adId;
          await loadSession(existing.id);
          // Navigate to session URL
          navigate(`/manager/create-creative/${existing.id}`, { replace: true });
        } else {
          const campaignTitle = prompt ? prompt.slice(0, 50) : 'Campaign';
          campaignAdIdRef.current = adId;
          const newSession = await creativeSessions.create({
            title: `Campaign #${adId} - ${campaignTitle}`.slice(0, 80),
            media_type: campaignMediaType,
            current_prompt: prompt,
            settings: { width, height, duration, style, mediaType, model: selectedModel, adId },
          });
          setSessions(prev => [newSession, ...(prev || [])]);
          setCurrentSessionId(newSession.id);
          // Navigate to session URL
          navigate(`/manager/create-creative/${newSession.id}`, { replace: true });
        }
      } else if (!data || data.length === 0) {
        // No sessions exist - create a new one
        const newSession = await creativeSessions.create({
          title: prompt ? prompt.slice(0, 80) : 'New Session',
          media_type: mediaType,
          current_prompt: prompt,
          settings: { width, height, duration, style, mediaType, model: selectedModel },
        });
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
        // Navigate to session URL
        navigate(`/manager/create-creative/${newSession.id}`, { replace: true });
      } else {
        // Load the most recent session
        await loadSession(data[0].id);
        // Navigate to session URL
        navigate(`/manager/create-creative/${data[0].id}`, { replace: true });
      }
    } catch (err) {
      // Ignore
    } finally {
      _fetchingSessions = false;
    }
  };

  const loadSession = async (sessionId) => {
    loadingSessionRef.current = true;
    setGeneratedAssets([]);
    setSelectedAsset(null);
    try {
      const session = await creativeSessions.get(sessionId);
      setCurrentSessionId(session.id);
      if (session.settings) {
        const s = session.settings;
        if (s.width) setWidth(s.width);
        if (s.height) setHeight(s.height);
        if (s.duration) setDuration(s.duration);
        if (s.style) setStyle(s.style);
        if (s.mediaType) setMediaType(s.mediaType);
        if (s.model) {
          if (session.media_type === 'image') setSelectedImageModel(s.model);
          else setSelectedVideoModel(s.model);
        }
      }
      // Restore campaign association from session settings
      campaignAdIdRef.current = session.settings?.adId || null;
      // Also update the campaign selector state so publish works
      setSelectedCampaignId(session.settings?.adId || null);
      if (session.current_prompt) setPrompt(session.current_prompt);
      // Load generated assets from session events
      if (session.events?.length) {
        const assets = session.events
          .filter(e => (e.event_type === 'generate' || e.event_type === 'merge') && e.file)
          .map(e => ({
            id: e.id,
            mediaId: e.generated_media || null,
            type: e.event_type === 'merge' ? 'video' : (e.media_type || session.media_type),
            url: e.file,
            prompt: e.prompt || '',
            model: e.model_used || '',
            duration: e.duration_seconds || e.settings?.duration || null,
            width: e.settings?.width || null,
            height: e.settings?.height || null,
            isMerged: e.event_type === 'merge',
            created_at: e.created_at,
            published: false,
          }));
        setGeneratedAssets(assets);
        if (assets.length > 0) setSelectedAsset(assets[assets.length - 1]);
      }
    } catch (err) {
      // Ignore
    } finally {
      loadingSessionRef.current = false;
    }
  };

  const handleNewSession = async () => {
    try {
      campaignAdIdRef.current = null;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await saveCurrentSession();
      const newSession = await creativeSessions.create({
        title: 'New Session',
        media_type: mediaType,
        current_prompt: '',
        settings: { width, height, duration, style, mediaType, model: selectedModel },
      });
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setInputImageUpload(null);
      setPrompt('');
      setGeneratedAssets([]);
      setSelectedAsset(null);
      // Navigate to the new session URL
      navigate(`/manager/create-creative/${newSession.id}`, { replace: true });
    } catch (err) {
      // Ignore
    } finally {
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    const sessionTitle = session?.title || 'Untitled';
    if (!window.confirm(`Delete "${sessionTitle}"? This cannot be undone.`)) return;
    try {
      await creativeSessions.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          navigate(`/manager/create-creative/${remaining[0].id}`, { replace: true });
        } else {
          handleNewSession();
        }
      }
    } catch (err) {
      // Ignore
    } finally {
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    // Save current session first, then load the new one directly
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveCurrentSession();
    campaignAdIdRef.current = null;
    setInputImageUpload(null);
    setReferenceImage(null);
    setGeneratedAssets([]);
    setSelectedAsset(null);
    await loadSession(sessionId);
    // Update URL to match the active session
    navigate(`/manager/create-creative/${sessionId}`, { replace: true });
  };

  const fetchRecentMedia = async () => {
    try {
      const data = await ads.getRecentMedia();
      if (data) setRecentMedia(data);
    } catch (err) {
      // Ignore
    } finally {
    }
  };

  const fetchUsageStats = async () => {
    try {
      const data = await ads.getUsageStats();
      if (data) setGoogleApiQuota(data);
    } catch (err) {
      // Ignore if API unavailable
    }
  };

  const fetchMonthlyCreditStats = async () => {
    try {
      const data = await creditUsage.monthlyStats();
      if (data) setMonthlyCreditStats(data);
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
    } finally {
    }
  };

  const handleSaveApiKey = async () => {
    setApiKeySaving(true);
    try {
      await managerSettings.setApiKey(myApiKey);
      setNotification(myApiKey ? 'API key saved' : 'API key cleared');
      setTimeout(() => setNotification(null), 2500);
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

  // Max duration depends on model: no-extension models cap at 8s
  const videoMaxDuration = VIDEO_NO_EXTENSION.has(selectedVideoModel) ? 8 : 60;

  // Clamp duration when model changes
  useEffect(() => {
    if (mediaType === 'video' && duration > videoMaxDuration) {
      setDuration(videoMaxDuration);
    }
  }, [selectedVideoModel, mediaType]);

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
        edit_mode: !!referenceImage,
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

  // Filter only image assets for the image picker
  const generatedImageAssets = generatedAssets.filter(a => a.type === 'image');

  // Total estimated credits from all generated assets in this session
  const totalEstimatedCredits = generatedAssets.reduce((sum, asset) => {
    return sum + getCreditCost(asset.model);
  }, 0);

  const handleNewTemplate = (preset) => {
    setWidth(preset.w);
    setHeight(preset.h);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    // Ensure we have a session
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const newSession = await creativeSessions.create({
          title: prompt.trim().slice(0, 80),
          media_type: mediaType,
          current_prompt: prompt,
          settings: { width, height, duration, style, mediaType, model: selectedModel },
        });
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        sessionId = newSession.id;
      } catch (err) { /* ignore */ }
    }
    setGenerating(true);
    setError('');
    try {
      const aspectRatio = toAspectRatio(width, height);
      if (mediaType === 'image') {
        const imagePayload = {
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
          model: selectedImageModel,
        };
        if (inputImageUpload?.base64) {
          imagePayload.input_image = inputImageUpload.base64;
        } else if (referenceImage) {
          imagePayload.input_image = referenceImage.base64;
        }
        const result = await ads.generateImage(imagePayload);
        const newAsset = {
          type: 'image', url: result.url, prompt: prompt.trim(),
          width, height, style, model: result.model_used,
          id: Date.now(), mediaId: result.generated_media_id,
          created_at: new Date().toISOString(),
        };
        setGeneratedAssets(prev => [...prev, newAsset]);
        setSelectedAsset(newAsset);
        fetchUsageStats();
        creditUsage.log({
          model_id: selectedImageModel,
          credit_cost: getCreditCost(selectedImageModel),
          media_type: 'image',
          generated_media: result.generated_media_id || null,
        }).catch(() => {});
        fetchMonthlyCreditStats();
        if (sessionId && result.generated_media_id) {
          creativeSessions.addEvent(sessionId, {
            event_type: 'generate',
            prompt: prompt.trim(),
            settings: { width, height, style, mediaType, model: selectedImageModel },
            generated_media_id: result.generated_media_id,
          }).catch(() => {});
        }
      } else {
        const hasBothFrames = lastFrameImage?.base64 && (inputImageUpload?.base64 || referenceImage);
        const perClipDuration = hasBothFrames ? 8 : (duration > 8 ? 8 : [4, 6, 8].reduce((a, b) => Math.abs(b - duration) < Math.abs(a - duration) ? b : a));
        let effectivePrompt;
        if (editingAsset && referenceImage) {
          const originalContext = editingAsset.prompt
            ? `Original scene: ${editingAsset.prompt}.`
            : '';
          effectivePrompt = `Maintain the exact same scene composition, camera angle, lighting, and style as the reference image. ${originalContext} Apply only this specific change: ${prompt.trim()}. Do not change anything else about the scene.`;
        } else {
          effectivePrompt = !audioEnabled
            ? `Silent video, no audio, no speech, no voiceover. ${prompt.trim()}`
            : prompt.trim();
        }
        const generatePayload = {
          prompt: effectivePrompt,
          aspect_ratio: clampVideoAspectRatio(aspectRatio),
          duration_seconds: perClipDuration,
          target_duration_seconds: hasBothFrames ? 8 : duration,
          model: selectedVideoModel,
        };
        if (inputImageUpload?.base64) {
          generatePayload.input_image = inputImageUpload.base64;
        } else if (referenceImage) {
          generatePayload.input_image = referenceImage.base64;
        }
        if (lastFrameImage?.base64) {
          generatePayload.last_frame = lastFrameImage.base64;
        }
        const result = await ads.generateVideoClip(generatePayload);
        const newAsset = {
          type: 'video', url: result.url, prompt: prompt.trim(),
          width, height, duration: result.target_duration_seconds || result.duration_seconds || duration, model: result.model_used,
          id: Date.now(), mediaId: result.generated_media_id,
          created_at: new Date().toISOString(),
        };
        setGeneratedAssets(prev => [...prev, newAsset]);
        setSelectedAsset(newAsset);
        fetchUsageStats();
        creditUsage.log({
          model_id: selectedVideoModel,
          credit_cost: getCreditCost(selectedVideoModel),
          media_type: 'video',
          generated_media: result.generated_media_id || null,
        }).catch(() => {});
        fetchMonthlyCreditStats();
        if (sessionId && result.generated_media_id) {
          creativeSessions.addEvent(sessionId, {
            event_type: 'generate',
            prompt: prompt.trim(),
            settings: { width, height, duration, mediaType, model: selectedVideoModel },
            generated_media_id: result.generated_media_id,
          }).catch(() => {});
        }
      }
      // Refresh sessions list to update asset counts
      const updated = await creativeSessions.list().catch(() => null);
      if (updated) setSessions(updated);
    } catch (err) {
      if (err.data?.google_api_quota) setGoogleApiQuota(err.data.google_api_quota);
      else fetchUsageStats();
      setError(err.message);
    } finally {
      setGenerating(false);
      setEditingAsset(null);
    }
  };

  const [publishing, setPublishing] = useState(false);
  const [videoLanguageMap, setVideoLanguageMap] = useState({});
  const [selectedCampaignId, setSelectedCampaignId] = useState(adId || '');

  const effectiveAdId = adId || selectedCampaignId || campaignAdIdRef.current;

  // Extract published media IDs from the campaign's final_asset filename (studio_{mediaId}_...)
  const publishedMediaIdFromAd = (() => {
    if (!campaignAd?.final_asset) return null;
    const match = campaignAd.final_asset.match(/studio_(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  })();
  const publishedLangMediaIds = (() => {
    if (!campaignAd?.language_assets?.length) return new Set();
    const ids = new Set();
    campaignAd.language_assets.forEach(la => {
      if (la.asset) {
        const m = la.asset.match(/lang_\d+_(\d+)_/);
        if (m) ids.add(parseInt(m[1], 10));
      }
    });
    return ids;
  })();
  const isAssetPublished = (asset) => {
    const mid = asset?.mediaId;
    if (!mid) return false;
    return mid === publishedMediaIdFromAd || publishedLangMediaIds.has(mid);
  };

  const fetchCampaignAd = async () => {
    if (!effectiveAdId) { setCampaignAd(null); return; }
    try {
      const data = await ads.get(effectiveAdId);
      setCampaignAd(data);
    } catch {}
  };

  useEffect(() => { fetchCampaignAd(); }, [effectiveAdId]);

  // Derive live feedback from DB (campaignAd.video_feedback) — falls back to location.state
  const liveVideoFeedback = (() => {
    const db = campaignAd?.video_feedback;
    if (db && db.length > 0) return db;
    return videoFeedback;
  })();
  const liveRevisionSummary = (() => {
    if (campaignAd?.iterations?.length) {
      const lastClient = [...campaignAd.iterations].filter(i => i.created_by === 'client').pop();
      if (lastClient?.feedback) return lastClient.feedback;
    }
    return revisionSummary;
  })();
  const liveFinalAsset = adFinalAsset || campaignAd?.final_asset || null;
  const liveLanguageAssets = adLanguageAssets.length > 0 ? adLanguageAssets : (campaignAd?.language_assets?.filter(a => a.asset && a.status === 'completed') || []);

  const handlePublishToCampaign = async (assetToPublish) => {
    const asset = assetToPublish || selectedAsset;
    if (!effectiveAdId || !asset) return;
    const mediaId = asset.mediaId;
    if (!mediaId) {
      setError('This asset cannot be published. Generate a new asset first.');
      return;
    }
    const assetIds = [mediaId];
    // Collect language-specific assignments
    const languageAssets = [];
    const assignedMediaIds = new Set(
      Object.keys(videoLanguageMap).map(k => parseInt(k, 10)).filter(Boolean)
    );
    if (assignedMediaIds.has(mediaId)) {
      const langId = videoLanguageMap[mediaId.toString()];
      if (langId) {
        languageAssets.push({
          language_id: langId,
          generated_media_id: mediaId,
          prompt: asset.prompt || '',
        });
      }
    }
    setPublishing(true);
    try {
      await ads.saveGeneratedAssets(effectiveAdId, {
        asset_ids: assetIds.filter(id => !assignedMediaIds.has(id)),
        language_assets: languageAssets,
      });
      setNotification('Published to campaign! Client will be notified.');
      await fetchCampaignAd();
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleEditAsset = (asset) => {
    setMode('generate');
    setMediaType(asset.type);
    setPrompt('');
    setWidth(asset.width || 1024);
    setHeight(asset.height || 1024);
    setStyle(asset.style || null);
    if (asset.duration) {
      setDuration(asset.duration);
    }
    setSelectedAsset(asset);
    setEditingAsset(asset);
    if (asset.url) {
      handleCaptureReference(asset.url, asset.type);
    }
    setTimeout(() => {
      const promptEl = document.querySelector('textarea');
      if (promptEl) {
        promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        promptEl.focus();
      }
    }, 100);
  };

  const removeAsset = async (id) => {
    const asset = generatedAssets.find(a => a.id === id);
    const label = asset?.type === 'video' ? 'video' : 'image';
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;

    setGeneratedAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);

    try {
      await ads.deleteAsset({ media_id: asset?.mediaId || null, event_id: id });
    } catch {
      // Backend delete failed — asset already removed from UI, acceptable
    }
  };

  return (
    <AppLayout fullWidth>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          dark={dark}
          mode={mode}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onModeChange={setMode}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />

        {/* Recent Media toggle */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 px-1.5 py-3 rounded-l-lg text-xs transition-colors ${
            dark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-white text-stone-500 hover:text-stone-900 shadow-md'
          }`}
          title="Recent media"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className={`${mode === 'merge' ? 'max-w-[900px]' : 'max-w-[1100px]'} mx-auto p-6 lg:p-8`}>
            {/* Back button — returns to the page the user came from */}
            <button
              onClick={() => {
                if (window.confirm('Do you want to exit this page? Any unsaved progress will be lost.')) {
                  navigate(-1);
                }
              }}
              className={`flex items-center gap-1.5 mb-5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>

            {/* Credit Dashboard & Google API Quota */}
            {/* Monthly Credit Usage — persisted in database */}
            {monthlyCreditStats && (
              <div className={`mb-4 rounded-xl border transition-all duration-300 ${
                dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    dark ? 'bg-amber-500/10' : 'bg-amber-100'
                  }`}>
                    <svg className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      Monthly Credit Usage — {monthlyCreditStats.month}/{monthlyCreditStats.year}
                    </div>
                    <div className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                      {monthlyCreditStats.total_generations} generation{monthlyCreditStats.total_generations !== 1 ? 's' : ''} · {monthlyCreditStats.total_credits} cr total
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Images</div>
                      <div className={`text-xs font-bold font-mono ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {monthlyCreditStats.image_credits} cr
                      </div>
                      <div className={`text-[8px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                        {monthlyCreditStats.image_generations} gen
                      </div>
                    </div>
                    <div className={`w-px h-8 ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />
                    <div>
                      <div className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Videos</div>
                      <div className={`text-xs font-bold font-mono ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {monthlyCreditStats.video_credits} cr
                      </div>
                      <div className={`text-[8px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                        {monthlyCreditStats.video_generations} gen
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google API Rate Limit — live data from API responses */}
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
                      Google API Rate Limit
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
                      Real-time rate limit from Google API responses
                    </div>
                  </div>
                </div>
              </div>
            )}            {mode === 'merge' ? (
              /* ─── Video Merger Mode ─── */
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up animate-delay-100">
                <div className="lg:col-span-5">
                  <button
                    onClick={() => setMode('generate')}
                    className={`flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Back to Generate
                  </button>
                  <ErrorAlert message={error} onDismiss={() => setError('')} />
                  <VideoMergerPanel
                    dark={dark}
                    generatedAssets={generatedAssets}
                    setGeneratedAssets={setGeneratedAssets}
                    setError={setError}
                    currentSessionId={currentSessionId}
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
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            {generatedAssets.length} {generatedAssets.length === 1 ? 'asset' : 'assets'}
                          </span>
                          {totalEstimatedCredits > 0 && (
                            <span className={`text-[9px] font-mono ${dark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                              ~{totalEstimatedCredits} cr
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                        {[...generatedAssets].sort((a, b) => (b.created_at || b.id) - (a.created_at || a.id)).map((asset) => (
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
                              <video src={proxyMediaUrl(asset.url)} className="w-full h-16 object-cover" muted />
                            ) : (
                              <img src={proxyMediaUrl(asset.url)} alt="" className="w-full h-16 object-cover" />
                            )}
                            <div className="flex items-center justify-center gap-0.5 absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setLightboxAsset(asset); }}
                                className="p-0.5 rounded bg-amber-500/80 text-white hover:bg-amber-500"
                                title="View full size"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <circle cx="11" cy="11" r="4" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 7v8M7 11h8" />
                                </svg>
                              </button>
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
              <div className="animate-fade-in-up animate-delay-100">
                <ErrorAlert message={error} onDismiss={() => setError('')} />

                {notification && (
                  <div className={`mb-4 px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fade-in-up ${
                    dark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {notification}
                  </div>
                )}

                {/* ─── Revision Feedback Panel ─── */}
                {showRevisionPanel && (liveVideoFeedback.length > 0 || liveRevisionSummary) && (
                  <div className={`mb-4 rounded-xl border-2 overflow-hidden animate-fade-in-up ${
                    dark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${dark ? 'bg-amber-500/15' : 'bg-amber-100'}`}>
                          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Revision Request — Client Feedback</h4>
                          <p className={`text-[10px] ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>{liveVideoFeedback.length} comment{liveVideoFeedback.length !== 1 ? 's' : ''} — address the feedback below, then generate a new version.</p>
                        </div>
                      </div>
                      <button onClick={() => setShowRevisionPanel(false)}
                        className={`p-1 rounded-lg transition-colors ${dark ? 'text-amber-400/50 hover:text-amber-300 hover:bg-amber-500/10' : 'text-amber-600/50 hover:text-amber-800 hover:bg-amber-100'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="px-4 py-3 space-y-2 max-h-60 overflow-y-auto">
                      {liveVideoFeedback.map((fb, i) => (
                        <div key={fb.id || i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs border ${
                          dark ? 'bg-neutral-800/60 border-neutral-700/50' : 'bg-white border-stone-200'
                        }`}>
                          <div className="w-1 h-full min-h-[1.5rem] rounded-full flex-shrink-0 bg-amber-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              {fb.timestamp_seconds != null && (
                                <span className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {(() => {
                                    const m = Math.floor(fb.timestamp_seconds / 60);
                                    const s = Math.floor(fb.timestamp_seconds % 60);
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                  })()}
                                </span>
                              )}
                              {fb.language_name && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  dark ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {fb.language_name}
                                </span>
                              )}
                              <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                                {fb.user_name || 'Client'}
                              </span>
                            </div>
                            <p className={dark ? 'text-neutral-200' : 'text-neutral-800'}>{fb.comment}</p>
                          </div>
                        </div>
                      ))}
                      {liveRevisionSummary && (
                        <div className={`px-3 py-2.5 rounded-lg text-xs border-l-4 ${
                          dark ? 'bg-neutral-800/40 border-amber-500/30 text-neutral-400' : 'bg-amber-50/50 border-amber-400 text-amber-800'
                        }`}>
                          <span className="font-semibold">Summary: </span>{liveRevisionSummary}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Review & Send Back to Client ─── */}
                {(effectiveAdId || adId) && (liveFinalAsset || liveLanguageAssets.length > 0) && (
                  <div className={`mb-4 rounded-xl border overflow-hidden animate-fade-in-up ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${
                      dark ? 'border-neutral-800' : 'border-stone-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${dark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Current Ad Videos — Client Comments</h4>
                          <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            Review client feedback below, then generate new assets above.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-4">
                      {/* Main video */}
                      {liveFinalAsset && (
                        <div className={`rounded-xl border overflow-hidden ${
                          dark ? 'border-neutral-800' : 'border-stone-200'
                        }`}>
                          <div className={`px-3 py-2 border-b flex items-center justify-between ${
                            dark ? 'border-neutral-800' : 'border-stone-100'
                          }`}>
                            <span className={`text-xs font-semibold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Main Video</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCaptureReference(liveFinalAsset)}
                                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                  dark ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Edit This
                              </button>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {liveFinalAsset.width}×{liveFinalAsset.height}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <video
                              src={liveFinalAsset}
                              controls
                              className="w-full rounded-lg"
                              style={{ maxHeight: 240 }}
                            />
                            {/* Client feedback for main video */}
                            {liveVideoFeedback.filter(fb => !fb.language_asset).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {liveVideoFeedback.filter(fb => !fb.language_asset).map((fb, i) => (
                                  <div key={fb.id || i} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                                    dark ? 'bg-neutral-800/60' : 'bg-stone-50'
                                  }`}>
                                    {fb.timestamp_seconds != null && (
                                      <span className={`px-1 py-0.5 rounded font-mono font-bold flex-shrink-0 ${
                                        dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {formatTimestamp(fb.timestamp_seconds)}
                                      </span>
                                    )}
                                    <span className={dark ? 'text-neutral-300' : 'text-neutral-700'}>{fb.user_name || 'Client'}: </span>
                                    <span className={dark ? 'text-neutral-400' : 'text-stone-500'}>{fb.comment}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Language assets */}
                      {liveLanguageAssets.map((la) => (
                        <div key={la.id} className={`rounded-xl border overflow-hidden ${
                          dark ? 'border-neutral-800' : 'border-stone-200'
                        }`}>
                          <div className={`px-3 py-2 border-b flex items-center justify-between ${
                            dark ? 'border-neutral-800' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>{la.language_name || 'Language Asset'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                dark ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {la.language_code?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCaptureReference(la.asset)}
                                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                  dark ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Edit This
                              </button>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {la.width}×{la.height}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <video
                              src={la.asset}
                              controls
                              className="w-full rounded-lg"
                              style={{ maxHeight: 240 }}
                            />
                            {/* Client feedback for this language asset */}
                            {liveVideoFeedback.filter(fb => fb.language_asset === la.id).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {liveVideoFeedback.filter(fb => fb.language_asset === la.id).map((fb, i) => (
                                  <div key={fb.id || i} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                                    dark ? 'bg-neutral-800/60' : 'bg-stone-50'
                                  }`}>
                                    {fb.timestamp_seconds != null && (
                                      <span className={`px-1 py-0.5 rounded font-mono font-bold flex-shrink-0 ${
                                        dark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {formatTimestamp(fb.timestamp_seconds)}
                                      </span>
                                    )}
                                    <span className={dark ? 'text-neutral-300' : 'text-neutral-700'}>{fb.user_name || 'Client'}: </span>
                                    <span className={dark ? 'text-neutral-400' : 'text-stone-500'}>{fb.comment}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Top Toolbar: Model, Dimensions, Style, Duration, Generate ─── */}
                <div className={`rounded-xl border transition-all duration-300 px-4 py-3 mb-4 ${
                  dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Model */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium hidden sm:inline ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Model</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none ${
                          dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                        }`}
                      >
                        {(mediaType === 'image' ? imageModels : videoModels).map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.credit_cost} cr){m.is_premium ? ' ★' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className={`w-px h-5 ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />

                    {/* Media Type */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium hidden sm:inline ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Type</span>
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium outline-none ${
                          dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                        }`}
                      >
                        {MEDIA_TYPES.map((mt) => (
                          <option key={mt.key} value={mt.key}>{mt.icon} {mt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={`w-px h-5 ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />

                    {/* Dimensions */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium hidden sm:inline ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Size</span>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                        className={`w-14 px-1.5 py-1.5 rounded-lg text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                        }`}
                        min={64}
                        max={4096}
                      />
                      <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>×</span>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                        className={`w-14 px-1.5 py-1.5 rounded-lg text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                        }`}
                        min={64}
                        max={4096}
                      />
                      <button
                        onClick={() => { const tmp = width; setWidth(height); setHeight(tmp); }}
                        className={`p-1 rounded transition-colors ${dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </button>
                      {/* Presets dropdown */}
                      <div className="relative group">
                        <button className={`px-1.5 py-1.5 rounded text-[9px] font-medium transition-colors ${
                          dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                        }`}>
                          Presets ▾
                        </button>
                        <div className={`absolute top-full left-0 mt-1 z-20 w-36 rounded-xl border shadow-lg overflow-hidden hidden group-hover:block ${
                          dark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-stone-200'
                        }`}>
                          {DIMENSION_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => handleNewTemplate(preset)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] transition-colors ${
                                width === preset.w && height === preset.h
                                  ? dark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700'
                                  : dark ? 'text-neutral-400 hover:bg-neutral-700' : 'text-stone-500 hover:bg-stone-100'
                              }`}
                            >
                              <span>{preset.label}</span>
                              <span className={dark ? 'text-neutral-600' : 'text-stone-400'}>{preset.w}×{preset.h}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`w-px h-5 ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />

                    {/* Duration (video) or Style (image) */}
                    {mediaType === 'video' ? (
                      <>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium hidden sm:inline ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Dur</span>
                        <input
                          type="number"
                          min={4}
                          max={videoMaxDuration}
                          value={duration}
                          onChange={(e) => setDuration(Math.max(4, Math.min(videoMaxDuration, parseInt(e.target.value) || 4)))}
                          className={`w-12 px-1.5 py-1.5 rounded-lg text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                          }`}
                        />
                        <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>sec (max {videoMaxDuration})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAudioEnabled(!audioEnabled)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                            audioEnabled
                              ? dark
                                ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/25'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dark
                                ? 'text-neutral-500 border border-transparent hover:border-neutral-700'
                                : 'text-stone-400 border border-transparent hover:border-stone-200'
                          }`}
                          title={audioEnabled ? 'Video will have audio (speech, sound)' : 'Silent video, no audio'}
                        >
                          {audioEnabled ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          )}
                          <span>{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                        </button>
                      </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`text-[10px] font-medium hidden sm:inline ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Style</span>
                        <select
                          value={style || ''}
                          onChange={(e) => setStyle(e.target.value || null)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-medium outline-none ${
                            dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200' : 'bg-stone-50 border border-stone-300 text-neutral-900'
                          }`}
                        >
                          <option value="">None</option>
                          {STYLE_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Language chips (from campaign) */}
                    {campaignLanguages.length > 0 && (
                      <>
                        <div className={`w-px h-5 ${dark ? 'bg-neutral-700' : 'bg-stone-200'}`} />
                        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px]">
                          {campaignLanguages.map((lang) => {
                            const isActive = selectedLanguage?.id === lang.id;
                            return (
                              <button
                                key={lang.id}
                                onClick={() => handleLanguageSelect(lang)}
                                className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                                  isActive
                                    ? dark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700'
                                    : dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'
                                }`}
                              >
                                {lang.flag}{lang.name}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Spacer + Actions on the right */}
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowApiSettings(!showApiSettings)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          showApiSettings
                            ? dark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : dark ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-transparent'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m0 0a3 3 0 01-3 3m3-3H5.25M5.25 15.75a3 3 0 01-3-3m3 3a3 3 0 013-3m-3 3v6" />
                        </svg>
                        API Key
                        {myApiKey && <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />}
                      </button>
                      <Button
                        onClick={handleGenerate}
                        loading={generating}
                        disabled={!prompt.trim() || generating}
                        size="sm"
                        className="!px-5 !py-1.5 !text-xs !font-bold !rounded-lg whitespace-nowrap"
                      >
                        {generating ? 'Generating...' : `Generate ${mediaType === 'image' ? 'Image' : 'Video'} (${getCreditCost(selectedModel)} cr)`}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* API Settings drawer */}
                {showApiSettings && (
                  <div className={`rounded-xl border mb-4 px-4 py-3 transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={myApiKey}
                        onChange={(e) => setMyApiKey(e.target.value)}
                        placeholder="Enter your Google AI API key..."
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono outline-none ${
                          dark ? 'bg-neutral-800 border border-neutral-700 text-neutral-200 placeholder-neutral-500' : 'bg-stone-50 border border-stone-300 text-neutral-900 placeholder-neutral-400'
                        }`}
                      />
                      <button
                        onClick={handleSaveApiKey}
                        disabled={apiKeySaving}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 ${
                          apiKeySaving
                            ? dark ? 'bg-neutral-800 text-neutral-500' : 'bg-stone-100 text-stone-400'
                            : dark ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {apiKeySaving ? 'Saving...' : 'Save'}
                      </button>
                      {myApiKey && (
                        <button
                          onClick={async () => { setMyApiKey(''); try { await managerSettings.setApiKey(''); } catch {} }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${dark ? 'text-neutral-500 hover:text-red-400' : 'text-stone-400 hover:text-red-500'}`}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Reference Image Preview ─── */}
                {referenceImage && (
                  <div className={`rounded-xl border mb-4 px-4 py-3 flex items-center gap-3 animate-fade-in-up ${
                    dark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <img src={referenceImage.base64} alt="Reference" className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Editing from reference {mediaType === 'video' ? 'frame' : 'image'}</p>
                      <p className={`text-[10px] ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                        Your prompt will be applied to this {mediaType === 'video' ? 'frame' : 'image'}. The AI will generate a new {mediaType} based on this image + your prompt.
                      </p>
                    </div>
                    <button
                      onClick={() => setReferenceImage(null)}
                      className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-amber-400/50 hover:text-amber-300 hover:bg-amber-500/10' : 'text-amber-600/50 hover:text-amber-800 hover:bg-amber-100'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* --- Image Source (only for video mode) --- */}
                {mediaType === 'video' && (
                  <div className={`rounded-xl border mb-4 transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <button
                      onClick={() => setShowInputImage(!showInputImage)}
                      className={`w-full flex items-center gap-2 px-4 pt-3 pb-3 transition-colors ${
                        dark ? 'hover:bg-neutral-800/50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'} transition-transform duration-200 ${showInputImage ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      <svg className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <h4 className={`text-xs font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        Input Image
                      </h4>
                      <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                        ({inputImageUpload ? 'image selected' : 'optional'})
                      </span>
                      {inputImageUpload && (
                        <span className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Set
                        </span>
                      )}
                      <svg className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${showInputImage ? 'rotate-180' : ''} ${
                        dark ? 'text-neutral-500' : 'text-stone-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {showInputImage && (
                    <div className="px-4 pb-3">
                      <div className="flex gap-1 mb-3">
                        <button
                          onClick={() => setInputImageTab('upload')}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all ${inputImageTab === 'upload' ? dark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700' : dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
                        >
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                          Upload from Device
                        </button>
                        <button
                          onClick={() => setInputImageTab('generated')}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all ${inputImageTab === 'generated' ? dark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700' : dark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
                        >
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                          From Generated Images
                        </button>
                      </div>
                      {inputImageTab === 'upload' ? (
                        <>
                          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageFileUpload} className="hidden" />
                          {!inputImageUpload ? (
                            <button onClick={() => fileInputRef.current?.click()} className={`w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${dark ? 'border-neutral-700 hover:border-amber-500/40 bg-neutral-800/30 hover:bg-neutral-800/50' : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-100'}`}>
                              <div className="flex flex-col items-center gap-2">
                                <svg className={`w-8 h-8 ${dark ? 'text-neutral-500' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                <span className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>Click to upload an image</span>
                                <span className={`text-[9px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>PNG, JPG, WebP</span>
                              </div>
                            </button>
                          ) : (
                            <div className={`flex items-center gap-3 p-2 rounded-xl border ${dark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-stone-50 border-stone-200'}`}>
                              <img src={proxyMediaUrl(inputImageUpload.source === 'generated' && inputImageUpload.previewUrl ? inputImageUpload.previewUrl : inputImageUpload.base64)} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                              <div className="flex-1 min-w-0">
                                <div className={`text-[10px] font-medium truncate ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>{inputImageUpload.fileName || 'Selected image'}</div>
                                <div className={`text-[8px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Source: {inputImageUpload.source === 'upload' ? 'Device upload' : 'Generated image'}</div>
                              </div>
                              <button onClick={() => fileInputRef.current?.click()} className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${dark ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}>Change</button>
                              <button
                                onClick={handleClearInputImage}
                                className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${
                                  dark ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-red-600 bg-red-50 hover:bg-red-100'
                                }`}
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          {generatedImageAssets.length === 0 ? (
                            <div className={`p-4 rounded-xl border-2 border-dashed text-center ${dark ? 'border-neutral-700 bg-neutral-800/30' : 'border-stone-300 bg-stone-50/50'}`}>
                              <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No generated images yet. Generate images first.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[180px] overflow-y-auto p-1">
                              {generatedImageAssets.map((asset) => {
                                const isSelected = inputImageUpload?.source === 'generated' && inputImageUpload?.previewUrl === asset.url;
                                return (
                                  <button key={asset.id} onClick={() => {
                              if (isSelected) {
                                handleClearInputImage();
                              } else {
                                handleSelectGeneratedImage(asset);
                              }
                            }} className={`relative rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-amber-500 ring-1 ring-amber-500/30' : dark ? 'border-neutral-700 hover:border-amber-500/40' : 'border-stone-200 hover:border-amber-400'}`}>
                                    <img src={proxyMediaUrl(asset.url)} alt="" className="w-full aspect-[3/2] object-cover" />
                                    {isSelected && <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center"><svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                )}

                {/* --- End Frame Image (only for video mode) --- */}
                {mediaType === 'video' && (
                  <div className={`rounded-xl border mb-4 transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <button
                      onClick={() => setShowEndFrame(!showEndFrame)}
                      className={`w-full flex items-center gap-2 px-4 pt-3 pb-3 transition-colors ${
                        dark ? 'hover:bg-neutral-800/50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${dark ? 'text-purple-400' : 'text-purple-600'} transition-transform duration-200 ${showEndFrame ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      <svg className={`w-4 h-4 ${dark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <h4 className={`text-xs font-bold ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        End Frame
                      </h4>
                      <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                        ({lastFrameImage ? 'image selected' : 'optional'})
                      </span>
                      {lastFrameImage && (
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          dark ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          Set
                        </span>
                      )}
                      <svg className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${showEndFrame ? 'rotate-180' : ''} ${
                        dark ? 'text-neutral-500' : 'text-stone-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {showEndFrame && (
                    <div className="px-4 pb-3">
                      {lastFrameImage ? (
                        <div className={`flex items-center gap-3 p-2 rounded-xl border ${dark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-stone-50 border-stone-200'}`}>
                          <img src={proxyMediaUrl(lastFrameImage.source === 'generated' && lastFrameImage.previewUrl ? lastFrameImage.previewUrl : lastFrameImage.base64)} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                          <div className="flex-1 min-w-0">
                            <div className={`text-[10px] font-medium truncate ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>{lastFrameImage.fileName || 'End frame'}</div>
                            <div className={`text-[8px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Source: {lastFrameImage.source === 'upload' ? 'Device upload' : 'Generated image'}</div>
                          </div>
                          <button onClick={() => lastFrameFileRef.current?.click()} className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${dark ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'}`}>Change</button>
                          <button
                            onClick={() => setLastFrameImage(null)}
                            className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${
                              dark ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <input ref={lastFrameFileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLastFrameUpload} className="hidden" />
                          <div className="flex gap-2">
                            <button onClick={() => lastFrameFileRef.current?.click()} className={`flex-1 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${dark ? 'border-neutral-700 hover:border-purple-500/40 bg-neutral-800/30 hover:bg-neutral-800/50' : 'border-stone-300 hover:border-purple-400 bg-stone-50/50 hover:bg-stone-100'}`}>
                              <div className="flex flex-col items-center gap-1.5">
                                <svg className={`w-6 h-6 ${dark ? 'text-neutral-500' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                <span className={`text-[10px] font-medium ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>Upload End Frame</span>
                              </div>
                            </button>
                            {generatedImageAssets.length > 0 && (
                              <div className={`flex-1 p-3 rounded-xl border-2 border-dashed transition-all ${dark ? 'border-neutral-700 bg-neutral-800/30' : 'border-stone-300 bg-stone-50/50'}`}>
                                <p className={`text-[9px] mb-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Or pick from generated:</p>
                                <div className="flex gap-1 overflow-x-auto pb-1">
                                  {generatedImageAssets.slice(0, 6).map((asset) => (
                                    <button key={asset.id} onClick={() => handleLastFrameSelectGenerated(asset)} className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${dark ? 'border-neutral-700 hover:border-purple-500/40' : 'border-stone-200 hover:border-purple-400'}`}>
                                      <img src={proxyMediaUrl(asset.url)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className={`text-[9px] mt-2 ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>
                            Video will smoothly transition from the start frame to this end frame. Duration locked to 8 seconds.
                          </p>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                )}

                {/* ─── Main Content: Prompt (left) + Preview (right) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Prompt */}
                  <div className="lg:col-span-3">
                    <div className={`rounded-xl border h-full transition-all duration-300 ${
                      dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                    }`}>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          mediaType === 'image'
                            ? 'Describe the image... style, lighting, colors, composition, mood...'
                            : 'Describe the video scene... motion, camera angles, transitions, atmosphere...'
                        }
                        className={`w-full min-h-[160px] lg:min-h-[200px] px-4 py-3.5 text-sm outline-none transition-all duration-300 resize-none rounded-xl ${
                          dark
                            ? 'bg-transparent text-neutral-100 placeholder-neutral-500'
                            : 'bg-transparent text-neutral-900 placeholder-neutral-400'
                        }`}
                      />
                      <div className={`flex items-center justify-between px-4 py-2 border-t ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
                        <button
                          onClick={() => setShowNegative(!showNegative)}
                          className={`text-[10px] font-medium flex items-center gap-1 transition-colors ${
                            dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          <svg className={`w-3 h-3 transition-transform ${showNegative ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          Negative
                        </button>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-stone-400'}`}>{prompt.length} chars</span>
                          <button
                            onClick={handleEnhancePrompt}
                            disabled={!prompt.trim() || enhancing}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                              enhancing
                                ? dark ? 'bg-amber-500/10 text-amber-400/60' : 'bg-amber-50 text-amber-400'
                                : prompt.trim()
                                  ? dark ? 'bg-gradient-to-r from-amber-500/15 to-purple-500/15 text-amber-300 hover:from-amber-500/25 hover:to-purple-500/25' : 'bg-gradient-to-r from-amber-50 to-purple-50 text-amber-700 hover:from-amber-100 hover:to-purple-100'
                                  : dark ? 'text-neutral-600 cursor-not-allowed' : 'text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            {enhancing ? 'Enhancing...' : 'Enhance AI'}
                          </button>
                        </div>
                      </div>
                      {showNegative && (
                        <div className={`px-4 py-2 border-t ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
                          <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="Things to avoid..."
                            rows={2}
                            className={`w-full px-3 py-2 rounded-lg text-xs outline-none resize-none ${
                              dark ? 'bg-neutral-800/60 text-neutral-400 placeholder-neutral-600' : 'bg-stone-50/60 text-neutral-500 placeholder-neutral-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="lg:col-span-2">
                    <div className={`rounded-xl border h-full flex flex-col transition-all duration-300 ${
                      dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between px-4 py-2.5 border-b">
                        <h3 className={`text-xs font-semibold ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>Preview</h3>
                        <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{width}×{height}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4" style={{ aspectRatio: `${width}/${height}` }}>
                        {selectedAsset ? (
                          selectedAsset.type === 'video' ? (
                            <video src={proxyMediaUrl(selectedAsset.url)} controls className="max-w-full max-h-full rounded-lg object-contain" />
                          ) : (
                            <img src={proxyMediaUrl(selectedAsset.url)} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
                          )
                        ) : (
                          <div className={`flex flex-col items-center gap-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dark ? 'bg-neutral-800' : 'bg-stone-100'}`}>
                              {mediaType === 'image' ? '🖼️' : '🎬'}
                            </div>
                            <p className="text-[10px]">Preview will appear here</p>
                          </div>
                        )}
                      </div>
                      {selectedAsset && (
                        <div className={`flex items-center justify-between px-4 py-2 border-t ${dark ? 'border-neutral-800' : 'border-stone-200'}`}>
                          <span className={`text-[9px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>
                            {selectedAsset.model || ''}
                            {selectedAsset.duration ? ` · ${selectedAsset.duration}s` : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            {effectiveAdId && selectedAsset.mediaId && !isAssetPublished(selectedAsset) && (
                              <button
                                onClick={() => handlePublishToCampaign(selectedAsset)}
                                disabled={publishing}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 ${
                                  dark ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                }`}
                              >
                                {publishing ? (
                                  <>
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Publishing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Publish to Campaign
                                  </>
                                )}
                              </button>
                            )}
                            {effectiveAdId && selectedAsset.mediaId && isAssetPublished(selectedAsset) && (
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                                dark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Published
                              </span>
                            )}
                            <button onClick={() => setSelectedAsset(null)} className="text-[9px] font-medium text-red-400 hover:text-red-500">Clear</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Generated Assets Gallery ─── */}
                {generatedAssets.length > 0 && (
                  <div className={`rounded-xl border mt-4 px-4 py-3 transition-all duration-300 ${
                    dark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-white/90 border-stone-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xs font-semibold ${dark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                        Generated Assets <span className={`text-[9px] font-normal ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>({generatedAssets.length})</span>
                      </h3>
                      <div className="flex items-center gap-3">
                        {totalEstimatedCredits > 0 && (
                          <span className={`text-[9px] font-mono ${dark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                            ~{totalEstimatedCredits} cr
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {[...generatedAssets].sort((a, b) => (b.created_at || b.id) - (a.created_at || a.id)).map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 group ${
                            selectedAsset?.id === asset.id
                              ? dark ? 'ring-2 ring-amber-500 border-amber-500/50' : 'ring-2 ring-amber-400 border-amber-400'
                              : dark ? 'border-neutral-700 hover:border-amber-500/30' : 'border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="w-full aspect-square">
                            {asset.type === 'video' ? (
                              <video src={proxyMediaUrl(asset.url)} className="w-full h-full object-cover" muted autoPlay playsInline loop />
                            ) : (
                              <img src={proxyMediaUrl(asset.url)} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20`}>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setLightboxAsset(asset); }}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-stone-700 hover:bg-amber-600 hover:text-white text-xs"
                                title="View full size"
                              >🔍</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-stone-700 hover:bg-white text-xs"
                              >✏️</button>
                              {asset.type === 'video' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMode('merge'); }}
                                  className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-stone-700 hover:bg-white text-xs"
                                >🎞️</button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-red-500 hover:bg-white text-xs"
                              >🗑️</button>
                            </div>
                          </div>
                          <div className={`absolute bottom-0 left-0 right-0 px-1 py-1 rounded text-[9px] font-medium leading-tight ${
                            dark ? 'bg-neutral-900/85 text-neutral-300' : 'bg-white/85 text-stone-600'
                          }`}>
                            {asset.width}×{asset.height}{asset.type === 'video' && asset.duration ? ` · ${asset.duration}s` : ''}
                            {asset.created_at && (
                              <div className="text-[8px] opacity-90">{new Date(asset.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(asset.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            )}
                          </div>
                          {asset.mediaId && isAssetPublished(asset) && (
                            <div className={`absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[7px] font-bold ${
                              dark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              ✓ Published
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Media Sidebar */}
        <div className={`border-l transition-all duration-300 overflow-hidden ${
          dark ? 'border-neutral-700 bg-neutral-900' : 'border-stone-200 bg-white'
        } ${showSidebar ? 'w-72' : 'w-0'}`}>
          <div className="w-72 h-full overflow-y-auto">
            <div className={`p-4 border-b ${dark ? 'border-neutral-700' : 'border-stone-200'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-stone-500'}`}>
                Recent Media
              </h3>
            </div>
            <div className="p-3 space-y-3">
              {recentMedia.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg overflow-hidden border cursor-pointer transition-colors ${
                    dark ? 'border-neutral-700 hover:border-neutral-500' : 'border-stone-200 hover:border-stone-400'
                  }`}
                  onClick={() => {
                    setPrompt(item.prompt || '');
                    setMediaType(item.media_type);
                  }}
                >
                  {item.media_type === 'video' ? (
                    <video src={proxyMediaUrl(item.file)} className="w-full h-28 object-cover" muted />
                  ) : (
                    <img src={proxyMediaUrl(item.file)} alt="" className="w-full h-28 object-cover" />
                  )}
                  <div className={`p-2 ${dark ? 'bg-neutral-800' : 'bg-stone-50'}`}>
                    <p className={`text-[10px] leading-tight line-clamp-2 mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-800'}`}>{item.prompt || 'No prompt'}</p>
                    <div className={`flex items-center gap-2 text-[9px] mb-1.5 ${dark ? 'text-neutral-500' : 'text-stone-500 opacity-60'}`}>
                      <span>{item.model_used}</span>
                      {item.duration_seconds && <span>{item.duration_seconds}s</span>}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const proxyUrl = proxyMediaUrl(item.file);
                          const resp = await fetch(proxyUrl);
                          const blob = await resp.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = (item.file.split('/').pop() || 'download-' + item.id).split('?')[0];
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(item.file, '_blank');
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                        dark
                          ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-white'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300 hover:text-stone-800'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AssetLightbox asset={lightboxAsset} dark={dark} onClose={() => setLightboxAsset(null)} />
    </AppLayout>
  );
}
