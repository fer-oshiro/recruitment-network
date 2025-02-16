import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const responseFormat = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["elior", "tharok", "varyn"]),
      content: z.string(),
    }),
  ),
  persuasionLevel: z.number(),
  isConvinced: z.boolean(),
});

const convincingFormat = z.object({
  isConvinced: z.boolean(),
});

async function chatPreparation(openai: OpenAI, body) {
  try {
    const { persuasionLevel = 0, input } = JSON.parse(body);

    if (persuasionLevel >= 30) {
      return {
        persuasionLevel: 100,
        isConvinced: true,
        messages: [
          {
            role: "tharok",
            content:
              "Tsc... Claro. Vamos pelas montanhas. E tentem me acompanhar... se puderem.",
          },
          {
            role: "elior",
            content: "Bom... então montanha, né? Obrigado, Tharok.",
          },
          {
            role: "varyn",
            content:
              "Olha só... ele até que fala bonito. Será que sobe rápido mesmo?",
          },
        ],
      };
    }

    const convincingResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Você é um assistente que avalia se o jogador deu um argumento favorece o caminho da montanha

            **Caminhos**:
            - **Vale**
            - **Montanha**

            **Regras**:
            - O jogador deve dar um argumento para ir pela montanha
            - Não precisa ser tao convicente
            - Pode subornar com comidas
            - Pode subornar com promessas


            **Formato de Resposta (JSON):**
            {
              \"isConvinced\": \"yes\" ou \"no\"
            }
        `,
        },
        {
          role: "user",
          content: input,
        },
      ],
      response_format: zodResponseFormat(convincingFormat, "chat_content"),
      max_tokens: 50,
    });

    const { isConvinced } = JSON.parse(
      convincingResponse.choices[0].message.content,
    );

    console.log({ isConvinced });

    if (!isConvinced) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              Você é um assistente que ajuda a decidir o caminho a ser seguido em um jogo de RPG. Mas o usuário escreveu argumento não conviceente.
              Possiveis locais: floresta, montanha
              Palavra proibida: "user"

              Caminhos:
              - **Vale**: rápido e inseguro
              - **Montanha**: lento e seguro

              O jogador disse: "${input}"

              ** Você é Personagens**
              - **Elior**: empatia, diplomacia, inseguro, quer ir pela montanha
              - **Tharok**: ação, impulsividade, rápido e arrogante, quer ir pela montanha
              - **Varyn**: inteligência, cálculo, alto e exposto, mas permite ver de longe, quer ir pelo vale

              Regras de fala:
              - Elior quer ir pela montanha e não vai mudar de ideia
              - Varyn quer ir pela montanha e não vai mudar de ideia
              - Tharok quer ir pelo vale e não vai mudar de ideia
              - Sempre fale algo relacionado ao input do jogador

              persuasionLevel continua o mesmo: ${persuasionLevel}%

              **Exemplo**:
              - messages: {
                  role: nome do personagem (elior) sempre letra minúscula,
                  content: "mensagem do personagem" Apenas ASCII, sem emojis.
                }

              Retorne APENAS no seguinte formato JSON:
              { "messages": [...], "isConvinced": se Tharok está convencido de ir pelas montanhas (yes/no), persuasionLevel: 0-100 }
            `,
          },
          {
            role: "user",
            content: input,
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
          Você é um assistente que ajuda a decidir o caminho a ser seguido em um jogo de RPG. O jogador deu um argumento convincente para Tharok ir pelas montanhas.
          Palavra proibida: "user"

          Caminhos:
          - **Vale**: rápido e inseguro
          - **Montanha**: lento e seguro

          O jogador disse: "${input}"

          ** Você é Personagens**
          - **Elior**: empatia, diplomacia, inseguro, quer ir pela montanha
          - **Tharok**: ação, impulsividade, rápido e arrogante, quer ir pela montanha
          - **Varyn**: inteligência, cálculo, alto e exposto, mas permite ver de longe, quer ir pelo vale

          Regras de fala:
          - Elior quer ir pela montanha e não vai mudar de ideia
          - Varyn quer ir pela montanha e não vai mudar de ideia
          - Tharok quer ir pelo vale e encontra algum argumento contra o jogador
          - Sempre fale algo relacionado ao input do jogador

          persuasionLevel aumenta em 10: ${persuasionLevel}%

          **Exemplo**:
          - messages: {
              role: nome do personagem (elior) sempre letra minúscula,
              content: "mensagem do personagem" Apenas ASCII, sem emojis.
            }

          Retorne APENAS no seguinte formato JSON:
          { "messages": [...], "isConvinced": se Tharok está convencido de ir pelas montanhas (yes/no), persuasionLevel: 0-100 }
          `,
        },
        {
          role: "user",
          content: input,
        },
      ],
      response_format: zodResponseFormat(responseFormat, "chat_content"),
      max_tokens: 500,
    });
    const resposta = response.choices[0].message.content.trim();
    const resp = JSON.parse(resposta);
    return {
      ...resp,
      persuasionLevel: Math.min(100, resp.persuasionLevel + 10),
    };
  } catch (error) {
    console.error("Erro ao acessar a API da OpenAI:", error);
    return null;
  }
}

export default chatPreparation;
