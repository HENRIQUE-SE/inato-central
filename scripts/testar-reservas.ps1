$ErrorActionPreference="Stop"
$projectRoot=Split-Path -Parent $PSScriptRoot
$tempRoot=Join-Path $projectRoot (".tmp-reservas-"+[guid]::NewGuid())
$tscPath=Join-Path $projectRoot "node_modules\.bin\tsc.cmd"
$exitCode=0
try{
 if(-not(Test-Path -LiteralPath $tscPath -PathType Leaf)){throw "TypeScript local não encontrado."}
 New-Item -ItemType Directory -Path $tempRoot|Out-Null
 $config=@{compilerOptions=@{target="ES2023";module="commonjs";moduleResolution="node";lib=@("ES2023","DOM");types=@("node");strict=$true;esModuleInterop=$true;skipLibCheck=$true;baseUrl=$projectRoot;paths=@{"@/*"=@("src/*")};rootDir=(Join-Path $projectRoot "src");outDir=$tempRoot};files=@((Join-Path $projectRoot "src\core\reservas\constants.ts"),(Join-Path $projectRoot "src\core\reservas\types.ts"),(Join-Path $projectRoot "src\core\reservas\service.ts"),(Join-Path $projectRoot "src\core\reservas\index.ts"),(Join-Path $projectRoot "src\core\reservas\service.test.ts"),(Join-Path $projectRoot "src\lib\reservas\reservas.repository.ts"),(Join-Path $projectRoot "src\services\reservas.service.ts"),(Join-Path $projectRoot "src\services\reservas.service.test.ts"),(Join-Path $projectRoot "src\services\reservas.auditoria.ts"),(Join-Path $projectRoot "src\services\reservas.auditoria.test.ts"))}
 $config|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $tempRoot "tsconfig.json") -Encoding UTF8
 &$tscPath --project (Join-Path $tempRoot "tsconfig.json");if($LASTEXITCODE-ne 0){throw "A compilação dos testes de Reservas falhou."}
 $alias=Join-Path $tempRoot "node_modules\@";New-Item -ItemType Directory -Path $alias|Out-Null
 foreach($dir in @("core","lib","services")){if(Test-Path(Join-Path $tempRoot $dir)){Copy-Item -Path (Join-Path $tempRoot $dir) -Destination $alias -Recurse}}
 Set-Content -LiteralPath (Join-Path $alias "lib\supabase.js") -Encoding UTF8 -Value 'exports.supabase = {};'
 &node --test (Join-Path $tempRoot "core\reservas\service.test.js") (Join-Path $tempRoot "services\reservas.service.test.js") (Join-Path $tempRoot "services\reservas.auditoria.test.js");if($LASTEXITCODE-ne 0){throw "Os testes de Reservas falharam."}
}catch{Write-Host $_ -ForegroundColor Red;$exitCode=1}finally{if(Test-Path -LiteralPath $tempRoot){Remove-Item -LiteralPath $tempRoot -Recurse -Force}}
exit $exitCode
