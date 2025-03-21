"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart } from "@/components/charts"
import { useToast } from "@/components/ui/use-toast"

interface ModelMetrics {
  name: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingTime: number
  timestamp: string
  mse?: number | null
  r2?: number | null
}

interface Dataset {
  _id: string
  filename: string
  is_preprocessing_done: boolean
}

export default function ModelComparison() {
  const { user } = useUser()
  const { toast } = useToast()
  const [selectedMetric, setSelectedMetric] = useState("accuracy")
  const [models, setModels] = useState<ModelMetrics[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mongoUserId, setMongoUserId] = useState<string | null>(null)

  const fetchUserDatasets = async () => {
    if (!user) {
      console.log("User not loaded yet")
      return
    }

    console.log("Fetching user data for Clerk ID:", user.id)
    try {
      const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
        credentials: "include",
      })
      console.log("Response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`)
      }

      const userData = await response.json()
      console.log("User data received:", userData)
      if (!userData.user_id) {
        throw new Error("MongoDB user_id not found in user data")
      }
      setMongoUserId(userData.user_id)

      const datasetIds = userData.dataset_ids || []
      console.log("Extracted dataset IDs:", datasetIds)

      if (datasetIds.length === 0) {
        console.log("No dataset IDs found to fetch.")
        setDatasets([])
        return
      }

      const datasetsPromises = datasetIds.map(async (id: string) => {
        const response = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to fetch dataset ${id}: ${response.status} - ${errorText}`)
          return null
        }
        return response.json()
      })

      const datasetsData = (await Promise.all(datasetsPromises)).filter((data) => data !== null)
      console.log("Fetched datasets:", datasetsData)
      const preprocessedDatasets = datasetsData.filter((d) => d.is_preprocessing_done)
      setDatasets(preprocessedDatasets)
      if (preprocessedDatasets.length > 0) {
        setSelectedDatasetId(preprocessedDatasets[0]._id) // Default to first preprocessed dataset
      }
    } catch (error) {
      console.error("Error fetching datasets:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch datasets",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserDatasets()
    }
  }, [user])

  useEffect(() => {
    if (selectedDatasetId) {
      fetchModelMetrics(selectedDatasetId)
    }
  }, [selectedDatasetId])

  const fetchModelMetrics = async (datasetId: string) => {
    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"
      const url = `${apiUrl}/model/metrics?datasetId=${datasetId}`
      console.log(`Fetching model metrics from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Match DataManagement
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `HTTP error! status: ${response.status}`
        throw new Error(errorMsg)
      }

      const data: ModelMetrics[] = await response.json()
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: Expected an array of model metrics")
      }

      setModels(data)
      console.log(`Successfully fetched ${data.length} model metrics for datasetId: ${datasetId}`)
    } catch (error: any) {
      console.error(`Fetch error for datasetId ${datasetId}:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch model metrics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getChartData = () => {
    return models.map((model) => ({
      name: model.name,
      value: (model[selectedMetric as keyof ModelMetrics] as number) || 0,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Model Comparison</h1>

      {datasets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Datasets Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No preprocessed datasets found. Please upload and preprocess a dataset in Data Management.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Select Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDatasetId || ""} onValueChange={setSelectedDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset._id} value={dataset._id}>
                      {dataset.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics {selectedDatasetId && `for Dataset ${selectedDatasetId}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="precision">Precision</SelectItem>
                    <SelectItem value="recall">Recall</SelectItem>
                    <SelectItem value="f1Score">F1 Score</SelectItem>
                    <SelectItem value="mse">Mean Squared Error</SelectItem>
                    <SelectItem value="r2">R² Score</SelectItem>
                    <SelectItem value="trainingTime">Training Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                {models.length > 0 ? (
                  <LineChart data={getChartData()} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No model metrics available for this dataset
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {models.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Precision</TableHead>
                      <TableHead>Recall</TableHead>
                      <TableHead>F1 Score</TableHead>
                      <TableHead>MSE</TableHead>
                      <TableHead>R²</TableHead>
                      <TableHead>Training Time (s)</TableHead>
                      <TableHead>Trained At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model, index) => (
                      <TableRow key={`${model.name}-${index}`}>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>{model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : '-'}</TableCell>
                        <TableCell>{model.precision ? `${(model.precision * 100).toFixed(2)}%` : '-'}</TableCell>
                        <TableCell>{model.recall ? `${(model.recall * 100).toFixed(2)}%` : '-'}</TableCell>
                        <TableCell>{model.f1Score ? `${(model.f1Score * 100).toFixed(2)}%` : '-'}</TableCell>
                        <TableCell>{model.mse !== null && model.mse !== undefined ? model.mse.toFixed(4) : '-'}</TableCell>
                        <TableCell>{model.r2 !== null && model.r2 !== undefined ? model.r2.toFixed(4) : '-'}</TableCell>
                        <TableCell>{model.trainingTime.toFixed(2)}s</TableCell>
                        <TableCell>{new Date(model.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No models have been trained yet for this dataset. Train a model to see comparison metrics.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}