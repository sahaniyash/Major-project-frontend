import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: string
  name: string
  type: string
  accuracy?: number
  createdAt: Date
}

interface ProjectTimelineProps {
  projects: Project[]
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="flex justify-between items-center p-4">
            <div>
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge
              variant={
                project.accuracy ? "default" : "outline"
              }
            >
              {project.accuracy ? `${(project.accuracy * 100).toFixed(1)}% Accuracy` : "In Progress"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}