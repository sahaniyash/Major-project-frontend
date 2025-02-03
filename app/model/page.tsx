"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface DatasetInfo {
  columns: string[]
  shape: [number, number]
  targetColumn?: string
}

export default function ModelSelection() {
  const router = useRouter()
  const { toast } = useToast()
  const [modelType, setModelType] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
  const [selectedModel, setSelectedModel] = useState("")
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: 0.01,
    regularization: 0.1
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/dataset/analyze', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setDatasetInfo(data)
        toast({
          title: "Success",
          description: "Dataset uploaded and analyzed successfully",
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload and analyze dataset",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTrainModel = async () => {
    if (!selectedModel || !datasetInfo) {
      toast({
        title: "Error",
        description: "Please select a model and upload dataset first",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/model/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelType: selectedModel,
          hyperparameters,
          targetColumn: datasetInfo.targetColumn,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Model training started successfully",
        })
        router.push('/model-comparison') // Redirect to model comparison page
      } else {
        throw new Error('Training failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start model training",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Model Selection and Training</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Dataset</CardTitle>
          <CardDescription>Upload your dataset to begin model selection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input 
              type="file" 
              onChange={handleFileSelect} 
              accept=".csv,.xlsx,.json"
            />
            <Button 
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? "Analyzing..." : "Upload & Analyze"}
            </Button>
          </div>
          {datasetInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Dataset Information</h3>
              <p>Rows: {datasetInfo.shape[0]}</p>
              <p>Columns: {datasetInfo.shape[1]}</p>
              <p>Features: {datasetInfo.columns.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {datasetInfo && (
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
                <CardTitle>{modelType === 'supervised' ? 'Supervised Learning Models' : 
                           modelType === 'unsupervised' ? 'Unsupervised Learning Models' : 
                           'Neural Network Architecture'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelType === 'supervised' && (
                      <>
                        <SelectItem value="linear_regression">Linear Regression</SelectItem>
                        <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                        <SelectItem value="decision_tree">Decision Tree</SelectItem>
                        <SelectItem value="random_forest">Random Forest</SelectItem>
                      </>
                    )}
                    {modelType === 'unsupervised' && (
                      <>
                        <SelectItem value="kmeans">K-Means Clustering</SelectItem>
                        <SelectItem value="hierarchical">Hierarchical Clustering</SelectItem>
                        <SelectItem value="pca">Principal Component Analysis</SelectItem>
                      </>
                    )}
                    {modelType === 'neural' && (
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
                    onValueChange={([value]) => setHyperparameters(prev => ({ ...prev, learningRate: value }))}
                  />
                </div>
                <div>
                  <label className="block mb-2">Regularization Strength</label>
                  <Slider 
                    defaultValue={[hyperparameters.regularization]} 
                    max={1} 
                    step={0.1}
                    onValueChange={([value]) => setHyperparameters(prev => ({ ...prev, regularization: value }))}
                  />
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
              <Button onClick={handleTrainModel} disabled={!selectedModel}>Train Model</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}