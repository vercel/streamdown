import { createContext, useContext } from "react";

interface CodeBlockContextType {
  code: string;
}

export const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export const useCodeBlockContext = () => useContext(CodeBlockContext);
