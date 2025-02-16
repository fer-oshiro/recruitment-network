/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "recruitment-network",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const cognito = await import("./infra/cognito");

    const api = new sst.aws.ApiGatewayV2("gateway_recruitment-network", {
      domain: {
        name: `${$app.stage}-recruitment-network.charmcodez.com`,
        path: "v1",
      },
    });

    api.route("POST /confirm", {
      handler: "src/auth/confirmUser.handler",
      permissions: [
        {
          actions: ["cognito-idp:AdminConfirmSignUp"],
          resources: ["*"],
        },
      ],
    });

    cognito.userPool.id.apply((userPoolID) => {
      cognito.client.id.apply((poolClient) => {
        const authorizer = api.addAuthorizer({
          name: "cognito",
          jwt: {
            issuer: $interpolate`https://cognito-idp.us-east-1.amazonaws.com/${userPoolID}`,
            audiences: [poolClient],
          },
        });
        api.route(
          "POST /{proxy+}",
          {
            handler: "src/api/lambda.handler",
            permissions: [
              {
                actions: ["secretsmanager:GetSecretValue"],
                resources: ["*"],
              },
            ],
          },
          {
            auth: { jwt: { authorizer: authorizer.id } },
          },
        );
      });
    });

    cognito.userPool.id.apply(console.log);
    cognito.client.id.apply(console.log);
    cognito.identity.id.apply(console.log);

    return {
      defaultOutput: {
        api: api.url,
        userPool: cognito.userPool.id,
        client: cognito.client.id,
        identity: cognito.identity.id,
      },
    };
  },
});
