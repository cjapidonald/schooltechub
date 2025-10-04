export const createFileIdentifier = (): string => {
  const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }

  if (cryptoRef && typeof cryptoRef.getRandomValues === "function") {
    const randomBytes = cryptoRef.getRandomValues(new Uint8Array(16));
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
