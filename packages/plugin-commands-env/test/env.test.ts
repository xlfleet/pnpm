import fs from 'fs'
import path from 'path'
import PnpmError from '@pnpm/error'
import { tempDir } from '@pnpm/prepare'
import { env } from '@pnpm/plugin-commands-env'
import execa from 'execa'
import PATH from 'path-name'

test('install node by exact version', async () => {
  tempDir()

  await env.handler({
    bin: process.cwd(),
    global: true,
    pnpmHomeDir: process.cwd(),
    rawConfig: {},
  }, ['use', '16.4.0'])

  const { stdout } = execa.sync('node', ['-v'], {
    env: {
      [PATH]: `${process.cwd()}${path.delimiter}${process.env[PATH] as string}`,
    },
  })
  expect(stdout.toString()).toBe('v16.4.0')

  const dirs = fs.readdirSync(path.resolve('nodejs'))
  expect(dirs).toEqual(['16.4.0'])
})

test('install node by version range', async () => {
  tempDir()

  await env.handler({
    bin: process.cwd(),
    global: true,
    pnpmHomeDir: process.cwd(),
    rawConfig: {},
  }, ['use', '6'])

  const { stdout } = execa.sync('node', ['-v'], {
    env: {
      [PATH]: `${process.cwd()}${path.delimiter}${process.env[PATH] as string}`,
    },
  })
  expect(stdout.toString()).toBe('v6.17.1')

  const dirs = fs.readdirSync(path.resolve('nodejs'))
  expect(dirs).toEqual(['6.17.1'])
})

test('fail if a non-existend Node.js version is tried to be installed', async () => {
  tempDir()

  await expect(
    env.handler({
      bin: process.cwd(),
      global: true,
      pnpmHomeDir: process.cwd(),
      rawConfig: {},
    }, ['use', '6.999'])
  ).rejects.toEqual(new PnpmError('COULD_NOT_RESOLVE_NODEJS', 'Couldn\'t find Node.js version matching 6.999'))
})
