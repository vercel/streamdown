import { createContext, useContext } from "react";

type CodeBlockContextType = {
  code: string;
};

export const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export const useCodeBlockContext = () => {
  const context = useContext(CodeBlockContext);

  if (!context) {
    throw new Error(
      "useCodeBlockContext must be used within a CodeBlockProvider"
    );
  }

  return context;
};
