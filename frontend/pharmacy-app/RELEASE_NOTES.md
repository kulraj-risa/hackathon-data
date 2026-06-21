# Release Notes - v1.12.0

**Release Date:** December 23, 2025

## Overview

This release includes critical bug fixes for the pharmaceutical prior authorization workflow, specifically addressing data persistence issues in the report inaccuracy save functionality and form data handling.

## Summary of Changes

### Bug Fixes 🐛

- **Fixed Report Inaccuracy Save Issue**: Resolved a critical bug in the update API call that was preventing proper saving of report inaccuracy data in pharmaceutical PA forms
- **Improved Form Data Handling**: Enhanced the `getUpdatedFormDataWithFilledValues` utility to properly persist insurance information updates
- **Cleaned Up Form Picker Logic**: Removed unused form picker code that was causing conflicts in the insurance modal components

## Detailed Changes

### Pull Requests Merged

- **#45**: Bug fix for report inaccuracy save functionality
  - **Branch**: `bugFix/report_Inaccuracy_save`
  - **Status**: Merged
  - **Impact**: Critical fix for data persistence in pharma PA forms

### Commits

1. **71fc61b3** - Merge pull request #45 from risa-labs-inc/bugFix/report_Inaccuracy_save
   - **Author**: Shravyasri
   - **Date**: 2025-12-23
   - **Type**: Merge commit

2. **654f3f1f** - 🐛 fix(api 🌐): bug fix for update api call
   - **Author**: Shravya Sri
   - **Date**: 2025-12-23
   - **Impact**: Fixed API update call to properly save report inaccuracy data

## Files Changed

### Modified Files (2)

- `src/pages/pharmaPaForm/components/insuranceModalComponents/formPicker.tsx`
  - **Changes**: 3 deletions
  - **Purpose**: Removed unused form picker logic

- `src/pages/pharmaPaForm/utils/getUpdatedFormDataWithFilledValues.ts`
  - **Changes**: 1 insertion, 1 deletion
  - **Purpose**: Enhanced data handling for filled form values

## Statistics

- **Total Commits**: 2 (1 merge + 1 feature commit)
- **Files Changed**: 2
- **Insertions**: +1 line
- **Deletions**: -4 lines
- **Net Change**: -3 lines

## Contributors

We would like to thank the following contributors for their work on this release:

- **Shravya Sri**
- **Shravyasri**

## Component Impact

### Pharmaceutical Prior Authorization Workflow

This release specifically affects the pharmaceutical prior authorization form workflow:

- **Insurance Modal Components**: Improved stability and removed redundant code
- **Form Data Utilities**: Enhanced data persistence for report inaccuracy tracking
- **API Integration**: Fixed update API call to properly handle form data
- **Report Inaccuracy Tracking**: Resolved critical bug preventing data from being saved

## Testing Recommendations

Before deploying this release to production, we recommend:

1. Testing the pharmaceutical PA form workflow end-to-end
2. Verifying that report inaccuracy data saves correctly
3. Testing insurance information updates in the modal
4. Ensuring no regression in existing pharmaceutical PA functionality
5. Validating that form data persists properly after updates

## Deployment Notes

This release can be deployed using the standard deployment commands:

```bash
npm run deploy dev   # For development environment
npm run deploy prod  # For production environment
```

Ensure environment-specific configurations are properly set before deployment.

## Known Issues

No known issues at the time of this release.

## Breaking Changes

None. This release is fully backward compatible.

## Next Steps

Future releases will continue to enhance the pharmaceutical prior authorization workflow and address any emerging issues.

---

**Previous Version**: v1.11.0
**Current Version**: v1.12.0
**Release Type**: Minor (Bug Fix)
