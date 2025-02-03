import { NextResponse } from 'next/server'
import { parse } from 'papaparse'
import * as XLSX from 'xlsx'
import dbConnect from '@/lib/mongodb'
import { Dataset } from '../../models/ModelMetrics'

export async function POST(req: Request) {
  try {
    await dbConnect()
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.arrayBuffer()
    let data: any[] = []

    // Parse based on file type
    if (file.name.endsWith('.csv')) {
      const text = new TextDecoder().decode(fileContent)
      const result = parse(text, { header: true })
      data = result.data
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(fileContent)
      const sheetName = workbook.SheetNames[0]
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    } else if (file.name.endsWith('.json')) {
      const text = new TextDecoder().decode(fileContent)
      data = JSON.parse(text)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      )
    }

    const columns = Object.keys(data[0] || {})
    const shape: [number, number] = [data.length, columns.length]

    // Analyze dataset
    const columnTypes = columns.reduce((acc, col) => {
      const values = data.map(row => row[col]).filter(val => val != null)
      const isNumeric = values.every(val => !isNaN(Number(val)))
      acc[col] = isNumeric ? 'numeric' : 'categorical'
      return acc
    }, {} as Record<string, string>)

    const targetColumn = columns.find(col => 
      col.toLowerCase().includes('target') || 
      col.toLowerCase().includes('label') ||
      col.toLowerCase().includes('class')
    ) || columns[columns.length - 1]

    const summary = {
      missingValues: columns.reduce((acc, col) => {
        acc[col] = data.filter(row => row[col] == null).length
        return acc
      }, {} as Record<string, number>),
      uniqueValues: columns.reduce((acc, col) => {
        acc[col] = new Set(data.map(row => row[col])).size
        return acc
      }, {} as Record<string, number>)
    }

    // Store dataset info
    const dataset = await Dataset.create({
      name: file.name,
      fileName: file.name,
      columns,
      rowCount: shape[0],
      columnTypes,
      summary,
      targetColumn,
      userId: req.headers.get('user-id') // You'll need to pass this from the client
    })

    return NextResponse.json({
      datasetId: dataset._id,
      columns,
      shape,
      columnTypes,
      targetColumn,
      summary
    })
  } catch (error) {
    console.error('Error analyzing dataset:', error)
    return NextResponse.json(
      { error: 'Failed to analyze dataset' },
      { status: 500 }
    )
  }
}