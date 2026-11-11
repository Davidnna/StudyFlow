# StudyFlow

Mobile-first study focus tracker Progressive Web Application for EBSU students.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm ci
npm run dev
```

## Check and build

```bash
npm run typecheck
npm run build
npm run preview
```

The production build is written to `dist/`.

## Deploy on Render

Create a **Static Site** connected to this GitHub repository and use:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

No server start command is required. This is a Vite static application.

## Firebase

The client connects to the Firebase project configured in `src/firebase.ts`. Add the deployed Render hostname under Firebase Console → Authentication → Settings → Authorized domains. Ensure the authentication providers used by the app are enabled in Firebase Authentication.

Firestore security rules are in `firestore.rules`; `firebase.json` points to that file. Deploy rules separately with the Firebase CLI if you have the required project access:

```bash
firebase deploy --only firestore:rules
```

The Firebase web configuration in `src/firebase.ts` is client configuration, not a service-account private key. Never add Firebase service-account JSON files, private OAuth client secrets, or other server credentials to this repository.

## Notes

- `public/` contains the PWA manifest, service worker, icons, legal pages, and static resources required by the app.
- `tests-unit/` contains the optional avatar component tests. Their test dependencies are not included in the production dependency list or standard build command.
