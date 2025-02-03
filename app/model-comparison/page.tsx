"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart } from "@/components/charts"
import { useToast } from "@/components/ui/use-toast"

interface ModelMetrics {
  name: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingTime: number
  timestamp: string
}

export default function ModelComparison() {
  const { toast } = useToast()
  const [selectedMetric, setSelectedMetric] = useState("accuracy")
  const [models, setModels] = useState<ModelMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchModelMetrics()
  }, [])

  const fetchModelMetrics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/model/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setModels(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch model metrics",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getChartData = () => {
    return models.map((model) => ({
      name: model.name,
      value: model[selectedMetric as keyof typeof model] as number,
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Model Comparison</h1>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
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
                <SelectItem value="trainingTime">Training Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[300px]">
            {models.length > 0 ? (
              <BarChart data={getChartData()} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No model metrics available
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
                  <TableHead>Training Time (s)</TableHead>
                  <TableHead>Trained At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.name}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{(model.accuracy * 100).toFixed(2)}%</TableCell>
                    <TableCell>{(model.precision * 100).toFixed(2)}%</TableCell>
                    <TableCell>{(model.recall * 100).toFixed(2)}%</TableCell>
                    <TableCell>{(model.f1Score * 100).toFixed(2)}%</TableCell>
                    <TableCell>{model.trainingTime.toFixed(2)}s</TableCell>
                    <TableCell>{new Date(model.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No models have been trained yet. Train a model to see comparison metrics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}