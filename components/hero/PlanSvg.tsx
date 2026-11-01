import { BLUEPRINT, PLAN_BOUNDS, buildPlan, type BlueprintPalette, type PlanPrim } from "./plan";

/** Vector version of the drawing — crisp at any zoom (plan viewer, fallbacks). */
export function PlanSvg({ pool = false, palette = BLUEPRINT, title, sheet, className }: { pool?: boolean; palette?: BlueprintPalette; title?: string; sheet?: string; className?: string }) {
  const { x0, z0, x1, z1 } = PLAN_BOUNDS;
  const layers = buildPlan({ pool, title, sheet });
  const color = (t: PlanPrim["tone"]) => (t === "ink" ? palette.ink : t === "soft" ? palette.soft : t === "accent" ? palette.accent : palette.faint);
  const pts = (p: Array<[number, number]>) => p.map(([x, z]) => `${x.toFixed(3)},${z.toFixed(3)}`).join(" ");
  const k = 0.012;
  return (
    <svg className={className} viewBox={`${x0} ${z0} ${x1 - x0} ${z1 - z0}`} role="img" aria-label={title ?? "Ground floor plan"} style={{ background: palette.paper }}>
      {layers.map((layer) => (
        <g key={layer.name}>
          {layer.prims.map((p, i) => {
            if (p.k === "fill")
              return (
                <g key={i}>
                  <polygon points={pts(p.pts)} fill={palette.paper} />
                  <polygon points={pts(p.pts)} fill={palette.fill} />
                </g>
              );
            if (p.k === "text")
              return (
                <text
                  key={i}
                  x={p.x}
                  y={p.z}
                  fontSize={p.size}
                  fill={color(p.tone)}
                  textAnchor={p.anchor}
                  dominantBaseline="middle"
                  fontWeight={p.weight ?? 400}
                  fontFamily="var(--font-mono), ui-monospace, monospace"
                  transform={p.rotate ? `rotate(${p.rotate} ${p.x} ${p.z})` : undefined}
                >
                  {p.text}
                </text>
              );
            const Tag = p.closed ? "polygon" : "polyline";
            return <Tag key={i} points={pts(p.pts)} fill="none" stroke={color(p.tone)} strokeWidth={p.w * k * 1.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={p.dash?.join(" ")} vectorEffect="non-scaling-stroke" style={{ strokeWidth: p.w * 1.1 }} />;
          })}
        </g>
      ))}
    </svg>
  );
}
