# Synergy API Endpoint Testing Script
# This script tests all major endpoints in the Synergy application

# Configuration
$baseUrl = "http://localhost"
$apiUrl = "$baseUrl/api"

# Color output functions
function Write-Success {
    param($message)
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Error {
    param($message)
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Info {
    param($message)
    Write-Host "ℹ $message" -ForegroundColor Cyan
}

function Write-Section {
    param($message)
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "  $message" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Yellow
}

# Test function
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Description" -ForegroundColor White
    Write-Host "  URL: $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Success "Status: $($response.StatusCode) - $Description"
            return @{
                Success = $true
                Data = $response.Content | ConvertFrom-Json
                StatusCode = $response.StatusCode
            }
        } else {
            Write-Error "Expected $ExpectedStatus but got $($response.StatusCode)"
            return @{ Success = $false; StatusCode = $response.StatusCode }
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "Status: $statusCode - $Description (Expected error)"
            return @{ Success = $true; StatusCode = $statusCode }
        } else {
            Write-Error "Request failed: $($_.Exception.Message)"
            return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $statusCode }
        }
    }
}

# Global variables for test data
$script:token = $null
$script:userId = $null
$script:projectId = $null
$script:taskId = $null

Write-Host "`n"
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SYNERGY API ENDPOINT TESTING SUITE             ║" -ForegroundColor Cyan
Write-Host "║   Testing all major API endpoints                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# ==========================================
# 1. AUTHENTICATION ENDPOINTS
# ==========================================
Write-Section "1. AUTHENTICATION ENDPOINTS"

# Test Login
Write-Info "Testing login with default credentials..."
$loginResult = Test-Endpoint -Method POST -Url "$apiUrl/accounts/login/" `
    -Description "User Login" `
    -Body @{
        username = "admin"
        password = "admin"
    }

if ($loginResult.Success -and $loginResult.Data.access) {
    $script:token = $loginResult.Data.access
    $script:userId = $loginResult.Data.user.id
    Write-Success "Login successful! Token obtained."
    Write-Info "User ID: $($loginResult.Data.user.id)"
    Write-Info "Username: $($loginResult.Data.user.username)"
    Write-Info "Email: $($loginResult.Data.user.email)"
} else {
    Write-Error "Login failed! Cannot proceed with authenticated endpoints."
    exit 1
}

# Test Registration (expect 400 if user exists)
Test-Endpoint -Method POST -Url "$apiUrl/accounts/register/" `
    -Description "User Registration (Test - may fail if exists)" `
    -Body @{
        username = "testuser$(Get-Random)"
        email = "test$(Get-Random)@example.com"
        password = "Test@123456"
        password2 = "Test@123456"
        first_name = "Test"
        last_name = "User"
    } -ExpectedStatus 201

# ==========================================
# 2. USER PROFILE ENDPOINTS
# ==========================================
Write-Section "2. USER PROFILE ENDPOINTS"

$headers = @{
    "Authorization" = "Bearer $script:token"
}

# Get Profile
$profileResult = Test-Endpoint -Method GET -Url "$apiUrl/accounts/profile/" `
    -Description "Get User Profile" `
    -Headers $headers

# Get Dashboard Stats
Test-Endpoint -Method GET -Url "$apiUrl/accounts/dashboard/" `
    -Description "Get Dashboard Statistics" `
    -Headers $headers

# ==========================================
# 3. PROJECT ENDPOINTS
# ==========================================
Write-Section "3. PROJECT ENDPOINTS"

# List Projects
$projectsResult = Test-Endpoint -Method GET -Url "$apiUrl/projects/" `
    -Description "List All Projects" `
    -Headers $headers

if ($projectsResult.Success -and $projectsResult.Data.Count -gt 0) {
    $script:projectId = $projectsResult.Data[0].id
    Write-Success "Found project ID: $script:projectId"
}

# Get Specific Project
if ($script:projectId) {
    Test-Endpoint -Method GET -Url "$apiUrl/projects/$script:projectId/" `
        -Description "Get Project Details" `
        -Headers $headers
}

