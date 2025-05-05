import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  withoutFooter?: boolean;
}

export function MainLayout({ 
  children, 
  fullWidth = false,
  withoutFooter = false
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {fullWidth ? (
          children
        ) : (
          <div className="container py-8 md:py-10">{children}</div>
        )}
      </main>
      {!withoutFooter && <Footer />}
    </div>
  );
}
