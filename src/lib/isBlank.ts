export const isBlank = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.every(entry => isBlank(entry));
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(entry => isBlank(entry));
  }

  return false;
};

export default isBlank;
