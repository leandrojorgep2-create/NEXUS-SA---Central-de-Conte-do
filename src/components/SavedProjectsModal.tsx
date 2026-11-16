import React, { useState, useRef } from 'react';
import { 
  FolderOpen, 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Copy, 
  Clock, 
  Check, 
  Search, 
  LayoutTemplate, 
  Image as ImageIcon, 
  FileText, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { SavedProject, ProjectData } from '../types';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: SavedProject[];
  currentProjectId: string | null;
  currentData: ProjectData;
  onSaveCurrentAsNew: (customName?: string) => void;
  onUpdateExistingProject: (projectId: string) => void;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: SavedProject) => void;
  onImportProject: (project: SavedProject) => void;
  onStartBlankProject: () => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

export default function SavedProjectsModal({
  isOpen,
  onClose,
  savedProjects,
  currentProjectId,
  currentData,
  onSaveCurrentAsNew,
  onUpdateExistingProject,
  onLoadProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProject,
  onStartBlankProject,
  onRenameProject,
}: SavedProjectsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [saveNameInput, setSaveNameInput] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isConfirmingBlank, setIsConfirmingBlank] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const filteredProjects = savedProjects.filter((p) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(query);
    const themeMatch = (p.data?.theme || '').toLowerCase().includes(query);
    return nameMatch || themeMatch;
  });

  const handleSaveNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = saveNameInput.trim() || currentData.theme.trim() || `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
    onSaveCurrentAsNew(name);
    setSaveNameInput('');
    setIsSavingNew(false);
    showFeedback(`Projeto "${name}" salvo com sucesso!`);
  };

  const handleExportJson = (project: SavedProject) => {
    const filename = `${(project.name || 'projeto').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback(`Projeto exportado como ${filename}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.data) {
          throw new Error('Arquivo de projeto inválido');
        }
        const importedProject: SavedProject = {
          id: `proj_${Date.now()}`,
          name: parsed.name ? `${parsed.name} (Importado)` : `Projeto Importado ${new Date().toLocaleDateString('pt-BR')}`,
          createdAt: parsed.createdAt || Date.now(),
          updatedAt: Date.now(),
          data: parsed.data,
        };
        onImportProject(importedProject);
        showFeedback(`Projeto "${importedProject.name}" importado com sucesso!`);
      } catch (err) {
        console.error(err);
        showFeedback('Erro: O arquivo selecionado não é um JSON de projeto válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRenaming = (project: SavedProject) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleRenameSubmit = (projectId: string) => {
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
      showFeedback('Nome do projeto atualizado!');
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeProject = savedProjects.find((p) => p.id === currentProjectId);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl shadow-sm">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  Projetos Salvos
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {savedProjects.length} {savedProjects.length === 1 ? 'projeto' : 'projetos'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Gerencie seus roteiros, storyboards e conteúdos salvos neste navegador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if any */}
        {feedbackMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Action Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {!isSavingNew ? (
              <button
                onClick={() => {
                  setSaveNameInput(currentData.theme || '');
                  setIsSavingNew(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 text-xs font-medium rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Projeto Atual</span>
              </button>
            ) : (
              <form onSubmit={handleSaveNewSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="text"
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  placeholder="Nome do projeto..."
                  autoFocus
                  className="px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 text-stone-900 dark:text-stone-100 w-44"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  className="px-2 py-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs"
                >
                  Cancelar
                </button>
              </form>
            )}

            {currentProjectId && activeProject && (
              <button
                onClick={() => {
                  onUpdateExistingProject(currentProjectId);
                  showFeedback(`Alterações salvas em "${activeProject.name}"!`);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
                title="Atualizar o projeto aberto com as modificações atuais"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Atualizar "{activeProject.name.slice(0, 18)}..."</span>
              </button>
            )}

            {!isConfirmingBlank ? (
              <button
                onClick={() => setIsConfirmingBlank(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
                title="Limpa a tela e começa um novo projeto do zero"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo em Branco</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-300 dark:border-stone-700 animate-in fade-in">
                <span className="text-[11px] text-stone-600 dark:text-stone-300 font-medium px-1">Iniciar novo?</span>
                <button
                  onClick={() => {
                    setIsConfirmingBlank(false);
                    onStartBlankProject();
                    onClose();
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded"
                >
                  Sim
                </button>
                <button
                  onClick={() => setIsConfirmingBlank(false)}
                  className="px-2 py-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-[11px]"
                >
                  Não
                </button>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium rounded-lg transition-colors border border-dashed border-stone-300 dark:border-stone-700"
              title="Importar projeto a partir de arquivo JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Search Box */}
          {savedProjects.length > 0 && (
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome ou tema..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400"
              />
            </div>
          )}
        </div>

        {/* Project List / Empty State */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {savedProjects.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-stone-800 dark:text-stone-200">
                Nenhum projeto salvo na biblioteca
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mt-1 mb-6">
                O seu projeto em edição é preservado automaticamente pelo navegador. Clique abaixo para salvá-lo com um nome permanente e criar novas versões.
              </p>
              <button
                onClick={() => {
                  const name = currentData.theme.trim() || `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
                  onSaveCurrentAsNew(name);
                  showFeedback(`Projeto "${name}" salvo!`);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Projeto Atual na Biblioteca</span>
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Nenhum projeto encontrado para a busca "{searchQuery}".
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isActive = project.id === currentProjectId;
              const scenesCount = project.data?.storyboard?.length || 0;
              const hasScript = Boolean(project.data?.selectedScript?.trim());
              const hasSeo = Boolean(project.data?.seoResult?.trim());
              const hasArticle = Boolean(project.data?.articleResult?.trim());
              const generatedImagesCount = project.data?.sceneImages 
                ? Object.values(project.data.sceneImages).filter((img: any) => img?.url).length 
                : 0;

              return (
                <div
                  key={project.id}
                  className={`group relative rounded-xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? 'border-stone-900 dark:border-stone-300 bg-stone-50/70 dark:bg-stone-800/60 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {editingId === project.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(project.id)}
                            className="text-sm font-semibold px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameSubmit(project.id)}
                            className="p-1 bg-stone-900 text-white rounded text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => {
                              onLoadProject(project);
                              onClose();
                            }}
                            className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 truncate cursor-pointer hover:underline"
                            title="Clique para abrir"
                          >
                            {project.name}
                          </h4>
                          <button
                            onClick={() => startRenaming(project)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-opacity"
                            title="Renomear projeto"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Aberto Agora
                        </span>
                      )}
                    </div>

                    {/* Meta info & Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {project.data?.theme && (
                        <span className="truncate max-w-xs text-stone-700 dark:text-stone-300 font-medium">
                          Tema: "{project.data.theme}"
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {project.data?.selectedDuration && (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {project.data.selectedDuration} min
                        </span>
                      )}
                      {hasScript && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                          <LayoutTemplate className="w-2.5 h-2.5" />
                          Roteiro Final
                        </span>
                      )}
                      {scenesCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/50">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {scenesCount} {scenesCount === 1 ? 'cena' : 'cenas'}
                          {generatedImagesCount > 0 && ` (${generatedImagesCount} imgs)`}
                        </span>
                      )}
                      {hasSeo && (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          SEO
                        </span>
                      )}
                      {hasArticle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
                          <FileText className="w-2.5 h-2.5" />
                          Artigo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800 justify-end">
                    <button
                      onClick={() => {
                        onLoadProject(project);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${
                        isActive
                          ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                          : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
                      }`}
                    >
                      <span>{isActive ? 'Recarregar' : 'Abrir Projeto'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onDuplicateProject(project);
                        showFeedback(`Cópia de "${project.name}" criada!`);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="Duplicar projeto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleExportJson(project)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="Exportar como JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {deletingProjectId === project.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 p-1 rounded-lg border border-red-200 dark:border-red-900 animate-in fade-in">
                        <span className="text-[10px] text-red-700 dark:text-red-300 font-semibold px-1">Excluir?</span>
                        <button
                          onClick={() => {
                            setDeletingProjectId(null);
                            onDeleteProject(project.id);
                            showFeedback(`Projeto "${project.name}" excluído.`);
                          }}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeletingProjectId(null)}
                          className="px-1.5 py-0.5 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-[10px]"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingProjectId(project.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>
            {savedProjects.length > 0 
              ? 'Dica: Você pode exportar projetos para backup ou abri-los em outro dispositivo.'
              : 'Seus projetos salvos ficam guardados com segurança no armazenamento local.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
