# Sicilia countdown

Static site: countdown to 14 November (Sicily time), a live 10-day Open-Meteo forecast that starts on the
visitor's current day, the 9-day itinerary (14–22 Nov), and a carousel of 100+ Wikimedia Commons photos of Catania and
the other stops (loaded in the browser and credited on each slide).

## Deploy to Firebase Hosting (project `oacz-sites`)

```bash
npm i -g firebase-tools
firebase login
cd sicilia-trip
# one time: create the hosting site used in firebase.json (or change "site" to an existing one)
firebase hosting:sites:create sicilia-countdown --project oacz-sites
firebase deploy --only hosting --project oacz-sites
```

The site is then live at https://sicilia-countdown.web.app.

## Local preview

```bash
cd sicilia-trip/public && python3 -m http.server 8080
```
