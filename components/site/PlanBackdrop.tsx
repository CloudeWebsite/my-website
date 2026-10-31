"use client";

import { useEffect, useState } from "react";
import { PlanSvg } from "@/components/hero/PlanSvg";
import type { BlueprintPalette } from "@/components/hero/plan";

/**
 * Renders the plan drawing on the client only. Server-rendering it inside a
 * not-found boundary would serialise ~250 KB of SVG into every page's payload.
 */
export function PlanBackdrop({ palette }: { palette?: BlueprintPalette }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(true), []);
  return show ? <PlanSvg palette={palette} /> : null;
}
