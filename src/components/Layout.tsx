import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}