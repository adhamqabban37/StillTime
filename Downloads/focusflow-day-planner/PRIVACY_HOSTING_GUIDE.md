# Privacy Policy Hosting Guide

## 📋 Your Privacy Policy

Your privacy policy has been created at: `privacy-policy.html`

To use it in Google Play Console, you need to host it online and get a public URL.

---

## 🚀 Hosting Options (Choose One)

### Option 1: GitHub Pages (FREE - Recommended)

**Step 1:** Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it: `focusflow-privacy`
3. Make it **Public**
4. Click "Create repository"

**Step 2:** Upload the privacy policy

1. Click "uploading an existing file"
2. Drag and drop `privacy-policy.html`
3. Rename it to `index.html` (for cleaner URL)
4. Click "Commit changes"

**Step 3:** Enable GitHub Pages

1. Go to repository Settings → Pages
2. Under "Source", select `main` branch
3. Click Save

**Your URL will be:**

```
https://YOUR-USERNAME.github.io/focusflow-privacy/
```

Example: `https://tyson.github.io/focusflow-privacy/`

---

### Option 2: Firebase Hosting (FREE)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy (put privacy-policy.html in public folder)
firebase deploy
```

**Your URL will be:** `https://YOUR-PROJECT.web.app/privacy-policy.html`

---

### Option 3: Netlify Drop (FREE - Fastest)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your `privacy-policy.html` file
3. Get instant URL!

**Your URL will be:** `https://random-name.netlify.app`

(You can customize the subdomain in settings)

---

### Option 4: Vercel (FREE)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel privacy-policy.html
```

---

## 📱 Adding to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Policy** → **App content**
4. Click **Privacy policy**
5. Paste your hosted URL
6. Click **Save**

---

## ⚡ Quick Start (GitHub Pages)

Run these commands to deploy instantly:

```bash
# Create a new folder for the privacy policy
mkdir focusflow-privacy
cd focusflow-privacy

# Copy the privacy policy
copy ..\privacy-policy.html index.html

# Initialize git and push
git init
git add .
git commit -m "Add privacy policy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/focusflow-privacy.git
git push -u origin main
```

Then enable GitHub Pages in repository settings.

---

## ✅ Checklist

- [ ] Create GitHub repository (or other host)
- [ ] Upload `privacy-policy.html`
- [ ] Get public URL
- [ ] Test URL in browser
- [ ] Add URL to Google Play Console
- [ ] Update contact email in privacy policy if needed

---

## 📧 Important: Update Contact Email

Before publishing, update the contact email in `privacy-policy.html`:

Find this line:

```html
<p><strong>Email:</strong> privacy@focusflow.app</p>
```

Replace with your actual email:

```html
<p><strong>Email:</strong> your-email@example.com</p>
```
