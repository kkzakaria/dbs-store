"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductSpecsEditorProps {
  value: Record<string, string>
  onChange: (specs: Record<string, string>) => void
}

export function ProductSpecsEditor({ value, onChange }: ProductSpecsEditorProps) {
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const specs = Object.entries(value || {})

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({
        ...value,
        [newKey.trim()]: newValue.trim(),
      })
      setNewKey("")
      setNewValue("")
    }
  }

  const handleRemove = (key: string) => {
    const newSpecs = { ...value }
    delete newSpecs[key]
    onChange(newSpecs)
  }

  const handleUpdate = (oldKey: string, newKey: string, newVal: string) => {
    const newSpecs = { ...value }
    if (oldKey !== newKey) {
      delete newSpecs[oldKey]
    }
    newSpecs[newKey] = newVal
    onChange(newSpecs)
  }

  return (
    <div className="space-y-4">
      <Label>Specifications techniques</Label>

      {/* Existing specs */}
      {specs.length > 0 && (
        <div className="space-y-2">
          {specs.map(([key, val], index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Nom (ex: Ecran)"
                value={key}
                onChange={(e) => handleUpdate(key, e.target.value, val)}
                className="flex-1"
              />
              <Input
                placeholder="Valeur (ex: 6.5 pouces)"
                value={val}
                onChange={(e) => handleUpdate(key, key, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(key)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new spec */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nom de la specification"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="flex-1"
        />
        <Input
          placeholder="Valeur"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {specs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune specification ajoutee. Utilisez les champs ci-dessus pour ajouter des specifications.
        </p>
      )}
    </div>
  )
}
