"use client";

import { useEffect, useState } from "react";

export function LocalTime({ timezone, label, seconds = false }: { timezone: string; label: string; seconds?: boolean }) {
  const [now, setNow] = useState<string>("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: seconds ? "2-digit" : undefined, hour12: false, timeZone: timezone });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timezone, seconds]);
  return (
    <time suppressHydrationWarning>
      {now} {label}
    </time>
  );
}
