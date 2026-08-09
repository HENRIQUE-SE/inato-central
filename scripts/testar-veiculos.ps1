$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$tempRoot = Join-Path $projectRoot (".tmp-veiculos-" + [guid]::NewGuid())
$configPath = Join-Path $tempRoot "tsconfig.json"
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0
$files = @(
  (Join-Path $srcRoot "core\veiculos\constants.ts"),
  (Join-Path $srcRoot "core\veiculos\types.ts"),
  (Join-Path $srcRoot "core\veiculos\service.ts"),
  (Join-Path $srcRoot "core\veiculos\index.ts"),
  (Join-Path $srcRoot "core\veiculos\service.test.ts"),
  (Join-Path $srcRoot "lib\veiculos\veiculos.repository.ts"),
  (Join-Path $srcRoot "services\veiculos.service.ts"),
  (Join-Path $srcRoot "services\veiculos.service.test.ts"),
  (Join-Path $srcRoot "services\veiculos.auditoria.ts"),
  (Join-Path $srcRoot "services\veiculos.auditoria.test.ts")
)
try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) { throw "TypeScript local não encontrado." }
  New-Item -ItemType Directory -Path $tempRoot | Out-Null
  $config = [ordered]@{ compilerOptions=[ordered]@{ target="ES2023"; module="commonjs"; moduleResolution="node"; lib=@("ES2023","DOM"); types=@("node"); strict=$true; esModuleInterop=$true; skipLibCheck=$true; baseUrl=$projectRoot; paths=@{ "@/*"=@("src/*") }; rootDir=$srcRoot; outDir=$tempRoot }; files=$files }
  $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding UTF8
  & $tscPath --project $configPath
  if ($LASTEXITCODE -ne 0) { throw "A compilação dos testes de veículos falhou." }
  $aliasCore = Join-Path $tempRoot "node_modules\@\core"
  New-Item -ItemType Directory -Path $aliasCore | Out-Null
  Copy-Item -Path (Join-Path $tempRoot "core\*") -Destination $aliasCore -Recurse
  $aliasLib = Join-Path $tempRoot "node_modules\@\lib"
  New-Item -ItemType Directory -Path $aliasLib | Out-Null
  Copy-Item -Path (Join-Path $tempRoot "lib\*") -Destination $aliasLib -Recurse
  Set-Content -LiteralPath (Join-Path $aliasLib "supabase.js") -Encoding UTF8 -Value 'exports.supabase = {};'
  & node --test (Join-Path $tempRoot "core\veiculos\service.test.js") (Join-Path $tempRoot "services\veiculos.service.test.js") (Join-Path $tempRoot "services\veiculos.auditoria.test.js")
  if ($LASTEXITCODE -ne 0) { throw "Os testes de veículos falharam." }
} catch { Write-Host $_ -ForegroundColor Red; $exitCode = 1 }
finally { if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force } }
exit $exitCode
