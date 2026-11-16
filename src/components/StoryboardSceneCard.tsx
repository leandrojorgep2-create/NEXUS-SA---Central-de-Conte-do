import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  ImageIcon, 
  Download, 
  Loader2, 
  Clock, 
  Layers, 
  Camera, 
  Sun, 
  Maximize2, 
  ShieldAlert, 
  Edit2,
  Sparkles,
  Video,
  Film,
  Move
} from 'lucide-react';
import { StoryboardScene, SceneType } from '../types';

interface StoryboardSceneCardProps {
  scene: StoryboardScene;
  index: number;
  imageState?: { url?: string; loading: boolean };
  copiedKey: string | null;
  onCopyText: (text: string, key: string, label?: string) => void;
  onGenerateImage: (index: number, prompt: string) => void;
  onDownloadImage: (url: string, sceneNum: number | string) => void;
  onOpenFullscreen: (index: number) => void;
  onRegeneratePrompt: (index: number) => Promise<void>;
  onRegenerateVideoPrompt?: (index: number) => Promise<void>;
  onUpdateScene: (index: number, updated: Partial<StoryboardScene>) => void;
  isRegeneratingPrompt?: boolean;
  isRegeneratingVideo?: boolean;
}

export const StoryboardSceneCard: React.FC<StoryboardSceneCardProps> = ({
  scene,
  index,
  imageState,
  copiedKey,
  onCopyText,
  onGenerateImage,
  onDownloadImage,
  onOpenFullscreen,
  onRegeneratePrompt,
  onRegenerateVideoPrompt,
  onUpdateScene,
  isRegeneratingPrompt = false,
  isRegeneratingVideo = false
}) => {
  const [isEditingNegative, setIsEditingNegative] = useState(false);
  const [customNegative, setCustomNegative] = useState(scene.negativePrompt);

  const promptKey = `scene-prompt-${index}`;
  const videoPromptKey = `scene-video-${index}`;
  const negativeKey = `scene-negative-${index}`;
  
  const isCopiedPrompt = copiedKey === promptKey;
  const isCopiedVideo = copiedKey === videoPromptKey;
  const isCopiedNegative = copiedKey === negativeKey;

  // Tag styling helper
  const getTagBadge = (type: SceneType | string) => {
    const norm = String(type || '').toLowerCase();
    if (norm.includes('estabelecimento')) {
      return {
        label: 'Estabelecimento',
        bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        dot: 'bg-sky-500'
      };
    }
    if (norm.includes('ação') || norm.includes('acao')) {
      return {
        label: 'Ação',
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500'
      };
    }
    if (norm.includes('reflexão') || norm.includes('reflexao') || norm.includes('close')) {
      return {
        label: 'Reflexão / Close',
        bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        dot: 'bg-purple-500'
      };
    }
    if (norm.includes('transição') || norm.includes('transicao')) {
      return {
        label: 'Transição',
        bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500'
      };
    }
    if (norm.includes('citação') || norm.includes('citacao')) {
      return {
        label: 'Citação Visual',
        bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500'
      };
    }
    return {
      label: type || 'Cena',
      bg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700',
      dot: 'bg-stone-500'
    };
  };

  const tagStyle = getTagBadge(scene.sceneType);

  const handleSaveNegative = () => {
    onUpdateScene(index, { negativePrompt: customNegative });
    setIsEditingNegative(false);
  };

  // Video prompt fallback if not generated
  const effectiveVideoPrompt = scene.videoPrompt || (
    scene.cameraMovement 
      ? `${scene.cameraMovement}, ${scene.subjectMovement || 'subtle contemplative motion'}, 4k resolution, cinematic motion for image-to-video, seamless continuous 7-second pacing, no abrupt loop`
      : 'Slow cinematic dolly-in with subtle subject motion, continuous 7-second motion, image-to-video style, smooth cinematic pacing, no abrupt loop'
  );

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Top Scene Bar */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-850">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Scene Number & Timecode */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Cena {scene.scene || index + 1}
            </span>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-stone-200/80 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>{scene.timecode || '0:00 - 0:07'}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">({scene.durationSeconds || 7}s)</span>
            </div>
          </div>

          {/* Scene Type Tag Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tagStyle.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tagStyle.dot}`} />
            {tagStyle.label}
          </span>
        </div>

        {/* Spoken Text Snippet (6-8s speech) */}
        {scene.textSnippet && (
          <div className="mt-2.5 px-3 py-1.5 bg-stone-900 text-stone-100 dark:bg-stone-800 dark:text-stone-200 rounded-lg text-xs leading-relaxed font-medium">
            <span className="text-amber-400 font-bold mr-1">“</span>
            {scene.textSnippet}
            <span className="text-amber-400 font-bold ml-1">”</span>
          </div>
        )}

        {/* 1-Line Scene Summary Description */}
        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-2 font-medium leading-normal">
          {scene.description}
        </p>

        {/* Cinematographic Specs Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-stone-200/70 dark:border-stone-800 text-[11px]">
          {scene.shotType && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
              <Camera className="w-3 h-3 text-sky-500 shrink-0" />
              <span>{scene.shotType}</span>
            </span>
          )}
          {scene.lighting && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
              <Sun className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{scene.lighting}</span>
            </span>
          )}
          {scene.lens && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
              <Layers className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>{scene.lens}</span>
            </span>
          )}
          {scene.cameraMovement && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
              <Move className="w-3 h-3 text-purple-500 shrink-0" />
              <span>{scene.cameraMovement}</span>
            </span>
          )}
        </div>

        {/* 1. Image Prompt Box (in English) */}
        <div className="mt-3 bg-stone-100 dark:bg-stone-900/90 p-3 rounded-lg border border-stone-200 dark:border-stone-750">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-[10px] uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Prompt de Imagem (8K Fotografia 35mm):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRegeneratePrompt(index)}
                disabled={isRegeneratingPrompt}
                className="px-2 py-0.5 text-[11px] font-medium rounded text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Regenerar parâmetros da cena com nova angulação/iluminação"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingPrompt ? 'animate-spin' : ''}`} />
                <span>{isRegeneratingPrompt ? 'Regenerando...' : 'Regenerar'}</span>
              </button>
              <button
                type="button"
                onClick={() => onCopyText(scene.imagePrompt, promptKey, `Prompt de Imagem da Cena ${scene.scene || index + 1}`)}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded transition-colors border ${
                  isCopiedPrompt
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
                title="Copiar prompt de imagem em inglês"
              >
                {isCopiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-stone-500" />
                    <span>Copiar Imagem</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed select-all break-words">
            {scene.imagePrompt}
          </p>
        </div>

        {/* 2. Video / Animation Prompt Box (Kling / Runway / Luma) */}
        <div className="mt-2.5 bg-purple-50/70 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200/80 dark:border-purple-800/60">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-[10px] uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1">
              <Film className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              Prompt de Vídeo / Animação (Kling, Runway, Luma):
            </span>
            <div className="flex items-center gap-1.5">
              {onRegenerateVideoPrompt && (
                <button
                  type="button"
                  onClick={() => onRegenerateVideoPrompt(index)}
                  disabled={isRegeneratingVideo}
                  className="px-2 py-0.5 text-[11px] font-medium rounded text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1 disabled:opacity-50"
                  title="Regenerar movimento de câmera e animação"
                >
                  <RefreshCw className={`w-3 h-3 ${isRegeneratingVideo ? 'animate-spin' : ''}`} />
                  <span>{isRegeneratingVideo ? 'Ajustando...' : 'Regenerar Vídeo'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onCopyText(effectiveVideoPrompt, videoPromptKey, `Prompt de Vídeo da Cena ${scene.scene || index + 1}`)}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded transition-colors border ${
                  isCopiedVideo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-850 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
                title="Copiar prompt de animação/vídeo para Kling, Runway ou Luma"
              >
                {isCopiedVideo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>Copiar Vídeo</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs font-mono text-purple-950 dark:text-purple-200 leading-relaxed select-all break-words">
            {effectiveVideoPrompt}
          </p>
          {(scene.cameraMovement || scene.subjectMovement) && (
            <div className="mt-2 pt-1.5 border-t border-purple-200/50 dark:border-purple-900/50 flex flex-wrap gap-2 text-[10px] text-purple-800 dark:text-purple-300">
              {scene.cameraMovement && (
                <span><strong>Câmera:</strong> {scene.cameraMovement}</span>
              )}
              {scene.subjectMovement && (
                <span><strong>Sujeito:</strong> {scene.subjectMovement}</span>
              )}
            </div>
          )}
        </div>

        {/* 3. Negative Prompt Box */}
        <div className="mt-2 bg-stone-100/60 dark:bg-stone-900/50 p-2.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 text-[11px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              Prompt Negativo:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isEditingNegative) {
                    handleSaveNegative();
                  } else {
                    setCustomNegative(scene.negativePrompt);
                    setIsEditingNegative(true);
                  }
                }}
                className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-0.5 px-1.5 py-0.5 rounded"
              >
                <Edit2 className="w-2.5 h-2.5" />
                <span>{isEditingNegative ? 'Salvar' : 'Editar'}</span>
              </button>
              <button
                type="button"
                onClick={() => onCopyText(scene.negativePrompt, negativeKey, `Prompt Negativo da Cena ${scene.scene || index + 1}`)}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                  isCopiedNegative
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
                title="Copiar prompt negativo"
              >
                {isCopiedNegative ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5 text-stone-400" />
                    <span>Copiar Negativo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isEditingNegative ? (
            <div className="space-y-1 mt-1">
              <textarea
                value={customNegative}
                onChange={(e) => setCustomNegative(e.target.value)}
                rows={2}
                className="w-full p-1.5 text-[11px] font-mono rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setIsEditingNegative(false)}
                  className="px-2 py-0.5 text-[10px] text-stone-500 hover:text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNegative}
                  className="px-2 py-0.5 text-[10px] bg-stone-900 text-white rounded font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          ) : (
            <p className="font-mono text-stone-600 dark:text-stone-400 leading-snug select-all break-words text-[11px]">
              {scene.negativePrompt || 'no text, no watermark, no cartoon, no illustration, no extra limbs, no plastic skin, no oversaturation, no blur'}
            </p>
          )}
        </div>
      </div>

      {/* Image Preview / Generation Section */}
      <div className="p-4 flex-1 flex flex-col justify-center items-center bg-stone-100/40 dark:bg-stone-950/40 min-h-[220px]">
        {imageState?.url ? (
          <div className="relative w-full group">
            <img 
              src={imageState.url} 
              alt={`Cena ${scene.scene || index + 1}`} 
              className="w-full h-auto rounded-lg shadow-sm cursor-pointer object-cover max-h-[340px]" 
              referrerPolicy="no-referrer" 
              onClick={() => onOpenFullscreen(index)}
            />
            
            {/* Hover Actions Bar */}
            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onOpenFullscreen(index)}
                className="bg-black/75 hover:bg-black text-white p-2 rounded-md flex items-center justify-center backdrop-blur-sm"
                title="Ampliar em tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onCopyText(scene.imagePrompt, promptKey, `Prompt de Imagem da Cena ${scene.scene || index + 1}`)}
                className="bg-black/75 hover:bg-black text-white px-2.5 py-1.5 rounded-md flex items-center gap-1 text-xs backdrop-blur-sm"
                title="Copiar prompt de imagem"
              >
                {isCopiedPrompt ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Imagem</span>
              </button>
              <button
                type="button"
                onClick={() => onCopyText(effectiveVideoPrompt, videoPromptKey, `Prompt de Vídeo da Cena ${scene.scene || index + 1}`)}
                className="bg-purple-900/80 hover:bg-purple-950 text-white px-2.5 py-1.5 rounded-md flex items-center gap-1 text-xs backdrop-blur-sm"
                title="Copiar prompt de vídeo para Kling/Runway"
              >
                {isCopiedVideo ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Video className="w-3.5 h-3.5" />
                )}
                <span>Vídeo</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadImage(imageState.url!, scene.scene || index + 1)}
                className="bg-black/75 hover:bg-black text-white p-2 rounded-md flex items-center justify-center backdrop-blur-sm"
                title="Baixar imagem"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onGenerateImage(index, scene.imagePrompt)}
                className="bg-black/75 hover:bg-black text-white px-2.5 py-1.5 rounded-md flex items-center gap-1 text-xs backdrop-blur-sm"
                title="Regenerar render da imagem"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Regenerar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-[260px] text-center">
            <button
              type="button"
              onClick={() => onGenerateImage(index, scene.imagePrompt)}
              disabled={imageState?.loading}
              className="px-4 py-3 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm w-full"
            >
              {imageState?.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="text-xs">Gerando Imagem...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold">Gerar Imagem da Cena</span>
                </>
              )}
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-500">
              <button
                type="button"
                onClick={() => onCopyText(scene.imagePrompt, promptKey, `Prompt de Imagem da Cena ${scene.scene || index + 1}`)}
                className="hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 transition-colors"
                title="Copiar prompt da imagem"
              >
                {isCopiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Imagem</span>
                  </>
                )}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onCopyText(effectiveVideoPrompt, videoPromptKey, `Prompt de Vídeo da Cena ${scene.scene || index + 1}`)}
                className="hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors text-purple-700 dark:text-purple-400"
                title="Copiar prompt de animação/vídeo"
              >
                {isCopiedVideo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3 h-3" />
                    <span>Copiar Vídeo</span>
                  </>
                )}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onRegeneratePrompt(index)}
                disabled={isRegeneratingPrompt}
                className="hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                title="Regenerar variação de ângulo/luz"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingPrompt ? 'animate-spin' : ''}`} />
                <span>Variação</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