# Create New Project
$newProjectResult = Test-Endpoint -Method POST -Url "$apiUrl/projects/" `
    -Description "Create New Project" `
    -Headers $headers `
    -Body @{
        name = "Test Project $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        description = "Automated test project created by PowerShell script"
        status = "planning"
        priority = "medium"
        progress = 0
    } -ExpectedStatus 201

if ($newProjectResult.Success) {
    $testProjectId = $newProjectResult.Data.id
    Write-Success "Created test project with ID: $testProjectId"
    
    # Update Project
    Test-Endpoint -Method PATCH -Url "$apiUrl/projects/$testProjectId/" `
        -Description "Update Project" `
        -Headers $headers `
        -Body @{
            progress = 25
            status = "active"
        }
    
    # Delete Test Project
    Test-Endpoint -Method DELETE -Url "$apiUrl/projects/$testProjectId/" `
        -Description "Delete Test Project" `
        -Headers $headers `
        -ExpectedStatus 204
}

# ==========================================
# 4. TASK ENDPOINTS
# ==========================================
Write-Section "4. TASK ENDPOINTS"

# List Tasks
$tasksResult = Test-Endpoint -Method GET -Url "$apiUrl/tasks/" `
    -Description "List All Tasks" `
    -Headers $headers

if ($tasksResult.Success -and $tasksResult.Data.Count -gt 0) {
    $script:taskId = $tasksResult.Data[0].id
    Write-Success "Found task ID: $script:taskId"
}

# Get Tasks by Project
if ($script:projectId) {
    Test-Endpoint -Method GET -Url "$apiUrl/tasks/?project=$script:projectId" `
        -Description "List Tasks by Project" `
        -Headers $headers
}

# Create New Task
if ($script:projectId) {
    $newTaskResult = Test-Endpoint -Method POST -Url "$apiUrl/tasks/" `
        -Description "Create New Task" `
        -Headers $headers `
        -Body @{
            project = $script:projectId
            title = "Test Task $(Get-Date -Format 'HH:mm:ss')"
            description = "Automated test task"
            status = "todo"
            priority = "medium"
            estimated_hours = 8
        } -ExpectedStatus 201
    
    if ($newTaskResult.Success) {
        $testTaskId = $newTaskResult.Data.id
        Write-Success "Created test task with ID: $testTaskId"
        
        # Update Task
        Test-Endpoint -Method PATCH -Url "$apiUrl/tasks/$testTaskId/" `
            -Description "Update Task Status" `
            -Headers $headers `
            -Body @{
                status = "in_progress"
            }
        
        # Delete Test Task
        Test-Endpoint -Method DELETE -Url "$apiUrl/tasks/$testTaskId/" `
            -Description "Delete Test Task" `
            -Headers $headers `
            -ExpectedStatus 204
    }
}

# Get Task Details
if ($script:taskId) {
    Test-Endpoint -Method GET -Url "$apiUrl/tasks/$script:taskId/" `
        -Description "Get Task Details" `
        -Headers $headers
}

# ==========================================
# 5. ACTIVITY ENDPOINTS
# ==========================================
Write-Section "5. ACTIVITY ENDPOINTS"

# List All Activities
Test-Endpoint -Method GET -Url "$apiUrl/activities/" `
    -Description "List All Activities" `
    -Headers $headers

# List Activities by Project
if ($script:projectId) {
    Test-Endpoint -Method GET -Url "$apiUrl/activities/?project=$script:projectId" `
        -Description "List Activities by Project" `
        -Headers $headers
}

# ==========================================
# 6. MESSAGE ENDPOINTS
# ==========================================
Write-Section "6. MESSAGE ENDPOINTS"

# List All Messages
Test-Endpoint -Method GET -Url "$apiUrl/messages/" `
    -Description "List All Messages" `
    -Headers $headers

# List Messages by Project
if ($script:projectId) {
    Test-Endpoint -Method GET -Url "$apiUrl/messages/?project=$script:projectId" `
        -Description "List Messages by Project" `
        -Headers $headers
}

