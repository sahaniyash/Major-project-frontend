"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart, PieChart, ScatterPlot } from "@/components/charts";
import { ArrowUpRight, Upload, Brain, TrendingUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ProjectTimeline } from "@/components/project-timeline";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

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

  const fetchStats = async () => {
    if (!user) {
      console.log("User not loaded yet");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching stats for user:", user.id);

      // Fetch user's dataset IDs
      const userResponse = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
        credentials: "include",
      });
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      console.log("User data:", userData);
      const datasetIds = userData.dataset_ids || [];
      console.log("Dataset IDs:", datasetIds);

      if (datasetIds.length === 0) {
        console.log("No datasets found for user");
        setStats({ totalDatasets: 0, preprocessedDatasets: 0, pendingPreprocessing: 0 });
        setProjects([]);
        return;
      }

      // Fetch dataset details
      const datasetsPromises = datasetIds.map((id: string) =>
        fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`, {
          credentials: "include",
        }).then((res) => {
          if (!res.ok) {
            console.error(`Failed to fetch dataset ${id}: ${res.status}`);
            return null;
          }
          return res.json();
        })
      );
      const datasets = (await Promise.all(datasetsPromises)).filter((d) => d !== null);
      console.log("Fetched datasets:", datasets);

      // Calculate stats
      const totalDatasets = datasets.length;
      const preprocessedDatasets = datasets.filter((d: any) => d.is_preprocessing_done === true).length;
      const pendingPreprocessing = datasets.filter(
        (d: any) => d.start_preprocessing === true && d.is_preprocessing_done !== true
      ).length;

      console.log("Calculated stats:", { totalDatasets, preprocessedDatasets, pendingPreprocessing });
      setStats({ totalDatasets, preprocessedDatasets, pendingPreprocessing });

      // Map datasets to projects for the timeline (temporary adaptation)
      const projectData = datasets.map((d: any) => ({
        id: d._id,
        name: d.filename,
        type: "Dataset",
        createdAt: new Date(), // Replace with actual timestamp if available
      }));
      setProjects(projectData);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard stats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-xl text-foreground">Hello, {user?.firstName || "User"}</p>
        <Button onClick={() => router.push('/data')}>
          <Upload className="mr-2 h-4 w-4" />
          New Dataset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalDatasets}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalDatasets === 0 ? "No datasets yet" : `${stats.totalDatasets} datasets`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preprocessed Datasets</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.preprocessedDatasets}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.preprocessedDatasets === 0
                    ? "No datasets preprocessed"
                    : `${stats.preprocessedDatasets} completed`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Preprocessing</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pendingPreprocessing}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingPreprocessing === 0
                    ? "No datasets pending"
                    : `${stats.pendingPreprocessing} in queue`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <AreaChart data={[
                  { name: "Preprocessed", value: stats.preprocessedDatasets },
                  { name: "Pending", value: stats.pendingPreprocessing },
                  {
                    name: "Not Started",
                    value: stats.totalDatasets - stats.preprocessedDatasets - stats.pendingPreprocessing,
                  },
                ]} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dataset Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <PieChart
                  data={[
                    { name: "Preprocessed", value: stats.preprocessedDatasets },
                    { name: "Pending", value: stats.pendingPreprocessing },
                    {
                      name: "Not Started",
                      value: stats.totalDatasets - stats.preprocessedDatasets - stats.pendingPreprocessing,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Preprocessing Progress</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ScatterPlot data={[]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={[]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Datasets</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectTimeline projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}