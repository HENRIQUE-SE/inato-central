$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$tempRoot = Join-Path $projectRoot (".tmp-negociacoes-" + [guid]::NewGuid())
$configPath = Join-Path $tempRoot "tsconfig.json"
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0
$files = @(
  (Join-Path $srcRoot "core\negociacoes\constants.ts"), (Join-Path $srcRoot "core\negociacoes\types.ts"),
  (Join-Path $srcRoot "core\negociacoes\service.ts"), (Join-Path $srcRoot "core\negociacoes\index.ts"),
  (Join-Path $srcRoot "core\negociacoes\service.test.ts"), (Join-Path $srcRoot "lib\negociacoes\negociacoes.repository.ts"),
  (Join-Path $srcRoot "services\negociacoes.service.ts"), (Join-Path $srcRoot "services\negociacoes.service.test.ts"),
  (Join-Path $srcRoot "services\negociacoes.auditoria.ts"), (Join-Path $srcRoot "services\negociacoes.auditoria.test.ts")
)
try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) { throw "TypeScript local não encontrado." }
  New-Item -ItemType Directory -Path $tempRoot | Out-Null
  $config = [ordered]@{ compilerOptions=[ordered]@{ target="ES2023"; module="commonjs"; moduleResolution="node"; lib=@("ES2023","DOM"); types=@("node"); strict=$true; esModuleInterop=$true; skipLibCheck=$true; baseUrl=$projectRoot; paths=@{ "@/*"=@("src/*") }; rootDir=$srcRoot; outDir=$tempRoot }; files=$files }
  $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding UTF8
  & $tscPath --project $configPath
  if ($LASTEXITCODE -ne 0) { throw "A compilação dos testes de negociações falhou." }
  $alias = Join-Path $tempRoot "node_modules\@"
  New-Item -ItemType Directory -Path $alias | Out-Null
  foreach ($diretorio in @("core", "lib", "services")) { if (Test-Path (Join-Path $tempRoot $diretorio)) { Copy-Item -Path (Join-Path $tempRoot $diretorio) -Destination $alias -Recurse } }
  Set-Content -LiteralPath (Join-Path $alias "lib\supabase.js") -Encoding UTF8 -Value 'exports.supabase = {};'
  & node --test (Join-Path $tempRoot "core\negociacoes\service.test.js") (Join-Path $tempRoot "services\negociacoes.service.test.js") (Join-Path $tempRoot "services\negociacoes.auditoria.test.js")
  if ($LASTEXITCODE -ne 0) { throw "Os testes de negociações falharam." }
} catch { Write-Host $_ -ForegroundColor Red; $exitCode = 1 }
finally { if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force } }
exit $exitCode
