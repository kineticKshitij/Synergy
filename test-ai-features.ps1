# Synergy AI Features Test Script
# Tests all AI-powered endpoints

# Configuration
$baseUrl = "http://localhost"
$apiUrl = "$baseUrl/api"

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SYNERGY AI FEATURES TEST SUITE                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test function
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    
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
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "✓ Success (Status: $($response.StatusCode))" -ForegroundColor Green
        return @{
            Success = $true
            Data = $data
            StatusCode = $response.StatusCode
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value__ } else { "N/A" }
        Write-Host "✗ Failed (Status: $statusCode)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# Step 1: Login
Write-Host "`n[1] Authenticating..." -ForegroundColor Cyan
$loginResult = Test-Endpoint -Method POST -Url "$apiUrl/auth/login/" `
    -Description "User Login" `
    -Body @{
        username = "admin"
        password = "admin"
    }

if (-not $loginResult.Success) {
    Write-Host "`n✗ Login failed! Cannot proceed with AI tests." -ForegroundColor Red
    exit 1
}

$token = $loginResult.Data.access
$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "✓ Authenticated successfully" -ForegroundColor Green
Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray

# Step 2: Get Dashboard with AI Insights
Write-Host "`n[2] Testing Dashboard with AI Insights..." -ForegroundColor Cyan
$dashboardResult = Test-Endpoint -Method GET -Url "$apiUrl/auth/dashboard/" `
    -Description "Dashboard Stats with AI" `
    -Headers $headers

