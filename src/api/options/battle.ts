import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const responseFormat = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["elior", "tharok", "varyn", "inimigo"]),
      content: z.string(),
    }),
  ),
  persuasionLevel: z.number(),
  isConvinced: z.boolean(),
});

const intimidacaoFormat = z.object({
  isBullying: z.boolean(),
  bullyingLevel: z.enum(["low", "medium", "high", "null"]),
});

async function chatBattle(openai: OpenAI, body) {
  try {
    const { persuasionLevel = 0, prev = [], input } = JSON.parse(body);

    if (persuasionLevel >= 20) {
      return {
        persuasionLevel: 100,
        isConvinced: true,
        messages: [
          {
            role: "inimigo",
            content:
              ";-;\n\nP-por que vocês estão fazendo isso comigo...? Vou embora...",
          },
          {
            role: "tharok",
            content: "Hah! Foi fácil demais!",
          },
          {
            role: "varyn",
            content: "Sério? Já tá chorando? Eu nem comecei a me divertir",
          },
          {
            role: "elior",
            content: "Gente... talvez... não precise tanto.",
          },
        ],
      };
    }

    const lastEnemyMessage = prev
      .reverse()
      .find((message) => message.role === "inimigo")?.content;
    const lastEliorMessage = prev
      .reverse()
      .find((message) => message.role === "elior")?.content;
    const lastTharokMessage = prev
      .reverse()
      .find((message) => message.role === "tharok")?.content;
    const lastVarynMessage = prev
      .reverse()
      .find((message) => message.role === "varyn")?.content;

    console.log({
      persuasionLevel,
      lastEnemyMessage,
      lastEliorMessage,
      lastTharokMessage,
      lastVarynMessage,
    });

    const intimidationResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: zodResponseFormat(intimidacaoFormat, "chat_content"),
      max_tokens: 50,
      messages: [
        {
          role: "system",
          content: `
            Você é um sistema que classifica intimidação (bullying verbal) com base na fala do jogador.
            Classifique assim:
            - Nível 1 (Leve): Apelidos bobos, ironias suaves.
            - Nível 2 (Moderado): Sarcasmo afiado, comparações humilhantes.
            - Nível 3 (Forte): Insultos diretos, humilhações.
            Se não houver intimidação, retorne false.

            **Formato de Resposta JSON:**
            {
              "isBullying": <true ou false>,
              "bullyingLevel": <1, 2 ou 3 ou null>
          `,
        },
        {
          role: "user",
          content: input,
        },
      ],
    });

    const { isBullying, bullyingLevel } = JSON.parse(
      intimidationResp.choices[0].message.content,
    );

    console.log({ isBullying, bullyingLevel });

    if (!isBullying) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              Você é um sistema que avalia se o jogador está intimidando o inimigo (fazendo bullying verbal).
              Os personagens devem reagir conforme sua personalidade, mas **NÃO devem repetir frases anteriores**.
              Os personagens e o inimgo estão confuso com a mensagem do jogador.

              **Personagens:**
              - **Tharok:** confuso e ironico
              - **Varyn:** rispido e confuso
              - **Elior:** genuinamente confuso

              **Regras de Variação:**
              - O inimigo não pode falar: ${lastEnemyMessage}
              - Elior não pode falar: ${lastEliorMessage}
              - Tharok não pode falar: ${lastTharokMessage}
              - Varyn não pode falar: ${lastVarynMessage}
              - Sempre use o contexto da ultima mensagem do jogador: ${input}

              **Formato de Resposta:**
              Apenas ASCII, sem emojis.
              {
                \"persuasionLevel\": ${persuasionLevel},
                \"responses\": [
                  {\"role\": \"tharok\", \"content\": \"<resposta irônica>\"},
                  {\"role\": \"varyn\", \"content\": \"<resposta ríspida>\"},
                  {\"role\": \"elior\", \"content\": \"<resposta gentil>\"},
                  {\"role\": \"inimigo\", \"content\": \"<resposta intimidada>\"}
                ]
              }
            `,
          },
        ],
        response_format: zodResponseFormat(responseFormat, "chat_content"),
        max_tokens: 500,
      });
      const resposta = response.choices[0].message.content.trim();
      return JSON.parse(resposta);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Você é um sistema que avalia se o jogador está intimidando o inimigo (fazendo bullying verbal).
            Os personagens devem reagir conforme sua personalidade, mas **NÃO devem repetir frases anteriores**.
            Os personagens estão do lado do jogador e também faz bullying no inimigo

            **Classificação de Nível de Bullying (Para a Reação do Inimigo):**
            - **Nível 1 (Leve):** Apelidos bobos, ironias suaves ('Seu boboca').
            - **Nível 2 (Moderado):** Sarcasmo afiado, comparações humilhantes ('Você luta pior que um espantalho').
            - **Nível 3 (Forte):** Provocações duras, insultos pesados ('Você é um fracasso!').

            **Reações do Inimigo conforme o Nível:**
            - **Nível 1:** Tristeza, abatimento ('Por favor, pare com isso...'). e relacionado a ultima mensagem do jogador: ${input}
            - **Nível 2:** Defensivo ('Como ousa falar algo assim...'). e relacionado a ultima mensagem do jogador: ${input}
            - **Nível 3:** Agressivo e revida ('Você não vai me humilhar!'). e relacionado a ultima mensagem do jogador: ${input}

            **Personagens:**
            - **Tharok:** Arrogante, impulsivo, responde com ironia e sarcasmo.
            - **Varyn:** Competitivo e ríspido, gosta de provocações diretas.
            - **Elior:** Deboches suaves, passivo agressivo.

            **Regras de Variação:**
            - Evite frases repetidas de interações anteriores.
            - O inimigo não pode falar: ${lastEnemyMessage}
            - Elior não pode falar: ${lastEliorMessage}
            - Tharok não pode falar: ${lastTharokMessage}
            - Varyn não pode falar: ${lastVarynMessage}
            - Sempre use o contexto da ultima mensagem do jogador: ${input}
            - Nivel de Bullying: ${bullyingLevel}

            **Persuasion:**
            - O persuasionLevel aumenta sempre +10 pontos quando há intimidação, 0 caso contrário.
            - Valor atual: ${persuasionLevel}
            - isConvinced: false

            **Formato de Resposta:**
            Apenas ASCII, sem emojis.
            {
              \"persuasionLevel\": <atual +10 ou atual>,
              \"responses\": [
                {\"role\": \"tharok\", \"content\": \"<resposta irônica>\"},
                {\"role\": \"varyn\", \"content\": \"<resposta ríspida>\"},
                {\"role\": \"elior\", \"content\": \"<resposta gentil>\"},
                {\"role\": \"inimigo\", \"content\": \"<resposta intimidada>\"}
              ]
            }
          `,
        },
      ],
      response_format: zodResponseFormat(responseFormat, "chat_content"),
      max_tokens: 500,
    });

    const resposta = response.choices[0].message.content.trim();
    console.log(resposta);
    return JSON.parse(resposta);
  } catch (error) {
    console.error("Erro ao acessar a API da OpenAI:", error);
    return null;
  }
}

export default chatBattle;
