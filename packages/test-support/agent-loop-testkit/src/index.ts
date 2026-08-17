/**
 * Shared mounting for the services required before tests load the concrete
 * agent loop. The caller retains ownership of the context, loop, adapters,
 * optional plugins, and teardown.
 * @module @ikun-ai/dsh-agent-loop-testkit
 */

import type { Context } from '@ikun-ai/cordis'
import AgentRegistry from '@ikun-ai/dsh-agent'
import LlmRuntime from '@ikun-ai/dsh-llm'
import SessionStore from '@ikun-ai/dsh-session'
import SystemPrompt from '@ikun-ai/dsh-system-prompt'
import type { Config as SystemPromptConfig } from '@ikun-ai/dsh-system-prompt'
import ToolRuntime from '@ikun-ai/dsh-tools'
import type { Config as ToolRuntimeConfig } from '@ikun-ai/dsh-tools'

/** Configuration forwarded to the prerequisite service plugins. */
export interface AgentLoopTestDependenciesOptions {
  /** Configuration for the system-prompt registry. */
  readonly systemPrompt?: SystemPromptConfig
  /** Configuration for the tool registry. */
  readonly tools?: ToolRuntimeConfig
}

/**
 * Mount the standard prerequisite services for an AgentLoop test.
 *
 * The function deliberately does not mount AgentLoop or register an adapter,
 * so tests retain control of load order and the topology under test. The
 * context owns every mounted service and remains responsible for disposal. A
 * plugin-load failure rejects the promise; services activated earlier in the
 * sequence remain context-owned and unwind with that context.
 * @param ctx - test context that owns the mounted services.
 * @param options - optional service configuration forwarded without mutation.
 * @returns after every prerequisite service has activated.
 */
export async function mountAgentLoopTestDependencies(
  ctx: Context,
  options: AgentLoopTestDependenciesOptions = {},
): Promise<void> {
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt, options.systemPrompt ?? {})
  await ctx.plugin(ToolRuntime, options.tools ?? {})
  await ctx.plugin(AgentRegistry)
}
