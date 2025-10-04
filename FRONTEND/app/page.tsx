"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CsvPreview, {
  parseCSV,
  saveDatasetToStorage,
  DATASET_STORAGE_KEY,
  CONFIG_STORAGE_KEY,
  type Dataset,
} from "@/components/csv-preview"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Sample dataset helper to generate example CSV data
function buildSampleCSV() {
  const headers = ["id", "x1", "x2", "x3", "x4", "score"]
  const rows = Array.from({ length: 25 }, (_, i) => {
    const id = Math.random().toString(16).slice(2, 10)
    const x1 = (500 + Math.random() * 3500).toFixed(1)
    const x2 = (500 + Math.random() * 3500).toFixed(1)
    const x3 = (Math.random() * 2000).toFixed(6)
    const x4 = Math.random() > 0.5 ? "1" : "0"
    const score = (Math.random() * 5).toFixed(1)
    return [id, x1, x2, x3, x4, score]
  })
  const lines = [headers.join(","), ...rows.map((r) => r.join(","))]
  return lines.join("\n")
}

export default function HomePage() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [target, setTarget] = useState<string>("")
  const [split, setSplit] = useState<number>(80)
  const [models, setModels] = useState<string[]>([])
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskType, setTaskType] = useState<"classification" | "regression" | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLLabelElement | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [prevList, setPrevList] = useState<
    { id: string; name: string; rows: number; cols: number; savedAt: number }[]
  >([])

  const INDEX_KEY = "v0:ml:datasets:index"
  const datasetKeyById = (id: string) => `v0:ml:dataset:${id}`

  const loadIndex = useCallback(() => {
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      const arr = raw ? (JSON.parse(raw) as typeof prevList) : []
      setPrevList(Array.isArray(arr) ? arr.sort((a, b) => b.savedAt - a.savedAt) : [])
    } catch {
      setPrevList([])
    }
  }, [])

  const addToIndex = useCallback((name: string, ds: Dataset) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2, 6)}`
    const item = { id, name, rows: ds.rows.length, cols: ds.headers.length, savedAt: Date.now() }
    const raw = localStorage.getItem(INDEX_KEY)
    const arr = raw ? (JSON.parse(raw) as typeof prevList) : []
    const next = [item, ...(Array.isArray(arr) ? arr : [])].slice(0, 20)
    localStorage.setItem(INDEX_KEY, JSON.stringify(next))
    localStorage.setItem(datasetKeyById(id), JSON.stringify(ds))
    setPrevList(next.sort((a, b) => b.savedAt - a.savedAt))
    return id
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      try {
        const conf = JSON.parse(stored) as { target?: string; split?: number; models?: string[] }
        if (conf.target) setTarget(conf.target)
        if (typeof conf.split === "number") setSplit(conf.split)
        if (Array.isArray(conf.models) && conf.models.length) setModels(conf.models)
      } catch {}
    }
    const dsRaw = localStorage.getItem(DATASET_STORAGE_KEY)
    if (dsRaw) {
      try {
        const ds = JSON.parse(dsRaw) as Dataset
        setDataset(ds)
      } catch {}
    }
    loadIndex()
  }, [loadIndex])

  // Determine task type (classification or regression) by heuristics on target column values
  const determineTaskType = useCallback(
    (ds: Dataset, targetCol: string): "classification" | "regression" | null => {
      if (!targetCol) return null
      const idx = ds.headers.indexOf(targetCol)
      if (idx === -1) return null
      const columnVals = ds.rows.map((row) => row[idx])
      const numericVals = columnVals.filter((val) => !isNaN(parseFloat(val)))
      const uniqueVals = new Set(columnVals).size

      // If most values are numeric and many unique, consider regression
      if (numericVals.length / columnVals.length >= 0.8 && uniqueVals > 20) return "regression"
      // Otherwise classification
      return "classification"
    },
    []
  )

  // Upload CSV file to backend and parse locally
  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return
      const file = files[0]
      setFileName(file.name)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          toast({ title: "Upload failed", description: "Failed to upload CSV." })
          return
        }
        const data = await res.json()
        if (!data.task_id) {
          toast({ title: "Upload failed", description: "Invalid response from server." })
          return
        }
        setTaskId(data.task_id);
        localStorage.setItem("current_task_id", data.task_id);

        const text = await file.text()
        const ds = parseCSV(text)
        saveDatasetToStorage(ds)
        setDataset(ds)
        addToIndex(file.name, ds)
        toast({ title: "Dataset loaded", description: `${ds.rows.length} rows • ${ds.headers.length} columns` })

        const taskTypeDetected = determineTaskType(ds, target)
        setTaskType(taskTypeDetected)

        // Reset target if not in headers
        if (!ds.headers.includes(target)) setTarget("")
      } catch {
        toast({ title: "Error", description: "Failed to upload or process file." })
      }
    },
    [target, toast, addToIndex, determineTaskType]
  )

  // Model options list with enabled models depending on task type
  const modelsList = useMemo(
    () => [
      { name: "Linear Regression", for: "regression" },
      { name: "Random Forest", for: "classification" },
      { name: "Random Forest Regressor", for: "regression" },
      { name: "Support Vector Regressor", for: "regression" },
      { name: "Support Vector Machine", for: "classification" },
      { name: "Logistic Regression", for: "classification" },
      { name: "Decision Tree Classifier", for: "classification" },
      { name: "Decision Tree Regressor", for: "regression" },
      { name: "Gradient Boosting Classifier", for: "classification" },
      { name: "Gradient Boosting Regressor", for: "regression" },
      { name: "K-Nearest Neighbors", for: "classification" },
      { name: "K-Nearest Neighbors Regressor", for: "regression" },
      { name: "MLP Classifier", for: "classification" },
      { name: "MLP Regressor", for: "regression" }
    ],
    []
  )

  // Flags to control UI state
  const canOpenPreview = !!dataset && dataset.rows.length > 0
  const canTrain = !!dataset && !!target && models.length > 0 && !!taskId && !!taskType

  const persistConfig = () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ target, split, models }))
  }

  // Send training request to backend API
  const handleTrain = async () => {
    if (!canTrain) {
      toast({ title: "Missing configuration", description: "Please upload dataset, select target and models." })
      return
    }
    persistConfig()
    try {
      const res = await fetch("http://localhost:5000/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          target_column: target,
          models: models,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast({ title: "Training failed", description: data.error ?? "Unknown error" })
        return
      }
      toast({
        title: "Training complete",
        description: `Metric: ${data.metric} · ${data.results.length} model(s) evaluated.`,
      })
      router.push(`/results/${taskId}`)
    } catch {
      toast({ title: "Error", description: "Failed to train models." })
    }
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-balance">Train Your ML Model</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV to get an instant preview, configure targets, pick models, and proceed to training.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3 bg-card border border-border">
          <CardHeader>
            <CardTitle>1) Upload your Dataset (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              ref={dropRef}
              htmlFor="csv-input"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary p-6 text-center cursor-pointer"
              aria-label="Upload CSV by clicking or dropping a file here"
            >
              <div className="text-sm text-muted-foreground">Drag & drop a CSV here or click to choose a file</div>
              <div className="text-xs text-muted-foreground">{fileName ? `Selected: ${fileName}` : "No file selected"}</div>
              <input
                ref={inputRef}
                id="csv-input"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
                  Choose File
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const sample = buildSampleCSV()
                    const ds = parseCSV(sample)
                    saveDatasetToStorage(ds)
                    setDataset(ds)
                    setFileName("sample.csv")
                    addToIndex("sample.csv", ds)
                    toast({
                      title: "Sample dataset added",
                      description: `${ds.rows.length} rows • ${ds.headers.length} columns`,
                    })
                    setTaskType(determineTaskType(ds, "score"))
                    setTarget("score")
                  }}
                >
                  Use Sample Data
                </Button>
              </div>
            </label>
            {dataset ? (
              <>
                <div className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="target-select" className="block text-sm font-medium mb-2">Target Column</label>
                      <select
                        id="target-select"
                        value={target}
                        onChange={(e) => {
                          setTarget(e.target.value)
                          if (dataset) {
                            setTaskType(determineTaskType(dataset, e.target.value))
                            setModels([]) // reset models selection when target changes
                          }
                        }}
                        className="w-full bg-background border border-border rounded-md px-3 py-2"
                      >
                        <option value="" disabled>Select target…</option>
                        {dataset.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Train / Test Split: {split}% / {100 - split}%
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={90}
                        value={split}
                        onChange={(e) => setSplit(Number.parseInt(e.target.value))}
                        className="w-full accent-primary"
                        aria-label="Train test split slider"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Models</div>
                    <div className="flex flex-wrap gap-2">
                      {modelsList.map(({ name, for: applicableFor }) => {
                        const active = models.includes(name)
                        // disable button if model not suitable for the detected task type
                        const disabled = taskType ? applicableFor !== taskType : false
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              setModels((prev) =>
                                prev.includes(name)
                                  ? prev.filter((x) => x !== name)
                                  : [...prev, name]
                              )
                            }
                            className={`px-3 py-1.5 rounded-md border text-sm transition ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-accent"
                            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            aria-pressed={active ? "true" : "false"}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!dataset) {
                          toast({ title: "No dataset yet", description: "Upload a CSV or use sample data first." })
                          return
                        }
                        if (!target) {
                          toast({ title: "Select a target column", description: "Pick the column you want to predict." })
                          return
                        }
                        persistConfig()
                        toast({
                          title: "Configuration saved",
                          description: `Split ${split}% / ${100 - split}% · ${models.length} model(s) selected`,
                        })
                      }}
                    >
                      Save Configuration
                    </Button>
                    <Link href="/preview" aria-disabled={!canOpenPreview}>
                      <Button type="button" disabled={!canOpenPreview}>
                        Open Full Preview →
                      </Button>
                    </Link>
                    <Button type="button" onClick={handleTrain} disabled={!canTrain}>
                      Train Models →
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <CsvPreview variant="compact" />
          <div className="mt-6 rounded-lg border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Previous Datasets</h2>
              <p className="text-xs text-muted-foreground mt-1">Quickly restore a dataset you uploaded earlier.</p>
            </div>
            <div className="p-4">
              {prevList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No previous datasets yet.</div>
              ) : (
                <ul className="space-y-2">
                  {prevList.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.rows.toLocaleString()} rows · {d.cols.toLocaleString()} cols ·{" "}
                          {new Date(d.savedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-sm rounded-md border border-border px-2 py-1 hover:bg-accent"
                          onClick={() => {
                            try {
                              const raw = localStorage.getItem(datasetKeyById(d.id))
                              if (!raw) return
                              localStorage.setItem(DATASET_STORAGE_KEY, raw)
                              router.push("/preview")
                            } catch {}
                          }}
                          aria-label={`Open ${d.name} in preview`}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="text-sm rounded-md border border-border px-2 py-1 hover:bg-destructive/10"
                          onClick={() => {
                            const raw = localStorage.getItem(INDEX_KEY)
                            const arr = raw ? (JSON.parse(raw) as typeof prevList) : []
                            const next = (Array.isArray(arr) ? arr : []).filter((x) => x.id !== d.id)
                            localStorage.setItem(INDEX_KEY, JSON.stringify(next))
                            localStorage.removeItem(datasetKeyById(d.id))
                            setPrevList(next)
                          }}
                          aria-label={`Remove ${d.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
