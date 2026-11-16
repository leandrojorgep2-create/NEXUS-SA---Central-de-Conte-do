/**
 * Database of Theological & Lexical terms from standard scholarly lexicons:
 * - BDAG: Bauer, Danker, Arndt, Gingrich Greek-English Lexicon of the NT (3rd ed.)
 * - HALOT: Koehler, Baumgartner, Stamm Hebrew and Aramaic Lexicon of the OT
 * - Scholarly Biblical Theology & Philology (BDB, NA28, BHS, LXX)
 */

import { AcademicSource } from '../types';

export interface LexiconEntry {
  id: string;
  originalWord: string;
  transliteration: string;
  language: 'hebrew' | 'greek' | 'latin';
  lexicon: 'BDAG' | 'HALOT' | 'BDB' | 'HISTÓRICO';
  lexiconReference: string;
  shortDefinition: string;
  detailedDefinition: string;
  anatomicalVolitionalFunction: string;
  biblicalPassages: string[];
  neuroscienceConnection?: string;
  pronunciation?: string;
  category: 'volition' | 'cognition' | 'emotion' | 'ontology' | 'covenant' | 'theology';
  matchKeywords: string[];
  matchRegex: RegExp;
  isCustom?: boolean;
}

export const BASE_LEXICON_DATABASE: LexiconEntry[] = [
  // ==========================================
  // HALOT (HEBRAICO & ARAMAICO - ANTIGO TESTAMENTO)
  // ==========================================
  {
    id: 'halot-lev',
    originalWord: 'לֵב / לֵבָב',
    transliteration: 'Lev / Levav',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #4474 • BDB 523 • Strong H3820/H3824',
    shortDefinition: 'Centro de discernimento deliberativo, volição, juízo moral e planejamento consciente.',
    detailedDefinition: 'Na antropologia semítica do Antigo Testamento, o Lev é a sede soberana da vontade, deliberação intelectual e intenções secretas. Ao contrário do uso contemporâneo (que restringe "coração" a sentimentos emotivos), no hebraico o Lev é o órgão de reflexão, tomada de decisão e autogoverno.',
    anatomicalVolitionalFunction: 'Equivalente funcional aos circuitos do córtex pré-frontal dorsolateral e ventromedial integrados à tomada de decisão executiva.',
    biblicalPassages: ['Provérbios 4:23', 'Deuteronômio 6:5', 'Salmos 51:10', 'Jeremias 17:9-10'],
    neuroscienceConnection: 'Regulação volitiva inibitória (Top-Down control), onde o córtex pré-frontal modula reações impulsivas da amígdala.',
    pronunciation: 'Lêv / Leváv',
    category: 'volition',
    matchKeywords: ['lev', 'levav', 'coração hebraico', 'לֵב', 'לֵבָב'],
    matchRegex: /\b(levav|lev|לֵבָב|לֵב)\b/i
  },
  {
    id: 'halot-nephesh',
    originalWord: 'נֶפֶשׁ',
    transliteration: 'Nephesh',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #6195 • BDB 659 • Strong H5315',
    shortDefinition: 'Ser vivente, fôlego de vida, sede dos apetites vitais; a pessoa inteira em sua corporeidade.',
    detailedDefinition: 'A totalidade psicossomática da pessoa humana animada pela respiração de Deus. Não designa uma alma desencarnada platônica, mas a criatura viva em sua vulnerabilidade física, anseios vitais, garganta, apetite e identidade relacional.',
    anatomicalVolitionalFunction: 'Unidade somática e biológica da vida; impulsos homeostáticos fundamentais da sobrevivência.',
    biblicalPassages: ['Gênesis 2:7', 'Salmos 42:1-2', 'Deuteronômio 12:20'],
    neuroscienceConnection: 'Tronco encefálico e hipotálamo coordenando pulsões biológicas e manutenção do equilíbrio fisiológico.',
    pronunciation: 'Né-fesh',
    category: 'ontology',
    matchKeywords: ['nephesh', 'nefesh', 'alma hebraica', 'נֶפֶשׁ'],
    matchRegex: /\b(nephesh|nefesh|נֶפֶשׁ)\b/i
  },
  {
    id: 'halot-ruach',
    originalWord: 'רוּחַ',
    transliteration: 'Ruach',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #8450 • BDB 924 • Strong H7307',
    shortDefinition: 'Vento, fôlego dinâmico, energia vital divina e disposição anímica que move o agir.',
    detailedDefinition: 'Vento vigoroso, respiração imperceptível mas poderosa concedida por Deus. Refere-se tanto ao princípio vital invisível que anima a carne mortal quanto à disposição interior de coragem, ânimo moral ou influência direta do Espírito de Deus.',
    anatomicalVolitionalFunction: 'Impulso dinâmico ativador do comportamento e vitalidade existencial.',
    biblicalPassages: ['Gênesis 1:2', 'Ezequiel 37:9-14', 'Provérbios 16:32', 'Jó 33:4'],
    neuroscienceConnection: 'Nível de ativação cortical (arousal), vitalidade autonômica e resiliência intrínseca.',
    pronunciation: 'Rú-ach',
    category: 'theology',
    matchKeywords: ['ruach', 'ruah', 'espírito hebraico', 'רוּחַ'],
    matchRegex: /\b(ruach|ruah|רוּחַ)\b/i
  },
  {
    id: 'halot-kilyot',
    originalWord: 'כְּלָיוֹת',
    transliteration: 'Kilyot',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #4290 • BDB 480 • Strong H3629',
    shortDefinition: 'Rins; o santuário das emoções viscerais inconscientes, anseios secretos e discernimento noturno.',
    detailedDefinition: 'Os rins, situados no âmago anatômico do corpo, eram compreendidos como a camada mais protegida e íntima da psicologia humana. É a sede dos sentimentos viscerais, dos impulsos morais noturnos e das reações somáticas que Deus investiga ao lado do Lev.',
    anatomicalVolitionalFunction: 'Respostas autonômicas profundas e marcadores somáticos involuntários de convicção ética.',
    biblicalPassages: ['Salmos 16:7', 'Jeremias 17:10', 'Salmos 139:13', 'Salmos 7:9'],
    neuroscienceConnection: 'Eixo hipotálamo-hipófise-adrenal (HPA) e marcadores somáticos de intuição visceral descritos por António Damásio.',
    pronunciation: 'Kili-yôt',
    category: 'emotion',
    matchKeywords: ['kilyot', 'kilyoth', 'rins hebraicos', 'כְּלָיוֹת'],
    matchRegex: /\b(kilyot|kilyoth|כְּלָיוֹת)\b/i
  },
  {
    id: 'halot-meim',
    originalWord: 'מֵעִים',
    transliteration: "Me'im",
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #5422 • BDB 588 • Strong H4578',
    shortDefinition: 'Entranhas, vísceras; sede das comoções emotivas intensas, empatia e compaixão corporal.',
    detailedDefinition: 'Designa os órgãos abdominais internos. Na poesia bíblica, é o lugar onde a dor relacional, a piedade e o sofrimento alheio produzem repercussões corporais palpáveis ("minhas entranhas se comovem").',
    anatomicalVolitionalFunction: 'Reatividade visceral entérica gerada pelo sofrimento empático.',
    biblicalPassages: ['Isaías 63:15', 'Jeremias 31:20', 'Cânticos 5:4'],
    neuroscienceConnection: 'Sistema nervoso entérico ("segundo cérebro") e sinalização parassimpática mediada pelo nervo vago.',
    pronunciation: "Me-ím",
    category: 'emotion',
    matchKeywords: ["me'im", 'meim', 'entranhas hebraicas', 'מֵעִים'],
    matchRegex: /\b(me'?im|מֵעִים)\b/i
  },
  {
    id: 'halot-hesed',
    originalWord: 'חֶסֶד',
    transliteration: 'Hesed / Chesed',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #3074 • BDB 338 • Strong H2617',
    shortDefinition: 'Amor leal da aliança, fidelidade inabalável, misericórdia ativa fundamentada em promessa solene.',
    detailedDefinition: 'Uma das palavras teológicas mais densas da Bíblia: não expressa mero sentimentalismo efêmero, mas o compromisso resoluto, confiável e generoso de cumprir a aliança mesmo diante da quebra ou indignidade da outra parte.',
    anatomicalVolitionalFunction: 'Estabilidade comportamental fundamentada em pacto de longo prazo.',
    biblicalPassages: ['Êxodo 34:6-7', 'Salmos 136:1', 'Miqueias 6:8', 'Oséias 6:6'],
    neuroscienceConnection: 'Apego seguro e circuitos de vinculação social de longo prazo mediados por oxitocina e vasopressina.',
    pronunciation: 'Ché-sed',
    category: 'covenant',
    matchKeywords: ['hesed', 'chesed', 'amor leal', 'חֶסֶד'],
    matchRegex: /\b(hesed|chesed|חֶסֶד)\b/i
  },
  {
    id: 'halot-yetzer',
    originalWord: 'יֵצֶר',
    transliteration: 'Yetzer',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #3970 • BDB 428 • Strong H3336',
    shortDefinition: 'Inclinação interior, molde mental, impulso imaginativo forjado no coração.',
    detailedDefinition: 'Derivado da raiz de "oleiro/moldar" (yatsar). Designa a estrutura ou configuração habitual dos pensamentos humanos, a predisposição interna para o bem (yetzer tov) ou para o egoísmo (yetzer hara).',
    anatomicalVolitionalFunction: 'Mapas neurais pré-estabelecidos e padrões consolidados de viés cognitivo.',
    biblicalPassages: ['Gênesis 6:5', 'Gênesis 8:21', 'Isaías 26:3'],
    neuroscienceConnection: 'Vias sinápticas consolidadas por potenciação de longa duração (LTP de Kandel).',
    pronunciation: 'Yê-tzer',
    category: 'cognition',
    matchKeywords: ['yetzer', 'yetser', 'inclinação hebraica', 'יֵצֶר'],
    matchRegex: /\b(yetzer|yetser|יֵצֶר)\b/i
  },
  {
    id: 'halot-kabod',
    originalWord: 'כָּבוֹד',
    transliteration: 'Kabod / Kavod',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #4110 • BDB 457 • Strong H3519',
    shortDefinition: 'Peso, densidade moral, honra majestosa e substância tangível da glória de Deus.',
    detailedDefinition: 'Radica na ideia de peso ("o que é pesado/grave"). Representa a autoridade intrínseca indiscutível, honra sólida e a manifestação luminosa ou palpável da presença transcendente de Deus.',
    anatomicalVolitionalFunction: 'Reconhecimento da hierarquia de valores supremos e reverência axiológica.',
    biblicalPassages: ['Êxodo 33:18', 'Salmos 19:1', 'Isaías 6:3'],
    neuroscienceConnection: 'Sentimento de assombro (Awe) gerador de quietude na rede de modo padrão (DMN) e aumento de generosidade social.',
    pronunciation: 'Ka-vôd',
    category: 'theology',
    matchKeywords: ['kabod', 'kavod', 'glória hebraica', 'כָּבוֹד'],
    matchRegex: /\b(kabod|kavod|כָּבוֹד)\b/i
  },
  {
    id: 'halot-shalom',
    originalWord: 'שָׁלוֹם',
    transliteration: 'Shalom',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #9403 • BDB 1022 • Strong H7965',
    shortDefinition: 'Integridade holística, integridade relacional, harmonia cósmica e inteireza existencial.',
    detailedDefinition: 'Muito além da simples ausência de conflitos bélicos; significa a ordem benéfica da criação em funcionamento perfeito: bem-estar biopsicossocial, justiça distributiva e harmonia pacífica com Deus, com o próximo e com a terra.',
    anatomicalVolitionalFunction: 'Equilíbrio homeostático global e tranquilidade no processamento cognitivo.',
    biblicalPassages: ['Números 6:26', 'Isaías 9:6', 'Jeremias 29:11'],
    neuroscienceConnection: 'Predominância do tônus vagal parassimpático, diminuição do cortisol e regulação da pressão arterial.',
    pronunciation: 'Sha-lôm',
    category: 'covenant',
    matchKeywords: ['shalom', 'chalom', 'שָׁלוֹם'],
    matchRegex: /\b(shalom|שָׁלוֹם)\b/i
  },
  {
    id: 'halot-hokhmah',
    originalWord: 'חָכְמָה',
    transliteration: 'Hokhmah / Chokmah',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'HALOT #2940 • BDB 315 • Strong H2451',
    shortDefinition: 'Sabedoria prática, maestria existencial, perícia ética em alinhar a vida à realidade de Deus.',
    detailedDefinition: 'Não mera especulação filosófica abstrata, mas habilidade pragmática de agir com retidão, cautela e discernimento construtivo nas complexidades do cotidiano moral.',
    anatomicalVolitionalFunction: 'Integração entre memória de longo prazo, controle inibitório e antecipação de consequências futuras.',
    biblicalPassages: ['Provérbios 3:13-18', 'Provérbios 8:22', 'Êxodo 31:3'],
    neuroscienceConnection: 'Funções executivas maduras e maturidade dos circuitos orbitofrontais na ponderação risco-recompensa.',
    pronunciation: 'Roc-má',
    category: 'cognition',
    matchKeywords: ['hokhmah', 'chokmah', 'sabedoria hebraica', 'חָכְמָה'],
    matchRegex: /\b(hokhmah|chokmah|חָכְמָה)\b/i
  },

  // ==========================================
  // BDAG (GREGO KOINE - NOVO TESTAMENTO)
  // ==========================================
  {
    id: 'bdag-nous',
    originalWord: 'Νοῦς',
    transliteration: 'Nous',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 680 • Strong G3563',
    shortDefinition: 'Mente, faculdade de discernimento moral, percepção reflexiva e capacidade intelectiva de juízo.',
    detailedDefinition: 'Em Paulo (Rm 12:2), o Nous não é mero intelecto frio, mas a capacidade racional-reflexiva de percepção ética e avaliação moral que foi obscurecida pela corrupção, mas que é renovada pelo Espírito para discernir a vontade de Deus.',
    anatomicalVolitionalFunction: 'Estrutura superior de processamento cognitivo deliberativo e formulação de valores morais.',
    biblicalPassages: ['Romanos 12:2', '1 Coríntios 2:16', 'Filipenses 4:7', 'Lucas 24:45'],
    neuroscienceConnection: 'Córtex pré-frontal dorsolateral (DLPFC) e redes neurais de flexibilidade cognitiva e reavaliação consciente.',
    pronunciation: 'Nûs',
    category: 'cognition',
    matchKeywords: ['nous', 'mente paulina', 'νοῦς', 'νοῦ'],
    matchRegex: /\b(nous|νοῦς|νοῦ)\b/i
  },
  {
    id: 'bdag-kardia',
    originalWord: 'Καρδία',
    transliteration: 'Kardia',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 508 • Strong G2588',
    shortDefinition: 'Coração; o núcleo unificado da personalidade humana, deliberando entre fé, afeições e ações.',
    detailedDefinition: 'Tradução grega do Lev veterotestamentário no NT. Centro interior onde convergem a vida espiritual, as emoções sentidas, a inteligência ativa e a determinação de escolha. É o santuário interior que Deus perscruta.',
    anatomicalVolitionalFunction: 'Núcleo integrador de afetos, razão e comando executivo da vontade.',
    biblicalPassages: ['Lucas 6:45', 'Romanos 10:10', 'Efésios 3:17', 'Hebreus 4:12'],
    neuroscienceConnection: 'Complexo corticolímbico (córtex pré-frontal ventromedial, giro do cíngulo anterior e amígdala).',
    pronunciation: 'Kar-dí-a',
    category: 'volition',
    matchKeywords: ['kardia', 'coração grego', 'καρδία', 'καρδίας'],
    matchRegex: /\b(kardia|καρδία|καρδίας)\b/i
  },
  {
    id: 'bdag-splagchnon',
    originalWord: 'Σπλάγχνον / Σπλάγχνα',
    transliteration: 'Splagchnon / Splagchna',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 938 • Strong G4698',
    shortDefinition: 'Entranhas viscerais; ternura compassiva profunda e misericórdia visceral e comovente.',
    detailedDefinition: 'Anatomicamente: os órgãos nobres internos (coração, pulmões, fígado, intestino). Em sentido moral figurado: a compaixão mais genuína e visceral, que não fica na teoria mas impele ao socorro prático com ardor.',
    anatomicalVolitionalFunction: 'Repercussão autonômica visceral de empatia e solidariedade ao sofrimento.',
    biblicalPassages: ['Colossenses 3:12', 'Lucas 1:78', 'Filemon 1:7', '1 João 3:17'],
    neuroscienceConnection: 'Insula anterior (centro de interocepção somática e empatia para dor alheia) e circuitos de compaixão vagal.',
    pronunciation: 'Splánch-non / Splánch-na',
    category: 'emotion',
    matchKeywords: ['splagchnon', 'splagchna', 'compaixão visceral', 'σπλάγχνα', 'σπλάγχνον'],
    matchRegex: /\b(splagchnon|splagchna|splangchnon|splangchna|σπλάγχνα|σπλάγχνον)\b/i
  },
  {
    id: 'bdag-anakainosis',
    originalWord: 'Ἀνακαίνωσις',
    transliteration: 'Anakainōsis',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 64 • Strong G342',
    shortDefinition: 'Renovação qualitativa, reconstrução estrutural da mente que remodela o discernimento.',
    detailedDefinition: 'Composto por ana (para cima/de novo) e kainos (novo em qualidade, não apenas cronológico). Descreve o processo progressivo pelo qual a mente é estruturalmente remodelada para operar sob uma nova natureza.',
    anatomicalVolitionalFunction: 'Reconfiguração plástica dos padrões de pensamento e automatismos prévios.',
    biblicalPassages: ['Romanos 12:2', 'Tito 3:5', 'Colossenses 3:10'],
    neuroscienceConnection: 'Neuroplasticidade adaptativa, neurogênese e remodelagem sináptica resultante do foco intencional repetido.',
    pronunciation: 'A-na-kai-nô-sis',
    category: 'cognition',
    matchKeywords: ['anakainosis', 'anakainōsis', 'renovação da mente', 'ἀνακαίνωσις'],
    matchRegex: /\b(anakainosis|anakainōsis|ἀνακαίνωσις)\b/i
  },
  {
    id: 'bdag-metanoia',
    originalWord: 'Μετάνοια',
    transliteration: 'Metanoia',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 640 • Strong G3341',
    shortDefinition: 'Mudança radical de mentalidade, reconfiguração do eixo da cosmovisão e redirecionamento de vida.',
    detailedDefinition: 'Meta (mudança/além) + noeo (perceber/compreender). Longe de ser mera culpa emotiva ou remorso estéril, é uma mudança lúcida de pressupostos cognitivos, valores axiológicos e direção da conduta pessoal.',
    anatomicalVolitionalFunction: 'Reversão de decisões e reorganização profunda do sistema de crenças e valores.',
    biblicalPassages: ['Marcos 1:15', 'Atos 2:38', '2 Coríntios 7:10', 'Lucas 13:3'],
    neuroscienceConnection: 'Reestruturação de paradigmas cognitivos e reprogramação de esquemas comportamentais no córtex frontal.',
    pronunciation: 'Me-tá-noi-a',
    category: 'volition',
    matchKeywords: ['metanoia', 'arrependimento bíblico', 'μετάνοια'],
    matchRegex: /\b(metanoia|μετάνοια)\b/i
  },
  {
    id: 'bdag-phronema',
    originalWord: 'Φρόνημα',
    transliteration: 'Phronēma',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 1066 • Strong G5427',
    shortDefinition: 'Padrão mental fixo, mentalidade predominante, orientação fundamental do pensamento.',
    detailedDefinition: 'A tendência habitual ou o vetor de direção do pensamento. Em Paulo (Rm 8:6), o "phronēma da carne" é o apego cego à autossuficiência e à mortalidade, enquanto o "phronēma do Espírito" é vida, estabilidade e paz.',
    anatomicalVolitionalFunction: 'Esquema cognitivo nuclear que governa a interpretação espontânea dos estímulos.',
    biblicalPassages: ['Romanos 8:6-7', 'Romanos 8:27'],
    neuroscienceConnection: 'Rede de Modo Padrão (DMN) e narrativa de autorreferência que define a identidade subjetiva.',
    pronunciation: 'Frô-ne-ma',
    category: 'cognition',
    matchKeywords: ['phronema', 'phronēma', 'mentalidade grega', 'φρόνημα'],
    matchRegex: /\b(phronema|phronēma|φρόνημα)\b/i
  },
  {
    id: 'bdag-dianoia',
    originalWord: 'Διάνοια',
    transliteration: 'Dianoia',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 234 • Strong G1271',
    shortDefinition: 'Faculdade reflexiva de raciocínio crítico, intelecto analítico e lucidez mental.',
    detailedDefinition: 'Dia (através) + nous (mente). A atividade analítica e discursiva da razão; a habilidade de conectar premissas, investigar causas e chegar a juízos lúcidos em submissão à verdade divina.',
    anatomicalVolitionalFunction: 'Raciocínio lógico dedutivo e discernimento ponderado.',
    biblicalPassages: ['Mateus 22:37', '1 Pedro 1:13', 'Efésios 4:18', 'Hebreus 8:10'],
    neuroscienceConnection: 'Ativação do córtex pré-frontal e rede fronto-parietal de controle atencional.',
    pronunciation: 'Di-á-noi-a',
    category: 'cognition',
    matchKeywords: ['dianoia', 'entendimento grego', 'διάνοια'],
    matchRegex: /\b(dianoia|διάνοια)\b/i
  },
  {
    id: 'bdag-sarx',
    originalWord: 'Σάρξ',
    transliteration: 'Sarx',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 914 • Strong G4561',
    shortDefinition: 'Carne; a natureza humana caída governada pela impulsividade reativa, fragilidade e egocentrismo.',
    detailedDefinition: 'Além da substância física muscular, no sentido teológico paulino a Sarx é a condição humana corrompida que busca viver de forma independente de Deus, sujeita a automatismos de autopreservação e cobiça.',
    anatomicalVolitionalFunction: 'Reatividade impulsiva inconsciente e busca desregrada de recompensa imediata.',
    biblicalPassages: ['Gálatas 5:16-17', 'Romanos 7:18', 'Romanos 8:3-8'],
    neuroscienceConnection: 'Reatividade estriatal da dopamina desprovida de freio inibitório pré-frontal.',
    pronunciation: 'Sárx',
    category: 'ontology',
    matchKeywords: ['sarx', 'carne paulina', 'σάρξ', 'σαρκός'],
    matchRegex: /\b(sarx|σαρκός|σάρξ)\b/i
  },
  {
    id: 'bdag-pneuma',
    originalWord: 'Πνεῦμα',
    transliteration: 'Pneuma',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 832 • Strong G4151',
    shortDefinition: 'Espírito; a presença transcendente de Deus, o Espírito Santo comunicador da vida e a dimensão espiritual do ser.',
    detailedDefinition: 'O princípio vital divino e a Terceira Pessoa da Trindade que habita o ser humano regenerado, capacitando-o com sabedoria, comunhão íntima e vitória sobre as compulsões carnais.',
    anatomicalVolitionalFunction: 'Fonte de transcendência moral, elevação axiológica e comunhão espiritual.',
    biblicalPassages: ['João 4:24', 'Romanos 8:14-16', 'Gálatas 5:22-23', '1 Coríntios 2:11'],
    neuroscienceConnection: 'Estados de regulação emocional positiva, bem-estar autêntico e coerência cardíaca-cerebral.',
    pronunciation: 'Pnév-ma',
    category: 'theology',
    matchKeywords: ['pneuma', 'espírito grego', 'πνεῦμα', 'πνεύματος'],
    matchRegex: /\b(pneuma|πνεῦμα|πνεύματος)\b/i
  },
  {
    id: 'bdag-charis',
    originalWord: 'Χάρις',
    transliteration: 'Charis',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 1079 • Strong G5485',
    shortDefinition: 'Graça; generosidade benevolente soberana, favor imerecido e poder divino atuante.',
    detailedDefinition: 'Não apenas um conceito jurídico estático, mas a generosidade amorosa incondicional de Deus que salva o pecador e fornece a capacitação interior diária necessária para superar os limites da natureza humana.',
    anatomicalVolitionalFunction: 'Poder habilitador que rompe o ciclo de ansiedade por autojustificação.',
    biblicalPassages: ['Efésios 2:8-9', 'Romanos 5:1-2', '2 Coríntios 12:9', 'Tito 2:11'],
    neuroscienceConnection: 'Desativação da resposta crônica de ameaça / vergonha gerada pela culpa e redução do cortisol basal.',
    pronunciation: 'Chá-ris',
    category: 'covenant',
    matchKeywords: ['charis', 'graça grega', 'χάρις', 'χάριτος'],
    matchRegex: /\b(charis|χάρις|χάριτος)\b/i
  },
  {
    id: 'bdag-agape',
    originalWord: 'Ἀγάπη',
    transliteration: 'Agapē',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 6 • Strong G26',
    shortDefinition: 'Amor sacrificial, deliberado e incondicional que busca ativamente o maior bem do outro.',
    detailedDefinition: 'A forma mais sublime de amor nas Escrituras. Não se ancora na atração física ou na reciprocidade de méritos, mas na escolha deliberada da vontade de valorizar, proteger e se doar pelo benefício da outra pessoa.',
    anatomicalVolitionalFunction: 'Decisão volitiva de generosidade orientada ao bem supremo da comunidade.',
    biblicalPassages: ['1 Coríntios 13:4-8', 'João 3:16', '1 João 4:8', 'Romanos 5:8'],
    neuroscienceConnection: 'Circuitos fronto-estriatais de recompensa social altruísta e empatia pró-social.',
    pronunciation: 'A-gá-pē',
    category: 'covenant',
    matchKeywords: ['agape', 'agapē', 'amor ágape', 'ἀγάπη', 'ἀγάπης'],
    matchRegex: /\b(agap[eē]|ἀγάπη|ἀγάπης)\b/i
  },
  {
    id: 'bdag-psyche',
    originalWord: 'Ψυχή',
    transliteration: 'Psychē',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 1098 • Strong G5590',
    shortDefinition: 'Alma, vida consciente individual, sede da identidade e anseios existenciais humanos.',
    detailedDefinition: 'A vida biológica e pessoal em sua dimensão psicológica consciente: a capacidade de sentir, sofrer, amar e relacionar-se como sujeito individual diante do mundo.',
    anatomicalVolitionalFunction: 'Consciência em primeira pessoa e experiência subjetiva do indivíduo.',
    biblicalPassages: ['Mateus 16:26', 'Lucas 12:20', '1 Tessalonicenses 5:23'],
    neuroscienceConnection: 'Rede de saliência e consciência fenomenológica da mente.',
    pronunciation: 'Psi-chê',
    category: 'ontology',
    matchKeywords: ['psyche', 'psychē', 'alma grega', 'ψυχή', 'ψυχῆς'],
    matchRegex: /\b(psych[eē]|ψυχή|ψυχῆς)\b/i
  },
  {
    id: 'bdag-sophronismos',
    originalWord: 'Σωφρονισμός / Σωφροσύνη',
    transliteration: 'Sōphronismos / Sōphrosynē',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'BDAG p. 987 • Strong G4995/G4997',
    shortDefinition: 'Autodomínio, moderação, mente lúcida e sadia sob controle consciente e disciplinado.',
    detailedDefinition: 'Autogoverno prudente, capacidade de contenção dos próprios impulsos emocionais diante de provocações, serenidade equilibrada e bom senso orientado pela sabedoria bíblica.',
    anatomicalVolitionalFunction: 'Capacidade executiva inibitória e sobriedade nos julgamentos.',
    biblicalPassages: ['2 Timóteo 1:7', 'Tito 2:12', 'Atos 26:25'],
    neuroscienceConnection: 'Controle inibitório mediado pelo córtex pré-frontal ventrolateral e córtex cingulado anterior.',
    pronunciation: 'Sô-fro-nis-mós',
    category: 'volition',
    matchKeywords: ['sophronismos', 'sophrosyne', 'autodomínio', 'σωφρονισμός', 'σωφροσύνη'],
    matchRegex: /\b(sophronismos|sophrosyne|sōphronismos|sōphrosynē|σωφρονισμός|σωφροσύνη)\b/i
  },

  // ==========================================
  // TERMOS TEOLÓGICOS E CRÍTICA TEXTUAL
  // ==========================================
  {
    id: 'theol-coram-deo',
    originalWord: 'Coram Deo',
    transliteration: 'Coram Deo',
    language: 'latin',
    lexicon: 'HISTÓRICO',
    lexiconReference: 'Teologia Reformada & Agostiniana',
    shortDefinition: 'Diante da face de Deus: viver a totalidade da existência sob o olhar e a glória do Criador.',
    detailedDefinition: 'Expressão clássica que define a cosmovisão integral da fé bíblica: toda a vida humana (trabalho, emoções, decisões privadas e públicas) acontece na presença soberana de Deus, sob Sua autoridade e para Sua glória, abolindo a falsa divisão entre "sagrado" e "secular".',
    anatomicalVolitionalFunction: 'Alinhamento integral da consciência e dos hábitos morais sem duplicidade hipócrita.',
    biblicalPassages: ['Salmos 139:7-12', 'Gênesis 17:1', 'Colossenses 3:23-24'],
    neuroscienceConnection: 'Constância de integridade moral que reduz conflitos internos e ansiedade de dissonância cognitiva.',
    pronunciation: 'Có-ram Dé-o',
    category: 'theology',
    matchKeywords: ['coram deo', 'face de deus', 'coram'],
    matchRegex: /\b(coram\s+deo)\b/i
  },
  {
    id: 'theol-septuaginta',
    originalWord: 'Septuaginta (LXX)',
    transliteration: 'Septuaginta / LXX',
    language: 'latin',
    lexicon: 'HISTÓRICO',
    lexiconReference: 'Tradução Alexandrina ca. 250 a.C.',
    shortDefinition: 'Antiga tradução grega do Antigo Testamento hebraico, ponte filológica do Novo Testamento.',
    detailedDefinition: 'A tradução das Escrituras Hebraicas para o grego koiné realizada em Alexandria. Serviu como a Bíblia primária utilizada pelos apóstolos, Jesus e a Igreja Primitiva, fixando o vocabulário teológico grego (ex: traduzindo Lev por Kardia e Hesed por Eleos).',
    anatomicalVolitionalFunction: 'Ponte linguística canônica entre o pensamento semítico arcaico e a filosofia helenística.',
    biblicalPassages: ['Citações do AT no Evangelho de Mateus, Hebreus e Romanos'],
    category: 'theology',
    matchKeywords: ['septuaginta', 'lxx', 'versão dos setenta'],
    matchRegex: /\b(septuaginta|lxx)\b/i
  },
  {
    id: 'theol-na28',
    originalWord: 'Novum Testamentum Graece (NA28)',
    transliteration: 'Nestle-Aland 28ª Edição',
    language: 'greek',
    lexicon: 'BDAG',
    lexiconReference: 'Institut für Neutestamentliche Textforschung (INTF, Münster)',
    shortDefinition: 'Texto crítico padrão internacional do Novo Testamento grego baseado nos manuscritos mais antigos.',
    detailedDefinition: 'A edição crítica acadêmica definitiva do Novo Testamento grego que sintetiza os mais de 5.800 manuscritos gregos catalogados (papiros de Chester Beatty e Bodmer, Códice Sinaítico, Vaticano e Alexandrino). Base científica das traduções bíblicas modernas sérias.',
    anatomicalVolitionalFunction: 'Fundamentação textual arqueológica e fidelidade aos manuscritos primitivos.',
    biblicalPassages: ['Aparato crítico do Novo Testamento'],
    category: 'theology',
    matchKeywords: ['na28', 'nestle-aland', 'novum testamentum graece'],
    matchRegex: /\b(na28|nestle-aland|novum\s+testamentum)\b/i
  },
  {
    id: 'theol-bhs',
    originalWord: 'Biblia Hebraica Stuttgartensia (BHS)',
    transliteration: 'Texto Massorético (BHS)',
    language: 'hebrew',
    lexicon: 'HALOT',
    lexiconReference: 'Deutsche Bibelgesellschaft • Códice de Leningrado (1008 d.C.)',
    shortDefinition: 'Edição acadêmica definitiva do Antigo Testamento hebraico preservada pela tradição massorética.',
    detailedDefinition: 'O texto padronizado do Cânon Hebraico com sistema de pontuação vocálica e massorá meticulosamente preservado pelos escribas judeus (Massoretas), corroborado com impressionante precisão arqueológica pelos Manuscritos do Mar Morto (Qumran).',
    anatomicalVolitionalFunction: 'Preservação histórica inalterada dos vocábulos hebraicos originais.',
    biblicalPassages: ['Cânon do Antigo Testamento'],
    category: 'theology',
    matchKeywords: ['bhs', 'massorético', 'texto massorético', 'leningrado'],
    matchRegex: /\b(bhs|massor[ée]tico|c[óo]dice\s+de\s+leningrado)\b/i
  }
];

/**
 * Combines standard lexicon database with any custom lexicon sources from Etapa 2
 */
export function getAllLexiconEntries(sources: AcademicSource[] = []): LexiconEntry[] {
  const combined = [...BASE_LEXICON_DATABASE];
  const seenIds = new Set(combined.map(e => e.id));

  // Dynamically extract lexicon sources from project sources
  sources.forEach((source, idx) => {
    if (source.category === 'lexicon' || /bdag|halot|léxico|lexicon|filologia/i.test(source.publication || source.title)) {
      const customId = `custom-lex-${source.id || idx}`;
      if (!seenIds.has(customId)) {
        seenIds.add(customId);

        const isHebrew = /hebraico|halot|hebrew|ot/i.test(source.title + ' ' + source.publication);
        const termName = source.biblicalConnection || source.title;
        const cleanKeyword = (source.title || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().split(/\s+/)[0];

        combined.push({
          id: customId,
          originalWord: termName,
          transliteration: source.title,
          language: isHebrew ? 'hebrew' : 'greek',
          lexicon: isHebrew ? 'HALOT' : 'BDAG',
          lexiconReference: `${source.publication || 'Léxico Acadêmico'} (${source.year || 's.d.'})`,
          shortDefinition: source.keyFindings ? source.keyFindings.slice(0, 140) + '...' : 'Verbete acadêmico extraído das fontes da pesquisa.',
          detailedDefinition: source.keyFindings || 'Definição especializada catalogada nas fontes do projeto.',
          anatomicalVolitionalFunction: source.citationScriptQuote || 'Função conceitual no roteiro.',
          biblicalPassages: source.biblicalConnection ? [source.biblicalConnection] : [],
          category: 'theology',
          matchKeywords: cleanKeyword ? [cleanKeyword.toLowerCase()] : [],
          matchRegex: cleanKeyword && cleanKeyword.length >= 3 ? new RegExp(`\\b(${cleanKeyword})\\b`, 'i') : /\b(nonexistent_fallback)\b/,
          isCustom: true
        });
      }
    }
  });

  return combined;
}

/**
 * Detects which lexicon terms are present in a given text (e.g. script or article)
 */
export function detectLexiconTermsInText(
  text: string,
  sources: AcademicSource[] = []
): { entry: LexiconEntry; count: number; matches: string[] }[] {
  if (!text || !text.trim()) return [];

  const allEntries = getAllLexiconEntries(sources);
  const detected: { entry: LexiconEntry; count: number; matches: string[] }[] = [];

  allEntries.forEach(entry => {
    const matches: string[] = [];
    const regex = new RegExp(entry.matchRegex.source, 'gi');

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[0])) {
        matches.push(match[0]);
      }
      if (matches.length >= 10) break; // cap
    }

    if (matches.length > 0) {
      detected.push({
        entry,
        count: matches.length,
        matches
      });
    }
  });

  return detected;
}
