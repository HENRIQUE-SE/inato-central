$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$auditoriaRoot = Join-Path $projectRoot "src\core\auditoria"
$tempRoot = Join-Path $projectRoot (".tmp-auditoria-" + [guid]::NewGuid())
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0

$sourceFiles = @(
  (Join-Path $auditoriaRoot "constants.ts"),
  (Join-Path $auditoriaRoot "types.ts"),
  (Join-Path $auditoriaRoot "data.ts"),
  (Join-Path $auditoriaRoot "service.ts"),
  (Join-Path $auditoriaRoot "service.test.ts")
)

try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) {
    throw "TypeScript local não encontrado em node_modules."
  }

  New-Item -ItemType Directory -Path $tempRoot | Out-Null

  & $tscPath `
    --target ES2023 `
    --module commonjs `
    --moduleResolution node `
    --lib ES2023,DOM `
    --types node `
    --strict `
    --esModuleInterop `
    --skipLibCheck `
    --rootDir $auditoriaRoot `
    --outDir $tempRoot `
    $sourceFiles

  if ($LASTEXITCODE -ne 0) {
    throw "A compilação dos testes de auditoria falhou."
  }

  & node --test (Join-Path $tempRoot "service.test.js")

  if ($LASTEXITCODE -ne 0) {
    throw "Os testes de auditoria falharam."
  }
} catch {
  Write-Host $_ -ForegroundColor Red
  $exitCode = 1
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}

exit $exitCode
