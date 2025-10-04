"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"

interface Result {
  name: string
  score: string
  accuracy?: number
  precision?: number
  recall?: number
  f1?: number
  loss?: number
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
        if (!res.ok) throw new Error("Failed to load results")
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

  const hasAnalytics = resultsData?.results.some(
    (r) =>
      r.accuracy !== undefined ||
      r.precision !== undefined ||
      r.recall !== undefined ||
      r.f1 !== undefined ||
      r.loss !== undefined
  )

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 px-6 py-12 flex flex-col items-center">
      {/* HEADER */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-3 text-gray-800">
          Model Performance Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Detailed metrics and analytics for task{" "}
          <span className="font-semibold text-gray-900">{resultsData?.task_id}</span>
        </p>
      </header>

      {loading && <p className="text-gray-500 animate-pulse text-lg">Loading results...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* TABLE */}
      {resultsData && (
        <div className="w-full max-w-6xl bg-white border border-gray-300 rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-700">Model</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-700">
                  {resultsData.metric}
                </th>
                <th className="px-5 py-4 text-right font-semibold text-gray-700">F1 Score</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-700">Precision</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-700">Recall</th>
                <th className="px-5 py-4 text-center font-semibold text-gray-700">Download</th>
              </tr>
            </thead>
            <tbody>
              {resultsData.results.map((r, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-100 transition-all duration-300 ease-in-out"
                >
                  <td className="px-5 py-4 font-medium">{r.name}</td>
                  <td className="px-5 py-4 text-right font-semibold">{r.score}</td>
                  <td className="px-5 py-4 text-right">
                    {r.f1 !== undefined ? r.f1.toFixed(3) : "–"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {r.precision !== undefined ? r.precision.toFixed(3) : "–"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {r.recall !== undefined ? r.recall.toFixed(3) : "–"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <a
                      href={`http://localhost:5000/download/${r.download_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-800 hover:text-white transition-all duration-300"
                    >
                      ⬇ Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ANALYTICS */}
      {hasAnalytics && resultsData && (
        <section className="w-full max-w-6xl mt-16 space-y-10">
          <h2 className="text-3xl font-semibold text-gray-800">
            Model Analytics Overview
          </h2>

          {/* Line Chart - Accuracy, F1, Precision, Recall */}
          <div className="p-6 bg-white border border-gray-300 rounded-xl shadow-sm">
            <h3 className="text-xl mb-4 font-medium text-gray-700">
              Model Comparison (Accuracy, F1, Precision, Recall)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={resultsData.results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="name" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="f1" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="precision" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="recall" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Model Loss */}
          <div className="p-6 bg-white border border-gray-300 rounded-xl shadow-sm">
            <h3 className="text-xl mb-4 font-medium text-gray-700">Model Loss Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resultsData.results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="name" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip />
                <Legend />
                <Bar dataKey="loss" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* BACK LINK */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-900 underline underline-offset-4 text-sm transition-all"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
