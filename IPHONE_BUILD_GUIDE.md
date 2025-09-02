# iPhone Build Guide for Leaf & Barrel

Since the app uses react-native-vision-camera (a native module), you cannot use Expo Go. You have two options for building and running on your iPhone:

## Option 1: EAS Build (Expo Application Services) - Cloud Build

### Pros:
- ✅ No need for a Mac or Xcode
- ✅ Builds in the cloud
- ✅ Easier setup process
- ✅ Can build from any computer (Windows, Linux, Mac)

### Cons:
- ❌ Requires Apple Developer Account ($99/year)
- ❌ Build queue times (free tier has limited builds)
- ❌ Internet connection required for builds

### Requirements:
- Apple Developer Account ($99/year)
- EAS CLI installed
- Expo account (free)

### Steps:

1. **First, update dependencies** (since we removed patch-package):
   ```bash
   npm install
   ```

2. **Install EAS CLI globally**:
   ```bash
   npm install -g eas-cli
   ```

3. **Login to your Expo account**:
   ```bash
   eas login
   ```

4. **Configure EAS for your project**:
   ```bash
   eas build:configure
   ```
   This creates an `eas.json` file with build profiles.

5. **Create a development build for iOS**:
   ```bash
   npm run build:development
   # or
   eas build --profile development --platform ios
   ```

6. **Wait for the build** (usually 10-30 minutes):
   - You'll get a URL to monitor progress
   - You'll receive an email when complete

7. **Install on your iPhone**:
   - Download the build from the provided link
   - Install using TestFlight or direct install
   - Open the app on your device

8. **Run the development server**:
   ```bash
   npm start
   ```
   - Scan the QR code with your camera
   - It will open in your development build (not Expo Go)

---

## Option 2: Local Build with Xcode

### Pros:
- ✅ Can test on device without Apple Developer Account (personal team)
- ✅ Faster iteration for development
- ✅ Full control over the build process
- ✅ Can use Xcode debugging tools

### Cons:
- ❌ Requires a Mac with Xcode installed
- ❌ More complex setup
- ❌ Need to manage iOS certificates/provisioning

### Requirements:
- Mac with macOS
- Xcode installed (free from App Store)
- CocoaPods installed
- iPhone connected via USB

### Steps:

1. **Update dependencies**:
   ```bash
   npm install
   ```

2. **Generate native iOS project**:
   ```bash
   npm run prebuild:clean
   # or
   npx expo prebuild --clean
   ```
   This creates an `ios` folder with the Xcode project.

3. **Install iOS dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Open in Xcode**:
   ```bash
   open ios/LeafAndBarrel.xcworkspace
   ```
   Note: Open the `.xcworkspace` file, not `.xcodeproj`

5. **Configure signing**:
   - Select your project in Xcode
   - Go to "Signing & Capabilities" tab
   - Choose your team (can use "Personal Team" without paid account)
   - Let Xcode manage signing automatically

6. **Connect your iPhone**:
   - Connect via USB cable
   - Trust the computer on your iPhone
   - Select your device in Xcode's device dropdown

7. **Build and run**:
   - Click the "Play" button in Xcode
   - Or run: `npm run ios` (if device is connected)
   - First build will take 5-10 minutes

8. **For subsequent runs**:
   ```bash
   npm start
   ```
   The app will connect to your development server automatically.

---

## Which Option Should You Choose?

### Choose EAS Build if:
- You don't have a Mac
- You have an Apple Developer Account
- You want the simplest setup
- You're okay with cloud build times

### Choose Local Build if:
- You have a Mac with Xcode
- You want to test without a paid developer account
- You need faster iteration during development
- You want to use Xcode debugging tools

---

## Testing Without Developer Account

If you don't have an Apple Developer Account:
- **EAS Build**: Not possible for iOS (requires developer account)
- **Local Build**: Possible with "Personal Team" but:
  - App expires every 7 days
  - Limited to 3 apps at a time
  - Must rebuild weekly

---

## Troubleshooting

### Common Issues:

1. **"No bundle URL present"**:
   - Make sure Metro bundler is running (`npm start`)
   - Check your device is on the same network

2. **Camera permissions not working**:
   - Go to Settings > Privacy > Camera
   - Enable for Leaf & Barrel

3. **Build fails with signing error**:
   - Check your Apple ID in Xcode preferences
   - Ensure automatic signing is enabled

4. **Pod install fails**:
   - Update CocoaPods: `sudo gem install cocoapods`
   - Try: `cd ios && pod deintegrate && pod install`

---

## Next Steps After Building

1. Test the barcode scanner functionality
2. Verify all features work as expected
3. Check that the app doesn't crash
4. Test both known and unknown barcodes

Remember: Since we cleaned up the vision-camera-code-scanner references, the app should build cleanly without any FrameProcessorPluginBase errors.