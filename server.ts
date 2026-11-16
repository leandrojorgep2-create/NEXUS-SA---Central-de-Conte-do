import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, COPYWRITING_RULES, SCRIPT_VOICE_STYLES } from "./prompts.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Distinct resilient models for text tasks:
// gemini-3.1-flash-lite has high availability & fast latency.
// gemini-3.8-flash provides deep reasoning and serves as immediate failover.
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateWithFallback(options: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;

  // Round 1: Try each distinct model once. On 503 (high demand) or timeout, immediately try next model.
  // Round 2: If candidate models faced temporary spikes, wait briefly and retry once.
  for (let round = 1; round <= 2; round++) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const timeoutMs = 45000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ao gerar conteúdo com o modelo ${model}`)), timeoutMs)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          }),
          timeoutPromise
        ]);

        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        const isTemporary =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Timeout");

        console.warn(`[Gemini API] Model "${model}" (round ${round}/2) warning: ${errMsg}`);

        // If it's a fatal validation/syntax error, don't retry models
        if (!isTemporary && !errMsg.includes("500") && !errMsg.includes("INTERNAL")) {
          throw err;
        }

        // On 503/high demand/timeout, immediately continue to next candidate model without waiting
      }
    }

    if (round === 1) {
      // Pause 750ms before second round only if all candidate models were under high demand
      await new Promise((r) => setTimeout(r, 750));
    }
  }

  throw lastError;
}

function safeParseJson<T = any>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const withoutTrailingCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(withoutTrailingCommas);
    } catch {}

    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        try {
          return JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1'));
        } catch {
          return fallback;
        }
      }
    }
    return fallback;
  }
}

function handleApiError(res: express.Response, error: any, defaultMsg: string) {
  console.error(defaultMsg, error);
  const errMsg = String(error?.message || error);
  const isUnavailable =
    errMsg.includes("503") ||
    errMsg.includes("UNAVAILABLE") ||
    errMsg.includes("high demand") ||
    errMsg.includes("429") ||
    errMsg.includes("RESOURCE_EXHAUSTED");

  if (isUnavailable) {
    // Do NOT return 502, 503, or 504 here: Nginx intercepts them with error_page 502 503 504 = /warmup.html,
    // converting the response into HTML ('<!doctype html>') and breaking client-side JSON parsing.
    // Return status 500 or 429 with application/json.
    return res.status(500).json({
      error: "Os servidores de IA estão com alta demanda temporária. Tentamos reconectar automaticamente. Por favor, tente novamente em alguns instantes.",
    });
  }

  return res.status(500).json({
    error: errMsg && errMsg.length < 200 ? errMsg : defaultMsg,
  });
}

async function startServer() {
  const app = express();
  // Dev server must always run on port 3000 as required by the environment
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  
  // Step 2: Generate Biblical Passage based on Theme
  app.post("/api/generate-passage", async (req, res) => {
    try {
      const { theme } = req.body;
      if (!theme) {
        return res.status(400).json({ error: "O tema é obrigatório." });
      }

      const prompt = `Com base na Metodologia e no Tom de Voz estabelecidos, analise o seguinte tema: "${theme}".

Sua tarefa:
Sugerir 1 a 3 passagens bíblicas centrais.
Para cada passagem:
1. Forneça a referência e o texto bíblico.
2. Justifique a escolha em 2-3 frases, citando pelo menos um termo original relevante com sua transliteração e significado.
3. Indique a conexão com a neurociência/psicologia e/ou filosofia, se pertinente.

Retorne em formato legível (Markdown), direto ao ponto, aplicando rigorosamente as terminologias-chave.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar a passagem bíblica.");
    }
  });

  // Step 2.1: Search Academic & Biblical Sources for Authority
  app.post("/api/search-sources", async (req, res) => {
    try {
      const { theme, passage, query, category } = req.body;
      if (!theme && !passage) {
        return res.status(400).json({ error: "Tema ou passagem são necessários para buscar fontes." });
      }

      const categoryFilter = category && category !== 'all' ? `Priorize fontes na categoria: "${category}".` : 'Forneça uma combinação equilibrada de fontes neurocientíficas, exegese bíblica e léxicos originais.';

      const prompt = `Você é um pesquisador acadêmico sênior e teólogo interdisciplinar do "Nexus S.A.".
Tema do canal: "${theme || ''}"
Passagem / Contexto Bíblico: "${passage || ''}"
Termo de busca do usuário: "${query || 'Fontes acadêmicas de neurociência, teologia exegética e léxicos originais'}"
Filtro: ${categoryFilter}

Sua tarefa: Retorne EXATAMENTE de 4 a 6 fontes acadêmicas, científicas e teológicas de altíssima autoridade e credibilidade para enriquecer a base do vídeo e gerar autoridade inquestionável no YouTube.

Selecione entre:
- Periódicos científicos revisados por pares (Frontiers in Psychology/Neuroscience, Journal of Behavioral Medicine, PubMed, pesquisadores como Dr. Andrew Newberg, Dr. Caroline Leaf, etc.)
- Comentários bíblicos de referência acadêmica internacional (Word Biblical Commentary, NICNT, Bruce Waltke, Gordon Fee, N.T. Wright, etc.)
- Léxicos acadêmicos padrão dos idiomas originais (BDAG, HALOT, BDB, Thayer)

Para cada fonte retorne:
- id: identificador amigável (ex: "neuro-1", "theology-1", "lexicon-1")
- category: "neuroscience" | "theological" | "lexicon" | "historical"
- title: Título da obra, artigo científico ou verbete
- authors: Autores / Pesquisadores / Instituição (ex: "Dr. Andrew Newberg & Dr. Mark Waldman", "Bruce K. Waltke")
- year: Ano aproximado de publicação (ex: "2021", "2018")
- publication: Periódico, editora acadêmica ou léxico (ex: "Frontiers in Human Neuroscience", "Eerdmans / NICNT", "BDAG")
- keyFindings: Resumo conciso (2-3 frases densas) do achado ou definição acadêmica
- biblicalConnection: Conexão exata com a passagem bíblica e os termos originais (Lev, Kardia, Nous, etc.)
- citationScriptQuote: Frase de autoridade pronta para locução no vídeo (ex: "Um estudo publicado na revista Frontiers in Human Neuroscience demonstrou que...", "O léxico grego de maior prestígio acadêmico, o BDAG, comprova que...")

Retorne estritamente o JSON conforme o schema.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              sources: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    category: { type: "STRING" },
                    title: { type: "STRING" },
                    authors: { type: "STRING" },
                    year: { type: "STRING" },
                    publication: { type: "STRING" },
                    keyFindings: { type: "STRING" },
                    biblicalConnection: { type: "STRING" },
                    citationScriptQuote: { type: "STRING" }
                  },
                  required: ["id", "category", "title", "authors", "publication", "keyFindings", "biblicalConnection", "citationScriptQuote"]
                }
              }
            },
            required: ["sources"]
          }
        }
      });

      const parsedData = safeParseJson(response.text, { sources: [] });
      res.json({ sources: parsedData.sources || [] });
    } catch (error) {
      handleApiError(res, error, "Erro ao buscar fontes acadêmicas e bíblicas.");
    }
  });

  // Step 2.2: Expand Biblical Analysis with Academic & Exegetical Sources
  app.post("/api/expand-passage-with-sources", async (req, res) => {
    try {
      const { theme, passage, sources } = req.body;
      if (!passage) {
        return res.status(400).json({ error: "A análise bíblica é obrigatória." });
      }

      const sourcesSummary = Array.isArray(sources) && sources.length > 0
        ? sources.map((s: any, idx: number) => `
Fonte ${idx + 1} [${s.category?.toUpperCase()}]: ${s.title}
Autores: ${s.authors} (${s.year || 's.d.'}) — ${s.publication}
Achados Chave: ${s.keyFindings}
Conexão Bíblica: ${s.biblicalConnection}
Citação para o Roteiro: "${s.citationScriptQuote}"
`).join('\n')
        : "Utilize os referenciais do modelo interdisciplinar do Nexus: BDAG, HALOT, neuroplasticidade e eixo amígdala vs córtex pré-frontal.";

      const prompt = `Com base no tema "${theme}" e na análise bíblica anterior:
${passage}

Fontes Acadêmicas, Científicas e Léxicos Selecionados:
${sourcesSummary}

Sua tarefa: Gerar um DOSSIÊ EXPANDIDO DE AUTORIDADE ACADÊMICA E BÍBLICA completo para fundamentar o roteiro.

ESTRUTURA DA RESPOSTA EM MARKDOWN:
1. **Passagem Central & Exegese Filológica dos Originais**:
   - Texto bíblico completo e dissecação dos termos originais citando nominalmente os léxicos acadêmicos (BDAG, HALOT, BDB).
2. **Evidências Neurocientíficas e Psicológicas Revisadas por Pares**:
   - Integração aprofundada dos estudos científicos citando os pesquisadores, periódicos e a base neurobiológica correspondente.
3. **Ponte Teológica & Superação de Soluções Simplistas**:
   - Por que o estoicismo secular ou autoajuda superficial falham e como a teologia bíblica da graça/aliança opera a transformação duradoura.
4. **Quadro de Citações de Autoridade Prontas para o Roteiro**:
   - Frases de ancoragem de autoridade prontas para serem faladas no vídeo ("Soundbites de Autoridade").

Mantenha o tom Expositivo-Acadêmico e Didático-Provocador com densidade acadêmica inquestionável.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao expandir análise bíblica com fontes.");
    }
  });

  // Step 3: Generate Scripts based on Passage, Theme and Voice Styles
  app.post("/api/generate-scripts", async (req, res) => {
    try {
      const { theme, passage, duration } = req.body;
      if (!theme || !passage || !duration) {
        return res.status(400).json({ error: "Tema, passagem e duração são obrigatórios." });
      }

      const numDuration = Number(duration) || 5;
      const targetWords = Math.round(numDuration * 145);
      const minWords = Math.round(numDuration * 135);

      const prompt = `Com base no tema "${theme}" e no dossiê bíblico e acadêmico selecionado:\n\n${passage}\n\n
Sua tarefa é gerar EXATAMENTE 3 ROTEIROS COMPLETOS E DISTINTOS, todos narrados por uma ÚNICA VOZ, mas variando profundamente em ESTILO DE VOZ E PERSONALIDADE.

DURAÇÃO E EXTENSÃO EXIGIDA:
- Duração alvo: **${numDuration} minutos** de locução falada real.
- Ritmo de fala em português: 140 a 150 palavras por minuto.
- Meta de densidade de palavras: aproximadamente **${targetWords} palavras** (mínimo de ${minWords} palavras).
- Para roteiros longos (10 a 20 minutos), desenvolva múltiplos blocos temporais que avancem do timestamp [00:00] até [${String(numDuration).padStart(2, '0')}:00], com parágrafos densos e narrativos.
- CITAÇÕES DE AUTORIDADE: CITE NOMINALMENTE os estudos científicos, pesquisadores (Harvard, Frontiers, Caroline Leaf), léxicos acadêmicos (BDAG, HALOT) ou comentaristas bíblicos da base para conferir autoridade máxima ao canal.

Você DEVE gerar exatamente um roteiro para cada um dos 3 estilos a seguir:

1. **Roteiro 1 — Estilo "Mentalidade Forte" (Inspirado em Mayumi Kams)**:
   - Identificador styleId: "mentalidade_forte"
   - Nome styleName: "Estilo 1: Mentalidade Forte"
   - Reframe de autoridade imediato na primeira frase: "Não é X que muda sua vida, é Y" (desmontando clichês).
   - Dicotomia explícita entre estado de sobrevivência/estagnação/vitimismo vs. governo próprio/domínio e maturidade ativa diante do texto bíblico.
   - Postura de autoridade conquistada na prática, frases assertivas e diretas sem hedging ("isso muda tudo. Ponto.").
   - Metáforas de negociação, posicionamento, estratégia e acordos internos.
   - Chamada final incisiva para autonomia e decisão imediata do espectador.
   - Ritmo: frases curtas de manifesto intercaladas com aprofundamento teológico e técnico rigoroso.

2. **Roteiro 2 — Estilo "Descoberta em Voz Alta" (Estilo NotebookLM Audio Overview, narrador único)**:
   - Identificador styleId: "descoberta_voz_alta"
   - Nome styleName: "Estilo 2: Descoberta em Voz Alta"
   - Narrador pensa em voz alta e descobre a conexão junto com o ouvinte em tempo real.
   - Uso orgânico de autointerrupção e retomada ("peraí, deixa eu voltar nisso...", "e aqui que fica interessante...").
   - Constrói raciocínio através de perguntas que ele mesmo investiga e responde ("por que será que o texto bíblico usa essa palavra anatômica específica?").
   - Entusiasmo genuíno ao cruzar o termo hebraico/grego com neurociência/psicologia ("isso é surpreendente", "presta atenção nesse detalhe").
   - Analogias cotidianas explicadas como uma conversa franca com um amigo.
   - Fio condutor de curiosidade contínua abrindo cada bloco.

3. **Roteiro 3 — Estilo "Narrador Cinematográfico" (Voz única, contemplativa mas incisiva)**:
   - Identificador styleId: "cinematografico"
   - Nome styleName: "Estilo 3: Narrador Cinematográfico"
   - Abertura com uma cena ou imagem mental sensorial concreta e tangível nos primeiros 5 segundos (proibido abrir com pergunta retórica genérica).
   - Frases com cadência dramática, respiração e peso reflexivo, mas cortantes e nunca acadêmicas engessadas.
   - Alternância orgânica e íntima entre "eu" (descoberta pessoal vivida) e "você" (cumplicidade com quem ouve).
   - Fechamento em tom de convite reflexivo provocador diante de Deus (*Coram Deo*), e não de comando agressivo.

RIGOR OBRIGATÓRIO EM TODOS OS 3 ROTEIROS:
- Mantêm a precisão da base de conhecimento: termos originais (hebraico/aramaico/grego) com significado funcional/anatômico exato (Lev, Nephesh, Kilyot, Nous, Kardia, etc.).
- Ponte direta com neurociência e psicologia (neuroplasticidade, eixo amígdala vs. córtex pré-frontal, etc.) e citação nominal de estudos.
- Palavra-chave principal do tema inserida nos primeiros 15 segundos (SEO).
- Micro-CTA no meio do roteiro (~40-50% do tempo) e CTA final alinhado à personalidade da voz.
- Divisão em blocos temporais estruturados com timestamps estimados (ex: [00:00 - 01:30] Gancho de Abertura).
- Marcações textuais explícitas de referências (ex: [Ref: Pv 4:23], [Ref: Lev]).
- Ao final de cada roteiro, inclua um bloco informativo com a palavra-chave principal utilizada e os timestamps onde ela foi pronunciada.

Retorne SOMENTE o JSON estruturado conforme o schema solicitado.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + COPYWRITING_RULES + "\n\n" + SCRIPT_VOICE_STYLES,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              scripts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    styleId: { type: "STRING" },
                    styleName: { type: "STRING" },
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    voiceCharacteristics: { type: "STRING" },
                    primaryKeyword: { type: "STRING" },
                    content: { type: "STRING" }
                  },
                  required: ["styleId", "styleName", "title", "description", "content"]
                }
              }
            },
            required: ["scripts"]
          }
        }
      });

      const parsedData = safeParseJson(response.text, { scripts: [] });
      res.json({ data: parsedData });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar os roteiros.");
    }
  });

  // Step 3.5: Elaborate Script (With strict word pacing and real duration enforcement)
  app.post("/api/elaborate-script", async (req, res) => {
    try {
      const { theme, passage, scriptContent, instructions, duration } = req.body;
      if (!scriptContent) {
        return res.status(400).json({ error: "O conteúdo do roteiro é obrigatório." });
      }

      const numDuration = Number(duration) || 5;
      const targetWords = Math.round(numDuration * 145);
      const minWords = Math.round(numDuration * 135);
      const maxWords = Math.round(numDuration * 160);

      const prompt = `Com base no tema "${theme}" e no dossiê bíblico e acadêmico definido:\n\n${passage}\n\n
O usuário selecionou o seguinte roteiro base:
${scriptContent}

Sua tarefa agora é EXPANDIR, OTIMIZAR e ELABORAR este roteiro final, transformando-o em uma peça de gravação completa, pronta para locução.

============================================================
CRÍTICO — DIRETRIZ DE DURAÇÃO REAL E EXTENSÃO DE PALAVRAS:
============================================================
- Duração alvo exigida: **${numDuration} MINUTOS** de fala real em vídeo.
- Ritmo de fala padrão: 140 a 150 palavras por minuto.
- META OBRIGATÓRIA DE PALAVRAS: O roteiro resultante DEVE conter entre **${minWords} e ${maxWords} palavras** de texto falado corrido (aproximadamente ${targetWords} palavras).
- ATENÇÃO: NUNCA entregue um roteiro curto ou resumido. Se o roteiro original tiver poucas palavras (ex: 500-900 palavras), você DEVE EXPANDI-LO substancialmente para atingir a duração de ${numDuration} minutos!
- Como expandir com qualidade para cobrir ${numDuration} minutos:
  1. Desenvolva detalhadamente cada bloco temporal com múltiplos parágrafos longos, diálogos internos e raciocínios completos.
  2. Insira exemplos práticos da rotina cotidiana ("imagine a seguinte situação...").
  3. Desmonte contra-argumentos e objeções silenciosas do espectador.
  4. Aprofunde os termos no original (hebraico/grego) e cite nominalmente as fontes científicas e léxicos acadêmicos (BDAG, Harvard, Frontiers, Bruce Waltke, etc.) presentes no dossiê da Etapa 2 para aumentar a autoridade do canal.
  5. Cubra a linha do tempo contínua até o minuto final [${String(numDuration).padStart(2, '0')}:00] com timestamps expressos em cada bloco.

DIRETRIZES DE ESTILO:
1. IDENTIDADE DE VOZ: Identifique o estilo específico do roteiro base (Mentalidade Forte, Descoberta em Voz Alta ou Narrador Cinematográfico) e preserve com fidelidade absoluta essa personalidade narrativa em cada parágrafo adicionado.
2. AUTORIDADE ACADÊMICA: Integre nominalmente as fontes de estudos científicos e teológicos para reforçar a credibilidade do canal.
3. RETENÇÃO E SEO: Gancho com keyword nos primeiros 15s, micro-CTA no meio e CTA final estratégico.

Instruções específicas do usuário: ${instructions || `Expandir e aprofundar para atingir os ${numDuration} minutos completos (~${targetWords} palavras) com máxima autoridade.`}

Retorne o roteiro final expandido em Markdown.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + COPYWRITING_RULES + "\n\n" + SCRIPT_VOICE_STYLES,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao otimizar o roteiro.");
    }
  });

  // Step 3.5.1: Clean for TTS
  app.post("/api/clean-for-tts", async (req, res) => {
    try {
      const { scriptContent } = req.body;
      if (!scriptContent) {
        return res.status(400).json({ error: "O conteúdo do roteiro é obrigatório." });
      }

      const prompt = `Você é um preparador de roteiros para gravação de voz (TTS - Text-To-Speech) ou locução.
O usuário enviou um roteiro contendo formatações Markdown, marcações de tempo (ex: [00:00 - 01:00]), marcações de referências (ex: [Ref: Lev]), nomes de cenas, e indicações de direção/câmera.

Sua tarefa é LIMPAR o texto, retornando EXATAMENTE E APENAS as palavras que devem ser faladas em voz alta pelo narrador.
Regras:
1. Remova todos os cabeçalhos, títulos (###), negritos (**), itálicos (*), etc.
2. Remova todas as marcações de tempo ou referências entre colchetes ou parênteses que não são para serem lidas.
3. Remova indicações de câmera, trilha sonora, efeitos sonoros ou nomes dos blocos.
4. Escreva números, siglas e abreviações de forma fluida para a leitura, se necessário.
5. Retorne APENAS o texto puro (plain text) falado, separando os parágrafos de forma limpa.

Roteiro atual:
${scriptContent}`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao preparar roteiro para TTS.");
    }
  });

  function formatTimecode(startSeconds: number, endSeconds: number): string {
    const formatSec = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    return `${formatSec(startSeconds)} - ${formatSec(endSeconds)}`;
  }

  const DEFAULT_NEGATIVE_PROMPT = "no text, no watermark, no logo, no typography, no subtitles, no cartoon, no illustration, no 3d render, no CGI, no anime, no painting, no plastic skin, no airbrushed, no extra limbs, no mutated hands, no bad anatomy, no deformed limbs, no oversaturation, no blur";

  // Step 4.0: Generate Visual Consistency / Art Direction Sheet
  app.post("/api/generate-art-direction", async (req, res) => {
    try {
      const { theme, script, visualStyle } = req.body;
      if (!script && !theme) {
        return res.status(400).json({ error: "Roteiro ou tema são necessários para gerar a ficha de arte." });
      }

      const prompt = `Você é um Diretor de Arte e Diretor de Fotografia premiado de cinema e documentários cinematográficos de alta retenção no YouTube (estilo A24, Vox e Mayumi Kams).
Crie uma FICHA DE CONSISTÊNCIA VISUAL / DIREÇÃO DE ARTE para este roteiro específico.

Tema: "${theme || "Princípio Bíblico & Neurociência"}"
Estilo Base: "${visualStyle || "Fotográfico Editorial Analógico"}"

Amostra do Roteiro:
"""
${(script || theme).slice(0, 3500)}
"""

Gere uma ficha de arte coesa, madura e estritamente FOTORREALISTA (SEMPRE hiper-realista, NUNCA ilustração, cartoon ou 3D render) contendo:
1. palette: Paleta de cores dominante e secundária em termos de direção de arte (ex: "Tons terrosos quentes (ocre, terracota, carvão mineral) com acentos de azul cobalto profundo e âmbar dourado").
2. photographicStyle: Estilo fotográfico/cinematográfico de referência detalhado (ex: "Fotografia editorial analógica em película 35mm, Kodak Portra 400, granulação sutil e orgânica, textura de luz natural, alto alcance dinâmico com realismo visceral e autêntico").
3. characters: Descrição de personagem(ns) recorrente(s), se aplicável, para consistência entre cenas (ex: "Homem entre 30-40 anos, traços meditativos e sóbrios, pele natural com poros visíveis, vestimenta atemporal em linho escuro e lã texturizada, postura de reflexão solene").
4. mood: Mood geral da peça (ex: "Contemplativo-tenso, intelectualmente rigoroso e com transição gradual para esperança solene").
5. cameraLensGuide: Guia de câmeras e lentes recomendadas (ex: "ARRI Alexa Mini / Leica SL2, objetivas anamórficas de 35mm e 85mm com abertura f/1.8 a f/2.8").
6. lightingSetup: Guia mestre de iluminação (ex: "Chiaroscuro suave, luz natural direcional de janela, contraluz sutil de hora dourada e sombras volumétricas").

Retorne a resposta ESTRITAMENTE em formato JSON:
{
  "artDirectionSheet": {
    "palette": "...",
    "photographicStyle": "...",
    "characters": "...",
    "mood": "...",
    "cameraLensGuide": "...",
    "lightingSetup": "..."
  }
}`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        }
      });

      const parsed = safeParseJson(response.text, null);
      if (parsed && parsed.artDirectionSheet) {
        return res.json({ artDirectionSheet: parsed.artDirectionSheet });
      }

      const fallbackSheet = {
        palette: "Tons terrosos quentes (ocre, terracota, carvão mineral) com acentos de azul cobalto profundo e âmbar dourado",
        photographicStyle: "Fotografia editorial analógica em película 35mm, Kodak Portra 400, granulação sutil, textura de luz natural, alto alcance dinâmico",
        characters: "Homem entre 30-40 anos, traços meditativos e sóbrios, vestimenta atemporal em linho escuro e lã texturizada",
        mood: "Contemplativo-tenso com transição para solene e triunfante",
        cameraLensGuide: "ARRI Alexa Mini, objetivas de 35mm e 85mm com profundidade de campo cinematográfica",
        lightingSetup: "Chiaroscuro suave, luz natural direcional de janela e contraluz sutil de hora dourada"
      };

      res.json({ artDirectionSheet: fallbackSheet });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar a ficha de direção de arte.");
    }
  });

  const ELITE_CINEMATIC_STORYBOARD_AGENT_INSTRUCTION = `You are an Elite Cinematic Storyboard Agent. Your task is to analyze the provided script and deconstruct it into a granular, professional storyboard using precise cinematography terminology throughout.
You operate with the artistry and technical rigor of an award-winning Director of Photography and seasoned Cinematographer. All generated text (image prompts, video/animation prompts, scene breakdowns) must sound like high-end cinematic production documentation, avoiding generic AI clichés or plastic stock aesthetics.`;

  // Step 4: Generate Storyboard (Dynamic 6-8s decupage, varied shot types & lighting, art direction consistency)
  app.post("/api/generate-storyboard", async (req, res) => {
    try {
      const { script, visualStyle, artDirectionSheet: incomingSheet, theme } = req.body;
      if (!script || !script.trim()) {
        return res.status(400).json({ error: "O roteiro é obrigatório." });
      }

      // Step A: Ensure Art Direction Sheet exists
      let artDirection = incomingSheet;
      if (!artDirection || !artDirection.palette) {
        const artPrompt = `Você é um Diretor de Arte de cinema para documentários no YouTube.
Crie a FICHA DE CONSISTÊNCIA VISUAL / DIREÇÃO DE ARTE (fotorrealista, 35mm, nunca cartoon/3D) para o roteiro:
Tema: "${theme || "Princípio Bíblico & Neurociência"}"
Estilo: "${visualStyle || "Fotográfico Editorial Analógico"}"
Roteiro:
"""
${script.slice(0, 3000)}
"""
Retorne em JSON:
{
  "palette": "...",
  "photographicStyle": "...",
  "characters": "...",
  "mood": "...",
  "cameraLensGuide": "...",
  "lightingSetup": "..."
}`;
        try {
          const artRes = await generateWithFallback({
            contents: artPrompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
            }
          });
          const parsedArt = safeParseJson(artRes.text, null);
          artDirection = parsedArt?.artDirectionSheet || parsedArt || {
            palette: "Tons terrosos quentes com acentos de azul cobalto profundo e âmbar dourado",
            photographicStyle: "Fotografia editorial analógica 35mm, Kodak Portra 400, grão sutil, fotorrealista",
            characters: "Pessoa em atitude reflexiva, pele autêntica e vestimenta sóbria atemporal",
            mood: "Contemplativo-tenso com transição solene e inspiradora",
            cameraLensGuide: "Lentes de 35mm e 85mm f/2.0",
            lightingSetup: "Chiaroscuro naturalista e luz dourada lateral"
          };
        } catch (e) {
          artDirection = {
            palette: "Tons terrosos quentes com acentos de azul cobalto profundo e âmbar dourado",
            photographicStyle: "Fotografia editorial analógica 35mm, Kodak Portra 400, grão sutil, fotorrealista",
            characters: "Pessoa em atitude reflexiva, pele autêntica e vestimenta sóbria atemporal",
            mood: "Contemplativo-tenso com transição solene e inspiradora",
            cameraLensGuide: "Lentes de 35mm e 85mm f/2.0",
            lightingSetup: "Chiaroscuro naturalista e luz dourada lateral"
          };
        }
      }

      // Step B: Decupage in dynamic 6 to 8 second scenes
      const words = script.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length;

      async function generateScenesForText(
        textSegment: string,
        startSceneNum: number,
        startSecondsOffset: number
      ): Promise<any[]> {
        const decupagePrompt = `You are an Elite Cinematic Storyboard Agent. Your task is to analyze the provided script and deconstruct it into a granular, professional storyboard using precise cinematography terminology throughout.

Every piece of text generated must sound like a production from an elite director of photography and seasoned cinematographer, avoiding generic AI clichés.

FICHA DE DIREÇÃO DE ARTE (A SER RESUMIDA E RESPEITADA EM TODOS OS PROMPTS):
- Paleta de Cores: ${artDirection.palette}
- Estilo Fotográfico: ${artDirection.photographicStyle} (SEMPRE HIPER-REALISTA, NUNCA DESENHO, NUNCA CARTOON, NUNCA 3D)
- Personagens: ${artDirection.characters}
- Mood Geral: ${artDirection.mood}
- Iluminação Mestra: ${artDirection.lightingSetup || "Chiaroscuro naturalista"}

REGRAS RÍGIDAS DE DECUPAGEM (6 A 8 SEGUNDOS POR CENA):
1. DURAÇÃO DE CADA CENA: Cada cena DEVE cobrir EXATAMENTE 6 a 8 segundos de fala narrada (~13 a 18 palavras faladas por cena). O campo 'durationSeconds' deve ser 6, 7 ou 8.
2. DIVISÃO DINÂMICA: Se um trecho ou ideia falada ultrapassar 8 segundos sem mudança de foco visual, DIVIDA OBRIGATORIAMENTE em 2 ou mais cenas (ex: cena 1 = ideia exposta / cena 2 = reação, consequência ou metáfora visual palpável dela) em vez de forçar tudo em uma imagem.
3. SEM APRESENTADOR: Formato B-Roll cinematográfico. Não mostre narrador falando para a câmera.
4. TAGS DE TIPO OBRIGATÓRIAS (use EXATAMENTE uma destas 5 para cada cena):
   - "estabelecimento" (plano aberto que localiza o ambiente, contexto ou cenário amplo)
   - "ação" (movimento humano, gestos, evento físico ou transformação)
   - "reflexão/close emocional" (detalhe íntimo, rosto em introspecção, respiração visual)
   - "transição" (luz mudando, sombras se movendo, elementos metafóricos da natureza, passagem de tempo)
   - "citação visual" (representação visual de conceitos abstratos, termos bíblicos hebraico/grego ou neurociência)

5. DIVERSIFICAÇÃO OBRIGATÓRIA (NUNCA REPETIR A MESMA COMBINAÇÃO EM CENAS CONSECUTIVAS):
   - Tipo de plano: Wide shot, Medium shot, Close-up, Extreme close-up, Over-the-shoulder, Low angle, High angle, POV (escolhido coerentemente com a tag).
   - Iluminação: Chiaroscuro, hard side lighting, dramatic backlight with volumetric haze, diffused window light, golden hour, rim light, silhouette.
   - Lente e DoF: 24mm wide-angle, 35mm prime, 50mm natural, 85mm portrait lens, 100mm macro; creamy bokeh (shallow DoF) vs sharp deep focus.
   - Composição: regra dos terços, simetria, espaço negativo, linhas de força, enquadramento dinâmico.
   - Texturas reais: enfatize "skin texture detail, visible pores, natural wrinkles, realistic fabric folds, natural imperfections, shot on 35mm film, photorealistic", proibindo aspecto plástico de IA.

6. PROMPT DE IMAGEM (PARA CADA CENA, EM INGLÊS):
   Gerar com terminologia cinematográfica profissional de alto escalão, especificando SEMPRE:
   - Resolução e qualidade: "8k resolution, hyper-realistic, photorealistic"
   - Lente exata da câmera: especificar lente real (ex: "35mm prime lens", "85mm portrait lens", "24mm wide-angle lens")
   - Tipo de plano e ângulo: de acordo com a tag de tipo da cena
   - Iluminação precisa: setup específico (ex: "hard side lighting", "dramatic backlight", "diffused window light", "golden hour", "chiaroscuro")
   - Composição cinematográfica: regra dos terços, simetria, espaço negativo, linhas de força
   - Textura e realismo: "skin texture detail, realistic fabric folds, natural imperfections" (sem visual plástico)
   - Paleta de cores: estritamente herdada da ficha de direção de arte
   - Estrutura: [tipo de plano e ângulo] + [sujeito/ação específica da cena] + [ambiente/cenário] + [iluminação] + [lente/profundidade de campo] + [composição] + [paleta de cores da ficha] + [qualificadores: 8k resolution, hyper-realistic, photorealistic, skin texture detail, realistic fabric folds, natural imperfections, shot on 35mm Kodak Portra film]
   ATENÇÃO: NÃO inclua texto escrito na tela, títulos ou caracteres tipográficos! Apenas a fotografia pura.

7. PROMPT DE VÍDEO/ANIMAÇÃO (PARA CADA CENA, EM INGLÊS):
   Para cada cena, gere um prompt de animação/vídeo SEPARADO para ferramentas image-to-video (Kling, Runway, Luma), especificando:
   - Movimento de câmera: termo técnico específico (ex: "slow dolly-in", "pan left to right", "tilt up", "tracking shot following subject", "static shot with subtle handheld sway") escolhido de acordo com a intenção da cena (dolly-in lento para revelação/introspecção; tracking para ação/movimento).
   - Movimento do sujeito: o que se move dentro do quadro e como (ex: "subject slowly turns head toward light source", "hands clasping in prayer, slow motion", "dust motes drifting gently in volumetric light beam"), coerente com o trecho falado.
   - Duração implícita: pensado para preencher com fluidez cinematográfica os 6-8 segundos da cena sem looping abrupto.
   - Formato focado em motion direction a partir da imagem base (não recriar a cena do zero).

8. PROMPT NEGATIVO POR CENA (EM INGLÊS):
   Gerar prompt negativo padrão por cena (ex: "no text, no watermark, no cartoon, no illustration, no extra limbs, no plastic skin, no oversaturation, no blur").

Trecho do roteiro a decupar:
"""
${textSegment}
"""

Retorne o resultado ESTRITAMENTE em JSON com a lista de cenas:
{
  "scenes": [
    {
      "durationSeconds": 7,
      "sceneType": "estabelecimento",
      "textSnippet": "trecho exato da fala correspondente",
      "description": "resumo de uma linha da cena em português sob a ótica de direção de fotografia",
      "shotType": "Wide angle establishing shot (24mm)",
      "cameraMovement": "Slow cinematic dolly-in pushing forward smoothly",
      "subjectMovement": "Subject pauses thoughtfully and raises gaze towards the incoming light beam, subtle natural breathing motion",
      "lighting": "Hard side lighting with warm golden hour beam and deep chiaroscuro shadows",
      "lens": "24mm wide-angle lens, deep focus",
      "composition": "Rule of thirds with strong architectural leading lines and negative space",
      "imagePrompt": "Wide-angle establishing shot of an introspective scholar seated in an ancient vaulted stone cloister, hard side lighting from a high arched window creating dramatic chiaroscuro with golden hour dust motes, 24mm wide-angle lens, deep focus, rule of thirds with negative space, earthy warm terracotta and charcoal tones with cobalt blue shadows, 8k resolution, hyper-realistic, photorealistic, authentic skin texture detail, realistic fabric folds, natural imperfections, shot on 35mm Kodak Portra film",
      "videoPrompt": "Slow cinematic dolly-in pushing forward smoothly toward the scholar as he slowly raises his gaze toward the golden window beam, dust motes drifting gently in the air, natural subtle fabric movement, smooth continuous 7-second motion, cinematic pacing, image-to-video motion, no abrupt loops",
      "negativePrompt": "no text, no watermark, no cartoon, no illustration, no extra limbs, no plastic skin, no oversaturation, no blur"
    }
  ]
}`;

        const response = await generateWithFallback({
          contents: decupagePrompt,
          config: {
            systemInstruction: ELITE_CINEMATIC_STORYBOARD_AGENT_INSTRUCTION + "\n\n" + SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
          }
        });

        const parsed = safeParseJson(response.text, null);
        let rawScenes = parsed?.scenes || parsed?.cenas || parsed?.items || (Array.isArray(parsed) ? parsed : (parsed?.storyboard || []));
        if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
          // If response had scenes in another key or text, try to extract array
          if (parsed && typeof parsed === 'object') {
            for (const key of Object.keys(parsed)) {
              if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
                rawScenes = parsed[key];
                break;
              }
            }
          }
        }

        if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
          // Create graceful fallback scenes from sentences so generation never crashes
          const sentences = textSegment.split(/(?<=[.!?])\s+/).filter(Boolean);
          const fallbackSegments = sentences.length > 0 ? sentences : [textSegment];
          rawScenes = fallbackSegments.map((seg, sIdx) => ({
            durationSeconds: 7,
            sceneType: sIdx === 0 && startSceneNum === 1 ? 'estabelecimento' : 'reflexão/close emocional',
            textSnippet: seg.trim().slice(0, 160),
            description: `Plano cinematográfico expressivo: ${seg.trim().slice(0, 80)}`,
            shotType: sIdx % 2 === 0 ? "Medium shot (35mm prime)" : "Close-up (85mm portrait lens)",
            cameraMovement: "Slow cinematic dolly-in",
            subjectMovement: "Subtle contemplative motion and gaze shift",
            lighting: "Chiaroscuro with warm golden hour side lighting",
            lens: sIdx % 2 === 0 ? "35mm prime lens" : "85mm portrait lens",
            composition: "Rule of thirds with natural negative space",
            imagePrompt: `Cinematic 35mm editorial photograph, 8k resolution, hyper-realistic, photorealistic, authentic skin texture detail, realistic fabric folds, natural imperfections, shot on 35mm Kodak Portra film`,
            videoPrompt: `Slow cinematic dolly-in pushing forward smoothly, subtle contemplative motion, smooth continuous 7-second motion, image-to-video motion, no abrupt loops`,
            negativePrompt: DEFAULT_NEGATIVE_PROMPT
          }));
        }

        let runningTime = startSecondsOffset;
        const validTypes = ['estabelecimento', 'ação', 'reflexão/close emocional', 'transição', 'citação visual'];

        return rawScenes.map((s: any, idx: number) => {
          const sceneIndex = startSceneNum + idx;
          const dur = Math.min(8, Math.max(6, Number(s.durationSeconds) || 7));
          const startSec = runningTime;
          const endSec = runningTime + dur;
          runningTime = endSec;

          const rawType = String(s.sceneType || '').toLowerCase();
          let matchedType = validTypes.find(t => rawType.includes(t.toLowerCase().split('/')[0])) || 'reflexão/close emocional';
          if (idx === 0 && startSceneNum === 1) matchedType = 'estabelecimento';

          const cameraMotion = s.cameraMovement || "Slow cinematic dolly-in";
          const subjectMotion = s.subjectMovement || "Subtle contemplative motion and gaze shift";

          return {
            scene: sceneIndex,
            timecode: formatTimecode(startSec, endSec),
            durationSeconds: dur,
            sceneType: matchedType,
            textSnippet: s.textSnippet || `Cena ${sceneIndex}`,
            description: s.description || "Composição visual de apoio à narrativa.",
            shotType: s.shotType || "Medium shot",
            cameraMovement: cameraMotion,
            subjectMovement: subjectMotion,
            lighting: s.lighting || "Natural diffuse light",
            lens: s.lens || "35mm prime lens",
            composition: s.composition || "Rule of thirds",
            imagePrompt: s.imagePrompt || "Cinematic 35mm editorial photograph, 8k resolution, hyper-realistic, photorealistic, authentic skin texture detail, realistic fabric folds, natural imperfections",
            videoPrompt: s.videoPrompt || `${cameraMotion}, ${subjectMotion}, smooth continuous ${dur}-second motion, cinematic pacing, image-to-video motion, no abrupt loops`,
            negativePrompt: s.negativePrompt || DEFAULT_NEGATIVE_PROMPT
          };
        });
      }

      // Determine chunking strategy based on script length
      let allScenes: any[] = [];

      if (totalWords <= 400) {
        allScenes = await generateScenesForText(script, 1, 0);
      } else {
        // Chunk into ~250-350 word paragraphs to guarantee non-truncation and deep granularity
        const paragraphs = script.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
        const chunks: string[] = [];
        let currentChunk = "";
        let currentWordCount = 0;

        for (const p of paragraphs) {
          const pWords = p.trim().split(/\s+/).length;
          if (currentWordCount + pWords > 320 && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = p;
            currentWordCount = pWords;
          } else {
            currentChunk += "\n\n" + p;
            currentWordCount += pWords;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        // If paragraphs were too few or one huge block, split by sentences
        if (chunks.length <= 1 && totalWords > 400) {
          const sentences = script.split(/(?<=[.!?])\s+/);
          chunks.length = 0;
          currentChunk = "";
          currentWordCount = 0;
          for (const s of sentences) {
            const sWords = s.trim().split(/\s+/).length;
            if (currentWordCount + sWords > 300 && currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = s;
              currentWordCount = sWords;
            } else {
              currentChunk += " " + s;
              currentWordCount += sWords;
            }
          }
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
        }

        let nextSceneNum = 1;
        let nextTimeOffset = 0;

        for (const chunk of chunks) {
          try {
            const chunkScenes = await generateScenesForText(chunk, nextSceneNum, nextTimeOffset);
            allScenes.push(...chunkScenes);
            nextSceneNum += chunkScenes.length;
            const lastScene = chunkScenes[chunkScenes.length - 1];
            if (lastScene) {
              const timeParts = lastScene.timecode.split('-')[1]?.trim().split(':');
              if (timeParts && timeParts.length === 2) {
                nextTimeOffset = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
              } else {
                nextTimeOffset += chunkScenes.reduce((acc: number, sc: any) => acc + sc.durationSeconds, 0);
              }
            }
          } catch (chunkErr) {
            console.warn("[Storyboard Chunk Error]", chunkErr);
          }
        }
      }

      if (!allScenes || allScenes.length === 0) {
        throw new Error("Não foi possível gerar as cenas do storyboard.");
      }

      res.json({
        artDirectionSheet: artDirection,
        storyboard: allScenes
      });
    } catch (error) {
      handleApiError(res, error, "Erro ao decupar o storyboard.");
    }
  });

  // Step 4.1: Regenerate Single Scene Image & Video Prompt
  app.post("/api/regenerate-scene-prompt", async (req, res) => {
    try {
      const { 
        scene, 
        textSnippet, 
        sceneType, 
        currentShotType, 
        currentLighting, 
        currentLens,
        artDirectionSheet,
        theme
      } = req.body;

      const artDirection = artDirectionSheet || {
        palette: "Tons terrosos quentes com acentos de azul cobalto profundo e âmbar dourado",
        photographicStyle: "Fotografia editorial analógica 35mm, Kodak Portra 400, fotorrealista",
        characters: "Pessoa em atitude reflexiva, pele autêntica e vestimenta sóbria atemporal",
        mood: "Contemplativo-tenso com transição solene e inspiradora",
        cameraLensGuide: "Lentes de 35mm e 85mm f/2.0",
        lightingSetup: "Chiaroscuro naturalista e luz dourada lateral"
      };

      const regenPrompt = `You are an Elite Cinematic Storyboard Agent. Your task is to analyze the provided script and deconstruct it into a granular, professional storyboard using precise cinematography terminology throughout.
Regenere os parâmetros visuais, prompt de imagem E prompt de vídeo/animação para esta cena específica, buscando uma abordagem FOTORREALISTA, DIVERSA e VISUALMENTE IMPACTANTE, respeitando rigorosamente a Ficha de Direção de Arte.

FICHA DE DIREÇÃO DE ARTE:
- Paleta de Cores: ${artDirection.palette}
- Estilo Fotográfico: ${artDirection.photographicStyle} (SEMPRE HIPER-REALISTA, NUNCA DESENHO/3D)
- Personagens: ${artDirection.characters}
- Mood Geral: ${artDirection.mood}
- Iluminação Mestra: ${artDirection.lightingSetup || "Chiaroscuro naturalista"}

CENA ATUAL:
- Número da Cena: ${scene || 1}
- Tag de Tipo: "${sceneType || 'reflexão/close emocional'}"
- Trecho Narrado (6-8s): "${textSnippet || ''}"
- Enquadramento Anterior a EVITAR repetir: "${currentShotType || ''}"
- Iluminação Anterior a EVITAR repetir: "${currentLighting || ''}"

DIRETRIZES:
1. Alterne para um enquadramento diferente e expressivo condizente com a tag (Wide shot, Medium shot, Close-up, Extreme close-up, Over-the-shoulder, Low angle, High angle, POV).
2. Proponha um setup de iluminação novo (Chiaroscuro, hard side lighting, dramatic backlight with volumetric haze, diffused window light, golden hour, rim light).
3. Especifique lente (ex: 35mm prime lens, 85mm portrait lens, 24mm wide-angle) e profundidade de campo (shallow bokeh vs deep focus).
4. Especifique composição (regra dos terços, simetria, espaço negativo, linhas de força).
5. Enfatize texturas reais fotorrealistas ("skin texture detail, visible pores, natural wrinkles, realistic fabric folds, natural imperfections, shot on 35mm film, photorealistic").
6. Estruture o prompt de imagem final em inglês SEMPRE contendo:
   - "8k resolution, hyper-realistic, photorealistic"
   - Lente exata da câmera
   - Setup específico de iluminação
   - Composição
   - Texturas ("skin texture detail, realistic fabric folds, natural imperfections")
   - Paleta de cores da ficha de arte
   ATENÇÃO: NÃO inclua textos escritos na tela, legendas ou tipografia.
7. Prompt de vídeo/animação SEPARADO (em inglês para Kling, Runway, Luma):
   - Movimento de câmera: termo técnico específico (ex: "slow dolly-in", "pan left to right", "tilt up", "tracking shot following subject", "static shot with subtle handheld sway").
   - Movimento do sujeito: o que se move no quadro e como, coerente com a narração.
   - Duração implícita de 6-8s fluida, sem looping abrupto.
8. Prompt negativo por cena (em inglês): formato padrão "no text, no watermark, no cartoon, no illustration, no extra limbs, no plastic skin, no oversaturation, no blur".

Retorne ESTRITAMENTE em formato JSON:
{
  "description": "resumo de uma linha da cena em português sob ótica cinematográfica",
  "shotType": "novo tipo de plano (ex: Extreme close-up (85mm portrait lens))",
  "cameraMovement": "movimento de câmera técnico (ex: Slow cinematic dolly-in pushing forward)",
  "subjectMovement": "movimento do sujeito dentro do quadro (ex: Subject slowly raises eyes towards the light, subtle breathing motion)",
  "lighting": "novo setup de iluminação (ex: High-contrast chiaroscuro with hard side key light and warm golden rim light)",
  "lens": "lente e profundidade (ex: 85mm portrait prime lens, creamy shallow depth of field)",
  "composition": "composição (ex: Off-center framing adhering to rule of thirds with negative space)",
  "imagePrompt": "prompt completo e detalhado em inglês seguindo a estrutura",
  "videoPrompt": "prompt de animação/vídeo completo em inglês focado em motion direction para image-to-video tools",
  "negativePrompt": "no text, no watermark, no cartoon, no illustration, no extra limbs, no plastic skin, no oversaturation, no blur"
}`;

      const response = await generateWithFallback({
        contents: regenPrompt,
        config: {
          systemInstruction: ELITE_CINEMATIC_STORYBOARD_AGENT_INSTRUCTION + "\n\n" + SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        }
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed || !parsed.imagePrompt) {
        throw new Error("Não foi possível regenerar o prompt da cena.");
      }

      res.json({
        scenePrompt: {
          description: parsed.description,
          shotType: parsed.shotType,
          cameraMovement: parsed.cameraMovement || "Slow cinematic dolly-in",
          subjectMovement: parsed.subjectMovement || "Subtle natural motion and contemplative gaze shift",
          lighting: parsed.lighting,
          lens: parsed.lens,
          composition: parsed.composition,
          imagePrompt: parsed.imagePrompt,
          videoPrompt: parsed.videoPrompt || `${parsed.cameraMovement || "Slow cinematic dolly-in"}, subtle motion, smooth continuous 7-second motion, image-to-video motion, no abrupt loops`,
          negativePrompt: parsed.negativePrompt || DEFAULT_NEGATIVE_PROMPT
        }
      });
    } catch (error) {
      handleApiError(res, error, "Erro ao regenerar prompt da cena.");
    }
  });

  // Step 4.2: Regenerate Just Video/Animation Prompt
  app.post("/api/regenerate-video-prompt", async (req, res) => {
    try {
      const { 
        scene, 
        textSnippet, 
        sceneType, 
        shotType,
        imagePrompt,
        currentCameraMovement
      } = req.body;

      const regenVideoPrompt = `You are an Elite Cinematic Storyboard Agent.
Your task is to generate a professional video/animation prompt for this specific scene, optimized for image-to-video generative tools (Kling, Runway Gen-3, Luma Dream Machine).

SCENE DETAILS:
- Scene Number: ${scene || 1}
- Scene Type Tag: "${sceneType || 'reflexão'}"
- Spoken Narration (6-8s): "${textSnippet || ''}"
- Shot Type: "${shotType || 'Cinematic shot'}"
- Base Image Prompt: "${(imagePrompt || '').slice(0, 300)}"
- Previous Camera Movement to EVITAR repetir: "${currentCameraMovement || ''}"

REQUIREMENTS:
1. Camera Movement: Technical term (e.g., "slow cinematic dolly-in", "smooth tracking shot following subject", "gentle horizontal pan left to right", "subtle tilt up towards sky", "static locked-off camera with organic micro-handheld movement").
2. Subject Movement: Describe what physically moves within the frame (e.g., "subject slowly turns head towards the golden window light", "gentle wind rustling hair and fabric folds", "hands slowly opening with deliberate emotion", "dust particles floating in volumetric light beam").
3. Timing: Natural continuous 6-8 seconds motion, seamless pacing, avoiding harsh camera jerks or abrupt looping.
4. Focus: Movement from the base image (not reinventing scenery).

Retorne ESTRITAMENTE em formato JSON:
{
  "cameraMovement": "technical camera motion name in English",
  "subjectMovement": "subject motion description in English",
  "videoPrompt": "complete video prompt in English for Kling/Runway/Luma"
}`;

      const response = await generateWithFallback({
        contents: regenVideoPrompt,
        config: {
          systemInstruction: ELITE_CINEMATIC_STORYBOARD_AGENT_INSTRUCTION + "\n\n" + SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        }
      });

      const parsed = safeParseJson(response.text, null);
      if (!parsed || !parsed.videoPrompt) {
        throw new Error("Não foi possível gerar novo prompt de vídeo.");
      }

      res.json({
        videoPrompt: parsed.videoPrompt,
        cameraMovement: parsed.cameraMovement,
        subjectMovement: parsed.subjectMovement
      });
    } catch (error) {
      handleApiError(res, error, "Erro ao regenerar prompt de vídeo.");
    }
  });

  // Step 4: Generate Image
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "O prompt é obrigatório." });
      }

      // Utilizando o Pollinations.ai (Gerador de imagens IA gratuito e sem chave)
      // Passamos o prompt diretamente na URL e garantimos um seed aleatório para não pegar cache
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}`;

      res.json({ image: imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Erro ao gerar a imagem." });
    }
  });

  // Proxy image to bypass CORS and prevent "Failed to fetch" on image downloads
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL da imagem é obrigatória." });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const imageResponse = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/*,*/*;q=0.8"
        }
      });
      clearTimeout(timeout);

      if (!imageResponse.ok) {
        return res.status(imageResponse.status).json({ error: "Falha ao obter imagem remota." });
      }

      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const arrayBuffer = await imageResponse.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: "Erro ao processar imagem proxy." });
    }
  });

  // Step 4.5: Generate Soundtrack Prompts (for Suno, Flow Music, Udio)
  app.post("/api/generate-soundtrack", async (req, res) => {
    try {
      const { theme, script, duration = 15, musicalStyle = "Cinemático / Hans Zimmer" } = req.body;
      if (!script && !theme) {
        return res.status(400).json({ error: "Roteiro ou tema são necessários para gerar a trilha sonora." });
      }

      const totalMin = Number(duration) || 15;
      const part1End = Math.max(1, Math.round(totalMin * 0.25));
      const part2End = Math.max(part1End + 1, Math.round(totalMin * 0.7));

      const prompt = `Você é um produtor musical e diretor de áudio especializado em trilhas sonoras para vídeos do YouTube e documentários de alto impacto (estilo Hans Zimmer, Jóhann Jóhannsson, Ludovico Einaudi e Max Richter).

