#!/usr/bin/env node
// Starts both the backend API server and Vite dev server simultaneously
import { spawn } from 'child_process';

console.log('🚀 Starting backend server (port 3001) + frontend (port 5000)...\n');

const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: false,
});

const frontend = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
});

backend.on('error', (e) => console.error('[backend error]', e.message));
frontend.on('error', (e) => console.error('[frontend error]', e.message));

backend.on('close', (code) => {
  console.log(`[backend] exited with code ${code}`);
  frontend.kill();
});

frontend.on('close', (code) => {
  console.log(`[frontend] exited with code ${code}`);
  backend.kill();
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
