"use client"

import { useState } from "react"
import { Plus, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ProductOptionInput } from "@/lib/validations/admin"

interface ProductOptionsEditorProps {
  options: ProductOptionInput[]
  onChange: (options: ProductOptionInput[]) => void
}

export function ProductOptionsEditor({ options, onChange }: ProductOptionsEditorProps) {
  const [newOptionName, setNewOptionName] = useState("")
  const [newValues, setNewValues] = useState<Record<number, string>>({})

  const addOption = () => {
    if (!newOptionName.trim()) return

    const newOption: ProductOptionInput = {
      name: newOptionName.trim(),
      values: [],
      position: options.length,
    }

    onChange([...options, newOption])
    setNewOptionName("")
  }

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index)
    // Update positions
    const reindexed = updated.map((opt, i) => ({ ...opt, position: i }))
    onChange(reindexed)
  }

  const updateOptionName = (index: number, name: string) => {
    const updated = [...options]
    updated[index] = { ...updated[index], name }
    onChange(updated)
  }

  const addValue = (optionIndex: number) => {
    const value = newValues[optionIndex]?.trim()
    if (!value) return

    const updated = [...options]
    const currentValues = updated[optionIndex].values || []

    // Don't add duplicate values
    if (currentValues.includes(value)) return

    updated[optionIndex] = {
      ...updated[optionIndex],
      values: [...currentValues, value],
    }

    onChange(updated)
    setNewValues({ ...newValues, [optionIndex]: "" })
  }

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...options]
    updated[optionIndex] = {
      ...updated[optionIndex],
      values: updated[optionIndex].values.filter((_, i) => i !== valueIndex),
    }
    onChange(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent, optionIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addValue(optionIndex)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing Options */}
      {options.map((option, optionIndex) => (
        <Card key={optionIndex}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <div className="flex items-center pt-2 text-muted-foreground cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              <div className="flex-1 space-y-3">
                {/* Option Name */}
                <div className="flex items-center gap-2">
                  <Input
                    value={option.name}
                    onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                    placeholder="Nom de l'option (ex: Couleur)"
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(optionIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Option Values */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Valeurs</Label>

                  {/* Existing values as badges */}
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, valueIndex) => (
                      <Badge
                        key={valueIndex}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => removeValue(optionIndex, valueIndex)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add new value */}
                  <div className="flex gap-2">
                    <Input
                      value={newValues[optionIndex] || ""}
                      onChange={(e) =>
                        setNewValues({ ...newValues, [optionIndex]: e.target.value })
                      }
                      onKeyDown={(e) => handleKeyDown(e, optionIndex)}
                      placeholder="Ajouter une valeur..."
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addValue(optionIndex)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Option */}
      <div className="flex gap-2">
        <Input
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addOption()
            }
          }}
          placeholder="Nom de la nouvelle option (ex: Taille, Stockage...)"
        />
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune option definie. Ajoutez des options comme Couleur, Taille, Stockage, etc.
        </p>
      )}
    </div>
  )
}