Analise o roteiro e o tema abaixo para criar EXATAMENTE 3 PROMPTS OTIMIZADOS DE TRILHA SONORA para plataformas de IA musical (especialmente SUNO AI v3.5/v4, FLOW MUSIC e UDIO).

Tema: "${theme || "Princípio Bíblico e Neurociência"}"
Duração total do vídeo: ~${totalMin} minutos
Estilo Musical Base desejado: "${musicalStyle}"

Roteiro Base:
${(script || theme).slice(0, 3500)}

Divida a trilha sonora em 3 partes/atos narrativos perfeitos para acompanhar a locução sem mascarar a voz:
1. PARTE 1 (Ato 1 - Abertura & Hook): Do início até ~${part1End} min. Clima: tensão inicial, curiosidade, quebra de padrão, mistério e foco cognitivo.
2. PARTE 2 (Ato 2 - Desenvolvimento & Revelação Exegética): De ~${part1End} min até ~${part2End} min. Clima: aprofundamento, elevação harmônica, aceleração suave, epifania e clímax conceitual.
3. PARTE 3 (Ato 3 - Conclusão & Coram Deo / Vitória): De ~${part2End} min até o final (~${totalMin} min). Clima: resolução emocional, majestade inspiradora, clareza serena, vitória e compromisso solene.

