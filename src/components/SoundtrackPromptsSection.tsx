import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Sliders, 
  ExternalLink, 
  HelpCircle, 
  Volume2, 
  Clock, 
  Disc3,
  Layers,
  ChevronRight,
  RefreshCw,
  Share2
} from 'lucide-react';
import { SoundtrackPart } from '../types';

interface SoundtrackPromptsSectionProps {
  soundtrackPrompts: SoundtrackPart[] | null;
  isGenerating: boolean;
  onGenerate: (style: string) => Promise<void>;
  selectedDuration: number;
  theme?: string;
  hasScript: boolean;
  onAdvanceToNext?: () => void;
  isStandaloneTab?: boolean;
}

export const SOUNDTRACK_STYLES = [
  {
    id: 'Cinemático / Hans Zimmer',
    name: 'Cinemático / Hans Zimmer',
    description: 'Sub-bass profundo, celo dramático, pulso rítmico e texturas orquestrais híbridas.'
  },
  {
    id: 'Neoclássico Minimalista / Max Richter',
    name: 'Neoclássico / Max Richter',
    description: 'Piano com feltro intimista, cordas em staccato e progressões harmônicas lentas.'
  },
  {
    id: 'Ambient Espiritual / Contemplativo',
    name: 'Ambient Espiritual & Reverberação',
    description: 'Drones etéreos, pads atmosféricos, sinos suaves e respiração sonora.'
  },
  {
    id: 'Documentário Moderno / Híbrido Pulsante',
    name: 'Documentário / Híbrido Moderno',
    description: 'Batida downtempo sutil, sintetizadores analógicos aquecidos e guitarras com eco.'
  }
];

export default function SoundtrackPromptsSection({
  soundtrackPrompts,
  isGenerating,
  onGenerate,
  selectedDuration,
  theme,
  hasScript,
  onAdvanceToNext,
  isStandaloneTab = false
}: SoundtrackPromptsSectionProps) {
  const [selectedStyle, setSelectedStyle] = useState(SOUNDTRACK_STYLES[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
    }
  };

  const copyAllPrompts = async () => {
    if (!soundtrackPrompts || soundtrackPrompts.length === 0) return;
    const combined = soundtrackPrompts.map((part) => {
      return `=== ${part.actName.toUpperCase()} (${part.sectionCoverage}) ===
Título: ${part.title}
Clima: ${part.mood} | Andamento: ${part.bpm} | Gênero: ${part.genre}
Instrumentos: ${part.instruments.join(', ')}

[CAMPO DE ESTILO (STYLE PROMPT) - SUNO / FLOW MUSIC]:
${part.stylePrompt}

[CAMPO DE LETRA (LYRICS/ESTRUTURA METATAGS) - MODO INSTRUMENTAL]:
${part.lyricsPrompt}

Dica Técnica: ${part.tip}
`;
    }).join('\n----------------------------------------\n\n');

    await copyText(combined, 'all-prompts');
  };

  return (
    <div className={`space-y-6 ${!isStandaloneTab ? 'pt-8 border-t border-stone-200 dark:border-stone-800' : ''}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg">
              <Music className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Trilha Sonora com IA (Suno, Flow Music & Udio)
            </h3>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Gere 3 prompts orquestrados para cada ato do seu roteiro (~{selectedDuration} min), otimizados para acompanhar a locução sem ofuscar a voz.
          </p>
        </div>

        {soundtrackPrompts && soundtrackPrompts.length > 0 && (
          <button
            type="button"
            onClick={copyAllPrompts}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            {copiedKey === 'all-prompts' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedKey === 'all-prompts' ? 'Todos Copiados!' : 'Copiar os 3 Prompts'}</span>
          </button>
        )}
      </div>

      {/* Style selector and trigger button */}
      <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-850/80 rounded-xl border border-stone-200 dark:border-stone-700/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SOUNDTRACK_STYLES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStyle(st.id)}
              className={`p-3 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                selectedStyle === st.id
                  ? 'bg-white dark:bg-stone-900 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div>
                <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>{st.name}</span>
                  {selectedStyle === st.id && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  {st.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-stone-400" />
            <span>
              {hasScript ? 'Roteiro carregado e pronto para partição em 3 atos.' : 'Usando tema principal como referência acústica.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onGenerate(selectedStyle)}
            disabled={isGenerating}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compondo Prompts de Áudio com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{soundtrackPrompts ? 'Regenerar Trilha Sonora (3 Partes)' : 'Gerar 3 Prompts de Trilha Sonora'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {soundtrackPrompts && soundtrackPrompts.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* 3 Act Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {soundtrackPrompts.map((part) => {
              const actBadgeColors = part.partNumber === 1
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60'
                : part.partNumber === 2
                ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700/60'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700/60';

              const actHeaderBorder = part.partNumber === 1
                ? 'border-t-4 border-t-amber-500'
                : part.partNumber === 2
                ? 'border-t-4 border-t-sky-500'
                : 'border-t-4 border-t-emerald-500';

              return (
                <div
                  key={part.partNumber}
                  className={`bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 ${actHeaderBorder} p-5 flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    {/* Top badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${actBadgeColors}`}>
                        {part.actName}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {part.sectionCoverage}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Disc3 className="w-4 h-4 text-stone-400" />
                        {part.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                        {part.mood}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-stone-600 dark:text-stone-300">
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono font-medium">
                        {part.bpm}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-medium">
                        {part.genre}
                      </span>
                    </div>

                    {/* Instruments list */}
                    {part.instruments && part.instruments.length > 0 && (
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-850 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Instrumentação: </span>
                        {part.instruments.join(' • ')}
                      </div>
                    )}

                    {/* Prompt 1: Style Prompt for Suno/Flow Music */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          Campo de Estilo (Style Prompt)
                        </label>
                        <button
                          type="button"
                          onClick={() => copyText(part.stylePrompt, `style-${part.partNumber}`)}
                          className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center gap-1"
                        >
                          {copiedKey === `style-${part.partNumber}` ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Copiado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" /> Copiar Estilo
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 bg-stone-950 text-stone-200 font-mono text-[11px] leading-relaxed rounded-lg border border-stone-800 select-all break-words">
                        {part.stylePrompt}
                      </div>
                    </div>

                    {/* Prompt 2: Lyrics / Metatags Structure */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          Campo de Letra / Estrutura
                        </label>
                        <button
                          type="button"
                          onClick={() => copyText(part.lyricsPrompt, `lyrics-${part.partNumber}`)}
                          className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center gap-1"
                        >
                          {copiedKey === `lyrics-${part.partNumber}` ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Copiado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" /> Copiar Estrutura
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 bg-stone-950 text-stone-300 font-mono text-[11px] leading-relaxed rounded-lg border border-stone-800 whitespace-pre-wrap select-all">
                        {part.lyricsPrompt}
                      </div>
                    </div>
                  </div>

                  {/* Tip Footer */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Dica: </span>
                    {part.tip}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Guide Card with External Links for Suno and Flow Music */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Como gerar no Suno AI (v3.5/v4) ou Flow Music / Udio:</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                1. Ative o modo <strong>Custom</strong> e marque <strong>Instrumental: ON</strong>.<br />
                2. Cole o <strong>Campo de Estilo</strong> no campo <em>Style of Music</em> e o <strong>Campo de Letra/Estrutura</strong> na caixa de letra.<br />
                3. Gere 2 variações para cada ato e monte na sua timeline sobre a voz com volume entre -18dB e -22dB.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://suno.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Abrir Suno</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {onAdvanceToNext && (
                <button
                  type="button"
                  onClick={onAdvanceToNext}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Avançar para SEO</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
