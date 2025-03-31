"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Suspense } from "react";

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
  filters?: number;           // For CNN
  kernel_size?: number;       // For CNN
  pool_size?: number;         // For CNN
  return_sequences?: boolean; // For RNN
}

interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
}

interface ModelCategories {
  [key: string]: {
    [key: string]: Record<string, any>;
  };
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const modelCategories: ModelCategories = {
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
        const modelConfig = modelCategories[category]?.[model];
        if (!modelConfig) return prev;
        return [...prev, { modelType: model, hyperparameters: { ...modelConfig } }];
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
      prev.map((m) => {
        if (m.modelType !== modelType || !modelCategories.neural[m.modelType]) return m;
        const newLayer =
          m.modelType === "convolutional_neural_network"
            ? { units: 32, activation: "relu", filters: 32, kernel_size: 3, pool_size: 2 }
            : m.modelType === "recurrent_neural_network"
            ? { units: 32, activation: "relu", return_sequences: false }
            : { units: 32, activation: "relu" };
        return {
          ...m,
          hyperparameters: { ...m.hyperparameters, layers: [...m.hyperparameters.layers, newLayer] },
        };
      })
    );
  };

  const handleLayerChange = (
    modelType: string,
    index: number,
    field: keyof LayerConfig,
    value: number | string | boolean
  ) => {
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

  // Filter models based on search and category
  const filteredModels = useMemo(() => {
    return Object.entries(modelCategories).flatMap(([category, models]) => {
      return Object.keys(models)
        .filter(model => {
          const matchesSearch = model.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = activeCategory === "all" || category === activeCategory;
          return matchesSearch && matchesCategory;
        })
        .map(model => ({
          category,
          name: model,
          isSelected: selectedModels.some(m => m.modelType === model)
        }));
    });
  }, [modelCategories, searchTerm, activeCategory, selectedModels]);

  const isNeuralModel = (modelType: string): boolean => {
    return Object.keys(neuralModels).includes(modelType);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Selection and Training</h1>
          <p className="text-muted-foreground mt-2">Configure and train machine learning models</p>
        </div>
      </div>

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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Select Models</CardTitle>
                  <CardDescription>Choose models and configure their hyperparameters</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search models..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setActiveCategory("all")}>
                        All Categories
                      </DropdownMenuItem>
                      {Object.keys(modelCategories).map((category) => (
                        <DropdownMenuItem
                          key={category}
                          onClick={() => setActiveCategory(category)}
                        >
                          {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredModels.map(({ category, name, isSelected }) => (
                  <Card key={name} className={`hover:shadow-md transition-shadow ${isSelected ? 'border-primary' : ''}`}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={name}
                            checked={isSelected}
                            onCheckedChange={() => handleModelToggle(name, category)}
                          />
                          <div>
                            <label htmlFor={name} className="font-medium cursor-pointer">
                              {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedModel(expandedModel === name ? null : name)}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {isSelected && expandedModel === name && (
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          {renderHyperparameters(
                            selectedModels.find(m => m.modelType === name)!,
                            handleHyperparameterChange,
                            handleAddLayer,
                            handleLayerChange,
                            isNeuralModel(name)
                          )}
                          {isNeuralModel(name) && renderNetworkArchitecture(
                            selectedModels.find(m => m.modelType === name)!,
                            datasetInfo,
                            handleLayerChange
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Schedule Training</CardTitle>
              <CardDescription>
                {selectedModels.length === 0
                  ? "Select models to begin training"
                  : `${selectedModels.length} model(s) selected for training`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleScheduleTraining}
                disabled={!selectedModels.length || !targetColumn}
                className="w-full sm:w-auto"
              >
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
                <div className="grid gap-6 md:grid-cols-2">
                  {savedCharts.map((chart, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{chart.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                            </div>
                          }>
                            {renderChart(chart)}
                          </Suspense>
                        </div>
                      </CardContent>
                    </Card>
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