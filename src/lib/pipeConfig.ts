/**
 * User-configurable pipe geometry.
 * Sensor A is always the upstream reference at 0m.
 * Sensor B and C positions are measured downstream from A, in meters.
 * Pipe length = position of Sensor C.
 */
import { useEffect, useState } from "react";

export interface PipeGeometry {
  /** distance from sensor A to sensor B, meters */
  ab: number;
  /** distance from sensor B to sensor C, meters */
  bc: number;
}

const STORAGE_KEY = "acoustic.pipeGeometry.v1";

export const DEFAULT_GEOMETRY: PipeGeometry = { ab: 5, bc: 5 };

export function loadGeometry(): PipeGeometry {
  if (typeof window === "undefined") return DEFAULT_GEOMETRY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GEOMETRY;
    const parsed = JSON.parse(raw) as PipeGeometry;
    if (
      typeof parsed.ab === "number" &&
      typeof parsed.bc === "number" &&
      parsed.ab > 0 &&
      parsed.bc > 0
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_GEOMETRY;
}

export function saveGeometry(g: PipeGeometry) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
  window.dispatchEvent(new CustomEvent("pipe-geometry-changed", { detail: g }));
}

export function sensorPositions(g: PipeGeometry) {
  return { A: 0, B: g.ab, C: g.ab + g.bc };
}

export function pipeLength(g: PipeGeometry) {
  return g.ab + g.bc;
}

/** React hook that stays in sync across components & tabs. */
export function usePipeGeometry(): [PipeGeometry, (g: PipeGeometry) => void] {
  const [geo, setGeo] = useState<PipeGeometry>(() => loadGeometry());

  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent<PipeGeometry>).detail;
      if (detail) setGeo(detail);
      else setGeo(loadGeometry());
    }
    window.addEventListener("pipe-geometry-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pipe-geometry-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (g: PipeGeometry) => {
    saveGeometry(g);
    setGeo(g);
  };

  return [geo, update];
}
