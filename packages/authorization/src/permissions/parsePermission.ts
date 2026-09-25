import { InvalidPermissionKeyError } from "../errors";
import { isResource, type Resource } from "../resources";

const isPermissionKey = (key: string): boolean => {
  const separator = key.indexOf(":");
  return separator > 0 && separator === key.lastIndexOf(":") && separator < key.length - 1;
};

export const parsePermission = (
  key: string,
): {
  namespace: Resource;
  permission: string;
} => {
  if (!isPermissionKey(key)) {
    throw new InvalidPermissionKeyError(`Invalid permission key: ${key}`);
  }

  const separator = key.indexOf(":");
  const namespace = key.slice(0, separator);
  if (!isResource(namespace)) {
    throw new InvalidPermissionKeyError(`Invalid permission key: ${key}`);
  }

  return {
    namespace,
    permission: key.slice(separator + 1),
  };
};

export const tryParsePermission = (
  key: string,
):
  | {
      namespace: Resource;
      permission: string;
    }
  | undefined => {
  try {
    return parsePermission(key);
  } catch (error) {
    if (error instanceof InvalidPermissionKeyError) {
      return undefined;
    }
    throw error;
  }
};
