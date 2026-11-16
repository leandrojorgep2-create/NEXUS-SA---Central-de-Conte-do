/**
 * Citation Consistency Checker for Article & References (Etapa 6)
 * Analyzes whether references in the bibliography are cited in the article body.
 */

import { ApaFormattedEntry } from './apaFormatter';

export interface CitationMatch {
  matchedTerm: string;
  matchType: 'formal_citation' | 'author_mention' | 'work_title' | 'biblical_passage' | 'lexical_term';
  snippet: string;
  position: number;
}

export interface ReferenceConsistencyResult {
  reference: ApaFormattedEntry;
  isCited: boolean;
  matchCount: number;
  matches: CitationMatch[];
  searchTermsUsed: string[];
  suggestedInTextCitation: string;
  suggestedParagraph: string;
}

export interface ConsistencyAnalysisReport {
  totalReferences: number;
  citedCount: number;
  uncitedCount: number;
  consistencyScore: number; // 0 to 100
  status: 'perfect' | 'good' | 'warning' | 'empty';
  statusMessage: string;
  results: ReferenceConsistencyResult[];
  cleanArticleBody: string;
}

/**
 * Extracts the clean body of the article, excluding any references section at the bottom.
 * This prevents false positives where a reference matches its own entry in the bibliography.
 */
export function extractArticleBody(articleText: string): string {
  if (!articleText || !articleText.trim()) return '';
  return articleText.replace(
    /(?:^|\n)#{1,4}\s*(?:.*?(?:refer[êe]ncias|bibliografia|fontes acad[êe]micas|references))[\s\S]*$/i,
    ''
  ).trim();
}

/**
 * Normalizes text for accent-insensitive and case-insensitive comparison
 */
function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Extracts context snippet around a match index
 */
