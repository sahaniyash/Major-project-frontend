"use client"

import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Database, Brain, TrendingUp } from "lucide-react"

// Lazy load chart components
const LineChart = lazy(() => import("@/components/charts").then(mod => ({ default: mod.LineChart })))

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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 30000 // 30 seconds cache

  // Memoize chart data calculation
  const chartData = useMemo(() => {
    return models.map((model) => ({
      name: model.name,
      value: (model[selectedMetric as keyof ModelMetrics] as number) || 0,
    }))
  }, [models, selectedMetric])

  const fetchUserDatasets = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/get-user?userId=${user.id}`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error(await response.text())

      const userData = await response.json()
      const datasetIds = userData.dataset_ids || []

      // Check if cache is still valid
      const now = Date.now()
      if (now - lastFetchTime < CACHE_DURATION && datasets.length > 0) {
        return
      }

      // Batch fetch datasets
      const batchSize = 5
      const batchedDatasets = []
      for (let i = 0; i < datasetIds.length; i += batchSize) {
        const batch = datasetIds.slice(i, i + batchSize)
        const batchPromises = batch.map(async (id: string) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dataset/get_dataset?dataset_id=${id}`)
          if (!res.ok) return null
          const data = await res.json()
          return { _id: data._id, filename: data.filename, datasetId: data._id }
        })
        const results = await Promise.all(batchPromises)
        batchedDatasets.push(...results.filter(d => d !== null))
      }

      setDatasets(batchedDatasets)
      setLastFetchTime(now)
    } catch (error) {
      console.error("Error fetching datasets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch datasets",
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading model comparison data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Comparison</h1>
          <p className="text-muted-foreground mt-2">Compare performance metrics across different models</p>
        </div>
      </div>

      {datasets.length === 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>No Datasets Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 text-muted-foreground mb-4">
                <Database className="w-full h-full" />
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                No preprocessed datasets found. Please upload and preprocess a dataset in Data Management first.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Select Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDatasetId || ""} onValueChange={setSelectedDatasetId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a dataset to view metrics" />
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

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Performance Metrics</CardTitle>
                {selectedDatasetId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing metrics for selected dataset
                  </p>
                )}
              </div>
              <div className="w-[200px]">
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
            </CardHeader>
            <CardContent>
              <div className="h-[400px] relative">
                {models.length > 0 ? (
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  }>
                    <LineChart data={chartData} />
                  </Suspense>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 text-muted-foreground mb-4">
                        <Brain className="w-full h-full" />
                      </div>
                      <p className="text-muted-foreground">
                        No model metrics available for this dataset
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Train a model to see comparison metrics
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardContent className="px-0">
                {models.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Model</TableHead>
                          <TableHead className="font-semibold">Accuracy</TableHead>
                          <TableHead className="font-semibold">Precision</TableHead>
                          <TableHead className="font-semibold">Recall</TableHead>
                          <TableHead className="font-semibold">F1 Score</TableHead>
                          <TableHead className="font-semibold">MSE</TableHead>
                          <TableHead className="font-semibold">R²</TableHead>
                          <TableHead className="font-semibold">Training Time</TableHead>
                          <TableHead className="font-semibold">Trained At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((model, index) => (
                          <TableRow key={`${model.name}-${index}`} className="hover:bg-muted/50">
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
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 text-muted-foreground mb-4">
                      <TrendingUp className="w-full h-full" />
                    </div>
                    <p className="text-muted-foreground">
                      No models have been trained yet for this dataset
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Train a model to see detailed comparison metrics
                    </p>
                  </div>
                )}
              </CardContent>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  )
}