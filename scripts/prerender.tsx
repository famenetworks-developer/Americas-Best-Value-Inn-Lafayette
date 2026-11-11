import {renderToString} from 'react-dom/server';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadEnv} from 'vite';
import {App} from '../src/App';
import {hotel,rooms} from '../src/data';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const origin=(env.SITE_URL||'https://abvi-lafayette-stay.workspace-779429.chatgpt.site').replace(/\/$/,'');
if(!/^https:\/\/[^/]+$/.test(origin))throw new Error('SITE_URL must be an HTTPS origin without a path');
const indexable=env.PUBLIC_INDEXING==='true';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const description='Explore Americas Best Value Inn Lafayette by Sonesta at 2224 NE Evangeline Trwy. Room options, hotel amenities, directions and official booking information.';
const schema={'@context':'https://schema.org','@graph':[
 {'@type':'Hotel','@id':origin+'/#hotel',name:hotel.name,alternateName:hotel.name+' by Sonesta',url:origin+'/',sameAs:[hotel.official],telephone:hotel.tel,image:[origin+'/assets/exterior.webp'],logo:origin+'/assets/logo.svg',description,address:{'@type':'PostalAddress',streetAddress:hotel.address,addressLocality:'Lafayette',addressRegion:'LA',postalCode:'70501',addressCountry:'US'},geo:{'@type':'GeoCoordinates',latitude:30.25432,longitude:-92.0137},checkinTime:'15:00',checkoutTime:'11:00',amenityFeature:['Complimentary Wi-Fi','On-site parking','In-room microwave','In-room mini-fridge'].map(name=>({'@type':'LocationFeatureSpecification',name,value:true})),containsPlace:rooms.map(room=>({'@type':'HotelRoom',name:room.name,bed:room.bed}))},
 {'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:hotel.name,publisher:{'@id':origin+'/#hotel'}}
]};
const template=readFileSync('dist/index.html','utf8');
function render(notFound=false){
 const title=notFound?'Page not found | Americas Best Value Inn Lafayette':'Americas Best Value Inn Lafayette by Sonesta | Lafayette, LA Hotel';
 const metadata=`<title>${title}</title><meta name="description" content="${escape(description)}"/><meta name="robots" content="${notFound||!indexable?'noindex, nofollow':'index, follow, max-image-preview:large'}"/>${notFound?'':`<link rel="canonical" href="${origin}/"/>`}<meta property="og:type" content="website"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${origin}/"/><meta property="og:image" content="${origin}/assets/exterior.webp"/><meta property="og:image:alt" content="Entrance of Americas Best Value Inn Lafayette"/><meta name="twitter:card" content="summary_large_image"/>${env.GOOGLE_SITE_VERIFICATION?`<meta name="google-site-verification" content="${escape(env.GOOGLE_SITE_VERIFICATION)}"/>`:''}${env.BING_SITE_VERIFICATION?`<meta name="msvalidate.01" content="${escape(env.BING_SITE_VERIFICATION)}"/>`:''}${notFound?'':`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`}`;
 return template.replace('<!--meta-->',metadata).replace('<!--app-->',renderToString(<App notFound={notFound}/>)).replace('<html lang="en">',`<html lang="en" data-page="${notFound?'404':'home'}">`);
}
writeFileSync('dist/index.html',render());writeFileSync('dist/404.html',render(true));
writeFileSync('dist/robots.txt',indexable?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
console.log(`Prerendered homepage and 404. Search indexing: ${indexable?'enabled':'disabled for private preview'}.`);
