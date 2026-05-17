import { AppSidebar } from "@/components/app-sidebar";
import { DotPatternCSS } from "@/components/dot-pattern";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DotPatternCSS
        className="text-foreground"
        opacity={0.08}
        withDollarSigns={false}
      />
      <AppSidebar />
      <main className="relative z-10 ml-64 min-h-screen">{children}</main>
    </>
  );
}
