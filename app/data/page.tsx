"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Eye, Brain, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Dataset {
  _id: string;
  filename: string;
  dataset_description: string;
  is_preprocessing_done: boolean;
  start_preprocessing: boolean;
}

interface PreprocessingRecommendations {
  fill_empty_rows_using: "mean" | "median" | "mode" | "none";
  remove_duplicate: boolean;
  standardization_necessary: boolean;
  normalization_necessary: boolean;
  test_dataset_percentage: number;
  increase_the_size_of_dataset: boolean;
  fill_string_type_columns: boolean;
  dimensionality_reduction: boolean;
  remove_highly_correlated_columns: boolean;
}

export default function DataManagement() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PreprocessingRecommendations | null>(null);
  const [editedRecommendations, setEditedRecommendations] = useState<PreprocessingRecommendations | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [userGoal, setUserGoal] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUserDatasets = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);
      const userData = await response.json();
      setMongoUserId(userData.user_id);

      const datasetIds = userData.dataset_ids || [];
      if (datasetIds.length === 0) {
        setDatasets([]);
        return;
      }

      const datasetsPromises = datasetIds.map(async (id: string) => {
        const response = await fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`);
        if (!response.ok) return null;
        return response.json();
      });

      const datasetsData = (await Promise.all(datasetsPromises)).filter((data) => data !== null);
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
      const interval = setInterval(fetchUserDatasets, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(file);
    } else {
      toast({ title: "Invalid file type", description: "Please upload a CSV file", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mongoUserId || !projectName || !description) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", mongoUserId);
    formData.append("project_name", projectName);
    formData.append("dataset_description", description);

    try {
      const response = await fetch("http://127.0.0.1:5000/dataset/add_dataset", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      await fetchUserDatasets();
      setSelectedFile(null);
      setProjectName("");
      setDescription("");
      toast({ title: "Success", description: "Dataset uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload dataset",
        variant: "destructive",
      });
    }
  };

  // Corrected Delete dataset function
  const handleDeleteDataset = async (datasetId: string) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete dataset ${datasetId}?`)) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/dataset/delete_dataset?dataset_id=${datasetId}&userId=${mongoUserId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete dataset");
      }

      const result = await response.json();
      // Remove dataset from state
      setDatasets((prev) => prev.filter((dataset) => dataset._id !== datasetId));
      toast({
        title: "Success",
        description: result.message || "Dataset deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete dataset",
        variant: "destructive",
      });
    }
  };

  const fetchRecommendations = async (datasetId: string) => {
    if (!userGoal || !targetColumn) {
      toast({
        title: "Missing Input",
        description: "Please provide your goal and target column",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/gemini/recommend_preprocessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dataset_id: datasetId,
          user_goal: userGoal,
          target_column: targetColumn,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const recommendations: PreprocessingRecommendations = await response.json();
      setRecommendations(recommendations);
      setEditedRecommendations({ ...recommendations });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch recommendations",
        variant: "destructive",
      });
    }
  };

  const applyRecommendations = async () => {
    if (!selectedDatasetId || !editedRecommendations) return;

    try {
      const updateData = {
        dataset_id: selectedDatasetId,
        dataset_fields: {
          fill_empty_rows_using: editedRecommendations.fill_empty_rows_using,
          remove_duplicate: editedRecommendations.remove_duplicate,
          standardization_necessary: editedRecommendations.standardization_necessary,
          normalization_necessary: editedRecommendations.normalization_necessary,
          test_dataset_percentage: editedRecommendations.test_dataset_percentage,
          increase_the_size_of_dataset: editedRecommendations.increase_the_size_of_dataset,
          fill_string_type_columns: editedRecommendations.fill_string_type_columns,
          dimensionality_reduction: editedRecommendations.dimensionality_reduction,
          remove_highly_correlated_columns: editedRecommendations.remove_highly_correlated_columns,
          start_preprocessing: true,
          Is_preprocessing_form_filled: true,
          target_column: targetColumn,
          what_user_wants_to_do: userGoal,
        },
      };

      const response = await fetch(`http://127.0.0.1:5000/dataset/update_dataset`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to apply recommendations");

      await fetchUserDatasets();
      setIsDialogOpen(false);
      setRecommendations(null);
      setEditedRecommendations(null);
      setUserGoal("");
      setTargetColumn("");
      toast({
        title: "Success",
        description: "Preprocessing started successfully (only null handling and duplicate removal applied)",
      });
    } catch (error) {
      console.error("Error applying recommendations:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start preprocessing",
        variant: "destructive",
      });
    }
  };

  const handleRecommendationChange = (field: keyof PreprocessingRecommendations, value: any) => {
    if (editedRecommendations) {
      setEditedRecommendations({ ...editedRecommendations, [field]: value });
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
            <Input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center space-x-4">
              <Input type="file" onChange={handleFileChange} accept=".csv" />
              <Button onClick={handleUpload} disabled={!selectedFile || !projectName || !mongoUserId}>
                <Upload className="mr-2 h-4 w-4" /> Upload
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset._id}>
                    <TableCell>{dataset.filename}</TableCell>
                    <TableCell className="w-96">{dataset.dataset_description || "No description"}</TableCell>
                    <TableCell>
                      {dataset.is_preprocessing_done
                        ? "✅ Complete"
                        : dataset.start_preprocessing
                        ? "⏳ In Progress"
                        : "⚪ Not Started"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog
                          open={isDialogOpen && selectedDatasetId === dataset._id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setRecommendations(null);
                              setEditedRecommendations(null);
                              setUserGoal("");
                              setTargetColumn("");
                              setSelectedDatasetId(null);
                            }
                            setIsDialogOpen(open);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={dataset.is_preprocessing_done || dataset.start_preprocessing}
                              onClick={() => setSelectedDatasetId(dataset._id)}
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Preprocessing Recommendations</DialogTitle>
                              <DialogDescription>
                                Provide your goal and target column to get recommendations. Note: Only null handling and duplicate removal can be applied currently.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userGoal" className="text-right">Goal</Label>
                                <Input
                                  id="userGoal"
                                  value={userGoal}
                                  onChange={(e) => setUserGoal(e.target.value)}
                                  placeholder="e.g., predict sales revenue"
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="targetColumn" className="text-right">Target Column</Label>
                                <Input
                                  id="targetColumn"
                                  value={targetColumn}
                                  onChange={(e) => setTargetColumn(e.target.value)}
                                  placeholder="e.g., sales"
                                  className="col-span-3"
                                />
                              </div>
                              {editedRecommendations && (
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Fill Empty Rows</Label>
                                    <Select
                                      value={editedRecommendations.fill_empty_rows_using}
                                      onValueChange={(value) =>
                                        handleRecommendationChange(
                                          "fill_empty_rows_using",
                                          value as "mean" | "median" | "mode" | "none"
                                        )
                                      }
                                    >
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mean">Mean</SelectItem>
                                        <SelectItem value="median">Median</SelectItem>
                                        <SelectItem value="mode">Mode</SelectItem>
                                        <SelectItem value="none">None</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Remove Duplicates</Label>
                                    <Checkbox
                                      checked={editedRecommendations.remove_duplicate}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("remove_duplicate", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Standardization</Label>
                                    <Checkbox
                                      checked={editedRecommendations.standardization_necessary}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("standardization_necessary", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Normalization</Label>
                                    <Checkbox
                                      checked={editedRecommendations.normalization_necessary}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("normalization_necessary", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Test Split (%)</Label>
                                    <Input
                                      type="number"
                                      value={editedRecommendations.test_dataset_percentage}
                                      onChange={(e) =>
                                        handleRecommendationChange("test_dataset_percentage", Number(e.target.value))
                                      }
                                      className="col-span-3"
                                      min={0}
                                      max={100}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Increase Dataset Size</Label>
                                    <Checkbox
                                      checked={editedRecommendations.increase_the_size_of_dataset}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("increase_the_size_of_dataset", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Fill String Columns</Label>
                                    <Checkbox
                                      checked={editedRecommendations.fill_string_type_columns}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("fill_string_type_columns", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Dimensionality Reduction</Label>
                                    <Checkbox
                                      checked={editedRecommendations.dimensionality_reduction}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("dimensionality_reduction", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Remove Correlated Columns</Label>
                                    <Checkbox
                                      checked={editedRecommendations.remove_highly_correlated_columns}
                                      onCheckedChange={(checked) =>
                                        handleRecommendationChange("remove_highly_correlated_columns", checked)
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => fetchRecommendations(dataset._id)}
                                disabled={!userGoal || !targetColumn}
                              >
                                Get Recommendations
                              </Button>
                              {editedRecommendations && (
                                <Button onClick={applyRecommendations}>Start Preprocessing</Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDataset(dataset._id)}
                        >
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
  );
}