import { type ProfessionalReferencePoint } from "./professionals";

const JUSTDIAL_RAPIDAPI_HOST =
  process.env.JUSTDIAL_RAPIDAPI_HOST || "justdial-jd-unofficial.p.rapidapi.com";
const JUSTDIAL_RAPIDAPI_BASE_URL =
  process.env.JUSTDIAL_RAPIDAPI_BASE_URL || `https://${JUSTDIAL_RAPIDAPI_HOST}`;
const JUSTDIAL_USER_AGENT =
  process.env.JUSTDIAL_USER_AGENT || "ArchGPT/1.0 (local development)";

export type JustdialBusinessRecord = {
  docId: string | null;
  businessUrl: string | null;
  name: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
};

type JustdialPublicCategoryDefinition = {
  categorySlug: string;
  ncatid: string;
};

const JUSTDIAL_PUBLIC_CATEGORY_PAGES: Record<string, JustdialPublicCategoryDefinition[]> = {
  lawyer: [
    { categorySlug: "Lawyers", ncatid: "10296083" },
    { categorySlug: "Legal-Consultants", ncatid: "10298477" },
    { categorySlug: "Law-Firms", ncatid: "10295991" },
  ],
  architect: [{ categorySlug: "Architects", ncatid: "10020039" }],
};

const JUSTDIAL_CITY_ALIASES: Record<string, string[]> = {
  bangalore: ["Bengaluru"],
  bengaluru: ["Bangalore"],
};

type NominatimSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(value: string) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function toText(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = toText(entry);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = toText(value);
  if (!text) {
    return null;
  }

  const parsed = Number(text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function findValueInTree(value: unknown, candidateKeys: string[], depth = 0, candidateSet = new Set(candidateKeys.map(normalizeKey))): unknown {
  if (value == null || depth > 5) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = findValueInTree(entry, candidateKeys, depth + 1, candidateSet);
      if (nested !== undefined) {
        return nested;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    if (candidateSet.has(normalizeKey(key)) && child != null) {
      return child;
    }

    const nested = findValueInTree(child, candidateKeys, depth + 1, candidateSet);
    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

function collectArrayCandidates(value: unknown, depth = 0): unknown[][] {
  if (value == null || depth > 5) {
    return [];
  }

  if (Array.isArray(value)) {
    return [value];
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.values(value).flatMap((child) => collectArrayCandidates(child, depth + 1));
}

function looksLikeBusinessRecord(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return Boolean(
    toText(findValueInTree(value, ["name", "business_name", "title", "company_name", "listing_name"])) ||
      toText(findValueInTree(value, ["business_url", "businessUrl", "profile_url", "profileUrl", "listing_url", "listingUrl"])),
  );
}

function scoreSearchArray(items: unknown[]) {
  return items.slice(0, 6).reduce<number>((score, item) => {
    if (!isRecord(item)) {
      return score;
    }

    const name = toText(findValueInTree(item, ["name", "business_name", "title", "company_name", "listing_name"]));
    const businessUrl = toText(findValueInTree(item, ["business_url", "businessUrl", "profile_url", "profileUrl", "listing_url", "listingUrl"]));
    const address = toText(findValueInTree(item, ["address", "formatted_address", "full_address", "location", "address_line"]));

    return score + (name ? 1 : 0) + (businessUrl ? 1.5 : 0) + (address ? 0.5 : 0);
  }, 0);
}

function extractSearchItems(payload: unknown) {
  if (looksLikeBusinessRecord(payload)) {
    return [payload as Record<string, unknown>];
  }

  const arrays = collectArrayCandidates(payload).filter((items) => items.some(isRecord));
  if (arrays.length === 0) {
    return [];
  }

  return [...arrays]
    .sort((left, right) => scoreSearchArray(right) - scoreSearchArray(left))[0]
    .filter(isRecord);
}

function extractErrorMessage(payload: unknown) {
  return toText(findValueInTree(payload, ["error_message", "error", "message", "description", "detail"])) || null;
}

function normalizeJustdialUrl(value: string | null | undefined) {
  const candidate = String(value || "").trim();
  if (!candidate) {
    return null;
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  if (/^\/\//.test(candidate)) {
    return `https:${candidate}`;
  }

  if (/^www\./i.test(candidate)) {
    return `https://${candidate}`;
  }

  if (/^\/.+/.test(candidate)) {
    return `https://www.justdial.com${candidate}`;
  }

  if (/justdial\.com/i.test(candidate)) {
    return `https://${candidate.replace(/^https?:\/\//i, "")}`;
  }

  return null;
}

function extractLocationLabel(address: Record<string, string> | undefined, displayName: string | undefined) {
  const preferredKeys = [
    "neighbourhood",
    "suburb",
    "city_district",
    "city",
    "town",
    "village",
    "municipality",
    "county",
    "state_district",
    "state",
    "country",
  ];

  const parts = preferredKeys
    .map((key) => address?.[key]?.trim())
    .filter((value): value is string => Boolean(value));

  if (parts.length > 0) {
    return Array.from(new Set(parts)).slice(0, 3).join(", ");
  }

  const displayParts = String(displayName || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (displayParts.length > 0) {
    return displayParts.slice(0, 3).join(", ");
  }

  return null;
}

function extractLocationSearchLocation(address: Record<string, string> | undefined, displayName: string | undefined) {
  const preferredKeys = ["city", "town", "municipality", "village", "city_district", "county", "state_district", "state"];

  for (const key of preferredKeys) {
    const value = address?.[key]?.trim();
    if (value) {
      return value;
    }
  }

  const displayParts = String(displayName || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (displayParts.length >= 2) {
    return displayParts[1];
  }

  if (displayParts.length === 1) {
    return displayParts[0];
  }

  return null;
}

function buildNominatimHeaders() {
  return {
    "Accept-Language": "en",
    "User-Agent": JUSTDIAL_USER_AGENT,
  };
}

function buildJustdialHeaders() {
  return {
    "Accept-Language": "en",
    "User-Agent": JUSTDIAL_USER_AGENT,
  };
}

function slugifyJustdialSegment(value: string) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildJustdialPublicCategoryUrl(location: string, definition: JustdialPublicCategoryDefinition) {
  const safeLocation = slugifyJustdialSegment(location) || "Bangalore";
  const safeCategory = slugifyJustdialSegment(definition.categorySlug) || definition.categorySlug;
  return `https://www.justdial.com/${safeLocation}/${safeCategory}/nct-${definition.ncatid}`;
}

function extractNextDataJson(html: string) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]) as unknown;
  } catch {
    return null;
  }
}

function looksLikeJustdialResultTable(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.columns) || !Array.isArray(value.data)) {
    return false;
  }

  const columns = value.columns.filter((column): column is string => typeof column === "string");
  const normalizedColumns = new Set(columns.map(normalizeKey));
  return normalizedColumns.has("docid") && normalizedColumns.has("name");
}

function findJustdialResultTable(value: unknown): { columns: string[]; data: unknown[][] } | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findJustdialResultTable(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (looksLikeJustdialResultTable(value)) {
    const tableValue = value as { columns: unknown[]; data: unknown[] };
    return {
      columns: tableValue.columns.filter((column): column is string => typeof column === "string"),
      data: tableValue.data.filter(Array.isArray) as unknown[][],
    };
  }

  for (const child of Object.values(value)) {
    const nested = findJustdialResultTable(child);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function buildRowObject(columns: string[], row: unknown[]) {
  return columns.reduce<Record<string, unknown>>((result, column, index) => {
    result[column] = row[index];
    return result;
  }, {});
}

function collectPublicLocationCandidates(reference: ProfessionalReferencePoint) {
  const candidates = new Set<string>();
  const rawValues = [reference.searchLocation, reference.label];

  rawValues.forEach((value) => {
    const text = String(value || "").trim();
    if (text) {
      candidates.add(text);
    }
  });

  const searchKey = normalizeKey(reference.searchLocation || reference.label);
  const aliases = JUSTDIAL_CITY_ALIASES[searchKey] || [];
  aliases.forEach((alias) => candidates.add(alias));

  return Array.from(candidates);
}

function extractJustdialBusinessUrl(row: Record<string, unknown>) {
  const listingPath = toText(row.an) || toText(row.sharedt_url) || toText(row.weburl);
  if (!listingPath) {
    return null;
  }

  if (/^https?:\/\//i.test(listingPath)) {
    return normalizeJustdialUrl(listingPath);
  }

  return normalizeJustdialUrl(`https://www.justdial.com/${listingPath}`);
}

function combineAddressParts(parts: Array<string | null>) {
  return Array.from(new Set(parts.filter((part): part is string => Boolean(part && part.trim()))))
    .map((part) => part.trim())
    .join(", ") || null;
}

function normalizePublicSearchRecord(row: Record<string, unknown>, category: string): JustdialBusinessRecord | null {
  const name = toText(row.name) || toText(row.nameln) || toText(row.compRatingln) || null;
  const docId = toText(row.docid) || null;
  const businessUrl = extractJustdialBusinessUrl(row);

  if (!name && !businessUrl && !docId) {
    return null;
  }

  const rating = toNumber(row.compRating) ?? toNumber(row.compRatingln) ?? toNumber(row.rating) ?? null;
  const reviewCount =
    toNumber(row.totJdReviews) ??
    toNumber(row.totalReviews) ??
    toNumber(row.rating_cnt) ??
    toNumber(row.rev) ??
    null;

  const address =
    toText(row.NewAddressln) ||
    combineAddressParts([toText(row.NewAddress), toText(row.area), toText(row.city), toText(row.loccity)]);

  const phone =
    toText(row.VNumber) ||
    toText(row.wpnumber) ||
    toText(row.callalocation) ||
    toText(row.mobile) ||
    null;

  const websiteCandidate = toText(row.website) || toText(row.website_url) || toText(row.externalwebsite);
  const website = websiteCandidate && !/justdial\.com/i.test(websiteCandidate) ? normalizeJustdialUrl(websiteCandidate) : null;

  const latitude = toNumber(row.lat);
  const longitude = toNumber(row.lon);

  return {
    docId,
    businessUrl,
    name: name || category,
    rating,
    reviewCount,
    address,
    phone,
    website,
    latitude,
    longitude,
  };
}

async function fetchJustdialPublicSearchPage(location: string, definition: JustdialPublicCategoryDefinition) {
  const url = buildJustdialPublicCategoryUrl(location, definition);
  const response = await fetch(url, {
    headers: buildJustdialHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  if (/Noresults found/i.test(html)) {
    return [];
  }

  const nextData = extractNextDataJson(html);
  const table = findJustdialResultTable(nextData);
  if (!table || table.data.length === 0) {
    return [];
  }

  return table.data
    .map((row) => {
      if (!Array.isArray(row)) {
        return null;
      }

      const rowObject = buildRowObject(table.columns, row);
      return normalizePublicSearchRecord(rowObject, definition.categorySlug);
    })
    .filter((value): value is JustdialBusinessRecord => Boolean(value));
}

function buildRapidApiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "x-rapidapi-host": JUSTDIAL_RAPIDAPI_HOST,
    "x-rapidapi-key": apiKey,
  };
}

async function readJsonResponse<T>(response: Response, fallbackError: string): Promise<T> {
  const text = await response.text();
  let parsed: unknown = text;

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(fallbackError);
  }

  return parsed as T;
}

function normalizeBusinessSearchResult(raw: unknown): JustdialBusinessRecord | null {
  if (!isRecord(raw)) {
    return null;
  }

  const businessUrl = normalizeJustdialUrl(
    toText(findValueInTree(raw, ["business_url", "businessUrl", "profile_url", "profileUrl", "listing_url", "listingUrl", "url"])) || null,
  );
  const name =
    toText(findValueInTree(raw, ["name", "business_name", "title", "company_name", "listing_name", "firm_name"])) ||
    (businessUrl ? "Justdial listing" : null);

  if (!name && !businessUrl) {
    return null;
  }

  const website = toText(findValueInTree(raw, ["website", "website_url", "web_url", "webUrl", "official_website"])) || null;
  const normalizedWebsite = website && !website.toLowerCase().includes("justdial.com") ? normalizeJustdialUrl(website) : null;

  return {
    docId: null,
    businessUrl,
    name: name || "Justdial listing",
    rating: toNumber(findValueInTree(raw, ["rating", "avg_rating", "average_rating", "total_rating"])),
    reviewCount: toNumber(findValueInTree(raw, ["review_count", "total_reviews", "reviews", "user_ratings_total", "ratings_count", "total_review"])),
    address: toText(findValueInTree(raw, ["formatted_address", "address", "full_address", "address_line", "location", "street_address"])) || null,
    phone: toText(findValueInTree(raw, ["formatted_phone_number", "international_phone_number", "phone", "phone_number", "contact_number", "mobile", "mobile_number"])) || null,
    website: normalizedWebsite,
    latitude: toNumber(findValueInTree(raw, ["latitude", "lat", "geo_lat", "location_lat", "coordinates_lat"])),
    longitude: toNumber(findValueInTree(raw, ["longitude", "lng", "lon", "geo_lng", "location_lng", "coordinates_lng"])),
  };
}

function normalizeBusinessDetails(raw: unknown): Partial<JustdialBusinessRecord> {
  if (!isRecord(raw)) {
    return {};
  }

  const result: Partial<JustdialBusinessRecord> = {};

  const docId = toText(findValueInTree(raw, ["docid", "docId"]));
  if (docId) {
    result.docId = docId;
  }

  const businessUrl = normalizeJustdialUrl(
    toText(findValueInTree(raw, ["business_url", "businessUrl", "profile_url", "profileUrl", "listing_url", "listingUrl", "url"])) || null,
  );
  if (businessUrl) {
    result.businessUrl = businessUrl;
  }

  const name = toText(findValueInTree(raw, ["name", "business_name", "title", "company_name", "listing_name", "firm_name"]));
  if (name) {
    result.name = name;
  }

  const rating = toNumber(findValueInTree(raw, ["rating", "avg_rating", "average_rating", "total_rating"]));
  if (typeof rating === "number") {
    result.rating = rating;
  }

  const reviewCount = toNumber(findValueInTree(raw, ["review_count", "total_reviews", "reviews", "user_ratings_total", "ratings_count", "total_review"]));
  if (typeof reviewCount === "number") {
    result.reviewCount = reviewCount;
  }

  const address = toText(findValueInTree(raw, ["formatted_address", "address", "full_address", "address_line", "location", "street_address"]));
  if (address) {
    result.address = address;
  }

  const phone = toText(findValueInTree(raw, ["formatted_phone_number", "international_phone_number", "phone", "phone_number", "contact_number", "mobile", "mobile_number"]));
  if (phone) {
    result.phone = phone;
  }

  const website = toText(findValueInTree(raw, ["website", "website_url", "web_url", "webUrl", "official_website"]));
  if (website && !website.toLowerCase().includes("justdial.com")) {
    result.website = normalizeJustdialUrl(website) || website;
  }

  const latitude = toNumber(findValueInTree(raw, ["latitude", "lat", "geo_lat", "location_lat", "coordinates_lat"]));
  if (typeof latitude === "number") {
    result.latitude = latitude;
  }

  const longitude = toNumber(findValueInTree(raw, ["longitude", "lng", "lon", "geo_lng", "location_lng", "coordinates_lng"]));
  if (typeof longitude === "number") {
    result.longitude = longitude;
  }

  return result;
}

export function isJustdialBusinessUrl(value: string | null | undefined) {
  const normalizedUrl = normalizeJustdialUrl(value);
  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsed = new URL(normalizedUrl);
    if (!parsed.hostname.toLowerCase().includes("justdial.com")) {
      return false;
    }

    const pathname = parsed.pathname.replace(/\/+$/g, "");
    return pathname.length > 1 && !/^\/(mybusiness|search)(\/|$)/i.test(pathname);
  } catch {
    return false;
  }
}

export async function geocodeLocation(locationQuery: string): Promise<ProfessionalReferencePoint> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", locationQuery);

  const response = await fetch(url.toString(), {
    headers: buildNominatimHeaders(),
  });
  const payload = await readJsonResponse<NominatimSearchResult[]>(response, `Location lookup failed for ${locationQuery}`);

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`Could not find a location for ${locationQuery}`);
  }

  const result = payload[0];
  const latitude = toNumber(result?.lat);
  const longitude = toNumber(result?.lon);

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error(`Could not resolve coordinates for ${locationQuery}`);
  }

  return {
    latitude,
    longitude,
    label: extractLocationLabel(result?.address, result?.display_name) || locationQuery,
    searchLocation: extractLocationSearchLocation(result?.address, result?.display_name) || locationQuery,
    source: "manual",
  };
}

