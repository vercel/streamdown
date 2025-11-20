import { createContext, useContext } from "react";

type CodeBlockContextType = {
  code: string;
};

export const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export const useCodeBlockContext = () => useContext(CodeBlockContext);
