export const getClientInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/[\s-_]+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};
