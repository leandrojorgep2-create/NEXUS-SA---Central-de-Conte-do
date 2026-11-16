import React, { useState } from 'react';
import { Palette, Camera, Sparkles, UserCheck, Flame, SunMedium, Edit3, Check, Copy, RefreshCw, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { ArtDirectionSheet } from '../types';

interface ArtDirectionSheetViewProps {
  sheet: ArtDirectionSheet | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onUpdateSheet: (updated: ArtDirectionSheet) => void;
  showToast: (msg: string) => void;
}

export const ArtDirectionSheetView: React.FC<ArtDirectionSheetViewProps> = ({
  sheet,
  isGenerating,
  onGenerate,
  onUpdateSheet,
  showToast
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Local editable form state
  const [formPalette, setFormPalette] = useState('');
  const [formStyle, setFormStyle] = useState('');
  const [formCharacters, setFormCharacters] = useState('');
  const [formMood, setFormMood] = useState('');
  const [formLenses, setFormLenses] = useState('');
  const [formLighting, setFormLighting] = useState('');

  const startEditing = () => {
    if (!sheet) return;
    setFormPalette(sheet.palette || '');
    setFormStyle(sheet.photographicStyle || '');
    setFormCharacters(sheet.characters || '');
    setFormMood(sheet.mood || '');
    setFormLenses(sheet.cameraLensGuide || '');
    setFormLighting(sheet.lightingSetup || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateSheet({
      palette: formPalette,
      photographicStyle: formStyle,
      characters: formCharacters,
      mood: formMood,
      cameraLensGuide: formLenses,
      lightingSetup: formLighting
    });
    setIsEditing(false);
    showToast('Ficha de Direção de Arte atualizada!');
  };

  const copySheetText = async () => {
    if (!sheet) return;
    const text = `=== FICHA DE DIREÇÃO DE ARTE & CONSISTÊNCIA VISUAL ===
• Paleta de Cores: ${sheet.palette}
• Estilo Fotográfico/Cinematográfico: ${sheet.photographicStyle}
• Personagem(ns) Recorrente(s): ${sheet.characters}
• Mood Geral: ${sheet.mood}
• Lentes & Câmeras: ${sheet.cameraLensGuide || '35mm e 85mm anamórfica f/1.8'}
• Iluminação Mestra: ${sheet.lightingSetup || 'Chiaroscuro suave e luz dourada'}
======================================================`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Ficha de direção de arte copiada!');
    } catch {
      showToast('Erro ao copiar ficha.');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden mb-8 transition-all">
      {/* Top Banner Header */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent dark:from-amber-500/15 dark:via-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                Ficha de Consistência Visual & Direção de Arte
              </h3>
              {sheet && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Diretriz estética mestre referenciada em <strong className="text-stone-700 dark:text-stone-300">todos os prompts</strong> para garantir unidade cromática, realismo 35mm e continuidade de personagens entre os planos.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {sheet && !isEditing && (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-300 dark:border-stone-700 transition-colors flex items-center gap-1.5"
                title="Editar manualmente as diretrizes"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={copySheetText}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-300 dark:border-stone-700 transition-colors flex items-center gap-1.5"
                title="Copiar texto da ficha"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-3.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Gerar ou regenerar a ficha de arte com IA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Criando Ficha...' : sheet ? 'Regenerar Ficha' : 'Gerar Ficha de Arte'}</span>
          </button>

          {sheet && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors"
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      {sheet ? (
        isExpanded && (
          <div className="p-5">
            {isEditing ? (
              /* Inline Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Paleta de Cores Dominante & Secundária:
                    </label>
                    <textarea
                      value={formPalette}
                      onChange={(e) => setFormPalette(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Estilo Fotográfico / Cinematográfico (Hiper-realista 35mm):
                    </label>
                    <textarea
                      value={formStyle}
                      onChange={(e) => setFormStyle(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Personagem(ns) Recorrente(s) (para consistência):
                    </label>
                    <textarea
                      value={formCharacters}
                      onChange={(e) => setFormCharacters(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Mood Geral da Peça:
                    </label>
                    <textarea
                      value={formMood}
                      onChange={(e) => setFormMood(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Câmeras & Lentes de Referência:
                    </label>
                    <input
                      type="text"
                      value={formLenses}
                      onChange={(e) => setFormLenses(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Setup Mestre de Iluminação:
                    </label>
                    <input
                      type="text"
                      value={formLighting}
                      onChange={(e) => setFormLighting(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Paleta de Cores */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Paleta de Cores
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.palette}
                  </p>
                </div>

                {/* 2. Estilo Fotográfico */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Estilo Fotográfico / 35mm
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.photographicStyle}
                  </p>
                </div>

                {/* 3. Personagens Recorrentes */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Personagem(ns) Recorrente(s)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.characters || 'Sem personagem fixo (foco em B-Roll conceitual, objetos simbólicos e ambientes).'}
                  </p>
                </div>

                {/* 4. Mood Geral */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Mood Geral da Peça
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.mood}
                  </p>
                </div>

                {/* 5. Câmeras & Lentes */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Lentes & Câmeras
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.cameraLensGuide || 'ARRI Alexa Mini / Leica SL2, 35mm e 85mm anamórfica'}
                  </p>
                </div>

                {/* 6. Iluminação Mestra */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <SunMedium className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Iluminação Mestra
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {sheet.lightingSetup || 'Chiaroscuro suave, luz lateral de janela e contraluz quente'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Empty Callout State */
        <div className="p-6 text-center">
          <div className="inline-flex p-3 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-full mb-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            Ficha de Direção de Arte ainda não gerada
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Gere a ficha de arte previamente para definir a paleta de cores, estilo 35mm e personagens antes de decupar as cenas, ou clique em "Gerar Storyboard" para gerá-la automaticamente.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Analisando Roteiro & Criando Ficha...' : 'Gerar Ficha de Direção de Arte Agora'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
