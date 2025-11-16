import "./global.css";
import "katex/dist/katex.css";
import { ArrowDownWideNarrowIcon } from "lucide-react";
import { Navbar } from "@/components/geistdocs/navbar";
import { GeistdocsProvider } from "@/components/geistdocs/provider";
import { mono, sans } from "@/lib/geistdocs/fonts";
import { cn } from "@/lib/utils";

const Logo = () => (
  <>
    <span className="hidden font-semibold text-xl tracking-tight sm:block">
      Streamdown
    </span>
    <ArrowDownWideNarrowIcon className="sm:hidden" />
  </>
);

const links = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Source",
    href: "https://github.com/vercel/streamdown",
  },
  {
    label: "AI Elements",
    href: "https://ai-sdk.dev/elements",
  },
];

const suggestions = [
  "What is Streamdown?",
  "How does unterminated markdown parsing work?",
  "How is Streamdown secure?",
  "Is Streamdown performance optimized?",
];

const Layout = ({ children }: LayoutProps<"/">) => (
  <html
    className={cn(sans.variable, mono.variable, "scroll-smooth antialiased")}
    lang="en"
    suppressHydrationWarning
  >
    <body>
      <GeistdocsProvider>
        <Navbar items={links} suggestions={suggestions}>
          <Logo />
        </Navbar>
        {children}
      </GeistdocsProvider>
    </body>
  </html>
);

export default Layout;
