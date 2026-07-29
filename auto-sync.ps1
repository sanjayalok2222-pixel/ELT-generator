# Auto-Sync script for Git push automation
Write-Host "Starting Git Auto-Sync Watcher..."
Write-Host "Watching directory for modifications..."

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")

while ($true) {
    $changes = git status --porcelain
    if ($changes) {
        Write-Host "$(Get-Date): Changes detected! Staging and committing..."
        git add .
        git commit -m "auto: sync workspace modifications"
        Write-Host "Pushing to GitHub remote repository..."
        git push origin main
        Write-Host "Sync completed successfully."
    }
    Start-Sleep -Seconds 15
}
