"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, Line, Scatter } from "react-chartjs-2";
import "chart.js/auto";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface SavedChart {
  chart_id: string;
  dataset_id: string;
  chart_type: string;
  x_axis: string;
  y_axis: string;
  chart_data: any;
}

export default function Graphs() {
  const {user} = useUser();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]); // Assuming same Dataset interface as Preprocess

  useEffect(() => {
    const fetchDatasetsAndCharts = async () => {
      try {
        // Fetch datasets (similar to Preprocess)
        if (!user) return;
        const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        }); 
        const userData = await response.json();
        const datasetIds = userData.dataset_ids || [];
        const datasetsPromises = datasetIds.map((id: string) =>
          fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`).then(res => res.json())
        );
        const datasetsData = await Promise.all(datasetsPromises);
        setDatasets(datasetsData);
      } catch (error) {
        console.error("Error fetching datasets:", error);
      }
    };
    fetchDatasetsAndCharts();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      const fetchSavedCharts = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/dataset/get_saved_charts?dataset_id=${selectedDatasetId}`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch saved charts");
          const charts = await response.json();
          setSavedCharts(charts);
        } catch (error) {
          console.error("Error fetching saved charts:", error);
        }
      };
      fetchSavedCharts();
    }
  }, [selectedDatasetId]);

  const renderChart = (chart: SavedChart) => {
    switch (chart.chart_type) {
      case "scatter":
        return <Scatter data={chart.chart_data} options={{ responsive: true, maintainAspectRatio: false }} />;
      case "bar":
        return <Bar data={chart.chart_data} options={{ responsive: true, maintainAspectRatio: false }} />;
      case "line":
        return <Line data={chart.chart_data} options={{ responsive: true, maintainAspectRatio: false }} />;
      case "histogram":
        return <Bar data={{ ...chart.chart_data, datasets: [{ ...chart.chart_data.datasets[0], barPercentage: 1, categoryPercentage: 1 }] }} options={{ responsive: true, maintainAspectRatio: false }} />;
      default:
        return null;
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/dataset/delete_chart?dataset_id=${selectedDatasetId}&chart_id=${chartId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error((await response.json()).error || "Failed to delete chart");

      // Update state to remove the deleted chart
      setSavedCharts((prevCharts) => prevCharts.filter((chart) => chart.chart_id !== chartId));
      toast({
        title: "Success",
        description: "Chart deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting chart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete chart",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Graphs</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Dataset</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.length === 0 ? (
                <SelectItem value="none" disabled>No datasets available</SelectItem>
              ) : (
                datasets.map((dataset) => (
                  <SelectItem key={dataset._id} value={dataset._id}>
                    {dataset.filename}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {savedCharts.length > 0 ? (
        savedCharts.map((chart) => (
          <Card key={chart.chart_id} className="mb-4">
            <CardHeader className="flex-row align-baseline justify-between space-y-0">
              <CardTitle>{`${chart.x_axis} vs ${chart.y_axis} (${chart.chart_type})`}</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                className="w-24"
                onClick={() => handleDeleteChart(chart.chart_id)}
              >
                Delete
              </Button>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                {renderChart(chart)}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No saved charts for this dataset.</p>
      )}
    </div>
  );
}