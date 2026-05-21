"use client";
import { Descope } from "@descope/nextjs-sdk";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DotPatternCSS } from "@/components/dot-pattern";
import { GlassCard } from "@/components/glass-card";
import { TrendingUp, Shield, Sparkles, Wallet } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DotPatternCSS
        className="text-foreground"
        opacity={0.08}
        withDollarSigns={false}
      />

      <div className="relative z-10 flex w-full items-center justify-center px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <GlassCard
            className="relative overflow-visible p-8 md:p-12 lg:p-16"
            blur="xl"
            gradient
          >
            <motion.img
              src="https://framerusercontent.com/images/kriKp2ohUOo6lqW7gFpIqNiLZeQ.svg"
              alt="Financial illustration"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="absolute -top-16 -left-40 lg:-top-24 lg:-right-12 w-40 h-40 lg:w-56 lg:h-56 z-10 pointer-events-none"
            />

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
              {/* Left Section - Info */}
              <div className="flex-1 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary border-2 border-primary-stroke"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Wallet className="h-6 w-6 text-primary-foreground" />
                    </motion.div>
                    <span className="text-2xl font-bold text-foreground">
                      FinTrack
                    </span>
                  </div>
                  <h1 className="mb-4 text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                    Get a hold of{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10">your finances</span>
                      <span className="absolute inset-x-0 bottom-1 h-3 bg-primary z-0" />
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Take control of your financial future with intelligent
                    tracking, insights, and AI-powered assistance.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <GlassCard className="p-4" gradient>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary border border-primary-stroke p-2">
                        <TrendingUp className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                          Smart Analytics
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Track spending patterns and get personalized insights
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4" gradient>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary border border-primary-stroke p-2">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                          Secure & Private
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Bank-level encryption keeps your data safe
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4" gradient>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary border border-primary-stroke p-2">
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">
                          AI Assistant
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ask questions and get instant financial advice
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>

              {/* Right Section - Sign In */}
              <div className="flex-shrink-0 lg:w-96 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <h2 className="mb-2 text-3xl font-bold text-foreground">
                    Welcome back
                  </h2>
                  <p className="text-muted-foreground">
                    Sign in to continue to your dashboard
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <GlassCard className="p-6" blur="lg" gradient>
                    <Descope
                      flowId="sign-in"
                      onSuccess={() => router.push("/")}
                      onError={(e) => console.error(e)}
                    />
                  </GlassCard>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-center text-xs text-muted-foreground"
                >
                  By signing in, you agree to our Terms of Service and Privacy
                  Policy
                </motion.p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
