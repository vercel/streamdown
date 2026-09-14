import { GeistdocsHomeLayout } from "@vercel/geistdocs/home-layout";
import { config } from "@/lib/geistdocs/config";
import { source } from "@/lib/geistdocs/source";
import { NavbarScrollBorder } from "./components/navbar-scroll-border";

const Layout = async ({ children, params }: LayoutProps<"/[lang]">) => {
  const { lang } = await params;

  return (
    <GeistdocsHomeLayout config={config} tree={source.pageTree[lang]}>
      <NavbarScrollBorder />
      <div className="bg-background-200 pt-0 pb-32" data-home-page>
        {children}
      </div>
    </GeistdocsHomeLayout>
  );
};

export default Layout;
