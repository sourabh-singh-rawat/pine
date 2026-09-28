export const shouldLoadDevSecrets = (): boolean => {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === undefined || nodeEnv === "" || nodeEnv === "development";
};
