"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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

const mainNavItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Data Management", href: "/data", icon: Database },
  { name: "Preprocessing", href: "/preprocess", icon: BarChart2 },
  { name: "Model Training", href: "/model", icon: Brain },
]

const analysisNavItems = [
  { name: "Model Comparison", href: "/model-comparison", icon: TrendingUp },
  { name: "Graphs", href: "/graphs", icon: LineChart },
]

const recentProjects = [
  { name: "Customer Churn Analysis", href: "/projects/churn", date: "2 hours ago" },
  { name: "Sales Prediction", href: "/projects/sales", date: "5 hours ago" },
  { name: "Market Segmentation", href: "/projects/segment", date: "1 day ago" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

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
            {!isCollapsed && (
              <div>
                <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground">
                  Recent Projects
                </h2>
                <nav className="space-y-1">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.name}
                      href={project.href}
                      className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <History className="h-4 w-4 mr-3" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {project.date}
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

