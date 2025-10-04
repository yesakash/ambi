"use client"

import { useEffect, useState } from "react"

interface PreviewData {
  headers: string[]
  rows: any[][]
  target_column?: string
}

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const taskId = localStorage.getItem("current_task_id")
    if (!taskId) {
      setError("No task ID found. Please upload dataset first.")
      setLoading(false)
      return
    }
    fetch(`http://localhost:5000/preview/${taskId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load preview data")
        }
        return res.json()
      })
      .then((data) => {
        setPreviewData(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-balance">CSV Preview</h1>
        <p className="text-muted-foreground mt-2">
          Adjust the number of rows and columns, search within cells, and review quick stats before training.
        </p>
      </header>

      {loading && <p>Loading preview...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {previewData && (
        <table className="table-auto border border-border w-full text-sm">
          <thead>
            <tr>
              {previewData.headers.map((h) => (
                <th key={h} className="border border-border px-2 py-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border px-2 py-1 truncate max-w-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
