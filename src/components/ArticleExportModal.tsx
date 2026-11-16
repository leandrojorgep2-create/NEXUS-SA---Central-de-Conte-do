import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  FileSpreadsheet,
  BookOpen,
  Award,
  Sparkles,
  Quote,
  AlignLeft,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  ApaFormattedEntry,
  buildArticleWithApaBibliography,
  sortApaEntriesAlphabetically
} from '../utils/apaFormatter';

interface ArticleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleText: string;
  theme: string;
  references: ApaFormattedEntry[];
  onToast: (msg: string) => void;
}

export default function ArticleExportModal({
  isOpen,
  onClose,
  articleText,
  theme,
  references,
  onToast
}: ArticleExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'markdown' | 'plaintext' | 'html'>('markdown');
  const [citationStandard, setCitationStandard] = useState<'apa' | 'abnt'>('apa');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedBiblioOnly, setIsCopiedBiblioOnly] = useState(false);

  // Sorted APA references
  const sortedReferences = useMemo(() => {
    return sortApaEntriesAlphabetically(references);
  }, [references]);

  // Combined full article + bibliography
  const combinedExportContent = useMemo(() => {
    if (!articleText) return '';

    if (citationStandard === 'abnt') {
      // ABNT Export
      let cleanBody = articleText.replace(
        /(?:^|\n)#{1,4}\s*(?:.*?(?:refer[êe]ncias|bibliografia|fontes acad[êe]micas|references))[\s\S]*$/i,
        ''
      ).trim();

      const abntBiblio = sortedReferences.map((r, i) => {
        return `[${i + 1}] ${r.abntFormat}${includeNotes && r.keyFinding ? `\n    Constatação: ${r.keyFinding}` : ''}`;
      }).join('\n\n');

      return `${cleanBody}

---

## Referências Bibliográficas (Normas ABNT)

${abntBiblio}

---
*Artigo compilado via Nexus S.A. seguindo normas ABNT NBR 6023.*`;
    }

    // Default: Rigorous APA 7th Edition
    return buildArticleWithApaBibliography(
      articleText,
      sortedReferences,
      exportFormat,
      theme
    );
  }, [articleText, sortedReferences, exportFormat, citationStandard, includeNotes, theme]);

  if (!isOpen) return null;

  // Copy full article + bibliography
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(combinedExportContent);
      setIsCopied(true);
      onToast(`Artigo completo com Bibliografia ${citationStandard.toUpperCase()} copiado!`);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      onToast('Falha ao copiar para a área de transferência.');
    }
  };

  // Copy only the APA bibliography section
  const handleCopyBiblioOnly = async () => {
    try {
      const biblioOnly = citationStandard === 'apa'
        ? `REFERENCES (APA 7th Edition)\n\n` + sortedReferences.map(r => `${r.apaPlain}\nIn-text: ${r.apaInText}`).join('\n\n')
        : `REFERÊNCIAS BIBLIOGRÁFICAS (ABNT)\n\n` + sortedReferences.map(r => r.abntFormat).join('\n\n');

      await navigator.clipboard.writeText(biblioOnly);
      setIsCopiedBiblioOnly(true);
      onToast(`Bibliografia ${citationStandard.toUpperCase()} copiada!`);
      setTimeout(() => setIsCopiedBiblioOnly(false), 2200);
    } catch {
      onToast('Falha ao copiar bibliografia.');
    }
  };

  // Download combined file
  const handleDownload = () => {
    const filenamePrefix = (theme || 'Artigo_Nexus').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
    const extension = exportFormat === 'markdown' ? 'md' : exportFormat === 'html' ? 'doc' : 'txt';
    const mimeType = exportFormat === 'html'
      ? 'application/msword;charset=utf-8'
      : 'text/plain;charset=utf-8';

    const filename = `${filenamePrefix}_${citationStandard.toUpperCase()}.${extension}`;
    const blob = new Blob([combinedExportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onToast(`Arquivo ${filename} exportado com sucesso!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                  Exportar Artigo com Bibliografia Formatada
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Normas APA 7ª Ed.
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Exporte o ensaio longo com a seção de referências científicas e bíblicas integrada e rigorosamente padronizada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options & Controls Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Standard Choice */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Padrão de Formatação:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setCitationStandard('apa')}
                  className={`py-1.5 px-2 rounded-md font-bold transition-all text-center ${
                    citationStandard === 'apa'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  APA 7ª Edição (Oficial)
                </button>
                <button
                  type="button"
                  onClick={() => setCitationStandard('abnt')}
                  className={`py-1.5 px-2 rounded-md font-bold transition-all text-center ${
                    citationStandard === 'abnt'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  ABNT (Brasil)
                </button>
              </div>
            </div>

            {/* File Format Choice */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Formato do Arquivo:
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setExportFormat('markdown')}
                  className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                    exportFormat === 'markdown'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('plaintext')}
                  className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                    exportFormat === 'plaintext'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Texto (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('html')}
                  className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                    exportFormat === 'html'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Word (.doc)
                </button>
              </div>
            </div>

            {/* Summary Ribbon */}
            <div className="flex flex-col justify-end">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200">
                <p className="font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {sortedReferences.length} Obras Catalogadas em Ordem Alfabética
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Inclui obras de neurociência, léxicos clássicos (BDAG/HALOT) e o cânon bíblico.
                </p>
              </div>
            </div>
          </div>

          {citationStandard === 'apa' && (
            <div className="bg-stone-50 dark:bg-stone-850 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Rigor APA 7ª Edição:
                </span>
                <span>• Autores: Sobrenome, Iniciais (ex: Kandel, E. R.)</span>
                <span>• Títulos em Sentence-Case com itálico</span>
                <span>• Local de publicação suprimido (norma 2020)</span>
                <span>• Citações autor-data no texto preparadas</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-stone-50/50 dark:bg-stone-950/60 font-mono text-xs">
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs whitespace-pre-wrap leading-relaxed select-all text-stone-800 dark:text-stone-200">
            {combinedExportContent}
          </div>
        </div>

        {/* Footer / Action Buttons */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyBiblioOnly}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              title="Copiar exclusivamente a seção de referências bibliográficas"
            >
              {isCopiedBiblioOnly ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{isCopiedBiblioOnly ? 'Bibliografia Copiada!' : 'Copiar Só Bibliografia'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              title="Copiar artigo completo junto com as referências"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copiado com Sucesso!' : 'Copiar Artigo + Bibliografia'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-medium text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
              title="Baixar arquivo formatado completo"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Artigo + APA (.{(exportFormat === 'markdown' ? 'md' : exportFormat === 'html' ? 'doc' : 'txt')})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
