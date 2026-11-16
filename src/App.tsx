/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, PenTool, LayoutTemplate, Image as ImageIcon, Search, FileText, ChevronRight, Copy, Check, Loader2, Moon, Sun, FileEdit, Trash2, Save, Undo2, Mic, Download, Grid, List, Maximize2, X, ChevronLeft, FolderOpen, Plus, Zap, Sparkles, Film, Tag, GraduationCap, Library, Quote, Clock, AlertCircle, BookmarkPlus, Music, Palette, SlidersHorizontal, Eye, ShieldAlert, ShieldCheck, Filter, Layers, RefreshCw } from 'lucide-react';
import { SavedProject, ProjectData, AcademicSource, SoundtrackPart, ArtDirectionSheet, StoryboardScene, SceneType } from './types';
import SavedProjectsModal from './components/SavedProjectsModal';
import ArticleAnalyticsChart from './components/ArticleAnalyticsChart';
import SoundtrackPromptsSection from './components/SoundtrackPromptsSection';
import ArtDirectionSheetCard from './components/ArtDirectionSheetCard';
import { StoryboardSceneCard } from './components/StoryboardSceneCard';
import ArticleReferencesSection from './components/ArticleReferencesSection';
import ArticleExportModal from './components/ArticleExportModal';
import CitationConsistencyModal from './components/CitationConsistencyModal';
import LexiconScriptViewer from './components/LexiconScriptViewer';
import LexiconSidebarPanel from './components/LexiconSidebarPanel';
import { compileAllReferencesForProject } from './utils/apaFormatter';
import { analyzeCitationConsistency } from './utils/citationConsistencyChecker';
import { detectLexiconTermsInText, LexiconEntry } from './utils/lexiconDatabase';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [theme, setTheme] = useState('');
  const [passageResult, setPassageResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Etapa 2 Sources State
  const [sources, setSources] = useState<AcademicSource[]>([]);
  const [isSearchingSources, setIsSearchingSources] = useState(false);
  const [isExpandingWithSources, setIsExpandingWithSources] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [sourceCategory, setSourceCategory] = useState<'all' | 'neuroscience' | 'theological' | 'lexicon'>('all');

  // Etapa 3 State
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [scriptsResult, setScriptsResult] = useState<any[] | null>(null);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [errorScript, setErrorScript] = useState('');

  // Etapa 3.5 State (Roteiro Final) & Léxicos (BDAG / HALOT)
  const [selectedScript, setSelectedScript] = useState('');
  const [scriptHistory, setScriptHistory] = useState<string[]>([]);
  const [focusScriptVal, setFocusScriptVal] = useState('');
  const [scriptInstructions, setScriptInstructions] = useState('');
  const [isElaboratingScript, setIsElaboratingScript] = useState(false);
  const [isCleaningTTS, setIsCleaningTTS] = useState(false);
  const [scriptViewMode, setScriptViewMode] = useState<'reading' | 'editor'>('reading');
  const [isLexiconSidebarOpen, setIsLexiconSidebarOpen] = useState(false);
  const [selectedLexiconTermId, setSelectedLexiconTermId] = useState<string | null>(null);

  // Termos teológicos e léxicos identificados no roteiro atual
  const detectedLexiconTerms = useMemo(() => {
    return detectLexiconTermsInText(selectedScript, sources);
  }, [selectedScript, sources]);

  // Etapa 4 State (Ficha de Arte + Decupagem Dinâmica 6-8s)
  const [artDirectionSheet, setArtDirectionSheet] = useState<ArtDirectionSheet | null>(null);
  const [isGeneratingArtDirection, setIsGeneratingArtDirection] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardStatus, setStoryboardStatus] = useState('');
  const [sceneImages, setSceneImages] = useState<Record<number, { url?: string, loading: boolean }>>({});
  const [visualStyle, setVisualStyle] = useState('Fotográfico Editorial 35mm (Kodak Portra)');
  const [storyboardViewMode, setStoryboardViewMode] = useState<'list' | 'gallery'>('list');
  const [storyboardFilter, setStoryboardFilter] = useState<string>('all');
  const [storyboardSearch, setStoryboardSearch] = useState('');
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null);
  const [regeneratingVideoIndex, setRegeneratingVideoIndex] = useState<number | null>(null);

  // Etapa 4.5 State (Trilha Sonora com IA)
  const [soundtrackPrompts, setSoundtrackPrompts] = useState<SoundtrackPart[] | null>(null);
  const [isGeneratingSoundtrack, setIsGeneratingSoundtrack] = useState(false);

  // Etapa 5 State
  const [seoResult, setSeoResult] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoStatus, setSeoStatus] = useState('');

  // Etapa 6 State
  const [articleResult, setArticleResult] = useState('');
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [articleStatus, setArticleStatus] = useState('');
  const [isArticleExportModalOpen, setIsArticleExportModalOpen] = useState(false);
  const [isCitationConsistencyModalOpen, setIsCitationConsistencyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Etapa 6: Citation Consistency Audit
  const articleConsistencyReport = useMemo(() => {
    const refs = compileAllReferencesForProject(sources, articleResult, passageResult, theme);
    return analyzeCitationConsistency(articleResult, refs);
  }, [articleResult, sources, passageResult, theme]);

  // Saved Projects State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // In-app confirmation dialog state (replaces window.confirm for iframe compatibility)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'new_project' | 'clear_project' | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const tabs = [
    { id: 1, name: 'Entrada', icon: PenTool },
    { id: 2, name: 'Passagem', icon: BookOpen },
    { id: 3, name: 'Roteiros', icon: LayoutTemplate },
    { id: 3.5, name: 'Roteiro Final', icon: FileEdit },
    { id: 4, name: 'Imagens', icon: ImageIcon },
    { id: 4.5, name: 'Trilha Sonora', icon: Music },
    { id: 5, name: 'SEO', icon: Search },
    { id: 6, name: 'Artigo', icon: FileText },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenImageIndex(null);
      if (e.key === 'ArrowLeft' && fullscreenImageIndex !== null && fullscreenImageIndex > 0) {
        setFullscreenImageIndex(prev => prev! - 1);
      }
      if (e.key === 'ArrowRight' && fullscreenImageIndex !== null && fullscreenImageIndex < storyboard.length - 1) {
        setFullscreenImageIndex(prev => prev! + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex, storyboard.length]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_project_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isDarkMode !== undefined) setIsDarkMode(parsed.isDarkMode);
        if (parsed.activeTab !== undefined) setActiveTab(parsed.activeTab);
        if (parsed.theme !== undefined) setTheme(parsed.theme);
        if (parsed.passageResult !== undefined) setPassageResult(parsed.passageResult);
        if (Array.isArray(parsed.sources)) setSources(parsed.sources);
        if (parsed.selectedDuration !== undefined) setSelectedDuration(parsed.selectedDuration);
        if (parsed.scriptsResult !== undefined) setScriptsResult(parsed.scriptsResult);
        if (parsed.selectedScript !== undefined) setSelectedScript(parsed.selectedScript);
        if (parsed.scriptHistory !== undefined) setScriptHistory(parsed.scriptHistory);
        if (parsed.scriptInstructions !== undefined) setScriptInstructions(parsed.scriptInstructions);
        if (parsed.storyboard !== undefined) setStoryboard(parsed.storyboard);
        if (parsed.sceneImages !== undefined) {
          // Remove loading states before restoring
          const cleanImages: Record<number, any> = {};
          Object.keys(parsed.sceneImages).forEach((key) => {
            const numKey = parseInt(key, 10);
            if (parsed.sceneImages[numKey].url) {
              cleanImages[numKey] = { url: parsed.sceneImages[numKey].url, loading: false };
            }
          });
          setSceneImages(cleanImages);
        }
        if (parsed.artDirectionSheet !== undefined) setArtDirectionSheet(parsed.artDirectionSheet);
        if (parsed.visualStyle !== undefined) setVisualStyle(parsed.visualStyle);
        if (parsed.soundtrackPrompts !== undefined) setSoundtrackPrompts(parsed.soundtrackPrompts);
        if (parsed.seoResult !== undefined) setSeoResult(parsed.seoResult);
        if (parsed.articleResult !== undefined) setArticleResult(parsed.articleResult);
      } catch (e) {
        console.error("Error loading project", e);
      }
    }

    // Load saved projects list
    const storedProjects = localStorage.getItem('nexus_saved_projects_v1');
    if (storedProjects) {
      try {
        const list = JSON.parse(storedProjects);
        if (Array.isArray(list)) setSavedProjects(list);
      } catch (err) {
        console.error("Error loading saved projects list", err);
      }
    }

    const savedId = localStorage.getItem('nexus_current_project_id');
    if (savedId) {
      setCurrentProjectId(savedId);
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      isDarkMode, activeTab, theme, passageResult, sources, selectedDuration, scriptsResult,
      selectedScript, scriptHistory, scriptInstructions, storyboard, artDirectionSheet, visualStyle, sceneImages, soundtrackPrompts, seoResult, articleResult
    };
    localStorage.setItem('nexus_project_v1', JSON.stringify(data));
    
    setIsSaving(true);
    const timer = setTimeout(() => setIsSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [isLoaded, isDarkMode, activeTab, theme, passageResult, sources, selectedDuration, scriptsResult, selectedScript, scriptHistory, scriptInstructions, storyboard, artDirectionSheet, visualStyle, sceneImages, soundtrackPrompts, seoResult, articleResult]);

  // Persist saved projects list
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('nexus_saved_projects_v1', JSON.stringify(savedProjects));
  }, [savedProjects, isLoaded]);

  // Persist current project ID
  useEffect(() => {
    if (!isLoaded) return;
    if (currentProjectId) {
      localStorage.setItem('nexus_current_project_id', currentProjectId);
    } else {
      localStorage.removeItem('nexus_current_project_id');
    }
  }, [currentProjectId, isLoaded]);

  // Saved Projects Management Handlers
  const handleSaveCurrentAsNew = (customName?: string) => {
    const finalName = customName?.trim() || theme.trim() || `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
    const newProj: SavedProject = {
      id: `proj_${Date.now()}`,
      name: finalName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        theme,
        passageResult,
        sources,
        selectedDuration,
        scriptsResult,
        selectedScript,
        scriptHistory,
        scriptInstructions,
        storyboard,
        sceneImages,
        seoResult,
        articleResult,
        visualStyle,
        activeTab,
      },
    };
    setSavedProjects((prev) => [newProj, ...prev]);
    setCurrentProjectId(newProj.id);
  };

  const handleUpdateExistingProject = (projectId: string) => {
    setSavedProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            updatedAt: Date.now(),
            data: {
              theme,
              passageResult,
              sources,
              selectedDuration,
              scriptsResult,
              selectedScript,
              scriptHistory,
              scriptInstructions,
              storyboard,
              sceneImages,
              soundtrackPrompts,
              seoResult,
              articleResult,
              visualStyle,
              activeTab,
            },
          };
        }
        return p;
      })
    );
  };

  const handleLoadProject = (project: SavedProject) => {
    const d = project.data;
    if (!d) return;
    setTheme(d.theme || '');
    setPassageResult(d.passageResult || '');
    setSources(d.sources || []);
    setSelectedDuration(d.selectedDuration || 15);
    setScriptsResult(d.scriptsResult || null);
    setSelectedScript(d.selectedScript || '');
    setScriptHistory(d.scriptHistory || []);
    setScriptInstructions(d.scriptInstructions || '');
    setStoryboard(d.storyboard || []);

    if (d.sceneImages) {
      const cleanImages: Record<number, any> = {};
      Object.keys(d.sceneImages).forEach((key) => {
        const numKey = parseInt(key, 10);
        if (d.sceneImages[numKey]?.url) {
          cleanImages[numKey] = { url: d.sceneImages[numKey].url, loading: false };
        }
      });
      setSceneImages(cleanImages);
    } else {
      setSceneImages({});
    }

    setSoundtrackPrompts(d.soundtrackPrompts || null);
    setSeoResult(d.seoResult || '');
    setArticleResult(d.articleResult || '');
    if (d.visualStyle) setVisualStyle(d.visualStyle);
    setActiveTab(d.activeTab || 1);
    setCurrentProjectId(project.id);
  };

  const handleDeleteProject = (projectId: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
    }
  };

  const handleDuplicateProject = (project: SavedProject) => {
    const dup: SavedProject = {
      ...project,
      id: `proj_${Date.now()}`,
      name: `${project.name} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSavedProjects((prev) => [dup, ...prev]);
  };

  const handleImportProject = (imported: SavedProject) => {
    setSavedProjects((prev) => [imported, ...prev]);
  };

  const handleStartBlankProject = () => {
    setTheme('');
    setPassageResult('');
    setSources([]);
    setSelectedDuration(15);
    setScriptsResult(null);
    setSelectedScript('');
    setScriptHistory([]);
    setScriptInstructions('');
    setStoryboard([]);
    setSceneImages({});
    setSoundtrackPrompts(null);
    setSeoResult('');
    setArticleResult('');
    setActiveTab(1);
    setCurrentProjectId(null);
    localStorage.removeItem('nexus_project_v1');
    localStorage.removeItem('nexus_current_project_id');
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setSavedProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName, updatedAt: Date.now() } : p))
    );
  };

  const handleNewProjectClick = () => {
    const hasContent = Boolean(
      (theme || '').trim() ||
      (passageResult || '').trim() ||
      (selectedScript || '').trim() ||
      storyboard.length > 0
    );

    if (hasContent) {
      setConfirmModal({
        isOpen: true,
        type: 'new_project',
        title: 'Iniciar Novo Projeto?',
        description: 'Você possui um projeto em andamento. Deseja salvar uma cópia na sua biblioteca antes de começar um novo, ou iniciar direto em branco?',
      });
    } else {
      handleStartBlankProject();
      showToast('Novo projeto em branco pronto.');
    }
  };

  const handleClearClick = () => {
    setConfirmModal({
      isOpen: true,
      type: 'clear_project',
      title: 'Limpar Projeto Atual?',
      description: 'Esta ação irá resetar os dados do projeto ativo da tela. Se quiser guardá-lo, salve-o em "Projetos Salvos" primeiro.',
    });
  };

  const handleConfirmSaveAndNew = () => {
    handleSaveCurrentAsNew();
    handleStartBlankProject();
    setConfirmModal({ isOpen: false, type: null, title: '', description: '' });
    showToast('Projeto anterior salvo! Novo projeto iniciado.');
  };

  const handleConfirmNewWithoutSaving = () => {
    handleStartBlankProject();
    setConfirmModal({ isOpen: false, type: null, title: '', description: '' });
    showToast('Novo projeto em branco iniciado.');
  };

  const handleConfirmClear = () => {
    handleStartBlankProject();
    setConfirmModal({ isOpen: false, type: null, title: '', description: '' });
    showToast('Projeto limpo com sucesso.');
  };

  const safeFetchJson = async <T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    maxRetries = 2
  ): Promise<T> => {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(input, init);
        const contentType = (res.headers.get('content-type') || '').toLowerCase();

        if (contentType.includes('application/json')) {
          try {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error || `Erro na requisição (${res.status})`);
            }
            return data as T;
          } catch (jsonErr: any) {
            if (jsonErr?.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
            // If res.json() threw a parse error, fall through to text parsing
          }
        }

        const text = await res.text();
        const lowerText = text.toLowerCase();
        const isHtml = lowerText.includes('<!doctype') || lowerText.includes('<html') || lowerText.includes('<head') || contentType.includes('text/html');

        if (isHtml) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
            continue;
          }
          throw new Error('O servidor está temporariamente ocupado ou iniciando. Por favor, tente novamente em alguns instantes.');
        }

        // Try extracting JSON even if content-type was text/plain or markdown-wrapped
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try {
              parsed = JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1'));
            } catch {}
          }
        }

        if (parsed !== null) {
          if (!res.ok) {
            throw new Error(parsed?.error || `Erro na requisição (${res.status})`);
          }
          return parsed as T;
        }

        if (!res.ok) {
          throw new Error(text.trim() && text.length < 200 ? text.trim() : `Erro no servidor (${res.status}).`);
        }

        // Response was ok but not valid JSON
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error('O servidor retornou uma resposta incompleta. Por favor, tente novamente.');
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const isRetryable =
          attempt < maxRetries &&
          (err?.name === 'TypeError' ||
           err?.name === 'AbortError' ||
           msg.includes('Failed to fetch') ||
           msg.includes('NetworkError') ||
           msg.includes('fetch') ||
           msg.includes('indisponível') ||
           msg.includes('reiniciando') ||
           msg.includes('incompleta') ||
           msg.includes('temporariamente') ||
           msg.includes('ocupado') ||
           msg.includes('502') ||
           msg.includes('503') ||
           msg.includes('504'));

        if (isRetryable) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        const isNetwork =
          err?.name === 'TypeError' ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError');

        if (isNetwork) {
          throw new Error('Não foi possível estabelecer conexão com o servidor. Verifique sua rede e tente novamente.');
        }
        throw err;
      }
    }
    throw lastError || new Error('Falha na comunicação com o servidor.');
  };

  const handleGeneratePassage = async () => {
    if (!(theme || "").trim()) return;
    setIsLoading(true);
    setActiveTab(2); // Move to tab 2 immediately
    try {
      const data = await safeFetchJson<{ text?: string }>('/api/generate-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      if (data.text) {
        setPassageResult(data.text);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Erro ao gerar a passagem bíblica. Verifique a conexão e tente novamente.';
      setPassageResult(msg);
      showToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getScriptStats = (text: string) => {
    if (!text) return { words: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    // 145 words per minute average speaking rate
    const totalSeconds = Math.round((words / 145) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { words, minutes, seconds, totalSeconds };
  };

  const handleSearchSources = async (queryToSearch?: string, categoryToSearch?: string) => {
    if (!theme.trim() && !passageResult.trim()) {
      showToast('Defina um tema na Etapa 1 ou gere a passagem primeiro.');
      return;
    }
    setIsSearchingSources(true);
    try {
      const data = await safeFetchJson<{ sources?: AcademicSource[] }>('/api/search-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          passage: passageResult,
          query: queryToSearch !== undefined ? queryToSearch : sourceSearchQuery,
          category: categoryToSearch !== undefined ? categoryToSearch : sourceCategory,
        }),
      });
      if (Array.isArray(data.sources)) {
        setSources(data.sources);
        showToast(`${data.sources.length} fontes acadêmicas e bíblicas mapeadas com sucesso!`);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao buscar fontes.');
    } finally {
      setIsSearchingSources(false);
    }
  };

  const handleExpandPassageWithSources = async () => {
    if (!passageResult.trim()) {
      showToast('Gere ou insira a passagem bíblica primeiro.');
      return;
    }
    setIsExpandingWithSources(true);
    try {
      const data = await safeFetchJson<{ text?: string }>('/api/expand-passage-with-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          passage: passageResult,
          sources,
        }),
      });
      if (data.text) {
        setPassageResult(data.text);
        showToast('Dossiê bíblico expandido com estudos e autoridade acadêmica!');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao expandir análise com fontes.');
    } finally {
      setIsExpandingWithSources(false);
    }
  };

  const handleExpandToFullDuration = async (customInstruction?: string) => {
    if (!selectedScript.trim()) return;
    setIsElaboratingScript(true);
    setScriptHistory((prev) => [selectedScript, ...prev].slice(0, 3));
    try {
      const targetWords = selectedDuration * 145;
      const instruction = customInstruction || `EXTENSÃO COMPLETA PARA ${selectedDuration} MINUTOS: O roteiro DEVE conter aproximadamente ${targetWords} palavras faladas (mínimo de ${Math.round(targetWords * 0.9)}). Crie parágrafos desenvolvidos e narrativos, diálogos internos, quebra de objeções que o ouvinte está pensando, analogias práticas e cite nominalmente os estudos acadêmicos e léxicos da base bíblica. Estruture com timestamps contínuos de [00:00] até [${String(selectedDuration).padStart(2, '0')}:00].`;
      
      const data = await safeFetchJson<{ text?: string }>('/api/elaborate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          passage: passageResult,
          scriptContent: selectedScript,
          instructions: instruction,
          duration: selectedDuration,
        }),
      });
      if (data.text) {
        setSelectedScript(data.text);
        showToast(`Roteiro expandido com sucesso para a meta de ${selectedDuration} minutos!`);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao expandir o roteiro.');
      setScriptHistory((prev) => prev.slice(1));
    } finally {
      setIsElaboratingScript(false);
    }
  };

  const handleGenerateScripts = async () => {
    if (!passageResult) return;
    setIsGeneratingScripts(true);
    setErrorScript('');
    try {
      const data = await safeFetchJson<{ data?: { scripts?: string[] } }>('/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, passage: passageResult, duration: selectedDuration }),
      });
      if (data.data && data.data.scripts) {
        setScriptsResult(data.data.scripts);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Erro ao gerar os roteiros. Tente novamente.';
      setErrorScript(msg);
      showToast(msg);
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  const handleUndo = () => {
    if (scriptHistory.length > 0) {
      const prev = scriptHistory[0];
      setScriptHistory((history) => history.slice(1));
      setSelectedScript(prev);
    }
  };

  const handleElaborateScript = async () => {
    if (!selectedScript) return;
    setIsElaboratingScript(true);
    
    // Save current script to history before AI updates it
    setScriptHistory((prev) => [selectedScript, ...prev].slice(0, 3));
    
    try {
      const data = await safeFetchJson<{ text?: string }>('/api/elaborate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme, 
          passage: passageResult, 
          scriptContent: selectedScript, 
          instructions: scriptInstructions,
          duration: selectedDuration,
        }),
      });
      if (data.text) {
        setSelectedScript(data.text);
        showToast('Roteiro otimizado com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao otimizar o roteiro. Tente novamente.');
      // Rollback history if failed
      setScriptHistory((prev) => prev.slice(1));
    } finally {
      setIsElaboratingScript(false);
    }
  };

  const handleCleanForTTS = async () => {
    if (!selectedScript) return;
    setIsCleaningTTS(true);
    
    // Save current script to history before AI updates it
    setScriptHistory((prev) => [selectedScript, ...prev].slice(0, 3));
    
    try {
      const data = await safeFetchJson<{ text?: string }>('/api/clean-for-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptContent: selectedScript }),
      });
      if (data.text) {
        setSelectedScript(data.text);
        showToast('Roteiro formatado para locução/TTS!');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao preparar roteiro para TTS.');
      // Rollback history if failed
      setScriptHistory((prev) => prev.slice(1));
    } finally {
      setIsCleaningTTS(false);
    }
  };

  const handleGenerateArtDirection = async () => {
    if (!(selectedScript || "").trim() && !theme) {
      showToast('Insira um roteiro ou defina um tema primeiro.');
      return;
    }
    setIsGeneratingArtDirection(true);
    try {
      const data = await safeFetchJson<{ artDirectionSheet?: ArtDirectionSheet }>('/api/generate-art-direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, script: selectedScript, visualStyle }),
      });
      if (data.artDirectionSheet) {
        setArtDirectionSheet(data.artDirectionSheet);
        showToast('Ficha de Direção de Arte criada com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao gerar ficha de arte.');
    } finally {
      setIsGeneratingArtDirection(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!(selectedScript || "").trim()) return;
    setIsGeneratingStoryboard(true);
    setStoryboardStatus('Iniciando decupagem cinematográfica...');
    
    const statuses = [
      'Estabelecendo Ficha de Direção de Arte e Bíblia Visual...',
      'Decupando roteiro dinamicamente em cenas de 6 a 8 segundos...',
      'Garantindo que trechos longos sejam desmembrados em múltiplos planos...',
      'Atribuindo tags de tipo (estabelecimento, ação, reflexão, transição, citação)...',
      'Diversificando planos de câmera (wide, close-up, POV) e iluminação chiaroscuro...',
      'Otimizando prompts em inglês (hiper-realismo 35mm) e prompts negativos...'
    ];
    let step = 0;
    const intervalId = setInterval(() => {
      if (step < statuses.length) {
        setStoryboardStatus(statuses[step]);
        step++;
      }
    }, 2800);

    try {
      let currentSheet = artDirectionSheet;
      if (!currentSheet || !currentSheet.palette) {
        setStoryboardStatus('1/2. Estabelecendo Ficha de Direção de Arte e Consistência Visual...');
        try {
          const artRes = await safeFetchJson<{ artDirectionSheet?: ArtDirectionSheet }>('/api/generate-art-direction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme, script: selectedScript, visualStyle }),
          });
          if (artRes.artDirectionSheet) {
            currentSheet = artRes.artDirectionSheet;
            setArtDirectionSheet(currentSheet);
          }
        } catch (e) {
          console.warn('Fallback generating art direction sheet:', e);
        }
      }

      setStoryboardStatus('2/2. Decupando roteiro dinamicamente em cenas de 6 a 8 segundos...');
      const data = await safeFetchJson<{ storyboard?: StoryboardScene[]; artDirectionSheet?: ArtDirectionSheet }>('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: selectedScript, 
          visualStyle,
          artDirectionSheet: currentSheet,
          theme
        }),
      });
      if (data.artDirectionSheet && !artDirectionSheet) {
        setArtDirectionSheet(data.artDirectionSheet);
      }
      if (data.storyboard && Array.isArray(data.storyboard)) {
        setStoryboard(data.storyboard);
        setSceneImages({}); // Reset images for new storyboard
        showToast(`${data.storyboard.length} cenas decupadas com sucesso (6-8s cada)!`);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao decupar o storyboard.');
    } finally {
      clearInterval(intervalId);
      setIsGeneratingStoryboard(false);
    }
  };

  const handleRegenerateScenePrompt = async (index: number) => {
    const currentScene = storyboard[index];
    if (!currentScene) return;

    setRegeneratingSceneIndex(index);
    try {
      const data = await safeFetchJson<{ scenePrompt?: Partial<StoryboardScene> }>('/api/regenerate-scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: currentScene.scene || index + 1,
          textSnippet: currentScene.textSnippet,
          sceneType: currentScene.sceneType,
          currentShotType: currentScene.shotType,
          currentLighting: currentScene.lighting,
          currentLens: currentScene.lens,
          artDirectionSheet,
          theme,
          visualStyle
        }),
      });

      if (data.scenePrompt) {
        setStoryboard(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            ...data.scenePrompt
          };
          return next;
        });
        showToast(`Prompt da Cena ${currentScene.scene || index + 1} regenerado!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Erro ao regenerar prompt da cena.');
    } finally {
      setRegeneratingSceneIndex(null);
    }
  };

  const handleRegenerateVideoPrompt = async (index: number) => {
    const currentScene = storyboard[index];
    if (!currentScene) return;

    setRegeneratingVideoIndex(index);
    try {
      const data = await safeFetchJson<{ videoPrompt?: string; cameraMovement?: string; subjectMovement?: string }>('/api/regenerate-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: currentScene.scene || index + 1,
          textSnippet: currentScene.textSnippet,
          sceneType: currentScene.sceneType,
          shotType: currentScene.shotType,
          imagePrompt: currentScene.imagePrompt,
          currentCameraMovement: currentScene.cameraMovement
        }),
      });

      if (data.videoPrompt) {
        setStoryboard(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            videoPrompt: data.videoPrompt,
            cameraMovement: data.cameraMovement || next[index].cameraMovement,
            subjectMovement: data.subjectMovement || next[index].subjectMovement
          };
          return next;
        });
        showToast(`Prompt de vídeo da Cena ${currentScene.scene || index + 1} regenerado!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Erro ao regenerar prompt de vídeo.');
    } finally {
      setRegeneratingVideoIndex(null);
    }
  };

  const handleUpdateScene = (index: number, updated: Partial<StoryboardScene>) => {
    setStoryboard(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...updated };
      }
      return next;
    });
    showToast('Cena atualizada!');
  };

  const handleDownloadImage = async (imageUrl: string, sceneNumber: number | string) => {
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Cena_${sceneNumber}_Storyboard.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Download iniciado!');
        return;
      }

      // Try proxying through the backend to avoid CORS restrictions
      let blob: Blob | null = null;
      try {
        const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
        if (proxyRes.ok) {
          blob = await proxyRes.blob();
        }
      } catch (err) {
        console.warn('Proxy download failed, trying direct link...', err);
      }

      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `Cena_${sceneNumber}_Storyboard.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        showToast('Download concluído!');
      } else {
        // Fallback: open image in new tab or trigger download via target blank
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `Cena_${sceneNumber}_Storyboard.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Abrindo imagem para download...');
      }
    } catch (error) {
      console.error(error);
      showToast('Não foi possível realizar o download da imagem.');
    }
  };

  const handleGenerateImage = async (sceneIndex: number, imagePrompt: string) => {
    setSceneImages(prev => ({ ...prev, [sceneIndex]: { loading: true } }));
    try {
      const data = await safeFetchJson<{ image?: string }>('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      if (data.image) {
        setSceneImages(prev => ({ ...prev, [sceneIndex]: { url: data.image, loading: false } }));
      }
    } catch (error: any) {
      console.error(error);
      setSceneImages(prev => ({ ...prev, [sceneIndex]: { loading: false } }));
      showToast(error?.message || 'Erro ao gerar a imagem.');
    }
  };

  const handleGenerateSoundtrack = async (styleId: string) => {
    if (!theme && !selectedScript) {
      showToast('Defina um tema ou selecione um roteiro primeiro.');
      return;
    }
    setIsGeneratingSoundtrack(true);
    try {
      const data = await safeFetchJson<{ parts?: SoundtrackPart[] }>('/api/generate-soundtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          script: selectedScript,
          duration: selectedDuration,
          musicalStyle: styleId,
        }),
      });
      if (data.parts && Array.isArray(data.parts) && data.parts.length > 0) {
        setSoundtrackPrompts(data.parts);
        showToast('3 Prompts de Trilha Sonora gerados com sucesso!');
      } else {
        showToast('Não foi possível obter os prompts de trilha sonora.');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Erro ao gerar os prompts de trilha sonora.');
    } finally {
      setIsGeneratingSoundtrack(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (!(selectedScript || "").trim()) return;
    setIsGeneratingSeo(true);
    setSeoStatus('Analisando roteiro e palavra-chave...');

    const statuses = [
      'Extraindo intenção de busca...',
      'Gerando títulos otimizados para clique...',
      'Escrevendo meta descrição persuasiva...',
      'Formatando esquema de dados (JSON-LD)...'
    ];
    let step = 0;
    const intervalId = setInterval(() => {
      if (step < statuses.length) {
        setSeoStatus(statuses[step]);
        step++;
      }
    }, 2500);

    try {
      const data = await safeFetchJson<{ text?: string }>('/api/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, script: selectedScript }),
      });
      if (data.text) {
        setSeoResult(data.text);
        showToast('SEO gerado com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Erro ao gerar o SEO. Tente novamente.';
      setSeoResult(msg);
      showToast(msg);
    } finally {
      clearInterval(intervalId);
      setIsGeneratingSeo(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (!(selectedScript || "").trim() || !(passageResult || "").trim()) return;
    setIsGeneratingArticle(true);
    setArticleStatus('Convertendo roteiro para formato de leitura...');

    const statuses = [
      'Expandindo tópicos com base na exegese...',
      'Aprofundando os conceitos de neurociência...',
      'Ajustando o tom de voz para blog post...',
      'Estruturando formatação e subtítulos (H2, H3)...',
      'Finalizando artigo longo...'
    ];
    let step = 0;
    const intervalId = setInterval(() => {
      if (step < statuses.length) {
        setArticleStatus(statuses[step]);
        step++;
      }
    }, 3000);

    try {
      const data = await safeFetchJson<{ text?: string }>('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, script: selectedScript, passage: passageResult, sources }),
      });
      if (data.text) {
        setArticleResult(data.text);
        showToast('Artigo gerado com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || 'Erro ao gerar o Artigo. Tente novamente.';
      setArticleResult(msg);
      showToast(msg);
    } finally {
      clearInterval(intervalId);
      setIsGeneratingArticle(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const [copiedPromptKey, setCopiedPromptKey] = useState<string | null>(null);

  const copyPromptText = async (text: string, key: string, label: string = 'Prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptKey(key);
      showToast(`${label} copiado!`);
      setTimeout(() => setCopiedPromptKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
      showToast('Não foi possível copiar o texto.');
    }
  };

  const copyAllImagePrompts = async (includeNegative: boolean = false) => {
    if (!storyboard || storyboard.length === 0) return;
    const allPromptsText = storyboard.map((scene, idx) => {
      const sceneNum = scene.scene || idx + 1;
      let block = `=== CENA ${String(sceneNum).padStart(2, '0')} (${scene.timecode || '6-8s'}) [${(scene.sceneType || 'cena').toUpperCase()}] ===\n`;
      block += `Trecho falado: "${scene.textSnippet}"\n`;
      block += `Descrição visual: ${scene.description}\n`;
      block += `[PROMPT POSITIVO]:\n${scene.imagePrompt}\n`;
      if (includeNegative && scene.negativePrompt) {
        block += `[PROMPT NEGATIVO]:\n${scene.negativePrompt}\n`;
      }
      return block;
    }).join('\n----------------------------------------\n\n');
    await copyPromptText(allPromptsText, includeNegative ? 'all-prompts-full' : 'all-storyboard-prompts', includeNegative ? 'Prompts + Negativos' : 'Todos os prompts');
  };

  const copyAllVideoPrompts = async () => {
    if (!storyboard || storyboard.length === 0) return;
    const allVideoText = storyboard.map((scene, idx) => {
      const sceneNum = scene.scene || idx + 1;
      const effectiveVideo = scene.videoPrompt || (
        scene.cameraMovement 
          ? `${scene.cameraMovement}, ${scene.subjectMovement || 'subtle contemplative motion'}, 4k resolution, cinematic motion for image-to-video, seamless continuous 7-second pacing, no abrupt loop`
          : 'Slow cinematic dolly-in with subtle subject motion, continuous 7-second motion, image-to-video style, smooth cinematic pacing, no abrupt loop'
      );
      let block = `=== CENA ${String(sceneNum).padStart(2, '0')} (${scene.timecode || '6-8s'}) [${(scene.sceneType || 'cena').toUpperCase()}] ===\n`;
      block += `Trecho falado: "${scene.textSnippet}"\n`;
      block += `Descrição visual: ${scene.description}\n`;
      if (scene.cameraMovement) block += `Movimento de Câmera: ${scene.cameraMovement}\n`;
      if (scene.subjectMovement) block += `Movimento do Sujeito: ${scene.subjectMovement}\n`;
      block += `[PROMPT DE VÍDEO (KLING / RUNWAY / LUMA)]:\n${effectiveVideo}\n`;
      return block;
    }).join('\n----------------------------------------\n\n');
    await copyPromptText(allVideoText, 'all-video-prompts', 'Todos os Prompts de Vídeo');
  };

  const getSceneTypeBadge = (type: string) => {
    const norm = (type || '').toLowerCase();
    if (norm.includes('estabelecimento')) {
      return {
        label: 'Estabelecimento',
        badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-700/60',
        borderClass: 'border-l-4 border-l-sky-500',
        dotColor: 'bg-sky-500',
        description: 'Plano aberto que abre novo ambiente/contexto'
      };
    }
    if (norm.includes('ação') || norm.includes('acao')) {
      return {
        label: 'Ação',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60',
        borderClass: 'border-l-4 border-l-amber-500',
        dotColor: 'bg-amber-500',
        description: 'Movimento humano, evento ou transformação'
      };
    }
    if (norm.includes('reflexão') || norm.includes('reflexao') || norm.includes('close')) {
      return {
        label: 'Reflexão / Close',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700/60',
        borderClass: 'border-l-4 border-l-purple-500',
        dotColor: 'bg-purple-500',
        description: 'Close emocional e reflexão íntima'
      };
    }
    if (norm.includes('transição') || norm.includes('transicao')) {
      return {
        label: 'Transição',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60',
        borderClass: 'border-l-4 border-l-emerald-500',
        dotColor: 'bg-emerald-500',
        description: 'Luz mudando, sombras ou passagem de tempo'
      };
    }
    if (norm.includes('citação') || norm.includes('citacao') || norm.includes('visual')) {
      return {
        label: 'Citação Visual',
        badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-700/60',
        borderClass: 'border-l-4 border-l-yellow-500',
        dotColor: 'bg-yellow-500',
        description: 'Ilustração de termo original ou conceito abstrato'
      };
    }
    return {
      label: 'Cena',
      badgeClass: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700',
      borderClass: 'border-l-4 border-l-stone-400',
      dotColor: 'bg-stone-400',
      description: 'Cena narrativa'
    };
  };

  const getScriptStyleMeta = (script: any, idx: number) => {
    const rawId = (script?.styleId || '').toLowerCase();
    const rawTitle = (script?.title || script?.styleName || '').toLowerCase();

    let styleKey = 'cinematografico';
    if (rawId.includes('mentalidade') || rawTitle.includes('mentalidade') || idx === 0) {
      styleKey = 'mentalidade_forte';
    } else if (rawId.includes('descoberta') || rawTitle.includes('descoberta') || idx === 1) {
      styleKey = 'descoberta_voz_alta';
    }

    if (styleKey === 'mentalidade_forte') {
      return {
        badge: 'Estilo 1: Mentalidade Forte',
        subtag: 'Inspirado em Mayumi Kams',
        icon: Zap,
        badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60',
        cardBorder: 'border-l-4 border-l-amber-500',
        highlights: [
          'Reframe de autoridade logo na abertura ("não é X que muda sua vida, é Y")',
          'Dicotomia sobrevivência/estagnação vs. domínio próprio e maturidade',
          'Metáforas de negociação, estratégia e posicionamento',
          'Chamada final incisiva para autonomia e decisão imediata'
        ]
      };
    }

    if (styleKey === 'descoberta_voz_alta') {
      return {
        badge: 'Estilo 2: Descoberta em Voz Alta',
        subtag: 'Estilo NotebookLM Audio Overview (Voz Única)',
        icon: Sparkles,
        badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700/60',
        cardBorder: 'border-l-4 border-l-sky-500',
        highlights: [
          'Narrador pensa em voz alta e descobre conexões junto com quem ouve',
          'Autointerrupção e retomada orgânica de raciocínio',
          'Perguntas investigativas que ele mesmo responde',
          'Entusiasmo genuíno ao cruzar termo original com neurociência'
        ]
      };
    }

    return {
      badge: 'Estilo 3: Narrador Cinematográfico',
      subtag: 'Voz Única Contemplativa e Incisiva',
      icon: Film,
      badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700/60',
      cardBorder: 'border-l-4 border-l-purple-500',
      highlights: [
        'Abertura sensorial e visual concreta nos primeiros 5 segundos',
        'Cadência dramática com pausas e respiração reflexiva',
        'Alternância íntima e cúmplice entre "eu" e "você"',
        'Fechamento em convite reflexivo provocador diante de Deus (Coram Deo)'
      ]
    };
  };

  return (
    <div className={`${isDarkMode ? 'dark ' : ''}min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-stone-300 dark:selection:bg-stone-800 transition-colors duration-300`}>
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold tracking-tight text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <span className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 p-1 rounded-sm">
                <BookOpen className="w-5 h-5" />
              </span>
              Nexus S.A. <span className="font-medium text-stone-500 dark:text-stone-400 hidden sm:inline">— Central de Conteúdo</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
              </div>
              <button
                id="btn-new-project"
                onClick={handleNewProjectClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-full transition-colors shadow-sm"
                title="Criar novo projeto em branco"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Projeto</span>
              </button>
              <button
                id="btn-saved-projects"
                onClick={() => setShowProjectsModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors border border-stone-200 dark:border-stone-700 shadow-sm"
                title="Abrir e Gerenciar Projetos Salvos"
              >
                <FolderOpen className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                <span className="hidden sm:inline">Projetos Salvos</span>
                <span className="sm:hidden">Salvos</span>
                {savedProjects.length > 0 && (
                  <span className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {savedProjects.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleClearClick}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-full transition-colors border border-red-100 dark:border-red-900/50"
                title="Limpar Projeto Atual"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <nav className="flex space-x-1 overflow-x-auto pb-2 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100' 
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:border-stone-700'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Entrada */}
        {activeTab === 1 && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold mb-2 text-stone-900 dark:text-stone-100">Etapa 1: Qual é o tema?</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
                Insira a ideia central, dor ou princípio que você deseja transformar em conteúdo bíblico-estratégico.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Disciplina emocional sob pressão, por que perdoar liberta o cérebro..."
                  className="w-full h-32 p-4 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent outline-none transition-all resize-none bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
                <button
                  onClick={handleGeneratePassage}
                  disabled={!(theme || "").trim() || isLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <>Prosseguir para Passagem <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Passagem Bíblica & Fontes Acadêmicas */}
        {activeTab === 2 && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Box 1: Sistema de Busca de Fontes Acadêmicas e Bíblicas */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                    <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Pesquisa de Fontes Acadêmicas & Científicas
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Encontre estudos de neurociência, léxicos acadêmicos (BDAG/HALOT) e comentários exegéticos para citar no vídeo e aumentar a autoridade do canal.
                  </p>
                </div>
                {sources.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 self-start sm:self-auto">
                    {sources.length} fontes mapeadas
                  </span>
                )}
              </div>

              {/* Barra de Pesquisa e Filtros */}
              <div className="space-y-3 mb-5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={sourceSearchQuery}
                      onChange={(e) => setSourceSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchSources();
                      }}
                      placeholder="Ex: neuroplasticidade e renovação da mente, BDAG kardia, amígdala e medo..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSearchSources()}
                    disabled={isSearchingSources || isLoading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
                  >
                    {isSearchingSources ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar Fontes
                  </button>
                </div>

                {/* Filtros de Categoria */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-stone-500 mr-1">Filtrar por:</span>
                  {[
                    { id: 'all', label: 'Todas as Categorias' },
                    { id: 'neuroscience', label: '🧠 Neurociência & Cognição' },
                    { id: 'theological', label: '📖 Teologia Exegética' },
                    { id: 'lexicon', label: '🏛️ Léxicos Originais (BDAG/HALOT)' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSourceCategory(cat.id as any);
                        if (theme || passageResult) {
                          handleSearchSources(undefined, cat.id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                        sourceCategory === cat.id
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Atalhos Rápidos de Pesquisa */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-stone-500">
                  <span className="font-medium text-stone-400">Atalhos:</span>
                  <button
                    onClick={() => handleSearchSources('Estudos científicos de neurociência cognitiva, exegese bíblica e léxicos originais')}
                    className="text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted"
                  >
                    Recomendadas para o Tema
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handleSearchSources('neuroplasticidade, regulação da amígdala vs córtex pré-frontal e estresse crônico', 'neuroscience')}
                    className="text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted"
                  >
                    Neurociência & Decisão
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handleSearchSources('léxico grego BDAG hebraico HALOT significado anatômico e funcional', 'lexicon')}
                    className="text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted"
                  >
                    Léxicos BDAG/HALOT
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => handleSearchSources('comentários teológicos exegéticos acadêmicos Bruce Waltke Gordon Fee', 'theological')}
                    className="text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted"
                  >
                    Comentários Teológicos
                  </button>
                </div>
              </div>

              {/* Estado de Carregamento da Busca */}
              {isSearchingSources && (
                <div className="p-8 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Mapeando literatura acadêmica revisada por pares e léxicos originais...
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Cruzando periódicos científicos (Frontiers, PubMed), compêndios teológicos e léxicos BDAG/HALOT.
                  </p>
                </div>
              )}

              {/* Lista de Fontes Encontradas */}
              {!isSearchingSources && sources.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Fontes Acadêmicas & Bíblicas Identificadas:
                    </span>
                    <button
                      onClick={handleExpandPassageWithSources}
                      disabled={isExpandingWithSources}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isExpandingWithSources ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Integrar no Dossiê da Base Bíblica</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sources.map((s, idx) => {
                      const categoryColors = {
                        neuroscience: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
                        theological: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                        lexicon: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                        historical: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
                      }[s.category] || 'bg-stone-100 text-stone-800 border-stone-200';

                      const categoryLabel = {
                        neuroscience: '🧠 Neurociência',
                        theological: '📖 Teologia Exegética',
                        lexicon: '🏛️ Léxico Original',
                        historical: '📜 História / Filosofia',
                      }[s.category] || 'Fonte Acadêmica';

                      return (
                        <div
                          key={s.id || idx}
                          className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryColors}`}>
                                {categoryLabel}
                              </span>
                              {s.year && (
                                <span className="text-[11px] font-mono text-stone-500">
                                  {s.year}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mb-1">
                              {s.title}
                            </h4>

                            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2.5">
                              {s.authors} • <span className="italic">{s.publication}</span>
                            </p>

                            <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1.5 mb-3 bg-white dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200/70 dark:border-stone-800">
                              <p>
                                <strong className="text-stone-900 dark:text-stone-100">Achado: </strong>
                                {s.keyFindings}
                              </p>
                              <p>
                                <strong className="text-stone-900 dark:text-stone-100">Conexão Bíblica: </strong>
                                {s.biblicalConnection}
                              </p>
                            </div>
                          </div>

                          {/* Soundbite de Citação para o Vídeo */}
                          <div className="mt-auto pt-2 border-t border-stone-200/80 dark:border-stone-700/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                                <Quote className="w-3 h-3" /> Citação Pronta para o Vídeo:
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(s.citationScriptQuote)}
                                className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1"
                                title="Copiar citação"
                              >
                                <Copy className="w-3 h-3" /> Copiar
                              </button>
                            </div>
                            <p className="text-xs italic text-stone-800 dark:text-stone-200 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-100 dark:border-indigo-900/60 leading-relaxed font-sans">
                              "{s.citationScriptQuote}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                      <BookmarkPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Deseja incorporar automaticamente todas essas fontes e soundbites na base do seu roteiro?</span>
                    </div>
                    <button
                      onClick={handleExpandPassageWithSources}
                      disabled={isExpandingWithSources}
                      className="w-full sm:w-auto px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {isExpandingWithSources ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Expandir Dossiê Bíblico</span>
                    </button>
                  </div>
                </div>
              )}

              {!isSearchingSources && sources.length === 0 && (
                <div className="text-center py-6 px-4 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 text-stone-500 text-xs">
                  <Library className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                  <p className="font-medium text-stone-700 dark:text-stone-300">Nenhuma fonte acadêmica pesquisada ainda.</p>
                  <p className="mt-0.5">Clique em "Buscar Fontes" ou escolha um dos atalhos acima para mapear evidências que elevam a autoridade do canal.</p>
                </div>
              )}
            </div>

            {/* Box 2: Dossiê de Base Bíblica & Exegese */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                    <BookOpen className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    Dossiê de Base Bíblica & Filológica
                  </h3>
                  <p className="text-stone-500 text-sm mt-0.5">
                    Fundamentação textual que servirá de alicerce para os 3 roteiros na Etapa 3.
                  </p>
                </div>
                {passageResult && (
                  <button
                    onClick={() => copyToClipboard(passageResult)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Dossiê'}
                  </button>
                )}
              </div>
              
              {isLoading || isExpandingWithSources ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-900 dark:text-stone-100" />
                  <p className="font-medium text-stone-800 dark:text-stone-200">
                    {isExpandingWithSources 
                      ? 'Integrando fontes científicas, léxicos originais e teologia ao dossiê...' 
                      : 'Mapeando passagens e estruturando exegese filológica...'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Isso levará apenas alguns segundos.</p>
                </div>
              ) : passageResult ? (
                <div className="space-y-6">
                  <div className="prose prose-stone dark:prose-invert max-w-none">
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-6 rounded-lg border border-stone-200 dark:border-stone-800 whitespace-pre-wrap text-sm leading-relaxed font-sans text-stone-800 dark:text-stone-200">
                      {passageResult}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => handleSearchSources('Estudos científicos de neurociência e léxicos originais')}
                      disabled={isSearchingSources}
                      className="w-full sm:w-auto px-4 py-2 border border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Pesquisar Mais Fontes Acadêmicas
                    </button>

                    <button
                      onClick={() => setActiveTab(3)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                    >
                      Avançar para Roteiros <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-stone-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p>Nenhuma passagem gerada ainda. Volte para a Etapa 1 e insira um tema.</p>
                  <button
                    onClick={() => setActiveTab(1)}
                    className="mt-4 text-stone-900 dark:text-stone-100 font-medium hover:underline"
                  >
                    Voltar para Entrada
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Roteiros */}
        {activeTab === 3 && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                    Etapa 3: Roteiros Estratégicos (Voz Única)
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Geração de 3 estilos de voz e personalidade distintos, mantendo em todos o rigor teológico e a neurociência aplicada.
                  </p>
                </div>
              </div>

              {!passageResult ? (
                <div className="text-center py-12 text-stone-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p>Você precisa concluir a Etapa 2 primeiro.</p>
                  <button
                    onClick={() => setActiveTab(2)}
                    className="mt-4 text-stone-900 font-medium hover:underline"
                  >
                    Voltar para Base Bíblica
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {!scriptsResult && !isGeneratingScripts && (
                    <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                      <div className="mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-2">
                          Estilos de Personalidade Gerados (Voz Única):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3.5 bg-white dark:bg-stone-800 rounded-lg border border-amber-200 dark:border-amber-900/60 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>1. Mentalidade Forte</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              Inspirado em Mayumi Kams. Reframe imediato ("não é X, é Y"), dicotomia sobrevivência vs. domínio e metáforas de negociação.
                            </p>
                          </div>

                          <div className="p-3.5 bg-white dark:bg-stone-800 rounded-lg border border-sky-200 dark:border-sky-900/60 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-200 mb-1">
                              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                              <span>2. Descoberta em Voz Alta</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              Estilo NotebookLM Audio Overview (narrador único). Pensa em voz alta, autointerrupção, perguntas investigativas e entusiasmo genuíno.
                            </p>
                          </div>

                          <div className="p-3.5 bg-white dark:bg-stone-800 rounded-lg border border-purple-200 dark:border-purple-900/60 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                              <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span>3. Narrador Cinematográfico</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              Abertura sensorial concreta nos primeiros 5s, cadência com respiração, alternância íntima "eu"/"você" e convite reflexivo Coram Deo.
                            </p>
                          </div>
                        </div>
                      </div>

                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                        Duração desejada para os roteiros:
                      </label>
                      <div className="flex flex-wrap gap-2.5 mb-2">
                        {[5, 7, 10, 15, 20].map(duration => (
                          <button
                            key={duration}
                            onClick={() => setSelectedDuration(duration)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                              selectedDuration === duration
                                ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                            }`}
                          >
                            {duration} minutos {duration === 15 && '⭐'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mb-6">
                        Benchmark de locução (145 pal/min): <strong>5 min</strong> = ~725 palavras • <strong>10 min</strong> = ~1.450 palavras • <strong>15 min</strong> = ~2.175 palavras (Recomendado para autoridade máxima) • <strong>20 min</strong> = ~2.900 palavras.
                      </p>
                      <button
                        onClick={handleGenerateScripts}
                        className="px-6 py-2.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <PenTool className="w-4 h-4" /> Gerar 3 Roteiros com Estilos de Voz ({selectedDuration} min)
                      </button>
                      {errorScript && <p className="text-red-600 mt-4 text-sm">{errorScript}</p>}
                    </div>
                  )}

                  {isGeneratingScripts && (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-500">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-900" />
                      <p className="font-medium text-stone-800 dark:text-stone-200 mb-1">
                        Gerando 3 Roteiros em Estilos de Voz Distintos...
                      </p>
                      <p className="text-xs text-stone-500">
                        Aplicando Mentalidade Forte, Descoberta em Voz Alta e Narrador Cinematográfico para {selectedDuration} minutos (~{selectedDuration * 145} palavras).
                      </p>
                    </div>
                  )}

                  {scriptsResult && !isGeneratingScripts && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        {scriptsResult.map((script, idx) => {
                          const meta = getScriptStyleMeta(script, idx);
                          const IconComp = meta.icon;
                          const contentText = typeof script === 'string' 
                            ? script 
                            : (script?.content || script?.text || script?.body || script?.description || '');
                          const stats = getScriptStats(contentText);
                          const targetWords = selectedDuration * 145;
                          const isUnder = stats.words < targetWords * 0.8;

                          return (
                            <div 
                              key={idx} 
                              className={`bg-stone-50 dark:bg-stone-900/40 p-6 rounded-xl border border-stone-200 dark:border-stone-800 ${meta.cardBorder} shadow-xs transition-all`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.badgeStyle}`}>
                                    <IconComp className="w-3.5 h-3.5" />
                                    {meta.badge}
                                  </span>
                                  <span className="text-xs text-stone-500 font-medium">
                                    • {meta.subtag}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-700 dark:text-stone-300 bg-stone-200/80 dark:bg-stone-800 px-2.5 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-stone-500" />
                                    ~{stats.minutes}m {stats.seconds}s ({stats.words} palavras)
                                  </span>
                                  {script?.primaryKeyword && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-800 px-2.5 py-0.5 rounded-md">
                                      <Tag className="w-3 h-3" /> SEO: {script.primaryKeyword}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1.5">
                                {script.title || meta.badge}
                              </h3>
                              <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm mb-3 leading-relaxed">
                                {script.description}
                              </p>

                              {/* Highlights do estilo */}
                              <div className="bg-white/80 dark:bg-stone-800/80 p-3 rounded-lg border border-stone-200/60 dark:border-stone-700/60 mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                                  Características desta Personalidade:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {meta.highlights.map((hl, hIdx) => (
                                    <div key={hIdx} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-stone-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500 shrink-0" />
                                      <span>{hl}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Conteúdo do roteiro com Tooltips Léxicos BDAG/HALOT */}
                              <LexiconScriptViewer
                                scriptText={contentText}
                                sources={sources}
                                onOpenSidebar={(entry) => {
                                  setSelectedScript(contentText);
                                  setSelectedLexiconTermId(entry.id);
                                  setIsLexiconSidebarOpen(true);
                                  setActiveTab(3.5);
                                }}
                                onToast={showToast}
                                className="max-h-72 mb-4"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(contentText)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
                                  >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? 'Copiado!' : 'Copiar este Roteiro'}</span>
                                  </button>
                                  {isUnder && (
                                    <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Base condensada — Expansível para {selectedDuration} min na Etapa 3.5
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedScript(contentText);
                                    setActiveTab(3.5);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                                >
                                  <span>Escolher este e Otimizar (Etapa 3.5)</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => setScriptsResult(null)}
                          className="px-4 py-2 text-stone-600 font-medium hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                        >
                          Gerar Novamente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3.5: Roteiro Final */}
        {activeTab === 3.5 && (
          <div className={`${isLexiconSidebarOpen ? 'max-w-7xl' : 'max-w-4xl'} transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}>
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Etapa 3.5: Roteiro Final</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Refine, edite ou use a IA para expandir e atingir a duração exata desejada.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsLexiconSidebarOpen(!isLexiconSidebarOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                      isLexiconSidebarOpen
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-xs'
                        : 'text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700'
                    }`}
                    title="Abrir painel lateral de léxicos bíblicos (BDAG e HALOT)"
                  >
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Léxicos BDAG/HALOT</span>
                    {detectedLexiconTerms.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                        {detectedLexiconTerms.length}
                      </span>
                    )}
                  </button>
                  {scriptHistory.length > 0 && (
                    <button
                      onClick={handleUndo}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-md transition-colors"
                      title="Desfazer última alteração (IA ou manual)"
                    >
                      <Undo2 className="w-4 h-4" /> Desfazer
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(selectedScript)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-md transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Roteiro'}
                  </button>
                </div>
              </div>

              {!selectedScript ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <FileEdit className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                  <p>Nenhum roteiro selecionado.</p>
                  <button
                    onClick={() => setActiveTab(3)}
                    className="mt-4 text-stone-900 dark:text-stone-100 font-medium hover:underline"
                  >
                    Voltar para Roteiros
                  </button>
                </div>
              ) : (() => {
                const stats = getScriptStats(selectedScript);
                const targetWords = selectedDuration * 145;
                const progressPct = Math.min(100, Math.round((stats.words / targetWords) * 100));
                const isUnderDuration = stats.words < targetWords * 0.85;

                return (
                  <div className="space-y-5">
                    {/* Medidor de Duração e Contagem de Palavras */}
                    <div className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                            Medidor de Locução:
                          </span>
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 font-mono">
                            ~{stats.minutes}m {stats.seconds}s ({stats.words.toLocaleString()} palavras)
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          Meta selecionada: <strong className="text-stone-800 dark:text-stone-200">{selectedDuration} minutos</strong> (~{targetWords.toLocaleString()} palavras a 145 pal/min)
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden mb-1.5">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progressPct >= 90
                              ? 'bg-emerald-600'
                              : progressPct >= 65
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>Progresso da meta de tempo: {progressPct}%</span>
                        <span>{stats.words} / {targetWords} palavras</span>
                      </div>
                    </div>

                    {/* Banner de Aviso e Ação de Expansão para a Duração Total */}
                    {isUnderDuration && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Roteiro com ~{stats.minutes}m {stats.seconds}s — Abaixo da meta de {selectedDuration} minutos</span>
                          </div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            O roteiro possui {stats.words} palavras. Para preencher os {selectedDuration} minutos com alta autoridade, são necessárias aproximadamente {targetWords} palavras faladas com parágrafos desenvolvidos e citações nominais.
                          </p>
                        </div>
                        <button
                          onClick={() => handleExpandToFullDuration()}
                          disabled={isElaboratingScript}
                          className="w-full sm:w-auto px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {isElaboratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span>Expandir para {selectedDuration} min completos (~{targetWords} pal)</span>
                        </button>
                      </div>
                    )}

                    {/* Barra de Ferramentas: Modo Leitura com Tooltips BDAG/HALOT vs Editor de Texto */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-stone-50 dark:bg-stone-800/90 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 dark:text-stone-400 font-medium px-1">Visualização:</span>
                        <button
                          type="button"
                          onClick={() => setScriptViewMode('reading')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                            scriptViewMode === 'reading'
                              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs font-semibold'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Modo Leitura com Tooltips</span>
                          {detectedLexiconTerms.length > 0 && (
                            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold">
                              {detectedLexiconTerms.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setScriptViewMode('editor')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                            scriptViewMode === 'editor'
                              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs font-semibold'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          <FileEdit className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                          <span>Editor de Texto</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {scriptViewMode === 'reading' && (
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Passe o mouse sobre os termos sublinhados para ver BDAG / HALOT
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsLexiconSidebarOpen(!isLexiconSidebarOpen)}
                          className="text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 text-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isLexiconSidebarOpen ? 'Fechar Painel Lateral' : 'Abrir Painel Lateral'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Grade Principal: Roteiro + Painel Lateral de Léxicos */}
                    <div className={`grid grid-cols-1 ${isLexiconSidebarOpen ? 'lg:grid-cols-12' : ''} gap-5 items-start`}>
                      <div className={`${isLexiconSidebarOpen ? 'lg:col-span-7 xl:col-span-8' : 'w-full'}`}>
                        {scriptViewMode === 'reading' ? (
                          <LexiconScriptViewer
                            scriptText={selectedScript}
                            sources={sources}
                            onOpenSidebar={(entry) => {
                              setSelectedLexiconTermId(entry.id);
                              setIsLexiconSidebarOpen(true);
                            }}
                            onToast={showToast}
                            className="h-[520px]"
                          />
                        ) : (
                          <textarea
                            value={selectedScript}
                            onFocus={() => setFocusScriptVal(selectedScript)}
                            onBlur={() => {
                              if (focusScriptVal !== selectedScript && focusScriptVal !== '') {
                                setScriptHistory((prev) => [focusScriptVal, ...prev].slice(0, 3));
                              }
                            }}
                            onChange={(e) => setSelectedScript(e.target.value)}
                            className="w-full h-[520px] p-4 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent outline-none transition-all resize-none font-mono text-sm leading-relaxed bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 selection:bg-stone-200 dark:selection:bg-stone-800"
                            placeholder="Seu roteiro final..."
                          />
                        )}
                      </div>

                      {/* Painel Lateral Docked */}
                      {isLexiconSidebarOpen && (
                        <div className="lg:col-span-5 xl:col-span-4 h-[520px]">
                          <LexiconSidebarPanel
                            scriptText={selectedScript}
                            sources={sources}
                            isOpen={true}
                            onClose={() => setIsLexiconSidebarOpen(false)}
                            onSelectTerm={(entry) => setSelectedLexiconTermId(entry.id)}
                            selectedTermId={selectedLexiconTermId}
                            onToast={showToast}
                            onInsertIntoScript={(snippet) => {
                              setSelectedScript((prev) => prev ? `${prev}\n\n${snippet}` : snippet);
                              showToast('Termo inserido no roteiro!');
                            }}
                            isDocked={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Bloco de Otimização e Expansão por IA */}
                    <div className="bg-stone-50 dark:bg-stone-800/70 p-4 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-200">
                          Otimização & Expansão por IA
                        </label>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Duração alvo: {selectedDuration} min
                        </span>
                      </div>

                      {/* Chips de comandos rápidos */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setScriptInstructions(`Expandir para ${selectedDuration} minutos completos (~${targetWords} palavras faladas), adicionando parágrafos densos, quebra de objeções e timestamps detalhados.`);
                          }}
                          className="px-2.5 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          + Expandir para {selectedDuration} min completos
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScriptInstructions('Citar nominalmente os estudos acadêmicos de neurociência e os léxicos BDAG/HALOT da base bíblica para aumentar a autoridade do canal.');
                          }}
                          className="px-2.5 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <GraduationCap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          + Citar estudos e fontes acadêmicas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScriptInstructions('Criar diálogos internos provocativos e analogias práticas do cotidiano para reter a atenção do espectador.');
                          }}
                          className="px-2.5 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          + Diálogos internos & analogias
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={scriptInstructions}
                            onChange={(e) => setScriptInstructions(e.target.value)}
                            placeholder="Ex: Expandir para os 15 min completos, citando estudos científicos..."
                            className="flex-1 p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 outline-none text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                          />
                          <button
                            onClick={handleElaborateScript}
                            disabled={isElaboratingScript}
                            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-xs"
                          >
                            {isElaboratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Elaborar / Expandir
                          </button>
                        </div>
                        
                        <div className="hidden sm:block w-px bg-stone-300 dark:bg-stone-700"></div>
                        
                        <button
                          onClick={handleCleanForTTS}
                          disabled={isCleaningTTS}
                          className="px-4 py-2.5 bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
                          title="Limpa formatação, rubricas e timestamps, deixando apenas o texto falado para colocar em IAs geradoras de voz."
                        >
                          {isCleaningTTS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                          Preparar para Voz (TTS)
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => setActiveTab(4)}
                        className="px-6 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-2 shadow-xs"
                      >
                        Avançar para Imagens <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Tab 4: Imagens */}
        {activeTab === 4 && (
          <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 mb-8">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Etapa 4: Storyboard & Geração de Imagens</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 mb-6">Insira o roteiro final (ou trecho escolhido) para desmembrar em cenas visuais e gerar assets no Imagen.</p>
              
              {!scriptsResult && !selectedScript ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <LayoutTemplate className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                  <p>Você precisa de um roteiro. Volte para a Etapa 3 ou cole um abaixo.</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-200">Estilo Fotográfico / Cinematográfico:</label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="p-3 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent outline-none bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 max-w-sm text-sm"
                  >
                    <option value="Fotográfico Editorial 35mm (Kodak Portra)">Fotográfico Editorial 35mm (Kodak Portra 400)</option>
                    <option value="Cinematográfico A24 (Luz Natural & Chiaroscuro)">Cinematográfico A24 (Luz Natural & Chiaroscuro)</option>
                    <option value="Documentário Histórico / Leica M (Fotojornalismo)">Documentário Histórico / Leica M (Fotojornalismo)</option>
                    <option value="Retrato Editorial Intimista (85mm Bokeh F/1.8)">Retrato Editorial Intimista (85mm Bokeh F/1.8)</option>
                  </select>
                </div>

                <textarea
                  value={selectedScript}
                  onChange={(e) => setSelectedScript(e.target.value)}
                  placeholder="Cole aqui o roteiro escolhido da Etapa 3..."
                  className="w-full h-48 p-4 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400 focus:border-transparent outline-none transition-all resize-none font-mono text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={!(selectedScript || "").trim() || isGeneratingStoryboard}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGeneratingStoryboard ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {storyboardStatus || 'Analisando...'}</>
                  ) : (
                    <><ImageIcon className="w-4 h-4" /> Decupar Storyboard (Cenas de 6-8s)</>
                  )}
                </button>
              </div>
            </div>

            {/* Ficha de Direção de Arte & Consistência Visual */}
            <div className="mb-8">
              <ArtDirectionSheetCard
                artDirectionSheet={artDirectionSheet}
                isGenerating={isGeneratingArtDirection}
                onGenerateArtDirection={handleGenerateArtDirection}
                onUpdateArtDirection={(sheet) => {
                  setArtDirectionSheet(sheet);
                  showToast('Ficha de Direção de Arte atualizada!');
                }}
                hasScript={Boolean((selectedScript || "").trim() || theme)}
              />
            </div>

            {storyboard.length > 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
                        Cenas Decupadas (6 a 8s cada)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        {storyboard.length} cenas
                      </span>
                      {(() => {
                        const totalSecs = storyboard.reduce((acc, sc) => acc + (sc.durationSeconds || 7), 0);
                        const mins = Math.floor(totalSecs / 60);
                        const secs = totalSecs % 60;
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Duração: ~{mins}m {secs > 0 ? `${secs}s` : ''}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Enquadramentos e iluminação diversificados por cena, ancorados na Ficha de Direção de Arte.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyAllImagePrompts(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs"
                      title="Copiar todos os prompts de imagem do storyboard de uma vez"
                    >
                      {copiedPromptKey === 'all-storyboard-prompts' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Prompts Copiados!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Prompts</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={copyAllVideoPrompts}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors shadow-2xs"
                      title="Copiar todos os prompts de vídeo/animação para Kling, Runway ou Luma"
                    >
                      {copiedPromptKey === 'all-video-prompts' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Vídeos Copiados!</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Copiar Vídeos</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyAllImagePrompts(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs"
                      title="Copiar prompts com negativos"
                    >
                      {copiedPromptKey === 'all-prompts-full' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Tudo Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Prompts + Negativos</span>
                        </>
                      )}
                    </button>

                    <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
                      <button
                        onClick={() => setStoryboardViewMode('list')}
                        className={`p-1.5 rounded-md transition-colors ${storyboardViewMode === 'list' ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                        title="Visualização em Lista Detalhada (Cinematográfica)"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStoryboardViewMode('gallery')}
                        className={`p-1.5 rounded-md transition-colors ${storyboardViewMode === 'gallery' ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                        title="Visualização em Grade de Cenas"
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setActiveTab(5)}
                      className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <span>Avançar para SEO</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter and Search Sub-bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-stone-500 font-medium mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Filtrar:
                    </span>
                    {[
                      { key: 'all', label: 'Todas', count: storyboard.length },
                      { key: 'estabelecimento', label: 'Estabelecimento', count: storyboard.filter(s => String(s.sceneType).toLowerCase().includes('estabelecimento')).length },
                      { key: 'ação', label: 'Ação', count: storyboard.filter(s => String(s.sceneType).toLowerCase().includes('ação') || String(s.sceneType).toLowerCase().includes('acao')).length },
                      { key: 'reflexão', label: 'Reflexão / Close', count: storyboard.filter(s => String(s.sceneType).toLowerCase().includes('reflexão') || String(s.sceneType).toLowerCase().includes('reflexao') || String(s.sceneType).toLowerCase().includes('close')).length },
                      { key: 'transição', label: 'Transição', count: storyboard.filter(s => String(s.sceneType).toLowerCase().includes('transição') || String(s.sceneType).toLowerCase().includes('transicao')).length },
                      { key: 'citação', label: 'Citação Visual', count: storyboard.filter(s => String(s.sceneType).toLowerCase().includes('citação') || String(s.sceneType).toLowerCase().includes('citacao')).length }
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setStoryboardFilter(f.key)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
                          storyboardFilter === f.key
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="text-[10px] opacity-75 font-mono">({f.count})</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={storyboardSearch}
                      onChange={(e) => setStoryboardSearch(e.target.value)}
                      placeholder="Buscar fala, prompt ou lente..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-1 focus:ring-stone-400"
                    />
                    {storyboardSearch && (
                      <button 
                        onClick={() => setStoryboardSearch('')} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {(() => {
                  const filtered = storyboard.filter((scene) => {
                    const matchesFilter = storyboardFilter === 'all' || 
                      String(scene.sceneType || '').toLowerCase().includes(storyboardFilter.toLowerCase());
                    const matchesSearch = !storyboardSearch.trim() || 
                      (scene.textSnippet && scene.textSnippet.toLowerCase().includes(storyboardSearch.toLowerCase())) ||
                      (scene.description && scene.description.toLowerCase().includes(storyboardSearch.toLowerCase())) ||
                      (scene.imagePrompt && scene.imagePrompt.toLowerCase().includes(storyboardSearch.toLowerCase())) ||
                      (scene.videoPrompt && scene.videoPrompt.toLowerCase().includes(storyboardSearch.toLowerCase()));
                    return matchesFilter && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500">
                        <p className="text-sm font-medium">Nenhuma cena encontrada com os filtros atuais.</p>
                        <button
                          onClick={() => { setStoryboardFilter('all'); setStoryboardSearch(''); }}
                          className="mt-2 text-xs text-amber-600 dark:text-amber-400 underline font-medium"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    );
                  }

                  return storyboardViewMode === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filtered.map((scene) => {
                        const originalIndex = storyboard.indexOf(scene);
                        return (
                          <StoryboardSceneCard
                            key={originalIndex}
                            scene={scene}
                            index={originalIndex}
                            imageState={sceneImages[originalIndex]}
                            copiedKey={copiedPromptKey}
                            onCopyText={copyPromptText}
                            onGenerateImage={handleGenerateImage}
                            onDownloadImage={handleDownloadImage}
                            onOpenFullscreen={(idx) => setFullscreenImageIndex(idx)}
                            onRegeneratePrompt={handleRegenerateScenePrompt}
                            onRegenerateVideoPrompt={handleRegenerateVideoPrompt}
                            onUpdateScene={handleUpdateScene}
                            isRegeneratingPrompt={regeneratingSceneIndex === originalIndex}
                            isRegeneratingVideo={regeneratingVideoIndex === originalIndex}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filtered.map((scene) => {
                        const index = storyboard.indexOf(scene);
                        const imgState = sceneImages[index];
                        const promptKey = `gallery-prompt-${index}`;
                        const videoPromptKey = `gallery-video-${index}`;
                        const negKey = `gallery-negative-${index}`;
                        const tagBadge = getSceneTypeBadge(scene.sceneType);
                        const effectiveVideo = scene.videoPrompt || (
                          scene.cameraMovement 
                            ? `${scene.cameraMovement}, ${scene.subjectMovement || 'subtle motion'}, 4k resolution, continuous 7-second motion, image-to-video`
                            : 'Slow cinematic dolly-in with subtle subject motion, continuous 7-second motion, image-to-video'
                        );
                        return (
                          <div key={index} className="relative group rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-video border border-stone-200 dark:border-stone-700">
                            {imgState?.url ? (
                              <>
                                <img src={imgState.url} alt={`Cena ${scene.scene || index + 1}`} className="w-full h-full object-cover cursor-pointer" referrerPolicy="no-referrer" onClick={() => setFullscreenImageIndex(index)} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none"></div>
                                
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPromptText(scene.imagePrompt, promptKey, `Prompt da Cena ${scene.scene || index + 1}`);
                                    }}
                                    className="bg-black/75 hover:bg-black text-white p-1.5 rounded flex items-center justify-center backdrop-blur-sm"
                                    title="Copiar Prompt de Imagem"
                                  >
                                    {copiedPromptKey === promptKey ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPromptText(effectiveVideo, videoPromptKey, `Prompt de Vídeo da Cena ${scene.scene || index + 1}`);
                                    }}
                                    className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 p-1.5 rounded flex items-center justify-center backdrop-blur-sm border border-purple-500/30"
                                    title="Copiar Prompt de Vídeo (Kling / Runway / Luma)"
                                  >
                                    {copiedPromptKey === videoPromptKey ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Film className="w-3.5 h-3.5 text-purple-300" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPromptText(scene.negativePrompt, negKey, `Prompt Negativo da Cena ${scene.scene || index + 1}`);
                                    }}
                                    className="bg-black/75 hover:bg-black text-white p-1.5 rounded flex items-center justify-center backdrop-blur-sm"
                                    title="Copiar Prompt Negativo"
                                  >
                                    {copiedPromptKey === negKey ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadImage(imgState.url!, scene.scene || index + 1)}
                                    className="bg-black/75 hover:bg-black text-white p-1.5 rounded flex items-center justify-center backdrop-blur-sm"
                                    title="Baixar Imagem"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateImage(index, scene.imagePrompt)}
                                    className="bg-black/75 hover:bg-black text-white p-1.5 rounded flex items-center justify-center backdrop-blur-sm"
                                    title="Regenerar"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  {scene.textSnippet && (
                                    <p className="text-white font-bold text-xs mb-1 line-clamp-1">"{scene.textSnippet}"</p>
                                  )}
                                  <p className="text-white/80 text-[10px] line-clamp-2">{scene.description}</p>
                                </div>

                                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                                  <span className="px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded shadow-sm backdrop-blur-sm">
                                    Cena {scene.scene || index + 1} ({scene.timecode || '6-8s'})
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center border-dashed border-2 border-transparent hover:border-stone-300 dark:hover:border-stone-600 transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-stone-700 dark:text-stone-300 font-bold text-xs">Cena {scene.scene || index + 1}</span>
                                  <span className="text-[10px] text-stone-500 font-mono">({scene.timecode || '7s'})</span>
                                </div>
                                <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-2 truncate max-w-[90%]">
                                  {tagBadge.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateImage(index, scene.imagePrompt)}
                                  disabled={imgState?.loading}
                                  className="w-full py-2 px-3 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-750 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-xs"
                                >
                                  {imgState?.loading ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> <span className="text-[11px]">Gerando...</span></>
                                  ) : (
                                    <><ImageIcon className="w-3.5 h-3.5 text-amber-600" /> <span className="text-[11px]">Gerar Imagem</span></>
                                  )}
                                </button>
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => copyPromptText(scene.imagePrompt, promptKey, `Prompt da Cena ${scene.scene || index + 1}`)}
                                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-0.5 transition-colors"
                                    title="Copiar prompt da cena"
                                  >
                                    {copiedPromptKey === promptKey ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Imagem</span>
                                  </button>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => copyPromptText(effectiveVideo, videoPromptKey, `Prompt de Vídeo da Cena ${scene.scene || index + 1}`)}
                                    className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 flex items-center gap-0.5 transition-colors"
                                    title="Copiar prompt de vídeo para Kling/Runway"
                                  >
                                    {copiedPromptKey === videoPromptKey ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Film className="w-3 h-3" />
                                    )}
                                    <span>Vídeo</span>
                                  </button>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRegenerateScenePrompt(index)}
                                    disabled={regeneratingSceneIndex === index}
                                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-0.5 transition-colors disabled:opacity-50"
                                    title="Regenerar variação de ângulo/luz"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${regeneratingSceneIndex === index ? 'animate-spin' : ''}`} />
                                    <span>Variação</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Trilha Sonora com IA ao final da Etapa 4 */}
            <SoundtrackPromptsSection
              soundtrackPrompts={soundtrackPrompts}
              isGenerating={isGeneratingSoundtrack}
              onGenerate={handleGenerateSoundtrack}
              selectedDuration={selectedDuration}
              theme={theme}
              hasScript={Boolean(selectedScript?.trim())}
              onAdvanceToNext={() => setActiveTab(5)}
              isStandaloneTab={false}
            />
          </div>
        )}

        {/* Tab 4.5: Trilha Sonora com IA (Suno, Flow Music) */}
        {activeTab === 4.5 && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <SoundtrackPromptsSection
                soundtrackPrompts={soundtrackPrompts}
                isGenerating={isGeneratingSoundtrack}
                onGenerate={handleGenerateSoundtrack}
                selectedDuration={selectedDuration}
                theme={theme}
                hasScript={Boolean(selectedScript?.trim())}
                onAdvanceToNext={() => setActiveTab(5)}
                isStandaloneTab={true}
              />
            </div>
          </div>
        )}

        {/* Tab 5: SEO */}
        {activeTab === 5 && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Etapa 5: Otimização (SEO)</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Geração de Títulos, Descrições e Tags para diferentes plataformas.</p>
                </div>
                {seoResult && (
                  <button
                    onClick={() => copyToClipboard(seoResult)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-md transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Resultado'}
                  </button>
                )}
              </div>

              {!selectedScript ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <Search className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                  <p>Você precisa de um roteiro. Volte para a Etapa 4 para definir o roteiro final.</p>
                  <button
                    onClick={() => setActiveTab(4)}
                    className="mt-4 text-stone-900 dark:text-stone-100 font-medium hover:underline"
                  >
                    Voltar para Imagens
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {!seoResult && !isGeneratingSeo && (
                    <div className="bg-stone-50 dark:bg-stone-800/60 p-6 rounded-lg border border-stone-200 dark:border-stone-700 flex flex-col items-center text-center">
                      <p className="text-stone-600 dark:text-stone-300 mb-6">
                        O app irá gerar alternativas de SEO (YouTube, Shorts/Reels e Blog) com base no seu roteiro atual.
                      </p>
                      <button
                        onClick={handleGenerateSeo}
                        className="px-6 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" /> Gerar SEO Completo
                      </button>
                    </div>
                  )}

                  {isGeneratingSeo && (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-500 dark:text-stone-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-900 dark:text-stone-100" />
                      <p className="font-medium text-stone-900 dark:text-stone-100">{seoStatus || 'Otimizando palavras-chave e estruturando metadados para as plataformas...'}</p>
                    </div>
                  )}

                  {seoResult && !isGeneratingSeo && (
                    <div className="space-y-6">
                      <div className="prose prose-stone dark:prose-invert max-w-none">
                        <div className="bg-stone-50 dark:bg-stone-800/60 p-6 rounded-lg border border-stone-200 dark:border-stone-700 whitespace-pre-wrap text-stone-800 dark:text-stone-100 font-mono text-sm leading-relaxed">
                          {seoResult}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => setSeoResult('')}
                          className="px-4 py-2 text-stone-600 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                        >
                          Gerar Novamente
                        </button>
                        <button
                          onClick={() => setActiveTab(6)}
                          className="px-6 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-2"
                        >
                          Avançar para Artigo <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Artigo */}
        {activeTab === 6 && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Etapa 6: Artigo para o Blog</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Expansão do conteúdo para formato longo de leitura (1200-2000 palavras).</p>
                </div>
                {articleResult && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsCitationConsistencyModalOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors border shadow-2xs ${
                        articleConsistencyReport.consistencyScore === 100
                          ? 'text-emerald-950 dark:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30'
                          : articleConsistencyReport.consistencyScore >= 70
                          ? 'text-amber-950 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30'
                          : 'text-rose-950 dark:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30'
                      }`}
                      title="Auditar se todas as fontes da bibliografia foram citadas no corpo do artigo"
                    >
                      {articleConsistencyReport.consistencyScore === 100 ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>
                        Verificador de Citações ({articleConsistencyReport.citedCount}/{articleConsistencyReport.totalReferences})
                      </span>
                    </button>
                    <button
                      onClick={() => setIsArticleExportModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-md transition-colors shadow-2xs"
                      title="Exportar o artigo completo com a bibliografia formatada nas normas da APA (7ª Edição)"
                    >
                      <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Exportar Artigo + APA</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(articleResult)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-md transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar Artigo'}
                    </button>
                  </div>
                )}
              </div>

              {!selectedScript || !passageResult ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                  <p>Você precisa de um roteiro e de uma passagem bíblica base definidos.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {!articleResult && !isGeneratingArticle && (
                    <div className="space-y-6">
                      <div className="bg-stone-50 dark:bg-stone-800/60 p-6 rounded-lg border border-stone-200 dark:border-stone-700 flex flex-col items-center text-center">
                        <p className="text-stone-600 dark:text-stone-300 mb-6 max-w-lg">
                          O app irá combinar a passagem bíblica inicial e o roteiro escolhido para redigir um artigo aprofundado, incluindo citações originais e referências bibliográficas.
                        </p>
                        <button
                          onClick={handleGenerateArticle}
                          className="px-6 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> Escrever Artigo Longo
                        </button>
                      </div>

                      {/* Seção de Referências Preparadas para a Elaboração do Artigo */}
                      <ArticleReferencesSection
                        sources={sources}
                        articleText=""
                        passageText={passageResult}
                        theme={theme}
                        isDarkMode={isDarkMode}
                        onToast={showToast}
                        onAddSource={(newSource) => setSources(prev => [...prev, newSource])}
                        onUpdateArticleText={(newText) => setArticleResult(newText)}
                      />
                    </div>
                  )}

                  {isGeneratingArticle && (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-500 dark:text-stone-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-900 dark:text-stone-100" />
                      <p className="font-medium text-stone-900 dark:text-stone-100">{articleStatus || 'Redigindo artigo com densidade conceitual, exegese e referências...'}</p>
                    </div>
                  )}

                  {articleResult && !isGeneratingArticle && (
                    <div className="space-y-6">
                      {/* Gráfico de Barras Recharts: Distribuição de Tópicos, Nível de Complexidade e Foco Bíblico */}
                      <ArticleAnalyticsChart
                        articleText={articleResult}
                        theme={theme}
                        isDarkMode={isDarkMode}
                      />

                      <div className="prose prose-stone dark:prose-invert max-w-none">
                        <div className="bg-stone-50 dark:bg-stone-800/60 p-6 rounded-lg border border-stone-200 dark:border-stone-700 whitespace-pre-wrap text-stone-800 dark:text-stone-100 leading-relaxed font-sans">
                          {articleResult}
                        </div>
                      </div>

                      {/* Seção de Referências Bibliográficas & Acadêmicas Utilizadas */}
                      <ArticleReferencesSection
                        sources={sources}
                        articleText={articleResult}
                        passageText={passageResult}
                        theme={theme}
                        isDarkMode={isDarkMode}
                        onToast={showToast}
                        onAddSource={(newSource) => setSources(prev => [...prev, newSource])}
                        onUpdateArticleText={(newText) => setArticleResult(newText)}
                      />

                      <div className="flex items-center justify-start pt-4 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => setArticleResult('')}
                          className="px-4 py-2 text-stone-600 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                        >
                          Gerar Novamente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {fullscreenImageIndex !== null && storyboard[fullscreenImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenImageIndex(null)} 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
            title="Fechar (Esc)"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
            {fullscreenImageIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(prev => prev! - 1); }}
                className="absolute left-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                title="Cena Anterior"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img 
              src={sceneImages[fullscreenImageIndex]?.url} 
              alt={`Cena ${fullscreenImageIndex + 1}`} 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-4xl px-4 text-center">
              <div className="bg-black/85 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/15 text-left space-y-2.5 max-h-[40vh] overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold text-sm">
                      Cena {storyboard[fullscreenImageIndex].scene || fullscreenImageIndex + 1}
                    </h4>
                    <span className="text-xs font-mono text-stone-400 bg-white/10 px-2 py-0.5 rounded">
                      {storyboard[fullscreenImageIndex].timecode || '6-8s'} ({storyboard[fullscreenImageIndex].durationSeconds || 7}s)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                      {storyboard[fullscreenImageIndex].sceneType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sceneImages[fullscreenImageIndex]?.url && (
                      <button
                        onClick={() => handleDownloadImage(sceneImages[fullscreenImageIndex]!.url!, storyboard[fullscreenImageIndex].scene || fullscreenImageIndex + 1)}
                        className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Baixar Imagem"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const curScene = storyboard[fullscreenImageIndex];
                        const effVid = curScene.videoPrompt || (
                          curScene.cameraMovement 
                            ? `${curScene.cameraMovement}, ${curScene.subjectMovement || 'subtle motion'}, 4k resolution, cinematic motion for image-to-video`
                            : 'Slow cinematic dolly-in with subtle subject motion, continuous 7-second motion, image-to-video'
                        );
                        copyPromptText(effVid, `modal-vid-${fullscreenImageIndex}`, 'Prompt de Vídeo');
                      }}
                      className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/30 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Copiar Prompt de Vídeo para Kling / Runway / Luma"
                    >
                      {copiedPromptKey === `modal-vid-${fullscreenImageIndex}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Vídeo Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5 text-purple-400" />
                          <span>Copiar Vídeo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => copyPromptText(storyboard[fullscreenImageIndex].negativePrompt, `modal-neg-${fullscreenImageIndex}`, 'Prompt Negativo')}
                      className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Copiar Prompt Negativo"
                    >
                      {copiedPromptKey === `modal-neg-${fullscreenImageIndex}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Negativo Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Negativo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => copyPromptText(storyboard[fullscreenImageIndex].imagePrompt, `modal-prompt-${fullscreenImageIndex}`, 'Prompt')}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Copiar Prompt Positivo"
                    >
                      {copiedPromptKey === `modal-prompt-${fullscreenImageIndex}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {storyboard[fullscreenImageIndex].textSnippet && (
                  <p className="text-amber-300 font-medium text-xs leading-relaxed">
                    “{storyboard[fullscreenImageIndex].textSnippet}”
                  </p>
                )}
                <p className="text-stone-300 text-xs">{storyboard[fullscreenImageIndex].description}</p>

                <div className="bg-black/60 p-2.5 rounded-lg border border-white/10 text-xs font-mono text-stone-200 select-all leading-relaxed break-words">
                  <span className="text-amber-400 font-sans font-bold">Prompt de Imagem (8K Fotografia 35mm): </span>
                  {storyboard[fullscreenImageIndex].imagePrompt}
                </div>

                <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-500/30 text-xs font-mono text-purple-200 select-all leading-relaxed break-words">
                  <span className="text-purple-300 font-sans font-bold flex items-center gap-1 mb-1">
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    Prompt de Vídeo / Animação (Kling, Runway, Luma):
                  </span>
                  {storyboard[fullscreenImageIndex].videoPrompt || (
                    storyboard[fullscreenImageIndex].cameraMovement 
                      ? `${storyboard[fullscreenImageIndex].cameraMovement}, ${storyboard[fullscreenImageIndex].subjectMovement || 'subtle motion'}, 4k resolution, cinematic motion for image-to-video`
                      : 'Slow cinematic dolly-in with subtle subject motion, continuous 7-second motion, image-to-video'
                  )}
                  {(storyboard[fullscreenImageIndex].cameraMovement || storyboard[fullscreenImageIndex].subjectMovement) && (
                    <div className="mt-1.5 pt-1.5 border-t border-purple-500/20 flex flex-wrap gap-2 text-[10px] text-purple-300 font-sans">
                      {storyboard[fullscreenImageIndex].cameraMovement && (
                        <span><strong>Câmera:</strong> {storyboard[fullscreenImageIndex].cameraMovement}</span>
                      )}
                      {storyboard[fullscreenImageIndex].subjectMovement && (
                        <span><strong>Sujeito:</strong> {storyboard[fullscreenImageIndex].subjectMovement}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black/40 p-2 rounded border border-white/5 text-[11px] font-mono text-stone-400 select-all leading-snug break-words">
                  <span className="text-rose-400 font-sans font-bold">Negativo: </span>
                  {storyboard[fullscreenImageIndex].negativePrompt}
                </div>
              </div>
            </div>

            {fullscreenImageIndex < storyboard.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(prev => prev! + 1); }}
                className="absolute right-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                title="Próxima Cena"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Projetos Salvos */}
      <SavedProjectsModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        savedProjects={savedProjects}
        currentProjectId={currentProjectId}
        currentData={{
          theme,
          passageResult,
          selectedDuration,
          scriptsResult,
          selectedScript,
          scriptHistory,
          scriptInstructions,
          storyboard,
          sceneImages,
          soundtrackPrompts,
          seoResult,
          articleResult,
          visualStyle,
          activeTab,
        }}
        onSaveCurrentAsNew={handleSaveCurrentAsNew}
        onUpdateExistingProject={handleUpdateExistingProject}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportProject={handleImportProject}
        onStartBlankProject={handleStartBlankProject}
        onRenameProject={handleRenameProject}
      />

      {/* Modal: Exportar Artigo Completo com APA */}
      <ArticleExportModal
        isOpen={isArticleExportModalOpen}
        onClose={() => setIsArticleExportModalOpen(false)}
        articleText={articleResult}
        theme={theme}
        references={compileAllReferencesForProject(sources, articleResult, passageResult, theme)}
        onToast={showToast}
      />

      {/* Modal: Verificador de Consistência de Citações */}
      <CitationConsistencyModal
        isOpen={isCitationConsistencyModalOpen}
        onClose={() => setIsCitationConsistencyModalOpen(false)}
        report={articleConsistencyReport}
        onToast={showToast}
        onInsertTextIntoArticle={(textToAppend) => {
          setArticleResult(prev => prev + textToAppend);
          showToast('Citação inserida no artigo com sucesso!');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-stone-700 dark:border-stone-200 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* In-App Confirmation Modal (Replaces browser window.confirm for iframe sandbox compatibility) */}
      {confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmModal({ isOpen: false, type: null, title: '', description: '' })}
        >
          <div 
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${confirmModal.type === 'clear_project' ? 'bg-red-50 dark:bg-red-950/50 text-red-600' : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100'}`}>
                {confirmModal.type === 'clear_project' ? <Trash2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {confirmModal.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, title: '', description: '' })}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors order-last sm:order-first"
              >
                Cancelar
              </button>

              {confirmModal.type === 'new_project' && (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmNewWithoutSaving}
                    className="px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors"
                  >
                    Iniciar sem Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveAndNew}
                    className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-xl shadow-sm transition-colors"
                  >
                    Salvar Atual e Criar Novo
                  </button>
                </>
              )}

              {confirmModal.type === 'clear_project' && (
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
                >
                  Confirmar Limpeza
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
