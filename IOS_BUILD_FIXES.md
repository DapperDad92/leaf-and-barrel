# iOS Build Fixes Documentation

## Overview
This document outlines the fixes applied to resolve iOS build errors in the Leaf & Barrel project, particularly issues related to deployment targets and spaces in the project path.

## Issues Resolved

### 1. iOS Deployment Target Warnings
**Problem**: Multiple CocoaPods dependencies had deployment targets set to iOS 9.0 or 10.0, but the minimum supported version is iOS 12.0.

**Solution**: Added a post-install hook in the Podfile to enforce a minimum deployment target of iOS 12.0 for all pods:

```ruby
# Fix for deployment target warnings - ensure all pods use iOS 12.0 or higher
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |config|
    # Ensure the deployment target is at least iOS 12.0
    if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 12.0
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
    end
  end
end
```

### 2. ReactCodegen Build Failure with Spaces in Path
**Problem**: The project path contains spaces ("Leaf & Barrel"), which caused the ReactCodegen "Generate Specs" phase to fail during build.

**Solution**: Added a specific fix for the React-Codegen target to escape spaces in path variables:

```ruby
# Fix for ReactCodegen with spaces in project path
installer.pods_project.targets.each do |target|
  if target.name == 'React-Codegen'
    target.build_configurations.each do |config|
      # Escape spaces in paths for shell scripts
      config.build_settings['PODS_ROOT'] = config.build_settings['PODS_ROOT'].gsub(' ', '\ ')
      config.build_settings['PODS_TARGET_SRCROOT'] = config.build_settings['PODS_TARGET_SRCROOT'].gsub(' ', '\ ')
    end
  end
end
```

## Implementation Steps

1. **Updated ios/Podfile**: Added the post-install hooks to handle both deployment target and space-in-path issues.

2. **Cleaned and Reinstalled Pods**:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   ```

## Additional Considerations

### Spaces in Project Path
While the immediate ReactCodegen issue has been addressed, having spaces in the project path can cause various issues with build tools. Consider these best practices:

1. **Long-term Solution**: If possible, consider renaming the project directory to use underscores or hyphens instead of spaces (e.g., "Leaf-and-Barrel" or "LeafAndBarrel").

2. **Alternative Workarounds**: If renaming is not feasible:
   - Always quote paths in scripts: `"$PROJECT_DIR"` instead of `$PROJECT_DIR`
   - Use escape sequences when necessary: `Leaf\ &\ Barrel`
   - Be cautious with custom build scripts and ensure they handle spaces properly

3. **Testing**: After these fixes, always clean build folder in Xcode (Cmd+Shift+K) before building to ensure no cached issues remain.

### Path Safety Guard (Added in T1-post)
To prevent iOS build failures due to problematic characters in the project path, a path safety check has been implemented:

1. **Script Location**: `scripts/check-path-safe.js`
   - Checks for spaces and special characters: `& ( ) { } [ ] ! # $ ' " \`
   - Provides clear error messages with suggestions for safe paths
   - Exits with code 1 if unsafe characters are found

2. **Automatic Execution**: The path check runs automatically before:
   - `npm run ios`
   - `npm run dev:ios`
   - `npm run prebuild`
   - `npm run prebuild:clean`
   - `npm run build:ios`
   - `npm run build:development`

3. **Manual Check**: You can run the path check manually:
   ```bash
   npm run check:path
   ```

4. **Example Output**:
   ```
   ❌ Path Safety Check Failed!
   
   The current project path contains characters that will cause iOS build failures:
     /Users/MitRober/Documents/Leaf & Barrel
   
   Problematic characters found: /Users/MitRober/Documents/Leaf & Barrel
   
   iOS builds require paths without these characters:
   • Spaces
   • Special characters: & ( ) { } [ ] ! # $ ' " \
   
   Solution:
     Move your project to a path without special characters.
     For example: /Users/YourName/Projects/LeafAndBarrel
   ```

## Verification

To verify the fixes are working:

1. Open the project in Xcode
2. Clean the build folder (Product → Clean Build Folder)
3. Build the project (Cmd+B)
4. The deployment target warnings should be gone
5. The ReactCodegen phase should complete successfully

## Notes

- The pod installation warnings about `pod_target_xcconfig` merging are normal and don't affect the build
- The deprecation notice about calling `pod install` directly is informational and doesn't impact functionality
- These fixes are applied in the Podfile and will persist through future pod installations