#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run all API test suite for Doctor Booking System in order.

.DESCRIPTION
    This script runs Newman through all folders in correct order:
    00_Setup -> 01->22_E2E_Flows
    Generate HTML + JSON reports for each folder and summary report.

.PARAMETER BaseUrl
    Base URL of the API (default: http://localhost:8080)

.PARAMETER SkipAI
    Skip AI tests (if no Groq API key)

.PARAMETER Timeout
    Timeout for each request in ms (default: 15000)

.EXAMPLE
    ./run-all.ps1
    ./run-all.ps1 -BaseUrl "http://staging.example.com" -SkipAI
#>
param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$SkipAI,
    [int]$Timeout = 15000,
    [int]$DelayRequest = 200
)

$Root = Split-Path -Parent $PSScriptRoot
$Collection = Join-Path $Root "test_doctor_booking_2026.postman_collection.json"
$EnvFile = Join-Path $Root "test_doctor_booking_2026.postman_environment.json"
$ReportsDir = Join-Path $Root "reports"

if (-not (Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir | Out-Null }

# All folders in order of execution
$Folders = @(
    "00_Setup",
    "01_Public",
    "02_Auth",
    "03_Patient_Profile",
    "04_Patient_Doctors",
    "05_Patient_Appointments",
    "06_Patient_Treatments",
    "07_Patient_Feedbacks",
    "08_Patient_FamilyMembers",
    "09_Patient_Wallet_Payments",
    "10_Patient_AI",
    "11_Patient_Notifications",
    "12_Doctor_Profile",
    "13_Doctor_Appointments",
    "14_Doctor_Treatments",
    "15_Doctor_Patients",
    "16_Doctor_Medications_Feedbacks",
    "17_Admin_Doctors",
    "18_Admin_Patients",
    "19_Admin_Appointments",
    "20_Admin_Feedbacks",
    "21_Admin_Users",
    "22_E2E_Flows"
)

$skipAiFlag = if ($SkipAI) { "true" } else { "false" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Patch environment base_url if different from default
$TempEnv = Join-Path $env:TEMP "postman_env_$Timestamp.json"
$envJson = Get-Content $EnvFile -Raw | ConvertFrom-Json
foreach ($v in $envJson.values) {
    if ($v.key -eq "base_url") { $v.value = $BaseUrl }
    if ($v.key -eq "skip_ai_tests") { $v.value = $skipAiFlag }
}
$envJson | ConvertTo-Json -Depth 10 | Set-Content $TempEnv

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Doctor Booking API Test Suite - Newman Runner" -ForegroundColor Cyan
Write-Host " Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host " Skip AI:  $skipAiFlag" -ForegroundColor Cyan
Write-Host " Timeout:  ${Timeout}ms  |  Delay: ${DelayRequest}ms" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$TotalFailed = 0
$TotalPassed = 0
$FailedFolders = @()

foreach ($folder in $Folders) {
    Write-Host "[RUNNING] $folder" -ForegroundColor Yellow

    $reportHtml = Join-Path $ReportsDir "${Timestamp}_${folder}.html"
    $reportJson = Join-Path $ReportsDir "${Timestamp}_${folder}.json"

    $newmanArgs = @(
        "run", $Collection,
        "-e", $TempEnv,
        "--folder", $folder,
        "--timeout-request", $Timeout,
        "--delay-request", $DelayRequest,
        "--reporters", "cli,htmlextra,json",
        "--reporter-htmlextra-export", $reportHtml,
        "--reporter-json-export", $reportJson,
        "--export-environment", $TempEnv
    )

    npx newman @newmanArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] FAILED: $folder" -ForegroundColor Red
        $TotalFailed++
        $FailedFolders += $folder
    } else {
        Write-Host "  [PASS] PASSED: $folder" -ForegroundColor Green
        $TotalPassed++
    }
    Write-Host ""
}

# Cleanup temp env
Remove-Item $TempEnv -ErrorAction SilentlyContinue

# Summary
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Passed folders : $TotalPassed" -ForegroundColor Green
Write-Host " Failed folders : $TotalFailed" -ForegroundColor $(if ($TotalFailed -gt 0) { "Red" } else { "Green" })
if ($FailedFolders.Count -gt 0) {
    Write-Host " Failed: $($FailedFolders -join ', ')" -ForegroundColor Red
}
Write-Host " Reports saved in: $ReportsDir" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Exit with error code if any folder fails
exit $TotalFailed