# Send Message
if ($script:projectId) {
    $messageResult = Test-Endpoint -Method POST -Url "$apiUrl/messages/" `
        -Description "Send Project Message" `
        -Headers $headers `
        -Body @{
            project = $script:projectId
            message = "Test message sent at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        } -ExpectedStatus 201
    
    if ($messageResult.Success) {
        $messageId = $messageResult.Data.id
        Write-Success "Sent message with ID: $messageId"
        
        # Mark Message as Read
        Test-Endpoint -Method POST -Url "$apiUrl/messages/$messageId/mark_read/" `
            -Description "Mark Message as Read" `
            -Headers $headers
    }
}

# Get Unread Messages
Test-Endpoint -Method GET -Url "$apiUrl/messages/unread/" `
    -Description "Get Unread Messages" `
    -Headers $headers

# ==========================================
# 7. ATTACHMENT ENDPOINTS
# ==========================================
Write-Section "7. ATTACHMENT ENDPOINTS"

# List All Attachments
Test-Endpoint -Method GET -Url "$apiUrl/attachments/" `
    -Description "List All Attachments" `
    -Headers $headers

# Get Task Attachments
if ($script:taskId) {
    Test-Endpoint -Method GET -Url "$apiUrl/tasks/$script:taskId/attachments/" `
        -Description "Get Task Attachments" `
        -Headers $headers
}

# ==========================================
# 8. TEAM MEMBER DASHBOARD ENDPOINTS
# ==========================================
Write-Section "8. TEAM MEMBER DASHBOARD ENDPOINTS"

# Get Team Dashboard
Test-Endpoint -Method GET -Url "$apiUrl/team-dashboard/" `
    -Description "Get Team Member Dashboard" `
    -Headers $headers

# Get Team Dashboard Projects
Test-Endpoint -Method GET -Url "$apiUrl/team-dashboard/projects/" `
    -Description "Get Team Member Projects" `
    -Headers $headers

# Get Team Dashboard Tasks
Test-Endpoint -Method GET -Url "$apiUrl/team-dashboard/tasks/" `
    -Description "Get Team Member Tasks" `
    -Headers $headers

# ==========================================
# 9. INVITATION ENDPOINTS
# ==========================================
Write-Section "9. INVITATION ENDPOINTS"

# Note: Invitation requires valid project and email
if ($script:projectId) {
    Write-Info "Skipping invitation test (requires valid email setup)"
    # Test-Endpoint -Method POST -Url "$apiUrl/projects/$script:projectId/invite_member/" `
    #     -Description "Invite Team Member" `
    #     -Headers $headers `
    #     -Body @{
    #         email = "test@example.com"
    #     } -ExpectedStatus 201
}

# ==========================================
# 10. SECURITY ENDPOINTS
# ==========================================
Write-Section "10. SECURITY ENDPOINTS"

# Get Security Events
Test-Endpoint -Method GET -Url "$apiUrl/accounts/security-events/" `
    -Description "Get Security Events" `
    -Headers $headers

# Get Active Sessions
Test-Endpoint -Method GET -Url "$apiUrl/accounts/active-sessions/" `
    -Description "Get Active Sessions" `
    -Headers $headers

# ==========================================
# 11. STATISTICS ENDPOINTS
# ==========================================
Write-Section "11. STATISTICS & SUMMARY ENDPOINTS"

# Get Project Statistics
if ($script:projectId) {
    Test-Endpoint -Method GET -Url "$apiUrl/projects/$script:projectId/stats/" `
        -Description "Get Project Statistics" `
        -Headers $headers
}

# Get Task Statistics
Test-Endpoint -Method GET -Url "$apiUrl/tasks/stats/" `
    -Description "Get Task Statistics" `
    -Headers $headers

# ==========================================
# 12. UNAUTHORIZED TESTS
# ==========================================
Write-Section "12. UNAUTHORIZED ACCESS TESTS"

# Test without token (should fail with 401)
Test-Endpoint -Method GET -Url "$apiUrl/projects/" `
    -Description "Access Projects Without Token (Should Fail)" `
    -ExpectedStatus 401

# Test with invalid token (should fail with 401)
$badHeaders = @{
    "Authorization" = "Bearer invalid_token_12345"
}
Test-Endpoint -Method GET -Url "$apiUrl/projects/" `
    -Description "Access Projects With Invalid Token (Should Fail)" `
    -Headers $badHeaders `
    -ExpectedStatus 401

# ==========================================
# FINAL SUMMARY
# ==========================================
Write-Section "TEST SUMMARY"

Write-Host "Test execution completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Key Information:" -ForegroundColor Cyan
Write-Host "  Base URL: $baseUrl" -ForegroundColor White
Write-Host "  API URL: $apiUrl" -ForegroundColor White
Write-Host "  User ID: $script:userId" -ForegroundColor White
Write-Host "  Project ID: $script:projectId" -ForegroundColor White
Write-Host "  Task ID: $script:taskId" -ForegroundColor White
Write-Host ""
Write-Host "All major endpoints have been tested!" -ForegroundColor Green
Write-Host "Check the output above for any failures marked with ✗" -ForegroundColor Yellow
Write-Host ""
