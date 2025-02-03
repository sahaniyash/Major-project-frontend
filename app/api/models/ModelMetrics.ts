import mongoose from 'mongoose'

const datasetSchema = new mongoose.Schema({
  name: String,
  fileName: String,
  columns: [String],
  rowCount: Number,
  columnTypes: {
    type: Map,
    of: String
  },
  summary: {
    missingValues: {
      type: Map,
      of: Number
    },
    uniqueValues: {
      type: Map,
      of: Number
    }
  },
  targetColumn: String,
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  userId: String
})

const modelMetricsSchema = new mongoose.Schema({
  name: String,
  modelType: String,
  accuracy: Number,
  precision: Number,
  recall: Number,
  f1Score: Number,
  trainingTime: Number,
  timestamp: { type: Date, default: Date.now },
  parameters: Object,
  userId: String,
  datasetName: String,
  status: { type: String, default: 'completed' }
})

const trainingJobSchema = new mongoose.Schema({
  modelType: String,
  status: String,
  progress: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  datasetId: String,
  userId: String,
  parameters: Object,
  error: String
})

// Check if models are already defined to prevent OverwriteModelError
export const Dataset = mongoose.models.Dataset || mongoose.model('Dataset', datasetSchema)
export const ModelMetrics = mongoose.models.ModelMetrics || mongoose.model('ModelMetrics', modelMetricsSchema)
export const TrainingJob = mongoose.models.TrainingJob || mongoose.model('TrainingJob', trainingJobSchema)