export async function reverseGeocodeLocation(latitude: number, longitude: number): Promise<ProfessionalReferencePoint> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const response = await fetch(url.toString(), {
    headers: buildNominatimHeaders(),
  });
  const payload = await readJsonResponse<NominatimSearchResult>(response, "Location lookup failed for current coordinates");

  if (!isRecord(payload)) {
    throw new Error("Could not resolve the current location.");
  }

  return {
    latitude,
    longitude,
    label: extractLocationLabel(payload.address, payload.display_name) || "Current location",
    searchLocation: extractLocationSearchLocation(payload.address, payload.display_name) || "Current location",
    source: "geolocation",
  };
}

export async function searchPublicJustdialBusinesses(
  category: "lawyer" | "architect",
  reference: ProfessionalReferencePoint,
): Promise<JustdialBusinessRecord[]> {
  const locationCandidates = collectPublicLocationCandidates(reference);
  const categoryDefinitions = JUSTDIAL_PUBLIC_CATEGORY_PAGES[category] || [];
  const results: JustdialBusinessRecord[] = [];

  for (const definition of categoryDefinitions) {
    let pageResults: JustdialBusinessRecord[] = [];

    for (const location of locationCandidates) {
      pageResults = await fetchJustdialPublicSearchPage(location, definition);
      if (pageResults.length > 0) {
        break;
      }
    }

    results.push(...pageResults);
  }

  return results;
}

