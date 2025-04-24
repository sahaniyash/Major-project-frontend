"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { classificationModels } from "@/components/models/ClassificationModels";
import { clusteringModels } from "@/components/models/ClusteringModels";
import { naiveBayesModels } from "@/components/models/NaiveBayesModels";
import { regressionModels } from "@/components/models/RegressionModels";
import { neuralModels } from "@/components/models/NeuralModels";
import { Suspense } from "react";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";

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
  filters?: number;
  kernel_size?: number;
  pool_size?: number;
  return_sequences?: boolean;
}

interface ModelConfig {
  modelType: string;
  classificationId: string;
  hyperparameters: Record<string, any>;
}

interface Classification {
  _id: string;
  classification_name: string;
  models: { _id: string; model_name: string; hyperparameters: Record<string, any> }[];
}

interface ModelCategories {
  [key: string]: {
    [key: string]: Record<string, any>;
  };
}

// Render hyperparameters as editable inputs
const renderHyperparameters = (
  model: ModelConfig,
  onHyperparameterChange: (modelType: string, param: string, value: any, modelId: string) => void,
  addLayerHandler: () => void,
  layerChangeHandler: (modelType: string, index: number, field: keyof LayerConfig, value: number | string | boolean, modelId: string) => void,
  isNeural: boolean,
  modelId: string
) => {
  return (
    <div className="space-y-4">
      <h5 className="font-semibold">Hyperparameters</h5>
      <div className="grid gap-4">
        {Object.entries(model.hyperparameters).map(([param, value]) => {
          // Skip layers for neural models (handled separately)
          if (param === "layers" && isNeural) return null;

          const inputId = `${model.classificationId}-${model.modelType}-${param}`;
          const isBoolean = typeof value === "boolean";
          const isNumber = typeof value === "number" || (value === null && (param.includes("rate") || param.includes("size") || param.includes("depth")));

          return (
            <div key={param} className="flex items-center gap-4">
              <label htmlFor={inputId} className="w-1/3 text-sm font-medium">
                {param.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
              {isBoolean ? (
                <Checkbox
                  id={inputId}
                  checked={value}
                  onCheckedChange={(checked) => onHyperparameterChange(model.modelType, param, checked, modelId)}
                />
              ) : (
                <Input
                  id={inputId}
                  type={isNumber ? "number" : "text"}
                  value={value ?? ""}
                  onChange={(e) => {
                    const newValue = isNumber ? parseFloat(e.target.value) || null : e.target.value || null;
                    onHyperparameterChange(model.modelType, param, newValue, modelId);
                  }}
                  placeholder={value === null ? "null" : ""}
                  className="w-2/3"
                />
              )}
            </div>
          );
        })}
      </div>
      {isNeural && (
        <div>
          <h5 className="font-semibold mb-2">Neural Network Layers</h5>
          <Button onClick={addLayerHandler} variant="outline" size="sm">
            Add Layer
          </Button>
          {/* Simplified layer rendering */}
          {model.hyperparameters.layers?.map((layer: LayerConfig, index: number) => (
            <div key={index} className="mt-4 border p-4 rounded-md">
              <h6 className="font-medium">Layer {index + 1}</h6>
              <div className="grid gap-4 mt-2">
                {Object.entries(layer).map(([field, value]) => (
                  <div key={field} className="flex items-center gap-4">
                    <label className="w-1/3 text-sm font-medium">
                      {field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </label>
                    {typeof value === "boolean" ? (
                      <Checkbox
                        checked={value}
                        onCheckedChange={(checked) => layerChangeHandler(model.modelType, index, field as keyof LayerConfig, checked, modelId)}
                      />
                    ) : (
                      <Input
                        type={typeof value === "number" ? "number" : "text"}
                        value={value ?? ""}
                        onChange={(e) => {
                          const newValue = typeof value === "number" ? parseFloat(e.target.value) || null : e.target.value || null;
                          layerChangeHandler(model.modelType, index, field as keyof LayerConfig, newValue, modelId);
                        }}
                        className="w-2/3"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ModelSelection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [savedCharts, setSavedCharts] = useState<ChartConfig[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedClassification, setExpandedClassification] = useState<string | null>(null);
  const [isAddingModels, setIsAddingModels] = useState(false);
  const [newModelSelections, setNewModelSelections] = useState<{ category: string; name: string }[]>([]);

  const modelCategories: ModelCategories = {
    classification: classificationModels,
    clustering: clusteringModels,
    naive_bayes: naiveBayesModels,
    regression: regressionModels,
    neural: neuralModels,
  };

  // Fetch classifications with models
  const fetchClassifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/model/get_all_models", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch classifications: ${errorText}`);
      }
      const data = await response.json();
      console.log("Fetched classifications:", JSON.stringify(data, null, 2));

      let fetchedClassifications: Classification[] = [];

      // Handle different response formats
      if (Array.isArray(data.classifications)) {
        fetchedClassifications = data.classifications
          .filter((classification: any) => classification.classification_name && typeof classification.classification_name === "string")
          .map((classification: any) => ({
            _id: classification._id?.toString() || classification.classification_name,
            classification_name: classification.classification_name,
            models: classification.models
              ? Array.isArray(classification.models)
                ? classification.models
                    .filter((model: any) => model._id && model.model_name && typeof model.model_name === "string")
                    .map((model: any) => ({
                      _id: model._id.toString(),
                      model_name: model.model_name,
                      hyperparameters: model.hyperparameters || {},
                    }))
                : Object.keys(classification.models)
                    .filter((modelName) => typeof modelName === "string" && classification.models[modelName]._id)
                    .map((modelName) => ({
                      _id: classification.models[modelName]._id.toString(),
                      model_name: modelName,
                      hyperparameters: classification.models[modelName].hyperparameters || {},
                    }))
              : [],
          }));
      } else if (Array.isArray(data)) {
        fetchedClassifications = data
          .filter((classification: any) => classification.classification_name && typeof classification.classification_name === "string")
          .map((classification: any) => ({
            _id: classification._id?.toString() || classification.classification_name,
            classification_name: classification.classification_name,
            models: classification.models
              ? Array.isArray(classification.models)
                ? classification.models
                    .filter((model: any) => model._id && model.model_name && typeof model.model_name === "string")
                    .map((model: any) => ({
                      _id: model._id.toString(),
                      model_name: model.model_name,
                      hyperparameters: model.hyperparameters || {},
                    }))
                : Object.keys(classification.models)
                    .filter((modelName) => typeof modelName === "string" && classification.models[modelName]._id)
                    .map((modelName) => ({
                      _id: classification.models[modelName]._id.toString(),
                      model_name: modelName,
                      hyperparameters: classification.models[modelName].hyperparameters || {},
                    }))
              : [],
          }));
      } else if (typeof data === "object" && data !== null) {
        fetchedClassifications = Object.keys(data)
          .filter((name) => typeof name === "string")
          .map((name) => ({
            _id: data[name]._id?.toString() || name,
            classification_name: name,
            models: data[name].models
              ? Array.isArray(data[name].models)
                ? data[name].models
                    .filter((model: any) => model._id && model.model_name && typeof model.model_name === "string")
                    .map((model: any) => ({
                      _id: model._id.toString(),
                      model_name: model.model_name,
                      hyperparameters: model.hyperparameters || {},
                    }))
                : Object.keys(data[name].models)
                    .filter((modelName) => typeof modelName === "string" && data[name].models[modelName]._id)
                    .map((modelName) => ({
                      _id: data[name].models[modelName]._id.toString(),
                      model_name: modelName,
                      hyperparameters: data[name].models[modelName].hyperparameters || {},
                    }))
              : [],
          }));
      } else {
        console.warn("Unexpected response format:", data);
        throw new Error("Unexpected response format from /get_all_models");
      }

      // Filter out invalid classifications and log warnings for models without _id
      fetchedClassifications = fetchedClassifications
        .filter((c) => c._id && c.classification_name && Array.isArray(c.models))
        .map((c) => ({
          ...c,
          models: c.models.filter((m) => {
            if (!m._id) {
              console.warn(`Model ${m.model_name} in classification ${c.classification_name} lacks a valid _id`);
              return false;
            }
            return true;
          }),
        }));

      console.log("Processed classifications:", JSON.stringify(fetchedClassifications, null, 2));
      setClassifications(fetchedClassifications);
      if (fetchedClassifications.length === 0) {
        toast({
          title: "Info",
          description: "No valid classifications found in the database.",
        });
      } else if (fetchedClassifications.some((c) => c.models.length === 0)) {
        toast({
          title: "Warning",
          description: "Some classifications have no valid models due to missing model IDs.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Fetch classifications error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch classifications",
        variant: "destructive",
      });
      setClassifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch datasets and classifications on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch datasets
        const userResponse = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!userResponse.ok) throw new Error(await userResponse.text());

        const userData = await userResponse.json();
        const datasetIds = userData.dataset_ids || [];

        const datasetsPromises = datasetIds.map(async (id: string) => {
          const res = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return { _id: data._id, filename: data.filename, datasetId: data._id };
        });

        const datasetsData = (await Promise.all(datasetsPromises)).filter((d) => d !== null);
        setDatasets(datasetsData);

        // Fetch classifications
        await fetchClassifications();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets or classifications",
          variant: "destructive",
        });
      }
    };

    if (user) fetchData();
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

  const handleModelToggle = (model: { _id: string; model_name: string; hyperparameters: Record<string, any> }, classificationId: string) => {
    setSelectedModels((prev) => {
      if (prev.some((m) => m.modelType === model.model_name && m.classificationId === classificationId)) {
        return prev.filter((m) => !(m.modelType === model.model_name && m.classificationId === classificationId));
      }
      return [
        ...prev,
        { modelType: model.model_name, classificationId, hyperparameters: model.hyperparameters },
      ];
    });
  };

  const handleHyperparameterChange = async (modelType: string, classificationId: string, param: string, value: any, modelId: string) => {
    if (!modelId) {
      toast({
        title: "Error",
        description: "Cannot update hyperparameters: Model ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setSelectedModels((prev) =>
      prev.map((m) =>
        m.modelType === modelType && m.classificationId === classificationId
          ? { ...m, hyperparameters: { ...m.hyperparameters, [param]: value } }
          : m
      )
    );

    // Find the model in classifications to get the full hyperparameters
    const classification = classifications.find((c) => c._id === classificationId);
    const model = classification?.models.find((m) => m.model_name === modelType);
    if (!model) {
      toast({
        title: "Error",
        description: "Model not found in classifications",
        variant: "destructive",
      });
      return;
    }

    // Create updated hyperparameters object
    const updatedHyperparameters = { ...model.hyperparameters, [param]: value };

    // Send update to backend
    try {
      const response = await fetch(`http://127.0.0.1:5000/model/update_model_hyperparameters/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hyperparameters: updatedHyperparameters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update hyperparameters");
      }

      toast({
        title: "Success",
        description: `Hyperparameter ${param} updated successfully`,
      });

      // Refresh classifications to reflect backend changes
      await fetchClassifications();
    } catch (error) {
      console.error("Update hyperparameter error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update hyperparameter",
        variant: "destructive",
      });
    }
  };

  const handleAddLayer = (modelType: string, classificationId: string) => {
    setSelectedModels((prev) =>
      prev.map((m) => {
        if (m.modelType !== modelType || m.classificationId !== classificationId || !modelCategories.neural[m.modelType])
          return m;
        const newLayer =
          m.modelType === "convolutional_neural_network"
            ? { units: 32, activation: "relu", filters: 32, kernel_size: 3, pool_size: 2 }
            : m.modelType === "recurrent_neural_network"
            ? { units: 32, activation: "relu", return_sequences: false }
            : { units: 32, activation: "relu" };
        return {
          ...m,
    hyperparameters: { ...m.hyperparameters, layers: [...(m.hyperparameters.layers || []), newLayer] },
        };
      })
    );
  };

  const handleLayerChange = async (
    modelType: string,
    classificationId: string,
    index: number,
    field: keyof LayerConfig,
    value: number | string | boolean,
    modelId: string
  ) => {
    if (!modelId) {
      toast({
        title: "Error",
        description: "Cannot update layer: Model ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setSelectedModels((prev) =>
      prev.map((m) => {
        if (m.modelType !== modelType || m.classificationId !== classificationId || !modelCategories.neural[m.modelType])
          return m;
        const newLayers = [...(m.hyperparameters.layers || [])];
        newLayers[index] = { ...newLayers[index], [field]: value };
        return { ...m, hyperparameters: { ...m.hyperparameters, layers: newLayers } };
      })
    );

    // Find the model in classifications to get the full hyperparameters
    const classification = classifications.find((c) => c._id === classificationId);
    const model = classification?.models.find((m) => m.model_name === modelType);
    if (!model) {
      toast({
        title: "Error",
        description: "Model not found in classifications",
        variant: "destructive",
      });
      return;
    }

    // Create updated hyperparameters with modified layers
    const updatedHyperparameters = {
      ...model.hyperparameters,
      layers: model.hyperparameters.layers?.map((layer: LayerConfig, i: number) =>
        i === index ? { ...layer, [field]: value } : layer
      ) || [],
    };

    // Send update to backend
    try {
      const response = await fetch(`http://127.0.0.1:5000/model/update_model_hyperparameters/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hyperparameters: updatedHyperparameters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update layer hyperparameters");
      }

      toast({
        title: "Success",
        description: `Layer ${index + 1} updated successfully`,
      });

      // Refresh classifications to reflect backend changes
      await fetchClassifications();
    } catch (error) {
      console.error("Update layer hyperparameter error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update layer hyperparameter",
        variant: "destructive",
      });
    }
  };

  const handleScheduleTraining = async () => {
    if (!datasetInfo) {
      toast({
        title: "Error",
        description: "Please analyze a dataset first",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one model to train",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        dataset_id: datasetInfo.datasetId,
        models: selectedModels.map((m) => ({
          model_type: m.modelType,
          classification_id: m.classificationId,
          hyperparameters: m.hyperparameters,
        })),
      };
      const response = await fetch("http://127.0.0.1:5000/model/start-building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      toast({ title: "Success", description: "Model training scheduled successfully" });
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

  const handleNewModelToggle = (category: string, name: string) => {
    setNewModelSelections((prev) => {
      const modelKey = `${category}-${name}`;
      if (prev.some((m) => `${m.category}-${m.name}` === modelKey)) {
        return prev.filter((m) => `${m.category}-${m.name}` !== modelKey);
      }
      return [...prev, { category, name }];
    });
  };

  const handleAddModels = async (classificationId: string) => {
    if (newModelSelections.length === 0) {
      toast({ title: "Error", description: "Please select at least one model", variant: "destructive" });
      return;
    }

    setIsAddingModels(true);
    try {
      const failedModels: string[] = [];
      for (const model of newModelSelections) {
        try {
          const modelConfig = modelCategories[model.category][model.name];
          console.log(`Adding model: ${model.name} to classification ${classificationId}`, modelConfig);
          const modelResponse = await fetch("http://127.0.0.1:5000/model/add_model", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classification_id: classificationId,
              model_name: model.name,
              hyperparameters: modelConfig,
            }),
          });
          if (!modelResponse.ok) {
            const errorText = await modelResponse.text();
            throw new Error(`Failed to add model ${model.name}: ${errorText}`);
          }
          const modelData = await modelResponse.json();
          console.log(`Model ${model.name} added:`, modelData);
        } catch (error) {
          console.error(`Error adding model ${model.name}:`, error);
          failedModels.push(model.name);
        }
      }
      if (failedModels.length > 0) {
        toast({
          title: "Partial Success",
          description: `Failed to add models: ${failedModels.join(", ")}`,
          variant: "default",
        });
      } else {
        toast({ title: "Success", description: "Models added successfully" });
      }
      await fetchClassifications();
      setNewModelSelections([]);
      setExpandedClassification(null);
    } catch (error) {
      console.error("Add models error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add models",
        variant: "destructive",
      });
    } finally {
      setIsAddingModels(false);
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

  const filteredModels = useMemo(() => {
    return Object.entries(modelCategories).flatMap(([category, models]) =>
      Object.keys(models)
        .filter((model) => {
          const matchesSearch = model.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = activeCategory === "all" || category === activeCategory;
          return matchesSearch && matchesCategory;
        })
        .map((model) => ({ category, name: model }))
    );
  }, [modelCategories, searchTerm, activeCategory]);

  const isNeuralModel = (modelType: string): boolean => Object.keys(neuralModels).includes(modelType);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Training</h1>
          <p className="text-muted-foreground mt-2">Select models to train on your dataset</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Dataset</CardTitle>
          <CardDescription>Choose a dataset for training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId} disabled={loading}>
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
            <Button onClick={handleAnalyzeDataset} disabled={isAnalyzing || !selectedDatasetId || loading}>
              {isAnalyzing ? "Analyzing..." : "Analyze Dataset"}
            </Button>
          </div>
          {datasetInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold">Dataset Info</h3>
              <p>Rows: {datasetInfo.shape[0]}, Columns: {datasetInfo.shape[1]}</p>
              <p>Columns: {datasetInfo.columns.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Models for Training</CardTitle>
          <CardDescription>Choose models from available classifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading classifications...</p>}
          {!loading && (
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Filter Models</h4>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[250px]"
                    disabled={loading}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={loading}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setActiveCategory("all")}>All Categories</DropdownMenuItem>
                    {Object.keys(modelCategories).map((category) => (
                      <DropdownMenuItem key={category} onClick={() => setActiveCategory(category)}>
                        {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {!loading && classifications.length === 0 ? (
              <p className="text-muted-foreground">No classifications available. Contact an admin to add classifications.</p>
            ) : (
              classifications.map((classification) => (
                <Card key={classification._id}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpandedClassification(expandedClassification === classification._id ? null : classification._id)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle>{classification.classification_name}</CardTitle>
                      {expandedClassification === classification._id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedClassification === classification._id && (
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Available Models</h4>
                          {classification.models.length === 0 ? (
                            <p className="text-muted-foreground">No models in this classification</p>
                          ) : (
                            <div className="grid gap-2">
                              {classification.models
                                .filter((model) =>
                                  model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                  (activeCategory === "all" || Object.keys(modelCategories).some((cat) => modelCategories[cat][model.model_name]))
                                )
                                .map((model) => (
                                  <Card key={model._id}>
                                    <CardHeader className="py-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            id={`${classification._id}-${model._id}`}
                                            checked={selectedModels.some(
                                              (m) => m.modelType === model.model_name && m.classificationId === classification._id
                                            )}
                                            onCheckedChange={() => handleModelToggle(model, classification._id)}
                                            disabled={loading}
                                          />
                                          <label htmlFor={`${classification._id}-${model._id}`} className="font-medium">
                                            {model.model_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                          </label>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            setExpandedModel(
                                              expandedModel === `${classification._id}-${model._id}`
                                                ? null
                                                : `${classification._id}-${model._id}`
                                            )
                                          }
                                          disabled={loading}
                                        >
                                          <SlidersHorizontal className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    {expandedModel === `${classification._id}-${model._id}` && (
                                      <CardContent className="pt-0">
                                        <div className="border-t pt-4">
                                          {renderHyperparameters(
                                            { modelType: model.model_name, classificationId: classification._id, hyperparameters: model.hyperparameters },
                                            handleHyperparameterChange,
                                            () => handleAddLayer(model.model_name, classification._id),
                                            handleLayerChange,
                                            isNeuralModel(model.model_name),
                                            model._id
                                          )}
                                        </div>
                                      </CardContent>
                                    )}
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Add New Models</h4>
                          <div className="grid gap-2 mb-4">
                            {Object.entries(modelCategories).flatMap(([category, models]) =>
                              Object.keys(models).map((name) => (
                                <div key={`${category}-${name}`} className="flex items-center gap-3">
                                  <Checkbox
                                    id={`new-${category}-${name}`}
                                    checked={newModelSelections.some((m) => m.category === category && m.name === name)}
                                    onCheckedChange={() => handleNewModelToggle(category, name)}
                                    disabled={loading || isAddingModels}
                                  />
                                  <label htmlFor={`new-${category}-${name}`} className="font-medium">
                                    {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({category.replace(/_/g, " ")})
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                          <Button
                            onClick={() => handleAddModels(classification._id)}
                            disabled={loading || isAddingModels || newModelSelections.length === 0}
                          >
                            {isAddingModels ? "Adding..." : "Add Selected Models"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
          {/* Debug output */}
          {!loading && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Debug Classifications</CardTitle>
              </CardHeader>
              <CardContent>
                <pre>{JSON.stringify(classifications, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {datasetInfo && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Schedule Training</CardTitle>
              <CardDescription>Start the training process for selected models</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleScheduleTraining}
                disabled={!datasetInfo || selectedModels.length === 0 || loading}
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
                          <Suspense
                            fallback={
                              <div className="flex items-center justify-center h-full">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                              </div>
                            }
                          >
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