export interface AcademicSource {
  id: string;
  category: 'theological' | 'neuroscience' | 'lexicon' | 'historical';
  title: string;
  authors: string;
  year?: string;
  publication: string;
  keyFindings: string;
  biblicalConnection: string;
  citationScriptQuote: string;
  isIncluded?: boolean;
}

export interface SoundtrackPart {
  partNumber: number;
  title: string;
  actName: string;
  sectionCoverage: string;
  mood: string;
  bpm: string;
  genre: string;
  instruments: string[];
  stylePrompt: string;
  lyricsPrompt: string;
  tip: string;
}

export type SceneType = 'estabelecimento' | 'ação' | 'reflexão/close emocional' | 'transição' | 'citação visual';

export interface ArtDirectionSheet {
  palette: string;
  photographicStyle: string;
  characters: string;
  mood: string;
  cameraLensGuide?: string;
  lightingSetup?: string;
}

export interface StoryboardScene {
  scene: number;
  timecode: string;
  durationSeconds: number;
  sceneType: SceneType;
  textSnippet: string;
  description: string;
  imagePrompt: string;
  videoPrompt?: string;
  cameraMovement?: string;
  subjectMovement?: string;
  negativePrompt: string;
  shotType?: string;
  lighting?: string;
  lens?: string;
  composition?: string;
}

export interface ProjectData {
  theme: string;
  passageResult: string;
  sources?: AcademicSource[];
  selectedDuration: number;
  scriptsResult: any[] | null;
  selectedScript: string;
  scriptHistory: string[];
  scriptInstructions: string;
  storyboard: StoryboardScene[];
  artDirectionSheet?: ArtDirectionSheet | null;
  sceneImages: Record<number, { url?: string; loading: boolean }>;
  soundtrackPrompts?: SoundtrackPart[];
  soundtrackStyle?: string;
  seoResult: string;
  articleResult: string;
  visualStyle?: string;
  activeTab?: number;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: ProjectData;
}
