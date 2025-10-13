"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SignInCard({
  className,
  onSuccess,
}: { className?: string; onSuccess?: (user: { email: string }) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const next: { email?: string; password?: string } = {}
    if (!email || !email.includes("@")) next.email = "Please enter a valid email address."
    if (!password || password.length < 6) next.password = "Password must be at least 6 characters."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSuccess?.({ email })
  }

  return (
    <Card className={cn("rounded-2xl shadow-md p-6 bg-card dark:bg-gray-900", className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full rounded-lg px-3 py-2 border bg-background text-foreground",
              "border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40",
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              "w-full rounded-lg px-3 py-2 border bg-background text-foreground",
              "border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40",
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Card>
  )
}
