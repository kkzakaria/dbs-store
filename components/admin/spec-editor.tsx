"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpecEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export function SpecEditor({ specs, onChange }: SpecEditorProps) {
  const entries = Object.entries(specs);

  function updateKey(index: number, oldKey: string, newKey: string) {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      next[i === index ? newKey : k] = v;
    });
    onChange(next);
  }

  function updateValue(key: string, value: string) {
    onChange({ ...specs, [key]: value });
  }

  function removeEntry(key: string) {
    const next = { ...specs };
    delete next[key];
    onChange(next);
  }

  function addEntry() {
    const key = `Spec ${entries.length + 1}`;
    onChange({ ...specs, [key]: "" });
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value], index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => updateKey(index, key, e.target.value)}
            placeholder="Clé"
            className="w-40"
          />
          <Input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="Valeur"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEntry(key)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="mr-2 size-4" />
        Ajouter une spec
      </Button>
    </div>
  );
}
