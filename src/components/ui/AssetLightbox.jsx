import { proxyMediaUrl } from '../../constants';

export default function AssetLightbox({ asset, dark, onClose }) {
  if (!asset) return null;

  const proxiedUrl = proxyMediaUrl(asset.url);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const resp = await fetch(proxiedUrl);
      const blob = await resp.blob();
      const ext = asset.type === 'video' ? '.mp4' : '.jpg';
      const name = asset.prompt
        ? asset.prompt.slice(0, 40).replace(/[^a-zA-Z0-9_ -]/g, '').trim() + ext
        : `generated-${asset.id || Date.now()}${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(asset.url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-all z-10"
        title="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-16 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-emerald-600/80 transition-all z-10"
        title="Download"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </button>

      {/* Asset info bar */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
          {asset.type === 'video' ? 'Video' : 'Image'}
        </span>
        {asset.width && asset.height && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-black/60 text-white/80 backdrop-blur-sm">
            {asset.width}&times;{asset.height}
          </span>
        )}
        {asset.model && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-black/60 text-white/60 backdrop-blur-sm hidden sm:block">
            {asset.model}
          </span>
        )}
      </div>

      {/* Media */}
      <div
        className="max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {asset.type === 'video' ? (
          <video
            src={proxiedUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
          />
        ) : (
          <img
            src={proxiedUrl}
            alt={asset.prompt || ''}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
          />
        )}
      </div>

      {/* Prompt text at bottom */}
      {asset.prompt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[80vw] z-10">
          <p className="text-xs text-white/70 text-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm truncate">
            {asset.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
