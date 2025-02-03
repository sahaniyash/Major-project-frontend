import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Here you would typically fetch from your database
    // For now, returning mock data
    const metrics = [
      {
        name: "Random Forest",
        accuracy: 0.92,
        precision: 0.90,
        recall: 0.94,
        f1Score: 0.92,
        trainingTime: 45.2,
        timestamp: new Date().toISOString()
      },
      {
        name: "Neural Network",
        accuracy: 0.89,
        precision: 0.88,
        recall: 0.90,
        f1Score: 0.89,
        trainingTime: 120.5,
        timestamp: new Date().toISOString()
      }
    ]

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching model metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model metrics' },
      { status: 500 }
    )
  }
}