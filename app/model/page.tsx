"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface DatasetInfo {
  datasetId: string
  columns: string[]
  shape: [number, number]
  columnTypes: Record<string, string>
  targetColumn?: string
  summary: {
    missingValues: Record<string, number>
    uniqueValues: Record<string, number>
  }
}

export default function ModelSelection() {
  const router = useRouter()
  const { toast } = useToast()
  const [modelType, setModelType] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null)
  const [selectedModel, setSelectedModel] = useState("")
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: 0.01,
    regularization: 0.1
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (e.g., max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 100MB",
          variant: "destructive"
        })
        return
      }

      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.json']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!validTypes.includes(fileExtension)) {
        toast({
          title: "Error",
          description: "Invalid file type. Please upload CSV, Excel, or JSON file",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
      setDatasetInfo(null) // Reset previous dataset info
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
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/dataset/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setDatasetInfo(data)
      
      // Set default target column if available
      if (data.targetColumn) {
        setTargetColumn(data.targetColumn)
      }

      toast({
        title: "Success",
        description: "Dataset uploaded and analyzed successfully",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload and analyze dataset",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(100)
    }
  }

  const handleTrainModel = async () => {
    if (!selectedModel || !datasetInfo || !targetColumn) {
      toast({
        title: "Error",
        description: "Please select a model, upload dataset, and specify target column",
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
          datasetId: datasetInfo.datasetId,
          targetColumn,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Model training started successfully",
      })
      
      // Redirect to model comparison page with the job ID
      router.push(`/model-comparison?jobId=${data.jobId}`)
    } catch (error) {
      console.error('Training error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start model training",
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
              disabled={isUploading}
            />
            <Button 
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? "Analyzing..." : "Upload & Analyze"}
            </Button>
          </div>
          
          {isUploading && (
            <Progress value={uploadProgress} className="mt-4" />
          )}

          {datasetInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold mb-2">Dataset Information</h3>
              <p>Rows: {datasetInfo.shape[0]}</p>
              <p>Columns: {datasetInfo.shape[1]}</p>
              
              <div>
                <h4 className="font-medium">Column Types:</h4>
                <ul className="list-disc list-inside">
                  {Object.entries(datasetInfo.columnTypes).map(([col, type]) => (
                    <li key={col}>{col}: {type}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Target Column:</h4>
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetInfo.columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {datasetInfo && targetColumn && (
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
                  <span className="text-sm text-muted-foreground mt-1">
                    Current: {hyperparameters.learningRate}
                  </span>
                </div>
                <div>
                  <label className="block mb-2">Regularization Strength</label>
                  <Slider 
                    defaultValue={[hyperparameters.regularization]} 
                    max={1} 
                    step={0.1}
                    onValueChange={([value]) => setHyperparameters(prev => ({ ...prev, regularization: value }))}
                  />
                  <span className="text-sm text-muted-foreground mt-1">
                    Current: {hyperparameters.regularization}
                  </span>
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
              <Button 
                onClick={handleTrainModel} 
                disabled={!selectedModel || !targetColumn}
              >
                Train Model
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}