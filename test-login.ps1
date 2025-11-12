# Test Login Endpoints for SynergyOS
# This script tests authentication with username, email, and custom_email

param(
    [string]$BaseUrl = "http://localhost",
    [string]$Username = "marotkarkshitijli2024",
    [string]$Email = "marotkarkshitijli2024@gmail.com",
    [string]$CustomEmail = "kshitij.marotkar.test12@synergy.in",
    [string]$Password = ""
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SynergyOS Login Authentication Test Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for password if not provided
if ([string]::IsNullOrEmpty($Password)) {
    $SecurePassword = Read-Host "Enter the password for team member" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$LoginUrl = "$BaseUrl/api/auth/login/"

# Function to test login
function Test-Login {
    param(
        [string]$Credential,
        [string]$CredentialType,
        [string]$Pass
    )
    
    Write-Host "---------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Testing login with $CredentialType" -ForegroundColor Yellow
    Write-Host "Credential: $Credential" -ForegroundColor Gray
    Write-Host ""
    
    $body = @{
        username = $Credential
        password = $Pass
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $LoginUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        Write-Host "✓ SUCCESS!" -ForegroundColor Green
        Write-Host "Access Token: $($response.access.Substring(0, 50))..." -ForegroundColor Green
        Write-Host "Refresh Token: $($response.refresh.Substring(0, 50))..." -ForegroundColor Green
        
        # Decode JWT token to show user info
        $tokenParts = $response.access -split '\.'
        if ($tokenParts.Length -eq 3) {
            $payload = $tokenParts[1]
            # Add padding if needed
            $padding = 4 - ($payload.Length % 4)
            if ($padding -ne 4) {
                $payload += "=" * $padding
            }
            $payloadJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload))
            $payloadObj = $payloadJson | ConvertFrom-Json
            Write-Host "User ID: $($payloadObj.user_id)" -ForegroundColor Cyan
            Write-Host "Username: $($payloadObj.username)" -ForegroundColor Cyan
        }
        
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "✗ FAILED!" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to get error details
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
        catch {
            # Ignore if we can't read response
        }
        
        Write-Host ""
        return $false
    }
}

# Test 1: Login with username
Write-Host "`n[TEST 1/3] Login with Username" -ForegroundColor Magenta
$test1 = Test-Login -Credential $Username -CredentialType "Username" -Pass $Password

# Test 2: Login with personal email
Write-Host "[TEST 2/3] Login with Personal Email" -ForegroundColor Magenta
$test2 = Test-Login -Credential $Email -CredentialType "Personal Email" -Pass $Password

# Test 3: Login with custom Synergy email
Write-Host "[TEST 3/3] Login with Custom Synergy Email" -ForegroundColor Magenta
$test3 = Test-Login -Credential $CustomEmail -CredentialType "Custom Synergy Email" -Pass $Password

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$results = @(
    @{ Test = "Username Login"; Result = $test1 },
    @{ Test = "Personal Email Login"; Result = $test2 },
    @{ Test = "Custom Email Login"; Result = $test3 }
)

foreach ($result in $results) {
    $status = if ($result.Result) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($result.Result) { "Green" } else { "Red" }
    Write-Host "$($result.Test): " -NoNewline
    Write-Host $status -ForegroundColor $color
}

Write-Host ""
$passCount = ($results | Where-Object { $_.Result -eq $true }).Count
$totalCount = $results.Count

if ($passCount -eq $totalCount) {
    Write-Host "All tests passed! ($passCount/$totalCount)" -ForegroundColor Green
    Write-Host "Authentication backend is working correctly." -ForegroundColor Green
}
else {
    Write-Host "Some tests failed! ($passCount/$totalCount)" -ForegroundColor Yellow
    Write-Host "Please check the backend logs for more details:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs backend --tail=50" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
