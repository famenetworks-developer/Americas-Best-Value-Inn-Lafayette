# Research and asset record

Research date: 11 November 2026. Physical identity: Americas Best Value Inn Lafayette, 2224 NE Evangeline Trwy, Lafayette, LA 70501. Official hotel code LA3235. Only this address was used to reconcile older Super 8 URLs.

## Design

Reference: https://budget-hotel-near-point-pleasant-be.vercel.app/

Retrieved its HTML and linked `/_astro/about.B2ap8SxX.css`. Observed: 88px fixed navy rail; vertical links; full-height, left-aligned photo hero; Cormorant Garamond and Manrope; navy #12232e, cream #f7f3ea, sand #ece2cc, brass #a8823f and light brass #cba968; square buttons; 1280px container; generous section spacing; split about/location sections, amenity grid, room cards, FAQs, dark booking band and four-column footer. Implemented the same visual structure with original React components. The booking date form was replaced with a direct official booking CTA to avoid pretending to transfer dates through an unverified URL contract. The room photo areas were replaced with compact bed-type headers because approved room photos are unavailable. No rendered comparison was possible because browser tooling was unavailable.

## Hotel evidence

- Primary: https://www.sonesta.com/americas-best-value-inn/la/lafayette/americas-best-value-inn-lafayette
- Machine-readable public page data: https://www.sonesta.com/page-data/americas-best-value-inn/la/lafayette/americas-best-value-inn-lafayette/page-data.json
- Official address, phone (337) 232-8826, 3 PM check-in, 11 AM check-out, coordinates 30.25432/-92.0137, Google place ID, in-room microwave/mini-fridge/cable TV, Wi-Fi, vehicle parking, breakfast, outdoor pool and pet policy came from Sonesta.
- Sonesta lists Sales@redlion.com for GROUP SALES; this is not presented as a direct front-desk email.
- Sonesta lists two pets maximum and $25 per pet per night. Third-party fees differ. Site asks guests to confirm current policy.
- Sonesta lists breakfast and pool; Trip.com has contrary breakfast information and older reviews mention unavailable facilities. Site explicitly asks guests to confirm current operation. These disputed facilities are excluded from amenity structured data.
- Sonesta's gallery_images and pageContext.galleryImages arrays are empty. No official room categories or room image mappings were supplied in that page data.

## Additional provided sources

- Trip.com: https://www.trip.com/hotels/lafayette-hotel-detail-3327862/super-8-by-wyndham-lafayette-la/ — exact address matches. Lists non-smoking king, queen, two double beds and accessible queen rooms. All room categories link to one generic image, so that image is not a reliable category match. Property photos downloaded only to the separate research directory for inspection; none are included in the deliverable. User explicitly selected official assets only. Room categories are attributed to Trip.com on the page and must be confirmed at booking.
- Trip.com scores varied between cached and freshly fetched versions (5.2/43 vs 5.1/31), with other review-count inconsistencies. No fixed review score, testimonial, or aggregateRating markup is published. The reviews section links to independent feedback.
- Trivago: https://www.trivago.com/en-US/oar/hotel-americas-best-value-inn-lafayette?search=100-59935 — matching address. AI-generated amenity text contains unverified casino/bar claims; these were not used. Undated advertised rates were not used.
- Travel Weekly: https://www.travelweekly.com/Hotels/Lafayette-LA/Americas-Best-Value-Inn-Lafayette-p60247029 — retrieved listing, secondary only.
- Lafayette Travel: https://www.lafayettetravel.com/listing/americas-best-value-inn-lafayette/7886/ — retrieved page mostly exposes tourism-site navigation/footer, not usable hotel detail. Tourism-office contact information was not mistaken for hotel contact information.
- Tripadvisor: supplied listing was inaccessible through the research tool.
- Agoda: supplied Super 8 URL returned an empty input shell; no facts used.
- ZenHotels and Google Hotels: supplied URLs were inaccessible through the research tool; no facts used.

## Assets included

- `public/assets/logo.svg`: official full-color by-Sonesta brand logo, obtained from the Sonesta page's brand relationship. Original: https://core.sonesta.com/sites/default/files/brand_logos/26/americasbestvalueinn_bysonesta_logo_fullcolor_rgb_0.svg
- `public/assets/exterior.webp` and `exterior-small.webp`: official hotel entrance photograph, converted from the 1600×500 image at https://core.sonesta.com/sites/default/files/hotel-photos/LA3235/banner/abvi-exterior-image.jpg . Its 1600×333 page rendition was also retrieved during research. The gallery displays the full original image.
- `public/assets/display.woff2` and `body.woff2`: Cormorant Garamond and Manrope from Google Fonts, converted to WOFF2 for local delivery. License texts are included in assets.
- No stock photography, generated hotel pictures, invented logo or unrelated hotel assets.
- Brand/property assets remain their owners' property and are used for the hotel website requested by the user; no broader image license is claimed.

## Astra CSS

No pre-existing project, package or stylesheet was present. https://astracss.vercel.app/ states the framework is still in development. npm lookups for `astra-css` and `astracss` returned 404. The WordPress Astra theme is not appropriate for React and was not installed. Used organized custom CSS per the brief's fallback.

## Search and launch limits

Search intent is centered on the exact hotel name, Lafayette Louisiana lodging, room options, parking, directions and direct booking. No keyword-volume claims or paid keyword research are implied. One substantive page avoids thin duplicate landing pages. Static HTML, clear identity, factual FAQs and Hotel/WebSite structured data support crawler understanding; no ranking or AI citation guarantees are made. No fabricated price, review, star rating or occupancy appears in schema.

Before public launch: confirm operational breakfast/pool details, current room inventory and pet policy; provide approved room photography; configure real public origin and indexing; complete browser/device QA and external schema checks; verify Search Console/Bing/Business Profile access. Private publication is a review copy and cannot satisfy public search-indexing goals.
