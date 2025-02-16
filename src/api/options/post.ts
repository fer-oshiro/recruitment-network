import OpenAI from "openai";

async function verificarPost(openai: OpenAI, inputTexto) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que identifica se um texto é um pedido para integrar um time.",
        },
        {
          role: "user",
          content: `Este texto é um convite para entrar em um time ou se juntar na aventura? Responda apenas com 'yes' ou 'no': "${inputTexto}"`,
        },
      ],
      max_tokens: 5,
    });

    const resposta = response.choices[0].message.content.trim();

    if (resposta === "yes") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente que classifica o tom de postagens em uma das seguintes categorias: confiante, inseguro, soberbo, humorístico ou ansioso.",
          },
          {
            role: "user",
            content: `Classifique o seguinte texto em apenas uma palavra entre: 'confiante', 'inseguro', 'soberbo', 'humoristico' ou 'ansioso' (letra minuscula e sem acento). Texto: "${inputTexto}"`,
          },
        ],
        max_tokens: 5,
      });
      const resposta = response.choices[0].message.content.trim();
      console.log("Resposta do GPT-4:", resposta);
      return resposta;
    }
    console.log("Resposta do GPT-4:", resposta);
    return resposta;
  } catch (error) {
    console.error("Erro ao acessar a API da OpenAI:", error);
    return null;
  }
}

export default verificarPost;
