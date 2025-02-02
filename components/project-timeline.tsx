import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const timelineData = [
  { id: 1, title: "Customer Churn Prediction", date: "2023-07-15", status: "Completed" },
  { id: 2, title: "Sales Forecast", date: "2023-07-10", status: "In Progress" },
  { id: 3, title: "Sentiment Analysis", date: "2023-07-05", status: "Planned" },
]

export function ProjectTimeline() {
  return (
    <div className="space-y-4">
      {timelineData.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex justify-between items-center p-4">
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.date}</p>
            </div>
            <Badge
              variant={
                item.status === "Completed" ? "default" : item.status === "In Progress" ? "secondary" : "outline"
              }
            >
              {item.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

