"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  Send,
  Clock,
  Briefcase,
  DollarSign,
  Monitor,
  Lock,
  Search,
} from "lucide-react";

const adminPages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contributors", href: "/dashboard/contributors", icon: Users },
  { label: "Run Payroll", href: "/dashboard/payroll/run", icon: Send },
  { label: "History", href: "/dashboard/history", icon: Clock },
  { label: "Settings", href: "/dashboard/settings", icon: Briefcase },
];

const contributorPages = [
  { label: "My Payments", href: "/portal", icon: DollarSign },
  { label: "Tax Summary", href: "/portal/tax", icon: Monitor },
  { label: "Viewing Keys", href: "/portal/viewing-keys", icon: Lock },
];

const allPages = [...adminPages, ...contributorPages];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="bg-white rounded-card border border-card-border shadow-2xl overflow-hidden"
          label="Command palette"
        >
          <div className="flex items-center gap-3 px-4 border-b border-card-border">
            <Search className="w-4 h-4 text-muted" />
            <Command.Input
              placeholder="Search pages..."
              className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-muted"
              autoFocus
            />
            <kbd className="text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-secondary">
              No results found.
            </Command.Empty>
            <Command.Group heading="Pages" className="text-xs text-muted px-2 py-1.5">
              {allPages.map((page) => {
                const Icon = page.icon;
                return (
                  <Command.Item
                    key={page.href}
                    value={page.label}
                    onSelect={() => {
                      router.push(page.href);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-primary cursor-pointer data-[selected=true]:bg-green/5 data-[selected=true]:text-green"
                  >
                    <Icon className="w-4 h-4" />
                    {page.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
