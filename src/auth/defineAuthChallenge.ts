import * as AWS from "aws-sdk";
const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event) => {
  const userPoolId = event.userPoolId;
  const username =
    event.request.userAttributes?.sub || event.request.userNotFound
      ? event.request.challengeAnswer
      : event.userName;

  try {
    await cognito
      .adminGetUser({
        UserPoolId: userPoolId,
        Username: username,
      })
      .promise();
  } catch (error) {
    if (error.code === "UserNotFoundException") {
      console.log(`Usuário não encontrado. Criando usuário: ${username}`);

      await cognito
        .adminCreateUser({
          UserPoolId: userPoolId,
          Username: username,
          UserAttributes: [{ Name: "custom:is_anonymous", Value: "true" }],
          MessageAction: "SUPPRESS",
        })
        .promise();
    } else {
      throw error;
    }
  }

  if (event.request.session && event.request.session.length >= 1) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
  }

  return event;
};
