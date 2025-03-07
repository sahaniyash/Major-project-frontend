"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import "chart.js/auto";
import { Line, Bar, Scatter, Doughnut } from "react-chartjs-2";

interface Dataset {
  _id: string;
  filename: string;
  dataset_description: string;
  is_preprocessing_done: boolean;
  Is_preprocessing_form_filled: boolean;
  start_preprocessing: boolean;
  test_dataset_percentage: number;
  remove_duplicate: boolean;
  scaling_and_normalization: boolean;
  increase_the_size_of_dataset: boolean;
}

export default function Preprocess() {
  const { user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [missingValuesOption, setMissingValuesOption] = useState<string>("drop");
  const [normalizeOption, setNormalizeOption] = useState<string>("minmax");
  const [isLoading, setIsLoading] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>("scatter");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [chartData, setChartData] = useState<any>(null);
  const [savedCharts, setSavedCharts] = useState<any[]>([]);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchUserDatasets = async () => {
      if (!user) {
        console.log("User not loaded yet");
        return;
      }

      console.log("Fetching user data for Clerk ID:", user.id);
      try {
        const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
        }

        const userData = await response.json();
        console.log("User data received:", userData);
        if (!userData.user_id) {
          throw new Error("MongoDB user_id not found in user data");
        }
        setMongoUserId(userData.user_id);

        const datasetIds = userData.dataset_ids || [];
        console.log("Extracted dataset IDs:", datasetIds);

        const datasetsPromises = datasetIds.map(async (id: string) => {
          const response = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
          if (!response.ok) {
            console.error(`Failed to fetch dataset ${id}`);
            return null;
          }
          return response.json();
        });

        const datasetsData = (await Promise.all(datasetsPromises)).filter((data) => data !== null);
        console.log("Fetched datasets:", datasetsData);
        setDatasets(datasetsData);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserDatasets();
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mongoUserId) {
      console.log("Missing:", { selectedFile, mongoUserId });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", mongoUserId);
    formData.append("project_name", selectedFile.name.split(".")[0]);

    try {
      console.log("Uploading file:", selectedFile.name);
      const response = await fetch("http://127.0.0.1:5000/dataset/add_dataset", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      const data = await response.json();
      setDatasets((prev) => [...prev, data]);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "Dataset uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload dataset",
        variant: "destructive",
      });
    }
  };

  const handlePreprocess = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "Error",
        description: "Please select a dataset to preprocess",
        variant: "destructive",
      });
      return;
    }

    const preprocessOptions = {
      dataset_id: selectedDatasetId,
      missing_values: missingValuesOption,
      normalization: normalizeOption,
    };

    try {
      console.log("Preprocessing with options:", preprocessOptions);
      const response = await fetch("http://127.0.0.1:5000/dataset/start_preprocessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preprocessOptions),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Preprocessing failed");
      }
      const updatedDataset = await response.json();
      console.log("Updated dataset:", updatedDataset);
      setDatasets((prev) =>
        prev.map((d) => (d._id === updatedDataset._id ? updatedDataset : d))
      );
      toast({
        title: "Success",
        description: "Preprocessing applied successfully",
      });
    } catch (error) {
      console.error("Error preprocessing dataset:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preprocess dataset",
        variant: "destructive",
      });
    }
  };

  // Modified handleGenerateVisualization to save chart
  const handleGenerateVisualization = async () => {
    if (!selectedDatasetId || !chartType || !xAxis || !yAxis) {
      toast({ title: "Error", description: "Please select all visualization options", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/dataset/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: selectedDatasetId, chart_type: chartType, x_axis: xAxis, y_axis: yAxis }),
        credentials: "include",
      });
      if (!response.ok) throw new Error((await response.json()).error || "Visualization failed");
      const data = await response.json();

      const chartConfig = {
        labels: data.x_data,
        datasets: [{
          label: `${xAxis} vs ${yAxis}`,
          data: chartType === "scatter" ? data.x_data.map((x: number, i: number) => ({ x, y: data.y_data[i] })) : data.y_data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        }],
      };
      setChartData(chartConfig);

      // Save the chart to backend
      const saveResponse = await fetch("http://127.0.0.1:5000/dataset/save_visualization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: selectedDatasetId,
          chart_type: chartType,
          x_axis: xAxis,
          y_axis: yAxis,
          chart_data: chartConfig
        }),
        credentials: "include",
      });
      if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || "Failed to save chart");
      toast({ title: "Success", description: "Chart generated and saved", });
    } catch (error) {
      console.error("Error generating/saving visualization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate/save visualization",
        variant: "destructive",
      });
    }
  };

  const renderChart = () => {
      if (!chartData) return <p>Select options and generate a chart to view here.</p>;
      switch (chartType) {
        case "scatter":
          return <Scatter data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
        case "bar":
          return <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
        case "line":
          return <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
        case "histogram": // Simplified histogram as bar chart
          return <Bar data={{ ...chartData, datasets: [{ ...chartData.datasets[0], barPercentage: 1, categoryPercentage: 1 }] }} options={{ responsive: true, maintainAspectRatio: false }} />;
        default:
          return null;
      }
    };

  // Fetch column names when dataset changes
  useEffect(() => {
    const fetchColumnNames = async () => {
      if (!selectedDatasetId) {
        setColumnNames([]);
        setChartData(null);
        return;
      }
      try {
        const response = await fetch(`http://127.0.0.1:5000/dataset/get_column_names?dataset_id=${selectedDatasetId}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Failed to fetch column names: ${await response.text()}`);
        const data = await response.json();
        setColumnNames(data.column_names || []);
      } catch (error) {
        console.error("Error fetching column names:", error);
        toast({ title: "Error", description: "Failed to fetch column names", variant: "destructive" });
        setColumnNames([]);
      }
    };
    fetchColumnNames();
  }, [selectedDatasetId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Preprocessing and Visualization</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload or Select Dataset</CardTitle>
          <CardDescription>Select an existing dataset or upload a new CSV/Excel file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading datasets...</SelectItem>
                ) : datasets.length === 0 ? (
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
            <div className="flex gap-4">
              <Input type="file" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
              <Button onClick={handleUpload} disabled={!selectedFile || !mongoUserId}>
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="preprocess">
        <TabsList>
          <TabsTrigger value="preprocess">Preprocess</TabsTrigger>
          <TabsTrigger value="visualize">Visualize</TabsTrigger>
        </TabsList>
        <TabsContent value="preprocess">
          <Card>
            <CardHeader>
              <CardTitle>Preprocessing Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label className="block mb-2">Handle Missing Values</label>
                  <Select onValueChange={setMissingValuesOption} value={missingValuesOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drop">Drop rows</SelectItem>
                      <SelectItem value="mean">Replace with mean</SelectItem>
                      <SelectItem value="median">Replace with median</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Normalize Data</label>
                  <Select onValueChange={setNormalizeOption} value={normalizeOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                      <SelectItem value="standard">Standard Scaling</SelectItem>
                      <SelectItem value="robust">Robust Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePreprocess} disabled={!selectedDatasetId}>
                  Apply Preprocessing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visualize">
          <Card>
            <CardHeader>
              <CardTitle>Visualization Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label className="block mb-2">Chart Type</label>
                  <Select onValueChange={setChartType} value={chartType}>
                    <SelectTrigger><SelectValue placeholder="Select chart type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="histogram">Histogram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">X-Axis</label>
                  <Select onValueChange={setXAxis} value={xAxis}>
                    <SelectTrigger><SelectValue placeholder="Select X-axis" /></SelectTrigger>
                    <SelectContent>
                      {columnNames.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Y-Axis</label>
                  <Select onValueChange={setYAxis} value={yAxis}>
                    <SelectTrigger><SelectValue placeholder="Select Y-axis" /></SelectTrigger>
                    <SelectContent>
                      {columnNames.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateVisualization}>Generate and Save Visualization</Button>
                <Button variant="outline" onClick={() => window.location.href = '/graphs'}>View Saved Graphs</Button>
                {chartData && (
                  <div className="mt-4" style={{ height: "400px" }}>
                    {renderChart()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}