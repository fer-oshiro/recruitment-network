export const handler = async (event: any) => {
  event.response.publicChallengeParameters = {};
  event.response.privateChallengeParameters = {};
  event.response.challengeMetadata = "CUSTOM_CHALLENGE";
  return event;
};
