#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Chạy toàn bộ API test suite cho Doctor Booking System theo thứ tự.

.DESCRIPTION
    Script này chạy Newman qua tất cả folders theo thứ tự đúng:
    00_Setup → 01→22_E2E_Flows
    Tạo báo cáo HTML + JSON riêng cho từng folder và báo cáo tổng hợp.

.PARAMETER BaseUrl
    Base URL của API (mặc định: http://localhost:8080)

.PARAMETER SkipAI
    Bỏ qua AI tests (nếu không có Groq API key)

.PARAMETER Timeout
    Timeout mỗi request tính bằng ms (mặc định: 15000)

.EXAMPLE
    ./run-all.ps1
    ./run-all.ps1 -BaseUrl "http://staging.example.com" -SkipAI
#>
param(
    [string]$BaseUrl   = "http://localhost:8080",
    [switch]$SkipAI,
    [int]$Timeout      = 15000,
    [int]$DelayRequest = 200
)

$Root        = Split-Path -Parent $PSScriptRoot
$Collection  = Join-Path $Root "test_doctor_booking_2026.postman_collection.json"
$EnvFile     = Join-Path $Root "test_doctor_booking_2026.postman_environment.json"
$ReportsDir  = Join-Path $Root "reports"

if (-not (Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir | Out-Null }

# Tất cả folders theo thứ tự chạy
$Folders = @(
    "00_Setup",
    "01_Public",
    "02_Auth",
    "03_Patient_Profile",
    "04_Patient_Doctors",
    "05_Patient_Appointments",
    "06_Patient_Treatments",
    "07_Patient_Feedback",
    "08_Patient_FamilyMembers",
    "09_Patient_Notifications",
    "10_Patient_Wallet",
    "11_Patient_AI",
    "12_Doctor_Profile",
    "13_Doctor_Appointments",
    "14_Doctor_Treatments",
    "15_Doctor_Patients",
    "16_Doctor_Medications",
    "17_Doctor_Feedback",
    "18_Admin_Doctors",
    "19_Admin_Patients",
    "20_Admin_Appointments",
    "21_Admin_Feedbacks",
    "21b_Admin_Users",
    "22_E2E_Flows"
)

$skipAiFlag = if ($SkipAI) { "true" } else { "false" }
$Timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"

# Patch environment base_url nếu khác default
$TempEnv = Join-Path $env:TEMP "postman_env_$Timestamp.json"
$envJson = Get-Content $EnvFile -Raw | ConvertFrom-Json
foreach ($v in $envJson.values) {
    if ($v.key -eq "base_url")      { $v.value = $BaseUrl }
    if ($v.key -eq "skip_ai_tests") { $v.value = $skipAiFlag }
}
$envJson | ConvertTo-Json -Depth 10 | Set-Content $TempEnv

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Doctor Booking API Test Suite — Newman Runner" -ForegroundColor Cyan
Write-Host " Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host " Skip AI:  $skipAiFlag" -ForegroundColor Cyan
Write-Host " Timeout:  ${Timeout}ms  |  Delay: ${DelayRequest}ms" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$TotalFailed  = 0
$TotalPassed  = 0
$FailedFolders = @()

foreach ($folder in $Folders) {
    Write-Host "▶ Running: $folder" -ForegroundColor Yellow

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
        "--reporter-json-export", $reportJson
    )

    newman @newmanArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ FAILED: $folder" -ForegroundColor Red
        $TotalFailed++
        $FailedFolders += $folder
    } else {
        Write-Host "  ✓ PASSED: $folder" -ForegroundColor Green
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

# Exit với code lỗi nếu có folder fail
exit $TotalFailed
