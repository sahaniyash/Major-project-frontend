"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ClerkProvider,
  SignIn,
  SignOutButton,
  SignedIn,
  SignedOut,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import type React from "react";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const API_URI = "http://127.0.0.1:5000/";

  useEffect(() => {
    const createUserInDb = async () => {
      if (userId && user) {
        try {
          const response = await fetch(`${API_URI}user/create-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId,
              email: user.primaryEmailAddress?.emailAddress,
              name: user.username,
              clerkId: userId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to create user in database");
          }

          const data = await response.json();
          console.log("User created successfully:", data.message);
        } catch (error) {
          console.error("Error creating user:", error);
        }
      }
    };

    const updateUserName = async (user_id) => {
      try {
        console.log("updating user name");
        const response = await fetch(`${API_URI}user/update-user-name`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            name: user?.username,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update user name");
        }

        const data = await response.json();
        console.log("user name updated: ", data);
      } catch (error) {
        console.error("Error updating user name", error);
      }
    };

    const updateUserEmail = async (user_id) => {
      try {
        console.log("updating user email");
        const response = await fetch(`${API_URI}user/update_user_email`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            email: user?.primaryEmailAddress?.emailAddress,
          }),
        });

        if (!response.ok) {
          throw new Error("Filed to update user email");
        }

        const data = await response.json();
        console.log("user email updated: ", data);
      } catch (error) {
        console.error("error updateing user email", error);
      }
    };

    const getUserInfo = async () => {
      try {
        const response = await fetch(
          `${API_URI}user/get_user_details?email=${user?.primaryEmailAddress?.emailAddress}`
        );

        if (!response.ok) {
          throw new Error("failed to get user from db");
        }

        const data = await response.json();
        if (data.name != user?.username) {
          updateUserName(data.user_id);
        }
        if (data.email != user?.primaryEmailAddress?.emailAddress) {
          updateUserEmail(data.user_id);
        }
      } catch (error) {
        createUserInDb();
        console.error(error);
      }
    };
    if (isLoaded && user) {
      getUserInfo();
    }
  }, [isLoaded, userId, user]);

  return children;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex h-screen bg-background text-foreground`}
      >
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
      </body>
    </html>
  );
}
