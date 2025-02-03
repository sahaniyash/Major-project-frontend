import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { TrainingJob, ModelMetrics } from '../ModelMetrics' 

export async function POST(req: Request) {
  try {
    await dbConnect()
    const body = await req.json()
    
    const job = await TrainingJob.create({
      modelType: body.modelType,
      status: 'queued',
      datasetId: body.datasetId,
      userId: body.userId,
      parameters: body.hyperparameters
    })

    // Here you would typically start your training process
    // This could be a background job, API call to ML service, etc.
    startTraining(job._id)

    return NextResponse.json({
      message: 'Training started successfully',
      jobId: job._id
    })
  } catch (error) {
    console.error('Error starting model training:', error)
    return NextResponse.json(
      { error: 'Failed to start model training' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job ID' },
        { status: 400 }
      )
    }

    const job = await TrainingJob.findById(jobId).lean()

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching training status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training status' },
      { status: 500 }
    )
  }
}

async function startTraining(jobId: string) {
  // Implement your training logic here
  // This could be a call to a Python backend, ML service, etc.
  // For now, we'll just simulate training
  setTimeout(async () => {
    try {
      await dbConnect()
      const metrics = await ModelMetrics.create({
        name: `Model_${jobId}`,
        modelType: 'test',
        accuracy: Math.random(),
        precision: Math.random(),
        recall: Math.random(),
        f1Score: Math.random(),
        trainingTime: Math.random() * 100,
        status: 'completed'
      })

      await TrainingJob.findByIdAndUpdate(jobId, {
        status: 'completed',
        completedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating training status:', error)
    }
  }, 5000)
}