if ($dashboardResult.Success) {
    $aiInsights = $dashboardResult.Data.ai_insights
    Write-Host "`nAI Insights:" -ForegroundColor White
    Write-Host "  Enabled: $($aiInsights.enabled)" -ForegroundColor $(if ($aiInsights.enabled) { "Green" } else { "Yellow" })
    
    if ($aiInsights.enabled) {
        Write-Host "  Productivity Score: $($aiInsights.productivity_score)%" -ForegroundColor Cyan
        Write-Host "  Trend: $($aiInsights.trend)" -ForegroundColor Cyan
        
        if ($aiInsights.key_insights -and $aiInsights.key_insights.Count -gt 0) {
            Write-Host "  Key Insights:" -ForegroundColor Cyan
            foreach ($insight in $aiInsights.key_insights) {
                Write-Host "    • $insight" -ForegroundColor Gray
            }
        }
        
        if ($aiInsights.focus_areas -and $aiInsights.focus_areas.Count -gt 0) {
            Write-Host "  Focus Areas:" -ForegroundColor Cyan
            foreach ($area in $aiInsights.focus_areas) {
                Write-Host "    • $area" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ℹ AI features require GEMINI_API_KEY configuration" -ForegroundColor Yellow
    }
}

# Step 3: Get Projects
Write-Host "`n[3] Getting Projects..." -ForegroundColor Cyan
$projectsResult = Test-Endpoint -Method GET -Url "$apiUrl/projects/" `
    -Description "List Projects" `
    -Headers $headers

if (-not $projectsResult.Success -or -not $projectsResult.Data -or $projectsResult.Data.Count -eq 0) {
    Write-Host "✗ No projects found. Creating a test project..." -ForegroundColor Yellow
    
    $createResult = Test-Endpoint -Method POST -Url "$apiUrl/projects/" `
        -Description "Create Test Project" `
        -Headers $headers `
        -Body @{
            name = "AI Test Project"
            description = "Project for testing AI features"
            status = "active"
            priority = "high"
        }
    
    if ($createResult.Success) {
        $projectId = $createResult.Data.id
        Write-Host "✓ Created test project with ID: $projectId" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create test project" -ForegroundColor Red
        exit 1
    }
} else {
    $projectId = $projectsResult.Data[0].id
    Write-Host "✓ Using existing project: $($projectsResult.Data[0].name) (ID: $projectId)" -ForegroundColor Green
}

# Step 4: Test AI Task Suggestions
Write-Host "`n[4] Testing AI Task Suggestions..." -ForegroundColor Cyan
$suggestionsResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/task_suggestions/" `
    -Description "Generate Task Suggestions" `
    -Headers $headers `
    -Body @{ project_id = $projectId }

if ($suggestionsResult.Success) {
    $suggestions = $suggestionsResult.Data.suggestions
    Write-Host "  AI Enabled: $($suggestionsResult.Data.enabled)" -ForegroundColor $(if ($suggestionsResult.Data.enabled) { "Green" } else { "Yellow" })
    Write-Host "  Suggestions Count: $($suggestions.Count)" -ForegroundColor Cyan
    
    if ($suggestions.Count -gt 0) {
        Write-Host "`n  Top 3 Suggested Tasks:" -ForegroundColor White
        foreach ($suggestion in $suggestions[0..([Math]::Min(2, $suggestions.Count - 1))]) {
            Write-Host "    • [$($suggestion.priority)] $($suggestion.title)" -ForegroundColor Cyan
            Write-Host "      Description: $($suggestion.description.Substring(0, [Math]::Min(80, $suggestion.description.Length)))..." -ForegroundColor Gray
            Write-Host "      Estimated: $($suggestion.estimated_hours) hours" -ForegroundColor Gray
        }
    }
}

# Step 5: Test AI Risk Analysis
Write-Host "`n[5] Testing AI Risk Analysis..." -ForegroundColor Cyan
$riskResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/risk_analysis/" `
    -Description "Analyze Project Risks" `
    -Headers $headers `
    -Body @{ project_id = $projectId }

if ($riskResult.Success) {
    $analysis = $riskResult.Data.analysis
    Write-Host "  AI Enabled: $($riskResult.Data.enabled)" -ForegroundColor $(if ($riskResult.Data.enabled) { "Green" } else { "Yellow" })
    
    $riskColor = switch ($analysis.risk_level) {
        "low" { "Green" }
        "medium" { "Yellow" }
        "high" { "Red" }
        "critical" { "Red" }
        default { "Gray" }
    }
    
    Write-Host "  Risk Score: $($analysis.risk_score)/100" -ForegroundColor $riskColor
    Write-Host "  Risk Level: $($analysis.risk_level.ToUpper())" -ForegroundColor $riskColor
    
    if ($analysis.key_risks -and $analysis.key_risks.Count -gt 0) {
        Write-Host "`n  Key Risks:" -ForegroundColor White
        foreach ($risk in $analysis.key_risks) {
            Write-Host "    ⚠ $risk" -ForegroundColor Yellow
        }
    }
    
    if ($analysis.recommendations -and $analysis.recommendations.Count -gt 0) {
        Write-Host "`n  Recommendations:" -ForegroundColor White
        foreach ($rec in $analysis.recommendations) {
            Write-Host "    ✓ $rec" -ForegroundColor Green
        }
    }
}

# Step 6: Test Natural Language Task Parsing
Write-Host "`n[6] Testing Natural Language Task Parsing..." -ForegroundColor Cyan
$nlInput = "Need to deploy the application to production by next Friday. This is urgent and will take about 8 hours."
$nlResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/parse_nl_task/" `
    -Description "Parse NL Task Description" `
    -Headers $headers `
    -Body @{
        description = $nlInput
        project_id = $projectId
    }

if ($nlResult.Success) {
    $parsedTask = $nlResult.Data.parsed_task
    Write-Host "  AI Enabled: $($nlResult.Data.enabled)" -ForegroundColor $(if ($nlResult.Data.enabled) { "Green" } else { "Yellow" })
    Write-Host "`n  Input: `"$nlInput`"" -ForegroundColor White
    Write-Host "`n  Parsed Task:" -ForegroundColor White
    Write-Host "    Title: $($parsedTask.title)" -ForegroundColor Cyan
    Write-Host "    Description: $($parsedTask.description)" -ForegroundColor Gray
    Write-Host "    Priority: $($parsedTask.priority)" -ForegroundColor Cyan
    Write-Host "    Estimated: $($parsedTask.estimated_hours) hours" -ForegroundColor Cyan
    if ($parsedTask.tags -and $parsedTask.tags.Count -gt 0) {
        Write-Host "    Tags: $($parsedTask.tags -join ', ')" -ForegroundColor Cyan
    }
    if ($parsedTask.due_date_suggestion) {
        Write-Host "    Due Date Suggestion: $($parsedTask.due_date_suggestion)" -ForegroundColor Cyan
    }
}

# Step 7: Test Generate Insights
Write-Host "`n[7] Testing AI Insights Generation..." -ForegroundColor Cyan
$insightsResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/generate_insights/" `
    -Description "Generate User Insights" `
    -Headers $headers

if ($insightsResult.Success) {
    $insights = $insightsResult.Data.insights
    Write-Host "  AI Enabled: $($insightsResult.Data.enabled)" -ForegroundColor $(if ($insightsResult.Data.enabled) { "Green" } else { "Yellow" })
    
    if ($insights) {
        Write-Host "  Productivity Score: $($insights.productivity_score)%" -ForegroundColor Cyan
        Write-Host "  Trend: $($insights.trend)" -ForegroundColor Cyan
        
        if ($insights.predictions -and $insights.predictions.Count -gt 0) {
            Write-Host "`n  Predictions:" -ForegroundColor White
            foreach ($pred in $insights.predictions) {
                Write-Host "    • $pred" -ForegroundColor Magenta
            }
        }
        
        if ($insights.automation_suggestions -and $insights.automation_suggestions.Count -gt 0) {
            Write-Host "`n  Automation Suggestions:" -ForegroundColor White
            foreach ($sug in $insights.automation_suggestions) {
                Write-Host "    • $sug" -ForegroundColor Blue
            }
        }
    }
}

