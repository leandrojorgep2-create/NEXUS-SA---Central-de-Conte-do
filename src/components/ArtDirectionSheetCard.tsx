import React, { useState } from 'react';
import { 
  Palette, 
  Camera, 
  UserCheck, 
  Sparkles, 
  Edit3, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Film,
  SunMedium
} from 'lucide-react';
import { ArtDirectionSheet } from '../types';

interface ArtDirectionSheetCardProps {
  artDirectionSheet: ArtDirectionSheet | null;
  isGenerating: boolean;
  onGenerateArtDirection: () => Promise<void>;
  onUpdateArtDirection: (sheet: ArtDirectionSheet) => void;
  hasScript: boolean;
}

export default function ArtDirectionSheetCard({
  artDirectionSheet,
  isGenerating,
  onGenerateArtDirection,
  onUpdateArtDirection,
  hasScript
}: ArtDirectionSheetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit draft state
  const [draft, setDraft] = useState<ArtDirectionSheet>(
    artDirectionSheet || {
      palette: '',
      photographicStyle: '',
      characters: '',
      mood: '',
      cameraLensGuide: '',
      lightingSetup: ''
    }
  );

  // Sync draft when prop updates
  React.useEffect(() => {
    if (artDirectionSheet) {
      setDraft(artDirectionSheet);
    }
  }, [artDirectionSheet]);

  const handleSave = () => {
    onUpdateArtDirection(draft);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    if (!artDirectionSheet) return;
    const text = `=== FICHA DE DIREÇÃO DE ARTE & CONSISTÊNCIA VISUAL ===
• Paleta de Cores: ${artDirectionSheet.palette}
• Estilo Fotográfico: ${artDirectionSheet.photographicStyle}
• Personagens Recorrentes: ${artDirectionSheet.characters}
• Mood Geral: ${artDirectionSheet.mood}
• Iluminação Mestra: ${artDirectionSheet.lightingSetup || 'Chiaroscuro naturalista'}
• Câmeras & Lentes: ${artDirectionSheet.cameraLensGuide || '35mm e 85mm anamórfica'}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar ficha:', err);
    }
  };

  if (!artDirectionSheet && !isGenerating) {
    return (
      <div className="p-5 bg-stone-50 dark:bg-stone-850/80 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg shrink-0">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Ficha de Direção de Arte & Consistência Visual
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Gera a bíblia estética (paleta, estilo analógico 35mm, personagens e mood) antes de decupar as cenas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerateArtDirection}
          disabled={!hasScript || isGenerating}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50 shadow-2xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Criar Ficha de Arte</span>
        </button>
      </div>
    );
  }

  if (isGenerating && !artDirectionSheet) {
    return (
      <div className="p-6 bg-stone-50 dark:bg-stone-850/80 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center text-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
          Compondo Ficha de Direção de Arte & Bíblia Visual...
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Definindo paleta terrosa, estilo analógico 35mm, iluminação e consistência de personagens.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/90 dark:bg-stone-850/80 rounded-xl border border-amber-300/60 dark:border-amber-900/50 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-stone-100/50 to-transparent dark:from-amber-500/10 dark:via-stone-900/50 border-b border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500 text-white rounded-lg shadow-2xs">
            <Film className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Ficha de Direção de Arte & Consistência Visual
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                Hiper-Realista 35mm
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Diretrizes estéticas aplicadas em todos os prompts de cena para garantir coerência fotográfica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Copiar Ficha de Direção de Arte"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Ficha</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Editar parâmetros da ficha"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={onGenerateArtDirection}
                disabled={isGenerating}
                className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Regenerar Ficha com IA"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerar</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(artDirectionSheet!);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Ficha</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paleta de Cores */}
              <div className="p-3.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Paleta de Cores Dominante & Secundária:</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                  {artDirectionSheet?.palette}
                </p>
              </div>

              {/* Estilo Fotográfico */}
              <div className="p-3.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Estilo Fotográfico & Cinematográfico:</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                  {artDirectionSheet?.photographicStyle}
                </p>
              </div>

              {/* Personagens Recorrentes */}
              <div className="p-3.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Personagens & Consistência de Figura Humana:</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                  {artDirectionSheet?.characters}
                </p>
              </div>

              {/* Mood Geral e Iluminação */}
              <div className="p-3.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <SunMedium className="w-4 h-4 text-amber-500" />
                  <span>Mood Geral & Iluminação Mestra:</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                  <strong className="text-stone-900 dark:text-stone-100">{artDirectionSheet?.mood}.</strong>{' '}
                  {artDirectionSheet?.lightingSetup}
                </p>
                {artDirectionSheet?.cameraLensGuide && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800 font-mono">
                    Lentes: {artDirectionSheet.cameraLensGuide}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Inline Edit Form */
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Paleta de Cores:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.palette}
                    onChange={(e) => setDraft({ ...draft, palette: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ex: Tons terrosos quentes com acentos de azul cobalto profundo..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Estilo Fotográfico / Cinematográfico:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.photographicStyle}
                    onChange={(e) => setDraft({ ...draft, photographicStyle: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ex: Fotografia editorial 35mm, Kodak Portra 400, grão sutil, hiper-realista..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Personagens Recorrentes:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.characters}
                    onChange={(e) => setDraft({ ...draft, characters: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ex: Homem de 35 anos, traços meditativos, linho e lã escura..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Mood Geral & Iluminação:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.mood}
                    onChange={(e) => setDraft({ ...draft, mood: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Ex: Contemplativo-tenso, iluminação naturalista chiaroscuro..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
