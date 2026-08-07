$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$srcRoot = Join-Path $projectRoot "src"
$tempRoot = Join-Path $projectRoot (".tmp-auth-" + [guid]::NewGuid())
$configPath = Join-Path $tempRoot "tsconfig.json"
$tscPath = Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode = 0
$files = @((Join-Path $srcRoot "lib\supabase.ts"), (Join-Path $srcRoot "lib\auth\auth.repository.ts"), (Join-Path $srcRoot "services\auth.service.ts"), (Join-Path $srcRoot "services\auth.service.test.ts"))
try {
  if (-not (Test-Path -LiteralPath $tscPath -PathType Leaf)) { throw "TypeScript local não encontrado." }
  New-Item -ItemType Directory -Path $tempRoot | Out-Null
  $config = [ordered]@{ compilerOptions=[ordered]@{ target="ES2023"; module="commonjs"; moduleResolution="node"; lib=@("ES2023","DOM"); types=@("node"); strict=$true; esModuleInterop=$true; skipLibCheck=$true; baseUrl=$projectRoot; paths=@{ "@/*"=@("src/*") }; rootDir=$srcRoot; outDir=$tempRoot }; files=$files }
  $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding UTF8
  & $tscPath --project $configPath
  if ($LASTEXITCODE -ne 0) { throw "A compilação dos testes de autenticação falhou." }
  & node --test (Join-Path $tempRoot "services\auth.service.test.js")
  if ($LASTEXITCODE -ne 0) { throw "Os testes de autenticação falharam." }
} catch { Write-Host $_ -ForegroundColor Red; $exitCode = 1 }
finally { if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force } }
exit $exitCode
