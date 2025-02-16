import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { OpenAI } from "openai";
import verificarPost from "./options/post";
import chatElior from "./options/elior";
import chatTharok from "./options/tharok";
import chatVaryn from "./options/varyn";
import chatPreparation from "./options/preparation";
import chatBattle from "./options/battle";

const secret_name = "prod/recruitment_network";
const client = new SecretsManagerClient({
  region: "us-east-1",
});

export const handler = async (event: any = {}): Promise<any> => {
  console.log("event:", event.rawPath, event.body);
  const { rawPath, body } = event;

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT",
      }),
    );
  } catch (error) {
    throw error;
  }

  const secret = JSON.parse(response.SecretString);

  const openai = new OpenAI({ apiKey: secret.openai });
  let resposta = "Não entendi o que você quer. Pode repetir?";
  if (rawPath === "/post") resposta = await verificarPost(openai, body);
  if (rawPath === "/elior") resposta = await chatElior(openai, body);
  if (rawPath === "/tharok") resposta = await chatTharok(openai, body);
  if (rawPath === "/varyn") resposta = await chatVaryn(openai, body);
  if (rawPath === "/preparation")
    resposta = await chatPreparation(openai, body);
  if (rawPath === "/battle") resposta = await chatBattle(openai, body);

  return {
    statusCode: 200,
    body: JSON.stringify(resposta),
  };
};
