/**
 * Plugins settings surface, browser half — one section whose feature-owned
 * tabs include configurable Host plugin cards and read-only inventory.
 *
 * The section declares `settings.plugins.tab`; its own `configurable` tab then
 * declares `settings.plugin.item` and renders whatever cards were registered
 * into it. The three cards this package ships are the host-plane sections the
 * deployment already exposes; each binds its namespace through the client
 * settings scope, which keeps them unaware of one another and of other tabs.
 */

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings shell's SlotMap merge (the 'settings.section' entry)
// and the ctx.settingsScope Context merge. Cross-plugin collaboration goes
// through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the ctx.remote Context merge and the forwarded-event key face.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { AgentLoopCard } from './AgentLoopCard.tsx'
import { BashCard } from './BashCard.tsx'
import { ConfigurablePluginsTab } from './ConfigurablePluginsTab.tsx'
import type { ConfigurablePluginsTabInjected } from './ConfigurablePluginsTab.tsx'
import { GenericCard } from './GenericCard.tsx'
import { PluginsSettingsSection } from './PluginsSettingsSection.tsx'
import type { PluginsSettingsSectionInjected, PluginsSettingsTabEntry } from './PluginsSettingsSection.tsx'
import { WebSearchCard } from './WebSearchCard.tsx'
import { AGENT_LOOP_NS, AgentLoopCardController } from './agent-loop-card-controller.ts'
import { BashCardController, SHELL_NS } from './bash-card-controller.ts'
import { GenericCardController, genericFieldsFromSchema } from './generic-card-controller.ts'
import { WEB_SEARCH_NS, WebSearchCardController } from './web-search-card-controller.ts'
import { en, zh } from './locales.ts'

export type { PluginsSettingsSectionInjected, PluginsSettingsSectionProps } from './PluginsSettingsSection.tsx'
export type { ConfigurablePluginsTabInjected, ConfigurablePluginsTabProps } from './ConfigurablePluginsTab.tsx'
export type { PluginCardProps } from './PluginCard.tsx'
export type { SettingsPluginItemOwnerProps } from './slot-contract.ts'
export type { FieldProps } from './fields.tsx'
export type {
  CardActions, CardFieldSpec, CardFieldState, CardSecretSpec, CardShell,
} from './card-form.ts'
export type { AgentLoopCardFace, AgentLoopCardState } from './agent-loop-card-controller.ts'
export type { BashCardFace, BashCardState } from './bash-card-controller.ts'
export type {
  GenericCardFace, GenericCardState, GenericField, GenericFieldKind,
} from './generic-card-controller.ts'
export type { WebSearchCardFace, WebSearchCardState } from './web-search-card-controller.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'settings.plugins'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

/**
 * Mount the plugin configuration section and the cards this package ships.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-plugins: section dictionaries')

  const bash = new BashCardController(ctx.settingsScope.bind({ namespace: SHELL_NS }))
  const agentLoop = new AgentLoopCardController(ctx.settingsScope.bind({ namespace: AGENT_LOOP_NS }))
  const webSearch = new WebSearchCardController(ctx.settingsScope.bind({ namespace: WEB_SEARCH_NS }), api)

  // The credential a card reports is not part of any settings section, so its
  // scope publishes nothing when one is written. This is the only signal that
  // a key written on another surface reached the Host.
  ctx.effect(
    () => ctx.remote.$on('credentials/updated', (ref) => { webSearch.refreshCredential(ref) }),
    'ui-settings-plugins: credential invalidations',
  )

  let tabsVersion = -1
  let tabsRevision = -1
  let tabs: readonly PluginsSettingsTabEntry[] = []
  const sectionInjected = (): PluginsSettingsSectionInjected => ({
    hooks: {
      tabs: {
        getSnapshot: () => {
          const version = ctx.slots.getVersion('settings.plugins.tab')
          const revision = ctx.locale.getSnapshot().revision
          if (version !== tabsVersion || revision !== tabsRevision) {
            tabsVersion = version
            tabsRevision = revision
            tabs = ctx.slots.entries('settings.plugins.tab')
              .map(entry => ({
                /* v8 ignore next -- list-slot registration requires id */
                id: entry.options.id ?? '',
                order: entry.options.order ?? 0,
                label: resolveSlotLabel(entry.options.label) ?? '',
              }))
              .sort((a, b) => a.order - b.order)
          }
          return tabs
        },
        subscribe: (listener) => {
          const offLedger = ctx.slots.subscribe('settings.plugins.tab', listener)
          const offLocale = ctx.locale.subscribe(listener)
          return () => {
            offLedger()
            offLocale()
          }
        },
      },
    },
  })

  // This package owns the one Plugins navigation entry and the tab chrome;
  // feature plugins contribute pages without competing for Settings nav rows.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'plugins',
    order: 15,
    label: () => t('nav'),
    locale: NS,
    inject: sectionInjected,
    children: { 'settings.plugins.tab': { kind: 'list', scope: 'root' } },
  }, PluginsSettingsSection))

  // The existing configuration page is one ordinary tab. It keeps ownership
  // of the card slot and the three shipped card contributions below.
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'configurable',
    order: 0,
    label: () => t('configurableTab'),
    locale: NS,
    inject: (): ConfigurablePluginsTabInjected => ({
      cardCount: ctx.slots.entries('settings.plugin.item').length,
    }),
    children: { 'settings.plugin.item': { kind: 'list', scope: 'root' } },
  }, ConfigurablePluginsTab))

  ctx.slots.inject('settings.plugin.item', function* () {
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      id: 'bash',
      order: 0,
      locale: NS,
      inject: () => bash.inject(),
    }, BashCard)
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      id: 'agent-loop',
      order: 10,
      locale: NS,
      inject: () => agentLoop.inject(),
    }, AgentLoopCard)
    yield ctx.slots.register({
      name: 'settings.plugin.item',
      id: 'web-search',
      order: 20,
      locale: NS,
      inject: () => webSearch.inject(),
    }, WebSearchCard)
  })

  registerGenericCards(ctx)
}

