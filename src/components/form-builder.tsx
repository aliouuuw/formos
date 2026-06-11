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

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formProgressPercent, formStepLabel } from '#/lib/form-progress'
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
        selected ? 'bg-mauve-10 ring-1 ring-mauve-20' : 'hover:bg-mauve-05/60',
        isDragging && 'z-10 opacity-70',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-0.5 text-mauve-60 opacity-60 transition-opacity duration-150 hover:text-mauve group-hover:opacity-100 active:cursor-grabbing"
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
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold',
            selected ? 'bg-mauve text-white' : 'bg-mauve-05 text-mauve',
          )}
          aria-hidden
        >
          {typeMeta[field.type].glyph}
        </span>
        <span
          className={cn(
            'truncate text-sm',
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
        className="rounded p-1 text-mauve-60 opacity-60 transition-opacity duration-150 hover:text-red-600 group-hover:opacity-100"
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
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="insp-label">{field.type === 'checkbox' ? 'Label' : 'Question'}</Label>
        <Input
          id="insp-label"
          value={field.label}
          placeholder={field.type === 'checkbox' ? 'Shown beside the checkbox' : undefined}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </div>
      {field.type !== 'checkbox' ? (
        <div className="space-y-1.5">
          <Label htmlFor="insp-placeholder">Placeholder</Label>
          <Input
            id="insp-placeholder"
            value={field.placeholder ?? ''}
            placeholder="Shown inside the input"
            onChange={(e) => onChange({ ...field, placeholder: e.target.value || undefined })}
          />
        </div>
      ) : null}
      {field.type === 'select' ? (
        <div className="space-y-1.5">
          <Label htmlFor="insp-options">Choices, one per line</Label>
          <Textarea
            id="insp-options"
            rows={4}
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
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-mauve-10 px-3 py-2.5">
        <span className="text-sm text-night-80">Required</span>
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
/* Live preview                                                         */
/* ------------------------------------------------------------------ */

function PreviewField({
  field,
  selected,
  onSelect,
}: {
  field: FormField
  selected: boolean
  onSelect: () => void
}) {
  const inputClass =
    'pointer-events-none flex h-10 w-full items-center rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-placeholder'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
      className={cn(
        '-mx-3 cursor-pointer space-y-2 rounded-xl px-3 py-2.5 transition-shadow duration-150',
        selected
          ? 'shadow-[0_0_0_2px_var(--mauve)]'
          : 'hover:shadow-[0_0_0_1px_var(--mauve-20,rgba(70,29,76,0.2))]',
      )}
    >
      {field.type !== 'checkbox' ? (
        <p className="text-sm font-medium text-night-80">
          {field.label || 'Untitled field'}
          {field.required ? <span className="text-mauve"> *</span> : null}
        </p>
      ) : null}

      {field.type === 'long_text' ? (
        <div className={cn(inputClass, 'h-20 items-start py-2')}>{field.placeholder ?? ''}</div>
      ) : field.type === 'select' ? (
        <div className={cn(inputClass, 'justify-between')}>
          <span>{field.options?.[0] ?? 'Select…'}</span>
          <span aria-hidden>▾</span>
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="pointer-events-none flex items-center gap-3 py-1">
          <span className="h-4 w-4 rounded border border-mauve/30 bg-white" />
          <span className="text-sm text-night-80">
            {field.label}
            {field.required ? <span className="text-mauve"> *</span> : null}
          </span>
        </div>
      ) : (
        <div className={inputClass}>{field.placeholder ?? ''}</div>
      )}
    </div>
  )
}

function Preview({
  definition,
  pageIndex,
  selection,
  onSelectField,
  ending,
}: {
  definition: FormDefinition
  pageIndex: number
  selection: Selection
  onSelectField: (pageId: string, fieldId: string) => void
  ending: boolean
}) {
  const page = definition.pages[pageIndex]
  const progress = formProgressPercent(pageIndex, definition.pages.length, ending)

  return (
    <div className="flex min-h-[480px] items-start justify-center bg-[var(--summit-ivory)] px-4 py-10 sm:px-8">
      <div className="w-full max-w-md rounded-2xl border border-mauve-10 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_32px_rgba(70,29,76,0.06)]">
        <div className="mb-7 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
            <span>{formStepLabel(pageIndex, definition.pages.length, ending)}</span>
            {progress !== null ? <span className="tabular-nums">{progress}%</span> : null}
          </div>
          {progress !== null ? (
            <div className="h-1 overflow-hidden rounded-full bg-mauve-10">
              <div
                className="h-full rounded-full bg-mauve transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>

        {ending ? (
          <div className="space-y-3 py-10 text-center">
            <p className="text-2xl" aria-hidden>
              ✓
            </p>
            <p className="text-lg font-semibold text-night-80">
              {definition.theme?.thankYouMessage?.trim() || 'Thanks for your submission!'}
            </p>
          </div>
        ) : page ? (
          <>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-night-80">
              {page.title?.trim() || `Step ${pageIndex + 1}`}
            </h2>
            <div className="space-y-4">
              {page.fields.length === 0 ? (
                <p className="rounded-xl border border-dashed border-mauve-20 px-4 py-10 text-center text-sm text-text-secondary">
                  This step is empty. Add a field from the left.
                </p>
              ) : (
                page.fields.map((field) => (
                  <PreviewField
                    key={field.id}
                    field={field}
                    selected={selection.kind === 'field' && selection.fieldId === field.id}
                    onSelect={() => onSelectField(page.id, field.id)}
                  />
                ))
              )}
            </div>
            <div className="pointer-events-none mt-8">
              <span className="inline-flex h-10 items-center rounded-full bg-mauve px-6 text-sm font-medium text-white opacity-90">
                {pageIndex === definition.pages.length - 1 ? 'Submit' : 'Continue'}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Builder                                                              */
/* ------------------------------------------------------------------ */

export function FormBuilder({
  definition,
  onChange,
}: {
  definition: FormDefinition
  onChange: (definition: FormDefinition) => void
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
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Structure rail */}
      <div className="space-y-5">
        <div className="space-y-4">
          {definition.pages.map((page, pi) => {
            const isActivePage = activePageId === page.id
            return (
              <section key={page.id}>
                <div
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5',
                    isActivePage && selection.kind === 'page' && 'bg-mauve-10 ring-1 ring-mauve-20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: 'page', pageId: page.id })}
                    className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                  >
                    <span className="text-[11px] font-semibold tabular-nums text-text-label">
                      {pi + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-night-80">
                      {page.title?.trim() || `Step ${pi + 1}`}
                    </span>
                  </button>
                  <div className="flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => movePage(page.id, -1)}
                      disabled={pi === 0}
                      className="rounded p-1 text-mauve-60 hover:text-mauve disabled:opacity-30"
                      aria-label="Move step up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => movePage(page.id, 1)}
                      disabled={pi === definition.pages.length - 1}
                      className="rounded p-1 text-mauve-60 hover:text-mauve disabled:opacity-30"
                      aria-label="Move step down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      disabled={definition.pages.length <= 1}
                      className="rounded p-1 text-mauve-60 hover:text-red-600 disabled:opacity-30"
                      aria-label="Delete step"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="mt-1 space-y-0.5 pl-3">
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

                  {addingTo === page.id ? (
                    <div className="grid grid-cols-2 gap-1 py-1.5 pr-2">
                      {fieldTypes.map(({ type, label, glyph }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addField(page.id, type)}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-night-60 transition-colors duration-150 hover:bg-mauve-05 hover:text-night-80"
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-mauve-05 text-[11px] font-semibold text-mauve"
                            aria-hidden
                          >
                            {glyph}
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTo(page.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-mauve transition-colors duration-150 hover:bg-mauve-05"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-mauve-20 text-xs">
                        +
                      </span>
                      Add field
                    </button>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-mauve-10 pt-4">
          <Button size="sm" variant="secondary" onClick={addPage}>
            + Add step
          </Button>
          <button
            type="button"
            onClick={() => setSelection({ kind: 'ending' })}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-medium transition-colors duration-150',
              selection.kind === 'ending'
                ? 'bg-mauve-05 text-mauve'
                : 'text-night-60 hover:text-mauve',
            )}
          >
            Ending
          </button>
        </div>

        {/* Inspector */}
        {selectedField && selection.kind === 'field' ? (
          <div className="space-y-4 border-t border-mauve-10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
              {typeMeta[selectedField.type].label} settings
            </p>
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
          <div className="space-y-4 border-t border-mauve-10 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Step title</Label>
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
            </div>
          </div>
        ) : selection.kind === 'ending' ? (
          <div className="space-y-4 border-t border-mauve-10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
              Ending
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="thanks">Thank-you message</Label>
              <Textarea
                id="thanks"
                rows={3}
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

      {/* Live preview */}
      <Preview
        definition={definition}
        pageIndex={activePageIndex}
        selection={selection}
        ending={selection.kind === 'ending'}
        onSelectField={(pageId, fieldId) => setSelection({ kind: 'field', pageId, fieldId })}
      />
    </div>
  )
}
