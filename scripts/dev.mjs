import { spawn } from 'node:child_process'

const opts = { stdio: 'inherit', shell: true }

spawn('npx', ['vite'], opts)
spawn('node', ['--experimental-strip-types', '--watch', 'server/index.ts'], opts)

console.log('DepthGuard dev: Vite + Agent API starting…')
