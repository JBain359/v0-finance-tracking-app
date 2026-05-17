"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  List,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, useUser, useDescope } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/chat", label: "Ask AI", icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();
  const descope = useDescope();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            FinTrack
          </span>
        </div>
        {user && (
          <p className="border-b px-6">
            Welcome <b>{user.givenName}</b>!
          </p>
        )}

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50">
            Personal Finance Tracker
          </p>
          <button
            onClick={() => {
              descope.logout();
              router.push("signin");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
