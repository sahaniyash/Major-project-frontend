"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { classificationModels } from "@/components/models/ClassificationModels";
import { clusteringModels } from "@/components/models/ClusteringModels";
import { naiveBayesModels } from "@/components/models/NaiveBayesModels";
import { regressionModels } from "@/components/models/RegressionModels";
import { neuralModels } from "@/components/models/NeuralModels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { renderHyperparameters } from "@/components/models/ModelsUtils";

interface Classification {
  _id: string;
  classification_name: string;
  models: { _id: string; model_name: string; hyperparameters: Record<string, any>; hyperparameter_values?: Record<string, any> }[];
}

interface ModelCategories {
  [key: string]: {
    [key: string]: Record<string, { type: string | string[]; default?: any; min?: number; max?: number; options?: string[] }>;
  };
}

interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, string | string[]>;
  hyperparameter_values: Record<string, any>;
}

export default function AdminPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [classificationName, setClassificationName] = useState("");
  const [selectedModels, setSelectedModels] = useState<{ category: string; name: string; config: ModelConfig }[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [newlyAddedClassification, setNewlyAddedClassification] = useState<Classification | null>(null);
  const [editingClassification, setEditingClassification] = useState<{ id: string; name: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [dropdownSelectedModels, setDropdownSelectedModels] = useState<{ category: string; name: string; config: ModelConfig }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<{ classificationId: string; modelId: string } | null>(null);
  const [modelConfigs, setModelConfigs] = useState<{ [key: string]: ModelConfig }>({});
  const [showHyperparameterConfig, setShowHyperparameterConfig] = useState<string | null>(null);

  const modelCategories: ModelCategories = {
    classification: classificationModels,
    clustering: clusteringModels,
    naive_bayes: naiveBayesModels,
    regression: regressionModels,
    neural: neuralModels,
  };

  // Initialize hyperparameters (types) and hyperparameter_values (values) for a model
  const initializeHyperparameters = (category: string, modelName: string) => {
    const hyperparametersDef = modelCategories[category][modelName];
    const hyperparameters: Record<string, string | string[]> = {};
    const hyperparameter_values: Record<string, any> = {};
    Object.entries(hyperparametersDef).forEach(([param, config]) => {
      // Set hyperparameter type
      hyperparameters[param] = Array.isArray(config.type) ? config.type : config.type;
      // Set hyperparameter value (default or null)
      hyperparameter_values[param] = config.default !== undefined ? config.default : null;
    });
    console.log(`Initialized hyperparameters for ${category}/${modelName}:`, JSON.stringify(hyperparameters, null, 2));
    console.log(`Initialized hyperparameter_values for ${category}/${modelName}:`, JSON.stringify(hyperparameter_values, null, 2));
    return { hyperparameters, hyperparameter_values };
  };

  // Fetch existing classifications and their models
  const fetchClassifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/get_classifications`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch classifications: ${errorText}`);
      }
      const data = await response.json();

      const classificationsWithModels = await Promise.all(
        data.map(async (classification: { _id: string; classification_name: string }) => {
          try {
            const modelResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/admin/get_models/${classification._id}`
            );
            if (!modelResponse.ok) {
              throw new Error(`Failed to fetch models for classification ${classification._id}`);
            }
            const models = await modelResponse.json();
            return {
              _id: classification._id,
              classification_name: classification.classification_name,
              models: models.map((model: any) => ({
                _id: model._id,
                model_name: model.model_name,
                hyperparameters: model.hyperparameters,
                hyperparameter_values: model.hyperparameter_values || {}, // Fallback to empty object
              })),
            };
          } catch (error) {
            return {
              _id: classification._id,
              classification_name: classification.classification_name,
              models: [],
            };
          }
        })
      );

      setClassifications(classificationsWithModels);

      const configs: { [key: string]: ModelConfig } = {};
      classificationsWithModels.forEach((classification) => {
        classification.models.forEach((model) => {
          configs[model._id] = {
            modelType: model.model_name,
            hyperparameters: model.hyperparameters,
            hyperparameter_values: model.hyperparameter_values || {},
          };
        });
      });
      setModelConfigs(configs);

      if (newlyAddedClassification) {
        const updatedNewClassification = classificationsWithModels.find(
          (c: Classification) => c._id === newlyAddedClassification._id
        );
        if (updatedNewClassification) {
          setNewlyAddedClassification(updatedNewClassification);
        }
      }

      if (classificationsWithModels.length === 0) {
        toast({
          title: "Info",
          description: "No classifications found in the database.",
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

  useEffect(() => {
    if (user) fetchClassifications();
  }, [user]);

  const addModelsToClassification = async (classificationId: string, models: { category: string; name: string; config: ModelConfig }[]) => {
    const failedModels: string[] = [];
    for (const model of models) {
      try {
        const payload = {
          classification_id: classificationId,
          model_name: model.name,
          hyperparameters: model.config.hyperparameters,
          hyperparameter_values: model.config.hyperparameter_values,
        };
        console.log(`Sending to /admin/add_model for ${model.name}:`, JSON.stringify(payload, null, 2));
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/add_model`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to add model ${model.name}: ${errorText}`);
        }
        const responseData = await response.json();
        console.log(`Response from /admin/add_model for ${model.name}:`, JSON.stringify(responseData, null, 2));
      } catch (error) {
        console.error(`Error adding model ${model.name}:`, error);
        failedModels.push(model.name);
      }
    }
    return failedModels;
  };

  const handleAddClassification = async () => {
    if (!classificationName.trim()) {
      toast({ title: "Error", description: "Classification name is required", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/add_classification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification_name: classificationName }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add classification: ${errorText}`);
      }
      const data = await response.json();
      const classificationId = data.classification_id;

      if (selectedModels.length > 0) {
        const failedModels = await addModelsToClassification(classificationId, selectedModels);
        if (failedModels.length > 0) {
          toast({
            title: "Partial Success",
            description: `Classification added, but failed to add models: ${failedModels.join(", ")}`,
            variant: "default",
          });
        }
      }

      const newClassification: Classification = {
        _id: classificationId,
        classification_name: classificationName,
        models: [],
      };
      setNewlyAddedClassification(newClassification);
      await fetchClassifications();
      setClassificationName("");
      setSelectedModels([]);
      setShowHyperparameterConfig(null);
      toast({ title: "Success", description: "Classification added successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add classification",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddModelsFromDropdown = async (classificationId: string) => {
    if (dropdownSelectedModels.length === 0) {
      toast({ title: "Error", description: "Please select at least one model", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const failedModels = await addModelsToClassification(classificationId, dropdownSelectedModels);
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
      setDropdownSelectedModels([]);
      setDropdownOpen(null);
      setShowHyperparameterConfig(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add models",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateClassification = async () => {
    if (!editingClassification || !editingClassification.name.trim()) {
      toast({ title: "Error", description: "Classification name is required", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/update_classification/${editingClassification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification_name: editingClassification.name }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update classification: ${errorText}`);
      }

      await fetchClassifications();
      if (newlyAddedClassification && newlyAddedClassification._id === editingClassification.id) {
        setNewlyAddedClassification({
          ...newlyAddedClassification,
          classification_name: editingClassification.name,
        });
      }
      setEditingClassification(null);
      toast({ title: "Success", description: "Classification updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update classification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClassification = async (classificationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delete_classification/${classificationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete classification: ${errorText}`);
      }

      await fetchClassifications();
      if (newlyAddedClassification && newlyAddedClassification._id === classificationId) {
        setNewlyAddedClassification(null);
      }
      toast({ title: "Success", description: "Classification deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete classification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delete_model/${modelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete model: ${errorText}`);
      }

      await fetchClassifications();
      setModelConfigs((prev) => {
        const newConfigs = { ...prev };
        delete newConfigs[modelId];
        return newConfigs;
      });
      toast({ title: "Success", description: "Model deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const handleHyperparameterChange = (modelType: string, param: string, value: any, modelId: string) => {
    setModelConfigs((prev) => {
      const updated = {
        ...prev,
        [modelId]: {
          ...prev[modelId],
          hyperparameter_values: {
            ...prev[modelId].hyperparameter_values,
            [param]: value,
          },
        },
      };
      console.log(`Updated modelConfigs[${modelId}] hyperparameter_values:`, JSON.stringify(updated[modelId].hyperparameter_values, null, 2));
      return updated;
    });
  };

  const handleAddLayer = (modelType: string, modelId: string) => {
    setModelConfigs((prev) => {
      const updated = {
        ...prev,
        [modelId]: {
          ...prev[modelId],
          hyperparameter_values: {
            ...prev[modelId].hyperparameter_values,
            layers: [
              ...(prev[modelId].hyperparameter_values.layers || []),
              {
                units: 64,
                activation: "relu",
                ...(modelType === "convolutional_neural_network" && {
                  filters: 32,
                  kernel_size: 3,
                  pool_size: 2,
                }),
                ...(modelType === "recurrent_neural_network" && {
                  return_sequences: false,
                }),
              },
            ],
          },
        },
      };
      console.log(`Added layer to modelConfigs[${modelId}]:`, JSON.stringify(updated[modelId].hyperparameter_values.layers, null, 2));
      return updated;
    });
  };

  const handleLayerChange = (
    modelType: string,
    index: number,
    field: string,
    value: number | string | boolean,
    modelId: string
  ) => {
    setModelConfigs((prev) => {
      const newLayers = [...(prev[modelId].hyperparameter_values.layers || [])];
      newLayers[index] = { ...newLayers[index], [field]: value };
      const updated = {
        ...prev,
        [modelId]: {
          ...prev[modelId],
          hyperparameter_values: {
            ...prev[modelId].hyperparameter_values,
            layers: newLayers,
          },
        },
      };
      console.log(`Updated layer ${index} in modelConfigs[${modelId}]:`, JSON.stringify(updated[modelId].hyperparameter_values.layers, null, 2));
      return updated;
    });
  };

  const handleSaveHyperparameters = async (classificationId: string, modelId: string) => {
    try {
      const modelConfig = modelConfigs[modelId];
      console.log(`Saving hyperparameter_values for model ${modelId}:`, JSON.stringify(modelConfig.hyperparameter_values, null, 2));
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/update_model/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification_id: classificationId,
          model_name: modelConfig.modelType,
          hyperparameters: modelConfig.hyperparameters,
          hyperparameter_values: modelConfig.hyperparameter_values,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update model: ${errorText}`);
      }
      await fetchClassifications();
      setEditingModel(null);
      toast({ title: "Success", description: "Model hyperparameters updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update model",
        variant: "destructive",
      });
    }
  };

  const handleModelToggle = (category: string, name: string) => {
    setSelectedModels((prev) => {
      const modelKey = `${category}-${name}`;
      if (prev.some((m) => `${m.category}-${m.name}` === modelKey)) {
        const newModels = prev.filter((m) => `${m.category}-${m.name}` !== modelKey);
        console.log(`Removed model ${modelKey}, new state:`, JSON.stringify(newModels, null, 2));
        return newModels;
      }
      const { hyperparameters, hyperparameter_values } = initializeHyperparameters(category, name);
      const newModel = { category, name, config: { modelType: name, hyperparameters, hyperparameter_values } };
      const newModels = [...prev, newModel];
      console.log(`Added model ${modelKey}, new state:`, JSON.stringify(newModels, null, 2));
      return newModels;
    });
  };

  const handleDropdownModelToggle = (category: string, name: string) => {
    setDropdownSelectedModels((prev) => {
      const modelKey = `${category}-${name}`;
      if (prev.some((m) => `${m.category}-${m.name}` === modelKey)) {
        const newModels = prev.filter((m) => `${m.category}-${m.name}` !== modelKey);
        console.log(`Removed dropdown model ${modelKey}, new state:`, JSON.stringify(newModels, null, 2));
        return newModels;
      }
      const { hyperparameters, hyperparameter_values } = initializeHyperparameters(category, name);
      const newModel = { category, name, config: { modelType: name, hyperparameters, hyperparameter_values } };
      const newModels = [...prev, newModel];
      console.log(`Added dropdown model ${modelKey}, new state:`, JSON.stringify(newModels, null, 2));
      return newModels;
    });
  };

  const handleHyperparameterConfigChange = (
    category: string,
    modelName: string,
    param: string,
    value: any,
    isDropdown: boolean
  ) => {
    const targetModels = isDropdown ? dropdownSelectedModels : selectedModels;
    const setTargetModels = isDropdown ? setDropdownSelectedModels : setSelectedModels;
    const paramConfig = modelCategories[category][modelName][param];

    // Validate and parse the value
    let parsedValue = value;
    if (paramConfig.type === "int") {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || (paramConfig.min && parsedValue < paramConfig.min) || (paramConfig.max && parsedValue > paramConfig.max)) {
        toast({
          title: "Invalid Input",
          description: `${param} must be an integer between ${paramConfig.min || 0} and ${paramConfig.max || "∞"}`,
          variant: "destructive",
        });
        return;
      }
    } else if (paramConfig.type === "float") {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue) || (paramConfig.min && parsedValue < paramConfig.min) || (paramConfig.max && parsedValue > paramConfig.max)) {
        toast({
          title: "Invalid Input",
          description: `${param} must be a number between ${paramConfig.min || 0} and ${paramConfig.max || "∞"}`,
          variant: "destructive",
        });
        return;
      }
    } else if (paramConfig.type === "bool") {
      parsedValue = value === "true" || value === true;
    } else if (Array.isArray(paramConfig.type)) {
      const validOptions = paramConfig.options || paramConfig.type;
      if (value === "null") {
        parsedValue = null;
      } else if (!validOptions.includes(value)) {
        // Handle mixed types (e.g., random_state: ["int", "None"])
        if (paramConfig.type.includes("int") && !isNaN(parseInt(value, 10))) {
          parsedValue = parseInt(value, 10);
        } else {
          toast({
            title: "Invalid Input",
            description: `${param} must be one of ${validOptions.join(", ")}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (paramConfig.type === "str" && typeof value !== "string") {
      toast({
        title: "Invalid Input",
        description: `${param} must be a string`,
        variant: "destructive",
      });
      return;
    }

    setTargetModels((prev) => {
      const updatedModels = prev.map((m) => {
        if (m.category === category && m.name === modelName) {
          const newHyperparameterValues = { ...m.config.hyperparameter_values, [param]: parsedValue };
          console.log(
            `Updated hyperparameter_values for ${category}/${modelName} (${isDropdown ? "dropdown" : "main"}):`,
            JSON.stringify(newHyperparameterValues, null, 2)
          );
          return {
            ...m,
            config: {
              ...m.config,
              hyperparameter_values: newHyperparameterValues,
            },
          };
        }
        return m;
      });
      console.log(`New ${isDropdown ? "dropdownSelectedModels" : "selectedModels"} state:`, JSON.stringify(updatedModels, null, 2));
      return updatedModels;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin - Manage Classifications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Classification</CardTitle>
          <CardDescription>Define a classification and select required models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Classification name"
                value={classificationName}
                onChange={(e) => setClassificationName(e.target.value)}
                disabled={isAdding || loading}
              />
              <Button onClick={handleAddClassification} disabled={isAdding || loading}>
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : "Add Classification"}
              </Button>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Select Models</h4>
              <div className="grid gap-2">
                {Object.entries(modelCategories).flatMap(([category, models]) =>
                  Object.keys(models).map((name) => (
                    <div key={`${category}-${name}`} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`${category}-${name}`}
                          checked={selectedModels.some((m) => m.category === category && m.name === name)}
                          onCheckedChange={() => handleModelToggle(category, name)}
                          disabled={isAdding || loading}
                        />
                        <label htmlFor={`${category}-${name}`} className="font-medium">
                          {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (
                          {category.replace(/_/g, " ")})
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHyperparameterConfig(showHyperparameterConfig === `${category}-${name}` ? null : `${category}-${name}`)}
                          disabled={isAdding || loading || !selectedModels.some((m) => m.category === category && m.name === name)}
                        >
                          {showHyperparameterConfig === `${category}-${name}` ? "Hide" : "Configure"} Hyperparameters
                        </Button>
                      </div>
                      {showHyperparameterConfig === `${category}-${name}` && (
                        <div className="ml-6 p-4 border rounded-lg">
                          {(() => {
                            const model = selectedModels.find((m) => m.category === category && m.name === name);
                            if (!model) return <p>Model not found</p>;
                            return renderHyperparameters(
                              { ...model.config, hyperparameters: model.config.hyperparameter_values }, // Pass values to UI
                              (modelType, param, value) => handleHyperparameterConfigChange(category, name, param, value, false),
                              () => handleAddLayer(name, `${category}-${name}`),
                              (modelType, index, field, value) => handleLayerChange(modelType, index, field, value, `${category}-${name}`),
                              Object.keys(neuralModels).includes(name),
                              modelCategories[category][name]
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editingClassification && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Classification name"
                value={editingClassification.name}
                onChange={(e) =>
                  setEditingClassification({ ...editingClassification, name: e.target.value })
                }
                disabled={loading}
              />
              <Button onClick={handleUpdateClassification} disabled={loading}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingClassification(null)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Classifications</CardTitle>
          <Button
            variant="outline"
            onClick={() => {
              setNewlyAddedClassification(null);
              fetchClassifications();
            }}
            disabled={loading}
          >
            Show All Classifications
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading classifications...</p>}
          {!loading && !newlyAddedClassification && classifications.length === 0 ? (
            <p className="text-muted-foreground">No classifications available</p>
          ) : (
            <>
              {newlyAddedClassification && (
                <DropdownMenu
                  open={dropdownOpen === newlyAddedClassification._id}
                  onOpenChange={(open) => setDropdownOpen(open ? newlyAddedClassification._id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow min-h-[100px]"
                      onClick={() => setDropdownOpen(newlyAddedClassification._id)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{newlyAddedClassification.classification_name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClassification({
                                id: newlyAddedClassification._id,
                                name: newlyAddedClassification.classification_name,
                              });
                            }}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClassification(newlyAddedClassification._id);
                            }}
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">Models:</p>
                        {newlyAddedClassification.models.length === 0 ? (
                          <p className="text-muted-foreground">No models assigned</p>
                        ) : (
                          <ul className="list-disc pl-5 space-y-2">
                            {newlyAddedClassification.models.map((model) => (
                              <li key={model._id} className="flex flex-col">
                                <div className="flex items-center justify-between">
                                  <span>
                                    {model.model_name
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingModel({
                                          classificationId: newlyAddedClassification._id,
                                          modelId: model._id,
                                        });
                                      }}
                                      disabled={loading}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteModel(model._id);
                                      }}
                                      disabled={loading}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {editingModel?.modelId === model._id &&
                                  editingModel.classificationId === newlyAddedClassification._id && (
                                    <div className="mt-2 p-4 border rounded-lg">
                                      {modelConfigs[model._id] ? (
                                        <>
                                          {renderHyperparameters(
                                            { ...modelConfigs[model._id], hyperparameters: modelConfigs[model._id].hyperparameter_values }, // Pass values to UI
                                            (modelType, param, value) =>
                                              handleHyperparameterChange(modelType, param, value, model._id),
                                            () => handleAddLayer(model.model_name, model._id),
                                            (modelType, index, field, value) =>
                                              handleLayerChange(
                                                modelType,
                                                index,
                                                field,
                                                value,
                                                model._id
                                              ),
                                            Object.keys(neuralModels).includes(model.model_name),
                                            modelCategories[model.model_name.split("_")[0]][model.model_name]
                                          )}
                                          <div className="flex gap-2 mt-4">
                                            <Button
                                              onClick={() =>
                                                handleSaveHyperparameters(
                                                  newlyAddedClassification._id,
                                                  model._id
                                                )
                                              }
                                              disabled={loading}
                                            >
                                              Save Hyperparameters
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() => setEditingModel(null)}
                                              disabled={loading}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <p>Loading hyperparameters...</p>
                                      )}
                                    </div>
                                  )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96">
                    <DropdownMenuLabel>Add Models</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto p-2">
                      {Object.entries(modelCategories).flatMap(([category, models]) =>
                        Object.keys(models).map((name) => (
                          <div key={`${category}-${name}`} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`dropdown-${category}-${name}`}
                                checked={dropdownSelectedModels.some(
                                  (m) => m.category === category && m.name === name
                                )}
                                onCheckedChange={() => handleDropdownModelToggle(category, name)}
                                disabled={loading}
                              />
                              <label
                                htmlFor={`dropdown-${category}-${name}`}
                                className="font-medium"
                              >
                                {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (
                                {category.replace(/_/g, " ")})
                              </label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHyperparameterConfig(showHyperparameterConfig === `${category}-${name}-dropdown` ? null : `${category}-${name}-dropdown`)}
                                disabled={isAdding || loading || !dropdownSelectedModels.some((m) => m.category === category && m.name === name)}
                              >
                                {showHyperparameterConfig === `${category}-${name}-dropdown` ? "Hide" : "Configure"} Hyperparameters
                              </Button>
                            </div>
                            {showHyperparameterConfig === `${category}-${name}-dropdown` && (
                              <div className="ml-6 p-4 border rounded-lg">
                                {(() => {
                                  const model = dropdownSelectedModels.find((m) => m.category === category && m.name === name);
                                  if (!model) return <p>Model not found</p>;
                                  return renderHyperparameters(
                                    { ...model.config, hyperparameters: model.config.hyperparameter_values }, // Pass values to UI
                                    (modelType, param, value) => handleHyperparameterConfigChange(category, name, param, value, true),
                                    () => handleAddLayer(name, `${category}-${name}`),
                                    (modelType, index, field, value) => handleLayerChange(modelType, index, field, value, `${category}-${name}`),
                                    Object.keys(neuralModels).includes(name),
                                    modelCategories[category][name]
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Button
                        className="w-full"
                        onClick={() => handleAddModelsFromDropdown(newlyAddedClassification._id)}
                        disabled={isAdding || loading || dropdownSelectedModels.length === 0}
                      >
                        {isAdding ? "Adding..." : "Add Selected Models"}
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!newlyAddedClassification && (
                <div className="space-y-4">
                  {classifications.map((classification) => (
                    <DropdownMenu
                      key={classification._id}
                      open={dropdownOpen === classification._id}
                      onOpenChange={(open) => setDropdownOpen(open ? classification._id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Card
                          className="cursor-pointer hover:shadow-md transition-shadow min-h-[100px]"
                          onClick={() => setDropdownOpen(classification._id)}
                        >
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{classification.classification_name}</CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClassification({
                                    id: classification._id,
                                    name: classification.classification_name,
                                  });
                                }}
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClassification(classification._id);
                                }}
                                disabled={loading}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="font-semibold">Models:</p>
                            {classification.models.length === 0 ? (
                              <p className="text-muted-foreground">No models assigned</p>
                            ) : (
                              <ul className="list-disc pl-5 space-y-2">
                                {classification.models.map((model) => (
                                  <li key={model._id} className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                      <span>
                                        {model.model_name
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                                      </span>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingModel({
                                              classificationId: classification._id,
                                              modelId: model._id,
                                            });
                                          }}
                                          disabled={loading}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteModel(model._id);
                                          }}
                                          disabled={loading}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    {editingModel?.modelId === model._id &&
                                      editingModel.classificationId === classification._id && (
                                        <div className="mt-2 p-4 border rounded-lg">
                                          {modelConfigs[model._id] ? (
                                            <>
                                              {renderHyperparameters(
                                                { ...modelConfigs[model._id], hyperparameters: modelConfigs[model._id].hyperparameter_values }, // Pass values to UI
                                                (modelType, param, value) =>
                                                  handleHyperparameterChange(modelType, param, value, model._id),
                                                () => handleAddLayer(model.model_name, model._id),
                                                (modelType, index, field, value) =>
                                                  handleLayerChange(
                                                    modelType,
                                                    index,
                                                    field,
                                                    value,
                                                    model._id
                                                  ),
                                                Object.keys(neuralModels).includes(model.model_name),
                                                modelCategories[model.model_name.split("_")[0]][model.model_name]
                                              )}
                                              <div className="flex gap-2 mt-4">
                                                <Button
                                                  onClick={() =>
                                                    handleSaveHyperparameters(classification._id, model._id)
                                                  }
                                                  disabled={loading}
                                                >
                                                  Save Hyperparameters
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => setEditingModel(null)}
                                                  disabled={loading}
                                                >
                                                  Cancel
                                                </Button>
                                              </div>
                                            </>
                                          ) : (
                                            <p>Loading hyperparameters...</p>
                                          )}
                                        </div>
                                      )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-96">
                        <DropdownMenuLabel>Add Models</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-64 overflow-y-auto p-2">
                          {Object.entries(modelCategories).flatMap(([category, models]) =>
                            Object.keys(models).map((name) => (
                              <div key={`${category}-${name}`} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`dropdown-${category}-${name}`}
                                    checked={dropdownSelectedModels.some(
                                      (m) => m.category === category && m.name === name
                                    )}
                                    onCheckedChange={() => handleDropdownModelToggle(category, name)}
                                    disabled={loading}
                                  />
                                  <label
                                    htmlFor={`dropdown-${category}-${name}`}
                                    className="font-medium"
                                  >
                                    {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (
                                    {category.replace(/_/g, " ")})
                                  </label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowHyperparameterConfig(showHyperparameterConfig === `${category}-${name}-dropdown` ? null : `${category}-${name}-dropdown`)}
                                    disabled={isAdding || loading || !dropdownSelectedModels.some((m) => m.category === category && m.name === name)}
                                  >
                                    {showHyperparameterConfig === `${category}-${name}-dropdown` ? "Hide" : "Configure"} Hyperparameters
                                  </Button>
                                </div>
                                {showHyperparameterConfig === `${category}-${name}-dropdown` && (
                                  <div className="ml-6 p-4 border rounded-lg">
                                    {(() => {
                                      const model = dropdownSelectedModels.find((m) => m.category === category && m.name === name);
                                      if (!model) return <p>Model not found</p>;
                                      return renderHyperparameters(
                                        { ...model.config, hyperparameters: model.config.hyperparameter_values }, // Pass values to UI
                                        (modelType, param, value) => handleHyperparameterConfigChange(category, name, param, value, true),
                                        () => handleAddLayer(name, `${category}-${name}`),
                                        (modelType, index, field, value) => handleLayerChange(modelType, index, field, value, `${category}-${name}`),
                                        Object.keys(neuralModels).includes(name),
                                        modelCategories[category][name]
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Button
                            className="w-full"
                            onClick={() => handleAddModelsFromDropdown(classification._id)}
                            disabled={isAdding || loading || dropdownSelectedModels.length === 0}
                          >
                            {isAdding ? "Adding..." : "Add Selected Models"}
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ))}
                </div>
              )}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Debug Classifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre>{JSON.stringify(newlyAddedClassification || classifications, null, 2)}</pre>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}