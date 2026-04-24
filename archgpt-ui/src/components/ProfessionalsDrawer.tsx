"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Globe, Loader2, MapPin, Phone, Search, Star, X } from "lucide-react";
import {
  formatProfessionalDistance,
  getProfessionalCategoryLabel,
  type ProfessionalSearchResult,
} from "../lib/professionals";

type ProfessionalsDrawerProps = {
  open: boolean;
  onClose: () => void;
  requestSummary: string;
  guidanceNote?: string;
};

type ProfessionalsResponse = {
  ok?: boolean;
  error?: string;
  referenceLabel?: string;
  results?: ProfessionalSearchResult[];
  total?: number;
};

function trimSummary(text: string, maxLength = 180) {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function formatRating(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "Unrated";
  }

  return value.toFixed(1);
}

function formatPhoneLink(value: string | null) {
  if (!value) {
    return null;
  }

  const dialable = value.replace(/[^\d+]/g, "");
  return dialable ? `tel:${dialable}` : null;
}

export function ProfessionalsDrawer({ open, onClose, requestSummary, guidanceNote }: ProfessionalsDrawerProps) {
  const [manualLocation, setManualLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [referenceLabel, setReferenceLabel] = useState("");
  const [results, setResults] = useState<ProfessionalSearchResult[]>([]);
  const autoSearchRef = useRef(false);

  const summaryText = useMemo(() => trimSummary(requestSummary), [requestSummary]);

  const runSearch = useCallback(async (payload: {
    latitude?: number;
    longitude?: number;
    locationQuery?: string;
  }) => {
    setIsSearching(true);
    setError("");

    try {
      const response = await fetch("/api/professionals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          categories: ["lawyer", "architect"],
          limit: 8,
          radiusMeters: 50_000,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as ProfessionalsResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Professional lookup failed (${response.status})`);
      }

      setReferenceLabel(data.referenceLabel || "");
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (lookupError) {
      const message = lookupError instanceof Error ? lookupError.message : String(lookupError);
      setError(message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const searchWithBrowserLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Browser geolocation is not available here. Use the manual area search below.");
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void runSearch({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }).finally(() => resolve());
        },
        (positionError) => {
          setError(positionError.message || "Location permission was denied. Search by city or area instead.");
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 60_000,
        },
      );
    });
  }, [runSearch]);

  const searchWithManualLocation = useCallback(async () => {
    const locationQuery = manualLocation.trim();
    if (!locationQuery) {
      setError("Type a city, area, or neighborhood first.");
      return;
    }

    await runSearch({ locationQuery });
  }, [manualLocation, runSearch]);

  useEffect(() => {
    if (!open) {
      autoSearchRef.current = false;
      return;
    }

    setError("");
    setReferenceLabel("");
    setResults([]);

    if (!autoSearchRef.current) {
      autoSearchRef.current = true;
      void searchWithBrowserLocation();
    }
  }, [open, searchWithBrowserLocation]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-stretch justify-end bg-[#050608]/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.aside
            className="relative flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(14,17,24,0.99),rgba(9,11,15,0.99))] text-gray-100 shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
            initial={{ x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 36, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/80 to-transparent" />

            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-purple-200/70">Nearby professionals</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Lawyers and architects near you</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Sorted with rating weighted above distance. Use your current location first, or search by city/area if location access is off. Listings come from Justdial.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-200 transition hover:bg-white/10"
                aria-label="Close professionals drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
              <section className="min-h-0 border-r border-white/8 px-5 py-5">
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Project context</p>
                    <p className="mt-2 text-sm font-semibold text-white">{summaryText || "No house request found."}</p>
                    {guidanceNote && <p className="mt-2 text-sm leading-6 text-purple-100/85">{guidanceNote}</p>}
                  </div>

                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Location search</p>
                    <div className="mt-3 space-y-3">
                      <button
                        type="button"
                        onClick={() => void searchWithBrowserLocation()}
                        disabled={isSearching}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        Use my current location
                      </button>

                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase tracking-[0.24em] text-gray-400">City or area</label>
                        <input
                          value={manualLocation}
                          onChange={(event) => setManualLocation(event.target.value)}
                          placeholder="Indiranagar, Bengaluru"
                          className="w-full rounded-[16px] border border-white/10 bg-[#0c1018] px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 focus:border-purple-300/50 focus:ring-2 focus:ring-purple-400/20"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void searchWithManualLocation()}
                        disabled={isSearching}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Search className="h-4 w-4" />
                        Search this area
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-purple-400/15 bg-purple-400/5 p-4 text-xs leading-6 text-gray-200">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">How ranking works</p>
                    <p className="mt-2 text-gray-300">
                      Results are sorted with a combined score that keeps rating ahead of distance. Higher-rated firms stay near the top, but closer options still move up when ratings are similar.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-[20px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
                      {error}
                    </div>
                  )}

                  {referenceLabel && (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm text-gray-200">
                      <span className="text-gray-400">Searching from </span>
                      <span>{referenceLabel}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="min-h-0 overflow-y-auto px-5 py-5">
                <div className="space-y-3">
                  {isSearching && results.length === 0 ? (
                    <div className="rounded-[24px] border border-purple-400/15 bg-[#0e1118] p-5 text-sm leading-6 text-gray-300">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
                        Looking up the nearest lawyers and architects now.
                      </div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="rounded-[24px] border border-white/10 bg-[#0e1118] p-5 text-sm leading-6 text-gray-300">
                      Search using your current location or enter a city/area to get a ranked list of nearby professionals.
                    </div>
                  ) : (
                    results.map((result, index) => {
                      const phoneLink = formatPhoneLink(result.phone);
                      const websiteLink = result.website && /^https?:\/\//i.test(result.website) ? result.website : null;

                      return (
                        <article
                          key={result.placeId}
                          className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-gray-200 shadow-[0_0_0_1px_rgba(168,85,247,0.06)]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">
                                  #{index + 1}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-gray-300">
                                  {getProfessionalCategoryLabel(result.category)}
                                </span>
                              </div>
                              <h3 className="mt-3 text-base font-semibold text-white">{result.name}</h3>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                <span className="inline-flex items-center gap-1 text-purple-100">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  {formatRating(result.rating)}
                                  {typeof result.userRatingsTotal === "number" && result.userRatingsTotal > 0 && (
                                    <span className="text-gray-400">({result.userRatingsTotal})</span>
                                  )}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {formatProfessionalDistance(result.distanceMeters)}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-300">
                                  Score {Math.round(result.score)}
                                </span>
                              </div>
                            </div>

                            <div className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">
                              Ranked by rating + proximity
                            </div>
                          </div>

                          {result.address && <p className="mt-3 text-sm leading-6 text-gray-300">{result.address}</p>}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <a
                              href={result.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-400/20"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open Justdial
                            </a>
                            {phoneLink && (
                              <a
                                href={phoneLink}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-100 transition hover:bg-white/10"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                Call
                              </a>
                            )}
                            {websiteLink && (
                              <a
                                href={websiteLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-100 transition hover:bg-white/10"
                              >
                                <Globe className="h-3.5 w-3.5" />
                                Website
                              </a>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProfessionalsDrawer;
