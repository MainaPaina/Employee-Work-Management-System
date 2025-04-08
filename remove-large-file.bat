@echo off
echo Starting the process to remove Better-Time-Management.zip from Git history...
echo.

REM Configuration
set largeFile=Better-Time-Management.zip
set branch=supabase

echo Step 1: Creating a new orphan branch...
git checkout --orphan temp_branch

echo Step 2: Adding all files except the large file...
git add --all -- :!Better-Time-Management.zip

echo Step 3: Committing the changes...
git commit -m "Initial commit without large file"

echo Step 4: Deleting the original branch...
git branch -D %branch%

echo Step 5: Renaming the temporary branch...
git branch -m %branch%

echo Step 6: Force pushing to update the remote repository...
echo This will overwrite the remote branch. Press any key to continue or Ctrl+C to cancel...
pause
git push -f origin %branch%

echo.
echo Process completed successfully!
echo The large file has been removed from your Git history.
echo Note: All collaborators will need to re-clone the repository or run 'git fetch --all' and 'git reset --hard origin/%branch%'.
pause
