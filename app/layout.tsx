import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider, SignIn, SignOutButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Data Analyst",
  description: "Advanced Machine Learning Platform: Analyze, Train, and Deploy with Ease",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen bg-background text-foreground`}>
        <ClerkProvider>
          <ThemeProvider>
            {/* Show dashboard only if user is signed in */}
            <SignedIn>
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
              </div>
              <Toaster />
              {/* <SignOutButton /> */}
            </SignedIn>

            {/* Show sign-in page if user is not signed in */}
            <SignedOut>
              <div className="flex items-center justify-center w-full h-screen">
                <SignIn routing="hash" />
              </div>
            </SignedOut>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
