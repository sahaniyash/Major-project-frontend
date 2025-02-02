"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart } from "@/components/charts"

const modelData = [
  { name: "Random Forest", accuracy: 0.92, precision: 0.9, recall: 0.94, f1Score: 0.92 },
  { name: "Logistic Regression", accuracy: 0.88, precision: 0.87, recall: 0.89, f1Score: 0.88 },
  { name: "SVM", accuracy: 0.9, precision: 0.89, recall: 0.91, f1Score: 0.9 },
  { name: "Neural Network", accuracy: 0.93, precision: 0.92, recall: 0.94, f1Score: 0.93 },
]

export default function ModelComparison() {
  const [selectedMetric, setSelectedMetric] = useState("accuracy")

  const chartData = modelData.map((model) => ({
    name: model.name,
    value: model[selectedMetric as keyof typeof model],
  }))

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
              </SelectContent>
            </Select>
          </div>
          <div className="h-[300px]">
            <BarChart data={chartData} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>F1 Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelData.map((model) => (
                <TableRow key={model.name}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.accuracy.toFixed(2)}</TableCell>
                  <TableCell>{model.precision.toFixed(2)}</TableCell>
                  <TableCell>{model.recall.toFixed(2)}</TableCell>
                  <TableCell>{model.f1Score.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

