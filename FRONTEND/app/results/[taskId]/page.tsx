"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface Result {
  name: string
  score: string
  download_path: string
}

interface ResultsResponse {
  results: Result[]
  metric: string
  task_id: string
}

export default function ResultsPage() {
  const params = useParams()
  const taskId = params?.taskId || ""
  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    fetch(`http://localhost:5000/results/${taskId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load results")
        }
        return res.json()
      })
      .then((data) => {
        setResultsData(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [taskId])

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Model Training Results</h1>
        <p className="text-muted-foreground mt-2">Leaderboard sorted by {resultsData?.metric}</p>
      </header>
      {loading && <p>Loading results...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {resultsData && (
        <table className="w-full border border-border text-sm">
          <thead>
            <tr>
              <th className="border border-border px-3 py-2 text-left">Model</th>
              <th className="border border-border px-3 py-2 text-right">{resultsData.metric}</th>
              <th className="border border-border px-3 py-2">Download</th>
            </tr>
          </thead>
          <tbody>
            {resultsData.results.map((result, idx) => (
              <tr key={idx}>
                <td className="border border-border px-3 py-2">{result.name}</td>
                <td className="border border-border px-3 py-2 text-right">{result.score}</td>
                <td className="border border-border px-3 py-2 text-center">
                  <a
                    href={`http://localhost:5000/download/${result.download_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-6">
        <Link href="/" className="text-primary underline">
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
