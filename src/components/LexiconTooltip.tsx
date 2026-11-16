import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Copy, Check, ExternalLink, Sparkles, Brain, BookmarkCheck, ArrowRight } from 'lucide-react';
import { LexiconEntry } from '../utils/lexiconDatabase';

interface LexiconTooltipProps {
  key?: React.Key;
  entry: LexiconEntry;
  matchedText: string;
  onOpenSidebar?: (entry: LexiconEntry) => void;
  onToast?: (msg: string) => void;
  children?: React.ReactNode;
}

export default function LexiconTooltip({
  entry,
  matchedText,
  onOpenSidebar,
  onToast,
  children
}: LexiconTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHebrew = entry.language === 'hebrew';
  const isGreek = entry.language === 'greek';

  // Compute position relative to viewport
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 340;
    const popoverHeight = 280;

    // Center horizontally on trigger
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    // Boundary check horizontal
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }

    // Check if enough space above or below
    const spaceAbove = rect.top;
    const placeAbove = spaceAbove >= popoverHeight + 15 || rect.bottom + popoverHeight > window.innerHeight;
    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;

    setCoords({ top, left, placeAbove });
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleCopyDefinition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = `[${entry.lexicon}] ${entry.originalWord} (${entry.transliteration}): ${entry.shortDefinition} — ${entry.lexiconReference}`;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    if (onToast) onToast(`Definição de ${entry.transliteration} copiada!`);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        updatePosition();
        setIsOpen(!isOpen);
      }}
      className={`relative inline-block cursor-pointer font-medium transition-colors rounded-sm px-1 -mx-0.5 ${
        isHebrew
          ? 'text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 underline decoration-amber-500/50 decoration-dashed underline-offset-4 decoration-2'
          : isGreek
          ? 'text-emerald-900 dark:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 underline decoration-emerald-500/50 decoration-dashed underline-offset-4 decoration-2'
          : 'text-purple-900 dark:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 underline decoration-purple-500/50 decoration-dashed underline-offset-4 decoration-2'
      }`}
      title={`Passar o mouse para ver definição léxica (${entry.lexicon}: ${entry.transliteration})`}
    >
      {children || matchedText}

      {/* Popover / Tooltip Container */}
      {isOpen && (
        <div
          ref={popoverRef}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords.placeAbove ? 'auto' : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
            left: `${coords.left}px`,
            zIndex: 9999
          }}
          className="w-[330px] sm:w-[360px] bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-750 p-4 text-left animate-in fade-in zoom-in-95 duration-150 select-text font-sans"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-100 dark:border-stone-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    entry.lexicon === 'HALOT'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                      : entry.lexicon === 'BDAG'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                      : 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-800'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{entry.lexicon}</span>
                </span>

                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {isHebrew ? 'Hebraico' : isGreek ? 'Grego Koiné' : 'Teologia'}
                </span>

                {entry.pronunciation && (
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    /{entry.pronunciation}/
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                  {entry.originalWord}
                </span>
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 italic">
                  ({entry.transliteration})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyDefinition}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
              title="Copiar definição rápida"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Definition */}
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-0.5">
                Definição Rápida:
              </span>
              <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed bg-stone-50 dark:bg-stone-850 p-2 rounded-lg border border-stone-200/60 dark:border-stone-800">
                {entry.shortDefinition}
              </p>
            </div>

            {/* Anatomical / Cognitive Function */}
            {entry.anatomicalVolitionalFunction && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                  <Brain className="w-3 h-3" />
                  Função Antropológica & Volitiva:
                </span>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
                  {entry.anatomicalVolitionalFunction}
                </p>
              </div>
            )}

            {/* Neuroscience Connection */}
            {entry.neuroscienceConnection && (
              <div className="bg-purple-50/70 dark:bg-purple-950/30 p-1.5 rounded border border-purple-200/50 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-300 flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Neurociência:</strong> {entry.neuroscienceConnection}
                </span>
              </div>
            )}

            {/* Biblical passages */}
            {entry.biblicalPassages && entry.biblicalPassages.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-stone-500">
                <BookmarkCheck className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="font-semibold">Ocorrências:</span>
                {entry.biblicalPassages.slice(0, 3).map((pass, pIdx) => (
                  <span
                    key={pIdx}
                    className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded font-mono text-stone-700 dark:text-stone-300"
                  >
                    {pass}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-stone-400 text-[10px] truncate max-w-[180px]">
              {entry.lexiconReference}
            </span>

            {onOpenSidebar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSidebar(entry);
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <span>Ver no Painel</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
