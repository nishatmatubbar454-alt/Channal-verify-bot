import React from 'react';
import { X, ExternalLink, RotateCw, Globe } from 'lucide-react';

interface MiniAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const MiniAppModal: React.FC<MiniAppModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative mt-8 flex-1 flex flex-col bg-[#121927] rounded-t-3xl border-t border-x border-[#2A3B57] shadow-2xl overflow-hidden">
        {/* Telegram Mini App Top Sheet Handle & Header */}
        <div className="bg-[#182338] px-4 py-2.5 flex items-center justify-between border-b border-[#233554]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#C0FF6F] animate-pulse"></span>
            <span className="text-xs font-bold text-white truncate max-w-[200px]">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Open full page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-[#202E48] hover:bg-[#283A5B] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grab bar */}
        <div className="w-12 h-1 bg-slate-600/50 rounded-full mx-auto my-1"></div>

        {/* Web App Frame */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          {url ? (
            <iframe
              src={url}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-full border-none"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Globe className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">No Mini App URL configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
