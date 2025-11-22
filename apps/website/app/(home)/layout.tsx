import { HomeLayout } from "@/components/geistdocs/home-layout";

const Layout = ({ children }: LayoutProps<"/">) => (
  <HomeLayout>
    <div className="bg-sidebar pt-0">{children}</div>
  </HomeLayout>
);

export default Layout;
