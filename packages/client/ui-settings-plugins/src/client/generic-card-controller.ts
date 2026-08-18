/**
 * The generic card's staged form over any settings namespace served without a
 * dedicated card. Fields are derived from the namespace's rehydrated schema:
 * scalars (string, number, boolean) and const-union enums become editable
 * controls; everything else (nested objects, arrays, secrets) stays out of the
 * generated card rather than rendering a control that cannot round-trip.
 */

import type { SettingsScope, SnapshotStore } from '@ikun-ai/dsh-client-runtime/client'
import { rehydrateSchema, type SchemaNode } from '@ikun-ai/dsh-client-schema-form'
import type { SettingsNamespaceView } from '@ikun-ai/dsh-api-remotes/client'
import { CardForm, numberField, textField, type CardActions, type CardFieldSpec, type CardFieldState, type CardShell } from './card-form.ts'
/** The control one generated field renders. */
export type GenericFieldKind = 'text' | 'number' | 'select' | 'boolean'

/** One field of a generated card, projected from the namespace schema. */
export interface GenericField {
  /** Field name inside the namespace section. */
  name: string
  /** Control this field renders. */
  kind: GenericFieldKind
  /** Served choices for `select` fields. */
  options?: readonly string[]
  /** Copy for the field's label; defaults to the field name. */
  label: string
  /** Copy for the line under the control; the schema description when present. */
  hint: string
  /** Schema default rendered as the empty-choice placeholder when present. */
  fallback?: string
}

/** What the generic card renders. */
export interface GenericCardState extends CardShell {
  /** The generated fields, in schema order. */
  fields: readonly GenericField[]
  /** Each field's staged state, keyed by field name. */
  fieldStates: ReadonlyMap<string, CardFieldState>
}

/** The registration-side face the generic card's slot entry injects. */
export interface GenericCardFace extends CardActions {
  /** The namespace this generated card edits; shown as the card's name. */
  namespace: string
  hooks: {
    /** Card snapshot bound by the renderer as useGenericCard. */
    genericCard: SnapshotStore<GenericCardState>
  }
}

/**
 * A staged enum field. An empty draft clears the field so the section
 * re-inherits the schema default; a draft outside the served choices blocks
 * the save rather than rewriting it.
 * @param field - field name inside the namespace section.
 * @param options - the string constants the schema union serves.
 * @returns the field's conversion spec.
 */
function selectField(field: string, options: readonly string[]): CardFieldSpec {
  return {
    field,
    format: value => typeof value === 'string' && options.includes(value) ? value : '',
    parse: (text) => {
      const trimmed = text.trim()
      if (trimmed === '') return { kind: 'clear' }
      return options.includes(trimmed) ? { kind: 'set', value: trimmed } : undefined
    },
  }
}

/**
 * A staged boolean field. The empty draft clears the field; `true` and
 * `false` stage the literal they name.
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
function booleanField(field: string): CardFieldSpec {
  return {
    field,
    format: value => typeof value === 'boolean' ? String(value) : '',
    parse: (text) => {
      const trimmed = text.trim()
      if (trimmed === '') return { kind: 'clear' }
      if (trimmed === 'true') return { kind: 'set', value: true }
      if (trimmed === 'false') return { kind: 'set', value: false }
      return undefined
    },
  }
}

/** Copy shown for a schema description that carries none. */
const NO_HINT = ''

/**
 * Project one rehydrated object-schema property onto a generated field, or
 * undefined when the property is not one this card can round-trip.
 * @param name - the property's field name.
 * @param node - the property's rehydrated schema node.
 * @returns the generated field, or undefined to skip the property.
 */
function fieldFromSchema(name: string, node: SchemaNode): GenericField | undefined {
  const meta = node.meta ?? {}
  if (meta.hidden === true || meta.disabled === true) return undefined
  if (meta.role === 'secret') return undefined
  const hint = typeof meta.description === 'string' ? meta.description : NO_HINT
  const label = name
  const fallback = meta.default !== undefined && meta.default !== null ? String(meta.default) : undefined
  if (node.type === 'string') {
    return { name, kind: 'text' as const, label, hint, ...(fallback !== undefined ? { fallback } : {}) }
  }
  if (node.type === 'number') {
    return { name, kind: 'number' as const, label, hint, ...(fallback !== undefined ? { fallback } : {}) }
  }
  if (node.type === 'boolean') {
    return { name, kind: 'boolean' as const, label, hint, ...(fallback !== undefined ? { fallback } : {}) }
  }
  if (node.type === 'union') {
    const list = node.list ?? []
    // String consts only: a numeric (or other-typed) const union cannot
    // round-trip through this text-based select, so it stays out of the card
    // rather than rendering a control every save would refuse.
    const options = list.map(item =>
      item.type === 'const' && typeof item.value === 'string' ? item.value : undefined)
    if (options.length === 0 || options.some(option => option === undefined)) return undefined
    return {
      name,
      kind: 'select' as const,
      label,
      hint,
      options: options as string[],
      ...(fallback !== undefined ? { fallback } : {}),
    }
  }
  return undefined
}

/**
 * Derive the generated fields from one served namespace view. An absent or
 * non-object schema yields no fields; the card then renders its shell only.
 * @param view - the namespace view `settings.describe` served.
 * @returns the generated fields, in schema order.
 */
export function genericFieldsFromSchema(view: SettingsNamespaceView): GenericField[] {
  try {
    const root = rehydrateSchema(view.schema)
    const dict = root.type === 'object' ? root.dict : undefined
    if (dict === undefined || typeof dict !== 'object') return []
    const fields: GenericField[] = []
    for (const [name, node] of Object.entries(dict)) {
      const field = node === null || typeof node !== 'object'
        ? undefined
        : fieldFromSchema(name, node)
      if (field !== undefined) fields.push(field)
    }
    return fields
  } catch (_malformedSchemaEnvelope) {
    // A hand-crafted or corrupted envelope vouches for no fields; one broken
    // namespace costs only its own card, never the registrations after it.
    return []
  }
}

/** Bridges any settings namespace onto a generated card's staged form. */
export class GenericCardController {
  private readonly form: CardForm<Record<string, unknown>>
  private readonly store: SnapshotStore<GenericCardState>

  /**
   * @param scope - the bound settings scope for this card's namespace.
   * @param namespace - the namespace's served name, shown as the card's title.
   * @param fields - the fields projected from the namespace's served schema.
   */
  constructor(
    scope: SettingsScope<Record<string, unknown>>,
    private readonly namespace: string,
    fields: readonly GenericField[],
  ) {
    const specs: CardFieldSpec[] = fields.map((field) => {
      switch (field.kind) {
        case 'number': return numberField(field.name)
        case 'select': return selectField(field.name, field.options ?? [])
        case 'boolean': return booleanField(field.name)
        default: return textField(field.name)
      }
    })
    this.form = new CardForm(scope, specs)
    this.store = this.form.bind(() => this.projection(fields))
  }

  private projection(fields: readonly GenericField[]): GenericCardState {
    const fieldStates = new Map<string, CardFieldState>()
    for (const field of fields) fieldStates.set(field.name, this.form.field(field.name))
    return { ...this.form.shell(), fields, fieldStates }
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the namespace's name, the card's snapshot, and its form actions.
   */
  inject(): GenericCardFace {
    return { namespace: this.namespace, hooks: { genericCard: this.store }, ...this.form.actions() }
  }
}
