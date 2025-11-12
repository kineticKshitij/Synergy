# Quick Endpoint Test Script
# Tests key endpoints with simple output

$apiUrl = "http://localhost/api"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   QUICK API ENDPOINT TEST             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

function Test-API {
    param([string]$Url, [string]$Method = "GET", [object]$Body = $null, [hashtable]$Headers = @{})
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✓ $Method $Url" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
        return $response.Content | ConvertFrom-Json
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value__ } else { "N/A" }
        Write-Host "✗ $Method $Url" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Status: $statusCode" -ForegroundColor Red
        return $null
    }
}

# Test 1: Login
Write-Host "`n[1] Testing Login..." -ForegroundColor Yellow
$login = Test-API -Url "$apiUrl/auth/login/" -Method POST -Body @{
    username = "admin"
    password = "admin"
}

if (-not $login) {
    Write-Host "`nℹ If login failed, the API might not be accessible." -ForegroundColor Yellow
    Write-Host "  Try accessing http://localhost in your browser to verify." -ForegroundColor Yellow
    Write-Host "  Or check if nginx is properly configured.`n" -ForegroundColor Yellow
    exit 1
}

$token = $login.access
$headers = @{ "Authorization" = "Bearer $token" }
Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray

# Test 2: Get Projects
Write-Host "`n[2] Testing Get Projects..." -ForegroundColor Yellow
$projects = Test-API -Url "$apiUrl/projects/" -Headers $headers

if ($projects -and $projects.Count -gt 0) {
    Write-Host "  Found $($projects.Count) projects" -ForegroundColor Gray
    $projectId = $projects[0].id
    Write-Host "  Using Project ID: $projectId - $($projects[0].name)" -ForegroundColor Gray
} else {
    Write-Host "  No projects found" -ForegroundColor Yellow
    $projectId = $null
}

# Test 3: Get Tasks
Write-Host "`n[3] Testing Get Tasks..." -ForegroundColor Yellow
$tasks = Test-API -Url "$apiUrl/tasks/" -Headers $headers

if ($tasks -and $tasks.Count -gt 0) {
    Write-Host "  Found $($tasks.Count) tasks" -ForegroundColor Gray
} else {
    Write-Host "  No tasks found" -ForegroundColor Yellow
}

# Test 4: Get Activities
Write-Host "`n[4] Testing Get Activities..." -ForegroundColor Yellow
$activities = Test-API -Url "$apiUrl/activities/" -Headers $headers

if ($activities -and $activities.Count -gt 0) {
    Write-Host "  Found $($activities.Count) activities" -ForegroundColor Gray
    Write-Host "  Latest: $($activities[0].action)" -ForegroundColor Gray
} else {
    Write-Host "  No activities found" -ForegroundColor Yellow
}

# Test 5: Get Messages
Write-Host "`n[5] Testing Get Messages..." -ForegroundColor Yellow
$messages = Test-API -Url "$apiUrl/messages/" -Headers $headers

if ($messages -and $messages.Count -gt 0) {
    Write-Host "  Found $($messages.Count) messages" -ForegroundColor Gray
} else {
    Write-Host "  No messages found" -ForegroundColor Yellow
}

# Test 6: Send a Message
if ($projectId) {
    Write-Host "`n[6] Testing Send Message..." -ForegroundColor Yellow
    $newMessage = Test-API -Url "$apiUrl/messages/" -Method POST -Headers $headers -Body @{
        project = $projectId
        message = "Test message at $(Get-Date -Format 'HH:mm:ss')"
    }
    
    if ($newMessage) {
        Write-Host "  Message ID: $($newMessage.id)" -ForegroundColor Gray
        Write-Host "  Content: $($newMessage.message)" -ForegroundColor Gray
    }
}

# Test 7: Create a Task
if ($projectId) {
    Write-Host "`n[7] Testing Create Task..." -ForegroundColor Yellow
    $newTask = Test-API -Url "$apiUrl/tasks/" -Method POST -Headers $headers -Body @{
        project = $projectId
        title = "Test Task $(Get-Date -Format 'HH:mm:ss')"
        description = "Automated test"
        status = "todo"
        priority = "low"
        estimated_hours = 2
    }
    
    if ($newTask) {
        Write-Host "  Task ID: $($newTask.id)" -ForegroundColor Gray
        Write-Host "  Title: $($newTask.title)" -ForegroundColor Gray
        
        # Delete the test task
        Write-Host "  Cleaning up..." -ForegroundColor Gray
        Test-API -Url "$apiUrl/tasks/$($newTask.id)/" -Method DELETE -Headers $headers | Out-Null
    }
}

# Test 8: Dashboard Stats
Write-Host "`n[8] Testing Dashboard Stats..." -ForegroundColor Yellow
$dashboard = Test-API -Url "$apiUrl/auth/dashboard/" -Headers $headers

if ($dashboard) {
    Write-Host "  Total Projects: $($dashboard.total_projects)" -ForegroundColor Gray
    Write-Host "  Total Tasks: $($dashboard.total_tasks)" -ForegroundColor Gray
}

# Test 9: Team Dashboard
Write-Host "`n[9] Testing Team Dashboard..." -ForegroundColor Yellow
$teamDashboard = Test-API -Url "$apiUrl/team-dashboard/" -Headers $headers

if ($teamDashboard) {
    Write-Host "  Stats: $($teamDashboard.stats.total_tasks) tasks" -ForegroundColor Gray
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "═" * 40 -ForegroundColor Cyan
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host "═" * 40 -ForegroundColor Cyan
Write-Host ""
