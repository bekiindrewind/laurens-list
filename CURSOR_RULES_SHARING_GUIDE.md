# Sharing .cursorrules Across Projects

This guide explains how to share your `.cursorrules` file across multiple Cursor projects to maintain consistent coding standards and best practices.

## Methods for Sharing

### Method 1: Symbolic Links (Recommended)

Create a centralized `.cursorrules` file and symlink it in each project:

**Step 1: Create a shared location**
```bash
# Create a directory for shared Cursor rules
mkdir -p ~/.cursor/shared-rules
cp .cursorrules ~/.cursor/shared-rules/.cursorrules
```

**Step 2: Create symlinks in each project**
```bash
# In each project directory
ln -s ~/.cursor/shared-rules/.cursorrules .cursorrules
```

**Benefits:**
- Single source of truth
- Updates automatically propagate to all projects
- Easy to maintain

**Note:** On Windows, use `mklink` instead:
```cmd
mklink .cursorrules C:\Users\YourName\.cursor\shared-rules\.cursorrules
```

### Method 2: User Rules (Global Settings)

Define global rules in Cursor's settings that apply to all projects:

1. Open Cursor Settings (Ctrl+, or Cmd+,)
2. Search for "Rules" or "User Rules"
3. Add your rules in the global settings

**Benefits:**
- Always applied to every project
- No need to copy files

**Limitations:**
- Cannot be toggled per project
- Less flexible than project-specific rules

### Method 3: Copy Template File

Use the `.cursorrules.template` file as a starting point for each new project:

```bash
# In each new project
cp ~/.cursor/shared-rules/.cursorrules.template .cursorrules
# Then customize project-specific parts if needed
```

**Benefits:**
- Project-specific customization possible
- Version control friendly

### Method 4: Git Submodule or Shared Repository

Store `.cursorrules` in a shared repository and reference it:

```bash
# Add as submodule
git submodule add https://github.com/yourusername/shared-cursor-rules .cursorrules

# Or copy from shared repo
curl -o .cursorrules https://raw.githubusercontent.com/yourusername/shared-cursor-rules/main/.cursorrules
```

## Template File

A generic template version of `.cursorrules` is available as `.cursorrules.template` in this repository. This version:

- Removes project-specific references (like "Lauren's List")
- Uses generic placeholders (like `project-name` instead of `laurens-list`)
- Can be customized per project if needed

## Best Practices

1. **Keep generic rules in shared file**: Development workflow, API integration, code quality rules
2. **Add project-specific rules locally**: Project-specific file paths, service names, etc.
3. **Version control**: Commit `.cursorrules` to each project's repository
4. **Document customizations**: If you customize the shared rules, document why

## Updating Shared Rules

When you update the shared `.cursorrules` file:

**If using symlinks:**
- Update the shared file once
- All projects automatically get the update

**If using copies:**
- Update each project's `.cursorrules` file
- Or use a script to update all projects:
  ```bash
  # Update all projects
  for dir in ~/projects/*/; do
    cp ~/.cursor/shared-rules/.cursorrules "$dir/.cursorrules"
  done
  ```

## Recommended Setup

For maximum flexibility:

1. **Use symlinks** for the base rules
2. **Add project-specific rules** in a separate section at the top or bottom of the file
3. **Version control** the shared template in a dedicated repository

Example structure:
```
.cursorrules (symlink to shared file)
.cursorrules.local (project-specific additions, if needed)
```

Then in your shared `.cursorrules`, add at the end:
```markdown
## Project-Specific Rules

<!-- Add project-specific rules here or in .cursorrules.local -->
```

## See Also

- [Cursor Rules Documentation](https://docs.cursor.com/en/context/rules)
- [Cursor Notepads (Beta)](https://docs.cursor.com/beta/notepads) - Alternative way to share reusable contexts