/**
 * Namespaces owned by this deployment's own surfaces — the three dedicated
 * cards above, plus every namespace a built-in package registers for its own
 * UI or Host feature. Only a namespace a custom plugin registers gets a
 * generated card. Keep in sync with `settingsNamespace('…')` registrations
 * under packages/ and apps/.
 */
const OWNED_NAMESPACES: ReadonlySet<string> = new Set([
  SHELL_NS,
  AGENT_LOOP_NS,
  WEB_SEARCH_NS,
  'adapter',
  'agent-default-model',
  'agent-presets',
  'editor',
  'llm-deepseek',
  'llm-pi-ai',
  'locale',
  'permission',
  'ui-conversation',
  'ui-onboarding',
  'ui-theme',
  'workspace',
])

/** Attempts before the first successful describe, spaced for a settling connection. */
const DESCRIBE_ATTEMPTS = 5
const DESCRIBE_RETRY_MS = 1000

/**
 * Contribute one generated card for every served namespace no dedicated card
 * owns. The namespace list only exists across the settings wire, so the
 * registrations follow an async describe; the disposers join this plugin's
 * lifecycle, keeping the cards from outliving it.
 * @param ctx - the browser plugin context.
 */
function registerGenericCards(ctx: ClientContext): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const disposers: (() => void)[] = []
  let disposed = false
  ctx.effect(() => () => {
    disposed = true
    for (const dispose of disposers.splice(0)) dispose()
  }, 'ui-settings-plugins: generated cards')

  void (async () => {
    for (let attempt = 1; attempt <= DESCRIBE_ATTEMPTS; attempt += 1) {
      if (disposed) return
      let namespaces: { ns: string; schema: unknown }[] | undefined
      try {
        const response = await api.settings.describe({})
        if (response.result.ok) namespaces = response.result.value.namespaces
      } catch (_settingsReadFailure) {
        namespaces = undefined
      }
      if (namespaces === undefined) {
        if (attempt < DESCRIBE_ATTEMPTS) await new Promise(r => setTimeout(r, DESCRIBE_RETRY_MS))
        continue
      }
      if (disposed) return
      let order = 100
      for (const view of namespaces) {
        if (OWNED_NAMESPACES.has(view.ns)) continue
        // One malformed namespace costs only its own card: field projection
        // is total, and a registration failure here skips to the next view.
        const fields = genericFieldsFromSchema(view as Parameters<typeof genericFieldsFromSchema>[0])
        const controller = new GenericCardController(
          ctx.settingsScope.bind({ namespace: view.ns }),
          view.ns,
          fields,
        )
        disposers.push(ctx.slots.register({
          name: 'settings.plugin.item',
          id: `generic-${view.ns}`,
          order,
          locale: NS,
          inject: () => controller.inject(),
        }, GenericCard))
        order += 10
      }
      return
    }
    console.warn('ui-settings-plugins: settings.describe failed; no generated plugin cards were registered')
  })().catch((error) => {
    console.warn('ui-settings-plugins: generated plugin card registration failed', error)
  })
}
