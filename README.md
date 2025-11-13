# Bonfilet OEM Ordering MVP

Next.js + TypeScript implementation of the Bonfilet OEM instant ordering experience. Users can configure a Bonfilet wristband, receive real-time pricing and arrival estimates, and prepare for checkout.

## Features
- Locale-aware marketing and configurator flows (`en`/`ja` via next-intl middleware)
- Configurator form with instant quotes powered by YAML-driven pricing rules
- API route that calculates subtotal, shipping, tax, duties and ETA
- Structured data sources for pricing tiers, color catalog, lead time and forbidden words
- Tailwind CSS styling with responsive layout

## Getting started
```bash
pnpm install
pnpm dev
```

The app redirects to `/en` by default. The configurator is available at `/{locale}/order`.

## Testing the quote API
```bash
curl -X POST http://localhost:3000/api/quote \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [{
      "productType": "bonfilet",
      "messageText": "ONE TEAM, ONE MESSAGE",
      "bodyColor": "black",
      "bodyColorHex": "#111827",
      "textColor": "white",
      "textColorHex": "#FFFFFF",
      "finish": "normal",
      "size": "12x202",
      "qty": 30
    }],
    "shipTo": { "country": "US" }
  }'
```
