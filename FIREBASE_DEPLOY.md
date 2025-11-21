# Firebase Hosting Deployment Guide

## Step 1: Install Firebase CLI

If you don't have Firebase CLI installed yet, install it globally:

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

Sign in to your Firebase account:

```bash
firebase login
```

This will open a browser for authorization.

## Step 3: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the instructions to create a project
4. Enable **Firebase Hosting** in the project settings

## Step 4: Configure Project

Open the `.firebaserc` file and replace `your-project-id` with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

You can find the project ID in Firebase Console under project settings.

## Step 5: Build Project

Build the project for production:

```bash
npm run build
```

This will create the `apps/host/dist` folder with compiled files.

## Step 6: Deploy to Firebase

Deploy the project:

```bash
npm run deploy
```

Or only hosting:

```bash
npm run deploy:hosting
```

## Step 7: Get URL

After successful deployment, Firebase will provide you with URLs like:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Important Notes

### Module Federation

⚠️ **Warning**: If you're using Module Federation with remote modules (remotes), you need to deploy each module separately. Here's how:

#### Deploying Modules to Firebase Hosting

Each module (chat-module, default-module) needs its own Firebase project or hosting site. Follow these steps for each module:

**For each module (chat-module, default-module):**

1. **Create a Firebase project** (or use a separate site in your existing project):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or add a new hosting site to existing project
   - Enable Firebase Hosting

2. **Configure the module's Firebase project:**
   - Navigate to the module directory:
     ```bash
     cd modules/chat-module
     # or
     cd modules/default-module
     ```
   - Open `.firebaserc` and replace the project ID with your module's Firebase project ID

3. **Build and deploy the module:**
   
   From the project root, you can use the convenience scripts:
   ```bash
   npm run deploy:chat-module
   # or
   npm run deploy:default-module
   ```
   
   Or manually:
   ```bash
   cd modules/chat-module  # or modules/default-module
   npm run build
   firebase deploy --only hosting
   ```
   
   This creates a `dist` folder with the compiled module files, including `remoteEntry.js`, and deploys it.

5. **Get the module URL:**
   After deployment, note the URL (e.g., `https://your-chat-module.web.app`)

6. **Update host app configuration:**
   Once all modules are deployed, update `apps/host/webpack.config.js` to use production URLs:

   ```javascript
   remotes: {
     'default-module': 'default_module@https://your-default-module.web.app/remoteEntry.js',
     'chat-module': 'chat_module@https://your-chat-module.web.app/remoteEntry.js',
   }
   ```

7. **Verify module URLs are accessible:**
   After deploying modules, verify that `remoteEntry.js` files are accessible:
   - Open `https://your-chat-module.web.app/remoteEntry.js` in browser
   - Open `https://your-default-module.web.app/remoteEntry.js` in browser
   - Both should return JavaScript code (not 404)

8. **Update host app configuration:**
   Update `apps/host/src/core/modules/moduleLoader.ts` with production URLs (already configured to auto-detect, but verify the URLs match your deployed modules)

9. **Rebuild and redeploy the host app:**
   ```bash
   cd ../..  # back to project root
   npm run build
   npm run deploy
   ```

### Troubleshooting Module Loading Issues

If modules don't load in production:

1. **Check browser console** for errors:
   - Open browser DevTools (F12)
   - Check Console tab for module loading errors
   - Check Network tab to see if `remoteEntry.js` files are being loaded

2. **Verify module URLs:**
   - Test direct access to module URLs:
     - `https://your-chat-module.web.app/remoteEntry.js`
     - `https://your-default-module.web.app/remoteEntry.js`
   - These should return JavaScript, not HTML or 404

3. **Check CORS headers:**
   - Modules need CORS headers to be loaded from different domains
   - Verify `firebase.json` in each module has `Access-Control-Allow-Origin: *` header
   - Redeploy modules after updating `firebase.json` if needed

4. **Verify webpack configuration:**
   - Check `apps/host/webpack.config.js` - remotes should include `/remoteEntry.js`:
     ```javascript
     remotes: {
       'default-module': 'default_module@https://your-module.web.app/remoteEntry.js',
       'chat-module': 'chat_module@https://your-module.web.app/remoteEntry.js',
     }
     ```

