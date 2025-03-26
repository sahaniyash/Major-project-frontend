"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import "chart.js/auto";
import { Line, Bar } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs";
import { classificationModels } from "@/components/models/ClassificationModels";
import { clusteringModels } from "@/components/models/ClusteringModels";
import { naiveBayesModels } from "@/components/models/NaiveBayesModels";
import { regressionModels } from "@/components/models/RegressionModels";
import { neuralModels } from "@/components/models/NeuralModels";
import { renderHyperparameters, renderNetworkArchitecture } from "@/components/models/ModelsUtils";

interface Dataset {
  _id: string;
  filename: string;
  datasetId: string;
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

interface LayerConfig {
  units: number;
  activation: string;
}

interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
}

export default function ModelSelection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [savedCharts, setSavedCharts] = useState<ChartConfig[]>([]);

  const modelCategories = {
    classification: classificationModels,
    clustering: clusteringModels,
    naive_bayes: naiveBayesModels,
    regression: regressionModels,
    neural: neuralModels,
  };

  // Fetch datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return;

      try {
        const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());

        const userData = await response.json();
        const datasetIds = userData.dataset_ids || [];

        const datasetsPromises = datasetIds.map(async (id: string) => {
          const res = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { _id: data._id, filename: data.filename, datasetId: data._id };
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

    if (user) fetchDatasets();
  }, [user, toast]);

  const handleAnalyzeDataset = async () => {
    if (!selectedDatasetId) {
      toast({ title: "Error", description: "Please select a dataset first", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/model/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: selectedDatasetId }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      setDatasetInfo(data);
      if (data.targetColumn) setTargetColumn(data.targetColumn);

      toast({ title: "Success", description: "Dataset analyzed successfully" });
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

  const handleModelToggle = (model: string, category: string) => {
    setSelectedModels((prev) => {
      if (prev.some((m) => m.modelType === model)) {
        return prev.filter((m) => m.modelType !== model);
      } else {
        return [...prev, { modelType: model, hyperparameters: { ...modelCategories[category as keyof typeof modelCategories][model] } }];
      }
    });
  };

  const handleHyperparameterChange = (modelType: string, param: string, value: any) => {
    setSelectedModels((prev) =>
      prev.map((m) =>
        m.modelType === modelType ? { ...m, hyperparameters: { ...m.hyperparameters, [param]: value } } : m
      )
    );
  };

  const handleAddLayer = (modelType: string) => {
    setSelectedModels((prev) =>
      prev.map((m) =>
        m.modelType === modelType && modelCategories.neural[m.modelType]
          ? { ...m, hyperparameters: { ...m.hyperparameters, layers: [...m.hyperparameters.layers, { units: 32, activation: "relu" }] } }
          : m
      )
    );
  };

  const handleLayerChange = (modelType: string, index: number, field: keyof LayerConfig, value: number | string) => {
    setSelectedModels((prev) =>
      prev.map((m) => {
        if (m.modelType !== modelType || !modelCategories.neural[m.modelType]) return m;
        const newLayers = [...m.hyperparameters.layers];
        newLayers[index] = { ...newLayers[index], [field]: value };
        return { ...m, hyperparameters: { ...m.hyperparameters, layers: newLayers } };
      })
    );
  };

  const handleScheduleTraining = async () => {
    if (!selectedModels.length || !datasetInfo || !targetColumn) {
      toast({
        title: "Error",
        description: "Please select at least one model, analyze a dataset, and specify a target column",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        datasetId: datasetInfo.datasetId,
        targetColumn,
        models: selectedModels,
      };

      const response = await fetch("http://127.0.0.1:5000/model/schedule_training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      toast({ title: "Success", description: "Models scheduled for training successfully" });
      setSelectedModels([]);
    } catch (error) {
      console.error("Scheduling error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule training",
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
          <CardDescription>Choose a dataset for training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId}>
              <SelectTrigger className="w-[300px]">
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
            <Button onClick={handleAnalyzeDataset} disabled={isAnalyzing || !selectedDatasetId}>
              {isAnalyzing ? "Analyzing..." : "Analyze Dataset"}
            </Button>
          </div>
          {datasetInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold">Dataset Info</h3>
              <p>Rows: {datasetInfo.shape[0]}, Columns: {datasetInfo.shape[1]}</p>
              <Select value={targetColumn} onValueChange={setTargetColumn}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Target column" />
                </SelectTrigger>
                <SelectContent>
                  {datasetInfo.columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {datasetInfo && targetColumn && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Models</CardTitle>
              <CardDescription>Choose models and configure their hyperparameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {Object.entries(modelCategories).map(([category, models]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger>{category.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2">
                        {Object.keys(models).map((model) => (
                          <div key={model} className="flex items-center space-x-2">
                            <Checkbox
                              id={model}
                              checked={selectedModels.some((m) => m.modelType === model)}
                              onCheckedChange={() => handleModelToggle(model, category)}
                            />
                            <label htmlFor={model} className="text-sm">
                              {model.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {selectedModels.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Configure Selected Models</CardTitle>
                <CardDescription>Adjust hyperparameters for each model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {selectedModels.map((model) => (
                    <div key={model.modelType}>
                      {renderHyperparameters(
                        model,
                        handleHyperparameterChange,
                        handleAddLayer,
                        handleLayerChange,
                        model.modelType in neuralModels
                      )}
                      {renderNetworkArchitecture(model, datasetInfo)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Schedule Training</CardTitle>
              <CardDescription>Add selected models to the training queue</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleScheduleTraining} disabled={!selectedModels.length || !targetColumn}>
                Schedule Training
              </Button>
            </CardContent>
          </Card>

          {savedCharts.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Model Visualizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {savedCharts.map((chart, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">{chart.title}</h3>
                      <div style={{ height: "400px" }}>{renderChart(chart)}</div>
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