export async function searchJustdialBusinesses(
  searchTerm: string,
  locationLabel: string,
  pageNumber: number,
  apiKey: string,
): Promise<JustdialBusinessRecord[]> {
  const url = new URL(`${JUSTDIAL_RAPIDAPI_BASE_URL}/search`);
  url.searchParams.set("search_term", searchTerm);
  url.searchParams.set("location", locationLabel);
  url.searchParams.set("page_number", String(pageNumber));

  const response = await fetch(url.toString(), {
    headers: buildRapidApiHeaders(apiKey),
  });
  const payload = await readJsonResponse<unknown>(response, `Search failed for ${searchTerm}`);

  const items = extractSearchItems(payload);
  if (items.length === 0) {
    const errorMessage = extractErrorMessage(payload);
    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return [];
  }

  return items
    .map((item) => normalizeBusinessSearchResult(item))
    .filter((value): value is JustdialBusinessRecord => Boolean(value));
}

export async function fetchJustdialBusinessDetails(businessUrl: string, apiKey: string): Promise<Partial<JustdialBusinessRecord> | null> {
  if (!apiKey) {
    return null;
  }

  const normalizedBusinessUrl = normalizeJustdialUrl(businessUrl);
  if (!normalizedBusinessUrl) {
    return null;
  }

  const response = await fetch(`${JUSTDIAL_RAPIDAPI_BASE_URL}/fetch_profile`, {
    method: "POST",
    headers: buildRapidApiHeaders(apiKey),
    body: JSON.stringify({ business_url: normalizedBusinessUrl }),
  });
  const payload = await readJsonResponse<unknown>(response, `Profile lookup failed for ${businessUrl}`);

  const errorMessage = extractErrorMessage(payload);
  if (errorMessage && !isRecord(payload)) {
    throw new Error(errorMessage);
  }

  const details = normalizeBusinessDetails(payload);
  if (errorMessage && Object.keys(details).length === 0) {
    throw new Error(errorMessage);
  }

  return details;
}
