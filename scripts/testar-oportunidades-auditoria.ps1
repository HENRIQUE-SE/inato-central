$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$coreRoot = Join-Path $srcRoot "core"
$organizacaoRoot = Join-Path $coreRoot "organizacao"
$identidadeRoot = Join-Path $coreRoot "identidade"
$auditoriaRoot = Join-Path $coreRoot "auditoria"
$servicesRoot = Join-Path $srcRoot "services"
$typesRoot = Join-Path $srcRoot "types"
$tempRoot = Join-Path $projectRoot (".tmp-oportunidades-auditoria-" + [guid]::NewGuid())
$testConfigPath = Join-Path $tempRoot "tsconfig.json"
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
  (Join-Path $auditoriaRoot "constants.ts"),
  (Join-Path $auditoriaRoot "types.ts"),
  (Join-Path $auditoriaRoot "data.ts"),
  (Join-Path $auditoriaRoot "service.ts"),
  (Join-Path $auditoriaRoot "index.ts"),
  (Join-Path $typesRoot "oportunidade.ts"),
  (Join-Path $servicesRoot "oportunidades.auditoria.ts"),
  (Join-Path $servicesRoot "oportunidades.auditoria.test.ts")
)

try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) {
    throw "TypeScript local não encontrado em node_modules."
  }

  New-Item -ItemType Directory -Path $tempRoot | Out-Null

  $testConfig = [ordered]@{
    compilerOptions = [ordered]@{
      target = "ES2023"
      module = "commonjs"
      moduleResolution = "node"
      lib = @("ES2023", "DOM")
      types = @("node")
      strict = $true
      esModuleInterop = $true
      skipLibCheck = $true
      baseUrl = $projectRoot
      paths = @{ "@/*" = @("src/*") }
      rootDir = $srcRoot
      outDir = $tempRoot
    }
    files = $sourceFiles
  }

  $testConfig | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $testConfigPath -Encoding UTF8

  & $tscPath --project $testConfigPath

  if ($LASTEXITCODE -ne 0) {
    throw "A compilação dos testes de Oportunidades/Auditoria falhou."
  }

  $aliasCoreRoot = Join-Path $tempRoot "node_modules\@\core"
  New-Item -ItemType Directory -Path $aliasCoreRoot | Out-Null
  Copy-Item -Path (Join-Path $tempRoot "core\*") -Destination $aliasCoreRoot -Recurse

  & node --test (Join-Path $tempRoot "services\oportunidades.auditoria.test.js")

  if ($LASTEXITCODE -ne 0) {
    throw "Os testes de Oportunidades/Auditoria falharam."
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
