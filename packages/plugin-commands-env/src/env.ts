import path from 'path'
import { docsUrl } from '@pnpm/cli-utils'
import PnpmError from '@pnpm/error'
import fetch from '@pnpm/fetch'
import cmdShim from '@zkochan/cmd-shim'
import renderHelp from 'render-help'
import semver from 'semver'
import versionSelectorType from 'version-selector-type'
import { getNodeDir, NvmNodeCommandOptions } from './node'

export function rcOptionsTypes () {
  return {}
}

export function cliOptionsTypes () {
  return {
    global: Boolean,
  }
}

export const commandNames = ['env']

export function help () {
  return renderHelp({
    description: 'Install and use the specified version of Node.js',
    descriptionLists: [
      {
        title: 'Options',

        list: [
          {
            description: 'Installs Node.js globally',
            name: '--global',
            shortAlias: '-g',
          },
        ],
      },
    ],
    url: docsUrl('env'),
    usages: [
      'pnpm env use --global <version>',
    ],
  })
}

export async function handler (opts: NvmNodeCommandOptions, params: string[]) {
  if (params.length === 0) {
    throw new PnpmError('ENV_NO_SUBCOMMAND', 'Please specify the subcommand')
  }
  switch (params[0]) {
  case 'use': {
    if (!opts.global) {
      throw new PnpmError('NOT_IMPLEMENTED_YET', '"pnpm env use <version>" can only be used with the "--global" option currently')
    }
    const nodeVersion = await resolveNodeVersion(params[1])
    if (!nodeVersion) {
      throw new PnpmError('COULD_NOT_RESOLVE_NODEJS', `Couldn't find Node.js version matching ${params[1]}`)
    }
    const nodeDir = await getNodeDir({
      ...opts,
      useNodeVersion: nodeVersion,
    })
    const src = path.join(nodeDir, process.platform === 'win32' ? 'node.exe' : 'node')
    const dest = path.join(opts.bin, 'node')
    await cmdShim(src, dest)
    return `Node.js ${nodeVersion} is activated
  ${dest} -> ${src}`
  }
  default: {
    throw new PnpmError('ENV_UNKNOWN_SUBCOMMAND', 'This subcommand is not known')
  }
  }
}

interface NodeVersion {
  version: string
  lts: false | string
}

async function resolveNodeVersion (versionSelector: string) {
  const response = await fetch('https://nodejs.org/download/release/index.json')
  let versions = (await response.json()) as NodeVersion[]
  if (versionSelector === 'lts') {
    versions = versions.filter(({ lts }) => lts !== false)
    versionSelector = '*'
  } else {
    const vst = versionSelectorType(versionSelector)
    if (vst?.type === 'tag') {
      versions = versions.filter(({ lts }) => typeof lts === 'string' && lts.toLowerCase() === vst.normalized.toLowerCase())
      versionSelector = '*'
    }
  }
  const pickedVersion = semver.maxSatisfying(versions.map(({ version }) => version), versionSelector)
  if (!pickedVersion) return pickedVersion
  return pickedVersion.substring(1)
}
