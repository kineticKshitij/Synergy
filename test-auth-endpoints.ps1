# Test All Authentication Endpoints for SynergyOS
# This script tests registration, login, profile, token refresh, and logout

param(
    [string]$BaseUrl = "http://localhost"
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SynergyOS Full Authentication Test Suite" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$ApiUrl = "$BaseUrl/api/auth"
$tokens = @{
    access = $null
    refresh = $null
}

# Function to make authenticated request
function Invoke-AuthenticatedRequest {
    param(
        [string]$Url,
        [string]$Method = "Get",
        [string]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $Body -Headers $headers -ErrorAction Stop
        }
        else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        return @{ Success = $true; Data = $response }
    }
    catch {
        $errorMessage = $_.Exception.Message
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $errorBody = $reader.ReadToEnd()
        }
        catch {
            $errorBody = ""
        }
        
        return @{ 
            Success = $false
            Error = $errorMessage
            StatusCode = $statusCode
            ErrorBody = $errorBody
        }
    }
}

# Test 1: Health Check
Write-Host "`n[TEST 1] Server Health Check" -ForegroundColor Magenta
Write-Host "Testing: GET $BaseUrl" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri $BaseUrl -Method Get -TimeoutSec 5
    Write-Host "✓ Server is responding" -ForegroundColor Green
}
catch {
    Write-Host "✗ Server is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login with Username
Write-Host "`n[TEST 2] Login with Username" -ForegroundColor Magenta
$username = Read-Host "Enter username"
$SecurePassword = Read-Host "Enter password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

Write-Host "Testing: POST $ApiUrl/login/" -ForegroundColor Gray
$loginResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/login/" -Method Post -Body $loginBody

if ($loginResult.Success) {
    Write-Host "✓ Login successful" -ForegroundColor Green
    $tokens.access = $loginResult.Data.access
    $tokens.refresh = $loginResult.Data.refresh
    Write-Host "Access Token Length: $($tokens.access.Length)" -ForegroundColor Cyan
    Write-Host "Refresh Token Length: $($tokens.refresh.Length)" -ForegroundColor Cyan
}
else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "Status Code: $($loginResult.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($loginResult.Error)" -ForegroundColor Red
    Write-Host "Response: $($loginResult.ErrorBody)" -ForegroundColor Red
    exit 1
}

# Test 3: Get User Profile
Write-Host "`n[TEST 3] Get User Profile" -ForegroundColor Magenta
Write-Host "Testing: GET $ApiUrl/profile/" -ForegroundColor Gray
$profileResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/profile/" -Method Get -Token $tokens.access

if ($profileResult.Success) {
    Write-Host "✓ Profile retrieved successfully" -ForegroundColor Green
    Write-Host "User ID: $($profileResult.Data.id)" -ForegroundColor Cyan
    Write-Host "Username: $($profileResult.Data.username)" -ForegroundColor Cyan
    Write-Host "Email: $($profileResult.Data.email)" -ForegroundColor Cyan
    Write-Host "Full Name: $($profileResult.Data.first_name) $($profileResult.Data.last_name)" -ForegroundColor Cyan
    
    if ($profileResult.Data.profile) {
        Write-Host "Role: $($profileResult.Data.profile.role)" -ForegroundColor Cyan
        Write-Host "Custom Email: $($profileResult.Data.profile.custom_email)" -ForegroundColor Cyan
        Write-Host "Department: $($profileResult.Data.profile.department)" -ForegroundColor Cyan
        Write-Host "Position: $($profileResult.Data.profile.position)" -ForegroundColor Cyan
    }
}
else {
    Write-Host "✗ Failed to retrieve profile" -ForegroundColor Red
    Write-Host "Status Code: $($profileResult.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($profileResult.Error)" -ForegroundColor Red
}

# Test 4: Get Dashboard Stats
Write-Host "`n[TEST 4] Get Dashboard Stats" -ForegroundColor Magenta
Write-Host "Testing: GET $ApiUrl/dashboard/" -ForegroundColor Gray
$dashboardResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/dashboard/" -Method Get -Token $tokens.access

