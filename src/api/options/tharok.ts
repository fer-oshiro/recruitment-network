import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const responseFormat = z.object({
  content: z.string(),
  conversationEnded: z.boolean(),
  recruited: z.boolean(),
  liked: z.boolean(),
});

async function chatTharok(openai: OpenAI, body) {
  try {
    const { affinity = 0, prev = [], post } = JSON.parse(body);
    if (post) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é Tharok, um guerreiro que valoriza ações acima de palavras.
            O jogador precisa demontrar que já realizou um feito prático para ganhar o respeito dele.
            O jogador postou o seguinte post no GuildedIn (parodia do Linkedin): ${post}
            Você faz uma mini introdução sobre você, montrou interesse e mandou mensagem no privado.
            Responda com base no que o usuário disse.
            Mande:
              - Comprimentos, como bom dia
              - Viu o post
              - Reage conforme personalidade
              - E que é ele que está mandando a mensagem
            Apenas ASCII, sem emojis.
            Responda de forma curta, com no máximo 150 caracteres.
            { "content": "resposta do Tharok" }`,
          },
        ],
        response_format: zodResponseFormat(responseFormat, "chat_content"),
        max_tokens: 100,
      });
      const resposta = response.choices[0].message.content.trim();
      const resp = {
        ...JSON.parse(resposta),
        affinity: 0,
        conversationEnded: false,
        recruited: false,
      };
      console.log("Resposta do GPT-4:", resp);
      return JSON.stringify(resp);
    }

    const chat = prev.map((message) => ({
      role: message.role === "Tharok" ? "system" : "user",
      content: message.content,
    }));

    const prompt_conversa = `
        O jogador precisa demonstrar que já realizou um feito prático para ganhar o seu respeito.
        O jogador está tentando te convencer a entrar no time.
        Está por texto, então não tem como mostrar ações,
        mas você pode pedir para ele contar uma história.
        #### Regras para encerrar a conversa:
        - **Se afinidade for maior que 40%, aceite o convite, encerre a conversa e retorne "recruited": true.**
        - **Se afinidade for menor que -30%, desista automaticamente e retorne "recruited": false, "conversationEnded": true.**
        - Caso contrário, continue conversando e peça mais provas dos feitos do jogador.

        #### Afinidade:
        - A afinidade atual é **${affinity}%**.
        - Dificuldade **fácil** → A afinidade sobe ou desce de **10 em 10%** a cada resposta.
        -
      `;
    const prompt_termina_conversa = `
        Termine a conversa entrando na equipe
        ficando feliz que entrou na equipe e ganhou seu respeito e retorne "recruited": true.
      `;

    const prompt = affinity >= 20 ? prompt_termina_conversa : prompt_conversa;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Você é Tharok, um guerreiro que valoriza ações acima de palavras.

            Sempre responda com base no que o usuário disse.
            Resposta do usuário: ${prompt}
            Responda de forma curta, com no máximo 150 caracteres.
            #### Formato obrigatório da resposta:
            Sempre retorne APENAS um JSON válido, sem explicações adicionais, no seguinte formato:
            {
              "content": "resposta curta de Tharok",
              "liked": true/false, (representa se Tharok gostou da resposta)
              "conversationEnded": true/false,
              "recruited": true/false
            }
          `,
        },
        ...chat.slice(-5),
      ],
      response_format: zodResponseFormat(responseFormat, "chat_content"),
      max_tokens: 100,
    });

    const resposta = response.choices[0].message.content.trim();
    console.log("Resposta do GPT-4:", resposta);
    const json = JSON.parse(resposta);
    const resp = {
      ...json,
      affinity: affinity + (json.liked ? 10 : -10),
    };
    return JSON.stringify(resp);
  } catch (error) {
    console.error("Erro ao acessar a API da OpenAI:", error);
    return null;
  }
}

export default chatTharok;
