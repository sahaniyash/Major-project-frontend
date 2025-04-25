"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
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

interface ModelConfig {
  modelType: string;
  classificationId: string;
  hyperparameters: Record<string, any>;
}

interface Classification {
  _id: string;
  classification_name: string;
  models: { model_id: string; model_name: string; hyperparameters: Record<string, any> }[];
}

interface ModelRecommendations {
  [classification: string]: string[];
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
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<ModelRecommendations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedClassification, setExpandedClassification] = useState<string | null>(null);

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
      const response = await fetch("http://127.0.0.1:5000/admin/get_all_models", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch classifications: ${errorText} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log("Fetched classifications (Status:", response.status, "):", JSON.stringify(data, null, 2));

      // Handle response format
      if (!data || typeof data !== "object") {
        console.error("Invalid response data:", data);
        throw new Error("Invalid response: Data is not an object");
      }

      const classifications = data.classifications || [];
      if (!Array.isArray(classifications)) {
        console.error("Classifications is not an array:", classifications);
        throw new Error(`Unexpected response format: classifications is not an array: ${JSON.stringify(data, null, 2)}`);
      }

      const fetchedClassifications: Classification[] = classifications
        .map((classification: any) => {
          if (!classification.classification_name || typeof classification.classification_name !== "string") {
            console.warn("Skipping invalid classification:", JSON.stringify(classification, null, 2));
            return null;
          }

          const models = Array.isArray(classification.models)
            ? classification.models
                .map((model: any) => {
                  if (!model.model_id || !model.model_name || typeof model.model_name !== "string") {
                    console.warn(
                      `Skipping invalid model in ${classification.classification_name}:`,
                      JSON.stringify(model, null, 2)
                    );
                    return null;
                  }
                  return {
                    model_id: String(model.model_id),
                    model_name: model.model_name,
                    hyperparameters: model.hyperparameters && typeof model.hyperparameters === "object" ? model.hyperparameters : {},
                  };
                })
                .filter((model: any) => model !== null)
            : [];

          return {
            _id: classification._id ? String(classification._id) : classification.classification_name,
            classification_name: classification.classification_name,
            models,
          };
        })
        .filter((c: any): c is Classification => c !== null && c._id && c.classification_name && Array.isArray(c.models));

      console.log("Processed classifications:", JSON.stringify(fetchedClassifications, null, 2));
      setClassifications(fetchedClassifications);

      if (fetchedClassifications.length === 0) {
        toast({
          title: "Info",
          description: "No valid classifications found in the database.",
        });
      } else if (fetchedClassifications.every((c) => c.models.length === 0)) {
        toast({
          title: "Warning",
          description: "No models found for any classifications. Please check the database.",
          variant: "destructive",
        });
      } else if (fetchedClassifications.some((c) => c.models.length === 0)) {
        toast({
          title: "Warning",
          description: "Some classifications have no models. Please check the database.",
          variant: "default",
        });
      }

      if (data.error) {
        console.warn("Response included error:", data.error);
        toast({
          title: "Warning",
          description: `Partial data received: ${data.error}`,
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
      // Analyze dataset
      const analyzeResponse = await fetch("http://127.0.0.1:5000/model/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: selectedDatasetId }),
      });

      if (!analyzeResponse.ok) throw new Error(await analyzeResponse.text());

      const data = await analyzeResponse.json();
      setDatasetInfo(data);
      toast({ title: "Success", description: "Dataset analyzed successfully" });

      // Fetch recommendations
      await fetchRecommendations();
    } catch (error) {
      console.error("Analyze error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze dataset",
        variant: "destructive",
      });
      setDatasetInfo(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const recommendResponse = await fetch(`http://127.0.0.1:5000/model/get-preferred-model?dataset_id=${selectedDatasetId}`);
      if (!recommendResponse.ok) {
        const errorData = await recommendResponse.json();
        throw new Error(errorData.error || "Failed to fetch recommended models");
      }

      const recommendations = await recommendResponse.json();
      setRecommendedModels(recommendations);
      toast({ title: "Success", description: "Model recommendations fetched" });
    } catch (error) {
      console.error("Recommendation error:", error);
      toast({
        title: "Warning",
        description: error instanceof Error ? error.message : "No model recommendations available",
        variant: "default",
      });
      setRecommendedModels(null);
    }
  };

  const handleModelToggle = (model: { model_id: string; model_name: string; hyperparameters: Record<string, any> }, classificationId: string) => {
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

  const filteredModels = useMemo(() => {
    return classifications.flatMap((classification) =>
      classification.models
        .filter((model) => {
          const matchesSearch = model.model_name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = activeCategory === "all" || classification.classification_name.toLowerCase() === activeCategory;
          return matchesSearch && matchesCategory;
        })
        .map((model) => ({ classification: classification.classification_name, model: model.model_name }))
    );
  }, [classifications, searchTerm, activeCategory]);

  // Case-insensitive lookup for recommended models
  const getRecommendedModels = (classificationName: string) => {
    if (!recommendedModels) return null;
    const key = Object.keys(recommendedModels).find(
      (k) => k.toLowerCase() === classificationName.toLowerCase()
    );
    return key ? recommendedModels[key] : null;
  };

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
          <CardDescription>Choose a datasetsouthern region of the United States</CardDescription>
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
            <Button onClick={fetchRecommendations} disabled={!datasetInfo || loading}>
              Fetch Model Recommendations
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
          <CardDescription>Choose models from available classifications or recommendations</CardDescription>
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
                    {classifications.map((classification) => (
                      <DropdownMenuItem
                        key={classification._id}
                        onClick={() => setActiveCategory(classification.classification_name.toLowerCase())}
                      >
                        {classification.classification_name}
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
                            <p className="text-muted-foreground">No models in this classification. Check the database.</p>
                          ) : (
                            <div className="grid gap-2">
                              {classification.models
                                .filter((model) =>
                                  model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                  (activeCategory === "all" || classification.classification_name.toLowerCase() === activeCategory)
                                )
                                .map((model) => (
                                  <div key={model.model_id} className="flex items-center gap-3">
                                    <Checkbox
                                      id={`${classification._id}-${model.model_id}`}
                                      checked={selectedModels.some(
                                        (m) => m.modelType === model.model_name && m.classificationId === classification._id
                                      )}
                                      onCheckedChange={() => handleModelToggle(model, classification._id)}
                                      disabled={loading}
                                    />
                                    <label htmlFor={`${classification._id}-${model.model_id}`} className="font-medium">
                                      {model.model_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </label>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        {getRecommendedModels(classification.classification_name) && (
                          <div>
                            <h4 className="font-semibold mb-2">Recommended Models</h4>
                            <div className="grid gap-2">
                              {getRecommendedModels(classification.classification_name)!.map((modelName) => {
                                const model = classification.models.find((m) => m.model_name === modelName);
                                return (
                                  <div key={modelName} className="flex items-center gap-3">
                                    <Checkbox
                                      id={`${classification._id}-${modelName}`}
                                      checked={selectedModels.some(
                                        (m) => m.modelType === modelName && m.classificationId === classification._id
                                      )}
                                      onCheckedChange={() => {
                                        if (model) {
                                          handleModelToggle(model, classification._id);
                                        } else {
                                          // Fallback to default hyperparameters if model not in DB
                                          const categoryKey = Object.keys(modelCategories).find(
                                            (key) => modelCategories[key][modelName]
                                          );
                                          const hyperparameters = categoryKey ? modelCategories[categoryKey][modelName] : {};
                                          handleModelToggle(
                                            { model_id: modelName, model_name: modelName, hyperparameters },
                                            classification._id
                                          );
                                        }
                                      }}
                                      disabled={loading}
                                    />
                                    <label htmlFor={`${classification._id}-${modelName}`} className="font-medium">
                                      {modelName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (Recommended)
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {recommendedModels === null && datasetInfo && (
                          <p className="text-muted-foreground">No model recommendations available for this dataset.</p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
          {/* Debug output
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
          {recommendedModels && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Debug Recommended Models</CardTitle>
              </CardHeader>
              <CardContent>
                <pre>{JSON.stringify(recommendedModels, null, 2)}</pre>
              </CardContent>
            </Card>
          )} */}
        </CardContent>
      </Card>

      {datasetInfo && (
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
      )}
    </div>
  );
}