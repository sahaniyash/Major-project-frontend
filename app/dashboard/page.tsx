"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Upload, Brain, TrendingUp, Database } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Lazy load chart components
const AreaChart = lazy(() => import("@/components/charts").then(mod => ({ default: mod.AreaChart })));
const BarChart = lazy(() => import("@/components/charts").then(mod => ({ default: mod.BarChart })));
const PieChart = lazy(() => import("@/components/charts").then(mod => ({ default: mod.PieChart })));
const ScatterPlot = lazy(() => import("@/components/charts").then(mod => ({ default: mod.ScatterPlot })));
const ProjectTimeline = lazy(() => import("@/components/project-timeline").then(mod => ({ default: mod.ProjectTimeline })));

interface DataStats {
  totalDatasets: number;
  preprocessedDatasets: number;
  pendingPreprocessing: number;
}

interface Project {
  id: string;
  name: string;
  type: string;
  accuracy?: number;
  createdAt: Date;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DataStats>({
    totalDatasets: 0,
    preprocessedDatasets: 0,
    pendingPreprocessing: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Memoize chart data
  const chartData = useMemo(() => [
    { name: "Preprocessed", value: stats.preprocessedDatasets },
    { name: "Pending", value: stats.pendingPreprocessing },
    {
      name: "Not Started",
      value: stats.totalDatasets - stats.preprocessedDatasets - stats.pendingPreprocessing,
    },
  ], [stats]);

  const fetchStats = async () => {
    if (!user) return;

    // Check if cache is still valid
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION && stats.totalDatasets > 0) {
      return;
    }

    try {
      setIsLoading(true);
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/get-user?userId=${user.id}`, {
        credentials: "include",
      });
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      const datasetIds = userData.dataset_ids || [];

      if (datasetIds.length === 0) {
        setStats({ totalDatasets: 0, preprocessedDatasets: 0, pendingPreprocessing: 0 });
        setProjects([]);
        return;
      }

      // Batch fetch datasets
      const batchSize = 5;
      const batchedDatasets = [];
      for (let i = 0; i < datasetIds.length; i += batchSize) {
        const batch = datasetIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (id: string) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/dataset/get_dataset?dataset_id=${id}`, {
            credentials: "include",
          }).then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
        );
        const results = await Promise.all(batchPromises);
        batchedDatasets.push(...results.filter((d) => d !== null));
      }

      // Calculate stats
      const totalDatasets = batchedDatasets.length;
      const preprocessedDatasets = batchedDatasets.filter((d: any) => d.is_preprocessing_done === true).length;
      const pendingPreprocessing = batchedDatasets.filter(
        (d: any) => d.start_preprocessing === true && d.is_preprocessing_done !== true
      ).length;

      setStats({ totalDatasets, preprocessedDatasets, pendingPreprocessing });
      setLastFetchTime(now);

      // Map datasets to projects
      const projectData = batchedDatasets.map((d: any) => ({
        id: d._id,
        name: d.filename,
        type: "Dataset",
        createdAt: new Date(d.created_at || Date.now()),
      }));
      setProjects(projectData);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {user?.firstName || 'User'}</p>
        </div>
        <Button onClick={() => router.push('/data')} className="bg-primary hover:bg-primary/90">
          <Upload className="mr-2 h-4 w-4" /> Upload Dataset
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <Database className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading stats...</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats.totalDatasets}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalDatasets === 0 ? "No datasets uploaded" : `${stats.totalDatasets} total datasets`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preprocessed Datasets</CardTitle>
            <Brain className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-500"></div>
                <p className="text-sm text-muted-foreground">Loading stats...</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats.preprocessedDatasets}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.preprocessedDatasets === 0
                    ? "No datasets preprocessed"
                    : `${stats.preprocessedDatasets} completed`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Preprocessing</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
                <p className="text-sm text-muted-foreground">Loading stats...</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats.pendingPreprocessing}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.pendingPreprocessing === 0
                    ? "No datasets pending"
                    : `${stats.pendingPreprocessing} in queue`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-background">Performance</TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-background">Models</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] relative">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  }>
                    <AreaChart data={chartData} />
                  </Suspense>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Dataset Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] relative">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  }>
                    <PieChart data={chartData} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="performance">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Dataset Preprocessing Progress</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                }>
                  <ScatterPlot data={[]} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="models">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Model Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                }>
                  <BarChart data={[]} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card className="mt-8 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Recent Datasets</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          }>
            <ProjectTimeline projects={projects} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}