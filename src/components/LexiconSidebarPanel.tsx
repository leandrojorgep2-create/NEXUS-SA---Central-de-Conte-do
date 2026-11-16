import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Copy,
  Check,
  X,
  Brain,
  Sparkles,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AcademicSource } from '../types';
import { getAllLexiconEntries, detectLexiconTermsInText, LexiconEntry } from '../utils/lexiconDatabase';

interface LexiconSidebarPanelProps {
  scriptText: string;
  sources?: AcademicSource[];
  isOpen?: boolean;
  onClose?: () => void;
  onSelectTerm?: (entry: LexiconEntry) => void;
  selectedTermId?: string | null;
  onToast?: (msg: string) => void;
  onInsertIntoScript?: (textToInsert: string) => void;
  isDocked?: boolean;
}

export default function LexiconSidebarPanel({
  scriptText,
  sources = [],
  isOpen = true,
  onClose,
  onSelectTerm,
  selectedTermId,
  onToast,
  onInsertIntoScript,
  isDocked = false
}: LexiconSidebarPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [lexiconFilter, setLexiconFilter] = useState<'all' | 'HALOT' | 'BDAG'>('all');
  const [viewScope, setViewScope] = useState<'in_script' | 'all'>('in_script');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // All mapped entries
  const allEntries = useMemo(() => {
    return getAllLexiconEntries(sources);
  }, [sources]);

  // Detected terms in current script
  const detectedAnalysis = useMemo(() => {
    return detectLexiconTermsInText(scriptText, sources);
  }, [scriptText, sources]);

  const detectedMap = useMemo(() => {
    const map = new Map<string, { count: number; matches: string[] }>();
    detectedAnalysis.forEach((d) => {
      map.set(d.entry.id, { count: d.count, matches: d.matches });
    });
    return map;
  }, [detectedAnalysis]);

  // Filtered terms list
  const filteredList = useMemo(() => {
    return allEntries.filter((entry) => {
      // 1. Scope filter
      const isDetected = detectedMap.has(entry.id);
      if (viewScope === 'in_script' && !isDetected) return false;

      // 2. Lexicon filter
      if (lexiconFilter !== 'all' && entry.lexicon !== lexiconFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          entry.originalWord.toLowerCase().includes(q) ||
          entry.transliteration.toLowerCase().includes(q) ||
          entry.shortDefinition.toLowerCase().includes(q) ||
          entry.detailedDefinition.toLowerCase().includes(q) ||
          entry.lexiconReference.toLowerCase().includes(q) ||
          (entry.neuroscienceConnection && entry.neuroscienceConnection.toLowerCase().includes(q)) ||
          entry.matchKeywords.some((k) => k.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [allEntries, detectedMap, viewScope, lexiconFilter, searchQuery]);

  const handleCopyCitation = (entry: LexiconEntry) => {
    const quote = entry.language === 'hebrew'
      ? `No original hebraico do Antigo Testamento registrado no léxico HALOT (${entry.lexiconReference}), o termo ${entry.originalWord} (${entry.transliteration}) designa ${entry.shortDefinition.toLowerCase()}`
      : `No grego do Novo Testamento documentado no léxico BDAG (${entry.lexiconReference}), o vocábulo ${entry.originalWord} (${entry.transliteration}) representa ${entry.shortDefinition.toLowerCase()}`;

    navigator.clipboard.writeText(quote);
    setCopiedId(entry.id);
    if (onToast) onToast(`Citação do léxico ${entry.lexicon} (${entry.transliteration}) copiada!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (entry: LexiconEntry) => {
    if (onInsertIntoScript) {
      const sentence = ` (${entry.lexicon}: ${entry.originalWord} / ${entry.transliteration} — ${entry.shortDefinition}) `;
      onInsertIntoScript(sentence);
      if (onToast) onToast(`Termo ${entry.transliteration} inserido no roteiro!`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden flex flex-col transition-all ${
        isDocked
          ? 'w-full lg:w-[380px] shrink-0 h-[650px] shadow-sm'
          : 'fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] shadow-2xl animate-in slide-in-from-right duration-200'
      }`}
    >
      {/* Panel Header */}
      <div className="p-4 bg-white dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <span>Léxicos do Roteiro</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                BDAG / HALOT
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Definições filológicas exatas dos termos originais.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
            title="Fechar painel de léxicos"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scope Selector Tabs */}
      <div className="p-3 bg-stone-100/70 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 space-y-2 shrink-0">
        <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-0.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setViewScope('in_script')}
            className={`flex-1 py-1 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
              viewScope === 'in_script'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <span>No Roteiro</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                viewScope === 'in_script'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              {detectedAnalysis.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewScope('all')}
            className={`flex-1 py-1 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
              viewScope === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <span>Catálogo Completo</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                viewScope === 'all'
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              {allEntries.length}
            </span>
          </button>
        </div>

        {/* Filter Pills + Search */}
        <div className="flex items-center gap-2">
          {/* Lexicon pills */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setLexiconFilter('all')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                lexiconFilter === 'all'
                  ? 'bg-stone-200 dark:bg-stone-750 text-stone-900 dark:text-stone-100 font-bold'
                  : 'text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setLexiconFilter('HALOT')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                lexiconFilter === 'HALOT'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold'
                  : 'text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <span>HALOT</span>
            </button>
            <button
              type="button"
              onClick={() => setLexiconFilter('BDAG')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                lexiconFilter === 'BDAG'
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold'
                  : 'text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <span>BDAG</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar termo..."
              className="w-full pl-6 pr-5 py-0.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terms List */}
      <div className="p-3 overflow-y-auto flex-1 space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-6 text-center text-stone-400 dark:text-stone-500 text-xs space-y-2">
            <Info className="w-6 h-6 mx-auto opacity-50" />
            <p>
              {viewScope === 'in_script'
                ? 'Nenhum termo léxico identificado com os filtros atuais no roteiro.'
                : 'Nenhum termo encontrado na busca.'}
            </p>
            {viewScope === 'in_script' && (
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className="text-amber-600 dark:text-amber-400 underline font-semibold text-xs"
              >
                Ver todo o catálogo de léxicos ({allEntries.length})
              </button>
            )}
          </div>
        ) : (
          filteredList.map((entry) => {
            const isHebrew = entry.language === 'hebrew';
            const isGreek = entry.language === 'greek';
            const detectedInfo = detectedMap.get(entry.id);
            const isSelected = selectedTermId === entry.id;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectTerm && onSelectTerm(entry)}
                className={`p-3.5 rounded-xl border transition-all text-xs bg-white dark:bg-stone-850 hover:border-amber-400/80 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Top line: Lexicon badge, language, count */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        entry.lexicon === 'HALOT'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : entry.lexicon === 'BDAG'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      }`}
                    >
                      <BookOpen className="w-2.5 h-2.5" />
                      <span>{entry.lexicon}</span>
                    </span>

                    <span className="text-[10px] text-stone-400">
                      {isHebrew ? 'Hebraico' : isGreek ? 'Grego' : 'Latim'}
                    </span>
                  </div>

                  {detectedInfo && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {detectedInfo.count}x no roteiro
                    </span>
                  )}
                </div>

                {/* Term and Transliteration */}
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                      {entry.originalWord}
                    </span>
                    <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 italic">
                      ({entry.transliteration})
                    </span>
                  </div>

                  {entry.pronunciation && (
                    <span className="text-[10px] font-mono text-stone-400">
                      /{entry.pronunciation}/
                    </span>
                  )}
                </div>

                {/* Short definition */}
                <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed bg-stone-50 dark:bg-stone-900 p-2 rounded-lg border border-stone-100 dark:border-stone-800 mb-2">
                  {entry.shortDefinition}
                </p>

                {/* Anatomical/Cognitive Function */}
                {entry.anatomicalVolitionalFunction && (
                  <div className="mb-2 text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                    <strong className="text-amber-800 dark:text-amber-300 font-semibold block mb-0.5">
                      Função Antropológica & Volitiva:
                    </strong>
                    <span>{entry.anatomicalVolitionalFunction}</span>
                  </div>
                )}

                {/* Neuroscience connection */}
                {entry.neuroscienceConnection && (
                  <div className="p-1.5 rounded bg-purple-50/60 dark:bg-purple-950/20 text-[10px] text-purple-900 dark:text-purple-300 border border-purple-200/40 dark:border-purple-900/40 mb-2 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Neurociência:</strong> {entry.neuroscienceConnection}
                    </span>
                  </div>
                )}

                {/* Biblical Passages */}
                {entry.biblicalPassages && entry.biblicalPassages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mb-2 text-[10px] text-stone-500">
                    <BookmarkCheck className="w-3 h-3 text-amber-500" />
                    {entry.biblicalPassages.map((bp, bIdx) => (
                      <span
                        key={bIdx}
                        className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded font-mono text-stone-700 dark:text-stone-300"
                      >
                        {bp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                  <span className="text-[10px] text-stone-400 truncate max-w-[150px]">
                    {entry.lexiconReference}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCitation(entry);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="Copiar citação formatada para a locução"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">Copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {onInsertIntoScript && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsert(entry);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-2xs"
                        title="Inserir termo e definição no roteiro"
                      >
                        Inserir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-stone-100 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 flex items-center justify-between shrink-0">
        <span>
          Léxicos acadêmicos integrados com rigor exegético e antropológico.
        </span>
        <span className="font-bold font-mono">Nexus S.A.</span>
      </div>
    </div>
  );
}
