/**
 * APA 7th Edition (American Psychological Association) Reference Formatter
 * Provides strict academic formatting for scientific and biblical sources.
 */

import { AcademicSource } from '../types';

export interface ApaFormattedEntry {
  id: string;
  category: 'biblical' | 'neuroscience' | 'lexicon' | 'theological' | 'historical';
  sortKey: string;
  authors: string;
  year: string;
  title: string;
  publication: string;
  apaPlain: string;
  apaFormat?: string;
  apaMarkdown: string;
  apaHtml: string;
  apaInText: string;
  abntFormat: string;
  citationShort: string;
  keyFinding?: string;
  biblicalConnection?: string;
  originalTerm?: string;
  isCustom?: boolean;
}

/**
 * Formats a raw author string into APA 7th edition format.
 * Examples:
 * - "Eric R. Kandel" -> "Kandel, E. R."
 * - "KANDEL, Eric R.; SCHWARTZ, James H." -> "Kandel, E. R., & Schwartz, J. H."
 * - "BAUER, Walter; DANKER, Frederick W.; ARNDT, William F.; GINGRICH, F. Wilbur" -> "Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W."
 * - "Sociedade Bíblica do Brasil" -> "Sociedade Bíblica do Brasil"
 */
export function formatToApaAuthors(authorStr: string): string {
  if (!authorStr || !authorStr.trim()) return 'Author, A. A.';
  const trimmed = authorStr.trim();

  // Known corporate/institutional authors
  if (/sociedade b[íi]blica|sbb|instituto|universidade|university|association|organization|vatican|who/i.test(trimmed)) {
    return trimmed;
  }

  // Split by semicolon or comma if multiple
  const rawAuthors = trimmed.includes(';')
    ? trimmed.split(';').map(a => a.trim()).filter(Boolean)
    : trimmed.includes('&')
    ? trimmed.split('&').map(a => a.trim()).filter(Boolean)
    : [trimmed];

  const parsedAuthors = rawAuthors.map(singleAuthor => {
    // If format is "LASTNAME, Firstname Middle"
    if (singleAuthor.includes(',')) {
      const [last, firstAndRest] = singleAuthor.split(',').map(s => s.trim());
      const cleanLast = capitalizeWord(last);
      const initials = extractInitials(firstAndRest || '');
      return initials ? `${cleanLast}, ${initials}` : cleanLast;
    }

    // If format is "Firstname Middle Lastname"
    const words = singleAuthor.split(/\s+/).filter(Boolean);
    if (words.length === 1) return capitalizeWord(words[0]);

    const last = capitalizeWord(words[words.length - 1]);
    const firstNames = words.slice(0, words.length - 1).join(' ');
    const initials = extractInitials(firstNames);
    return initials ? `${last}, ${initials}` : last;
  });

  if (parsedAuthors.length === 0) return 'Author, A. A.';
  if (parsedAuthors.length === 1) return parsedAuthors[0];
  if (parsedAuthors.length === 2) return `${parsedAuthors[0]}, & ${parsedAuthors[1]}`;
  if (parsedAuthors.length <= 20) {
    const allExceptLast = parsedAuthors.slice(0, -1).join(', ');
    return `${allExceptLast}, & ${parsedAuthors[parsedAuthors.length - 1]}`;
  }

  // APA 7th rule for 21+ authors: list first 19, ellipsis, then last
  const first19 = parsedAuthors.slice(0, 19).join(', ');
  return `${first19}, ... ${parsedAuthors[parsedAuthors.length - 1]}`;
}

