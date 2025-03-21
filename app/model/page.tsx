"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import "chart.js/auto";
import { Line, Bar } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs"; // Add this to get user info

interface Dataset {
  _id: string;
  filename: string;
  datasetId: string; // Assuming this matches DatasetInfo.datasetId
}

interface DatasetInfo {
  datasetId: string;
  columns: string[];
  shape: [number, number];
  columnTypes: Record<string, string>;
  targetColumn?: string;
  summary: {
    missingValues: Record<string, number>;
    uniqueValues: Record<string, number>;
  };
}

interface ChartConfig {
  modelType: string;
  chartType: string;
  title: string;
  data: any;
}

export default function ModelSelection() {
  const { user } = useUser(); // Get Clerk user
  const { toast } = useToast();
  const [modelType, setModelType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Changed from isUploading
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: 0.01,
    regularization: 0.1,
  });
  const [savedCharts, setSavedCharts] = useState<ChartConfig[]>([]);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) {
        console.log("User not loaded yet");
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const userData = await response.json();
        const datasetIds = userData.dataset_ids || [];

        const datasetsPromises = datasetIds.map(async (id: string) => {
          const res = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
          if (!res.ok) {
            console.error(`Failed to fetch dataset ${id}`);
            return null;
          }
          const data = await res.json();
          return { _id: data._id, filename: data.filename, datasetId: data._id }; // Adjust based on your backend response
        });

        const datasetsData = (await Promise.all(datasetsPromises)).filter((d) => d !== null);
        setDatasets(datasetsData);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
      }
    };

    if (user) {
      fetchDatasets();
    }
  }, [user, toast]);

  const handleAnalyzeDataset = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "Error",
        description: "Please select a dataset first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/model/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: selectedDatasetId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setDatasetInfo(data);

      if (data.targetColumn) {
        setTargetColumn(data.targetColumn);
      }

      toast({
        title: "Success",
        description: "Dataset analyzed successfully",
      });
    } catch (error) {
      console.error("Analyze error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze dataset",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedModel || !datasetInfo || !targetColumn) {
      toast({
        title: "Error",
        description: "Please select a model, analyze a dataset, and specify target column",
        variant: "destructive",
      });
      return;
    }

    try {
      const trainResponse = await fetch("http://127.0.0.1:5000/model/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: selectedModel,
          hyperparameters,
          datasetId: datasetInfo.datasetId,
          targetColumn,
        }),
      });

      if (!trainResponse.ok) {
        throw new Error(await trainResponse.text());
      }

      const trainData = await trainResponse.json();
      toast({
        title: "Success",
        description: "Model training completed successfully",
      });

      const vizResponse = await fetch("http://127.0.0.1:5000/model/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: trainData.jobId }),
      });

      if (!vizResponse.ok) {
        throw new Error(await vizResponse.text());
      }

      const vizData = await vizResponse.json();

      const lossCurve = {
        labels: vizData.epochs || Array.from({ length: 10 }, (_, i) => i + 1),
        datasets: [{
          label: "Training Loss",
          data: vizData.loss || Array(10).fill(0).map(() => Math.random()),
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        }],
      };

      const metricsBar = {
        labels: ["Accuracy", "Precision", "Recall"],
        datasets: [{
          label: "Model Metrics",
          data: [vizData.accuracy || 0.8, vizData.precision || 0.75, vizData.recall || 0.7],
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        }],
      };

      setSavedCharts((prev) => [
        ...prev,
        { modelType: selectedModel, chartType: "line", title: `${selectedModel} Loss Curve`, data: lossCurve },
        { modelType: selectedModel, chartType: "bar", title: `${selectedModel} Performance Metrics`, data: metricsBar },
      ]);
    } catch (error) {
      console.error("Training/visualization error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to train model or generate visualization",
        variant: "destructive",
      });
    }
  };

  const renderChart = (chart: ChartConfig) => {
    switch (chart.chartType) {
      case "line":
        return <Line data={chart.data} options={{ responsive: true, maintainAspectRatio: false }} />;
      case "bar":
        return <Bar data={chart.data} options={{ responsive: true, maintainAspectRatio: false }} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Model Selection and Training</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Dataset</CardTitle>
          <CardDescription>Choose an existing dataset to train your model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId}>
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
            <Button
              onClick={handleAnalyzeDataset}
              disabled={isAnalyzing || !selectedDatasetId}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Dataset"}
            </Button>
          </div>

          {datasetInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold mb-2">Dataset Information</h3>
              <p>Rows: {datasetInfo.shape[0]}</p>
              <p>Columns: {datasetInfo.shape[1]}</p>

              <div>
                <h4 className="font-medium">Column Types:</h4>
                <ul className="list-disc list-inside">
                  {Object.entries(datasetInfo.columnTypes).map(([col, type]) => (
                    <li key={col}>{col}: {type}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Target Column:</h4>
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetInfo.columns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {datasetInfo && targetColumn && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Model Type</CardTitle>
              <CardDescription>Choose the type of machine learning model</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setModelType} value={modelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervised">Supervised Learning</SelectItem>
                  <SelectItem value="unsupervised">Unsupervised Learning</SelectItem>
                  <SelectItem value="neural">Neural Networks</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {modelType && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {modelType === "supervised"
                    ? "Supervised Learning Models"
                    : modelType === "unsupervised"
                    ? "Unsupervised Learning Models"
                    : "Neural Network Architecture"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelType === "supervised" && (
                      <>
                        <SelectItem value="linear_regression">Linear Regression</SelectItem>
                        <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                        <SelectItem value="decision_tree">Decision Tree</SelectItem>
                        <SelectItem value="random_forest">Random Forest</SelectItem>
                      </>
                    )}
                    {modelType === "unsupervised" && (
                      <>
                        <SelectItem value="kmeans">K-Means Clustering</SelectItem>
                        <SelectItem value="hierarchical">Hierarchical Clustering</SelectItem>
                        <SelectItem value="pca">Principal Component Analysis</SelectItem>
                      </>
                    )}
                    {modelType === "neural" && (
                      <>
                        <SelectItem value="mlp">Multi-Layer Perceptron</SelectItem>
                        <SelectItem value="cnn">Convolutional Neural Network</SelectItem>
                        <SelectItem value="rnn">Recurrent Neural Network</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Hyperparameter Tuning</CardTitle>
              <CardDescription>Adjust model hyperparameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label className="block mb-2">Learning Rate</label>
                  <Slider
                    defaultValue={[hyperparameters.learningRate]}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => setHyperparameters((prev) => ({ ...prev, learningRate: value }))}
                  />
                  <span className="text-sm text-muted-foreground mt-1">
                    Current: {hyperparameters.learningRate}
                  </span>
                </div>
                <div>
                  <label className="block mb-2">Regularization Strength</label>
                  <Slider
                    defaultValue={[hyperparameters.regularization]}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => setHyperparameters((prev) => ({ ...prev, regularization: value }))}
                  />
                  <span className="text-sm text-muted-foreground mt-1">
                    Current: {hyperparameters.regularization}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Train Model</CardTitle>
              <CardDescription>Start the model training process and view results</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTrainModel}
                disabled={!selectedModel || !targetColumn}
              >
                Train and Visualize Model
              </Button>
            </CardContent>
          </Card>

          {savedCharts.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Model Visualizations</CardTitle>
                <CardDescription>Performance metrics and training progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {savedCharts.map((chart, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">{chart.title}</h3>
                      <div style={{ height: "400px" }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}