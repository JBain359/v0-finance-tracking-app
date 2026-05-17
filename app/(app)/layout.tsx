import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </>
  );
}
