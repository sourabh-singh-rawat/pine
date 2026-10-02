export const readApiData = (body: unknown): unknown => {
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new Error("Invalid API response envelope");
  }

  return body.data;
};
