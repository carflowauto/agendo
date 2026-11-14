export type Profile = {
  id: string;
  full_name: string;
  profession: string;
  city: string;
  phone: string;
  slug: string;
  address: string | null;
  bio: string | null;
  min_notice_minutes: number;
  reminder_hours: number;
  refill_weeks: number;
  timezone: string;
  ical_token: string;
  created_at: string;
};

export type Service = {
  id: string;
  profile_id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  active: boolean;
  sort_order: number;
};

export type OpeningHour = {
  id: string;
  profile_id: string;
  isodow: number;
  opens: string;
  closes: string;
  is_closed: boolean;
};

export type ClientRow = {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  profile_id: string;
  client_id: string | null;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "blocked";
  source: "manual" | "online" | "invitation" | "block";
  notes: string | null;
  client_name: string | null;
  client_phone: string | null;
  service_name: string | null;
  duration_min: number | null;
  price_cents: number | null;
  created_at: string;
};

export type Invitation = {
  id: string;
  profile_id: string;
  token: string;
  service_id: string | null;
  slots: string[];
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

export type Photo = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
};

export type PublicService = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
};

export type PublicHour = {
  isodow: number;
  opens: string;
  closes: string;
  is_closed: boolean;
};

export type PublicReview = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
};

export type BookingContext = {
  full_name: string;
  profession: string;
  city: string;
  phone: string;
  slug: string;
  address: string | null;
  bio: string | null;
  min_notice_minutes: number;
  timezone: string;
  review_count?: number;
  rating_avg?: number | null;
  reviews?: PublicReview[];
  services: PublicService[];
  hours: PublicHour[];
  photos: { url: string; caption: string | null }[];
  time_off: { starts_on: string; ends_on: string }[];
  busy: { starts_at: string; ends_at: string }[];
};

export type BookingResult = {
  id: string;
  starts_at: string;
  ends_at: string;
  service_name: string;
  duration_min: number;
  price_cents: number;
  pro_name: string;
  address: string | null;
  city: string;
};

export const RESERVED_SLUGS = new Set([
  "connexion",
  "inscription",
  "espace",
  "invitation",
  "ical",
  "auth",
  "api",
  "maquette",
  "mot-de-passe-oublie",
  "pro",
  "recherche",
  "favicon",
  "favicon.ico",
]);
