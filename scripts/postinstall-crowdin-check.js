#!/usr/bin/env node
const { spawnSync } = require('child_process')

function runCommand(cmd, args) {
  const proc = spawnSync(cmd, args, { stdio: 'inherit', shell: false })
  return proc.status === 0
}

function isCrowdinAvailable() {
  // Try the common invocation first
  try {
    const ok = runCommand('crowdin', ['--version'])
    if (ok) return true
  } catch (e) {}

  // On Windows, try `where crowdin` as a fallback
  if (process.platform === 'win32') {
    try {
      const where = spawnSync('where', ['crowdin'], { stdio: 'ignore', shell: false })
      return where.status === 0
    } catch (e) {
      return false
    }
  }

  return false
}

;(async () => {
  const available = isCrowdinAvailable()

  if (!available) {
    console.log('crowdin CLI not found in PATH — skipping translations download')
    process.exit(0)
  }

  console.log('crowdin found — downloading sources and translations')

  if (!runCommand('crowdin', ['download', 'sources'])) {
    console.error('Failed to download sources using crowdin')
    process.exit(0)
  }

  if (!runCommand('crowdin', ['download', 'translations'])) {
    console.error('Failed to download translations using crowdin')
    process.exit(0)
  }

  process.exit(0)
})()
