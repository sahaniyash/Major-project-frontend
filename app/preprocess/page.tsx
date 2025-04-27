"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

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
  remove_highly_correlated_columns: boolean;
  dimensionality_reduction: boolean;
  fill_string_type_columns: boolean;
  fill_empty_rows_using: string;
  target_column: string;
  what_user_wants_to_do: string;
}

export default function Preprocess() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchUserDatasets = async () => {
      if (!user) {
        console.log("User not loaded yet");
        return;
      }

      console.log("Fetching user data for Clerk ID:", user.id);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
        }

        const userData = await response.json();
        console.log("User data received:", userData);
        if (!userData.user_id) {
          throw new Error("MongoDB user_id not found in user data");
        }
        setMongoUserId(userData.user_id);

        const datasetIds = userData.dataset_ids || [];
        console.log("Extracted dataset IDs:", datasetIds);

        const datasetsPromises = datasetIds.map(async (id: string) => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dataset/get_dataset?dataset_id=${id}`);
          if (!response.ok) {
            console.error(`Failed to fetch dataset ${id}`);
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
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserDatasets();
    }
  }, [user]);

  const getPreprocessingStatus = (dataset: Dataset) => {
    if (dataset.is_preprocessing_done) {
      return {
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        text: "Preprocessing completed",
        description: "Dataset has been successfully preprocessed"
      };
    } else if (dataset.start_preprocessing) {
      return {
        icon: <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />,
        text: "Preprocessing in progress",
        description: "Your dataset is being preprocessed"
      };
    } else if (dataset.Is_preprocessing_form_filled) {
      return {
        icon: <Clock className="h-6 w-6 text-blue-500" />,
        text: "Preprocessing scheduled",
        description: "Waiting to start preprocessing"
      };
    } else {
      return {
        icon: <AlertCircle className="h-6 w-6 text-gray-500" />,
        text: "Not preprocessed",
        description: "Configure preprocessing in Data Management"
      };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Preprocessing Status</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dataset Preprocessing Status</CardTitle>
          <CardDescription>View the preprocessing status of your datasets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading datasets...</div>
            ) : datasets.length === 0 ? (
              <div className="text-center text-muted-foreground">No datasets available</div>
            ) : (
              datasets.map((dataset) => {
                const status = getPreprocessingStatus(dataset);
                return (
                  <Card key={dataset._id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{status.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{dataset.filename}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{dataset.dataset_description}</p>
                        <div className="space-y-1">
                          <p className="font-medium">{status.text}</p>
                          <p className="text-sm text-muted-foreground">{status.description}</p>
                          {dataset.is_preprocessing_done && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm">Applied preprocessing:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {dataset.test_dataset_percentage > 0 && (
                                  <li>Test dataset split: {dataset.test_dataset_percentage}%</li>
                                )}
                                {dataset.remove_duplicate && <li>Removed duplicate entries</li>}
                                {dataset.scaling_and_normalization && <li>Applied scaling and normalization</li>}
                                {dataset.increase_the_size_of_dataset && <li>Increased dataset size</li>}
                                {dataset.remove_highly_correlated_columns && <li>Removed highly correlated columns</li>}
                                {dataset.dimensionality_reduction && <li>Performed dimensionality reduction</li>}
                                {dataset.fill_string_type_columns && <li>Filled string type columns</li>}
                                {dataset.fill_empty_rows_using && <li>Filled empty rows using {dataset.fill_empty_rows_using}</li>}
                                {dataset.target_column && <li>Target column: {dataset.target_column}</li>}
                                {dataset.what_user_wants_to_do && <li>User goal: {dataset.what_user_wants_to_do}</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}