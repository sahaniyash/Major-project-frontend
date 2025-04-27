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
  models: { _id: string; model_name: string; hyperparameters: Record<string, any> }[];
}

interface ModelCategories {
  [key: string]: {
    [key: string]: Record<string, any>;
  };
}

interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
}

export default function AdminPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [classificationName, setClassificationName] = useState("");
  const [selectedModels, setSelectedModels] = useState<{ category: string; name: string }[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [newlyAddedClassification, setNewlyAddedClassification] = useState<Classification | null>(null);
  const [editingClassification, setEditingClassification] = useState<{ id: string; name: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [dropdownSelectedModels, setDropdownSelectedModels] = useState<{ category: string; name: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<{ classificationId: string; modelId: string } | null>(null);
  const [modelConfigs, setModelConfigs] = useState<{ [key: string]: ModelConfig }>({});

  const modelCategories: ModelCategories = {
    classification: classificationModels,
    clustering: clusteringModels,
    naive_bayes: naiveBayesModels,
    regression: regressionModels,
    neural: neuralModels,
  };

  // Fetch existing classifications and their models
  const fetchClassifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/admin/get_classifications", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch classifications: ${errorText}`);
      }
      const data = await response.json();
      console.log("Fetched classifications:", data);

      // Fetch models for each classification
      const classificationsWithModels = await Promise.all(
        data.map(async (classification: { _id: string; classification_name: string }) => {
          try {
            const modelResponse = await fetch(
              `http://127.0.0.1:5000/admin/get_models/${classification._id}`
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
              })),
            };
          } catch (error) {
            console.error(`Error fetching models for ${classification._id}:`, error);
            return {
              _id: classification._id,
              classification_name: classification.classification_name,
              models: [],
            };
          }
        })
      );

      setClassifications(classificationsWithModels);

      // Update modelConfigs for editing
      const configs: { [key: string]: ModelConfig } = {};
      classificationsWithModels.forEach((classification) => {
        classification.models.forEach((model) => {
          configs[model._id] = {
            modelType: model.model_name,
            hyperparameters: model.hyperparameters,
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

  useEffect(() => {
    if (user) fetchClassifications();
  }, [user]);

  const addModelsToClassification = async (classificationId: string, models: { category: string; name: string }[]) => {
    const failedModels: string[] = [];
    for (const model of models) {
      try {
        // Use the default hyperparameters from ModelUtils.tsx
        const modelConfig = modelCategories[model.category][model.name];
        console.log(`Adding model: ${model.name} to classification ${classificationId}`, modelConfig);
        const modelResponse = await fetch("http://127.0.0.1:5000/admin/add_model", {
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
    return failedModels;
  };

  const handleAddClassification = async () => {
    if (!classificationName.trim()) {
      toast({ title: "Error", description: "Classification name is required", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      console.log("Adding classification:", classificationName);
      const response = await fetch("http://127.0.0.1:5000/admin/add_classification", {
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
      console.log("Classification added:", data);

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
      toast({ title: "Success", description: "Classification added successfully" });
    } catch (error) {
      console.error("Add classification error:", error);
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
    } catch (error) {
      console.error("Add models from dropdown error:", error);
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
      console.log("Updating classification:", editingClassification);
      const response = await fetch(`http://127.0.0.1:5000/admin/update_classification/${editingClassification.id}`, {
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
      console.error("Update classification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update classification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClassification = async (classificationId: string) => {
    try {
      console.log("Deleting classification:", classificationId);
      const response = await fetch(`http://127.0.0.1:5000/admin/delete_classification/${classificationId}`, {
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
      console.error("Delete classification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete classification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      console.log("Deleting model:", modelId);
      const response = await fetch(`http://127.0.0.1:5000/admin/delete_model/${modelId}`, {
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
      console.error("Delete model error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const handleHyperparameterChange = (modelType: string, param: string, value: any, modelId: string) => {
    // Type conversions for SVR hyperparameters to ensure correct data types
    let typedValue: any = value;
    if (modelType === "svr") {
      switch (param) {
        case "degree":
        case "cache_size":
          typedValue = Number(value);
          break;
        case "coef0":
        case "tol":
        case "C":
        case "epsilon":
          typedValue = Number(value);
          break;
        case "shrinking":
        case "verbose":
        case "positive":
          typedValue = Boolean(value);
          break;
        case "max_iter":
          typedValue = value === "" ? -1 : Number(value);
          break;
        case "kernel":
        case "gamma":
          typedValue = String(value);
          break;
      }
    }

    setModelConfigs((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        hyperparameters: {
          ...prev[modelId].hyperparameters,
          [param]: typedValue,
        },
      },
    }));
  };

  const handleAddLayer = (modelType: string, modelId: string) => {
    setModelConfigs((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        hyperparameters: {
          ...prev[modelId].hyperparameters,
          layers: [
            ...prev[modelId].hyperparameters.layers,
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
    }));
  };

  const handleLayerChange = (
    modelType: string,
    index: number,
    field: string,
    value: number | string | boolean,
    modelId: string
  ) => {
    setModelConfigs((prev) => {
      const newLayers = [...prev[modelId].hyperparameters.layers];
      newLayers[index] = { ...newLayers[index], [field]: value };
      return {
        ...prev,
        [modelId]: {
          ...prev[modelId],
          hyperparameters: {
            ...prev[modelId].hyperparameters,
            layers: newLayers,
          },
        },
      };
    });
  };

  const handleSaveHyperparameters = async (classificationId: string, modelId: string) => {
    try {
      const modelConfig = modelConfigs[modelId];
      const response = await fetch(`http://127.0.0.1:5000/admin/update_model/${modelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification_id: classificationId,
          model_name: modelConfig.modelType,
          hyperparameters: modelConfig.hyperparameters,
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
      console.error("Update model error:", error);
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
        return prev.filter((m) => `${m.category}-${m.name}` !== modelKey);
      }
      return [...prev, { category, name }];
    });
  };

  const handleDropdownModelToggle = (category: string, name: string) => {
    setDropdownSelectedModels((prev) => {
      const modelKey = `${category}-${name}`;
      if (prev.some((m) => `${m.category}-${m.name}` === modelKey)) {
        return prev.filter((m) => `${m.category}-${m.name}` !== modelKey);
      }
      return [...prev, { category, name }];
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
                    <div key={`${category}-${name}`} className="flex items-center gap-3">
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
                                            modelConfigs[model._id],
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
                                            Object.keys(neuralModels).includes(model.model_name)
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
                          <DropdownMenuItem key={`${category}-${name}`} asChild>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`dropdown-${category}-${name}`}
                                checked={dropdownSelectedModels.some(
                                  (m) => m.category === category && m.name === name
                                )}
                                onCheckedChange={() => handleDropdownModelToggle(category, name)}
                                disabled={loading}
                              />
                              <label htmlFor={`dropdown-${category}-${name}`} className="font-medium">
                                {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (
                                {category.replace(/_/g, " ")})
                              </label>
                            </div>
                          </DropdownMenuItem>
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
                                                modelConfigs[model._id],
                                                (modelType, param, value) =>
                                                  handleHyperparameterChange(
                                                    modelType,
                                                    param,
                                                    value,
                                                    model._id
                                                  ),
                                                () => handleAddLayer(model.model_name, model._id),
                                                (modelType, index, field, value) =>
                                                  handleLayerChange(
                                                    modelType,
                                                    index,
                                                    field,
                                                    value,
                                                    model._id
                                                  ),
                                                Object.keys(neuralModels).includes(model.model_name)
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
                              <DropdownMenuItem key={`${category}-${name}`} asChild>
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
                                </div>
                              </DropdownMenuItem>
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
            </>
          )}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Debug Classifications</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(newlyAddedClassification || classifications, null, 2)}</pre>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}