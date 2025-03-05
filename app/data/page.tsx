"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Trash2, Eye, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Dataset {
  _id: string;
  filename: string;
  dataset_description: string;
  is_preprocessing_done: boolean;
  Is_preprocessing_form_filled: boolean;
  start_preprocessing: boolean;
  test_dataset_percentage: number;
  remove_duplicate: boolean;
  scaling_and_normalization: boolean;
  increase_the_size_of_dataset: boolean;
}

export default function DataManagement() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);

  const fetchUserDatasets = async () => {
    if (!user) {
      console.log("User not loaded yet");
      return;
    }

    console.log("Fetching user data for Clerk ID:", user.id);
    try {
      const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
        credentials: "include",
      });
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
      }

      const userData = await response.json();
      console.log("User data received:", userData);
      if (!userData.user_id) {  // Match backend key
        throw new Error("MongoDB user_id not found in user data");
      }
      setMongoUserId(userData.user_id);

      // Use dataset_ids as an array of strings
      const datasetIds = userData.dataset_ids || [];
      console.log("Extracted dataset IDs:", datasetIds);

      if (datasetIds.length === 0) {
        console.log("No dataset IDs found to fetch.");
        setDatasets([]);
        return;
      }

      const datasetsPromises = datasetIds.map(async (id: string) => {
        const response = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch dataset ${id}: ${response.status} - ${errorText}`);
          return null;
        }
        return response.json();
      });

      const datasetsData = (await Promise.all(datasetsPromises)).filter((data) => data !== null);
      console.log("Fetched datasets:", datasetsData);
      setDatasets(datasetsData);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch datasets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserDatasets();
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      console.log("Selected file:", file.name);
    }
  };

  const handleUpload = async () => {
    console.log("handleUpload called");
    if (!selectedFile || !mongoUserId || !projectName) {
      console.log("Missing:", { selectedFile, mongoUserId, projectName });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", mongoUserId);
    formData.append("project_name", projectName);

    try {
      console.log("Uploading:", { user_id: mongoUserId, project_name: projectName, file: selectedFile.name });

      const response = await fetch("http://127.0.0.1:5000/dataset/add_dataset", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload response:", data);
      await fetchUserDatasets(); // Re-fetch to update table
      setSelectedFile(null);
      setProjectName("");

      toast({
        title: "Success",
        description: "Dataset uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload dataset",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Dataset</CardTitle>
          <CardDescription>Select a CSV file to upload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="flex items-center space-x-4">
              <Input type="file" onChange={handleFileChange} accept=".csv" />
              <Button onClick={handleUpload} disabled={!selectedFile || !projectName || !mongoUserId}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Preprocessing Status</TableHead>
                  <TableHead>Test Split</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset._id}>
                    <TableCell>{dataset.filename}</TableCell>
                    <TableCell>{dataset.dataset_description || "No description"}</TableCell>
                    <TableCell>
                      {dataset.is_preprocessing_done
                        ? "✅ Complete"
                        : dataset.start_preprocessing
                        ? "⏳ In Progress"
                        : "⚪ Not Started"}
                    </TableCell>
                    <TableCell>{dataset.test_dataset_percentage}%</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" disabled={dataset.start_preprocessing}>
                          <Settings className="h-4 w-4" />
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
  );
}