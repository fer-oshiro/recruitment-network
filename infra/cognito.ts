export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  triggers: {
    defineAuthChallenge: {
      handler: "src/auth/defineAuthChallenge.handler",
      permissions: [
        {
          actions: ["cognito-idp:AdminGetUser", "cognito-idp:AdminCreateUser"],
          resources: ["*"],
        },
      ],
    },
    createAuthChallenge: "src/auth/createAuthChallenge.handler",
    verifyAuthChallengeResponse: "src/auth/verifyAuthChallengeResponse.handler",
  },
});
export const client = new aws.cognito.UserPoolClient("userPoolClient", {
  userPoolId: userPool.id,
  generateSecret: false,
  explicitAuthFlows: [
    "ALLOW_USER_PASSWORD_AUTH",  
    "ALLOW_REFRESH_TOKEN_AUTH",  
    "ALLOW_CUSTOM_AUTH",        
  ],
});

export const identity = new sst.aws.CognitoIdentityPool("IdentityPool", {
  userPools: [
    {
      userPool: userPool.id,
      client: client.id,
    },
  ],
});
