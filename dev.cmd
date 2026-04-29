@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\.bin\netlify.cmd" (
  echo Installing project dependencies...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)

call node scripts\sync-public.mjs
if errorlevel 1 exit /b 1

call "node_modules\.bin\netlify.cmd" dev --port 8888
