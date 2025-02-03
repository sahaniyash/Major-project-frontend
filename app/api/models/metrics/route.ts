import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { ModelMetrics } from '../ModelMetrics'

export async function GET() {
  try {
    await dbConnect()
    const metrics = await ModelMetrics.find({})
      .sort({ timestamp: -1 })
      .select('name accuracy precision recall f1Score trainingTime timestamp')
      .lean()

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching model metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model metrics' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect()
    const body = await req.json()
    
    const metrics = await ModelMetrics.create({
      name: body.name,
      modelType: body.modelType,
      accuracy: body.accuracy,
      precision: body.precision,
      recall: body.recall,
      f1Score: body.f1Score,
      trainingTime: body.trainingTime,
      parameters: body.parameters,
      userId: body.userId,
      datasetName: body.datasetName
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error storing model metrics:', error)
    return NextResponse.json(
      { error: 'Failed to store model metrics' },
      { status: 500 }
    )
  }
}