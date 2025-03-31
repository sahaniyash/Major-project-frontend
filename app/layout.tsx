"use client"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider, SignIn, SignOutButton, SignedIn, SignedOut, useAuth, useUser } from "@clerk/nextjs"
import type React from "react"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const createUserInDb = async () => {
      if (userId && user) {
        try {
          const response = await fetch('http://127.0.0.1:5000/user/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.firstName,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create user in database');
          }

          const data = await response.json();
          console.log('User created successfully:', data);
        } catch (error) {
          console.error('Error creating user:', error);
        }
      }
    };

    if (isLoaded && userId) {
      createUserInDb();
    }
  }, [isLoaded, userId, user]);

  return children;
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
            <AuthWrapper>
              <SignedIn>
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
                <Toaster />
              </SignedIn>

              <SignedOut>
                <div className="flex items-center justify-center w-full h-screen">
                  <SignIn routing="hash" />
                </div>
              </SignedOut>
            </AuthWrapper>
          </ThemeProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  )
}