Para cada uma das 3 partes, gere um objeto com:
- partNumber: número (1, 2 ou 3)
- actName: título do ato narrativo (ex: "Ato 1: Abertura & Tensão Cognitiva")
- title: nome criativo da faixa musical (ex: "O Despertar da Consciência")
- sectionCoverage: intervalo de tempo e trecho do roteiro coberto (ex: "00:00 às ${String(part1End).padStart(2, '0')}:00 (Hook e Conflito Inicial)")
- mood: descrição expressiva da atmosfera e sentimento em português
- bpm: andamento recomendado (ex: "74-80 BPM")
- genre: subgênero musical (ex: "Cinematic Ambient / Minimalist Neo-Classical")
- instruments: array com 3 a 5 instrumentos característicos
- stylePrompt: prompt em INGLÊS otimizado para a caixa de 'Style' do Suno/Flow Music (máx 150 caracteres, tags separadas por vírgula, e.g. "cinematic ambient, brooding cello, deep analog sub-bass, minimalist felt piano, ticking pulse, atmospheric tension, 76 bpm, instrumental")
- lyricsPrompt: estrutura de metatags para a caixa de 'Lyrics' do Suno/Flow Music no modo instrumental (usando [Instrumental], [Intro], [Build], [Drop/Climax], [Outro])
- tip: dica técnica prática de mixagem/geração para Suno e Flow Music

