"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Brain, Database, LineChart, Upload, X } from "lucide-react";
import Link from "next/link";
import { useUser, useAuth, SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      setShowSignIn(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sign In Overlay */}
      {showSignIn && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="relative bg-card p-8 rounded-lg shadow-lg min-w-[400px]">
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 z-[60] hover:bg-muted"
              onClick={() => setShowSignIn(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <SignIn routing="hash" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="w-full fixed top-0 z-40 flex justify-center py-4">
        <nav className="mx-auto px-8 py-3 rounded-full bg-background/60 backdrop-blur-md border border-border/40 shadow-lg">
          <ul className="flex items-center gap-8">
            <li>
              <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            {isSignedIn ? (
              <>
                <li>
                  <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/data" className="text-foreground/80 hover:text-foreground transition-colors">
                    Data
                  </Link>
                </li>
                <li>
                  <Link href="/preprocess" className="text-foreground/80 hover:text-foreground transition-colors">
                    Preprocess
                  </Link>
                </li>
              </>
            ) : null}
            {!isSignedIn && (
              <li>
                <Button variant="outline" size="sm" className="ml-4" onClick={() => setShowSignIn(true)}>
                  Sign In
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 mt-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
            Intelligent Data Analysis
            <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"> Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, preprocess, and analyze your datasets with AI-powered recommendations. 
            Transform your data into actionable insights.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleGetStarted}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border border-border hover:border-border/80 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Dataset Upload</CardTitle>
              <CardDescription>
                Upload your CSV files with a simple drag-and-drop interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border hover:border-border/80 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>
                Get intelligent suggestions for data preprocessing based on your goals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border hover:border-border/80 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Visualize and analyze your data with powerful charts and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Upload Your Data</h3>
              <p className="text-muted-foreground">Upload your CSV files and provide project details</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Set Your Goals</h3>
              <p className="text-muted-foreground">Define your objectives and target variables</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Get Recommendations</h3>
              <p className="text-muted-foreground">Receive AI-powered preprocessing suggestions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Analyze Results</h3>
              <p className="text-muted-foreground">View processed data and insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <Card className="bg-card border-border">
          <CardContent className="py-16">
            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-foreground">Ready to Get Started?</h2>
              <p className="text-xl text-muted-foreground">
                Upload your first dataset and experience the power of AI-driven data management
              </p>
              <Button size="lg" className="mt-4 bg-primary hover:bg-primary/90" onClick={handleGetStarted}>
                Start Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-background border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Data Analysis Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}