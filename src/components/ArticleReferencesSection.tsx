import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Brain,
  Library,
  Quote,
  Check,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Filter,
  Sparkles,
  Download,
  Search,
  Award,
  ShieldCheck,
  ShieldAlert,
  BookmarkCheck,
  X,
  ChevronDown,
  ChevronUp,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Eye
} from 'lucide-react';
import { AcademicSource } from '../types';
import ArticleExportModal from './ArticleExportModal';
import CitationConsistencyModal from './CitationConsistencyModal';
import {
  ApaFormattedEntry,
  compileAllReferencesForProject,
  formatToApaAuthors,
  formatToApaTitle,
  cleanApaPublisher,
  sortApaEntriesAlphabetically
} from '../utils/apaFormatter';
import {
  analyzeCitationConsistency,
  ReferenceConsistencyResult
} from '../utils/citationConsistencyChecker';

export type CompiledReference = ApaFormattedEntry;

interface ArticleReferencesSectionProps {
  sources?: AcademicSource[];
  articleText?: string;
  passageText?: string;
  theme?: string;
  isDarkMode?: boolean;
  onToast?: (message: string) => void;
  onAddSource?: (source: AcademicSource) => void;
  onUpdateArticleText?: (newArticleText: string) => void;
}

export default function ArticleReferencesSection({
  sources = [],
  articleText = '',
  passageText = '',
  theme = '',
  isDarkMode = false,
  onToast,
  onAddSource,
  onUpdateArticleText
}: ArticleReferencesSectionProps) {
  const [citationFormat, setCitationFormat] = useState<'apa' | 'abnt' | 'detailed'>('apa');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [consistencyFilter, setConsistencyFilter] = useState<'all' | 'uncited' | 'cited'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConsistencyModalOpen, setIsConsistencyModalOpen] = useState(false);
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [customReferences, setCustomReferences] = useState<CompiledReference[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // New reference form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newPublication, setNewPublication] = useState('');
  const [newCategory, setNewCategory] = useState<'biblical' | 'neuroscience' | 'lexicon' | 'theological' | 'historical'>('theological');
  const [newKeyFinding, setNewKeyFinding] = useState('');
  const [newBiblicalConnection, setNewBiblicalConnection] = useState('');

  // 1. Auto-compile references using strict APA 7th & ABNT rules
  const compiledReferences = useMemo(() => {
    return compileAllReferencesForProject(
      sources,
      articleText,
      passageText,
      theme,
      customReferences
    );
  }, [sources, articleText, passageText, theme, customReferences]);

  // 2. Consistency Analysis (checks if references are cited in article body)
  const consistencyReport = useMemo(() => {
    return analyzeCitationConsistency(articleText, compiledReferences);
  }, [articleText, compiledReferences]);

  const consistencyMap = useMemo(() => {
    const map = new Map<string, ReferenceConsistencyResult>();
    consistencyReport.results.forEach(res => {
      map.set(res.reference.id, res);
    });
    return map;
  }, [consistencyReport]);

  // Filtered references by category, search, and consistency status
  const filteredReferences = useMemo(() => {
    return compiledReferences.filter(ref => {
      const matchesCat = categoryFilter === 'all' || ref.category === categoryFilter;
      
      const consistencyRes = consistencyMap.get(ref.id);
      const matchesConsistency =
        consistencyFilter === 'all' ||
        (consistencyFilter === 'uncited' && consistencyRes && !consistencyRes.isCited) ||
        (consistencyFilter === 'cited' && consistencyRes && consistencyRes.isCited);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        ref.title.toLowerCase().includes(q) ||
        ref.authors.toLowerCase().includes(q) ||
        (ref.keyFinding && ref.keyFinding.toLowerCase().includes(q)) ||
        (ref.biblicalConnection && ref.biblicalConnection.toLowerCase().includes(q)) ||
        (ref.originalTerm && ref.originalTerm.toLowerCase().includes(q));
      return matchesCat && matchesConsistency && matchesSearch;
    });
  }, [compiledReferences, categoryFilter, consistencyFilter, consistencyMap, searchQuery]);

  // Copy single reference
  const handleCopySingle = async (ref: CompiledReference) => {
    const textToCopy = citationFormat === 'apa' ? (ref.apaPlain || ref.apaFormat) : ref.abntFormat;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(ref.id);
      if (onToast) onToast(`Referência copiada no padrão ${citationFormat.toUpperCase()}!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      if (onToast) onToast('Falha ao copiar.');
    }
  };

  // Copy all references formatted
  const handleCopyAll = async (targetFormat: 'abnt' | 'apa' | 'youtube') => {
    let output = '';
    if (targetFormat === 'youtube') {
      output = `📚 FONTES E REFERÊNCIAS ACADÊMICAS:\n\n` +
        compiledReferences.map((r, i) => {
          return `${i + 1}. [${r.category.toUpperCase()}] ${r.authors} (${r.year || 's.d.'}) — "${r.title}". ${r.publication}.${r.biblicalConnection ? ` | Conexão: ${r.biblicalConnection}` : ''}`;
        }).join('\n\n');
    } else if (targetFormat === 'apa') {
      output = `REFERENCES (APA 7th Edition)\n\n` +
        compiledReferences.map(r => `${r.apaPlain}\nIn-text: ${r.apaInText}`).join('\n\n');
    } else {
      output = `REFERÊNCIAS BIBLIOGRÁFICAS (ABNT)\n\n` +
        compiledReferences.map(r => r.abntFormat).join('\n\n');
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopiedAll(true);
      if (onToast) onToast(`Todas as ${compiledReferences.length} referências copiadas (${targetFormat.toUpperCase()})!`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      if (onToast) onToast('Falha ao copiar todas as referências.');
    }
  };

  // Download reference file
  const handleDownloadFile = () => {
    const content = `======================================================
NEXUS S.A. — DOSSIÊ DE REFERÊNCIAS ACADÊMICAS E BÍBLICAS
Tema: ${theme || 'Princípio Bíblico e Neurociência'}
Total de Fontes: ${compiledReferences.length}
======================================================

--- PADRÃO APA (7ª EDIÇÃO - AMERICAN PSYCHOLOGICAL ASSOCIATION) ---
${compiledReferences.map((r, i) => `[${i + 1}] ${r.apaPlain}\n    Citação no texto: ${r.apaInText}${r.keyFinding ? `\n    Constatação: ${r.keyFinding}` : ''}`).join('\n\n')}

------------------------------------------------------
--- PADRÃO ABNT ---
${compiledReferences.map((r, i) => `[${i + 1}] ${r.abntFormat}${r.keyFinding ? `\n    Constatação: ${r.keyFinding}` : ''}`).join('\n\n')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Referencias_${(theme || 'Nexus').replace(/\s+/g, '_')}_APA_ABNT.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast('Arquivo de referências baixado com sucesso!');
  };

  // Add custom reference submit
  const handleAddCustomReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const authorsApa = formatToApaAuthors(newAuthors.trim() || 'Autor');
    const authorsAbnt = newAuthors.trim().toUpperCase() || 'AUTOR';
    const year = newYear.trim() || new Date().getFullYear().toString();
    const pub = cleanApaPublisher(newPublication.trim() || 'Editora Acadêmica');
    const sentenceTitle = formatToApaTitle(newTitle.trim());
    const firstAuthor = authorsApa.split(',')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s]/g, '').trim();

    const customRef: CompiledReference = {
      id: `custom-${Date.now()}`,
      category: newCategory,
      sortKey: firstAuthor,
      title: newTitle.trim(),
      authors: authorsApa,
      year,
      publication: pub,
      apaPlain: `${authorsApa} (${year}). ${sentenceTitle}. ${pub}.`,
      apaMarkdown: `${authorsApa} (${year}). *${sentenceTitle}*. ${pub}.`,
      apaHtml: `${authorsApa} (${year}). <em>${sentenceTitle}</em>. ${pub}.`,
      apaInText: `(${firstAuthor}, ${year})`,
      abntFormat: `${authorsAbnt}. ${newTitle.trim()}. ${pub}, ${year}.`,
      apaFormat: `${authorsApa} (${year}). ${sentenceTitle}. ${pub}.`,
      citationShort: `(${firstAuthor.toUpperCase()}, ${year})`,
      keyFinding: newKeyFinding.trim(),
      biblicalConnection: newBiblicalConnection.trim(),
      isCustom: true
    };

    setCustomReferences(prev => [customRef, ...prev]);

    // Also notify parent if handler is present
    if (onAddSource) {
      onAddSource({
        id: customRef.id,
        category: (newCategory === 'biblical' ? 'theological' : newCategory) as any,
        title: customRef.title,
        authors: customRef.authors,
        year: customRef.year,
        publication: customRef.publication,
        keyFindings: customRef.keyFinding || '',
        biblicalConnection: customRef.biblicalConnection || '',
        citationScriptQuote: ''
      });
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewAuthors('');
    setNewYear('');
    setNewPublication('');
    setNewKeyFinding('');
    setNewBiblicalConnection('');
    if (onToast) onToast('Nova fonte acadêmica adicionada!');
  };

  // Helper to insert suggested paragraph with citation into the article
  const handleInsertSuggestedText = (paragraph: string, refId?: string) => {
    if (onUpdateArticleText && articleText) {
      onUpdateArticleText(articleText + '\n\n' + paragraph);
      if (refId) {
        setInsertedId(refId);
        setTimeout(() => setInsertedId(null), 2500);
      }
      if (onToast) onToast('Parágrafo com citação inserido no final do artigo!');
    } else {
      navigator.clipboard.writeText(paragraph);
      if (refId) {
        setInsertedId(refId);
        setTimeout(() => setInsertedId(null), 2500);
      }
      if (onToast) onToast('Parágrafo com citação copiado para colar no artigo!');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'neuroscience':
        return {
          label: 'Neurociência & Cognição',
          icon: Brain,
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        };
      case 'biblical':
        return {
          label: 'Fonte Bíblica & Texto Original',
          icon: BookOpen,
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'lexicon':
        return {
          label: 'Léxico & Filologia',
          icon: Library,
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'theological':
        return {
          label: 'Teologia & Hermenêutica',
          icon: GraduationCap,
          className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
        };
      default:
        return {
          label: 'História & Arqueologia',
          icon: Award,
          className: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700'
        };
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: compiledReferences.length,
      biblical: 0,
      neuroscience: 0,
      lexicon: 0,
      theological: 0,
      historical: 0
    };
    compiledReferences.forEach(r => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });
    return counts;
  }, [compiledReferences]);

  return (
    <div className="mt-8 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg flex items-center gap-1.5">
                  <span>Referências & Fontes Acadêmicas do Artigo</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Rigor Acadêmico
                  </span>
                </h3>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                Catálogo automatizado das fontes filológicas, léxicos (BDAG/HALOT), manuscritos bíblicos e artigos de neurociência que fundamentam o conteúdo.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {articleText && (
              <button
                type="button"
                onClick={() => setIsConsistencyModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-2xs ${
                  consistencyReport.consistencyScore === 100
                    ? 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25'
                    : consistencyReport.consistencyScore >= 70
                    ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-rose-500/15 text-rose-950 dark:text-rose-200 border-rose-500/30 hover:bg-rose-500/25'
                }`}
                title="Verificar se todas as fontes listadas na bibliografia foram citadas no corpo do artigo"
              >
                {consistencyReport.consistencyScore === 100 ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>Verificador de Citações ({consistencyReport.citedCount}/{consistencyReport.totalReferences})</span>
              </button>
            )}

            {articleText && (
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                title="Exportar o artigo completo com a bibliografia formatada nas normas da APA"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Exportar Artigo + APA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCopyAll(citationFormat === 'apa' ? 'apa' : 'abnt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-2xs"
              title="Copiar todas as referências no formato selecionado"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Copiadas!' : `Copiar Todas (${citationFormat.toUpperCase()})`}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyAll('youtube')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
              title="Copiar lista pronta para a descrição de vídeo no YouTube ou post no blog"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Para YouTube / Blog</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="p-1.5 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg text-xs transition-colors"
              title="Baixar dossiê de referências em arquivo de texto (.txt)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg transition-colors"
              title={isExpanded ? 'Recolher seção' : 'Expandir seção'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Badges / Metrics Ribbon */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800 text-xs">
          <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Fontes Catalogadas:</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold text-stone-800 dark:text-stone-200">
            {compiledReferences.length} obras
          </span>

          {articleText && (
            <button
              type="button"
              onClick={() => setIsConsistencyModalOpen(true)}
              className={`px-2 py-0.5 rounded font-bold transition-transform hover:scale-105 flex items-center gap-1.5 border ${
                consistencyReport.consistencyScore === 100
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : consistencyReport.consistencyScore >= 70
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}
              title="Clique para auditar consistência detalhada"
            >
              {consistencyReport.consistencyScore === 100 ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              )}
              <span>Consistência: {consistencyReport.consistencyScore}%</span>
              <span className="text-[10px] font-normal opacity-75">
                ({consistencyReport.citedCount} citadas, {consistencyReport.uncitedCount} não utilizadas)
              </span>
            </button>
          )}

          {categoryCounts.biblical > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              📖 {categoryCounts.biblical} Bíblicas
            </span>
          )}
          {categoryCounts.lexicon > 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              📚 {categoryCounts.lexicon} Léxicos
            </span>
          )}
          {categoryCounts.neuroscience > 0 && (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              🧠 {categoryCounts.neuroscience} Neurociência
            </span>
          )}
          {categoryCounts.theological > 0 && (
            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              🏛️ {categoryCounts.theological} Teologia
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Consistency Alert Callout for Uncited References */}
          {articleText && consistencyReport.uncitedCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in duration-300">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Verificador de Consistência: {consistencyReport.uncitedCount} referência(s) da bibliografia ainda não foram mencionadas no artigo.
                  </p>
                  <p className="text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Pelo padrão APA 7ª Edição, fontes não citadas no corpo do texto são consideradas órfãs. Use o filtro abaixo para localizá-las e inserir a citação recomendada.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setConsistencyFilter(consistencyFilter === 'uncited' ? 'all' : 'uncited')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg font-bold text-amber-900 dark:text-amber-200 transition-colors"
                >
                  {consistencyFilter === 'uncited' ? 'Ver Todas' : 'Filtrar Não Utilizadas'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConsistencyModalOpen(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors shadow-2xs"
                >
                  Abrir Auditoria
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar: Format Selector + Category Filter + Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-stone-50/80 dark:bg-stone-850/40 p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 text-xs">
            {/* Format Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-500 font-medium mr-1 flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-stone-400" /> Formato:
              </span>
              <div className="inline-flex bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCitationFormat('abnt')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    citationFormat === 'abnt'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  ABNT (Brasil)
                </button>
                <button
                  type="button"
                  onClick={() => setCitationFormat('apa')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    citationFormat === 'apa'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  APA 7ª Ed.
                </button>
                <button
                  type="button"
                  onClick={() => setCitationFormat('detailed')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    citationFormat === 'detailed'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Fichamento & Conexões
                </button>
              </div>

              {/* Consistency Filter pills if articleText is present */}
              {articleText && (
                <div className="inline-flex bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700 shadow-2xs ml-1">
                  <button
                    type="button"
                    onClick={() => setConsistencyFilter('all')}
                    className={`px-2 py-1 rounded-md font-semibold transition-all ${
                      consistencyFilter === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Todas ({compiledReferences.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsistencyFilter('uncited')}
                    className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      consistencyFilter === 'uncited'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                    title="Exibir referências não citadas no corpo do artigo"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Não Utilizadas ({consistencyReport.uncitedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsistencyFilter('cited')}
                    className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      consistencyFilter === 'cited'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title="Exibir referências citadas no corpo do artigo"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Citadas ({consistencyReport.citedCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Todas ({categoryCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('biblical')}
                  className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                    categoryFilter === 'biblical'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Bíblia ({categoryCounts.biblical})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('neuroscience')}
                  className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                    categoryFilter === 'neuroscience'
                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Neurociência ({categoryCounts.neuroscience})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('lexicon')}
                  className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                    categoryFilter === 'lexicon'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  Léxicos ({categoryCounts.lexicon})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[160px] sm:min-w-[200px] shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar autor, obra, versículo..."
                  className="w-full pl-8 pr-6 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-1 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Add Custom Reference Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                title="Adicionar fonte personalizada manualmente"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Fonte</span>
              </button>
            </div>
          </div>

          {/* List of References */}
          {filteredReferences.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-400 opacity-60" />
              <p className="text-sm font-medium">Nenhuma referência encontrada com os filtros atuais.</p>
              <button
                onClick={() => { setCategoryFilter('all'); setConsistencyFilter('all'); setSearchQuery(''); }}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 underline font-semibold"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferences.map((ref, index) => {
                const badge = getCategoryBadge(ref.category);
                const BadgeIcon = badge.icon;
                const isCopied = copiedId === ref.id;
                const consistencyRes = consistencyMap.get(ref.id);
                const isUncited = articleText && consistencyRes && !consistencyRes.isCited;

                return (
                  <div
                    key={ref.id || index}
                    className={`p-4 rounded-xl border transition-all shadow-2xs group ${
                      isUncited
                        ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-500'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850/80 hover:border-amber-400/60 dark:hover:border-amber-600/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        {/* Tags and Short Citation */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>

                          <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                            {ref.citationShort}
                          </span>

                          {/* Citation Consistency Badges */}
                          {articleText && consistencyRes && (
                            consistencyRes.isCited ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Citada ({consistencyRes.matchCount}x)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Não citada no artigo</span>
                              </span>
                            )
                          )}

                          {ref.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              Personalizada
                            </span>
                          )}
                        </div>

                        {/* Citation Text according to active format */}
                        {citationFormat === 'abnt' ? (
                          <p className="text-xs sm:text-sm font-sans text-stone-900 dark:text-stone-100 leading-relaxed font-medium select-all">
                            {ref.abntFormat}
                          </p>
                        ) : citationFormat === 'apa' ? (
                          <div className="space-y-1.5">
                            <div className="pl-6 -indent-6 text-xs sm:text-sm font-sans text-stone-900 dark:text-stone-100 leading-relaxed font-medium select-all">
                              <span dangerouslySetInnerHTML={{ __html: ref.apaHtml || ref.apaPlain }} />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                              <span className="font-semibold text-amber-700 dark:text-amber-400">Citação autor-data no texto:</span>
                              <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300 font-mono font-medium">{ref.apaInText}</code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(ref.apaInText);
                                  if (onToast) onToast(`Citação autor-data copiada: ${ref.apaInText}`);
                                }}
                                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-0.5"
                                title="Copiar citação autor-data"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Detailed Card View
                          <div className="space-y-2 pt-1">
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              {ref.title}
                            </h4>
                            <p className="text-xs text-stone-600 dark:text-stone-400">
                              <strong>Autores:</strong> {ref.authors} | <strong>Publicação:</strong> {ref.publication} ({ref.year || 's.d.'})
                            </p>
                          </div>
                        )}

                        {/* Extra Academic Key Findings & Biblical Connection */}
                        {(ref.keyFinding || ref.biblicalConnection || ref.originalTerm) && (
                          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                            {ref.originalTerm && (
                              <div className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                                <span>Termo Original:</span>
                                <span className="underline font-mono">{ref.originalTerm}</span>
                              </div>
                            )}
                            {ref.biblicalConnection && (
                              <div className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300">
                                <strong>Passagem Bíblica:</strong>
                                <span>{ref.biblicalConnection}</span>
                              </div>
                            )}
                            {ref.keyFinding && (
                              <p className="w-full text-xs text-stone-600 dark:text-stone-400 mt-1 italic leading-relaxed bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                                <span className="font-semibold text-stone-700 dark:text-stone-300 not-italic mr-1">Tese / Constatação:</span>
                                {ref.keyFinding}
                              </p>
                            )}
                          </div>
                        )}

                        {/* If Cited: Toggle to inspect occurrences in the article */}
                        {articleText && consistencyRes && consistencyRes.isCited && consistencyRes.matches.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/40">
                            <button
                              type="button"
                              onClick={() => setExpandedSnippetId(expandedSnippetId === ref.id ? null : ref.id)}
                              className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{expandedSnippetId === ref.id ? 'Ocultar trechos citados' : `Ver ${consistencyRes.matches.length} trecho(s) citado(s) no artigo`}</span>
                            </button>
                            {expandedSnippetId === ref.id && (
                              <div className="mt-2 space-y-1.5 pl-2.5 border-l-2 border-emerald-400 dark:border-emerald-700 animate-in fade-in duration-150">
                                {consistencyRes.matches.slice(0, 3).map((match, mIdx) => (
                                  <div key={mIdx} className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded text-stone-700 dark:text-stone-300">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono mr-1.5">[{match.matchedTerm}]:</span>
                                    <span className="italic font-sans">"{match.snippet}"</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* If Uncited: Highlight & Actionable In-Text Citation Suggestion */}
                        {isUncited && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Referência listada, mas não encontrada no corpo do artigo</span>
                              </span>
                              <span className="text-[10px] text-stone-400 font-normal">APA 7ª Edição</span>
                            </div>

                            <p className="italic text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 p-2.5 rounded-md border border-amber-200/60 dark:border-amber-900/60 leading-relaxed font-sans">
                              "{consistencyRes?.suggestedParagraph}"
                            </p>

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const cite = consistencyRes?.suggestedInTextCitation || ref.apaInText;
                                  navigator.clipboard.writeText(cite);
                                  if (onToast) onToast(`Citação autor-data copiada: ${cite}`);
                                }}
                                className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors"
                                title="Copiar citação autor-data APA para colar no texto"
                              >
                                Copiar Citação ({consistencyRes?.suggestedInTextCitation || ref.apaInText})
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(consistencyRes?.suggestedParagraph || '');
                                  if (onToast) onToast('Parágrafo sugerido copiado para colar no artigo!');
                                }}
                                className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md text-[11px] font-medium text-stone-700 dark:text-stone-300 transition-colors"
                              >
                                Copiar Parágrafo
                              </button>

                              {onUpdateArticleText && (
                                <button
                                  type="button"
                                  onClick={() => handleInsertSuggestedText(consistencyRes?.suggestedParagraph || '', ref.id)}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1"
                                  title="Inserir automaticamente este parágrafo no final do artigo"
                                >
                                  {insertedId === ref.id ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Inserido!</span>
                                    </>
                                  ) : (
                                    <>
                                      <PlusCircle className="w-3 h-3" />
                                      <span>Inserir no Artigo</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleCopySingle(ref)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                          }`}
                          title={`Copiar citação formatada (${citationFormat.toUpperCase()})`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copiada!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Adicionar Referência Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                Adicionar Nova Fonte / Referência Acadêmica
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomReference} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título da Obra / Artigo / Livro: *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Synaptic Self: How Our Brains Become Who We Are"
                  className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Autores:
                  </label>
                  <input
                    type="text"
                    value={newAuthors}
                    onChange={(e) => setNewAuthors(e.target.value)}
                    placeholder="Ex: LEDOUX, Joseph E."
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Ano de Publicação:
                  </label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Ex: 2002"
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Publicação / Periódico / Editora:
                  </label>
                  <input
                    type="text"
                    value={newPublication}
                    onChange={(e) => setNewPublication(e.target.value)}
                    placeholder="Ex: Viking Penguin"
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
                  >
                    <option value="neuroscience">Neurociência & Cognição</option>
                    <option value="biblical">Fonte Bíblica & Texto Original</option>
                    <option value="lexicon">Léxico & Filologia</option>
                    <option value="theological">Teologia & Hermenêutica</option>
                    <option value="historical">História & Arqueologia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Passagem Bíblica Conectada (Opcional):
                </label>
                <input
                  type="text"
                  value={newBiblicalConnection}
                  onChange={(e) => setNewBiblicalConnection(e.target.value)}
                  placeholder="Ex: Romanos 12:2; Provérbios 4:23"
                  className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Constatação-Chave / Resumo Acadêmico:
                </label>
                <textarea
                  rows={2}
                  value={newKeyFinding}
                  onChange={(e) => setNewKeyFinding(e.target.value)}
                  placeholder="Resumo de como esta fonte apoia a tese do artigo..."
                  className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-2xs"
                >
                  Salvar Referência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Exportar Artigo Completo com APA */}
      <ArticleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        articleText={articleText}
        theme={theme}
        references={compiledReferences}
        onToast={onToast || (() => {})}
      />

      {/* Modal: Verificador de Consistência de Citações */}
      <CitationConsistencyModal
        isOpen={isConsistencyModalOpen}
        onClose={() => setIsConsistencyModalOpen(false)}
        report={consistencyReport}
        onToast={onToast || (() => {})}
        onInsertTextIntoArticle={(textToAppend) => {
          if (onUpdateArticleText && articleText) {
            onUpdateArticleText(articleText + textToAppend);
            if (onToast) onToast('Citação inserida no artigo com sucesso!');
          } else {
            navigator.clipboard.writeText(textToAppend.trim());
            if (onToast) onToast('Citação copiada para a área de transferência!');
          }
        }}
      />
    </div>
  );
}
