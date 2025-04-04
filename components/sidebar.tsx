"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@clerk/nextjs"
import {
  Home,
  BarChart2,
  Database,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  LineChart,
  History,
  Clock,
} from "lucide-react"

interface Dataset {
  _id: string;
  filename: string;
  timestamp: string;
}

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Data Management", href: "/data", icon: Database },
  { name: "Preprocessing Status", href: "/preprocess", icon: BarChart2 },
  { name: "Model Training", href: "/model", icon: Brain },
]

const analysisNavItems = [
  { name: "Model Comparison", href: "/model-comparison", icon: TrendingUp },
  { name: "Graphs", href: "/graphs", icon: LineChart },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useUser()
  const [recentDatasets, setRecentDatasets] = useState<Dataset[]>([])

  useEffect(() => {
    const fetchRecentDatasets = async () => {
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
        
        // Sort datasets by timestamp
        const sortedDatasets = datasetsData
          .filter(dataset => dataset && dataset.timestamp) // Filter out any invalid datasets
          .sort((a, b) => {
            const timestampA = new Date(a.timestamp).getTime();
            const timestampB = new Date(b.timestamp).getTime();
            return timestampB - timestampA; // Sort in descending order (newest first)
          })
          .slice(0, 3); // Get only the 3 most recent datasets
        
        setRecentDatasets(sortedDatasets);
      } catch (error) {
        console.error("Error fetching recent datasets:", error);
      }
    };

    fetchRecentDatasets();
  }, [user]);

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // Check if we have a valid date
      if (isNaN(date.getTime())) {
        return 'Date unavailable';
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Handle future dates
      if (diffInSeconds < 0) {
        return 'just now';
      }
      
      // Time intervals in seconds
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
      };

      // Find the appropriate interval
      if (diffInSeconds < intervals.minute) {
        return 'just now';
      } else if (diffInSeconds < intervals.hour) {
        const minutes = Math.floor(diffInSeconds / intervals.minute);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInSeconds < intervals.day) {
        const hours = Math.floor(diffInSeconds / intervals.hour);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInSeconds < intervals.week) {
        const days = Math.floor(diffInSeconds / intervals.day);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else if (diffInSeconds < intervals.month) {
        const weeks = Math.floor(diffInSeconds / intervals.week);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffInSeconds < intervals.year) {
        const months = Math.floor(diffInSeconds / intervals.month);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      } else {
        const years = Math.floor(diffInSeconds / intervals.year);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && <h1 className="text-xl font-bold">AI Analyst</h1>}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-3 py-2">
          <div className="space-y-4">
            <div>
              <h2
                className={cn(
                  "mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground",
                  isCollapsed && "sr-only",
                )}
              >
                Main
              </h2>
              <nav className="space-y-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      pathname === item.href
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h2
                className={cn(
                  "mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground",
                  isCollapsed && "sr-only",
                )}
              >
                Analysis
              </h2>
              <nav className="space-y-1">
                {analysisNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      pathname === item.href
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
            {!isCollapsed && recentDatasets.length > 0 && (
              <div>
                <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
                  Recent Projects
                </h2>
                <nav className="space-y-1">
                  {recentDatasets.map((dataset) => (
                    <Link
                      key={dataset._id}
                      href={`/data?dataset=${dataset._id}`}
                      className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <History className="h-4 w-4 mr-3" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate">{dataset.filename}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(dataset.timestamp)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
          )}
        >
          <Settings className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}

