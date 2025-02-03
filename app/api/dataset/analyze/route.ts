import { NextResponse } from 'next/server'
import { parse } from 'papaparse' // for CSV parsing
import * as XLSX from 'xlsx' // for Excel files

export async function POST(req: Request) {
  try {
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

    // Analyze dataset
    const columns = Object.keys(data[0] || {})
    const shape: [number, number] = [data.length, columns.length]

    // Basic type inference for columns
    const columnTypes = columns.reduce((acc, col) => {
      const values = data.map(row => row[col]).filter(val => val != null)
      const isNumeric = values.every(val => !isNaN(Number(val)))
      acc[col] = isNumeric ? 'numeric' : 'categorical'
      return acc
    }, {} as Record<string, string>)

    // Suggest target column (last column or one with specific keywords)
    const targetColumn = columns.find(col => 
      col.toLowerCase().includes('target') || 
      col.toLowerCase().includes('label') ||
      col.toLowerCase().includes('class')
    ) || columns[columns.length - 1]

    return NextResponse.json({
      columns,
      shape,
      columnTypes,
      targetColumn,
      summary: {
        missingValues: columns.reduce((acc, col) => {
          acc[col] = data.filter(row => row[col] == null).length
          return acc
        }, {} as Record<string, number>),
        uniqueValues: columns.reduce((acc, col) => {
          acc[col] = new Set(data.map(row => row[col])).size
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error) {
    console.error('Error analyzing dataset:', error)
    return NextResponse.json(
      { error: 'Failed to analyze dataset' },
      { status: 500 }
    )
  }
}