"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Trash2, Eye } from "lucide-react"

const sampleDatasets = [
  { id: 1, name: "Customer Churn", rows: 5000, columns: 20, lastModified: "2023-06-15" },
  { id: 2, name: "Sales Prediction", rows: 10000, columns: 15, lastModified: "2023-06-10" },
  { id: 3, name: "Customer Segmentation", rows: 8000, columns: 25, lastModified: "2023-06-05" },
]

export default function DataManagement() {
  const [datasets, setDatasets] = useState(sampleDatasets)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      // Here you would typically send the file to your backend
      console.log("Uploading file:", selectedFile.name)
      // For demonstration, we'll just add it to the list
      setDatasets([
        ...datasets,
        {
          id: datasets.length + 1,
          name: selectedFile.name,
          rows: Math.floor(Math.random() * 10000),
          columns: Math.floor(Math.random() * 30),
          lastModified: new Date().toISOString().split("T")[0],
        },
      ])
      setSelectedFile(null)
    }
  }

  const handleDelete = (id: number) => {
    setDatasets(datasets.filter((dataset) => dataset.id !== id))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Dataset</CardTitle>
          <CardDescription>Select a CSV or Excel file to upload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input type="file" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Datasets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell>{dataset.name}</TableCell>
                  <TableCell>{dataset.rows}</TableCell>
                  <TableCell>{dataset.columns}</TableCell>
                  <TableCell>{dataset.lastModified}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dataset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

