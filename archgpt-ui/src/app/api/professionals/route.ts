import { NextResponse } from "next/server";
import {
  buildProfessionalMapsUrl,
  buildProfessionalScore,
  dedupeProfessionalResults,
  formatProfessionalDistance,
  haversineDistanceMeters,
  normalizeProfessionalCategories,
  sortProfessionalResults,
  type ProfessionalCategory,
  type ProfessionalReferencePoint,
  type ProfessionalSearchRequest,
  type ProfessionalSearchResult,
} from "../../../lib/professionals";

import {
  fetchJustdialBusinessDetails,
  geocodeLocation,
  isJustdialBusinessUrl,
  reverseGeocodeLocation,
  searchPublicJustdialBusinesses,
  searchJustdialBusinesses,
} from "../../../lib/justdial";

const JUSTDIAL_RAPIDAPI_KEY = process.env.JUSTDIAL_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY || "";

const DEFAULT_RADIUS_METERS = 50_000;
const DEFAULT_LIMIT = 8;
const CATEGORY_SEARCH_TERMS: Record<ProfessionalCategory, string[]> = {
  lawyer: ["lawyer", "attorney", "law firm"],
  architect: ["architect", "architecture firm", "architectural consultant"],
};

type ProfessionalsRequestBody = Partial<ProfessionalSearchRequest> & {
  location?: unknown;
};

function isValidCoordinate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function clampLimit(value: unknown) {
  const nextLimit = Number(value);
  if (!Number.isFinite(nextLimit)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(12, Math.trunc(nextLimit)));
}

function clampRadiusMeters(value: unknown) {
  const nextRadius = Number(value);
  if (!Number.isFinite(nextRadius)) {
    return DEFAULT_RADIUS_METERS;
  }

  return Math.max(1_000, Math.min(50_000, Math.trunc(nextRadius)));
}

function buildSearchLabel(reference: ProfessionalReferencePoint) {
  const label = reference.label.trim();
  if (label) {
    return label;
  }

  return reference.source === "geolocation"
    ? `Current location (${reference.latitude.toFixed(4)}, ${reference.longitude.toFixed(4)})`
    : "Selected location";
}

async function resolveReferencePoint(body: ProfessionalsRequestBody): Promise<ProfessionalReferencePoint> {
  if (isValidCoordinate(body.latitude) && isValidCoordinate(body.longitude)) {
    return reverseGeocodeLocation(Number(body.latitude), Number(body.longitude));
  }

  const locationQuery = String(body.location || body.locationQuery || "").trim();
  if (!locationQuery) {
    throw new Error("Provide browser coordinates or a city/area name.");
  }

  return geocodeLocation(locationQuery);
}

async function searchBusinessesForTerm(
  term: string,
  category: ProfessionalCategory,
  reference: ProfessionalReferencePoint,
  radiusMeters: number,
  apiKey: string,
) {
  const businesses = await searchJustdialBusinesses(term, reference.searchLocation || reference.label, 1, apiKey);

  return businesses
    .map((business) => {
      const latitude = business.latitude;
      const longitude = business.longitude;
      const hasCoordinates = isValidCoordinate(latitude) && isValidCoordinate(longitude);
      const distanceMeters = hasCoordinates
        ? haversineDistanceMeters(reference, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        })
        : radiusMeters;

      const result: ProfessionalSearchResult = {
        placeId: business.businessUrl || `${category}:${term}:${business.name}:${business.address || "unknown"}`,
        name: business.name,
        category,
        rating: business.rating,
        userRatingsTotal: business.reviewCount,
        distanceMeters,
        distanceLabel: formatProfessionalDistance(distanceMeters),
        score: buildProfessionalScore({
          rating: business.rating,
          userRatingsTotal: business.reviewCount,
          distanceMeters,
        }),
        address: business.address,
        phone: business.phone,
        website: business.website,
        mapsUrl: buildProfessionalMapsUrl(business.businessUrl || "", business.name),
        latitude: hasCoordinates ? Number(latitude) : null,
        longitude: hasCoordinates ? Number(longitude) : null,
        searchTerms: [term],
      };

      return result;
    })
    .filter((value): value is ProfessionalSearchResult => Boolean(value));
}

