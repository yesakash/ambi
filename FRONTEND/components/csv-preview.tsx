// 'use client' is required for interactivity
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type Dataset = {
  headers: string[]
  rows: string[][]
}

export const DATASET_STORAGE_KEY = "v0:ml:dataset"
export const CONFIG_STORAGE_KEY = "v0:ml:config"

// Basic CSV parser that supports commas inside quotes and newlines.
// Returns headers + rows. Trims trailing empty lines.
export function parseCSV(text: string): Dataset {
  const rows: string[][] = []
  let i = 0
  let cur = ""
  let inQuotes = false
  const fields: string[] = []

  const pushField = () => {
    fields.push(cur)
    cur = ""
  }
  const pushRow = () => {
    // Ignore completely empty trailing lines
    const allEmpty = fields.every((f) => f === "")
    if (!(rows.length > 0 && allEmpty)) {
      rows.push(fields.slice())
    }
    fields.length = 0
  }

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        cur += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ",") {
        pushField()
        i++
        continue
      }
      if (ch === "\n") {
        pushField()
        pushRow()
        i++
        continue
      }
      if (ch === "\r") {
        // Normalize CRLF
        if (text[i + 1] === "\n") {
          i += 2
        } else {
          i++
        }
        pushField()
        pushRow()
        continue
      }
      cur += ch
      i++
    }
  }
  // Flush last field/row
  pushField()
  if (fields.length) pushRow()

  if (rows.length === 0) return { headers: [], rows: [] }

  // If the first row looks like headers (contains non-numeric strings), use it
  const looksLikeHeader = rows[0].some((cell) => {
    const n = Number(cell)
    const numLike = !Number.isNaN(n) && cell.trim() !== ""
    return !numLike
  })
  let headers: string[]
  let dataRows: string[][]
  if (looksLikeHeader) {
    headers = rows[0].map((h, idx) => h?.trim() || `col_${idx + 1}`)
    dataRows = rows.slice(1)
  } else {
    headers = rows[0].map((_, idx) => `col_${idx + 1}`)
    dataRows = rows
  }
  return { headers, rows: dataRows }
}

export function saveDatasetToStorage(dataset: Dataset, key = DATASET_STORAGE_KEY) {
  localStorage.setItem(key, JSON.stringify(dataset))
}
export function loadDatasetFromStorage(key = DATASET_STORAGE_KEY): Dataset | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Dataset
    if (!parsed || !Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) return null
    return parsed
  } catch {
    return null
  }
}

type CsvPreviewProps = {
  datasetKey?: string
  variant?: "full" | "compact"
}

export default function CsvPreview({ datasetKey = DATASET_STORAGE_KEY, variant = "full" }: CsvPreviewProps) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [rowCount, setRowCount] = useState(10)
  const [colCount, setColCount] = useState(6)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const data = loadDatasetFromStorage(datasetKey)
    setDataset(data)
    if (data) {
      setRowCount(Math.min(10, data.rows.length))
      setColCount(Math.min(6, data.headers.length))
    }
  }, [datasetKey])

  const filtered = useMemo(() => {
    if (!dataset) return null
    const cols = dataset.headers.slice(0, colCount)
    const rows = dataset.rows.slice(0, rowCount).filter((r) => {
      if (!query) return true
      const q = query.toLowerCase()
      return r.some((c) => (c ?? "").toLowerCase().includes(q))
    })
    return { headers: cols, rows }
  }, [dataset, rowCount, colCount, query])

  const stats = useMemo(() => {
    if (!dataset) return null
    const totalCells = dataset.rows.length * dataset.headers.length
    let missing = 0
    for (const r of dataset.rows) {
      for (const c of r) {
        if (c === undefined || c === null || String(c).trim() === "") missing++
      }
    }
    return {
      rows: dataset.rows.length,
      cols: dataset.headers.length,
      missing,
      missingPct: totalCells ? (missing / totalCells) * 100 : 0,
    }
  }, [dataset])

  if (!dataset) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-balance">No dataset found</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Upload a CSV on the home page to see the preview here.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-balance">{variant === "full" ? "CSV Preview" : "Mini Preview"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variant === "full" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-2">Preview Rows: {rowCount}</label>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, dataset.rows.length)}
                  value={rowCount}
                  onChange={(e) => setRowCount(Number.parseInt(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Preview rows slider"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-2">Preview Columns: {colCount}</label>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, dataset.headers.length)}
                  value={colCount}
                  onChange={(e) => setColCount(Number.parseInt(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Preview columns slider"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Filter cells..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2"
                  aria-label="Search in preview"
                />
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-md border border-border p-3 bg-secondary">
                  <div className="text-muted-foreground">Rows</div>
                  <div className="font-semibold">{stats.rows.toLocaleString()}</div>
                </div>
                <div className="rounded-md border border-border p-3 bg-secondary">
                  <div className="text-muted-foreground">Columns</div>
                  <div className="font-semibold">{stats.cols.toLocaleString()}</div>
                </div>
                <div className="rounded-md border border-border p-3 bg-secondary">
                  <div className="text-muted-foreground">Missing Values</div>
                  <div className="font-semibold">
                    {stats.missing.toLocaleString()} ({stats.missingPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className={variant === "compact" ? "max-h-56 overflow-auto" : "max-h-[50vh] overflow-auto"}>
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                {filtered?.headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 text-left border-b border-border font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered?.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-background" : "bg-accent"}>
                  {filtered.headers.map((_, cIdx) => {
                    const cell = row[cIdx] ?? ""
                    const q = query.toLowerCase()
                    const highlighted = q && cell.toLowerCase().includes(q)
                    return (
                      <td
                        key={cIdx}
                        className={`px-3 py-2 border-b border-border ${highlighted ? "bg-primary/10" : ""}`}
                      >
                        {cell}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {variant === "full" && (
          <div className="flex items-center justify-between pt-2">
            <Link href="/" className="text-sm underline underline-offset-4 text-primary">
              ← Back to Upload
            </Link>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setRowCount(Math.min(10, dataset.rows.length))
                  setColCount(Math.min(6, dataset.headers.length))
                  setQuery("")
                }}
              >
                Reset
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  localStorage.removeItem(datasetKey)
                  setDataset(null)
                }}
              >
                Clear Dataset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
