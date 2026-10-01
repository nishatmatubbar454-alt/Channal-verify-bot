import React, { useState } from 'react';
import { 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  Folder, 
  FileText, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  Package
} from 'lucide-react';
import { BotConfig, Language } from '../../types/botConfig';
import { translations } from '../../utils/translations';
import { generatePythonProject, GeneratedFile } from '../../utils/codeGenerator';
import { downloadProjectZip, downloadSingleFile } from '../../utils/zipExporter';

interface CodeExportTabProps {
  config: BotConfig;
  lang: Language;
}

export const CodeExportTab: React.FC<CodeExportTabProps> = ({
  config,
  lang,
}) => {
  const t = translations[lang].codeTab;
  const files: GeneratedFile[] = generatePythonProject(config);
  const [selectedPath, setSelectedPath] = useState<string>('config.py');
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-[#FF8E00]" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => downloadProjectZip(config)}
          className="px-4 py-2.5 rounded-lg bg-[#C0FF6F] text-slate-950 font-bold text-xs hover:bg-[#d0ff88] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#C0FF6F]/15 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 stroke-[3]" />
          <span>{t.downloadZip}</span>
        </button>
      </div>

      {/* Code Explorer Grid: 4 Cols File Tree + 8 Cols Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-2xl border border-[#222E45] bg-[#0E1420] overflow-hidden">
        {/* Left: Project File Tree (4 Cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#111724] p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 px-2">
              <Folder className="w-4 h-4 text-[#FF8E00]" />
              <span>telegram_bot/</span>
            </div>

            <div className="space-y-1">
              {files.map((file) => {
                const isSelected = file.path === selectedPath;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C283C] text-[#C0FF6F] font-bold border border-[#2B3E5C]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#151E2E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#C0FF6F]' : 'text-slate-500'}`} />
                      <span className="truncate">{file.path}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF6F]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick ZIP download summary card */}
          <div className="mt-6 p-3 rounded-xl bg-[#162030] border border-[#23334C] text-[11px] text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Package className="w-3.5 h-3.5 text-[#FF8E00]" />
              <span>{lang === 'bn' ? 'সম্পূর্ণ রেডি প্রোডাকশন প্যাকেজ' : 'Ready for Deployment'}</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              {lang === 'bn'
                ? 'জিপ ফাইলে requirements.txt, Dockerfile এবং .env সহ সব স্ক্রিপ্ট অন্তর্ভুক্ত রয়েছে।'
                : 'Contains all aiogram 3 routers, handlers, keyboards, Dockerfile, and requirements.'}
            </p>
          </div>
        </div>

        {/* Right: Code Viewer (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-[560px] bg-[#0A0E17]">
          {/* File bar */}
          <div className="bg-[#121A28] px-4 py-2.5 flex items-center justify-between border-b border-[#1E2B40]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">
                {activeFile.path}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({activeFile.description})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy Code */}
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-[#1B273A] hover:bg-[#253650] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#C0FF6F]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : t.copyCode}</span>
              </button>

              {/* Download Current File */}
              <button
                onClick={() => downloadSingleFile(activeFile.name, activeFile.content)}
                className="px-2.5 py-1 rounded bg-[#1B273A] hover:bg-[#253650] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title={t.downloadFile}
              >
                <Download className="w-3.5 h-3.5 text-[#FF8E00]" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>

          {/* Syntax display */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed bg-[#0A0E17]">
            <pre className="overflow-x-auto whitespace-pre font-mono">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Deployment Cheatsheet */}
      <div className="rounded-xl bg-[#121927] border border-[#222E45] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#C0FF6F]" />
          <span>{lang === 'bn' ? 'সার্ভার ও হোস্টিং কমান্ড গাইড' : 'Hosting & Execution Quick Reference'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Method 1: Local / VPS */}
          <div className="p-4 rounded-lg bg-[#0E1420] border border-[#1E2B40] space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-sans font-bold">
              <span>{lang === 'bn' ? '১. লোকাল বা লিনাক্স VPS এ রান:' : '1. Local Python Run:'}</span>
              <button
                onClick={() => handleCopyCommand('pip install -r requirements.txt\npython main.py', 'local')}
                className="text-slate-400 hover:text-white"
              >
                {copiedCmd === 'local' ? <Check className="w-3.5 h-3.5 text-[#C0FF6F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              pip install -r requirements.txt<br/>
              python main.py
            </div>
          </div>

          {/* Method 2: Docker */}
          <div className="p-4 rounded-lg bg-[#0E1420] border border-[#1E2B40] space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-sans font-bold">
              <span>{lang === 'bn' ? '২. ডকার কন্টেইনারে রান:' : '2. Docker Container Run:'}</span>
              <button
                onClick={() => handleCopyCommand(`docker build -t tg-bot .\ndocker run -d --name tg-bot -e BOT_TOKEN="${config.botToken}" tg-bot`, 'docker')}
                className="text-slate-400 hover:text-white"
              >
                {copiedCmd === 'docker' ? <Check className="w-3.5 h-3.5 text-[#C0FF6F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              docker build -t tg-bot .<br/>
              docker run -d --name tg-bot tg-bot
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
