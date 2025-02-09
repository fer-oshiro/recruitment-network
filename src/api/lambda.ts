import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "prod/recruitment_network";
const client = new SecretsManagerClient({
  region: "us-east-1",
});

export const handler = async (event: any = {}): Promise<any> => {
  console.log("event:", event);

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

  const secret = response.SecretString;
  console.log(secret);
  return {
    statusCode: 200,
    body: JSON.stringify("Hello from Gateway!"),
  };
};
