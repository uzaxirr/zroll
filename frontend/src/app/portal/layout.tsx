import { Sidebar } from "@/components/sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar variant="contributor" />
      <main className="ml-[220px] pt-page-top px-page-x pb-12">
        {children}
      </main>
    </div>
  );
}
