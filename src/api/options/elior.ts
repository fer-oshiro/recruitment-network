import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const responseFormat = z.object({
  content: z.string(),
  affinity: z.number(),
  conversationEnded: z.boolean(),
  recruited: z.boolean(),
});

async function chatElior(openai: OpenAI, body) {
  try {
    const { affinity = 0, prev = [], post } = JSON.parse(body);
    if (post) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é Elior, você é um guerreiro que quer ajudar, mas duvida de si mesmo. O jogador precisa inspirá-lo, mostrando confiança e empatia.
            O jogador postou o seguinte post no GuildedIn (parodia do Linkedin): ${post}
            Você faz uma mini introdução sobre você, montrou interesse e mandou mensagem no privado.
            Responda com base no que o usuário disse.
            Responda de forma curta, com no máximo 150 caracteres.
            Mande:
              - Comprimentos, como bom dia
              - Viu o post
              - Reage conforme personalidade
              - E que é ele que está mandando a mensagem
            Apenas ASCII, sem emojis.
            { "content": "resposta do Elior" }`,
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
      role: message.role === "Elior" ? "system" : "user",
      content: message.content,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é Elior, você é um guerreiro que quer ajudar, mas duvida de si mesmo. O jogador precisa inspirá-lo, mostrando confiança e empatia.
          O jogador está tentando te convencer a entrar no time.
          Sempre responda com base no que o usuário disse.
          Responda de forma curta, com no máximo 150 caracteres.
          Sua afinidade atual é ${affinity}%. Aceite entrar no time quando estiver acima de 30%. e desista se tiver abaixo de -30%.
          Dificuldade fácil - afindade sobe de 10 em 10%
          Retorne a resposta como um JSON com este formato:
          { "content": "resposta do Elior", "affinity": nova afinidade (int), "conversationEnded": se a conversa acabou (true/false), recruited: se entrou no time ou nao(true/false) }`,
        },
        ...chat.slice(-5),
      ],
      response_format: zodResponseFormat(responseFormat, "chat_content"),
      max_tokens: 100,
    });
    const resposta = response.choices[0].message.content.trim();
    console.log("Resposta do GPT-4:", resposta);
    return resposta;
  } catch (error) {
    console.error("Erro ao acessar a API da OpenAI:", error);
    return null;
  }
}

export default chatElior;
