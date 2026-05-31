# Newman runner for test_doctor_booking_2026 API Automation Suite
param(
    [string]$Folder = "",
    [string]$DataFile = "",
    [switch]$E2EOnly,
    [switch]$SetupOnly
)

$Root = Split-Path -Parent $PSScriptRoot
$Collection = Join-Path $Root "test_doctor_booking_2026.postman_collection.json"
$Environment = Join-Path $Root "test_doctor_booking_2026.postman_environment.json"
$ReportsDir = Join-Path $Root "reports"

if (-not (Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir | Out-Null }

$args = @(
    "run", $Collection,
    "-e", $Environment,
    "--reporters", "cli,htmlextra,json",
    "--reporter-htmlextra-export", (Join-Path $ReportsDir "report.html"),
    "--reporter-json-export", (Join-Path $ReportsDir "report.json"),
    "--timeout-request", "10000",
    "--delay-request", "100"
)

if ($E2EOnly) { $args += "--folder", "22_E2E_Flows" }
elseif ($SetupOnly) { $args += "--folder", "00_Setup" }
elseif ($Folder) { $args += "--folder", $Folder }

if ($DataFile) {
    $args += "-d", (Join-Path $Root "data\$DataFile")
} elseif (-not $E2EOnly -and -not $SetupOnly -and -not $Folder) {
    $args += "-d", (Join-Path $Root "data\users_login.json")
}

Write-Host "Running: newman $($args -join ' ')"
newman @args
exit $LASTEXITCODE