Retorne a resposta ESTRITAMENTE em formato JSON no seguinte formato:
{
  "parts": [
    {
      "partNumber": 1,
      "actName": "...",
      "title": "...",
      "sectionCoverage": "...",
      "mood": "...",
      "bpm": "...",
      "genre": "...",
      "instruments": ["...", "..."],
      "stylePrompt": "...",
      "lyricsPrompt": "...",
      "tip": "..."
    }
  ]
}`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        }
      });

      const parsed = safeParseJson(response.text, null);
      if (parsed && Array.isArray(parsed.parts) && parsed.parts.length === 3) {
        return res.json({ parts: parsed.parts });
      }

      // Fallback structured generation if parsing is incomplete
      const fallbackParts = [
        {
          partNumber: 1,
          actName: "Ato 1: Abertura & Tensão Inicial",
          title: "Sombra da Incerteza (Hook)",
          sectionCoverage: `00:00 às ${String(part1End).padStart(2, '0')}:00 (Quebra de Padrão & Conflito)`,
          mood: "Tensão psicológica, mistério sóbrio, curiosidade profunda e foco reflexivo.",
          bpm: "74-80 BPM",
          genre: "Cinematic Ambient / Neoclassical Tension",
          instruments: ["Celo solista grave", "Sub-bass analógico pulsante", "Piano com feltro minimalista", "Tic-tac de relógio sutil"],
          stylePrompt: "cinematic ambient, brooding cello solo, deep analog sub-bass, minimalist felt piano, ticking pulse, atmospheric reverb, hans zimmer, 76 bpm, instrumental",
          lyricsPrompt: "[Instrumental]\n[Intro: Minimalist dark piano, low sub drone, rhythmic ticking pulse]\n[Build: Low brooding cello enters, subtle analog sub-bass]\n[Tension: Swelling string pads, atmospheric textures, anticipatory pause]\n[Outro: Fading heartbeat pulse into quiet contemplation]",
          tip: "No Suno v3.5/v4 ou Flow Music: marque a opção 'Instrumental' como ATIVADA. Cole o 'Style Prompt' no campo de Estilo e use o lyricsPrompt na caixa de Letra."
        },
        {
          partNumber: 2,
          actName: "Ato 2: Desenvolvimento & Exegese",
          title: "Revelação & O Peso da Verdade",
          sectionCoverage: `${String(part1End).padStart(2, '0')}:00 às ${String(part2End).padStart(2, '0')}:00 (Exegese, Neurociência & Clímax)`,
          mood: "Epifania intelectual, gravidade teológica, cadência crescente e clímax contemplativo.",
          bpm: "84-90 BPM",
          genre: "Hybrid Cinematic / Emotional Orchestral",
          instruments: ["Cordas em staccato rítmico", "Trompas suaves em harmonia", "Sintetizadores analógicos quentes", "Piano ascendente"],
          stylePrompt: "hybrid cinematic, soaring strings, rhythmic staccato cello, warm analog brass, emotive grand piano, crescendo build, max richter style, 86 bpm, instrumental",
          lyricsPrompt: "[Instrumental]\n[Theme: Warm piano motif over gentle cello bed]\n[Build: Staccato strings enter, rhythmic percussion pulses]\n[Climax: Full orchestral swell, warm brass counter-melody, emotional peak]\n[Transition: Delicate piano descending into reflective silence]",
          tip: "Ideal para manter a retenção e acompanhar revelações de estudos científicos ou exegese bíblica original."
        },
        {
          partNumber: 3,
          actName: "Ato 3: Conclusão & Coram Deo",
          title: "Aurora da Maturidade (Vitória)",
          sectionCoverage: `${String(part2End).padStart(2, '0')}:00 às ${String(totalMin).padStart(2, '0')}:00 (Resolução & Chamada para Ação)`,
          mood: "Serenidade resoluta, majestade inspiradora, clareza moral e triunfo espiritual.",
          bpm: "72-78 BPM",
          genre: "Neoclassical Uplifting / Majestic Soundscape",
          instruments: ["Celo e violinos celestiais", "Piano acústico cristalino", "Pads celestes e reverb etéreo", "Bumbo orquestral suave"],
          stylePrompt: "uplifting cinematic, triumphant strings, luminous piano, ethereal choir pads, emotional resolution, coram deo, inspiring, hans zimmer, 75 bpm, instrumental",
          lyricsPrompt: "[Instrumental]\n[Resolution: Luminous piano solo, open lush string chords]\n[Build: Swelling harmonic strings, warm low brass, deep inspiring pulse]\n[Anthem: Radiant orchestral climax, peaceful triumphant beauty]\n[Outro: Sustained strings fading into absolute peace]",
          tip: "Projetado para fechar o vídeo com chave de ouro, gerando forte apelo emocional e convite para inscrição e reflexão."
        }
      ];

      res.json({ parts: fallbackParts });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar os prompts de trilha sonora.");
    }
  });

  // Step 5: Generate SEO
  app.post("/api/generate-seo", async (req, res) => {
    try {
      const { theme, script } = req.body;
      if (!theme || !script) {
        return res.status(400).json({ error: "Tema e roteiro são obrigatórios." });
      }

      const prompt = `Com base no tema "${theme}" e no seguinte roteiro:

