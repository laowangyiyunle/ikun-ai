#!/usr/bin/env node

import { Context } from '@ikun-ai/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@ikun-ai/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@ikun-ai/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
