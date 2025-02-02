import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Upload } from "lucide-react"
import { SignOutButton, useUser } from "@clerk/nextjs"

export default function Dashboard() {
  const user = useUser();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hello, {user.user?.firstName || "User"}</p>
            <SignOutButton/>
          </div>
          <Button variant="destructive" size="sm">
            <SignOutButton />
          </Button>
          <SignOutButton/>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Search className="w-8 h-8" />
              <div>
                <CardTitle>Search Data</CardTitle>
                <Input placeholder="Search your data..." className="mt-2" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Upload className="w-8 h-8" />
              <div>
                <CardTitle>Upload Data</CardTitle>
                <Button className="mt-2 w-full">Upload File</Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">Analyzed sales data - 2 hours ago</p>
                <p className="text-sm">Updated customer demographics - 1 day ago</p>
                <p className="text-sm">Generated monthly report - 3 days ago</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Datasets</span>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update</span>
                  <span className="font-semibold">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Used</span>
                  <span className="font-semibold">45%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

