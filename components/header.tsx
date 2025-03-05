"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, User, Plus, BarChart, Brain, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignOutButton, useClerk, useAuth, useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { openUserProfile } = useClerk();
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleUserDelete = async () => {
    if (!userId || !user) {
      console.error("User ID or user object missing");
      return;
    }

    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }

    try {
      // Delete from your backend (MongoDB)
      const response = await fetch(
        `http://127.0.0.1:5000/user/delete_user?userId=${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user from database");
      }

      const data = await response.json();
      console.log("Delete response from backend:", data);

      // Delete from Clerk
      await user.delete();
      console.log("User deleted from Clerk");
      router.push("/"); // Redirect after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      // alert("Failed to delete account: " + error.message);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Analysis</DialogTitle>
                <DialogDescription>Choose the type of analysis you want to perform</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <BarChart className="h-8 w-8" />
                  Data Analysis
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <Brain className="h-8 w-8" />
                  Model Training
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                  <Database className="h-8 w-8" />
                  Data Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search analyses, models, or datasets..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Button onClick={() => openUserProfile()} className="w-full" variant="outline">
                  Update Profile
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button
                  onClick={handleUserDelete}
                  className="w-full"
                  variant="destructive" // Assuming your UI lib has this variant
                >
                  Delete Account
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <SignOutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}