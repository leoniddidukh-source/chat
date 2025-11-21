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

⚠️ **Warning**: If you're using Module Federation with remote modules (remotes), you will need to:

1. Deploy each module separately to Firebase Hosting or another hosting service
2. Update URLs in `webpack.config.js` for production, replacing `http://localhost:3001` and `http://localhost:3002` with actual URLs of your modules

Example update for production:

```javascript
remotes: {
  'default-module': 'default_module@https://your-default-module.web.app/remoteEntry.js',
  'chat-module': 'chat_module@https://your-chat-module.web.app/remoteEntry.js',
}
```

### Environment Variables

If your project uses environment variables, create a `.env.production` file in the project root or configure them in Firebase Console via Functions Config.

## Useful Commands

- `firebase deploy --only hosting` - deploy only hosting
- `firebase deploy --only hosting --project your-project-id` - deploy to a specific project
- `firebase hosting:channel:deploy preview` - create a preview channel for testing
- `firebase open hosting:site` - open the site in browser

## Rollback Deployment

If you need to rollback the last deployment:

```bash
firebase hosting:rollback
```
