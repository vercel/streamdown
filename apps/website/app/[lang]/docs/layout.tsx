import { DocsLayout } from "@/components/geistdocs/docs-layout";
import { getRootLang } from "@/lib/geistdocs/root-params";
import { source } from "@/lib/geistdocs/source";

const Layout = async ({ children }: LayoutProps<"/[lang]/docs">) => {
  const lang = await getRootLang();

  return (
    <div className="bg-background-200">
      <DocsLayout tree={source.pageTree[lang]}>{children}</DocsLayout>
    </div>
  );
};

export default Layout;