function extractSnippet(text: string, index: number, matchLength: number, radius = 50): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLength + radius);
  let snippet = text.slice(start, end).replace(/\s+/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

/**
 * Builds candidate search terms for a given reference
 */
export function buildSearchTermsForReference(ref: ApaFormattedEntry): { term: string; type: CitationMatch['matchType'] }[] {
  const terms: { term: string; type: CitationMatch['matchType'] }[] = [];
  const added = new Set<string>();

  const addTerm = (term: string, type: CitationMatch['matchType']) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    const lower = clean.toLowerCase();
    if (!added.has(lower)) {
      added.add(lower);
      terms.push({ term: clean, type });
    }
  };

  // 1. Author Surnames
  if (ref.authors) {
    // Surnames from "Sobrenome, Iniciais" or "Sobrenome et al."
    const authorParts = ref.authors.split(/[,;&]|\bet al\b/i);
    authorParts.forEach(part => {
      const clean = part.replace(/[^a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s-]/g, '').trim();
      const words = clean.split(/\s+/).filter(w => w.length > 2);
      words.forEach(w => {
        // Skip common institutional words that might cause noise
        if (!/^(sociedade|brasil|editora|press|university|universidade|de|da|do|dos|das|e)$/i.test(w)) {
          addTerm(w, 'author_mention');
        }
      });
    });
  }

  // 2. Specific APA in-text patterns (e.g. "Kandel et al.", "Damásio, 1996", "LeDoux, 2002")
  if (ref.apaInText) {
    const cleanInText = ref.apaInText.replace(/[()\[\]]/g, '').trim();
    addTerm(cleanInText, 'formal_citation');
  }

  if (ref.citationShort) {
    const cleanShort = ref.citationShort.replace(/[()\[\]]/g, '').trim();
    addTerm(cleanShort, 'formal_citation');
  }

  // 3. Known ID-specific & Lexicon terms
  if (ref.id.includes('bdag') || /bdag/i.test(ref.title) || /bauer/i.test(ref.authors)) {
    addTerm('BDAG', 'formal_citation');
    addTerm('Bauer', 'author_mention');
    addTerm('Danker', 'author_mention');
  }

  if (ref.id.includes('halot') || /halot/i.test(ref.title) || /koehler/i.test(ref.authors)) {
    addTerm('HALOT', 'formal_citation');
    addTerm('Koehler', 'author_mention');
    addTerm('Baumgartner', 'author_mention');
  }

  if (ref.id.includes('kandel') || /kandel/i.test(ref.authors)) {
    addTerm('Kandel', 'author_mention');
  }

  if (ref.id.includes('ledoux') || /ledoux/i.test(ref.authors)) {
    addTerm('LeDoux', 'author_mention');
    addTerm('Ledoux', 'author_mention');
  }

  if (ref.id.includes('damasio') || /dam[áa]sio/i.test(ref.authors)) {
    addTerm('Damásio', 'author_mention');
    addTerm('Damasio', 'author_mention');
    addTerm('marcador somático', 'lexical_term');
    addTerm('marcadores somáticos', 'lexical_term');
  }

  // 4. Biblical connection terms
  if (ref.category === 'biblical' || ref.id.includes('bible')) {
    addTerm('Bíblia', 'biblical_passage');
    addTerm('Escritura', 'biblical_passage');
    addTerm('ARA', 'formal_citation');
    addTerm('Almeida', 'author_mention');

    if (ref.biblicalConnection) {
      // e.g. "Provérbios, Romanos" or "Pv 4:23"
      const books = ref.biblicalConnection.split(/[,;\n]/).map(b => b.trim());
      books.forEach(b => {
        if (b.length > 2) addTerm(b, 'biblical_passage');
      });
    }
  }

  // 5. Original terms (Hebrew / Greek)
  if (ref.originalTerm) {
    const termsList = ref.originalTerm.split(/[/,;()]/).map(t => t.trim());
    termsList.forEach(t => {
      const clean = t.replace(/[^a-zA-Z\u0370-\u03FF\u0590-\u05FF]/g, '').trim();
      if (clean.length > 2) addTerm(clean, 'lexical_term');
    });
  }

  // 6. Significant title words (> 5 chars, excluding common stop words)
  if (ref.title) {
    const stopWords = new Set([
      'sobre', 'entre', 'pelos', 'pelas', 'nosso', 'nossa', 'livro', 'manual',
      'principios', 'estudo', 'analise', 'artigo', 'revista', 'edição', 'volume',
      'how', 'our', 'brains', 'become', 'who', 'we', 'are', 'and', 'the', 'for'
    ]);
    const words = ref.title.split(/[\s:;.,!?"'()\[\]-]+/).filter(w => w.length >= 6);
    words.forEach(w => {
      if (!stopWords.has(w.toLowerCase())) {
        addTerm(w, 'work_title');
      }
    });
  }

  return terms;
}

/**
 * Generates an academic suggestion sentence to cite this reference in the article body
 */
export function generateSuggestedCitationParagraph(ref: ApaFormattedEntry): string {
  if (ref.id.includes('damasio') || /dam[áa]sio/i.test(ref.authors)) {
    return `Como aponta Damásio (${ref.year || '1996'}), a deliberação humana não ocorre em isolamento puramente abstrato, mas depende intrinsecamente de marcadores somáticos e respostas afetivas integradas.`;
  }
  if (ref.id.includes('kandel') || /kandel/i.test(ref.authors)) {
    return `Essa reorganização neural fundamenta-se nos princípios celulares de consolidação sináptica e neuroplasticidade descritos por Kandel et al. (${ref.year || '2013'}).`;
  }
  if (ref.id.includes('ledoux') || /ledoux/i.test(ref.authors)) {
    return `A regulação dos circuitos amigdalianos pelo córtex pré-frontal exemplifica a formação da identidade sináptica postulada por LeDoux (${ref.year || '2002'}).`;
  }
  if (ref.id.includes('bdag') || /bdag/i.test(ref.title)) {
    return `No grego do Novo Testamento, o léxico BDAG (Bauer et al., ${ref.year || '2000'}) define o vocábulo com especial atenção ao discernimento moral e renovação da capacidade de juízo.`;
  }
  if (ref.id.includes('halot') || /halot/i.test(ref.title)) {
    return `Na filologia hebraica veterotestamentária registrada no HALOT (Koehler et al., ${ref.year || '2001'}), o termo לֵב (Lev) designa o centro unificado de pensamento, vontade e decisão ética.`;
  }
  if (ref.category === 'biblical') {
    return `Conforme registrado no texto bíblico (${ref.apaInText || 'Bíblia Sagrada, 2002'}), a instrução preservada convoca o leitor à guarda vigilante do seu centro deliberativo.`;
  }

  // Generic Academic Source suggestion
  const firstAuthor = ref.authors.split(',')[0].trim() || 'Pesquisador';
  const year = ref.year || '2020';
  const finding = ref.keyFinding ? ` demonstrando que ${ref.keyFinding.toLowerCase().slice(0, 120)}` : '';
  return `Conforme demonstrado por ${firstAuthor} (${year}), a pesquisa contemporânea corrobora essa perspectiva${finding}.`;
}

/**
 * Analyzes consistency between the article text and all compiled references.
 */
export function analyzeCitationConsistency(
  articleText: string,
  references: ApaFormattedEntry[]
): ConsistencyAnalysisReport {
  const cleanBody = extractArticleBody(articleText);
  const normalizedBody = normalizeText(cleanBody);

  if (!cleanBody || !references || references.length === 0) {
    return {
      totalReferences: references ? references.length : 0,
      citedCount: 0,
      uncitedCount: references ? references.length : 0,
      consistencyScore: 0,
      status: 'empty',
      statusMessage: cleanBody
        ? 'Nenhuma referência bibliográfica encontrada para conferência.'
        : 'Gere o artigo completo na Etapa 6 para verificar a consistência das citações.',
      results: (references || []).map(ref => ({
        reference: ref,
        isCited: false,
        matchCount: 0,
        matches: [],
        searchTermsUsed: [],
        suggestedInTextCitation: ref.apaInText || `(${ref.sortKey}, ${ref.year || 's.d.'})`,
        suggestedParagraph: generateSuggestedCitationParagraph(ref)
      })),
      cleanArticleBody: cleanBody
    };
  }

  const results: ReferenceConsistencyResult[] = [];
  let citedCount = 0;

  references.forEach(ref => {
    const searchTerms = buildSearchTermsForReference(ref);
    const matches: CitationMatch[] = [];
    const matchedPositions = new Set<number>();
    const termsUsed: string[] = [];

    searchTerms.forEach(({ term, type }) => {
      termsUsed.push(term);
      const normalizedTerm = normalizeText(term);
      if (!normalizedTerm) return;

      // Word boundary regex on normalized text
      // Escape special regex characters
      const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Look for word boundaries or punctuation boundaries
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'gi');

      let match: RegExpExecArray | null;
      while ((match = regex.exec(normalizedBody)) !== null) {
        // Calculate true start index of the term within the match
        const fullMatch = match[0];
        const offset = fullMatch.toLowerCase().indexOf(normalizedTerm);
        const actualIndex = match.index + (offset >= 0 ? offset : 0);

        if (!matchedPositions.has(actualIndex)) {
          matchedPositions.add(actualIndex);
          matches.push({
            matchedTerm: term,
            matchType: type,
            snippet: extractSnippet(cleanBody, actualIndex, term.length),
            position: actualIndex
          });
        }

        // Limit matches per term to prevent runaway
        if (matches.length >= 10) break;
      }
    });

    const isCited = matches.length > 0;
    if (isCited) citedCount++;

    results.push({
      reference: ref,
      isCited,
      matchCount: matches.length,
      matches: matches.sort((a, b) => a.position - b.position),
      searchTermsUsed: termsUsed,
      suggestedInTextCitation: ref.apaInText || `(${ref.sortKey}, ${ref.year || 's.d.'})`,
      suggestedParagraph: generateSuggestedCitationParagraph(ref)
    });
  });

  const totalReferences = references.length;
  const uncitedCount = totalReferences - citedCount;
  const consistencyScore = totalReferences > 0 ? Math.round((citedCount / totalReferences) * 100) : 0;

  let status: 'perfect' | 'good' | 'warning' | 'empty' = 'warning';
  let statusMessage = '';

  if (consistencyScore === 100) {
    status = 'perfect';
    statusMessage = `Consistência Exemplar (100%): Todas as ${totalReferences} fontes da bibliografia estão citadas no texto!`;
  } else if (consistencyScore >= 70) {
    status = 'good';
    statusMessage = `Boa Consistência (${consistencyScore}%): ${citedCount} de ${totalReferences} fontes citadas. ${uncitedCount} fonte(s) não mencionada(s).`;
  } else {
    status = 'warning';
    statusMessage = `Atenção (${consistencyScore}% de consistência): ${uncitedCount} de ${totalReferences} fontes listadas não foram mencionadas no corpo do artigo.`;
  }

  return {
    totalReferences,
    citedCount,
    uncitedCount,
    consistencyScore,
    status,
    statusMessage,
    results,
    cleanArticleBody: cleanBody
  };
}
