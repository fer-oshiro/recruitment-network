export const handler = async (event: any) => {
  event.response.answerCorrect = true;
  return event;
};
