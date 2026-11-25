# MyLivestockShow

The Fair Central app for livestock exhibitors, on iPhone and Android. Exhibitors make and manage entries, submit weights, follow the ring live, see results and get push notifications. They sign in with the same Fair Central account they use on the web.

The app has no backend of its own. It calls the same Fair Central (Base44) backend functions as the website, so everything stays in sync.

| Screen | Fair Central function |
| --- | --- |
| Sign in, sign up, reset password | Base44 auth (`/auth/login`, `/auth/register`, `/auth/verify-otp`, …) |
| Home, Entries, entry detail, profile | `exhibitorPortal` (`account`, `fair`, `profile`, `saveAccount`) |
| Enter a show (wizard), cart | `exhibitorPortal` (`wizard`, `removeCartEntry`), `createEntry`, `entryCheckout`, `publicDirectory` |
| Weigh-in | `entryWeighIn` (`myEntries`, `submit`), `files` (scale photos) |
| Live ring | `mobileApp` (`myRing`) |
| Results | `exhibitorPortal` (`results`) |
| Messages | `fairMessages` (`mine`, `myThread`, `myCreate`, `myReply`) |
| Documents to sign | `signatures` (`mine`, `signSession`, `myDownload`) |
| Notifications, settings, delete account | `mobileApp` |

Push notifications are sent by Fair Central (`shared/push.ts`, `pushEvents`) through Expo's push service, which delivers to Apple and Google. They go out when:

- an entry is approved, needs a fix, is checked in or is waitlisted
- a weight is verified or not accepted
- weigh-in opens or is about to close
- your class is on deck or in the ring
- a placing is posted
- the show office replies to a message
- a document is waiting to be signed
- a show announcement goes out

## Run it

You need Node 22 and the free [Expo](https://expo.dev) account the app will live under.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init          # links the project and writes its projectId
npx eas-cli@latest build --profile development --platform ios   # or android
npx expo start --dev-client
```

Push notifications, the camera and secure storage need a **development build**, not Expo Go.

`src/lib/config.ts` points at Fair Central's live backend. To use a test copy, set `EXPO_PUBLIC_FAIR_CENTRAL_APP_ID`, `EXPO_PUBLIC_FAIR_CENTRAL_API_URL` and `EXPO_PUBLIC_FAIR_CENTRAL_WEB_URL`.

## Release checklist

1. **Apple**
   - Enroll in the Apple Developer Program as Fair Central.
   - The first `eas build -p ios` creates the app ID `com.faircentral.mylivestockshow` and the certificates.
   - It also offers to make the push key. Say yes, and EAS uploads the key to Expo for you.
2. **Google**
   - Create a Google Play developer account.
   - Create a Firebase project and add an Android app with the package name `com.faircentral.mylivestockshow`.
   - Download `google-services.json` and store it as an EAS file secret: `eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`.
   - Upload the FCM v1 service-account key in Expo: `eas credentials`, then Android, then Push Notifications.
3. **Fair Central**
   - Optional: create an Expo access token with push security turned on. Add it as the Base44 secret `EXPO_ACCESS_TOKEN`.
   - Add `/terms` and `/privacy` pages to the website. Both app stores require a privacy policy link, and the sign-up screen links to both pages.
4. **Build and submit**: `eas build --profile production --platform all`, then `eas submit -p ios` and `eas submit -p android`.
5. **Store listings**: add screenshots, a description, a support URL, the privacy policy URL, Apple's privacy answers and Google's data-safety form. The app collects name, email, phone, address, photos (scale or documents) and a device push token, all to run the service.

## Account deletion

**Me → Delete my account** sends a request to Fair Central. It opens an "Account deletion request" ticket in Platform → Support and switches off the account's notifications. Apple requires the app to offer this.

Support completes the deletion. Entries, payments and results stay with each fair as that fair's records.

## Project layout

```
src/app/            screens (Expo Router: each file is a route)
  (tabs)/           Home, Entries, Weigh-in, Live, Me
  enter/            pick a show → entry wizard
  entry/[id]        entry detail
  messages/         conversations with the show office
src/components/     shared UI
src/lib/            API client, auth, push, data hooks, formatting
```
