"use client";
import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp } from "@/lib/animations";
import { DotPatternCSS } from "@/components/dot-pattern";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <DotPatternCSS className="text-foreground" opacity={0.08} withDollarSigns={false} />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Welcome to FinTrack
          </h1>
          <p className="text-muted-foreground">
            Sign in to manage your finances
          </p>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-card p-6 shadow-lg"
        >
          <Descope
            flowId="sign-in"
            onSuccess={() => router.push("/")}
            onError={(e) => console.error(e)}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
