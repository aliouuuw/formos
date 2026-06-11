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

import { FormRenderer } from '#/components/form-renderer'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import type { FieldType, FormDefinition, FormField, FormPage } from '#/lib/form-types'
import { cn } from '#/lib/utils'

/* ------------------------------------------------------------------ */
/* Field type metadata                                                  */
/* ------------------------------------------------------------------ */

const fieldTypes: { type: FieldType; label: string; glyph: string }[] = [
  { type: 'short_text', label: 'Short text', glyph: 'Aa' },
  { type: 'long_text', label: 'Long text', glyph: '¶' },
  { type: 'email', label: 'Email', glyph: '@' },
  { type: 'phone', label: 'Phone', glyph: '☎' },
  { type: 'number', label: 'Number', glyph: '#' },
  { type: 'select', label: 'Dropdown', glyph: '▾' },
  { type: 'checkbox', label: 'Checkbox', glyph: '✓' },
  { type: 'date', label: 'Date', glyph: '▦' },
]

const typeMeta = Object.fromEntries(fieldTypes.map((f) => [f.type, f])) as Record<
  FieldType,
  (typeof fieldTypes)[number]
>

function newField(type: FieldType): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: typeMeta[type].label,
    required: false,
    ...(type === 'select' ? { options: ['Option 1', 'Option 2'] } : {}),
  }
}

type Selection =
  | { kind: 'field'; pageId: string; fieldId: string }
  | { kind: 'page'; pageId: string }
  | { kind: 'ending' }

/* ------------------------------------------------------------------ */
/* Structure rail: sortable field row                                   */
/* ------------------------------------------------------------------ */

function FieldRow({
  field,
  selected,
  onSelect,
  onRemove,
}: {
  field: FormField
  selected: boolean
  onSelect: () => void
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
        'group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150',
        selected ? 'bg-mauve-05' : 'hover:bg-mauve-05/50',
        isDragging && 'z-10 opacity-70 bg-white shadow-sm ring-1 ring-mauve-10',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-0.5 text-mauve-20 opacity-0 transition-opacity duration-150 hover:bg-mauve-10 hover:text-mauve group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="5" cy="4" r="1.2" />
          <circle cx="11" cy="4" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="12" r="1.2" />
          <circle cx="11" cy="12" r="1.2" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-colors duration-200',
            selected ? 'bg-mauve text-white shadow-sm' : 'bg-mauve-05 text-mauve-60',
          )}
          aria-hidden
        >
          {typeMeta[field.type].glyph}
        </span>
        <span
          className={cn(
            'truncate text-[13px]',
            selected ? 'font-medium text-night-80' : 'text-night-60',
          )}
        >
          {field.label || 'Untitled field'}
          {field.required ? <span className="ml-0.5 text-mauve">*</span> : null}
        </span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-mauve-20 opacity-0 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        aria-label={`Remove ${field.label}`}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inspector: settings for the current selection                        */
/* ------------------------------------------------------------------ */

function FieldInspector({
  field,
  onChange,
}: {
  field: FormField
  onChange: (field: FormField) => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="insp-label">Question</Label>
        <Textarea
          id="insp-label"
          rows={3}
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="insp-placeholder">Placeholder</Label>
        <Input
          id="insp-placeholder"
          value={field.placeholder ?? ''}
          placeholder={field.type === 'checkbox' ? 'Checkbox text' : 'Shown inside the input'}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value || undefined })}
        />
      </div>
      {field.type === 'select' ? (
        <div className="space-y-1.5">
          <Label htmlFor="insp-options">Choices, one per line</Label>
          <Textarea
            id="insp-options"
            rows={5}
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
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-mauve-10 px-4 py-3 hover:bg-mauve-05/50 transition-colors">
        <span className="text-sm font-medium text-night-80">Required</span>
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ ...field, required: e.target.checked })}
          className="h-4 w-4 rounded border-mauve/30 accent-mauve"
        />
      </label>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Builder                                                              */
/* ------------------------------------------------------------------ */

