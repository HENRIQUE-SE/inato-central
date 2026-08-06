$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$coreRoot = Join-Path $projectRoot "src\core"
$organizacaoRoot = Join-Path $coreRoot "organizacao"
$identidadeRoot = Join-Path $coreRoot "identidade"
$tempRoot = Join-Path $projectRoot (".tmp-identidade-" + [guid]::NewGuid())
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0

$sourceFiles = @(
  (Join-Path $organizacaoRoot "constants.ts"),
  (Join-Path $organizacaoRoot "types.ts"),
  (Join-Path $organizacaoRoot "data.ts"),
  (Join-Path $organizacaoRoot "service.ts"),
  (Join-Path $organizacaoRoot "index.ts"),
  (Join-Path $identidadeRoot "constants.ts"),
  (Join-Path $identidadeRoot "types.ts"),
  (Join-Path $identidadeRoot "data.ts"),
  (Join-Path $identidadeRoot "service.ts"),
  (Join-Path $identidadeRoot "index.ts"),
  (Join-Path $identidadeRoot "service.test.ts")
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
    --rootDir $coreRoot `
    --outDir $tempRoot `
    $sourceFiles

  if ($LASTEXITCODE -ne 0) {
    throw "A compilação dos testes de identidade falhou."
  }

  & node --test (Join-Path $tempRoot "identidade\service.test.js")

  if ($LASTEXITCODE -ne 0) {
    throw "Os testes de identidade falharam."
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