async function searchPublicBusinessesForCategory(
  category: ProfessionalCategory,
  reference: ProfessionalReferencePoint,
  radiusMeters: number,
) {
  const businesses = await searchPublicJustdialBusinesses(category, reference);

  return businesses
    .map((business) => {
      const latitude = business.latitude;
      const longitude = business.longitude;
      const hasCoordinates = isValidCoordinate(latitude) && isValidCoordinate(longitude);
      const distanceMeters = hasCoordinates
        ? haversineDistanceMeters(reference, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        })
        : radiusMeters;

      const result: ProfessionalSearchResult = {
        placeId: business.businessUrl || business.docId || `${category}:${business.name}:${business.address || "unknown"}`,
        name: business.name,
        category,
        rating: business.rating,
        userRatingsTotal: business.reviewCount,
        distanceMeters,
        distanceLabel: formatProfessionalDistance(distanceMeters),
        score: buildProfessionalScore({
          rating: business.rating,
          userRatingsTotal: business.reviewCount,
          distanceMeters,
        }),
        address: business.address,
        phone: business.phone,
        website: business.website,
        mapsUrl: buildProfessionalMapsUrl(business.businessUrl || "", business.name),
        latitude: hasCoordinates ? Number(latitude) : null,
        longitude: hasCoordinates ? Number(longitude) : null,
        searchTerms: [category],
      };

      return result;
    })
    .filter((value): value is ProfessionalSearchResult => Boolean(value));
}

async function enrichTopResults(results: ProfessionalSearchResult[], reference: ProfessionalReferencePoint, apiKey: string) {
  const selectedResults = results.slice(0, Math.min(results.length, DEFAULT_LIMIT));
  const details = await Promise.all(
    selectedResults.map(async (result) => ({
      placeId: result.placeId,
      details: isJustdialBusinessUrl(result.mapsUrl) ? await fetchJustdialBusinessDetails(result.mapsUrl, apiKey) : null,
    })),
  );

  const detailsByPlaceId = new Map(details.map((entry) => [entry.placeId, entry.details] as const));

  return selectedResults.map((result) => {
    const detail = detailsByPlaceId.get(result.placeId);
    if (!detail) {
      return result;
    }

    const mergedUrl = detail.businessUrl && isJustdialBusinessUrl(detail.businessUrl)
      ? detail.businessUrl
      : result.mapsUrl;
    const nextLatitude = detail.latitude ?? result.latitude;
    const nextLongitude = detail.longitude ?? result.longitude;
    const hasCoordinates = isValidCoordinate(nextLatitude) && isValidCoordinate(nextLongitude);
    const distanceMeters = hasCoordinates
      ? haversineDistanceMeters(reference, {
        latitude: Number(nextLatitude),
        longitude: Number(nextLongitude),
      })
      : result.distanceMeters;
    const nextRating = detail.rating ?? result.rating;
    const nextReviews = detail.reviewCount ?? result.userRatingsTotal;

    return {
      ...result,
      mapsUrl: buildProfessionalMapsUrl(mergedUrl, detail.name || result.name),
      phone: detail.phone || result.phone,
      website: detail.website || result.website,
      address: detail.address || result.address,
      rating: nextRating,
      userRatingsTotal: nextReviews,
      latitude: hasCoordinates ? Number(nextLatitude) : result.latitude,
      longitude: hasCoordinates ? Number(nextLongitude) : result.longitude,
      distanceMeters,
      distanceLabel: formatProfessionalDistance(distanceMeters),
      score: buildProfessionalScore({
        rating: nextRating,
        userRatingsTotal: nextReviews,
        distanceMeters,
      }),
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ProfessionalsRequestBody;
    const limit = clampLimit(body.limit);
    const radiusMeters = clampRadiusMeters(body.radiusMeters);
    const categories = normalizeProfessionalCategories(body.categories);
    const reference = await resolveReferencePoint(body);

    const useRapidApi = Boolean(JUSTDIAL_RAPIDAPI_KEY);
    const rawResults = useRapidApi
      ? (
          await Promise.all(
            categories.flatMap((category) =>
              CATEGORY_SEARCH_TERMS[category].map(async (term) =>
                searchBusinessesForTerm(term, category, reference, radiusMeters, JUSTDIAL_RAPIDAPI_KEY),
              ),
            ),
          )
        ).flat()
      : (
          await Promise.all(categories.map(async (category) => searchPublicBusinessesForCategory(category, reference, radiusMeters)))
        ).flat();

    const dedupedResults = dedupeProfessionalResults(rawResults);
    const sortedResults = sortProfessionalResults(dedupedResults).slice(0, limit);
    const results = useRapidApi
      ? sortProfessionalResults(await enrichTopResults(sortedResults, reference, JUSTDIAL_RAPIDAPI_KEY)).slice(0, limit)
      : sortedResults;

    return NextResponse.json({
      ok: true,
      provider: useRapidApi ? "justdial-rapidapi" : "justdial-public",
      reference,
      referenceLabel: buildSearchLabel(reference),
      categories,
      radiusMeters,
      total: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
