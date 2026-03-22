# FocusFlow - Google Play Console Deployment Guide

## Prerequisites

1. Android Studio installed
2. Java JDK 17+ installed
3. Google Play Console developer account ($25 one-time fee)

## Step 1: Generate Release Keystore

Run this command to create your signing key (keep this file safe - you'll need it for all future updates):

```bash
keytool -genkey -v -keystore focusflow-release-key.keystore -alias focusflow -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to enter:

- Keystore password
- Your name, organization, city, state, country
- Key password (can be same as keystore password)

**⚠️ IMPORTANT: Store this keystore file and passwords securely. If you lose them, you cannot update your app!**

## Step 2: Configure Signing

Create/edit `android/gradle.properties` and add:

```properties
FOCUSFLOW_RELEASE_STORE_FILE=../focusflow-release-key.keystore
FOCUSFLOW_RELEASE_STORE_PASSWORD=your_keystore_password
FOCUSFLOW_RELEASE_KEY_ALIAS=focusflow
FOCUSFLOW_RELEASE_KEY_PASSWORD=your_key_password
```

## Step 3: Build Release Bundle (AAB)

```bash
# Build web app and sync to Android
npm run android:build

# Open Android Studio
npm run cap:open
```

In Android Studio:

1. Go to **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore and enter passwords
4. Select **release** build variant
5. Click **Create**

The AAB file will be at: `android/app/release/app-release.aab`

## Step 4: Create Play Console Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: **FocusFlow**
   - Default language: English
   - App type: App
   - Free or paid: Free
   - Declarations: Check all required boxes

## Step 5: Store Listing Setup

### App Details

- **Title**: FocusFlow - AI Day Planner
- **Short description** (80 chars): AI-powered productivity app for task planning, habits & focus sessions
- **Full description** (4000 chars):

```
FocusFlow is your AI-powered personal productivity OS that helps you plan your day, manage tasks and habits, and stay focused.

🎯 SMART TASK MANAGEMENT
• Add tasks with natural language - just type "Call mom at 2pm for 15 mins"
• AI automatically parses time, duration, and priority
• Break complex tasks into actionable sub-tasks with AI assistance

⚡ MOOD-BASED SUGGESTIONS
• Tell the app how you're feeling (Energized, Focused, Tired, Stressed)
• Get personalized task recommendations based on your energy level
• AI motivational messages to keep you going

📊 AI DAILY SUMMARIES
• End-of-day productivity insights
• Highlights your top accomplishments
• Personalized tips for tomorrow

📥 SMART INBOX
• Save links from anywhere to process later
• AI categorizes and prioritizes saved content
• Get suggested actions for each item

⏱️ FOCUS MODE
• Dedicated distraction-free focus sessions
• Timer with task context
• Track your focus time

📈 GAMIFICATION
• Earn points for completing tasks
• Unlock achievement badges
• Build streaks and stay motivated

🌙 DARK MODE
• Beautiful light and dark themes
• System theme auto-detection

FocusFlow uses Google Gemini AI to provide intelligent suggestions while keeping your data private and secure.

Download now and transform how you plan your day!
```

### Graphics Required

- **App icon**: 512x512 PNG (see `android/app/src/main/res/mipmap-xxxhdpi/`)
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2 phone screenshots (1080x1920 or similar)

## Step 6: Content Rating

1. Go to **Policy > App content > Content rating**
2. Start questionnaire
3. For FocusFlow, answer:
   - Violence: None
   - Sexuality: None
   - Language: None
   - Controlled substances: None
   - Interactive elements: Shares location (No), Shares user info (No), etc.

You should get an **Everyone (E)** rating.

## Step 7: Privacy Policy

Required for apps with user data. Create a privacy policy page that covers:

- What data is collected (tasks, preferences stored locally)
- AI usage (Gemini API for suggestions)
- Data not shared with third parties

Host at: `https://yoursite.com/focusflow-privacy`

## Step 8: Upload AAB & Release

1. Go to **Release > Production**
2. Click **Create new release**
3. Upload your `app-release.aab` file
4. Add release notes:
   ```
   v1.0.0 - Initial Release
   • AI-powered task management
   • Mood-based suggestions
   • Natural language task input
   • Focus mode with timer
   • Dark mode support
   ```
5. Click **Review release**
6. Click **Start rollout to Production**

## App Bundle Commands

```bash
# Build for development
npm run android:build

# Open in Android Studio
npm run cap:open

# Sync web changes to Android
npm run cap:sync

# Build release bundle (from android folder)
cd android
./gradlew bundleRelease
```

## Updating the App

For future updates:

1. Update `versionCode` and `versionName` in `android/app/build.gradle`
2. Run `npm run android:build`
3. Build new AAB and upload to Play Console

## Troubleshooting

### Build fails

- Ensure Java 17+ is installed: `java -version`
- Ensure Android SDK is properly configured
- Run `npx cap sync android` to sync changes

### Signing issues

- Verify keystore path is correct
- Check passwords in gradle.properties
- Ensure keystore file exists at specified path
