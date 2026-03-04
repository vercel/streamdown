import type { Metadata } from "next";
import { PlaygroundEditor } from "./components/playground-editor";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Try Streamdown in your browser. Edit markdown and see rendered output in real-time.",
};

const Playground = () => <PlaygroundEditor />;

export default Playground;
