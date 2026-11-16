import React, { useMemo } from 'react';
import { AcademicSource } from '../types';
import { getAllLexiconEntries, LexiconEntry } from '../utils/lexiconDatabase';
import LexiconTooltip from './LexiconTooltip';

interface LexiconScriptViewerProps {
  scriptText: string;
  sources?: AcademicSource[];
  highlightedTermId?: string | null;
  onOpenSidebar?: (entry: LexiconEntry) => void;
  onToast?: (msg: string) => void;
  className?: string;
}

interface TextSegment {
  text: string;
  isLexiconTerm: boolean;
  entry?: LexiconEntry;
}

export default function LexiconScriptViewer({
  scriptText,
  sources = [],
  highlightedTermId,
  onOpenSidebar,
  onToast,
  className = ''
}: LexiconScriptViewerProps) {
  const allEntries = useMemo(() => {
    return getAllLexiconEntries(sources);
  }, [sources]);

  // Tokenize text into regular chunks and lexicon matches
  const parsedParagraphs = useMemo(() => {
    if (!scriptText) return [];

    const paragraphs = scriptText.split('\n');

    return paragraphs.map((para) => {
      if (!para.trim()) {
        return { isBlank: true, segments: [] };
      }

      // Check if it's a section header or timestamp
      const isHeader = /^#{1,4}\s+/.test(para) || /^\*\*.*?\*\*:?$/.test(para.trim());
      const isTimestamp = /^\[\d{2}:\d{2}.*?\]/.test(para.trim());

      // Find all matches for all terms in this paragraph
      const matchesInPara: {
        start: number;
        end: number;
        text: string;
        entry: LexiconEntry;
      }[] = [];

      allEntries.forEach((entry) => {
        const regex = new RegExp(entry.matchRegex.source, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(para)) !== null) {
          matchesInPara.push({
            start: m.index,
            end: m.index + m[0].length,
            text: m[0],
            entry
          });
        }
      });

      // Sort by start position
      matchesInPara.sort((a, b) => a.start - b.start);

      // Filter overlaps (keep earlier or longer)
      const nonOverlapping: typeof matchesInPara = [];
      let lastEnd = 0;
      for (const m of matchesInPara) {
        if (m.start >= lastEnd) {
          nonOverlapping.push(m);
          lastEnd = m.end;
        }
      }

      // Slice paragraph into segments
      const segments: TextSegment[] = [];
      let curr = 0;
      nonOverlapping.forEach((m) => {
        if (m.start > curr) {
          segments.push({
            text: para.slice(curr, m.start),
            isLexiconTerm: false
          });
        }
        segments.push({
          text: m.text,
          isLexiconTerm: true,
          entry: m.entry
        });
        curr = m.end;
      });

      if (curr < para.length) {
        segments.push({
          text: para.slice(curr),
          isLexiconTerm: false
        });
      }

      return {
        isBlank: false,
        isHeader,
        isTimestamp,
        segments: segments.length > 0 ? segments : [{ text: para, isLexiconTerm: false }]
      };
    });
  }, [scriptText, allEntries]);

  if (!scriptText) {
    return (
      <div className="p-8 text-center text-stone-400 dark:text-stone-500 italic">
        Nenhum roteiro carregado para visualização interativa.
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[500px] select-text space-y-3 ${className}`}
    >
      {parsedParagraphs.map((para, pIdx) => {
        if (para.isBlank) {
          return <div key={pIdx} className="h-2" />;
        }

        if (para.isHeader) {
          return (
            <div
              key={pIdx}
              className="font-sans font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 pt-2 pb-0.5 border-b border-stone-100 dark:border-stone-800/80"
            >
              {para.segments.map((seg, sIdx) => {
                if (seg.isLexiconTerm && seg.entry) {
                  return (
                    <React.Fragment key={sIdx}>
                      <LexiconTooltip
                        entry={seg.entry}
                        matchedText={seg.text}
                        onOpenSidebar={onOpenSidebar}
                        onToast={onToast}
                      >
                        <span className="font-bold underline decoration-amber-500 underline-offset-4">
                          {seg.text}
                        </span>
                      </LexiconTooltip>
                    </React.Fragment>
                  );
                }
                return <span key={sIdx}>{seg.text}</span>;
              })}
            </div>
          );
        }

        if (para.isTimestamp) {
          return (
            <div
              key={pIdx}
              className="text-amber-800 dark:text-amber-400 font-bold font-mono text-xs bg-amber-50/70 dark:bg-amber-950/30 px-2 py-1 rounded inline-block my-1 border border-amber-200/50 dark:border-amber-800/50"
            >
              {para.segments.map((seg, sIdx) => (
                <span key={sIdx}>{seg.text}</span>
              ))}
            </div>
          );
        }

        return (
          <p key={pIdx} className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans text-xs sm:text-sm">
            {para.segments.map((seg, sIdx) => {
              if (seg.isLexiconTerm && seg.entry) {
                const isSelected = highlightedTermId === seg.entry.id;
                return (
                  <React.Fragment key={sIdx}>
                    <LexiconTooltip
                      entry={seg.entry}
                      matchedText={seg.text}
                      onOpenSidebar={onOpenSidebar}
                      onToast={onToast}
                    >
                      <span
                        className={`inline-block transition-all ${
                          isSelected
                            ? 'ring-2 ring-amber-500 font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 rounded px-1'
                            : ''
                        }`}
                      >
                        {seg.text}
                      </span>
                    </LexiconTooltip>
                  </React.Fragment>
                );
              }
              return <span key={sIdx}>{seg.text}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
