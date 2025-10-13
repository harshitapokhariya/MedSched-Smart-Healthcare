"use client"

import type React from "react"

import { useState } from "react"
import { HospitalProvider } from "@/components/hosp-os/state"
import { TriageView } from "@/components/hosp-os/triage-view"
import { SchedulingView } from "@/components/hosp-os/scheduling-view"
import { BankersView } from "@/components/hosp-os/bankers-view"
import { Ambulance, ListChecks, ShieldCheck, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { SignInCard } from "@/components/auth/sign-in-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TabKey = "triage" | "scheduling" | "bankers"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: "triage", label: "Patient Triage", icon: Ambulance },
  { key: "scheduling", label: "Scheduling", icon: ListChecks },
  { key: "bankers", label: "Banker's Safety", icon: ShieldCheck },
]

export default function Page() {
  const [tab, setTab] = useState<TabKey>("triage")
  const [authOpen, setAuthOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <HospitalProvider>
      <main className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <header className="border-b/0 bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
            <div className="flex items-center justify-between gap-3">
              <nav aria-label="Primary" className="flex items-center gap-2">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    className={cn(
                      "gap-2 relative transition-transform duration-150",
                      "hover:scale-105 active:scale-95",
                      tab === key
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25",
                    )}
                    onClick={() => setTab(key)}
                    aria-pressed={tab === key}
                    aria-label={label}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>{label}</span>
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-primary transition-transform duration-200 origin-left",
                        tab === key ? "scale-x-100" : "scale-x-0",
                      )}
                      aria-hidden
                    />
                  </Button>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                {!authed ? (
                  <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                    <DialogTrigger asChild>
                      <Button
                        aria-label="Open sign in"
                        className={cn(
                          "rounded-full gap-2 relative transition-transform duration-150",
                          "hover:scale-105 active:scale-95",
                          "bg-primary/10 text-primary hover:bg-primary/20",
                          "dark:bg-primary/15 dark:hover:bg-primary/25",
                        )}
                      >
                        Sign In
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sign in</DialogTitle>
                        <DialogDescription>Access MedSched features with your account.</DialogDescription>
                      </DialogHeader>
                      <SignInCard
                        className="p-0 shadow-none border-0"
                        onSuccess={(user) => {
                          setAuthed(true)
                          setUserEmail(user.email)
                          setAuthOpen(false)
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "rounded-full gap-2 pr-3 pl-1 transition-all duration-150",
                          "hover:scale-105 active:scale-95",
                          "bg-primary/10 text-primary",
                          "hover:bg-primary/20 hover:text-primary hover:ring-1 hover:ring-primary/40",
                          "data-[state=open]:bg-primary/25 data-[state=open]:text-primary data-[state=open]:ring-1 data-[state=open]:ring-primary/40",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          "dark:bg-primary/15 dark:hover:bg-primary/25",
                        )}
                        aria-label="Open profile menu"
                        aria-haspopup="menu"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage alt="Profile" src="/placeholder.svg" />
                          <AvatarFallback>
                            {userEmail
                              ? userEmail
                                  .split("@")[0]
                                  .split(/[._-]/)
                                  .slice(0, 2)
                                  .map((p) => p[0]?.toUpperCase() ?? "")
                                  .join("") || "ME"
                              : "ME"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline text-sm font-medium">Profile</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-56">
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">{userEmail}</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="size-4" />
                        My profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setAuthed(false)
                          setUserEmail("")
                        }}
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-4 md:py-6">
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <h1 className="text-4xl font-bold text-primary">MedSched</h1>
              <p className="mt-1 text-lg text-muted-foreground">Smart Scheduling for Smarter Healthcare</p>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <Card className="rounded-2xl shadow-sm p-4 sm:p-6 bg-background text-foreground">
            {tab === "triage" && <TriageView />}
            {tab === "scheduling" && <SchedulingView />}
            {tab === "bankers" && <BankersView />}
          </Card>
        </section>
      </main>
    </HospitalProvider>
  )
}
