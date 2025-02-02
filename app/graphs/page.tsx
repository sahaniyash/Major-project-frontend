"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, BarChart, LineChart, ScatterPlot, HeatMap } from "@/components/charts"

const sampleData = {
  timeSeries: [
    { date: "2023-01", value: 30 },
    { date: "2023-02", value: 45 },
    { date: "2023-03", value: 60 },
    { date: "2023-04", value: 40 },
    { date: "2023-05", value: 70 },
    { date: "2023-06", value: 55 },
  ],
  categorical: [
    { category: "A", value: 30 },
    { category: "B", value: 45 },
    { category: "C", value: 60 },
    { category: "D", value: 40 },
    { category: "E", value: 70 },
  ],
  scatter: [
    { x: 10, y: 30, z: 15 },
    { x: 20, y: 50, z: 25 },
    { x: 30, y: 40, z: 20 },
    { x: 40, y: 60, z: 30 },
    { x: 50, y: 70, z: 35 },
  ],
  heatmap: [
    { x: "A", y: "1", value: 10 },
    { x: "B", y: "1", value: 20 },
    { x: "C", y: "1", value: 30 },
    { x: "A", y: "2", value: 40 },
    { x: "B", y: "2", value: 50 },
    { x: "C", y: "2", value: 60 },
    { x: "A", y: "3", value: 70 },
    { x: "B", y: "3", value: 80 },
    { x: "C", y: "3", value: 90 },
  ],
}

export default function Graphs() {
  const [selectedDataType, setSelectedDataType] = useState("timeSeries")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Graph Types for AI Data Analysis</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Data Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDataType} onValueChange={setSelectedDataType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeSeries">Time Series</SelectItem>
              <SelectItem value="categorical">Categorical</SelectItem>
              <SelectItem value="scatter">Scatter</SelectItem>
              <SelectItem value="heatmap">Heatmap</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="area">
        <TabsList>
          <TabsTrigger value="area">Area Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
        </TabsList>
        <TabsContent value="area">
          <Card>
            <CardHeader>
              <CardTitle>Area Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <AreaChart data={sampleData[selectedDataType as keyof typeof sampleData]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Bar Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart data={sampleData[selectedDataType as keyof typeof sampleData]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Line Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart data={sampleData[selectedDataType as keyof typeof sampleData]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scatter">
          <Card>
            <CardHeader>
              <CardTitle>Scatter Plot</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ScatterPlot data={sampleData.scatter} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Heat Map</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <HeatMap data={sampleData.heatmap} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

