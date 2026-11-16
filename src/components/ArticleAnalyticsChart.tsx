import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  BarChart3, 
  BookOpen, 
  Brain, 
  Layers, 
  Sparkles, 
  Compass, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface ArticleAnalyticsChartProps {
  articleText: string;
  theme?: string;
  isDarkMode?: boolean;
}

interface DimensionMetric {
  name: string;
  key: string;
  score: number; // 0 to 100
  color: string;
  darkColor: string;
  icon: React.ElementType;
  description: string;
  detail: string;
}

interface SectionDistribution {
  name: string;
  words: number;
  pct: number;
}

export function analyzeArticle(text: string): {
  dimensions: DimensionMetric[];
  sections: SectionDistribution[];
  totalWords: number;
  readingTimeMin: number;
  summary: {
    complexityLevel: string;
    biblicalFocus: string;
    scientificIntegration: string;
    practicalBalance: string;
  };
} {
  const clean = text || '';
  const lower = clean.toLowerCase();
  const words = clean.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length || 1;
  const readingTimeMin = Math.max(1, Math.round(totalWords / 160));

  // 1. Foco Bíblico
  const biblicalKeywords = [
    'bíblia', 'bíblico', 'bíblica', 'deus', 'cristo', 'jesus', 'espírito santo', 'escritura',
    'versículo', 'passagem', 'capítulo', 'aliança', 'graça', 'fé', 'redenção', 'salvação',
    'teologia', 'teológico', 'profeta', 'apóstolo', 'evangelho', 'deuteronômio', 'salmos',
    'provérbios', 'romanos', 'coríntios', 'gálatas', 'efésios', 'hebreus', 'gênesis',
    'êxodo', 'mateus', 'marcos', 'lucas', 'joão', 'apocalipse', 'senhor', 'santidade',
    'santificação', 'justificação', 'oração', 'mandamento', 'yahweh', 'eloim', 'adonai'
  ];
  let biblicalCount = 0;
  biblicalKeywords.forEach(kw => {
    const matches = lower.match(new RegExp(`\\b${kw}`, 'gi'));
    if (matches) biblicalCount += matches.length;
  });

  // 2. Exegese e Termos Originais
  const exegesisKeywords = [
    'hebraico', 'grego', 'aramaico', 'bdag', 'halot', 'strong', 'léxico', 'exegese',
    'exegético', 'etimologia', 'raiz', 'transliteração', 'septuaginta', 'texto massorético',
    'morfologia', 'semântica', 'contexto histórico', 'original', 'termo', 'verbo',
    'substantivo', 'cláusula', 'sintaxe', 'manuscrito', 'tanakh', 'bereshit', 'shalom',
    'hesed', 'agape', 'phileo', 'metanoia', 'pneumatologia', 'cristologia'
  ];
  let exegesisCount = 0;
  exegesisKeywords.forEach(kw => {
    const matches = lower.match(new RegExp(`\\b${kw}`, 'gi'));
    if (matches) exegesisCount += matches.length;
  });

  // 3. Neurociência e Evidências Científicas
  const scienceKeywords = [
    'neurociência', 'neurobiologia', 'cérebro', 'cerebral', 'dopamina', 'córtex',
    'pré-frontal', 'amígdala', 'sinapse', 'sinapses', 'neural', 'neurônios',
    'neuroplasticidade', 'plasticidade', 'cognição', 'cognitivo', 'estudo', 'pesquisa',
    'científico', 'psicologia', 'endocrinologia', 'cortisol', 'adrenalina', 'harvard',
    'stanford', 'evidência', 'artigo', 'experimento', 'ressonância', 'sistema límbico'
  ];
  let scienceCount = 0;
  scienceKeywords.forEach(kw => {
    const matches = lower.match(new RegExp(`\\b${kw}`, 'gi'));
    if (matches) scienceCount += matches.length;
  });

  // 4. Aplicação Prática & Conduta
  const practicalKeywords = [
    'prática', 'prático', 'hábito', 'hábitos', 'ação', 'ações', 'decisão', 'decisões',
    'rotina', 'cotidiano', 'dia a dia', 'exercício', 'exercitar', 'comportamento',
    'disciplina', 'aplicação', 'passo a passo', 'estratégia', 'transformação',
    'maturidade', 'vida real', 'hoje', 'relacionamento', 'trabalho', 'gestão'
  ];
  let practicalCount = 0;
  practicalKeywords.forEach(kw => {
    const matches = lower.match(new RegExp(`\\b${kw}`, 'gi'));
    if (matches) practicalCount += matches.length;
  });

  // 5. Nível de Complexidade Conceitual
  // Calculated via lexical diversity, paragraph structure, and presence of complex synthesis terms
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const lexicalDiversityRatio = totalWords > 50 ? (uniqueWords / totalWords) : 0.5;
  const avgSentenceLength = clean.split(/[.!?]+/).filter(Boolean).reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) / Math.max(1, clean.split(/[.!?]+/).length);
  
  // Complexity keywords (academic and philosophical connectors)
  const complexityKeywords = [
    'paradoxo', 'dicotomia', 'hermenêutica', 'axioma', 'epistemologia', 'ontológico',
    'pressuposto', 'fundamento', 'desdobramento', 'consonância', 'subjacente',
    'preponderante', 'corroborar', 'antítese', 'síntese', 'maturação', 'coram deo'
  ];
  let complexityWordCount = 0;
  complexityKeywords.forEach(kw => {
    const matches = lower.match(new RegExp(`\\b${kw}`, 'gi'));
    if (matches) complexityWordCount += matches.length;
  });

  // Normalize scores between 20 and 98 to represent realistic distribution percentages
  const biblicalDensity = (biblicalCount / totalWords) * 1000;
  const biblicalScore = Math.min(98, Math.max(35, Math.round(biblicalDensity * 2.8 + (biblicalCount > 5 ? 30 : 15))));

  const exegesisDensity = (exegesisCount / totalWords) * 1000;
  const exegesisScore = Math.min(95, Math.max(25, Math.round(exegesisDensity * 5.5 + (exegesisCount > 2 ? 30 : 10))));

  const scienceDensity = (scienceCount / totalWords) * 1000;
  const scienceScore = Math.min(95, Math.max(20, Math.round(scienceDensity * 5.0 + (scienceCount > 2 ? 25 : 10))));

  const practicalDensity = (practicalCount / totalWords) * 1000;
  const practicalScore = Math.min(96, Math.max(30, Math.round(practicalDensity * 3.2 + (practicalCount > 5 ? 25 : 15))));

  // Complexity formula combines lexical diversity, sentence length, and academic terminology
  const complexityScore = Math.min(98, Math.max(40, Math.round(
    (lexicalDiversityRatio * 50) + 
    Math.min(25, avgSentenceLength * 0.8) + 
    Math.min(25, complexityWordCount * 4) + 
    (totalWords > 1200 ? 10 : 0)
  )));

  // 6. Extract Section Distributions (H2 and H3 markdown headers)
  const sectionMatches = clean.split(/(?=^#{2,3}\s+)/m).filter(Boolean);
  const sections: SectionDistribution[] = sectionMatches.slice(0, 6).map((sec, idx) => {
    const firstLine = sec.trim().split('\n')[0] || '';
    const title = firstLine.replace(/^#{2,3}\s+/, '').replace(/[*_#]/g, '').trim();
    const secWords = sec.trim().split(/\s+/).filter(Boolean).length;
    return {
      name: title.length > 24 ? title.slice(0, 22) + '...' : (title || `Seção ${idx + 1}`),
      words: secWords,
      pct: Math.min(100, Math.round((secWords / totalWords) * 100))
    };
  });

  const dimensions: DimensionMetric[] = [
    {
      name: 'Foco Bíblico',
      key: 'biblical',
      score: biblicalScore,
      color: '#d97706', // amber-600
      darkColor: '#f59e0b', // amber-500
      icon: BookOpen,
      description: 'Citações das Escrituras, teologia e referências nominais',
      detail: `${biblicalCount} menções identificadas no texto`
    },
    {
      name: 'Complexidade',
      key: 'complexity',
      score: complexityScore,
      color: '#4f46e5', // indigo-600
      darkColor: '#6366f1', // indigo-500
      icon: Layers,
      description: 'Densidade conceitual, variedade lexical e profundidade analítica',
      detail: `${uniqueWords} termos únicos (${Math.round(lexicalDiversityRatio * 100)}% diversidade)`
    },
    {
      name: 'Exegese Original',
      key: 'exegesis',
      score: exegesisScore,
      color: '#059669', // emerald-600
      darkColor: '#10b981', // emerald-500
      icon: Compass,
      description: 'Léxicos acadêmicos (BDAG/HALOT), hebraico e grego',
      detail: `${exegesisCount} raízes ou referências lexicais`
    },
    {
      name: 'Neurociência',
      key: 'science',
      score: scienceScore,
      color: '#0284c7', // sky-600
      darkColor: '#38bdf8', // sky-400
      icon: Brain,
      description: 'Estudos empíricos, neurobiologia e mecanismos cognitivos',
      detail: `${scienceCount} referências científicas e cerebrais`
    },
    {
      name: 'Aplicação Prática',
      key: 'practical',
      score: practicalScore,
      color: '#7c3aed', // purple-600
      darkColor: '#8b5cf6', // purple-500
      icon: Sparkles,
      description: 'Comportamento, hábitos diários, decisões e conduta',
      detail: `${practicalCount} conexões pragmáticas com o cotidiano`
    }
  ];

  // Qualitative summary
  const complexityLevel = complexityScore >= 80 ? 'Avançado / Acadêmico' : complexityScore >= 60 ? 'Intermediário / Equilibrado' : 'Acessível';
  const biblicalFocus = biblicalScore >= 75 ? 'Predominante & Exegético' : biblicalScore >= 50 ? 'Forte & Estrutural' : 'Introdutório';
  const scientificIntegration = scienceScore >= 65 ? 'Forte Evidência Científica' : scienceScore >= 40 ? 'Pontual & Ilustrativa' : 'Discreta';
  const practicalBalance = practicalScore >= 65 ? 'Alta Orientação para Ação' : 'Reflexivo / Conceitual';

  return {
    dimensions,
    sections,
    totalWords,
    readingTimeMin,
    summary: {
      complexityLevel,
      biblicalFocus,
      scientificIntegration,
      practicalBalance
    }
  };
}

export default function ArticleAnalyticsChart({
  articleText,
  theme,
  isDarkMode = false
}: ArticleAnalyticsChartProps) {
  const [viewMode, setViewMode] = useState<'dimensions' | 'sections'>('dimensions');

  const analysis = useMemo(() => {
    return analyzeArticle(articleText);
  }, [articleText]);

  if (!articleText || articleText.trim().length < 50) {
    return null;
  }

  const chartData = viewMode === 'dimensions'
    ? analysis.dimensions.map(d => ({
        name: d.name,
        score: d.score,
        detail: d.detail,
        description: d.description,
        color: isDarkMode ? d.darkColor : d.color
      }))
    : analysis.sections.map(s => ({
        name: s.name,
        score: s.words,
        pct: s.pct,
        color: isDarkMode ? '#6366f1' : '#4f46e5'
      }));

  return (
    <div className="bg-stone-50 dark:bg-stone-850/80 rounded-xl border border-stone-200 dark:border-stone-700/80 p-5 space-y-5 animate-in fade-in duration-300">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-700">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Distribuição Temática & Nível de Complexidade (Recharts)
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Análise dimensional do artigo gerado ({analysis.totalWords} palavras, ~{analysis.readingTimeMin} min de leitura)
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-lg self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('dimensions')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'dimensions'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dimensões</span>
          </button>
          {analysis.sections.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode('sections')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'sections'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Por Seções</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Foco Bíblico
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {analysis.summary.biblicalFocus}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Complexidade
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {analysis.summary.complexityLevel}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Neurociência
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {analysis.summary.scientificIntegration}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Aplicação
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
            {analysis.summary.practicalBalance}
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Container */}
      <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: viewMode === 'dimensions' ? 5 : 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDarkMode ? '#332f2c' : '#e7e5e4'}
              />
              <XAxis
                dataKey="name"
                tick={{
                  fill: isDarkMode ? '#d6d3d1' : '#44403c',
                  fontSize: 11,
                  fontWeight: 500
                }}
                interval={0}
                angle={viewMode === 'sections' ? -18 : 0}
                textAnchor={viewMode === 'sections' ? 'end' : 'middle'}
                axisLine={{ stroke: isDarkMode ? '#44403c' : '#d6d3d1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, viewMode === 'dimensions' ? 100 : 'auto']}
                unit={viewMode === 'dimensions' ? '%' : ''}
                tick={{
                  fill: isDarkMode ? '#a8a29e' : '#78716c',
                  fontSize: 10
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg text-xs max-w-xs space-y-1">
                        <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span
                            className="font-mono px-1.5 py-0.5 rounded text-[11px]"
                            style={{
                              backgroundColor: `${item.color}20`,
                              color: item.color
                            }}
                          >
                            {viewMode === 'dimensions' ? `${item.score}%` : `${item.score} pal (${item.pct}%)`}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-tight">
                            {item.description}
                          </p>
                        )}
                        {item.detail && (
                          <p className="text-[10px] text-stone-400 dark:text-stone-400 font-mono pt-1 border-t border-stone-100 dark:border-stone-800">
                            {item.detail}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="score"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Info footer below the chart */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {viewMode === 'dimensions'
                ? 'Índices normalizados (0-100%) calculados via densidade léxica, citações e terminologia temática.'
                : 'Contagem de palavras e peso relativo de cada subtítulo do artigo gerado.'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-stone-400">
            Nexus Intelligence Analytics
          </span>
        </div>
      </div>
    </div>
  );
}
