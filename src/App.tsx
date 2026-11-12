import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CarFront,
  Check,
  ChevronDown,
  Coffee,
  ExternalLink,
  MapPin,
  Maximize2,
  Menu,
  Microwave,
  Phone,
  PawPrint,
  Refrigerator,
  Users,
  Wifi,
  Waves,
  X,
} from "lucide-react";
import { faqs, hotel, nav } from "./data";

export type PageKey =
  | "home"
  | "rooms"
  | "amenities"
  | "location"
  | "gallery"
  | "404";
type PublicCMS = {
  content?: Record<string, Record<string, unknown>[]>;
  settings?: Record<string, Record<string, unknown>>;
};
type HomeCMS = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  primaryCta?: { label?: string; url?: string };
  secondaryCta?: { label?: string; url?: string };
  heroImages?: { src: string; alt: string }[];
  welcomeKicker?: string;
  welcomeTitle?: string;
  welcomeLead?: string;
  welcomeText?: string;
  exploreKicker?: string;
  exploreTitle?: string;
  exploreDescription?: string;
  finalKicker?: string;
  finalTitle?: string;
  finalDescription?: string;
};
const cmsText = (
  cms: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
) => (typeof cms?.[key] === "string" ? String(cms[key]) : fallback);
const photos = [
  {
    src: "/assets/property/exterior.jpg",
    alt: "Exterior of Americas Best Value Inn Lafayette",
    label: "Hotel exterior",
  },
  {
    src: "/assets/property/king-room.jpg",
    alt: "King guest room at Americas Best Value Inn Lafayette",
    label: "King room",
  },
  {
    src: "/assets/property/double-room.jpg",
    alt: "Guest room with two beds at Americas Best Value Inn Lafayette",
    label: "Two-bed room",
  },
  {
    src: "/assets/property/entrance-sign.jpg",
    alt: "Americas Best Value Inn entrance sign in Lafayette",
    label: "Hotel entrance",
  },
  {
    src: "/assets/property/room-wide.jpg",
    alt: "Wide view of a guest room at Americas Best Value Inn Lafayette",
    label: "Guest room",
  },
  {
    src: "/assets/property/queen-room.jpg",
    alt: "Queen guest room at Americas Best Value Inn Lafayette",
    label: "Queen room",
  },
  {
    src: "/assets/property/room-corner.jpg",
    alt: "Another view of a guest room at Americas Best Value Inn Lafayette",
    label: "Room interior",
  },
];
const pageHeroPhotos: Record<string, { src: string; alt: string }> = {
  Accommodations: {
    src: "/assets/hero-premium/rooms-hero-v2.png",
    alt: "Warm, refined king guest room prepared for a comfortable Lafayette stay",
  },
  "Comfort and convenience": {
    src: "/assets/hero-premium/amenities-hero-v2.png",
    alt: "Welcoming hotel breakfast lounge and coffee service",
  },
  "The neighbourhood": {
    src: "/assets/hero-premium/location-hero-v2.png",
    alt: "Atmospheric Lafayette streetscape at golden hour",
  },
  "Hotel gallery": {
    src: "/assets/hero-premium/gallery-hero-v2.png",
    alt: "Welcoming hotel entrance illuminated at blue hour",
  },
};
const roomCards = [
  {
    name: "1 King Bed",
    image: photos[1],
    tag: "Non-smoking",
    bed: "One king bed",
    guests: "Up to 2 guests",
    copy: "A comfortable king-bed layout with the practical in-room features listed for the property.",
  },
  {
    name: "1 Queen Bed",
    image: photos[5],
    tag: "Non-smoking",
    bed: "One queen bed",
    guests: "Up to 2 guests",
    copy: "A straightforward queen room for solo travelers or couples visiting Lafayette.",
  },
  {
    name: "2 Double Beds",
    image: photos[2],
    tag: "Non-smoking",
    bed: "Two double beds",
    guests: "Confirm occupancy",
    copy: "A flexible two-bed layout for guests who prefer separate sleeping space.",
  },
];
const amenities = [
  {
    icon: Wifi,
    title: "Complimentary Wi-Fi",
    text: "Connect from your room and throughout the property.",
  },
  {
    icon: CarFront,
    title: "Free on-site parking",
    text: "Parking is listed for cars, buses, RVs and commercial trucks.",
  },
  {
    icon: Coffee,
    title: "Continental breakfast",
    text: "Breakfast is listed by Sonesta; call ahead to confirm current service.",
  },
  {
    icon: Waves,
    title: "Outdoor pool",
    text: "An outdoor pool is listed; confirm seasonal availability before arrival.",
  },
  {
    icon: Microwave,
    title: "Microwave",
    text: "A microwave is listed among the practical in-room conveniences.",
  },
  {
    icon: PawPrint,
    title: "Pet-friendly rooms",
    text: "Up to two pets per room are listed, with an additional nightly fee.",
  },
];
const routeFor = (id: string) => `/${id}/`;
export function pageFromPath(path: string): PageKey {
  const value = path.replace(/^\/+|\/+$/g, "");
  return value === ""
    ? "home"
    : ["rooms", "amenities", "location", "gallery"].includes(value)
      ? (value as PageKey)
      : "404";
}
function Logo() {
  return (
    <img
      src="/assets/logo.svg"
      width="146"
      height="87"
      alt="Americas Best Value Inn by Sonesta"
    />
  );
}
function Button({
  children,
  ghost = false,
}: {
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <a
      className={`button ${ghost ? "button--ghost" : ""}`}
      href={hotel.official}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowRight size={16} />
    </a>
  );
}
function SectionTitle({
  kicker,
  title,
  children,
  center = false,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <header
      className={`section-title ${center ? "section-title--center" : ""}`}
    >
      <span className="kicker">{kicker}</span>
      <div className="title-mark" aria-hidden="true">
        <i />
        <b>✦</b>
        <i />
      </div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </header>
  );
}
function Navigation({
  page,
  cmsNav,
  booking,
  general,
}: {
  page: PageKey;
  cmsNav?: Record<string, unknown>[];
  booking?: Record<string, unknown>;
  general?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDialogElement>(null);
  const items = cmsNav?.length
    ? cmsNav
        .filter((item) => item.visible !== false)
        .map((item) => ({
          label: String(item.label || item.title),
          id: String(item.slug || String(item.url || "").replaceAll("/", "")),
          url: String(item.url || "/"),
        }))
    : nav.map(([label, id]) => ({ label, id, url: routeFor(id) }));
  const bookingURL = cmsText(booking, "bookingUrl", hotel.official),
    bookingLabel = cmsText(booking, "buttonLabel", "Book now");
  useEffect(() => {
    open ? panel.current?.showModal() : panel.current?.close();
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="side-rail">
        <a
          className="side-logo"
          href="/"
          aria-label="Americas Best Value Inn Lafayette home"
        >
          <Logo />
        </a>
        <nav className="side-links" aria-label="Primary navigation">
          {items.map(({ label, id, url }) => (
            <a
              key={id}
              className={page === id ? "is-active" : ""}
              aria-current={page === id ? "page" : undefined}
              href={url}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="side-actions">
          <a
            className="vertical-book"
            href={bookingURL}
            target="_blank"
            rel="noreferrer"
          >
            {bookingLabel}
          </a>
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </aside>
      <header className="mobile-header">
        <a href="/">
          <Logo />
        </a>
        <div>
          <a href={bookingURL} target="_blank" rel="noreferrer">
            {bookingLabel}
          </a>
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
        </div>
      </header>
      <dialog
        ref={panel}
        className="nav-panel"
        onCancel={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <button
          className="panel-close"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
        <div className="nav-panel__inner">
          <span className="kicker">Explore the hotel</span>
          <nav>
            {[{ label: "Home", id: "", url: "/" }, ...items].map(
              ({ label, id, url }, index) => (
                <a
                  key={label}
                  href={url}
                  onClick={() => setOpen(false)}
                  aria-current={page === (id || "home") ? "page" : undefined}
                >
                  <small>0{index + 1}</small>
                  {label}
                </a>
              ),
            )}
          </nav>
          <footer>
            <span>{cmsText(general, "city", "Lafayette, Louisiana")}</span>
            <a href={`tel:${cmsText(general, "tel", hotel.tel)}`}>
              {cmsText(general, "phone", hotel.phone)}
            </a>
            <Button>Check availability</Button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
function BookingBar() {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const next = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);
  const [arrival, setArrival] = useState(tomorrow),
    [departure, setDeparture] = useState(next);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    window.open(hotel.official, "_blank", "noopener,noreferrer");
  };
  return (
    <section className="booking-wrap" aria-label="Check room availability">
      <div className="container">
        <form className="booking-card" onSubmit={submit}>
          <div className="booking-intro">
            <span className="kicker">Plan your stay</span>
            <strong>Check availability</strong>
          </div>
          <label>
            <span>Arrive</span>
            <input
              type="date"
              min={tomorrow}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            />
          </label>
          <label>
            <span>Depart</span>
            <input
              type="date"
              min={arrival}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
            />
          </label>
          <label>
            <span>Rooms</span>
            <select defaultValue="1">
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
            <ChevronDown size={15} />
          </label>
          <label>
            <span>Guests</span>
            <select defaultValue="2">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </select>
            <ChevronDown size={15} />
          </label>
          <button className="button" type="submit">
            Check rates <ArrowRight size={16} />
          </button>
        </form>
        <p>
          Live rooms, prices and reservation terms are shown on the official
          Sonesta page. Prefer to talk?{" "}
          <a href={`tel:${hotel.tel}`}>{hotel.phone}</a>.
        </p>
      </div>
    </section>
  );
}
function PageHero({
  kicker,
  title,
  text,
  image,
}: {
  kicker: string;
  title: string;
  text: string;
  image: (typeof photos)[number];
}) {
  const hero = pageHeroPhotos[kicker] ?? image;
  return (
    <section className="page-hero">
      <img src={hero.src} alt={hero.alt} width="1536" height="1024" />
      <div className="hero-overlay" />
      <div className="container">
        <span className="kicker">{kicker}</span>
        <div className="title-mark title-mark--light" aria-hidden="true">
          <i />
          <b>✦</b>
          <i />
        </div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
function RoomGrid({ cmsRooms }: { cmsRooms?: Record<string, unknown>[] }) {
  const visibleRooms = cmsRooms?.length
    ? cmsRooms.map((room, index) => ({
        name: String(room.name || room.title || `Room ${index + 1}`),
        image: {
          src: String(room.image || photos[(index + 1) % photos.length].src),
          alt: String(
            room.alt ||
              `${room.name || "Guest room"} at Americas Best Value Inn Lafayette`,
          ),
        },
        tag: String(room.tag || "Non-smoking"),
        bed: String(room.bed || room.bedType || "Comfortable bed"),
        guests: String(room.occupancy || room.guests || "Confirm occupancy"),
        copy: String(room.description || room.fullDescription || ""),
      }))
    : roomCards;
  return (
    <div className="rooms-grid">
      {visibleRooms.map((room, index) => (
        <article className="room-card" key={room.name}>
          <div className="room-photo">
            <img
              src={room.image.src}
              alt={room.image.alt}
              width="960"
              height="660"
              loading="lazy"
            />
            <span>{room.tag}</span>
            <b>0{index + 1}</b>
          </div>
          <div className="room-copy">
            <h3>{room.name}</h3>
            <div className="room-meta">
              <span>
                <Check size={14} />
                {room.bed}
              </span>
              <span>
                <Users size={14} />
                {room.guests}
              </span>
            </div>
            <p>{room.copy}</p>
            <ul>
              <li>Complimentary Wi-Fi</li>
              <li>Microwave and mini-fridge</li>
              <li>Flat-screen cable TV</li>
            </ul>
            <a
              className="text-link"
              href={hotel.official}
              target="_blank"
              rel="noreferrer"
            >
              Check this room <ArrowRight size={16} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
function GalleryGrid({ cmsItems }: { cmsItems?: Record<string, unknown>[] }) {
  const galleryPhotos = cmsItems?.length
    ? cmsItems.map((item, index) => ({
        src: String(
          item.image || item.src || photos[index % photos.length].src,
        ),
        alt: String(
          item.alt || item.altText || item.title || "Hotel photograph",
        ),
        label: String(
          item.caption ||
            item.title ||
            item.label ||
            `Hotel image ${index + 1}`,
        ),
      }))
    : photos;
  const [active, setActive] = useState<number | null>(null),
    modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (active !== null && !modal.current?.open) modal.current?.showModal();
    if (active === null && modal.current?.open) modal.current.close();
  }, [active]);
  const move = (n: number) =>
    setActive((v) =>
      v === null ? 0 : (v + n + galleryPhotos.length) % galleryPhotos.length,
    );
  return (
    <>
      <div className="gallery-grid">
        {galleryPhotos.map((photo, index) => (
          <button
            key={photo.src}
            className={`gallery-item gallery-item--${index + 1}`}
            onClick={() => setActive(index)}
            aria-label={`Open ${photo.label} photograph`}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              width="960"
              height="660"
              loading="lazy"
            />
            <span>
              {photo.label}
              <Maximize2 size={15} />
            </span>
          </button>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={modal}
        onCancel={() => setActive(null)}
        onClick={(e) => e.target === e.currentTarget && setActive(null)}
      >
        {active !== null && (
          <>
            <button
              className="lightbox-close"
              onClick={() => setActive(null)}
              aria-label="Close gallery"
            >
              <X />
            </button>
            <button
              className="lightbox-arrow lightbox-arrow--left"
              onClick={() => move(-1)}
              aria-label="Previous photograph"
            >
              <ArrowLeft />
            </button>
            <img
              src={galleryPhotos[active].src}
              alt={galleryPhotos[active].alt}
            />
            <button
              className="lightbox-arrow lightbox-arrow--right"
              onClick={() => move(1)}
              aria-label="Next photograph"
            >
              <ArrowRight />
            </button>
            <p>
              {active + 1} / {galleryPhotos.length} ·{" "}
              {galleryPhotos[active].label}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}
function Home({ cms = {} }: { cms?: HomeCMS }) {
  const [slide, setSlide] = useState(0),
    heroPhotos = cms.heroImages?.length
      ? cms.heroImages
      : [photos[0], photos[1], photos[2]];
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setSlide((v) => (v + 1) % heroPhotos.length),
      6500,
    );
    return () => clearInterval(id);
  }, [heroPhotos.length]);
  return (
    <main id="main">
      <section className="hero-home">
        {heroPhotos.map((p, i) => (
          <img
            key={p.src}
            className={`hero-slide ${i === slide ? "is-active" : ""}`}
            src={p.src}
            alt={i === 0 ? p.alt : ""}
            aria-hidden={i !== 0}
            width="960"
            height="660"
          />
        ))}
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="kicker">
            {cms.eyebrow || "Lafayette, Louisiana"}
          </span>
          <div className="title-mark title-mark--light">
            <i />
            <b>✦</b>
            <i />
          </div>
          <h1>
            {cms.heading || (
              <>
                Your Easy Stay
                <br />
                <em>In Lafayette.</em>
              </>
            )}
          </h1>
          <p>
            {cms.description ||
              "Comfort, value and a convenient place to pause just off I-10. Settle in with complimentary Wi-Fi, on-site parking and the essentials for the road ahead."}
          </p>
          <div className="hero-buttons">
            <a
              className="button"
              href={cms.primaryCta?.url || hotel.official}
              target="_blank"
              rel="noreferrer"
            >
              {cms.primaryCta?.label || "Book your stay"}{" "}
              <ArrowRight size={16} />
            </a>
            <a
              className="button button--ghost"
              href={cms.secondaryCta?.url || "/rooms/"}
            >
              {cms.secondaryCta?.label || "Browse rooms"}{" "}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
        <div className="hero-dots">
          {heroPhotos.map((_, i) => (
            <button
              key={i}
              aria-label={`Show hero image ${i + 1}`}
              aria-pressed={i === slide}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
        <a className="hero-address" href="/location/">
          <MapPin size={15} />
          {hotel.address}, {hotel.city}
          <span>Explore location ↓</span>
        </a>
      </section>
      <BookingBar />
      <section className="section about">
        <div className="container split-layout">
          <div className="image-stack">
            <img
              className="image-stack__main"
              src={photos[4].src}
              alt={photos[4].alt}
              width="960"
              height="660"
            />
            <img
              className="image-stack__small"
              src={photos[3].src}
              alt={photos[3].alt}
              width="960"
              height="660"
            />
            <span className="image-stack__badge">
              Lafayette
              <br />
              <b>Louisiana</b>
            </span>
          </div>
          <div>
            <SectionTitle
              kicker={cms.welcomeKicker || "Welcome to Lafayette"}
              title={
                cms.welcomeTitle || "A Comfortable Base For The Road Ahead"
              }
            />
            <p className="lead">
              {cms.welcomeLead ||
                "A practical place to stay for business, leisure or a stop along the way."}
            </p>
            <p>
              {cms.welcomeText ||
                "Park on site, connect to complimentary Wi-Fi and settle into a room with a flat-screen TV, microwave and mini-fridge."}
            </p>
            <div className="fact-row">
              <div>
                <strong>I-10</strong>
                <span>Convenient access</span>
              </div>
              <div>
                <strong>3 PM</strong>
                <span>Check-in begins</span>
              </div>
              <div>
                <strong>11 AM</strong>
                <span>Check-out time</span>
              </div>
            </div>
            <a className="text-link" href="/amenities/">
              Explore amenities <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
      <section className="section section--sand">
        <div className="container">
          <SectionTitle
            kicker={cms.exploreKicker || "Explore your stay"}
            title={cms.exploreTitle || "Everything You Need, On Its Own Page"}
            center
          >
            {cms.exploreDescription ||
              "Browse room choices, hotel conveniences, directions and real property photography."}
          </SectionTitle>
          <div className="home-portals">
            {nav.map(([label, id], i) => (
              <a href={routeFor(id)} key={id}>
                <span>0{i + 1}</span>
                <h3>{label}</h3>
                <p>
                  {
                    [
                      "Compare the listed bed layouts and room essentials.",
                      "Review Wi-Fi, parking, breakfast, pool and pet details.",
                      "Find the hotel, nearby places and full driving directions.",
                      "Open every property image in the full-screen gallery.",
                    ][i]
                  }
                </p>
                <ArrowRight />
              </a>
            ))}
          </div>
        </div>
      </section>
      <FinalCTA cms={cms} />
    </main>
  );
}
function RoomsPage({
  cmsRooms,
  cms,
}: {
  cmsRooms?: Record<string, unknown>[];
  cms?: Record<string, unknown>;
}) {
  return (
    <main id="main">
      <PageHero
        kicker={cmsText(cms, "heroKicker", "Accommodations")}
        title={cmsText(
          cms,
          "heroTitle",
          "Rooms For A Simple, Comfortable Stay",
        )}
        text={cmsText(
          cms,
          "heroText",
          "Compare the listed bed layouts, then confirm live inventory and pricing directly with Sonesta.",
        )}
        image={photos[1]}
      />
      <BookingBar />
      <section className="section rooms-section">
        <div className="container">
          <SectionTitle
            kicker={cmsText(cms, "sectionKicker", "Choose your space")}
            title={cmsText(cms, "sectionTitle", "Pick Your Room")}
          >
            {cmsText(
              cms,
              "sectionDescription",
              "Practical layouts with the everyday essentials for your Lafayette visit.",
            )}
          </SectionTitle>
          <RoomGrid cmsRooms={cmsRooms} />
          <p className="source-note">
            {cmsText(
              cms,
              "sourceNote",
              "Room categories and photographs are sourced from the supplied property listings. Inventory, layout and accessibility features must be confirmed during booking.",
            )}
          </p>
        </div>
      </section>
      <section className="feature-band">
        <img src={photos[6].src} alt={photos[6].alt} width="960" height="660" />
        <div className="feature-band__overlay" />
        <div className="container">
          <div className="feature-copy">
            <span className="kicker">
              {cmsText(cms, "featureKicker", "In-room essentials")}
            </span>
            <h2>
              {cmsText(cms, "featureTitle", "Rest Easy. Head Out Refreshed.")}
            </h2>
            <div className="feature-pills">
              <span>
                <Refrigerator size={16} />
                Mini-fridge
              </span>
              <span>
                <Microwave size={16} />
                Microwave
              </span>
              <span>
                <Wifi size={16} />
                Wi-Fi
              </span>
            </div>
            <Button>Check availability</Button>
          </div>
        </div>
      </section>
      <FAQ />
      <FinalCTA cms={cms} />
    </main>
  );
}
function AmenitiesPage({
  cmsAmenities,
  cms,
}: {
  cmsAmenities?: Record<string, unknown>[];
  cms?: Record<string, unknown>;
}) {
  const visibleAmenities = cmsAmenities?.length
    ? cmsAmenities.map((item, index) => ({
        icon: amenities[index % amenities.length].icon,
        title: String(item.title || item.name || `Amenity ${index + 1}`),
        text: String(item.description || item.text || ""),
      }))
    : amenities;
  return (
    <main id="main">
      <PageHero
        kicker={cmsText(cms, "heroKicker", "Comfort and convenience")}
        title={cmsText(cms, "heroTitle", "The Essentials, Already Included")}
        text={cmsText(
          cms,
          "heroText",
          "Useful amenities and practical conveniences for a straightforward Lafayette stay.",
        )}
        image={photos[4]}
      />
      <section className="section section--sand">
        <div className="container">
          <SectionTitle
            kicker={cmsText(cms, "sectionKicker", "Hotel amenities")}
            title={cmsText(cms, "sectionTitle", "Comfort Without Complication")}
            center
          >
            {cmsText(
              cms,
              "sectionDescription",
              "Call ahead to confirm current breakfast service and seasonal pool availability.",
            )}
          </SectionTitle>
          <div className="amenities-grid">
            {visibleAmenities.map(({ icon: Icon, title, text }, i) => (
              <article
                className="amenity-card"
                key={title}
                style={{ "--delay": `${i * 65}ms` } as CSSProperties}
              >
                <div>
                  <Icon size={25} strokeWidth={1.35} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split-layout">
          <img
            className="content-image"
            src={photos[6].src}
            alt={photos[6].alt}
            width="960"
            height="660"
          />
          <div>
            <SectionTitle
              kicker={cmsText(cms, "roomKicker", "Inside your room")}
              title={cmsText(
                cms,
                "roomTitle",
                "Everyday Conveniences Close At Hand",
              )}
            />
            <p>
              {cmsText(
                cms,
                "roomText",
                "Sonesta lists a microwave, mini-fridge, flat-screen cable TV and complimentary Wi-Fi among the in-room conveniences.",
              )}
            </p>
            <p>
              {cmsText(
                cms,
                "roomNote",
                "Specific features and accessible arrangements can vary by room. Call the hotel before booking when a particular feature is essential.",
              )}
            </p>
            <a className="text-link" href="/rooms/">
              View room options <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
      <FAQ />
      <FinalCTA cms={cms} />
    </main>
  );
}
function LocationPage({ cms }: { cms?: Record<string, unknown> }) {
  return (
    <main id="main">
      <PageHero
        kicker={cmsText(cms, "heroKicker", "The neighbourhood")}
        title={cmsText(cms, "heroTitle", "Lafayette, From The Front Door")}
        text={cmsText(
          cms,
          "heroText",
          "Near Interstate 10, with straightforward access to Lafayette and the wider Acadiana area.",
        )}
        image={photos[0]}
      />
      <section className="section section--sand">
        <div className="container split-layout location-layout">
          <div>
            <SectionTitle
              kicker={cmsText(cms, "sectionKicker", "Find your way")}
              title={cmsText(
                cms,
                "sectionTitle",
                "Well Placed For The Road Ahead",
              )}
            />
            <p>
              {cmsText(
                cms,
                "sectionDescription",
                "Use the hotel as a starting point for local culture, university visits, events and onward travel.",
              )}
            </p>
            <ul className="places">
              <li>
                <span>Cajundome</span>
                <small>Events and entertainment</small>
              </li>
              <li>
                <span>Vermilionville</span>
                <small>Living history and folklife</small>
              </li>
              <li>
                <span>University of Louisiana</span>
                <small>Campus visits</small>
              </li>
              <li>
                <span>Lafayette Regional Airport</span>
                <small>Regional connections</small>
              </li>
              <li>
                <span>Avery Island</span>
                <small>TABASCO and Jungle Gardens</small>
              </li>
            </ul>
            <a
              className="text-link"
              href={hotel.directions}
              target="_blank"
              rel="noreferrer"
            >
              Get full directions <ArrowRight size={16} />
            </a>
          </div>
          <div className="map-frame">
            <iframe
              title="Map of Americas Best Value Inn Lafayette"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=30.25432,-92.0137&z=14&output=embed"
            />
            <div>
              <MapPin />
              <p>
                <strong>{hotel.name}</strong>
                <br />
                {hotel.address}
                <br />
                {hotel.city}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section reviews">
        <div className="container reviews-inner">
          <SectionTitle
            kicker={cmsText(cms, "contactKicker", "Hotel contact")}
            title={cmsText(cms, "contactTitle", "Questions Before You Arrive?")}
          />
          <div>
            <p>
              {cmsText(
                cms,
                "contactText",
                "Call the property about parking for large vehicles, accessible room requirements, early arrival or current amenity availability.",
              )}
            </p>
            <a className="text-link" href={`tel:${hotel.tel}`}>
              <Phone size={15} /> {hotel.phone}
            </a>
          </div>
        </div>
      </section>
      <FinalCTA cms={cms} />
    </main>
  );
}
function GalleryPage({
  cmsItems,
  cms,
}: {
  cmsItems?: Record<string, unknown>[];
  cms?: Record<string, unknown>;
}) {
  return (
    <main id="main">
      <PageHero
        kicker={cmsText(cms, "heroKicker", "Hotel gallery")}
        title={cmsText(cms, "heroTitle", "A Closer Look At Your Stay")}
        text={cmsText(
          cms,
          "heroText",
          "Explore real property photography from the hotel listings supplied for this project.",
        )}
        image={photos[2]}
      />
      <section className="section gallery-section">
        <div className="container">
          <SectionTitle
            kicker={cmsText(cms, "sectionKicker", "Property photography")}
            title={cmsText(cms, "sectionTitle", "Rooms, Exterior And Entrance")}
            center
          >
            {cmsText(
              cms,
              "sectionDescription",
              "Select any image to open the full-screen viewer.",
            )}
          </SectionTitle>
          <GalleryGrid cmsItems={cmsItems} />
          <p className="source-note">
            {cmsText(
              cms,
              "sourceNote",
              "Property images are shown from the supplied hotel listings. Room appearance can vary; confirm the assigned room when booking.",
            )}
          </p>
        </div>
      </section>
      <section className="section reviews">
        <div className="container reviews-inner">
          <SectionTitle
            kicker={cmsText(cms, "reviewKicker", "Guest perspectives")}
            title={cmsText(
              cms,
              "reviewTitle",
              "See Recent, Independent Feedback",
            )}
          />
          <div>
            <p>
              {cmsText(
                cms,
                "reviewText",
                "Review scores and counts change, so the live third-party source is the accurate place to evaluate recent feedback.",
              )}
            </p>
            <a
              className="text-link"
              href={hotel.trip + "#review"}
              target="_blank"
              rel="noreferrer"
            >
              Read guest reviews <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </section>
      <FinalCTA cms={cms} />
    </main>
  );
}
function FAQ() {
  return (
    <section className="section section--sand">
      <div className="container faq-wrap">
        <SectionTitle
          kicker="Before you book"
          title="Questions We Get Asked"
          center
        />
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
function FinalCTA({ cms }: { cms?: Record<string, unknown> } = {}) {
  return (
    <section className="final-cta">
      <img
        src={photos[0].src}
        alt="Americas Best Value Inn Lafayette exterior behind the booking section"
        width="960"
        height="660"
      />
      <div />
      <div className="container">
        <span className="kicker">
          {cmsText(cms, "finalKicker", "Ready when you are")}
        </span>
        <h2>{cmsText(cms, "finalTitle", "Book Direct With Sonesta")}</h2>
        <p>
          {cmsText(
            cms,
            "finalDescription",
            "View current rooms, live prices and reservation terms for your travel dates.",
          )}
        </p>
        <div>
          <Button>Book your stay</Button>
          <a className="button button--ghost" href={`tel:${hotel.tel}`}>
            <Phone size={15} /> Call the hotel
          </a>
        </div>
      </div>
    </section>
  );
}
function NotFound() {
  return (
    <main id="main" className="not-found">
      <span className="kicker">404 · Page not found</span>
      <h1>
        Let’s get you
        <br />
        back to your stay.
      </h1>
      <a className="button" href="/">
        Return home <ArrowRight />
      </a>
    </main>
  );
}
function Footer({
  cmsNav,
  footer,
  general,
  booking,
}: {
  cmsNav?: Record<string, unknown>[];
  footer?: Record<string, unknown>;
  general?: Record<string, unknown>;
  booking?: Record<string, unknown>;
}) {
  const items = cmsNav?.length
    ? cmsNav
        .filter((item) => item.visible !== false)
        .map((item) => ({
          label: String(item.label || item.title),
          url: String(item.url || "/"),
        }))
    : nav.map(([label, id]) => ({ label, url: routeFor(id) }));
  const phone = cmsText(general, "phone", hotel.phone),
    tel = cmsText(general, "tel", hotel.tel),
    bookingURL = cmsText(booking, "bookingUrl", hotel.official);
  return (
    <>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo />
            <h3>{cmsText(general, "hotelName", hotel.name)}</h3>
            <p>
              {cmsText(
                footer,
                "description",
                "A convenient Lafayette stay near I-10, with the everyday essentials for the road ahead.",
              )}
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="/">Home</a>
            {items.map(({ label, url }) => (
              <a key={url} href={url}>
                {label}
              </a>
            ))}
          </div>
          <div>
            <h4>Guest information</h4>
            <a href="/rooms/">Rooms and booking</a>
            <a href={`tel:${tel}`}>Accessibility inquiries</a>
            <a
              href={`mailto:${cmsText(footer, "groupSalesEmail", "Sales@redlion.com")}`}
            >
              Group sales
            </a>
            <a href={bookingURL} target="_blank" rel="noreferrer">
              Book now
            </a>
          </div>
          <div>
            <h4>Find us</h4>
            <address>
              {cmsText(general, "address", hotel.address)}
              <br />
              {cmsText(general, "city", hotel.city)}
            </address>
            <a className="footer-phone" href={`tel:${tel}`}>
              {phone}
            </a>
            <p>
              Check-in {cmsText(general, "checkIn", "3:00 PM")}
              <br />
              Check-out {cmsText(general, "checkOut", "11:00 AM")}
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {cmsText(footer, "copyright", hotel.name)}
          </span>
          <span>
            {cmsText(
              footer,
              "notice",
              "Hotel details should be confirmed before arrival.",
            )}
          </span>
          <a href="#main" aria-label="Back to top">
            <ArrowUp />
          </a>
        </div>
      </footer>
      <div className="mobile-bookbar">
        <span>Official Sonesta booking</span>
        <a href={bookingURL} target="_blank" rel="noreferrer">
          {cmsText(booking, "availabilityLabel", "Check availability")}{" "}
          <ArrowRight size={15} />
        </a>
      </div>
    </>
  );
}
export function App({
  notFound = false,
  page,
}: {
  notFound?: boolean;
  page?: PageKey;
}) {
  const [cms, setCMS] = useState<PublicCMS>({});
  useEffect(() => {
    fetch("/api/public/content")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setCMS)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const theme = cms.settings?.theme;
    if (!theme) return;
    const tokens: Record<string, string> = {
      primary: "--ink",
      secondary: "--deep",
      accent: "--gold",
      background: "--paper",
      heading: "--ink",
      text: "--text",
      muted: "--muted",
      border: "--line",
    };
    Object.entries(tokens).forEach(([field, token]) => {
      if (theme[field])
        document.documentElement.style.setProperty(token, String(theme[field]));
    });
  }, [cms]);
  const current = notFound
    ? "404"
    : page ||
      (typeof window === "undefined"
        ? "home"
        : pageFromPath(window.location.pathname));
  const content =
    current === "home" ? (
      <Home
        cms={
          cms.content?.page?.find((item) => item.slug === "home") as
            | HomeCMS
            | undefined
        }
      />
    ) : current === "rooms" ? (
      <RoomsPage
        cmsRooms={cms.content?.room}
        cms={cms.content?.page?.find((item) => item.slug === "rooms")}
      />
    ) : current === "amenities" ? (
      <AmenitiesPage
        cmsAmenities={cms.content?.amenity}
        cms={cms.content?.page?.find((item) => item.slug === "amenities")}
      />
    ) : current === "location" ? (
      <LocationPage
        cms={cms.content?.page?.find((item) => item.slug === "location")}
      />
    ) : current === "gallery" ? (
      <GalleryPage
        cmsItems={cms.content?.gallery}
        cms={cms.content?.page?.find((item) => item.slug === "gallery")}
      />
    ) : (
      <NotFound />
    );
  return (
    <>
      <Navigation
        page={current}
        cmsNav={cms.content?.navigation}
        booking={cms.settings?.booking}
        general={cms.settings?.general}
      />
      {content}
      <Footer
        cmsNav={cms.content?.navigation}
        footer={cms.settings?.footer}
        general={cms.settings?.general}
        booking={cms.settings?.booking}
      />
    </>
  );
}
