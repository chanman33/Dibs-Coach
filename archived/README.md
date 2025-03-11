# Archived Components and Code

This directory contains components, features, and code that are not currently used in the MVP but may be valuable for future development.

## Directory Structure

The structure mirrors the main project layout:

```
archived/
├── components/     # Archived UI components
├── app/           # Archived pages and routes
├── lib/           # Archived utility functions and libraries
└── features/      # Complete feature sets that were removed from MVP
```

## Usage Guidelines

1. When archiving code:
   - Maintain the same file structure as it was in the main project
   - Include any relevant dependencies or requirements in comments
   - Add a brief comment at the top of each file explaining why it was archived
   - Document any specific requirements or setup needed to re-implement the feature

2. When restoring code:
   - Review and update dependencies
   - Test thoroughly before reintegrating
   - Update to current project standards and patterns
   - Remove from archived directory once successfully reintegrated

## Currently Archived Features

- AI Agent
- AI Listing Generator

## Notes

- This directory is included in version control but excluded from the build process
- Code here may need updates when reintegrated due to project evolution
- Consider this a reference implementation rather than copy-paste-ready code 