function capitalizeWord(w: string): string {
  if (!w) return '';
  const lower = w.toLowerCase();
  // Handle compound names like LeDoux, De, Von, Van
  if (/^ledoux$/i.test(lower)) return 'LeDoux';
  if (/^mcc/i.test(lower)) return 'McC' + lower.slice(3, 4).toUpperCase() + lower.slice(4);
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function extractInitials(nameStr: string): string {
  if (!nameStr) return '';
  const parts = nameStr.split(/[\s.-]+/).filter(Boolean);
  return parts.map(p => `${p.charAt(0).toUpperCase()}.`).join(' ');
}

/**
 * Applies APA sentence case to titles (first letter capitalized, proper nouns preserved)
 */
export function formatToApaTitle(titleStr: string): string {
  if (!titleStr) return '';
  const trimmed = titleStr.trim();

  // Words that should always retain their uppercase styling
  const properNouns = [
    'Greek', 'Hebrew', 'Latin', 'Aramaic', 'English', 'New Testament', 'Old Testament',
    'BDAG', 'HALOT', 'NA28', 'BHS', 'ARA', 'Septuaginta', 'Descartes', 'Bíblia',
    'Sagrada', 'Testamento', 'Antigo', 'Novo', 'Deus', 'Jesus', 'Cristo', 'Lev',
    'Nous', 'Kardia', 'Nephesh', 'Ruach', 'Kilyot', 'Me\'im', 'Splagchnon', 'Almeida'
  ];

  // Capitalize first word and words after colons
  const sentences = trimmed.split(/([:?!\-—]\s*)/);
  const formattedSentences = sentences.map((part, idx) => {
    // If it's a separator, leave as is
    if (/^[:?!\-—]\s*$/.test(part)) return part;

    const words = part.split(/\s+/).filter(Boolean);
    return words.map((w, wIdx) => {
      // Check if word matches a proper noun
      const cleanW = w.replace(/^[("']+|[)"'.,;:!?]+$/g, '');
      const match = properNouns.find(pn => pn.toLowerCase() === cleanW.toLowerCase());
      if (match) {
        return w.replace(cleanW, match);
      }

      // First word in sentence/subclause must be capitalized
      if (wIdx === 0) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }

      return w.toLowerCase();
    }).join(' ');
  });

  return formattedSentences.join('');
}

/**
 * Strips publisher city (APA 7th removes place of publication)
 */
export function cleanApaPublisher(pubStr: string): string {
  if (!pubStr) return 'Editora Acadêmica';
  let cleaned = pubStr.trim();
  // Strip patterns like "Barueri: SBB" -> "SBB" or "New York: Viking" -> "Viking"
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    cleaned = parts[parts.length - 1].trim();
  }
  // Strip edition prefix if already present in title
  cleaned = cleaned.replace(/^\d+\.\s*ed\.?\s*/i, '').trim();
  return cleaned || pubStr;
}

/**
 * Generates an APA 7th entry for a biblical corpus
 */
export function createBiblicalApaEntry(detectedBooksLabel: string): ApaFormattedEntry {
  const books = detectedBooksLabel || 'Cânon Sagrado (Antigo e Novo Testamento)';
  return {
    id: 'bible-ara-primary',
    category: 'biblical',
    sortKey: 'Biblia Sagrada',
    authors: 'Sociedade Bíblica do Brasil',
    year: '2002',
    title: 'Bíblia Sagrada',
    publication: 'Sociedade Bíblica do Brasil',
    apaPlain: 'Bíblia Sagrada (Edição Revista e Atualizada no Brasil, J. F. de Almeida, Trad.). (2002). Sociedade Bíblica do Brasil. (Manuscritos originais do Texto Massorético e Novum Testamentum Graece NA28 ca. 1200 a.C.–100 d.C.).',
    apaMarkdown: '*Bíblia Sagrada* (Edição Revista e Atualizada no Brasil, J. F. de Almeida, Trad.). (2002). Sociedade Bíblica do Brasil. (Manuscritos originais do Texto Massorético e Novum Testamentum Graece NA28 ca. 1200 a.C.–100 d.C.).',
    apaHtml: '<em>Bíblia Sagrada</em> (Edição Revista e Atualizada no Brasil, J. F. de Almeida, Trad.). (2002). Sociedade Bíblica do Brasil.',
    apaInText: `(*Bíblia Sagrada*, 2002, ${books})`,
    abntFormat: 'BÍBLIA. Português. Bíblia Sagrada: Antigo e Novo Testamento. Tradução de João Ferreira de Almeida. Edição Revista e Atualizada no Brasil. 2. ed. Barueri: Sociedade Bíblica do Brasil, 2002.',
    citationShort: '(ARA, 2002)',
    keyFinding: `Fundamentação nas Escrituras Sagradas com exegese das porções textuais: ${books}.`,
    biblicalConnection: books
  };
}

/**
 * Pre-compiled APA 7th Lexicon references
 */
export function createBdagApaEntry(): ApaFormattedEntry {
  return {
    id: 'lexicon-bdag',
    category: 'lexicon',
    sortKey: 'Bauer, Walter',
    authors: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W.',
    year: '2000',
    title: 'A Greek-English lexicon of the New Testament and other early Christian literature',
    publication: 'The University of Chicago Press',
    apaPlain: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). A Greek-English lexicon of the New Testament and other early Christian literature (3rd ed.). The University of Chicago Press.',
    apaMarkdown: 'Bauer, W., Danker, F. W., Arndt, W. F., & Gingrich, F. W. (2000). *A Greek-English lexicon of the New Testament and other early Christian literature* (3rd ed.). The University of Chicago Press.',
    apaHtml: 'Bauer, W., Danker, F. W., Arndt, W. F., &amp; Gingrich, F. W. (2000). <em>A Greek-English lexicon of the New Testament and other early Christian literature</em> (3rd ed.). The University of Chicago Press.',
    apaInText: '(Bauer et al., 2000 [BDAG])',
    abntFormat: 'BAUER, Walter; DANKER, Frederick W. A Greek-English Lexicon of the New Testament and Other Early Christian Literature. 3. ed. Chicago: University of Chicago Press, 2000.',
    citationShort: '(BDAG, 2000)',
    keyFinding: 'Análise semântica e filológica dos termos gregos do Novo Testamento (ex: Νοῦς, Καρδία, Σπλάγχνον).',
    originalTerm: 'Νοῦς (Nous) / Καρδία (Kardia)'
  };
}

export function createHalotApaEntry(): ApaFormattedEntry {
  return {
    id: 'lexicon-halot',
    category: 'lexicon',
    sortKey: 'Koehler, Ludwig',
    authors: 'Koehler, L., Baumgartner, W., & Stamm, J. J.',
    year: '2001',
    title: 'The Hebrew and Aramaic lexicon of the Old Testament',
    publication: 'E. J. Brill',
    apaPlain: 'Koehler, L., Baumgartner, W., & Stamm, J. J. (2001). The Hebrew and Aramaic lexicon of the Old Testament. E. J. Brill.',
    apaMarkdown: 'Koehler, L., Baumgartner, W., & Stamm, J. J. (2001). *The Hebrew and Aramaic lexicon of the Old Testament*. E. J. Brill.',
    apaHtml: 'Koehler, L., Baumgartner, W., &amp; Stamm, J. J. (2001). <em>The Hebrew and Aramaic lexicon of the Old Testament</em>. E. J. Brill.',
    apaInText: '(Koehler et al., 2001 [HALOT])',
    abntFormat: 'KOEHLER, Ludwig; BAUMGARTNER, Walter. The Hebrew and Aramaic Lexicon of the Old Testament. Leiden: E.J. Brill, 2001.',
    citationShort: '(HALOT, 2001)',
    keyFinding: 'Exegese filológica do Antigo Testamento, identificando o Lev (coração) como centro volitivo decisório.',
    originalTerm: 'לֵב / לֵבָב (Lev / Levav)'
  };
}

/**
 * Pre-compiled APA 7th Neuroscience references
 */
export function createKandelApaEntry(): ApaFormattedEntry {
  return {
    id: 'neuro-kandel',
    category: 'neuroscience',
    sortKey: 'Kandel, Eric',
    authors: 'Kandel, E. R., Schwartz, J. H., Jessell, T. M., Siegelbaum, S. A., & Hudspeth, A. J.',
    year: '2013',
    title: 'Principles of neural science',
    publication: 'McGraw-Hill Professional',
    apaPlain: 'Kandel, E. R., Schwartz, J. H., Jessell, T. M., Siegelbaum, S. A., & Hudspeth, A. J. (2013). Principles of neural science (5th ed.). McGraw-Hill Professional.',
    apaMarkdown: 'Kandel, E. R., Schwartz, J. H., Jessell, T. M., Siegelbaum, S. A., & Hudspeth, A. J. (2013). *Principles of neural science* (5th ed.). McGraw-Hill Professional.',
    apaHtml: 'Kandel, E. R., Schwartz, J. H., Jessell, T. M., Siegelbaum, S. A., &amp; Hudspeth, A. J. (2013). <em>Principles of neural science</em> (5th ed.). McGraw-Hill Professional.',
    apaInText: '(Kandel et al., 2013)',
    abntFormat: 'KANDEL, Eric R. et al. Principles of Neural Science. 5. ed. New York: McGraw-Hill Professional, 2013.',
    citationShort: '(KANDEL et al., 2013)',
    keyFinding: 'Base celular da neuroplasticidade e consolidação de memória, demonstrando modificação física das sinapses pelo pensamento repetido.',
    biblicalConnection: 'Romanos 12:2 (Renovação da Mente / Anakainōsis)'
  };
}

export function createLeDouxApaEntry(): ApaFormattedEntry {
  return {
    id: 'neuro-ledoux',
    category: 'neuroscience',
    sortKey: 'LeDoux, Joseph',
    authors: 'LeDoux, J. E.',
    year: '2002',
    title: 'Synaptic self: How our brains become who we are',
    publication: 'Viking Penguin',
    apaPlain: 'LeDoux, J. E. (2002). Synaptic self: How our brains become who we are. Viking Penguin.',
    apaMarkdown: 'LeDoux, J. E. (2002). *Synaptic self: How our brains become who we are*. Viking Penguin.',
    apaHtml: 'LeDoux, J. E. (2002). <em>Synaptic self: How our brains become who we are</em>. Viking Penguin.',
    apaInText: '(LeDoux, 2002)',
    abntFormat: 'LEDOUX, Joseph E. Synaptic Self: How Our Brains Become Who We Are. New York: Viking Penguin, 2002.',
    citationShort: '(LEDOUX, 2002)',
    keyFinding: 'Demonstra a interação entre o sistema de medo amigdaliano e os circuitos pré-frontais na identidade humana.',
    biblicalConnection: 'Provérbios 4:23 (Guarda do Coração / Mananciais da Vida)'
  };
}

export function createDamasioApaEntry(): ApaFormattedEntry {
  return {
    id: 'neuro-damasio',
    category: 'neuroscience',
    sortKey: 'Damasio, Antonio',
    authors: 'Damásio, A. R.',
    year: '1996',
    title: 'O erro de Descartes: Emoção, razão e o cérebro humano',
    publication: 'Companhia das Letras',
    apaPlain: 'Damásio, A. R. (1996). O erro de Descartes: Emoção, razão e o cérebro humano. Companhia das Letras.',
    apaMarkdown: 'Damásio, A. R. (1996). *O erro de Descartes: Emoção, razão e o cérebro humano*. Companhia das Letras.',
    apaHtml: 'Damásio, A. R. (1996). <em>O erro de Descartes: Emoção, razão e o cérebro humano</em>. Companhia das Letras.',
    apaInText: '(Damásio, 1996)',
    abntFormat: 'DAMÁSIO, António R. O Erro de Descartes: Emoção, Razão e o Cérebro Humano. São Paulo: Companhia das Letras, 1996.',
    citationShort: '(DAMÁSIO, 1996)',
    keyFinding: 'Hipótese dos marcadores somáticos demonstrando que a deliberação racional depende de substratos emocionais e corporais.',
    biblicalConnection: 'Lev / Kardia (Centro integrado de razão, emoção e deliberação)'
  };
}

/**
 * Converts a generic AcademicSource into an APA formatted entry
 */
export function formatAcademicSourceToApa(source: AcademicSource): ApaFormattedEntry {
  const cleanTitle = (source.title || '').trim();
  const authorsApa = formatToApaAuthors(source.authors || 'Autor');
  const year = source.year || '2020';
  const publisher = cleanApaPublisher(source.publication || 'Editora Acadêmica');
  const sentenceTitle = formatToApaTitle(cleanTitle);

  const isBookOrStandalone = !/journal|revista|artigo|periódico/i.test(source.publication || '');
  const titleMarkdown = isBookOrStandalone ? `*${sentenceTitle}*` : sentenceTitle;
  const titleHtml = isBookOrStandalone ? `<em>${sentenceTitle}</em>` : sentenceTitle;

  const apaPlain = `${authorsApa} (${year}). ${sentenceTitle}. ${publisher}.`;
  const apaMarkdown = `${authorsApa} (${year}). ${titleMarkdown}. ${publisher}.`;
  const apaHtml = `${authorsApa} (${year}). ${titleHtml}. ${publisher}.`;

  const firstAuthor = authorsApa.split(',')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s]/g, '').trim();
  const inTextShort = authorsApa.includes('&') || authorsApa.includes(',')
    ? `(${firstAuthor} et al., ${year})`
    : `(${firstAuthor}, ${year})`;

  // ABNT
  const authorsAbnt = (source.authors || 'AUTOR').toUpperCase();
  const abntFormat = `${authorsAbnt}. ${cleanTitle}. ${source.publication || 'Editora'}, ${year}.`;

  return {
    id: source.id || `source-${Date.now()}-${Math.random()}`,
    category: (source.category || 'theological') as any,
    sortKey: firstAuthor,
    authors: authorsApa,
    year,
    title: cleanTitle,
    publication: publisher,
    apaPlain,
    apaMarkdown,
    apaHtml,
    apaInText: inTextShort,
    abntFormat,
    citationShort: `(${firstAuthor.toUpperCase()}, ${year})`,
    keyFinding: source.keyFindings,
    biblicalConnection: source.biblicalConnection
  };
}

