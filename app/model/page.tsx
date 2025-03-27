"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import "chart.js/auto";
import { Line, Bar } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs";

interface Layer {
  id: number;
  type: string;
  neurons: number;
  activation: string;
}

interface Model {
  id: number;
  name: string;
  layers: Layer[];
}

export default function ModelSelection() {
  const { user } = useUser();
  const { toast } = useToast();
  const [modelType, setModelType] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState<Model[]>([
    { id: 1, name: "Model 1", layers: [] },
    { id: 2, name: "Model 2", layers: [] },
  ]);

  const addModel = () => {
    if (models.length >= 10) {
      toast({
        title: "Limit Reached",
        description: "You can add up to 10 models only",
        variant: "destructive",
      });
      return;
    }
    setModels([...models, { id: models.length + 1, name: `Model ${models.length + 1}`, layers: [] }]);
  };

  const removeModel = (id: number) => {
    if (models.length > 2) {
      setModels(models.filter((model) => model.id !== id));
    } else {
      toast({
        title: "Cannot Remove",
        description: "At least two models are required",
        variant: "destructive",
      });
    }
  };

  const addLayer = (modelId: number) => {
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === modelId
          ? {
              ...model,
              layers: [
                ...model.layers,
                { id: model.layers.length + 1, type: "Dense", neurons: 32, activation: "ReLU" },
              ],
            }
          : model
      )
    );
  };

  const removeLayer = (modelId: number, layerId: number) => {
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === modelId ? { ...model, layers: model.layers.filter((layer) => layer.id !== layerId) } : model
      )
    );
  };

  const updateLayer = (modelId: number, layerId: number, field: keyof Layer, value: any) => {
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === modelId
          ? {
              ...model,
              layers: model.layers.map((layer) =>
                layer.id === layerId ? { ...layer, [field]: value } : layer
              ),
            }
          : model
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Model Selection and Training</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Model Type</CardTitle>
          <CardDescription>Choose a machine learning model type</CardDescription>
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

      {modelType === "neural" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Neural Network Models</CardTitle>
            <CardDescription>Add models and layers with hyperparameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 overflow-x-auto max-w-full p-2">
              {models.map((model) => (
                <div key={model.id} className="border p-4 rounded-lg w-80 bg-gray-100 relative">
                  <h3 className="text-lg font-semibold mb-2">{model.name}</h3>

                  {model.id > 2 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeModel(model.id)}
                    >
                      X
                    </Button>
                  )}

                  <div className="max-h-64 overflow-y-auto p-2 border rounded">
                    {model.layers.map((layer) => (
                      <div key={layer.id} className="p-2 border-b mb-2">
                        <h4 className="font-medium">Layer {layer.id}</h4>
                        <Select onValueChange={(value) => updateLayer(model.id, layer.id, "type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={layer.type} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dense">Dense</SelectItem>
                            <SelectItem value="Conv2D">Conv2D</SelectItem>
                            <SelectItem value="LSTM">LSTM</SelectItem>
                          </SelectContent>
                        </Select>

                        <label className="block mt-2">Neurons</label>
                        <Slider
                          defaultValue={[layer.neurons]}
                          min={8}
                          max={512}
                          step={8}
                          onValueChange={([value]) => updateLayer(model.id, layer.id, "neurons", value)}
                        />

                        <label className="block mt-2">Activation</label>
                        <Select onValueChange={(value) => updateLayer(model.id, layer.id, "activation", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={layer.activation} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ReLU">ReLU</SelectItem>
                            <SelectItem value="Sigmoid">Sigmoid</SelectItem>
                            <SelectItem value="Tanh">Tanh</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          onClick={() => removeLayer(model.id, layer.id)}
                        >
                          Remove Layer
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button className="mt-4 w-full" onClick={() => addLayer(model.id)}>
                    Add Layer
                  </Button>
                </div>
              ))}
            </div>

            <Button className="mt-4" onClick={addModel}>
              Add Model
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
