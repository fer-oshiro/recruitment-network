/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "recruitment_network",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const lambda = new sst.aws.Function("func_recruitment-network", {
      handler: "src/lambda.handler",
    });
  },
});
