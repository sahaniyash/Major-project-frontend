"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, ChevronDown, ChevronUp, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";

// Utility function to format model names
const formatModelName = (name: string) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Placeholders for hyperparameters
const hyperparamPlaceholders: Record<string, string> = {
  fit_intercept: "Select true/false",
  max_iter: "Enter a number",
  C: "Enter a float",
  kernel: "Enter a string",
  n_estimators: "Enter a number",
  default: "Enter a value",
};

interface Dataset {
  _id: string;
  filename: string;
  datasetId: string;
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

export default function ModelSelection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<ModelRecommendations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedClassification, setExpandedClassification] = useState<string | null>(null);
  const [expandedHyperparameters, setExpandedHyperparameters] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Toggle hyperparameters visibility for a model (only one open at a time per classification)
  const toggleHyperparameters = (modelId: string, classificationId: string) => {
    setExpandedHyperparameters((prev) =>
      prev.includes(modelId) ? [] : [`${classificationId}-${modelId}`]
    );
  };

  // Render hyperparameters for a model
  const renderHyperparameters = (
    model: { model_id: string; model_name: string; hyperparameters: Record<string, any> },
    classificationId: string
  ) => {
    const hyperparams = model.hyperparameters || {};
    const modelKey = `${classificationId}-${model.model_id}`;
    const isExpanded = expandedHyperparameters.includes(modelKey);
    const isSelected = selectedModels.some(
      (m) => m.modelType === model.model_name && m.classificationId === classificationId
    );

    return (
      <div className="mt-2">
        {isExpanded && (
          <div className="p-3 rounded-md transition-all duration-300 ease-in-out space-y-2">
            {Object.entries(hyperparams).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                This model has no configurable parameters
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(hyperparams).map(([param, type]) => {
                  const selectedModel = selectedModels.find(
                    (m) => m.modelType === model.model_name && m.classificationId === classificationId
                  );
                  const currentValue = selectedModel?.hyperparameters[param] ?? null;
                  const placeholder = hyperparamPlaceholders[param] || hyperparamPlaceholders.default;

                  if (type === "bool") {
                    return (
                      <div key={param} className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">{param}:</label>
                        <Select
                          value={currentValue?.toString() ?? ""}
                          onValueChange={(value) =>
                            updateHyperparameters(
                              model.model_name,
                              classificationId,
                              param,
                              value === "true" ? true : false
                            )
                          }
                          disabled={loading || !isSelected}
                        >
                          <SelectTrigger className="w-[140px] text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else if (Array.isArray(type) && type.includes("int") && type.includes("None")) {
                    return (
                      <div key={param} className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">{param}:</label>
                        <Select
                          value={currentValue?.toString() ?? ""}
                          onValueChange={(value) =>
                            updateHyperparameters(
                              model.model_name,
                              classificationId,
                              param,
                              value === "None" ? null : parseInt(value)
                            )
                          }
                          disabled={loading || !isSelected}
                        >
                          <SelectTrigger className="w-[140px] text-xs">
                            <SelectValue placeholder="Select a value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else if (type === "int") {
                    return (
                      <div key={param} className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">{param}:</label>
                        <Input
                          type="number"
                          value={currentValue ?? ""}
                          placeholder={placeholder}
                          onChange={(e) =>
                            updateHyperparameters(
                              model.model_name,
                              classificationId,
                              param,
                              parseInt(e.target.value) || null
                            )
                          }
                          className="w-[140px] text-xs"
                          disabled={loading || !isSelected}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={param} className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">{param}:</label>
                        <Input
                          value={currentValue ?? ""}
                          placeholder={placeholder}
                          onChange={(e) =>
                            updateHyperparameters(model.model_name, classificationId, param, e.target.value)
                          }
                          className="w-[140px] text-xs"
                          disabled={loading || !isSelected}
                        />
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Update hyperparameters for a model
  const updateHyperparameters = (
    modelName: string,
    classificationId: string,
    param: string,
    value: any
  ) => {
    setSelectedModels((prev) => {
      const existingModel = prev.find(
        (m) => m.modelType === modelName && m.classificationId === classificationId
      );
      if (existingModel) {
        return prev.map((m) =>
          m.modelType === modelName && m.classificationId === classificationId
            ? { ...m, hyperparameters: { ...m.hyperparameters, [param]: value } }
            : m
        );
      }
      return prev;
    });
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

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response: Data is not an object");
      }

      const classifications = data.classifications || [];
      if (!Array.isArray(classifications)) {
        throw new Error("Unexpected response format: classifications is not an array");
      }

      const fetchedClassifications: Classification[] = classifications
        .map((classification: any) => {
          if (!classification.classification_name || typeof classification.classification_name !== "string") {
            return null;
          }

          const models = Array.isArray(classification.models)
            ? classification.models
                .map((model: any) => {
                  if (!model.model_id || !model.model_name || typeof model.model_name !== "string") {
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
        toast({
          title: "Warning",
          description: `Partial data received: ${data.error}`,
          variant: "default",
        });
      }
    } catch (error) {
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

        await fetchClassifications();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch datasets or classifications",
          variant: "destructive",
        });
      }
    };

    if (user) fetchData();
  }, [user, toast]);

  const fetchRecommendations = async () => {
    if (!selectedDatasetId) {
      toast({ title: "Error", description: "Please select a dataset first", variant: "destructive" });
      return;
    }

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
        setExpandedHyperparameters((prevParams) =>
          prevParams.filter((id) => id !== `${classificationId}-${model.model_id}`)
        );
        return prev.filter((m) => !(m.modelType === model.model_name && m.classificationId === classificationId));
      }
      const initialHyperparameters = Object.keys(model.hyperparameters).reduce((acc, param) => {
        const type = model.hyperparameters[param];
        if (type === "bool") acc[param] = true;
        else if (Array.isArray(type) && type.includes("int") && type.includes("None")) acc[param] = null;
        else if (type === "int") acc[param] = 1;
        else acc[param] = null;
        return acc;
      }, {} as Record<string, any>);
      
      return [
        ...prev,
        { modelType: model.model_name, classificationId, hyperparameters: initialHyperparameters },
      ];
    });
  };

  const handleScheduleTraining = async () => {
    if (!selectedDatasetId) {
      toast({
        title: "Error",
        description: "Please select a dataset first",
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
        dataset_id: selectedDatasetId,
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

  const getRecommendedModels = (classificationName: string) => {
    if (!recommendedModels) return null;
    const key = Object.keys(recommendedModels).find(
      (k) => k.toLowerCase() === classificationName.toLowerCase()
    );
    return key ? recommendedModels[key] : null;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Training</h1>
          <p className="text-muted-foreground mt-2">Select and configure models to train on your dataset</p>
        </div>
      </div>

      {/* Dataset Selection Card */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Select Dataset</CardTitle>
          <CardDescription>Choose a dataset to fetch model recommendations and train models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[300px]">
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
              onClick={fetchRecommendations} 
              disabled={!selectedDatasetId || loading}
              className="w-full sm:w-auto"
            >
              Fetch Model Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection Card */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Select Models</CardTitle>
          <CardDescription>Choose and configure models from available classifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading classifications...</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <h4 className="font-semibold self-center">Filter Models</h4>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search models..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-[250px]"
                      disabled={loading}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" disabled={loading} className="w-full sm:w-auto">
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="sm:hidden">Filter Categories</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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

              {/* Classifications */}
              <div className="space-y-4">
                {classifications.length === 0 ? (
                  <p className="text-muted-foreground">No classifications available. Contact an admin to add classifications.</p>
                ) : (
                  classifications.map((classification) => (
                    <Card key={classification._id} className="shadow-sm border">
                      <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedClassification(expandedClassification === classification._id ? null : classification._id)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{classification.classification_name}</CardTitle>
                          {expandedClassification === classification._id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </CardHeader>
                      {/* Rest of the classification content */}
                      {expandedClassification === classification._id && (
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Available Models</h4>
                              {classification.models.length === 0 ? (
                                <p className="text-muted-foreground">No models in this classification. Check the database.</p>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-4">
                                  {classification.models
                                    .filter((model) =>
                                      model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                      (activeCategory === "all" || classification.classification_name.toLowerCase() === activeCategory)
                                    )
                                    .map((model) => {
                                      const isSelected = selectedModels.some(
                                        (m) => m.modelType === model.model_name && m.classificationId === classification._id
                                      );
                                      const modelKey = `${classification._id}-${model.model_id}`;
                                      return (
                                        <Card
                                          key={model.model_id}
                                          className={`border-border shadow-sm cursor-pointer ${
                                            isSelected ? "bg-muted/50" : "hover:bg-muted/50"
                                          } transition-colors`}
                                          onClick={() => toggleHyperparameters(model.model_id, classification._id)}
                                        >
                                          <CardContent className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                id={`${classification._id}-${model.model_id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => handleModelToggle(model, classification._id)}
                                                disabled={loading}
                                                className="h-4 w-4"
                                                onClick={(e) => e.stopPropagation()} // Prevent card click from toggling checkbox
                                              />
                                              <label
                                                htmlFor={`${classification._id}-${model.model_id}`}
                                                className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                                              >
                                                {formatModelName(model.model_name)}
                                              </label>
                                            </div>
                                          </CardContent>
                                          {renderHyperparameters(model, classification._id)}
                                        </Card>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                            {getRecommendedModels(classification.classification_name) && (
                              <div>
                                <h4 className="font-semibold mb-2">Recommended Models</h4>
                                <div className="space-y-2">
                                  {getRecommendedModels(classification.classification_name)!.map((modelName) => {
                                    const model = classification.models.find((m) => m.model_name === modelName);
                                    const isSelected = selectedModels.some(
                                      (m) => m.modelType === modelName && m.classificationId === classification._id
                                    );
                                    const modelKey = `${classification._id}-${modelName}`;
                                    return (
                                      <div
                                        key={modelName}
                                        className={`p-2 border border-border rounded-md ${
                                          isSelected ? "bg-muted/50" : "hover:bg-muted/50"
                                        } transition-colors`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              id={`${classification._id}-${modelName}`}
                                              checked={isSelected}
                                              onCheckedChange={() => {
                                                if (model) {
                                                  handleModelToggle(model, classification._id);
                                                }
                                              }}
                                              disabled={loading || !model}
                                              className="h-4 w-4"
                                            />
                                            <label
                                              htmlFor={`${classification._id}-${modelName}`}
                                              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                                            >
                                              {formatModelName(modelName)}{" "}
                                              <span className="text-primary text-xs">(Recommended)</span>
                                            </label>
                                          </div>
                                          {model && Object.keys(model.hyperparameters).length > 0 && (
                                            <button
                                              onClick={() => toggleHyperparameters(modelName, classification._id)}
                                              className="text-muted-foreground hover:text-primary"
                                            >
                                              {expandedHyperparameters.includes(modelKey) ? (
                                                <ChevronUp className="h-4 w-4" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                        {model && renderHyperparameters(model, classification._id)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {recommendedModels === null && selectedDatasetId && (
                              <p className="text-muted-foreground">No model recommendations available for this dataset.</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Training Card */}
      {selectedDatasetId && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Schedule Training</CardTitle>
            <CardDescription>Start the training process for selected models</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleScheduleTraining}
              disabled={!selectedDatasetId || selectedModels.length === 0 || loading}
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