# Mobile App Store Deployment Guide

This guide will help you deploy the Blackjack Statistics app to Google Play Store and Apple App Store.

## Prerequisites

### For Both Platforms
- Completed React app (already built)
- Developer accounts:
  - **Google Play Console**: $25 one-time fee
  - **Apple Developer Program**: $99/year

### For Android (Google Play)
- Android Studio installed
- Java Development Kit (JDK) 11+
- Android SDK

### For iOS (App Store)
- macOS computer with Xcode
- Apple Developer account
- Valid certificates and provisioning profiles

## Option 1: Using Capacitor (Recommended)

Capacitor makes it easy to convert your web app to native mobile apps.

### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

Answer the prompts:
- App name: `Blackjack Statistics`
- App ID: `com.m2ealabs.blackjackstats` (reverse domain format)
- Web directory: `dist`

### Step 3: Build the Web App

```bash
npm run build
```

### Step 4: Add Platforms

```bash
# For Android
npx cap add android

# For iOS (macOS only)
npx cap add ios
```

### Step 5: Configure App Icons and Splash Screens

Create app icons:
- Android: 192x192, 512x512 PNG
- iOS: Multiple sizes (use tools like [appicon.co](https://appicon.co))

Place icons in:
- Android: `android/app/src/main/res/`
- iOS: `ios/App/App/Assets.xcassets/`

### Step 6: Sync and Copy Files

```bash
npx cap sync
```

This copies your web build to native projects.

## Android Deployment (Google Play Store)

### Step 1: Configure Android Build

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.m2ealabs.blackjackstats"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 2: Generate Signing Key

```bash
keytool -genkey -v -keystore blackjack-stats.keystore -alias blackjack-stats-key -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file securely!

### Step 3: Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=blackjack-stats-key
storeFile=../blackjack-stats.keystore
```

Edit `android/app/build.gradle` to use the signing config.

### Step 4: Build Release APK/AAB

```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (preferred by Play Store)
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in app details:
   - **Title**: Blackjack Statistics
   - **Short description**: Learn blackjack odds through play
   - **Full description**: (Use content from README)
   - **Category**: Education or Games
   - **Content rating**: Rate your app
4. Upload screenshots (at least 2, phone and tablet)
5. Upload feature graphic (1024x500)
6. Upload app icon (512x512)
7. Upload the AAB file to production track
8. Set pricing (Free)
9. Select countries
10. Submit for review

**Important**: Make sure to clearly state in the description that this is for educational purposes only and not for real gambling.

## iOS Deployment (Apple App Store)

### Step 1: Open iOS Project

```bash
npx cap open ios
```

This opens Xcode.

### Step 2: Configure Project Settings

In Xcode:
1. Select the project in the navigator
2. Update Bundle Identifier: `com.m2ealabs.blackjackstats`
3. Set Version: `1.0.0`
4. Set Build: `1`
5. Select your development team

### Step 3: Configure App Icons

1. In Xcode, go to Assets.xcassets
2. Add AppIcon set with all required sizes
3. Use a tool to generate all sizes from your 1024x1024 icon

### Step 4: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app:
   - **Platform**: iOS
   - **Name**: Blackjack Statistics
   - **Primary Language**: English
   - **Bundle ID**: com.m2ealabs.blackjackstats
   - **SKU**: BLACKJACKSTATS001
   - **User Access**: Full Access

### Step 5: Archive and Upload

In Xcode:
1. Select "Any iOS Device" as the destination
2. Product → Archive
3. Once archived, click "Distribute App"
4. Select "App Store Connect"
5. Follow the upload wizard

### Step 6: Complete App Store Listing

In App Store Connect:
1. **App Information**:
   - Subtitle: Educational blackjack odds trainer
   - Privacy Policy URL: (create one if needed)
   
2. **Pricing**: Free

3. **App Privacy**: Answer questionnaire about data collection

4. **Screenshots**: 
   - iPhone 6.7" (required)
   - iPhone 6.5" (required)
   - iPad Pro 12.9" (recommended)

5. **Description**: Use content from README, emphasizing educational nature

6. **Keywords**: blackjack, statistics, education, probability, odds, learning

7. **Age Rating**: Complete questionnaire (likely 12+ for simulated gambling)

8. **App Review Information**:
   - **Notes**: "This is an educational app for learning blackjack probability. No real money gambling is involved."

9. Submit for review

## Option 2: Using React Native (For Advanced Users)

If you want a fully native experience, you can rebuild the app in React Native:

```bash
npx react-native init BlackjackStats
```

Then recreate the components using React Native components instead of HTML/CSS.

Benefits:
- Better performance
- Native feel
- Access to native APIs

Drawbacks:
- More work to rebuild
- Separate codebase to maintain

## Testing Before Submission

### Android
```bash
# Install on device via USB debugging
cd android
./gradlew installRelease
```

### iOS
Use Xcode's device testing or TestFlight for beta testing.

## Post-Launch

### Updates

When you need to update the app:

1. Make changes to the web app
2. Increment version in `package.json`
3. Build: `npm run build`
4. Sync: `npx cap sync`
5. Build native apps with new version numbers
6. Upload to stores

### Monitoring

- **Google Play Console**: Check crash reports, reviews
- **App Store Connect**: Check crash analytics, reviews
- Respond to user reviews promptly

## Important Legal Considerations

### For Both App Stores

You MUST include:

1. **Terms of Use** (already in app) ✓
2. **Privacy Policy**: Create one explaining:
   - What data you collect (coins, player names in localStorage)
   - That you don't collect personal information
   - That you don't share data with third parties
   
3. **Age Rating**: Properly rate the app:
   - Google Play: ESRB Everyone or Teen
   - App Store: 12+ (simulated gambling)

4. **Disclaimers**: Make it VERY clear this is:
   - Educational only
   - Not real gambling
   - No real money involved
   - Statistical estimates may vary

### Store-Specific Requirements

**Google Play**:
- Must comply with Gambling policies
- Educational gambling apps allowed if clearly marked
- Cannot accept real money

**Apple App Store**:
- Similar gambling restrictions
- Must not facilitate real gambling
- Educational apps allowed

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node version (18+)
2. **Icons not showing**: Ensure proper sizes and formats
3. **App rejected**: Review store policies and resubmit with clarifications

### Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)

## Estimated Timeline

- **Initial setup**: 1-2 hours
- **Android build**: 30 minutes
- **iOS build**: 1 hour
- **App store listing**: 2-3 hours
- **Review time**: 
  - Google Play: 1-3 days
  - Apple App Store: 1-7 days

Good luck with your app deployment! 🎉
