import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { Textarea } from '#/components/ui/textarea'
import type { FieldType, FormDefinition, FormField, FormPage } from '#/lib/form-types'
import { cn } from '#/lib/utils'

const fieldTypes: { type: FieldType; label: string }[] = [
  { type: 'short_text', label: 'Short text' },
  { type: 'long_text', label: 'Long text' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Dropdown' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Date' },
]

const fieldTypeLabel = Object.fromEntries(fieldTypes.map((f) => [f.type, f.label])) as Record<
  FieldType,
  string
>

function newField(type: FieldType): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: fieldTypeLabel[type],
    required: false,
    ...(type === 'select' ? { options: ['Option 1', 'Option 2'] } : {}),
  }
}

function SortableFieldCard({
  field,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  field: FormField
  expanded: boolean
  onToggle: () => void
  onChange: (field: FormField) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-xl border border-mauve-10 bg-white',
        isDragging && 'z-10 opacity-80 shadow-lg',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-mauve-40 hover:bg-mauve-05 hover:text-mauve active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <circle cx="5" cy="3" r="1.3" />
            <circle cx="11" cy="3" r="1.3" />
            <circle cx="5" cy="8" r="1.3" />
            <circle cx="11" cy="8" r="1.3" />
            <circle cx="5" cy="13" r="1.3" />
            <circle cx="11" cy="13" r="1.3" />
          </svg>
        </button>

        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="truncate text-sm font-medium text-night-80">{field.label}</span>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {fieldTypeLabel[field.type]}
          </Badge>
          {field.required ? (
            <span className="shrink-0 text-xs font-semibold text-mauve">*</span>
          ) : null}
        </button>

        <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove field">
          ✕
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-4 border-t border-mauve-10 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`label-${field.id}`}>Label</Label>
              <Input
                id={`label-${field.id}`}
                value={field.label}
                onChange={(e) => onChange({ ...field, label: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder ?? ''}
                onChange={(e) =>
                  onChange({ ...field, placeholder: e.target.value || undefined })
                }
              />
            </div>
          </div>

          {field.type === 'select' ? (
            <div className="space-y-1.5">
              <Label htmlFor={`options-${field.id}`}>Options (one per line)</Label>
              <Textarea
                id={`options-${field.id}`}
                rows={3}
                value={(field.options ?? []).join('\n')}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value.split('\n').filter((o) => o.trim().length > 0),
                  })
                }
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-night-60">
            <input
              type="checkbox"
              checked={field.required ?? false}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="h-4 w-4 rounded border-mauve/30 accent-mauve"
            />
            Required field
          </label>
        </div>
      ) : null}
    </div>
  )
}

export function FormBuilder({
  definition,
  onChange,
}: {
  definition: FormDefinition
  onChange: (definition: FormDefinition) => void
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [expandedField, setExpandedField] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const safePageIndex = Math.min(pageIndex, definition.pages.length - 1)
  const page = definition.pages[safePageIndex]!

  function updatePage(updated: FormPage) {
    onChange({
      ...definition,
      pages: definition.pages.map((p, i) => (i === safePageIndex ? updated : p)),
    })
  }

  function addPage() {
    onChange({
      ...definition,
      pages: [
        ...definition.pages,
        { id: crypto.randomUUID(), title: `Step ${definition.pages.length + 1}`, fields: [] },
      ],
    })
    setPageIndex(definition.pages.length)
  }

  function removePage(index: number) {
    if (definition.pages.length <= 1) return
    onChange({ ...definition, pages: definition.pages.filter((_, i) => i !== index) })
    setPageIndex(Math.max(0, safePageIndex - (index <= safePageIndex ? 1 : 0)))
  }

  function movePage(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= definition.pages.length) return
    onChange({ ...definition, pages: arrayMove(definition.pages, index, target) })
    if (index === safePageIndex) setPageIndex(target)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = page.fields.findIndex((f) => f.id === active.id)
    const newIndex = page.fields.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    updatePage({ ...page, fields: arrayMove(page.fields, oldIndex, newIndex) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {definition.pages.map((p, i) => (
          <div key={p.id} className="flex items-center">
            <Button
              size="sm"
              variant={i === safePageIndex ? 'mauve' : 'ghost'}
              onClick={() => setPageIndex(i)}
            >
              {p.title?.trim() || `Step ${i + 1}`}
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={addPage}>
          + Page
        </Button>
      </div>

      <Panel>
        <PanelHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor="page-title">Page title</Label>
            <Input
              id="page-title"
              className="mt-1.5"
              value={page.title ?? ''}
              onChange={(e) => updatePage({ ...page, title: e.target.value || undefined })}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 self-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => movePage(safePageIndex, -1)}
              disabled={safePageIndex === 0}
              aria-label="Move page left"
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => movePage(safePageIndex, 1)}
              disabled={safePageIndex === definition.pages.length - 1}
              aria-label="Move page right"
            >
              →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePage(safePageIndex)}
              disabled={definition.pages.length <= 1}
            >
              Delete page
            </Button>
          </div>
        </PanelHeader>

        <PanelBody className="space-y-3">
          {page.fields.length === 0 ? (
            <p className="rounded-xl border border-dashed border-mauve-20 px-4 py-8 text-center text-sm text-night-40">
              No fields on this page yet. Add one below.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={page.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {page.fields.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      expanded={expandedField === field.id}
                      onToggle={() =>
                        setExpandedField(expandedField === field.id ? null : field.id)
                      }
                      onChange={(updated) =>
                        updatePage({
                          ...page,
                          fields: page.fields.map((f) => (f.id === updated.id ? updated : f)),
                        })
                      }
                      onRemove={() =>
                        updatePage({
                          ...page,
                          fields: page.fields.filter((f) => f.id !== field.id),
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="flex flex-wrap gap-2 border-t border-mauve-10 pt-4">
            {fieldTypes.map(({ type, label }) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                onClick={() => {
                  const field = newField(type)
                  updatePage({ ...page, fields: [...page.fields, field] })
                  setExpandedField(field.id)
                }}
              >
                + {label}
              </Button>
            ))}
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <h3 className="text-base font-semibold text-night-80">Thank-you message</h3>
        </PanelHeader>
        <PanelBody>
          <Textarea
            rows={2}
            value={definition.theme?.thankYouMessage ?? ''}
            placeholder="Thanks for your submission!"
            onChange={(e) =>
              onChange({
                ...definition,
                theme: { ...definition.theme, thankYouMessage: e.target.value || undefined },
              })
            }
          />
        </PanelBody>
      </Panel>
    </div>
  )
}
