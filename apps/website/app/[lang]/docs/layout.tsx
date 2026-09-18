import { DocsLayout } from "@/components/geistdocs/docs-layout";
import { source } from "@/lib/geistdocs/source";

const Layout = async ({ children, params }: LayoutProps<"/[lang]/docs">) => {
  const { lang } = await params;

  return (
    <div className="bg-background-200">
      <DocsLayout tree={source.pageTree[lang]}>{children}</DocsLayout>
    </div>
  );
};

export default Layout;
