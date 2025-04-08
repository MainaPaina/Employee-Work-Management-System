# PowerShell script to remove a large file from Git history
# This script will create a new branch without the large file and then replace your current branch with it

# Configuration
$largeFile = "Better-Time-Management.zip"
$branch = "supabase"  # Change this to your branch name

Write-Host "Starting the process to remove $largeFile from Git history..." -ForegroundColor Green

# Step 1: Create a new orphan branch
Write-Host "Step 1: Creating a new orphan branch..." -ForegroundColor Cyan
git checkout --orphan temp_branch

# Step 2: Add all files except the large file
Write-Host "Step 2: Adding all files except the large file..." -ForegroundColor Cyan
git add --all -- ':!Better-Time-Management.zip'

# Step 3: Commit the changes
Write-Host "Step 3: Committing the changes..." -ForegroundColor Cyan
git commit -m "Initial commit without large file"

# Step 4: Delete the original branch
Write-Host "Step 4: Deleting the original branch..." -ForegroundColor Cyan
git branch -D $branch

# Step 5: Rename the temporary branch
Write-Host "Step 5: Renaming the temporary branch..." -ForegroundColor Cyan
git branch -m $branch

# Step 6: Force push to update the remote repository
Write-Host "Step 6: Force pushing to update the remote repository..." -ForegroundColor Cyan
Write-Host "This will overwrite the remote branch. Press any key to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
git push -f origin $branch

Write-Host "Process completed successfully!" -ForegroundColor Green
Write-Host "The large file has been removed from your Git history." -ForegroundColor Green
Write-Host "Note: All collaborators will need to re-clone the repository or run 'git fetch --all' and 'git reset --hard origin/$branch'." -ForegroundColor Yellow