export function FormBuilder({
  definition,
  onChange,
  previewTitle = 'Preview',
}: {
  definition: FormDefinition
  onChange: (definition: FormDefinition) => void
  previewTitle?: string
}) {
  const firstPage = definition.pages[0]
  const [selection, setSelection] = useState<Selection>(
    firstPage ? { kind: 'page', pageId: firstPage.id } : { kind: 'ending' },
  )
  const [addingTo, setAddingTo] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activePageId =
    selection.kind === 'ending' ? null : selection.pageId
  const activePageIndex = Math.max(
    0,
    definition.pages.findIndex((p) => p.id === activePageId),
  )
  const activePage = definition.pages[activePageIndex]

  const selectedField =
    selection.kind === 'field'
      ? activePage?.fields.find((f) => f.id === selection.fieldId)
      : undefined

  function patchPage(pageId: string, patch: (page: FormPage) => FormPage) {
    onChange({
      ...definition,
      pages: definition.pages.map((p) => (p.id === pageId ? patch(p) : p)),
    })
  }

  function addField(pageId: string, type: FieldType) {
    const field = newField(type)
    patchPage(pageId, (p) => ({ ...p, fields: [...p.fields, field] }))
    setSelection({ kind: 'field', pageId, fieldId: field.id })
    setAddingTo(null)
  }

  function removeField(pageId: string, fieldId: string) {
    patchPage(pageId, (p) => ({ ...p, fields: p.fields.filter((f) => f.id !== fieldId) }))
    if (selection.kind === 'field' && selection.fieldId === fieldId) {
      setSelection({ kind: 'page', pageId })
    }
  }

  function addPage() {
    const page: FormPage = {
      id: crypto.randomUUID(),
      title: `Step ${definition.pages.length + 1}`,
      fields: [],
    }
    onChange({ ...definition, pages: [...definition.pages, page] })
    setSelection({ kind: 'page', pageId: page.id })
  }

  function removePage(pageId: string) {
    if (definition.pages.length <= 1) return
    const remaining = definition.pages.filter((p) => p.id !== pageId)
    onChange({ ...definition, pages: remaining })
    if (activePageId === pageId) {
      setSelection({ kind: 'page', pageId: remaining[0]!.id })
    }
  }

  function movePage(pageId: string, dir: -1 | 1) {
    const index = definition.pages.findIndex((p) => p.id === pageId)
    const target = index + dir
    if (index < 0 || target < 0 || target >= definition.pages.length) return
    onChange({ ...definition, pages: arrayMove(definition.pages, index, target) })
  }

  function handleDragEnd(pageId: string) {
    return (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      patchPage(pageId, (p) => {
        const oldIndex = p.fields.findIndex((f) => f.id === active.id)
        const newIndex = p.fields.findIndex((f) => f.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return p
        return { ...p, fields: arrayMove(p.fields, oldIndex, newIndex) }
      })
    }
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[600px] overflow-hidden rounded-2xl border border-mauve-10 bg-[#FAF9F8] shadow-sm ring-1 ring-black/[0.02]">
      {/* 1. Left Pane: Structure Rail */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-mauve-10 bg-[#FCFCFB] p-5">
        <h3 className="mb-5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-40">
          Structure
        </h3>
        
        <div className="space-y-6">
          {definition.pages.map((page, pi) => {
            const isActivePage = activePageId === page.id
            return (
              <section key={page.id} className="relative">
                <div
                  className={cn(
                    'group mb-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors',
                    isActivePage && selection.kind === 'page' ? 'bg-mauve-05' : 'hover:bg-mauve-05/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'page', pageId: page.id })}
                    className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                  >
                    <span className="text-[10px] font-bold tabular-nums text-mauve-40">
                      {pi + 1}
                    </span>
                    <span className={cn("truncate text-[13px] font-semibold", isActivePage ? "text-night-80" : "text-night-60")}>
                      {page.title?.trim() || `Step ${pi + 1}`}
                    </span>
                  </button>
                  <div className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => movePage(page.id, -1)}
                      disabled={pi === 0}
                      className="rounded p-1 text-mauve-40 hover:bg-white hover:text-mauve disabled:opacity-30 shadow-sm"
                      aria-label="Move step up"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => movePage(page.id, 1)}
                      disabled={pi === definition.pages.length - 1}
                      className="ml-1 rounded p-1 text-mauve-40 hover:bg-white hover:text-mauve disabled:opacity-30 shadow-sm"
                      aria-label="Move step down"
                    >
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      disabled={definition.pages.length <= 1}
                      className="ml-2 rounded p-1 text-mauve-40 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Delete step"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5 pl-3">
                  <div className="absolute bottom-6 left-[19px] top-10 w-px bg-mauve-10" aria-hidden />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd(page.id)}
                  >
                    <SortableContext
                      items={page.fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {page.fields.map((field) => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          selected={selection.kind === 'field' && selection.fieldId === field.id}
                          onSelect={() =>
                            setSelection({ kind: 'field', pageId: page.id, fieldId: field.id })
                          }
                          onRemove={() => removeField(page.id, field.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <div className="pt-1">
                    {addingTo === page.id ? (
                      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-2 shadow-sm ring-1 ring-mauve-10">
                        {fieldTypes.map(({ type, label, glyph }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addField(page.id, type)}
                            className="flex flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-night-60 transition-colors duration-150 hover:bg-mauve-05 hover:text-mauve"
                          >
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-mauve-05 text-[11px] font-semibold text-mauve"
                              aria-hidden
                            >
                              {glyph}
                            </span>
                            <span className="text-[10px] font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingTo(page.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-mauve-40 transition-colors duration-150 hover:bg-white hover:text-mauve"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-mauve-20 bg-transparent text-xs">
                          +
                        </span>
                        Add field
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-8 space-y-2 border-t border-mauve-10 pt-6">
          <button
            type="button"
            onClick={addPage}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-night-60 hover:bg-mauve-05 hover:text-night-80"
          >
            <span className="text-mauve-40">+</span> Add step
          </button>
          <button
            type="button"
            onClick={() => setSelection({ kind: 'ending' })}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              selection.kind === 'ending'
                ? 'bg-mauve-05 text-mauve'
                : 'text-night-60 hover:bg-mauve-05 hover:text-night-80',
            )}
          >
            Ending screen
            {selection.kind === 'ending' && <span className="h-1.5 w-1.5 rounded-full bg-mauve" />}
          </button>
        </div>
      </div>

      {/* 2. Center Pane: Live preview (same FormRenderer as public /f/:slug) */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#F2F1EF] px-6 py-10">
        <FormRenderer
          formId="preview"
          slug="preview"
          title={previewTitle}
          definition={definition}
          preview={{
            pageIndex: activePageIndex,
            showEnding: selection.kind === 'ending',
            selectedFieldId: selection.kind === 'field' ? selection.fieldId : undefined,
            onSelectField: (pageId, fieldId) =>
              setSelection({ kind: 'field', pageId, fieldId }),
            onPageIndexChange: (index) => {
              const page = definition.pages[index]
              if (page) setSelection({ kind: 'page', pageId: page.id })
            },
            onShowEnding: () => setSelection({ kind: 'ending' }),
          }}
        />
      </div>

      {/* 3. Right Pane: Inspector Settings */}
      <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-mauve-10 bg-white p-6">
        {selectedField && selection.kind === 'field' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-mauve-10 pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mauve-05 text-xs font-semibold text-mauve">
                {typeMeta[selectedField.type].glyph}
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                {typeMeta[selectedField.type].label}
              </p>
            </div>
            <FieldInspector
              field={selectedField}
              onChange={(updated) =>
                patchPage(selection.pageId, (p) => ({
                  ...p,
                  fields: p.fields.map((f) => (f.id === updated.id ? updated : f)),
                }))
              }
            />
          </div>
        ) : selection.kind === 'page' && activePage ? (
          <div className="space-y-6">
            <div className="border-b border-mauve-10 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                Step configuration
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Internal title (optional)</Label>
              <Input
                id="page-title"
                value={activePage.title ?? ''}
                placeholder={`Step ${activePageIndex + 1}`}
                onChange={(e) =>
                  patchPage(activePage.id, (p) => ({
                    ...p,
                    title: e.target.value || undefined,
                  }))
                }
              />
              <p className="text-xs text-night-40 mt-1">This appears at the top of the form step to help users context switch.</p>
            </div>
          </div>
        ) : selection.kind === 'ending' ? (
          <div className="space-y-6">
             <div className="border-b border-mauve-10 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                Ending configuration
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="thanks">Thank-you message</Label>
              <Textarea
                id="thanks"
                rows={4}
                placeholder="Thanks for your submission!"
                value={definition.theme?.thankYouMessage ?? ''}
                onChange={(e) =>
                  onChange({
                    ...definition,
                    theme: {
                      ...definition.theme,
                      thankYouMessage: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
