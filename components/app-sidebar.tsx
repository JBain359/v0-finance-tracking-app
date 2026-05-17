"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  List,
  MessageSquare,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, useUser, useDescope } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SlideInLeft } from "@/components/animated-components";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/chat", label: "Ask AI", icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const { user } = useUser();
  const descope = useDescope();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        <SlideInLeft
          delay={0}
          className="flex h-16 items-center gap-2 border-sidebar-border px-6"
        >
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary border-2 border-foreground/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Wallet className="h-5 w-5 text-foreground" />
          </motion.div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            FinTrack
          </span>
        </SlideInLeft>
        {user && (
          <motion.p
            className="border-b px-6 py-2 text-sm text-sidebar-foreground/80"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome <b>{user.givenName}</b>!
          </motion.p>
        )}

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <motion.div
          className="border-t border-sidebar-border p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="mb-3 text-xs text-sidebar-foreground/50">
            Personal Finance Tracker
          </p>
          <motion.button
            onClick={() => {
              descope.logout();
              router.push("signin");
            }}
            className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </motion.button>
        </motion.div>
      </div>
    </aside>
  );
}
