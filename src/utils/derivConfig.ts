import type { VolatilityIndex, DerivSymbolInfo } from "../types/market";

export const VOLATILITY_SYMBOLS: Record<VolatilityIndex, DerivSymbolInfo> = {
  vol10: {
    symbol: "R_10",
    displayName: "Volatility 10 Index",
    tickFrequency: "~2 seconds",
  },
  vol10_1s: {
    symbol: "1HZ10V",
    displayName: "Volatility 10 (1s) Index",
    tickFrequency: "1 second",
  },
  vol25: {
    symbol: "R_25",
    displayName: "Volatility 25 Index",
    tickFrequency: "~2 seconds",
  },
  vol25_1s: {
    symbol: "1HZ25V",
    displayName: "Volatility 25 (1s) Index",
    tickFrequency: "1 second",
  },
  vol50: {
    symbol: "R_50",
    displayName: "Volatility 50 Index",
    tickFrequency: "~2 seconds",
  },
  vol50_1s: {
    symbol: "1HZ50V",
    displayName: "Volatility 50 (1s) Index",
    tickFrequency: "1 second",
  },
  vol75: {
    symbol: "R_75",
    displayName: "Volatility 75 Index",
    tickFrequency: "~2 seconds",
  },
  vol75_1s: {
    symbol: "1HZ75V",
    displayName: "Volatility 75 (1s) Index",
    tickFrequency: "1 second",
  },
  vol100: {
    symbol: "R_100",
    displayName: "Volatility 100 Index",
    tickFrequency: "~2 seconds",
  },
  vol100_1s: {
    symbol: "1HZ100V",
    displayName: "Volatility 100 (1s) Index",
    tickFrequency: "1 second",
  },
};

export const getSymbolForVolatility = (volatility: VolatilityIndex): string => {
  return VOLATILITY_SYMBOLS[volatility].symbol;
};

export const getDisplayNameForVolatility = (
  volatility: VolatilityIndex
): string => {
  return VOLATILITY_SYMBOLS[volatility].displayName;
};
