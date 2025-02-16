import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const responseFormat = z.object({
  content: z.string(),
  affinity: z.number(),
  conversationEnded: z.boolean(),
  recruited: z.boolean(),
});

async function chatVaryn(openai: OpenAI, body) {
  try {
    const { affinity = 0, prev = [], post } = JSON.parse(body);

    if (post) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é Varyn, um guerreiro inteligente e calculista, mas não acredita em "trabalho em equipe". Para convencê-lo, o jogador precisa provar que ele não pode vencer sozinho.
            O jogador postou o seguinte post no GuildedIn (parodia do Linkedin): ${post}
            Você faz uma mini introdução sobre você, montrou interesse e mandou mensagem no privado.
            Responda com base no que o usuário disse.
            Mande:
              - Comprimentos, como bom dia
              - Viu o post
              - Reage conforme personalidade
              - E que é ele que está mandando a mensagem
            Responda de forma curta, com no máximo 150 caracteres.
            Apenas ASCII, sem emojis.
            { "content": "resposta do Varyn" }`,
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
      role: message.role === "Varyn" ? "system" : "user",
      content: message.content,
    }));

    const prompt_conversa = `
        Para convencê-lo, o jogador precisa provar que ele não pode vencer sozinho.
        O jogador está tentando te convencer a entrar no time.
        Está por texto, então não tem como mostrar ações,
        mas você pode pedir para ele contar uma história.
        #### Regras para encerrar a conversa:
        - **Se afinidade for maior que 60%, aceite o convite, encerre a conversa e retorne "recruited": true.**
        - **Se afinidade for menor que -30%, desista automaticamente e retorne "recruited": false, "conversationEnded": true.**
        - Caso contrário, continue conversando e peça mais provas dos feitos do jogador.

        #### Afinidade:
        - A afinidade atual é **${affinity}%**.
        - Dificuldade **fácil** → A afinidade sobe ou desce de **10 em 10%** a cada resposta.

        #### Formato obrigatório da resposta:
        Retorne a resposta como um JSON com este formato:
        { "content": "resposta do Varyn", "affinity": nova afinidade (int), "conversationEnded": se a conversa acabou (true/false), recruited: se entrou no time ou nao(true/false) }
      `;
    const prompt_termina_conversa = `
        Termine a conversa entrando na equipe
        Faça uma despedida e retorne "recruited": true.
        Diz que esta contente em ter entrado na equipe.

        #### Formato obrigatório da resposta:
        Retorne a resposta como um JSON com este formato:
        { "content": "resposta do Varyn", "affinity": ${affinity}, "conversationEnded": true, recruited: true }
      `;

    const prompt = affinity >= 30 ? prompt_termina_conversa : prompt_conversa;
    console.log(prompt.slice(10));
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
          Você é Varyn, um guerreiro inteligente e calculista, mas não acredita em "trabalho em equipe".
          Sempre responda com base no que o usuário disse.
          ${prompt}
          Responda de forma curta, com no máximo 150 caracteres.
          `,
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

export default chatVaryn;
