"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export default function ModelSelection() {
  const [modelType, setModelType] = useState("")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Model Selection and Training</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Model Type</CardTitle>
          <CardDescription>Choose the type of machine learning model</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => setModelType(value)}>
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

      {modelType === "supervised" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Supervised Learning Models</CardTitle>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear_regression">Linear Regression</SelectItem>
                <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                <SelectItem value="decision_tree">Decision Tree</SelectItem>
                <SelectItem value="random_forest">Random Forest</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {modelType === "unsupervised" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Unsupervised Learning Models</CardTitle>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kmeans">K-Means Clustering</SelectItem>
                <SelectItem value="hierarchical">Hierarchical Clustering</SelectItem>
                <SelectItem value="pca">Principal Component Analysis</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {modelType === "neural" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Neural Network Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="block mb-2">Number of Hidden Layers</label>
                <Input type="number" min="1" max="10" defaultValue="1" />
              </div>
              <div>
                <label className="block mb-2">Neurons per Hidden Layer</label>
                <Input type="number" min="1" max="100" defaultValue="32" />
              </div>
              <div>
                <label className="block mb-2">Activation Function</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relu">ReLU</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                    <SelectItem value="tanh">Tanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              <Slider defaultValue={[0.01]} max={1} step={0.01} />
            </div>
            <div>
              <label className="block mb-2">Regularization Strength</label>
              <Slider defaultValue={[0.1]} max={1} step={0.1} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Train Model</CardTitle>
          <CardDescription>Start the model training process</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Train Model</Button>
        </CardContent>
      </Card>
    </div>
  )
}

