import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";

export const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
export const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
export const sans = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-sans", display: "swap" });
