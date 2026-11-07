"use client";

import { useCallback, useEffect, useState } from "react";

const CACHE_PREFIX = "stocksx-provider-cache:v1:";
const MAX_CACHE_ENTRIES = 40;

function readCachedResponse(url) {
  if (typeof window === "undefined" || !url) return null;
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}${url}`);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || !Number.isFinite(value.fetchedAt) || !Object.hasOwn(value, "data")) return null;
    return value;
  } catch {
    return null;
  }
}

function writeCachedResponse(url, data, fetchedAt) {
  if (typeof window === "undefined" || !url) return;
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${url}`,
      JSON.stringify({ data, fetchedAt })
    );
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(CACHE_PREFIX));
    if (keys.length > MAX_CACHE_ENTRIES) {
      const oldest = keys
        .map((key) => {
          try {
            return [key, JSON.parse(window.localStorage.getItem(key) || "{}").fetchedAt || 0];
          } catch {
            return [key, 0];
          }
        })
        .sort((a, b) => a[1] - b[1])
        .slice(0, keys.length - MAX_CACHE_ENTRIES);
      for (const [key] of oldest) window.localStorage.removeItem(key);
    }
  } catch {
    // Market data caching is optional; the live request remains usable when storage is full or blocked.
  }
}

async function requestJson(url, { signal, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  const relayAbort = () => controller.abort();
  signal?.addEventListener("abort", relayAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error || `Provider request failed (${response.status}).`);
    }
    return { data: payload, fetchedAt: Date.now() };
  } catch (error) {
    if (timedOut) throw new Error("Request timed out; no new provider data was received.");
    if (signal?.aborted) {
      const abortError = new Error("Request was cancelled.");
      abortError.name = "AbortError";
      throw abortError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", relayAbort);
  }
}

export async function fetchCachedJson(url, {
  maxAgeMs = 30_000,
  timeoutMs = 10_000,
  force = false,
  signal,
} = {}) {
  const cached = readCachedResponse(url);
  const now = Date.now();
  const age = cached ? Math.max(0, now - cached.fetchedAt) : Infinity;
  const stale = age > maxAgeMs;

  if (cached && !stale && !force) {
    return { ...cached, fromCache: true, stale: false, error: "" };
  }

  try {
    const fresh = await requestJson(url, { signal, timeoutMs });
    writeCachedResponse(url, fresh.data, fresh.fetchedAt);
    return { ...fresh, fromCache: false, stale: false, error: "" };
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (cached) {
      return {
        ...cached,
        fromCache: true,
        stale: true,
        error: error.message || "Provider data could not be refreshed.",
      };
    }
    throw error;
  }
}

export function useCachedJson(url, {
  enabled = true,
  maxAgeMs = 30_000,
  timeoutMs = 10_000,
} = {}) {
  const [refreshId, setRefreshId] = useState(0);
  const [state, setState] = useState({
    key: url,
    data: null,
    loading: Boolean(url && enabled),
    refreshing: false,
    error: "",
    fetchedAt: null,
    stale: false,
    fromCache: false,
  });

  useEffect(() => {
    if (!url || !enabled) {
      setState({ key: url, data: null, loading: false, refreshing: false, error: "", fetchedAt: null, stale: false, fromCache: false });
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    const cached = readCachedResponse(url);
    const age = cached ? Math.max(0, Date.now() - cached.fetchedAt) : Infinity;
    const fresh = Boolean(cached && age <= maxAgeMs);
    const shouldRefresh = !fresh || refreshId > 0;

    if (cached) {
      setState({
        key: url,
        data: cached.data,
        loading: shouldRefresh,
        refreshing: shouldRefresh,
        error: "",
        fetchedAt: cached.fetchedAt,
        stale: !fresh,
        fromCache: true,
      });
    } else {
      setState({ key: url, data: null, loading: true, refreshing: false, error: "", fetchedAt: null, stale: false, fromCache: false });
    }

    if (!shouldRefresh) return () => { active = false; controller.abort(); };

    fetchCachedJson(url, {
      maxAgeMs,
      timeoutMs,
      force: true,
      signal: controller.signal,
    }).then((result) => {
      if (!active) return;
      setState({
        key: url,
        data: result.data,
        loading: false,
        refreshing: false,
        error: result.error || "",
        fetchedAt: result.fetchedAt,
        stale: Boolean(result.stale),
        fromCache: Boolean(result.fromCache),
      });
    }).catch((error) => {
      if (!active || error.name === "AbortError") return;
      setState((current) => current.key === url
        ? { ...current, loading: false, refreshing: false, error: error.message || "Provider data could not be loaded.", stale: Boolean(current.data) }
        : current);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [url, enabled, maxAgeMs, timeoutMs, refreshId]);

  const refresh = useCallback(() => setRefreshId((current) => current + 1), []);
  const current = state.key === url
    ? state
    : { key: url, data: null, loading: Boolean(url && enabled), refreshing: false, error: "", fetchedAt: null, stale: false, fromCache: false };

  return { ...current, refresh };
}
