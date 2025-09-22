export const Document = ({ children }: { children: unknown }) => children;
export const Page = ({ children }: { children: unknown }) => children;
export const Text = ({ children }: { children: unknown }) => children;
export const View = ({ children }: { children: unknown }) => children;
export const Image = ({ children }: { children: unknown }) => children;
export const Link = ({ children }: { children: unknown }) => children;
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
};
export const renderToBuffer = async () => new Uint8Array([1]);
