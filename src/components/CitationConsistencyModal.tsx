import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  PlusCircle,
  FileText,
  Search,
  Quote,
  ArrowRight,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';
import { ConsistencyAnalysisReport, ReferenceConsistencyResult } from '../utils/citationConsistencyChecker';

interface CitationConsistencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ConsistencyAnalysisReport;
  onToast: (msg: string) => void;
  onInsertTextIntoArticle?: (textToAppend: string) => void;
}

export default function CitationConsistencyModal({
  isOpen,
  onClose,
  report,
  onToast,
  onInsertTextIntoArticle
}: CitationConsistencyModalProps) {
  const [filter, setFilter] = useState<'all' | 'uncited' | 'cited'>('uncited');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSentenceId, setCopiedSentenceId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredResults = report.results.filter(res => {
    if (filter === 'uncited') return !res.isCited;
    if (filter === 'cited') return res.isCited;
    return true;
  });

  const handleCopyInText = (res: ReferenceConsistencyResult) => {
    navigator.clipboard.writeText(res.suggestedInTextCitation);
    setCopiedId(res.reference.id);
    onToast(`Citação autor-data copiada: ${res.suggestedInTextCitation}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySentence = (res: ReferenceConsistencyResult) => {
    navigator.clipboard.writeText(res.suggestedParagraph);
    setCopiedSentenceId(res.reference.id);
    onToast(`Parágrafo com citação copiado para a área de transferência!`);
    setTimeout(() => setCopiedSentenceId(null), 2000);
  };

  const handleInsertIntoArticle = (res: ReferenceConsistencyResult) => {
    if (onInsertTextIntoArticle) {
      onInsertTextIntoArticle(`\n\n${res.suggestedParagraph}`);
      setInsertedId(res.reference.id);
      onToast(`Parágrafo com citação inserido no artigo com sucesso!`);
      setTimeout(() => setInsertedId(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              report.consistencyScore === 100
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : report.consistencyScore >= 70
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border-rose-300 dark:border-rose-800'
            }`}>
              {report.consistencyScore === 100 ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg sm:text-xl">
                  Verificador de Consistência de Citações
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Normas APA 7ª Ed.
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Auditoria rigorosa: detecta referências listadas na bibliografia que não foram mencionadas no corpo do artigo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Summary Banner */}
        <div className="p-5 bg-stone-100/70 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Score Pill */}
            <div className="sm:col-span-2 flex items-center gap-4 bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-stone-200 dark:text-stone-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${
                      report.consistencyScore === 100
                        ? 'text-emerald-500'
                        : report.consistencyScore >= 70
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                    strokeDasharray={`${report.consistencyScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                  {report.consistencyScore}%
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Índice de Consistência
                </span>
                <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {report.statusMessage}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Citadas no Texto</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{report.citedCount}</span>
                </div>
              </div>
              <span className="text-xs text-stone-400 font-medium">de {report.totalReferences}</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              report.uncitedCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
            }`}>
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Não Utilizadas</span>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  report.uncitedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{report.uncitedCount}</span>
                </div>
              </div>
              <span className="text-xs text-stone-400 font-medium">pendentes</span>
            </div>
          </div>

          {/* Academic Info alert */}
          {report.uncitedCount > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Regra APA (7ª Edição, Seção 8.1):</strong> Todas as obras listadas na seção de referências devem ser citadas nominalmente ou pelo sistema autor-data no corpo do texto. Fontes não mencionadas podem comprometer a avaliação acadêmica. Use as sugestões abaixo para integrá-las.
              </span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shrink-0 bg-stone-50/50 dark:bg-stone-900">
          <span className="text-xs text-stone-500 font-semibold mr-2">Filtrar:</span>
          <button
            type="button"
            onClick={() => setFilter('uncited')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'uncited'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Não Utilizadas ({report.uncitedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('cited')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'cited'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Citadas no Texto ({report.citedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <span>Todas as Fontes ({report.totalReferences})</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                {filter === 'uncited'
                  ? 'Parabéns! Todas as referências da bibliografia estão citadas no artigo.'
                  : 'Nenhuma fonte encontrada nesta visualização.'}
              </p>
            </div>
          ) : (
            filteredResults.map((res) => {
              const ref = res.reference;
              const isUncited = !res.isCited;

              return (
                <div
                  key={ref.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isUncited
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isUncited ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Não citada no texto</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Citada ({res.matchCount} ocorrência{res.matchCount > 1 ? 's' : ''})</span>
                          </span>
                        )}

                        <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                          {ref.citationShort}
                        </span>

                        <span className="text-xs text-stone-500 capitalize">
                          {ref.category === 'biblical' ? 'Bíblica' : ref.category === 'lexicon' ? 'Léxico' : ref.category}
                        </span>
                      </div>

                      {/* Reference Title and Citation */}
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 pt-1 leading-snug">
                        {ref.title}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {ref.authors} ({ref.year || 's.d.'}) — <em>{ref.publication}</em>
                      </p>
                    </div>

                    {/* Quick copy in-text button */}
                    <button
                      type="button"
                      onClick={() => handleCopyInText(res)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors shrink-0"
                      title="Copiar citação autor-data APA para colar no texto"
                    >
                      {copiedId === ref.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Copiar {res.suggestedInTextCitation}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Body: Citations Excerpts (if cited) */}
                  {!isUncited && res.matches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40 space-y-2">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
                        <Quote className="w-3 h-3 text-emerald-600" />
                        Ocorrências no corpo do artigo:
                      </span>
                      <div className="space-y-1.5">
                        {res.matches.slice(0, 3).map((match, mIdx) => (
                          <div
                            key={mIdx}
                            className="text-xs bg-white/80 dark:bg-stone-850 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950 font-mono text-stone-800 dark:text-stone-200"
                          >
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1">
                              [{match.matchedTerm}]:
                            </span>
                            <span className="italic font-sans text-stone-600 dark:text-stone-300">
                              "{match.snippet}"
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body: Action suggestions (if uncited) */}
                  {isUncited && (
                    <div className="mt-3 pt-3 border-t border-amber-300/60 dark:border-amber-800/60 space-y-2.5">
                      <div className="p-3 bg-white dark:bg-stone-850 rounded-lg border border-amber-200 dark:border-amber-800/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Sugestão de Parágrafo para Inserção no Artigo:
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">Norma APA Autor-Data</span>
                        </div>

                        <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed italic bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                          "{res.suggestedParagraph}"
                        </p>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopySentence(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            {copiedSentenceId === ref.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Parágrafo</span>
                              </>
                            )}
                          </button>

                          {onInsertTextIntoArticle && (
                            <button
                              type="button"
                              onClick={() => handleInsertIntoArticle(res)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-2xs"
                              title="Adicionar este parágrafo diretamente ao artigo"
                            >
                              {insertedId === ref.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Inserido no Artigo!</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Inserir no Artigo</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            Total auditado: <strong>{report.totalReferences} referências</strong> ({report.citedCount} citadas, {report.uncitedCount} não utilizadas)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
