$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$tempRoot = Join-Path $projectRoot (".tmp-oportunidades-" + [guid]::NewGuid())
$testConfigPath = Join-Path $tempRoot "tsconfig.json"
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0

$sourceFiles = @(
  (Join-Path $srcRoot "core\acesso\constants.ts"),
  (Join-Path $srcRoot "core\acesso\types.ts"),
  (Join-Path $srcRoot "core\acesso\service.ts"),
  (Join-Path $srcRoot "core\acesso\index.ts"),
  (Join-Path $srcRoot "services\auth.service.ts"),
  (Join-Path $srcRoot "services\acesso.service.ts"),
  (Join-Path $srcRoot "services\oportunidades.auditoria.ts"),
  (Join-Path $srcRoot "services\oportunidades.service.ts"),
  (Join-Path $srcRoot "services\oportunidades.service.test.ts"),
  (Join-Path $srcRoot "types\oportunidade.ts")
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
  if ($LASTEXITCODE -ne 0) { throw "A compilação dos testes de Oportunidades falhou." }

  $aliasRoot = Join-Path $tempRoot "node_modules\@"
  New-Item -ItemType Directory -Path $aliasRoot | Out-Null
  Copy-Item -LiteralPath (Join-Path $tempRoot "core") -Destination (Join-Path $aliasRoot "core") -Recurse
  & node --test (Join-Path $tempRoot "services\oportunidades.service.test.js")
  if ($LASTEXITCODE -ne 0) { throw "Os testes de Oportunidades falharam." }
} catch {
  Write-Host $_ -ForegroundColor Red
  $exitCode = 1
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}

exit $exitCode
