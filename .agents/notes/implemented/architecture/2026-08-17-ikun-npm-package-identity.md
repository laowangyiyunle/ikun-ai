# Agent Note: Ikun npm package identity

Status: implemented

English | [中文](2026-08-17-ikun-npm-package-identity.zh.md)

## Problem

An npm CLI resolves its package and every runtime dependency by package name. Publishing only a renamed CLI while its dependencies remain in `@deepseek-ai` would leave `npx @ikun-ai/ikun` unable to install its runtime closure from the owning organization.

## Decision

The installable CLI is `@ikun-ai/ikun` and exposes the `ikun` binary. Every repository-owned workspace package, including the vendored Cordis framework packages, publishes in the `@ikun-ai` scope; the existing `dsh-*` suffixes and `DSH_*` local-state variables remain runtime identifiers.

The repository metadata points to `laowangyiyunle/ikun-ai`. The shared application release family is `ikun`, its tags use `ikun-v<version>`, and its release workflow verifies and publishes the same package set under that identity.

## Alternatives considered

- **Rename only `@deepseek-ai/dsh`** — the CLI would retain dependencies that its new organization cannot publish or serve.
- **Rename every `dsh-*` suffix and local-state identifier** — this changes internal APIs and on-disk locations without helping package installation.

## Consequences

- Users install the CLI with `npx @ikun-ai/ikun` and run `ikun`.
- The release workflow publishes the complete `@ikun-ai` runtime set, so packed-install verification exercises the same names consumers resolve.
- `@deepseek-ai/dsh` and the `dsh` binary are not compatibility aliases before the first tagged release.
