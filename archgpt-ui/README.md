This is the website (UI) for ArchGPT.
It connects to the separate house-planner backend in `final-year-project` for house generation and law review.

## Getting Started

First, install all the dependencies in the form of the node_modules folder
```bash
npm install
```

Make sure the house-planner backend is running first from the `final-year-project` folder:
```bash
node server.mjs
```

If the backend is not on `http://localhost:3001`, set `NEXT_PUBLIC_ARCHGPT_API_BASE` before starting the Next.js app.

To enable the nearby lawyers and architects drawer, no key is required. The default path uses public Justdial category pages plus OpenStreetMap Nominatim. If you want to use the RapidAPI wrapper instead, set a Justdial key on the server side, for example `JUSTDIAL_RAPIDAPI_KEY`, and optionally override the host with `JUSTDIAL_RAPIDAPI_HOST`.
The drawer first tries browser geolocation, then falls back to a typed city or area search if location access is denied or unavailable.
The server uses Justdial for business discovery and OpenStreetMap Nominatim for turning browser coordinates or typed locations into a search reference point, so no Google Places key is needed for this flow.
The drawer works without any key by default through public Justdial category pages. If you do set `JUSTDIAL_RAPIDAPI_KEY`, the backend can use the RapidAPI wrapper instead, but that is optional.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
This prototype runs on port 3000, and the house-planner backend runs on port 3001.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
