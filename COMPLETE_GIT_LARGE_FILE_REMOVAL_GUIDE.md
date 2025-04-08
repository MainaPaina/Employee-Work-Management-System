# Complete Guide to Remove Large Files from Git History

## The Problem

You're trying to push to GitHub, but it's rejecting your push because it detected a large file (`Better-Time-Management.zip`, 291.27MB) that exceeds GitHub's file size limit of 100MB. Even though you may have moved or deleted the file, it still exists in your Git history.

## Solution 1: The Nuclear Option (Recommended)

This approach creates a new branch without the large file and then replaces your current branch with it. This is the most reliable method.

### Using the Provided Scripts

I've created two scripts for you:
- `remove-large-file.ps1` (PowerShell script)
- `remove-large-file.bat` (Batch script)

Choose one based on your preference and run it. The script will:
1. Create a new orphan branch
2. Add all files except the large file
3. Commit the changes
4. Delete the original branch
5. Rename the temporary branch
6. Force push to update the remote repository

### Manual Steps (if you prefer not to use the scripts)

```bash
# 1. Create a new orphan branch
git checkout --orphan temp_branch

# 2. Add all files except the large file
git add --all -- ':!Better-Time-Management.zip'

# 3. Commit the changes
git commit -m "Initial commit without large file"

# 4. Delete the original branch (replace 'supabase' with your branch name)
git branch -D supabase

# 5. Rename the temporary branch
git branch -m supabase

# 6. Force push to update the remote repository
git push -f origin supabase
```

## Solution 2: Using BFG Repo-Cleaner

BFG is a faster, simpler alternative to git filter-branch.

1. Download BFG Repo-Cleaner from: https://rtyley.github.io/bfg-repo-cleaner/

2. Create a fresh clone of your repository:
   ```bash
   git clone --mirror https://github.com/PopeDrex/Better-Time-Management.git repo.git
   ```

3. Run BFG to remove the large file:
   ```bash
   java -jar bfg.jar --delete-files Better-Time-Management.zip repo.git
   ```

4. Clean up the repository:
   ```bash
   cd repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force --all
   ```

## Solution 3: Using Git Filter-Branch

This approach uses built-in Git commands but is more complex.

```bash
# 1. Create a fresh clone (this is safer)
git clone --mirror https://github.com/PopeDrex/Better-Time-Management.git temp-repo
cd temp-repo

# 2. Remove the file from Git history
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch Better-Time-Management.zip" --prune-empty --tag-name-filter cat -- --all

# 3. Clean up and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push to GitHub
git push --force --all
```

## Solution 4: Using Git Filter-Repo (Most Modern Approach)

Git filter-repo is a newer, faster, and more powerful alternative to git filter-branch.

1. Install git-filter-repo:
   ```bash
   pip install git-filter-repo
   ```

2. Use it to remove the large file:
   ```bash
   git filter-repo --path Better-Time-Management.zip --invert-paths
   ```

3. Force push to GitHub:
   ```bash
   git push --force --all
   ```

## Important Notes

1. **Backup your repository** before attempting these operations.
2. If you have branch protection enabled on GitHub, you may need to temporarily disable it.
3. After pushing, all collaborators should re-clone the repository or run:
   ```bash
   git fetch --all
   git reset --hard origin/supabase  # or whatever your branch name is
   ```
4. Make sure the large file is not added back to the repository in future commits.

## Preventing Future Issues

1. I've updated your `.gitignore` file to include common large file types and specifically the `Better-Time-Management.zip` file.
2. Consider using Git LFS (Large File Storage) for large files: https://git-lfs.github.com/
3. Regularly check your repository size with:
   ```bash
   git count-objects -v -H
   ```

## If All Else Fails

If none of these solutions work, consider:

1. Creating a new repository and pushing your code there
2. Contacting GitHub support for assistance
3. Using a different Git hosting service that allows larger files