if ($dashboardResult.Success) {
    Write-Host "✓ Dashboard stats retrieved successfully" -ForegroundColor Green
    
    if ($dashboardResult.Data.stats) {
        Write-Host "Total Projects: $($dashboardResult.Data.stats.total_projects)" -ForegroundColor Cyan
        Write-Host "Active Tasks: $($dashboardResult.Data.stats.active_tasks)" -ForegroundColor Cyan
        Write-Host "Completed Tasks: $($dashboardResult.Data.stats.completed_tasks)" -ForegroundColor Cyan
        Write-Host "Team Members: $($dashboardResult.Data.stats.team_members)" -ForegroundColor Cyan
    }
}
else {
    Write-Host "✗ Failed to retrieve dashboard stats" -ForegroundColor Red
    Write-Host "Status Code: $($dashboardResult.StatusCode)" -ForegroundColor Red
}

# Test 5: Refresh Token
Write-Host "`n[TEST 5] Refresh Access Token" -ForegroundColor Magenta
Write-Host "Testing: POST $ApiUrl/token/refresh/" -ForegroundColor Gray
$refreshBody = @{
    refresh = $tokens.refresh
} | ConvertTo-Json

$refreshResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/token/refresh/" -Method Post -Body $refreshBody

if ($refreshResult.Success) {
    Write-Host "✓ Token refresh successful" -ForegroundColor Green
    $newAccessToken = $refreshResult.Data.access
    Write-Host "New Access Token Length: $($newAccessToken.Length)" -ForegroundColor Cyan
    
    # Verify new token works
    Write-Host "Verifying new token..." -ForegroundColor Gray
    $verifyResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/profile/" -Method Get -Token $newAccessToken
    
    if ($verifyResult.Success) {
        Write-Host "✓ New token is valid" -ForegroundColor Green
    }
    else {
        Write-Host "✗ New token is invalid" -ForegroundColor Red
    }
}
else {
    Write-Host "✗ Token refresh failed" -ForegroundColor Red
    Write-Host "Status Code: $($refreshResult.StatusCode)" -ForegroundColor Red
}

# Test 6: Invalid Token Test
Write-Host "`n[TEST 6] Test with Invalid Token" -ForegroundColor Magenta
Write-Host "Testing: GET $ApiUrl/profile/ (with invalid token)" -ForegroundColor Gray
$invalidResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/profile/" -Method Get -Token "invalid.token.here"

if (!$invalidResult.Success -and $invalidResult.StatusCode -eq 401) {
    Write-Host "✓ Correctly rejected invalid token" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to reject invalid token" -ForegroundColor Red
}

# Test 7: Logout
Write-Host "`n[TEST 7] Logout" -ForegroundColor Magenta
Write-Host "Testing: POST $ApiUrl/logout/" -ForegroundColor Gray
$logoutBody = @{
    refresh = $tokens.refresh
} | ConvertTo-Json

$logoutResult = Invoke-AuthenticatedRequest -Url "$ApiUrl/logout/" -Method Post -Body $logoutBody -Token $tokens.access

if ($logoutResult.Success) {
    Write-Host "✓ Logout successful" -ForegroundColor Green
    
    # Verify token is blacklisted
    Write-Host "Verifying token is blacklisted..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    $verifyLogout = Invoke-AuthenticatedRequest -Url "$ApiUrl/profile/" -Method Get -Token $tokens.access
    
    if (!$verifyLogout.Success) {
        Write-Host "✓ Token successfully blacklisted" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Token still active (may not be blacklisted)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✗ Logout failed" -ForegroundColor Red
    Write-Host "Status Code: $($logoutResult.StatusCode)" -ForegroundColor Red
}

# Summary
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All authentication endpoints have been tested." -ForegroundColor Green
Write-Host "Check the results above for any failures." -ForegroundColor Green
Write-Host ""
Write-Host "For backend logs, run:" -ForegroundColor Gray
Write-Host "  docker-compose logs backend --tail=50 | Select-String -Pattern 'login|token|auth' -Context 2" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
