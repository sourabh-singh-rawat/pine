import { InvalidResourceKeyError } from "../errors";
import { isResource, type Resource } from "./AllResources";

const isResourceKey = (key: string): boolean => {
  const separator = key.indexOf(":");
  return separator > 0 && separator === key.lastIndexOf(":") && separator < key.length - 1;
};

export const parseResource = (
  key: string,
): {
  namespace: Resource;
  id: string;
} => {
  if (!isResourceKey(key)) {
    throw new InvalidResourceKeyError(`Invalid resource key: ${key}`);
  }

  const separator = key.indexOf(":");
  const namespace = key.slice(0, separator);
  if (!isResource(namespace)) {
    throw new InvalidResourceKeyError(`Invalid resource key: ${key}`);
  }

  return {
    namespace,
    id: key.slice(separator + 1),
  };
};

export const tryParseResource = (
  key: string,
):
  | {
      namespace: Resource;
      id: string;
    }
  | undefined => {
  try {
    return parseResource(key);
  } catch (error) {
    if (error instanceof InvalidResourceKeyError) {
      return undefined;
    }
    throw error;
  }
};
