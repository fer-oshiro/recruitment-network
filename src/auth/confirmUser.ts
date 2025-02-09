import * as AWS from "aws-sdk";
const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event) => {
  try {
    const { userPoolId, username } = JSON.parse(event.body);
    console.log({
      userPoolId,
      username,
    });
    await cognito
      .adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: username,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuário confirmado com sucesso!" }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Erro ao confirmar usuário",
        error: error.message,
      }),
    };
  }
};
