export type MarketType =
  | "digits"
  | "rise_fall"
  | "matches_differs"
  | "even_odd";
export type ContractType =
  | "over_under"
  | "matches_differs"
  | "rise_fall"
  | "even_odd";
export type VolatilityIndex =
  | "vol10"
  | "vol10_1s"
  | "vol25"
  | "vol25_1s"
  | "vol50"
  | "vol50_1s"
  | "vol75"
  | "vol75_1s"
  | "vol100"
  | "vol100_1s";

export type DurationUnit = "ticks" | "seconds" | "minutes";

export interface MarketSetup {
  contractType: ContractType;
  predictionDigit?: number;
  barrierOffset?: number;
  tickRange?: number;
}

export interface TickData {
  epoch: number;
  quote: number;
  symbol: string;
  id?: string;
}

export interface MarketAnalysis {
  lastDigit: number;
  average: number;
  volatility: number;
  digitFrequency: Record<number, number>;
  trends: TrendPoint[];
  probabilities: ProbabilityData;
  lastTick: TickData | null;
}

export interface TrendPoint {
  timestamp: number;
  value: number;
}

export interface ProbabilityData {
  over: number[];
  under: number[];
  matches: number[];
  differs: number[];
}

export interface WebSocketMessage {
  type: "tick" | "subscription" | "error" | "connection";
  data: any;
  timestamp: number;
}

export interface DerivSymbolInfo {
  symbol: string;
  displayName: string;
  tickFrequency: string;
}

export interface PatternDetection {
  type: "streak" | "missing" | "alternating";
  digit?: number;
  digits?: number[];
  length?: number;
  pattern?: number[];
  confidence: number;
}
