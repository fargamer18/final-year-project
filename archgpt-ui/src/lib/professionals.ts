export type ProfessionalCategory = "lawyer" | "architect";

export type ProfessionalReferencePoint = {
  latitude: number;
  longitude: number;
  label: string;
  searchLocation?: string;
  source: "geolocation" | "manual";
};

export type ProfessionalSearchRequest = {
  latitude?: number | null;
  longitude?: number | null;
  locationQuery?: string;
  categories?: ProfessionalCategory[];
  limit?: number;
  radiusMeters?: number;
};

export type ProfessionalSearchResult = {
  placeId: string;
  name: string;
  category: ProfessionalCategory;
  rating: number | null;
  userRatingsTotal: number | null;
  distanceMeters: number;
  distanceLabel: string;
  score: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  searchTerms: string[];
};

export const PROFESSIONAL_SCORE_WEIGHTS = {
  rating: 1000,
  reviews: 1.5,
  distanceKm: 10,
} as const;

const PROFESSIONAL_CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  lawyer: "Lawyer",
  architect: "Architect",
};

export function normalizeProfessionalCategory(value: string): ProfessionalCategory | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "lawyer") {
    return "lawyer";
  }

  if (normalized === "architect") {
    return "architect";
  }

  return null;
}

export function normalizeProfessionalCategories(values: unknown, fallback: ProfessionalCategory[] = ["lawyer", "architect"]): ProfessionalCategory[] {
  const candidateValues = Array.isArray(values) ? values : fallback;
  const categories = candidateValues
    .map((value) => normalizeProfessionalCategory(String(value || "")))
    .filter((value): value is ProfessionalCategory => Boolean(value));

  return Array.from(new Set(categories)).slice(0, 2);
}

export function getProfessionalCategoryLabel(category: ProfessionalCategory) {
  return PROFESSIONAL_CATEGORY_LABELS[category] || category;
}

export function haversineDistanceMeters(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitudeRadians = toRadians(start.latitude);
  const endLatitudeRadians = toRadians(end.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.max(0, earthRadiusMeters * c);
}

export function formatProfessionalDistance(distanceMeters: number) {
  const safeDistance = Math.max(0, Number(distanceMeters) || 0);
  if (safeDistance < 1000) {
    return `${Math.round(safeDistance)} m`;
  }

  return `${(safeDistance / 1000).toFixed(safeDistance < 10_000 ? 1 : 0).replace(/\.0$/, "")} km`;
}

export function buildProfessionalMapsUrl(listingUrl: string, _name: string) {
  void _name;
  const candidateUrl = String(listingUrl || "").trim();
  if (!candidateUrl) {
    return "https://www.justdial.com/";
  }

  if (/^https?:\/\//i.test(candidateUrl)) {
    return candidateUrl;
  }

  if (/^\/\//.test(candidateUrl)) {
    return `https:${candidateUrl}`;
  }

  if (/^www\./i.test(candidateUrl)) {
    return `https://${candidateUrl}`;
  }

  if (/^\/.+/.test(candidateUrl)) {
    return `https://www.justdial.com${candidateUrl}`;
  }

  if (/justdial\.com/i.test(candidateUrl)) {
    return `https://${candidateUrl.replace(/^https?:\/\//i, "")}`;
  }

  return "https://www.justdial.com/";
}

export function buildProfessionalScore(input: {
  rating?: number | null;
  userRatingsTotal?: number | null;
  distanceMeters: number;
}) {
  const rating = typeof input.rating === "number" && Number.isFinite(input.rating) ? Math.max(0, Math.min(5, input.rating)) : 0;
  const reviews = typeof input.userRatingsTotal === "number" && Number.isFinite(input.userRatingsTotal) ? Math.max(0, input.userRatingsTotal) : 0;
  const distanceKm = Math.max(0, Number(input.distanceMeters) || 0) / 1000;

  return (
    rating * PROFESSIONAL_SCORE_WEIGHTS.rating +
    Math.min(reviews, 500) * PROFESSIONAL_SCORE_WEIGHTS.reviews -
    Math.min(distanceKm, 100) * PROFESSIONAL_SCORE_WEIGHTS.distanceKm
  );
}

export function sortProfessionalResults(results: ProfessionalSearchResult[]) {
  return [...results].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if ((right.rating || 0) !== (left.rating || 0)) {
      return (right.rating || 0) - (left.rating || 0);
    }

    if (left.distanceMeters !== right.distanceMeters) {
      return left.distanceMeters - right.distanceMeters;
    }

    if ((right.userRatingsTotal || 0) !== (left.userRatingsTotal || 0)) {
      return (right.userRatingsTotal || 0) - (left.userRatingsTotal || 0);
    }

    return left.name.localeCompare(right.name);
  });
}

export function dedupeProfessionalResults(results: ProfessionalSearchResult[]) {
  const merged = new Map<string, ProfessionalSearchResult>();

  results.forEach((result) => {
    const existing = merged.get(result.placeId);
    if (!existing) {
      merged.set(result.placeId, {
        ...result,
        searchTerms: Array.from(new Set(result.searchTerms || [])),
      });
      return;
    }

    const current = sortProfessionalResults([existing, result])[0] || existing;
    merged.set(result.placeId, {
      ...current,
      searchTerms: Array.from(new Set([...(existing.searchTerms || []), ...(result.searchTerms || [])])),
    });
  });

  return Array.from(merged.values());
}