5. **Check moduleLoader.ts:**
   - Verify URLs in `apps/host/src/core/modules/moduleLoader.ts` match your deployed module URLs
   - The loader automatically detects production vs development based on hostname

6. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache completely

7. **Check Firebase Hosting logs:**
   - Go to Firebase Console → Hosting
   - Check if there are any deployment errors or issues

**Alternative: Using the same Firebase project with multiple sites**

If you prefer to use one Firebase project, you can configure multiple hosting sites in `firebase.json`:

```json
{
  "hosting": [
    {
      "target": "host",
      "public": "apps/host/dist",
      ...
    },
    {
      "target": "chat-module",
      "public": "modules/chat-module/dist",
      ...
    },
    {
      "target": "default-module",
      "public": "modules/default-module/dist",
      ...
    }
  ]
}
```

Then use `firebase target:apply hosting <target> <site-id>` to map targets to hosting sites.

### Environment Variables

#### Gemini API Key Configuration

The chat-module requires a Gemini API key for AI chat functionality. To configure it:

**Option 1: Environment Variable (Recommended for local development)**

Create a `.env` file in `modules/chat-module/` directory:
```
GEMINI_API_KEY=your-api-key-here
```

Or use `VITE_GEMINI_API_KEY`:
```
VITE_GEMINI_API_KEY=your-api-key-here
```

**Option 2: Build-time Environment Variable (For production deployment)**

When building for production, pass the API key as an environment variable:

```bash
cd modules/chat-module
GEMINI_API_KEY=your-api-key-here npm run build
firebase deploy --only hosting
```

Or on Windows PowerShell:
```powershell
$env:GEMINI_API_KEY="your-api-key-here"; npm run build; firebase deploy --only hosting
```

**Option 3: Runtime Configuration (More Secure)**

For better security, you can configure the API key at runtime by setting it in `window` object. Create a configuration script that loads before the module:

1. Create `modules/chat-module/dist/config.js`:
```javascript
window.VITE_GEMINI_API_KEY = 'your-api-key-here';
```

2. Add it to your HTML or load it before the module loads.

**⚠️ Security Note:** API keys embedded in client-side code are visible to anyone. Consider:
- Using Firebase Functions as a proxy for API calls
- Implementing API key restrictions in Google Cloud Console
- Using Firebase Remote Config for dynamic configuration

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and use it in your configuration

## Useful Commands

### Host App
- `npm run deploy` - build and deploy host app
- `npm run deploy:hosting` - deploy only hosting for host app

### Modules
- `npm run deploy:chat-module` - build and deploy chat-module
- `npm run deploy:default-module` - build and deploy default-module
- `npm run deploy:all-modules` - deploy all modules

### Firebase CLI
- `firebase deploy --only hosting` - deploy only hosting
- `firebase deploy --only hosting --project your-project-id` - deploy to a specific project
- `firebase hosting:channel:deploy preview` - create a preview channel for testing
- `firebase open hosting:site` - open the site in browser

## Rollback Deployment

If you need to rollback the last deployment:

```bash
firebase hosting:rollback
```

## Firebase Authentication Setup

### Authorized Domains

If you're using Firebase Authentication (e.g., Google Sign-In), you need to add your deployed domains to the authorized domains list in Firebase Console.

**Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Firebase project (the one used by your modules that have authentication)
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add all your deployed domains:
   - `hotcode-host-app.web.app`
   - `hotcode-host-app.firebaseapp.com`
   - `hotcode-chat-module.web.app`
   - `hotcode-chat-module.firebaseapp.com`
   - `hotcode-demo-module.web.app`
   - `hotcode-demo-module.firebaseapp.com`
   - `localhost` (for local development)

**Note:** Firebase automatically adds `localhost` and your project's default domains, but you need to manually add domains from other Firebase projects if your modules use different projects.

### Common Authentication Errors

- **`auth/unauthorized-domain`**: The domain is not in the authorized domains list. Add it in Firebase Console.
- **`auth/operation-not-allowed`**: The sign-in method is not enabled. Enable it in Authentication → Sign-in method.
- **`auth/api-key-not-valid`**: Check your Firebase configuration in the module's `firebase_config.js` file.
