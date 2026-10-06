@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  set "SISTEMA_NODE=node"
) else (
  if exist "C:\Users\Murilo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "SISTEMA_NODE=C:\Users\Murilo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Node.js nao encontrado. Solicite ajuda para instalar o Node.js.
    pause
    exit /b 1
  )
)
"%SISTEMA_NODE%" -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>24||major===24&&minor>=7?0:1)"
if errorlevel 1 (
  echo Esta versao precisa do Node.js 24.7 ou mais recente.
  pause
  exit /b 1
)
echo Fundacao V1 local. No primeiro acesso, escolha seu login e senha.
echo O codigo de instalacao esta em data\PRIMEIRO-ACESSO.txt.
echo Mantenha esta janela aberta enquanto utilizar o sistema.
start "" http://127.0.0.1:3210
"%SISTEMA_NODE%" server.js
pause
