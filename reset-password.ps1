# Reset Team Member Password
# This script resets a team member's password to a new value

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$NewPassword
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Reset Team Member Password" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Resetting password for user: $Username" -ForegroundColor Yellow
Write-Host ""

$command = "from django.contrib.auth.models import User; u = User.objects.get(username='$Username'); u.set_password('$NewPassword'); u.save(); print('Password reset successfully for user:', u.username)"

try {
    $result = docker-compose exec backend python manage.py shell -c $command 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password reset successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New credentials:" -ForegroundColor Cyan
        Write-Host "  Username: $Username" -ForegroundColor White
        Write-Host "  Password: $NewPassword" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now test login with:" -ForegroundColor Gray
        Write-Host "  .\test-login.ps1 -Username '$Username' -Password '$NewPassword'" -ForegroundColor Gray
    }
    else {
        Write-Host "✗ Failed to reset password!" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Error occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
