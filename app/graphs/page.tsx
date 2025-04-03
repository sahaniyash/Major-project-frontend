"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, Line, Scatter, Pie, Doughnut, Radar } from "react-chartjs-2";
import "chart.js/auto";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface Dataset {
  _id: string;
  filename: string;
  is_preprocessing_done: boolean;
}

interface ChartConfig {
  chartType: string;
  xAxis: string;
  yAxis: string;
  data: {
    labels?: string[];
    datasets: {
      label: string;
      data: number[] | { x: number; y: number }[];
      backgroundColor: string | string[];
      borderColor: string | string[];
      borderWidth: number;
      tension?: number;
    }[];
  };
}

export default function Graphs() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>("scatter");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [colorScheme, setColorScheme] = useState<string>("default");
  const [currentChart, setCurrentChart] = useState<ChartConfig | null>(null);

  const colorSchemes = {
    default: {
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
    },
    blue: {
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      borderColor: "rgba(54, 162, 235, 1)",
    },
    red: {
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
    },
    green: {
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
    },
    purple: {
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      borderColor: "rgba(153, 102, 255, 1)",
    },
  };

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user) return;
      try {
        const response = await fetch(`http://127.0.0.1:5000/user/get-user?userId=${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        
        const userData = await response.json();
        const datasetIds = userData.dataset_ids || [];
        
        const datasetsPromises = datasetIds.map((id: string) =>
          fetch(`http://127.0.0.1:5000/dataset/get_dataset?dataset_id=${id}`).then(res => res.json())
        );
        const datasetsData = await Promise.all(datasetsPromises);
        setDatasets(datasetsData);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive",
        });
      }
    };
    fetchDatasets();
  }, [user]);

  useEffect(() => {
    const fetchColumnNames = async () => {
      if (!selectedDatasetId) {
        setColumnNames([]);
        return;
      }
      try {
        const response = await fetch(`http://127.0.0.1:5000/dataset/get_column_names?dataset_id=${selectedDatasetId}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Failed to fetch column names: ${await response.text()}`);
        const data = await response.json();
        setColumnNames(data.column_names || []);
      } catch (error) {
        console.error("Error fetching column names:", error);
        setColumnNames([]);
      }
    };
    fetchColumnNames();
  }, [selectedDatasetId]);

  const handleGenerateVisualization = async () => {
    if (!selectedDatasetId || !chartType || !xAxis || !yAxis) {
      toast({ 
        title: "Error", 
        description: "Please select all visualization options", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/dataset/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          dataset_id: selectedDatasetId, 
          chart_type: chartType, 
          x_axis: xAxis, 
          y_axis: yAxis,
          handle_categorical: true,
          chart_options: { colorScheme }
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Visualization failed");
      }
      
      const data = await response.json();
      const colors = colorSchemes[colorScheme as keyof typeof colorSchemes];

      let chartConfig: ChartConfig = {
        chartType,
        xAxis,
        yAxis,
        data: {
          labels: data.x_data,
          datasets: [{
            label: `${xAxis} vs ${yAxis}`,
            data: chartType === "scatter" && !data.is_categorical 
              ? data.x_data.map((x: number, i: number) => ({ x, y: data.y_data[i] }))
              : data.y_data,
            backgroundColor: chartType === "pie" || chartType === "doughnut"
              ? Object.values(colorSchemes).map(scheme => scheme.backgroundColor)
              : colors.backgroundColor,
            borderColor: chartType === "pie" || chartType === "doughnut"
              ? Object.values(colorSchemes).map(scheme => scheme.borderColor)
              : colors.borderColor,
            borderWidth: 1,
            tension: chartType === "line" ? 0.1 : undefined,
          }],
        },
      };

      setCurrentChart(chartConfig);
      toast({ title: "Success", description: "Chart generated successfully" });
    } catch (error) {
      console.error("Error generating visualization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate visualization",
        variant: "destructive",
      });
    }
  };

  const renderChart = (chart: ChartConfig) => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: {
          title: { display: true, text: chart.xAxis },
          grid: { display: true },
        },
        y: {
          title: { display: true, text: chart.yAxis },
          grid: { display: true },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const,
      },
    };

    switch (chart.chartType) {
      case "scatter":
        return <Scatter data={chart.data} options={options} />;
      case "bar":
        return <Bar data={chart.data} options={options} />;
      case "line":
        return <Line data={chart.data} options={options} />;
      case "pie":
        return <Pie data={chart.data} options={options} />;
      case "doughnut":
        return <Doughnut data={chart.data} options={options} />;
      case "radar":
        return <Radar data={chart.data} options={options} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Visualization</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dataset Selection</CardTitle>
          <CardDescription>Choose a dataset to visualize</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedDatasetId} value={selectedDatasetId || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.length === 0 ? (
                <SelectItem value="none" disabled>No datasets available</SelectItem>
              ) : (
                datasets.map((dataset) => (
                  <SelectItem key={dataset._id} value={dataset._id}>
                    {dataset.filename}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDatasetId && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Visualization Options</CardTitle>
              <CardDescription>Configure your chart settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label className="block mb-2">Chart Type</label>
                  <Select onValueChange={setChartType} value={chartType}>
                    <SelectTrigger><SelectValue placeholder="Select chart type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                      <SelectItem value="radar">Radar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">X-Axis</label>
                  <Select onValueChange={setXAxis} value={xAxis}>
                    <SelectTrigger><SelectValue placeholder="Select X-axis" /></SelectTrigger>
                    <SelectContent>
                      {columnNames.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Y-Axis</label>
                  <Select onValueChange={setYAxis} value={yAxis}>
                    <SelectTrigger><SelectValue placeholder="Select Y-axis" /></SelectTrigger>
                    <SelectContent>
                      {columnNames.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Color Scheme</label>
                  <Select onValueChange={setColorScheme} value={colorScheme}>
                    <SelectTrigger><SelectValue placeholder="Select color scheme" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerateVisualization}>Generate Visualization</Button>
              </div>
            </CardContent>
          </Card>

          {currentChart && (
            <Card>
              <CardHeader>
                <CardTitle>{`${currentChart.xAxis} vs ${currentChart.yAxis}`}</CardTitle>
                <CardDescription>{`${currentChart.chartType.charAt(0).toUpperCase() + currentChart.chartType.slice(1)} Chart`}</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "400px" }}>
                  {renderChart(currentChart)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}