${script}

Sua tarefa é gerar 3 alternativas completas de Título + Descrição + Tags, otimizadas separadamente para:
1. YouTube (vídeo longo)
2. Shorts/Reels (Instagram, TikTok, YouTube Shorts)
3. Blog (SEO on-page)

Para cada alternativa, indique a lógica de CTR/SEO usada (ex: gatilho de curiosidade, palavra-chave de cauda longa, etc.).

Retorne o conteúdo estruturado e legível em Markdown.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar o SEO.");
    }
  });

  // Step 6: Generate Blog Article with Academic Rigor and Sources
  app.post("/api/generate-article", async (req, res) => {
    try {
      const { theme, script, passage, sources } = req.body;
      if (!theme || !script || !passage) {
        return res.status(400).json({ error: "Tema, roteiro e passagem são obrigatórios." });
      }

      let sourcesContext = "";
      if (Array.isArray(sources) && sources.length > 0) {
        sourcesContext = `\n\nFONTES ACADÊMICAS E BÍBLICAS CATALOGADAS NA PESQUISA (CITE-AS NOMINALMENTE NO TEXTO E NA BIBLIOGRAFIA):\n` +
          sources.map((s: any, idx: number) => {
            return `[Fonte ${idx + 1}] (${(s.category || 'ACADÊMICA').toUpperCase()}): ${s.authors || 'Autor'} (${s.year || 's.d.'}). "${s.title || ''}". Publicação: ${s.publication || ''}. Constatação-Chave: ${s.keyFindings || ''}. Conexão Bíblica: ${s.biblicalConnection || ''}.`;
          }).join('\n');
      }

      const prompt = `A partir do tema "${theme}", do roteiro escolhido, da passagem bíblica e das fontes acadêmicas abaixo, gere um artigo longo (1200–2000 palavras) para blog com altíssimo rigor acadêmico, densidade conceitual e credibilidade.

Passagem e Exegese Bíblica:
${passage}

Roteiro Base:
${script}
${sourcesContext}

DIRETRIZES DE ESTRUTURA E CREDIBILIDADE:
1. Título instigante no formato de ensaio teológico-estratégico.
2. Introdução envolvente que estabelece o problema existencial, psicológico e hermenêutico.
3. Seções temáticas com subtítulos analíticos (H2, H3) desenvolvendo os argumentos bíblicos e científicos.
4. Explicação minuciosa dos vocábulos originais (hebraico/aramaico/grego: Lev, Nous, Kardia, Nephesh, Kilyot, Me'im, etc.), detalhando seu sentido anatômico e funcional exato.
5. Integração transdisciplinar explícita: cite nominalmente os estudos acadêmicos e pesquisadores de neurociência/psicologia (neuroplasticidade, córtex pré-frontal, amígdala) e os léxicos filológicos (BDAG, HALOT).
6. Citações bíblicas destacadas em blocos de citação ou aspas com capítulo e versículo explícitos.
7. Conclusão prática com aplicação na tomada de decisão (Lev/Nous).
8. SEÇÃO OBRIGATÓRIA FINAL "## References":
   Liste todas as fontes acadêmicas, léxicos e passagens bíblicas utilizadas, formatadas rigorosamente nas normas da APA 7ª Edição (American Psychological Association) em ordem alfabética: Sobrenome, Iniciais (Ano). *Título em sentence-case*. Editora. Para a Bíblia, formate como: Bíblia Sagrada (Edição Revista e Atualizada no Brasil, J. F. de Almeida, Trad.). (2002). Sociedade Bíblica do Brasil. Inclua as citações autor-data correspondentes no corpo do texto (ex: Kandel et al., 2013; Damásio, 1996; LeDoux, 2002; BDAG, 2000; HALOT, 2001).

Escreva no Tom de Voz Expositivo-Acadêmico e Prático. Retorne o resultado em Markdown.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      handleApiError(res, error, "Erro ao gerar o artigo.");
    }
  });

  // Guarantee that all unmatched API requests return JSON errors, never HTML SPA pages
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Rota de API não encontrada: ${req.method} ${req.path}` });
  });

  // Global Express error handler: ensures any middleware/internal error returns JSON, never HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Express Server Error]", err);
    if (res.headersSent) {
      return next(err);
    }
    const status = typeof err?.status === 'number' ? err.status : 500;
    res.status(status).json({
      error: err?.message && err.message.length < 200 ? err.message : "Erro interno do servidor."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  // Prevent socket timeouts during deep AI content generations
  server.timeout = 240000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer();
