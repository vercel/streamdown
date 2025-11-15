export type MermaidSecurityLevel =
  | "strict"
  | "loose"
  | "antiscript"
  | "sandbox";

export type MermaidConfig = {
  startOnLoad?: boolean;
  theme?: string;
  securityLevel?: MermaidSecurityLevel;
  fontFamily?: string;
  suppressErrorRendering?: boolean;
  [key: string]: unknown;
};

export type MermaidAPI = {
  initialize: (config: MermaidConfig) => void;
  render: (
    id: string,
    chart: string
  ) => Promise<{
    svg: string;
  }>;
};

export type MermaidLoader = () => Promise<MermaidAPI>;
