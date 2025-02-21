"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Trash2, Eye } from "lucide-react"

interface Dataset {
  id: number;
  name: string;
  rows: number;
  columns: number;
  lastModified: string;
  userId: string;
}

export default function DataManagement() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserDatasets = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/datasets?userId=${user?.id}`);
        const data = await response.json();
        setDatasets(data);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserDatasets();
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (selectedFile && user) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', user.id);

        // Replace with your actual API endpoint
        const response = await fetch('http://127.0.0.1:5000/dataset/add_dataset', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const newDataset = await response.json();
        setDatasets([...datasets, newDataset]);
        setSelectedFile(null);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setDatasets(datasets.filter((dataset) => dataset.id !== id));
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  }

  if (!user) {
    return <div>Please sign in to view your datasets.</div>;
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
          {isLoading ? (
            <div>Loading your datasets...</div>
          ) : datasets.length === 0 ? (
            <div>No datasets found. Upload your first dataset above.</div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

