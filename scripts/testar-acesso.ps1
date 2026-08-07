$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$tempRoot = Join-Path $projectRoot (".tmp-acesso-" + [guid]::NewGuid())
$configPath = Join-Path $tempRoot "tsconfig.json"
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0
$files = @(
  (Join-Path $srcRoot "core\organizacao\constants.ts"), (Join-Path $srcRoot "core\organizacao\types.ts"), (Join-Path $srcRoot "core\organizacao\data.ts"), (Join-Path $srcRoot "core\organizacao\service.ts"), (Join-Path $srcRoot "core\organizacao\index.ts"),
  (Join-Path $srcRoot "core\acesso\constants.ts"), (Join-Path $srcRoot "core\acesso\types.ts"), (Join-Path $srcRoot "core\acesso\service.ts"), (Join-Path $srcRoot "core\acesso\index.ts"), (Join-Path $srcRoot "core\acesso\service.test.ts"),
  (Join-Path $srcRoot "lib\supabase.ts"), (Join-Path $srcRoot "lib\auth\auth.repository.ts"), (Join-Path $srcRoot "lib\acesso\acesso.repository.ts"),
  (Join-Path $srcRoot "services\auth.service.ts"), (Join-Path $srcRoot "services\acesso.service.ts"), (Join-Path $srcRoot "services\acesso.service.test.ts")
)
try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) { throw "TypeScript local não encontrado." }
  New-Item -ItemType Directory -Path $tempRoot | Out-Null
  $config = [ordered]@{ compilerOptions=[ordered]@{ target="ES2023"; module="commonjs"; moduleResolution="node"; lib=@("ES2023","DOM"); types=@("node"); strict=$true; esModuleInterop=$true; skipLibCheck=$true; baseUrl=$projectRoot; paths=@{ "@/*"=@("src/*") }; rootDir=$srcRoot; outDir=$tempRoot }; files=$files }
  $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding UTF8
  & $tscPath --project $configPath
  if ($LASTEXITCODE -ne 0) { throw "A compilação dos testes de acesso falhou." }
  $aliasCore = Join-Path $tempRoot "node_modules\@\core"
  New-Item -ItemType Directory -Path $aliasCore | Out-Null
  Copy-Item -Path (Join-Path $tempRoot "core\*") -Destination $aliasCore -Recurse
  & node --test (Join-Path $tempRoot "core\acesso\service.test.js") (Join-Path $tempRoot "services\acesso.service.test.js")
  if ($LASTEXITCODE -ne 0) { throw "Os testes de acesso falharam." }
} catch { Write-Host $_ -ForegroundColor Red; $exitCode = 1 }
finally { if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force } }
exit $exitCode
