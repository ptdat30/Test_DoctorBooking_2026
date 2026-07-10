# Build deliverable assets for GitHub Release (NovaTicket-style QA package)
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Set-Location $root

$deliverables = 'docs/Report/09_Oral_Defense_Report/deliverables'
New-Item -ItemType Directory -Force -Path $deliverables | Out-Null

Copy-Item 'docs/Report/01_Integration_Report/DB_Integration_Test.xlsx' "$deliverables/DB_Integration_Test.xlsx" -Force

@('jacoco_report.zip', 'postman_api_tests.zip', 'qa_deliverables_bundle.zip', 'source_code_snapshot.zip') | ForEach-Object {
  $path = Join-Path $deliverables $_
  if (Test-Path $path) { Remove-Item $path -Force }
}

Compress-Archive -Path 'docs/Report/03_Whitebox/jacoco/*' -DestinationPath "$deliverables/jacoco_report.zip" -Force
Compress-Archive -Path 'docs/Report/05_API/*' -DestinationPath "$deliverables/postman_api_tests.zip" -Force

$tempReport = Join-Path $env:TEMP 'doctorbooking-qa-report'
if (Test-Path $tempReport) { Remove-Item $tempReport -Recurse -Force }
New-Item -ItemType Directory -Force -Path $tempReport | Out-Null
Copy-Item 'docs/Report/README.md' "$tempReport/" -Force
Copy-Item 'docs/Report/08_How_To_Reproduce.md' "$tempReport/" -Force
Get-ChildItem 'docs/Report' -Directory | Where-Object { $_.Name -match '^0[1-8]_' } | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $tempReport $_.Name) -Recurse -Force
}
Compress-Archive -Path "$tempReport/*" -DestinationPath "$deliverables/qa_deliverables_bundle.zip" -Force
Remove-Item $tempReport -Recurse -Force

$tempSrc = Join-Path $env:TEMP 'doctorbooking-src-snapshot'
if (Test-Path $tempSrc) { Remove-Item $tempSrc -Recurse -Force }
New-Item -ItemType Directory -Force -Path $tempSrc | Out-Null
robocopy backend "$tempSrc/backend" /E /XD target .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
robocopy frontend "$tempSrc/frontend" /E /XD node_modules dist .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
robocopy postman "$tempSrc/postman" /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
robocopy .github "$tempSrc/.github" /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item README.md, render.yaml, docker-compose.yml, sonar-project.properties $tempSrc -ErrorAction SilentlyContinue
Compress-Archive -Path "$tempSrc/*" -DestinationPath "$deliverables/source_code_snapshot.zip" -Force
Remove-Item $tempSrc -Recurse -Force

Write-Host "Deliverables ready in $deliverables"
Get-ChildItem $deliverables | Format-Table Name, @{ N = 'SizeMB'; E = { [math]::Round($_.Length / 1MB, 2) } } -AutoSize
