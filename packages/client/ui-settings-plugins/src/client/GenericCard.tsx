/** The generated card: one settings namespace served without a dedicated card. */

import type { InjectFace, PropsLocale, PropsRuntime } from '@ikun-ai/dsh-client-ui-slots'
import { SelectField, ValueField } from './fields.tsx'
import { PluginCard } from './PluginCard.tsx'
import type { GenericCardFace } from './generic-card-controller.ts'
import type {} from './slot-contract.ts'

/** Props the renderer binds for a generated card. */
export type GenericCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'settings.plugins'>
  & InjectFace<GenericCardFace>

/**
 * Render one generated plugin card.
 * @param props - locale copy, the namespace's name, the card snapshot, and its form actions.
 * @returns the card.
 */
export function GenericCard(props: GenericCardProps) {
  const { t } = props
  const state = props.useGenericCard(snapshot => snapshot)
  const disabled = !state.writable
  const namespace = props.namespace ?? ''
  return (
    <PluginCard
      t={t}
      title={namespace}
      description={t('genericCardDescription')}
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      {state.fields.length === 0
        ? <p>{t('genericNoFields')}</p>
        : state.fields.map((field) => {
          const fieldState = state.fieldStates.get(field.name)
          if (fieldState === undefined) return null
          const id = `plugin-config-generic-${namespace}-${field.name}`
          if (field.kind === 'select' || field.kind === 'boolean') {
            const options = field.kind === 'select' && field.options !== undefined
              ? field.options
              : ['true', 'false']
            return (
              <SelectField
                key={field.name}
                id={id}
                label={field.label}
                hint={field.hint !== '' ? field.hint : (field.fallback !== undefined ? `${t('genericUseDefault')}: ${field.fallback}` : '')}
                options={options}
                defaultLabel={field.fallback !== undefined ? `${t('genericUseDefault')} (${field.fallback})` : t('genericUseDefault')}
                overriddenLabel={t('overridden')}
                resetLabel={t('reset')}
                invalidLabel={t('invalidValue')}
                disabled={disabled}
                {...fieldState}
                onEdit={(text) => { props.edit(field.name, text) }}
                onReset={() => { props.resetField(field.name) }}
              />
            )
          }
          return (
            <ValueField
              key={field.name}
              id={id}
              label={field.label}
              hint={field.hint !== '' ? field.hint : (field.fallback !== undefined ? `${t('genericUseDefault')}: ${field.fallback}` : '')}
              placeholder={field.fallback ?? ''}
              overriddenLabel={t('overridden')}
              resetLabel={t('reset')}
              invalidLabel={field.kind === 'number' ? t('invalidNumber') : t('invalidValue')}
              numeric={field.kind === 'number'}
              disabled={disabled}
              {...fieldState}
              onEdit={(text) => { props.edit(field.name, text) }}
              onReset={() => { props.resetField(field.name) }}
            />
          )
        })}
    </PluginCard>
  )
}