/**
 * Sorts APA entries strictly alphabetically by author last name / sort key
 */
export function sortApaEntriesAlphabetically(entries: ApaFormattedEntry[]): ApaFormattedEntry[] {
  return [...entries].sort((a, b) => {
    const keyA = (a.sortKey || a.authors || a.title).toLowerCase().replace(/^(the|a|an|o|a|os|as)\s+/i, '');
    const keyB = (b.sortKey || b.authors || b.title).toLowerCase().replace(/^(the|a|an|o|a|os|as)\s+/i, '');
    return keyA.localeCompare(keyB, 'pt-BR');
  });
}

/**
 * Compiles the entire article and appends the rigorously formatted APA 7th bibliography.
 * Strips any unformatted or duplicate references section already at the bottom of the article.
 */
export function buildArticleWithApaBibliography(
  articleText: string,
  references: ApaFormattedEntry[],
  format: 'markdown' | 'plaintext' | 'html',
  theme?: string
): string {
  if (!articleText) return '';

  // 1. Remove existing trailing references section from article if present
  let cleanBody = articleText.replace(
    /(?:^|\n)#{1,4}\s*(?:.*?(?:refer[êe]ncias|bibliografia|fontes acad[êe]micas|references))[\s\S]*$/i,
    ''
  ).trim();

  // 2. Sort references alphabetically according to APA 7th rules
  const sorted = sortApaEntriesAlphabetically(references);

  if (format === 'markdown') {
    const biblioMarkdown = sorted
      .map(ref => `${ref.apaMarkdown}\n\n> *Citação no texto:* ${ref.apaInText}${ref.keyFinding ? ` — **Nota analítica:** ${ref.keyFinding}` : ''}`)
      .join('\n\n');

    return `${cleanBody}

---

## References (APA 7th Edition)

${biblioMarkdown}

---
*Artigo acadêmico-estratégico compilado via Nexus S.A. com referências formatadas segundo o Manual de Publicação da American Psychological Association (7ª edição).*`;
  }

  if (format === 'plaintext') {
    const biblioPlain = sorted
      .map((ref, i) => `[${i + 1}] ${ref.apaPlain}\n    Citação no texto: ${ref.apaInText}${ref.keyFinding ? `\n    Constatação-chave: ${ref.keyFinding}` : ''}`)
      .join('\n\n');

    return `${cleanBody}

================================================================================
REFERENCES (APA 7th Edition — American Psychological Association)
Tema: ${theme || 'Ensaio Bíblico-Acadêmico'}
================================================================================

${biblioPlain}

================================================================================
Documento gerado com rigor científico e hermenêutico via Nexus S.A.
================================================================================`;
  }

  // HTML format (ideal for importing into Word / Google Docs)
  const biblioHtml = sorted
    .map(ref => `<p style="padding-left: 2rem; text-indent: -2rem; margin-bottom: 0.8rem; line-height: 1.6; font-family: 'Times New Roman', Times, serif;">${ref.apaHtml} <span style="color: #666; font-size: 0.9em;">[Citação: ${ref.apaInText}]</span></p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${theme || 'Artigo com Bibliografia APA 7ª Edição'}</title>
<style>
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2.0; margin: 1in; color: #111; }
h1, h2, h3 { font-family: Arial, sans-serif; font-weight: bold; }
h1 { font-size: 18pt; text-align: center; }
h2 { font-size: 14pt; margin-top: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
.hanging-indent { padding-left: 0.5in; text-indent: -0.5in; margin-bottom: 1em; }
</style>
</head>
<body>
<div class="article-body">
${cleanBody.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}
</div>

<hr style="margin: 2em 0;" />

<h2>References</h2>
<div class="references-list">
${biblioHtml}
</div>
</body>
</html>`;
}

/**
 * Master compiler that extracts and builds all APA references for a given project state
 */
export function compileAllReferencesForProject(
  sources: AcademicSource[] = [],
  articleText: string = '',
  passageText: string = '',
  theme: string = '',
  customReferences: ApaFormattedEntry[] = []
): ApaFormattedEntry[] {
  const list: ApaFormattedEntry[] = [];
  const seenTitles = new Set<string>();

  // A. Sources from Etapa 2
  sources.forEach(s => {
    const cleanTitle = (s.title || '').trim();
    if (!cleanTitle || seenTitles.has(cleanTitle.toLowerCase())) return;
    seenTitles.add(cleanTitle.toLowerCase());
    list.push(formatAcademicSourceToApa(s));
  });

  // B. Biblical Books
  const combinedCorpus = `${passageText} ${articleText} ${theme}`;
  const biblicalBooks = [
    { name: 'Provérbios', abbr: 'Pv', test: /\b(prov[ée]rbios|pv)\b/i },
    { name: 'Romanos', abbr: 'Rm', test: /\b(romanos|rm)\b/i },
    { name: 'Mateus', abbr: 'Mt', test: /\b(mateus|mt)\b/i },
    { name: 'Hebreus', abbr: 'Hb', test: /\b(hebreus|hb)\b/i },
    { name: 'Salmos', abbr: 'Sl', test: /\b(salmos|sl)\b/i },
    { name: '1 Coríntios', abbr: '1Co', test: /\b(1\s*cor[ií]ntios|1co)\b/i },
    { name: '2 Coríntios', abbr: '2Co', test: /\b(2\s*cor[ií]ntios|2co)\b/i },
    { name: 'Efésios', abbr: 'Ef', test: /\b(ef[ée]sios|ef)\b/i },
    { name: 'Gênesis', abbr: 'Gn', test: /\b(g[êe]nesis|gn)\b/i },
    { name: 'Deuteronômio', abbr: 'Dt', test: /\b(deuteron[ôo]mio|dt)\b/i },
    { name: 'Filipenses', abbr: 'Fp', test: /\b(filipenses|fp)\b/i },
    { name: 'Colossenses', abbr: 'Cl', test: /\b(colossenses|cl)\b/i },
    { name: 'Tiago', abbr: 'Tg', test: /\b(tiago|tg)\b/i },
    { name: 'Isaías', abbr: 'Is', test: /\b(isa[íi]as|is)\b/i },
    { name: 'Jeremias', abbr: 'Jr', test: /\b(jeremias|jr)\b/i },
    { name: 'Lucas', abbr: 'Lc', test: /\b(lucas|lc)\b/i },
    { name: 'João', abbr: 'Jo', test: /\b(jo[ãa]o|jo)\b/i },
    { name: 'Atos', abbr: 'At', test: /\b(atos|at)\b/i },
    { name: 'Gálatas', abbr: 'Gl', test: /\b(g[áa]latas|gl)\b/i },
    { name: '1 Tessalonicenses', abbr: '1Ts', test: /\b(1\s*tessalonicenses|1ts)\b/i },
    { name: '1 Timóteo', abbr: '1Tm', test: /\b(1\s*tim[óo]teo|1tm)\b/i },
    { name: '2 Timóteo', abbr: '2Tm', test: /\b(2\s*tim[óo]teo|2tm)\b/i },
    { name: 'Apocalipse', abbr: 'Ap', test: /\b(apocalipse|ap)\b/i }
  ];

  const detectedBooks: string[] = [];
  biblicalBooks.forEach(b => {
    if (b.test.test(combinedCorpus)) {
      detectedBooks.push(b.name);
    }
  });

  const hasBibleCorpus = detectedBooks.length > 0 || Boolean(passageText && passageText.trim().length > 0);
  if (hasBibleCorpus && !seenTitles.has('bíblia sagrada')) {
    seenTitles.add('bíblia sagrada');
    const booksLabel = detectedBooks.length > 0 ? detectedBooks.join(', ') : 'Cânon Sagrado (AT e NT)';
    list.push(createBiblicalApaEntry(booksLabel));
  }

  // C. Lexicons
  const hasGreek = /\b(nous|kardia|dianoia|psyche|pneuma|soma|sarx|charis|agape|splagchnon|phronema)\b/i.test(combinedCorpus) ||
    /[\u0370-\u03FF]/.test(combinedCorpus);
  const hasHebrew = /\b(lev|levav|nephesh|ruach|kilyot|me'im|rachamim|basar|manda|yetzer)\b/i.test(combinedCorpus) ||
    /[\u0590-\u05FF]/.test(combinedCorpus);

  if (hasGreek && !seenTitles.has('bdag')) {
    seenTitles.add('bdag');
    list.push(createBdagApaEntry());
  }

  if (hasHebrew && !seenTitles.has('halot')) {
    seenTitles.add('halot');
    list.push(createHalotApaEntry());
  }

  // D. Neuroscience
  const hasNeuroscience = /\b(neuroci[êe]ncia|neuroplasticidade|c[óo]rtex\s*pr[ée]-frontal|am[íi]gdala|sinapse|dopamina|neur[ôo]nio|psicossom[áa]tic[ao]|cogni[çc][ãa]o|mieliniza[çc][ãa]o)\b/i.test(combinedCorpus);
  if (hasNeuroscience && !seenTitles.has('kandel')) {
    seenTitles.add('kandel');
    list.push(createKandelApaEntry());
  }

  if (hasNeuroscience && !seenTitles.has('ledoux')) {
    seenTitles.add('ledoux');
    list.push(createLeDouxApaEntry());
  }

  const hasDamasio = /\b(dam[áa]sio|marcador\s*som[áa]tico|descartes|emo[çc][ãa]o\s*e\s*raz[ãa]o|decis[ãa]o)\b/i.test(combinedCorpus);
  if (hasDamasio && !seenTitles.has('damasio')) {
    seenTitles.add('damasio');
    list.push(createDamasioApaEntry());
  }

  // E. Extracted from Article Markdown
  const refMatch = articleText.match(/(?:^|\n)#{1,4}\s*(?:.*?(?:refer[êe]ncias|bibliografia|fontes acad[êe]micas|references))[\s\S]*/i);
  if (refMatch) {
    const refSection = refMatch[0];
    const lines = refSection.split('\n').filter(l => l.trim().length > 0);
    lines.forEach((line, idx) => {
      const cleanLine = line.replace(/^#{1,4}.*$/i, '').replace(/^[*-]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleanLine.length > 25 && !cleanLine.startsWith('#')) {
        const isDuplicate = list.some(item => cleanLine.toLowerCase().includes(item.title.toLowerCase().slice(0, 20)));
        if (!isDuplicate && !seenTitles.has(cleanLine.toLowerCase().slice(0, 30))) {
          seenTitles.add(cleanLine.toLowerCase().slice(0, 30));
          const cat = cleanLine.toLowerCase().includes('bible') || cleanLine.toLowerCase().includes('bíblia') || cleanLine.toLowerCase().includes('almeida')
            ? 'biblical'
            : cleanLine.toLowerCase().includes('neuro') || cleanLine.toLowerCase().includes('brain') || cleanLine.toLowerCase().includes('cortex')
            ? 'neuroscience'
            : cleanLine.toLowerCase().includes('lexicon') || cleanLine.toLowerCase().includes('léxico') || cleanLine.toLowerCase().includes('dicionário')
            ? 'lexicon'
            : 'theological';

          const authors = formatToApaAuthors(cleanLine.split('.')[0] || 'Autor');
          const title = cleanLine.split('.')[1] || cleanLine;
          const sentenceTitle = formatToApaTitle(title);
          const firstAuthor = authors.split(',')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêîôûÂÊÎÔÛçÇ\s]/g, '').trim();

          list.push({
            id: `extracted-${idx}`,
            category: cat as any,
            sortKey: firstAuthor,
            title: cleanLine,
            authors,
            year: (cleanLine.match(/\b(19\d\d|20\d\d)\b/) || ['2020'])[0],
            publication: 'Obra acadêmica citada',
            apaPlain: cleanLine,
            apaMarkdown: cleanLine,
            apaHtml: cleanLine,
            apaInText: `(${firstAuthor}, 2020)`,
            abntFormat: cleanLine,
            citationShort: `(Fonte Citada, ${cleanLine.slice(0, 15)})`,
            keyFinding: 'Referência bibliográfica extraída diretamente do texto do artigo.'
          });
        }
      }
    });
  }

  // Add custom references
  customReferences.forEach(cr => {
    if (!seenTitles.has(cr.title.toLowerCase())) {
      list.push(cr);
    }
  });

  return sortApaEntriesAlphabetically(list);
}
