import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar variant="admin" />
      <main className="lg:ml-[220px] pt-page-top px-4 lg:px-page-x pb-12">
        <PageTransition>{children}</PageTransition>
      </main>
      <CommandPalette />
    </div>
  );
}