# Step 8: Test Project Summary Generation
Write-Host "`n[8] Testing AI Project Summary..." -ForegroundColor Cyan
$summaryResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/project_summary/" `
    -Description "Generate Project Summary" `
    -Headers $headers `
    -Body @{ project_id = $projectId }

if ($summaryResult.Success) {
    Write-Host "  AI Enabled: $($summaryResult.Data.enabled)" -ForegroundColor $(if ($summaryResult.Data.enabled) { "Green" } else { "Yellow" })
    Write-Host "`n  Generated Summary:" -ForegroundColor White
    Write-Host "  $($summaryResult.Data.summary)" -ForegroundColor Gray
}

# Step 9: Test Task Prioritization
Write-Host "`n[9] Testing AI Task Prioritization..." -ForegroundColor Cyan

# Create a few test tasks first
Write-Host "  Creating test tasks..." -ForegroundColor Gray
$taskIds = @()

$testTasks = @(
    @{ title = "Critical bug fix"; priority = "critical"; status = "todo" },
    @{ title = "Update documentation"; priority = "low"; status = "todo" },
    @{ title = "Code review"; priority = "high"; status = "in_progress" },
    @{ title = "Feature implementation"; priority = "medium"; status = "todo" }
)

foreach ($taskData in $testTasks) {
    $taskResult = Test-Endpoint -Method POST -Url "$apiUrl/tasks/" `
        -Description "Create Task: $($taskData.title)" `
        -Headers $headers `
        -Body (@{
            project = $projectId
            title = $taskData.title
            description = "Test task for AI prioritization"
            status = $taskData.status
            priority = $taskData.priority
        })
    
    if ($taskResult.Success) {
        $taskIds += $taskResult.Data.id
    }
}

Write-Host "  Created $($taskIds.Count) test tasks" -ForegroundColor Green

# Now test prioritization
$prioritizeResult = Test-Endpoint -Method POST -Url "$apiUrl/ai/prioritize_tasks/" `
    -Description "Prioritize Tasks" `
    -Headers $headers `
    -Body @{
        project_id = $projectId
        task_ids = $taskIds
    }

if ($prioritizeResult.Success) {
    Write-Host "  AI Enabled: $($prioritizeResult.Data.enabled)" -ForegroundColor $(if ($prioritizeResult.Data.enabled) { "Green" } else { "Yellow" })
    $prioritized = $prioritizeResult.Data.prioritized_tasks
    
    Write-Host "`n  Prioritized Task Order:" -ForegroundColor White
    for ($i = 0; $i -lt $prioritized.Count; $i++) {
        $task = $prioritized[$i]
        Write-Host "    $($i + 1). [$($task.priority)] $($task.title) - $($task.status)" -ForegroundColor Cyan
    }
    
    if ($prioritized.Count -gt 0 -and $prioritized[0].ai_reasoning) {
        Write-Host "`n  AI Reasoning: $($prioritized[0].ai_reasoning)" -ForegroundColor Gray
    }
}

# Cleanup test tasks
Write-Host "`n  Cleaning up test tasks..." -ForegroundColor Gray
foreach ($taskId in $taskIds) {
    try {
        Invoke-WebRequest -Uri "$apiUrl/tasks/$taskId/" -Method DELETE `
            -Headers $headers -UseBasicParsing | Out-Null
    } catch {
        # Ignore errors during cleanup
    }
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AI FEATURES TEST SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ All AI endpoint tests completed!" -ForegroundColor Green
Write-Host "`nℹ AI features tested:" -ForegroundColor Cyan
Write-Host "  • Dashboard with AI Insights" -ForegroundColor White
Write-Host "  • Task Suggestions Generation" -ForegroundColor White
Write-Host "  • Project Risk Analysis" -ForegroundColor White
Write-Host "  • Natural Language Task Parsing" -ForegroundColor White
Write-Host "  • User Insights Generation" -ForegroundColor White
Write-Host "  • Project Summary Generation" -ForegroundColor White
Write-Host "  • Intelligent Task Prioritization" -ForegroundColor White

Write-Host "`nℹ Note: AI features work in fallback mode without GEMINI_API_KEY" -ForegroundColor Yellow
Write-Host "  Set GEMINI_API_KEY in .env file to enable full AI capabilities" -ForegroundColor Yellow
Write-Host ""
