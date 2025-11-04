import { useMemo } from "react";
import type { TickData, MarketSetup, MarketType } from "../../types/market";

/**
 * Interface for analysis data returned by the hook
 */
export interface AnalysisData {
  digitFrequency: Array<{ digit: number; count: number; percentage: number }>;
  probabilities: {
    // Over/Under probabilities for all digits
    over: Array<{ digit: number; probability: number }>;
    under: Array<{ digit: number; probability: number }>;
    // Even/Odd probabilities
    even: number;
    odd: number;
    // Matches/Differs probabilities for all digits
    matches: Array<{ digit: number; probability: number }>;
    differs: Array<{ digit: number; probability: number }>;
    // Rise/Fall probabilities
    rise: number;
    fall: number;
  };
  // Market sequences for display
  sequences: {
    digits: string[];
    rise_fall: string[];
    over_under: string[];
    matches_differs: string[];
    even_odd: string[];
  };
  totalTicks: number;
  analysisRange: number;
  averageQuote: number;
  marketStats: {
    over_under: {
      hotDigits: Array<{ digit: number; count: number; percentage: number }>;
      coldDigits: Array<{ digit: number; count: number; percentage: number }>;
    };
    even_odd: {
      evenPercentage: number;
      oddPercentage: number;
      recentEvenCount: number;
      recentOddCount: number;
    };
    matches_differs: {
      matchRate: number;
      recentMatches: number;
      totalOpportunities: number;
    };
    rise_fall: {
      risePercentage: number;
      fallPercentage: number;
      trend: "bullish" | "bearish";
      strength: number;
    };
  };
}

/**
 * Custom hook that handles all analysis data processing and calculations
 * Separates business logic from UI presentation
 */
export const useAnalysisData = (
  tickData: TickData[],
  marketSetup: MarketSetup,
  activeMarket: MarketType
): AnalysisData | null => {
  return useMemo(() => {
    // Return null if no tick data is available
    if (tickData.length === 0) return null;

    // Use ACTUAL tick range from marketSetup, default to 100
    const analysisRange = marketSetup.tickRange || 100;
    const analysisTicks = tickData.slice(-analysisRange);

    const quotes = analysisTicks.map((t) => t.quote);
    const digits = quotes.map((quote) => Math.floor((quote * 100) % 10));

    // Use the ACTUAL analysis range for all calculations
    const lastNDigits = digits;
    const lastNQuotes = quotes;

    // Calculate digit frequency using ACTUAL range
    const digitFrequency = Array.from({ length: 10 }, (_, digit) => ({
      digit,
      count: digits.filter((d) => d === digit).length,
      percentage:
        (digits.filter((d) => d === digit).length / digits.length) * 100,
    }));

    // Calculate Over/Under probabilities for ALL digits (0-9)
    const overProbabilities = Array.from({ length: 10 }, (_, digit) => ({
      digit,
      probability:
        (lastNDigits.filter((d) => d > digit).length / lastNDigits.length) *
        100,
    }));

    const underProbabilities = Array.from({ length: 10 }, (_, digit) => ({
      digit,
      probability:
        (lastNDigits.filter((d) => d < digit).length / lastNDigits.length) *
        100,
    }));

    // Calculate Even/Odd probabilities
    const evenProbability =
      (lastNDigits.filter((d) => d % 2 === 0).length / lastNDigits.length) *
      100;
    const oddProbability =
      (lastNDigits.filter((d) => d % 2 === 1).length / lastNDigits.length) *
      100;

    // Calculate Matches/Differs probabilities for ALL digits (0-9)
    const matchProbabilities = Array.from({ length: 10 }, (_, digit) => {
      const matches = lastNDigits
        .slice(0, -1)
        .filter((d, i) => d === digit && lastNDigits[i + 1] === digit).length;
      const opportunities = lastNDigits
        .slice(0, -1)
        .filter((d) => d === digit).length;
      return {
        digit,
        probability: opportunities > 0 ? (matches / opportunities) * 100 : 0,
      };
    });

    const differProbabilities = Array.from({ length: 10 }, (_, digit) => {
      const differs = lastNDigits
        .slice(0, -1)
        .filter((d, i) => d === digit && lastNDigits[i + 1] !== digit).length;
      const opportunities = lastNDigits
        .slice(0, -1)
        .filter((d) => d === digit).length;
      return {
        digit,
        probability: opportunities > 0 ? (differs / opportunities) * 100 : 0,
      };
    });

    // Calculate Rise/Fall probabilities
    const riseProbability =
      (lastNQuotes.slice(0, -1).filter((quote, i) => lastNQuotes[i + 1] > quote)
        .length /
        (lastNQuotes.length - 1)) *
      100;

    const fallProbability =
      (lastNQuotes.slice(0, -1).filter((quote, i) => lastNQuotes[i + 1] < quote)
        .length /
        (lastNQuotes.length - 1)) *
      100;

    // Generate market-specific sequences
    const sequences = {
      digits: digits.map((d) => (d % 2 === 0 ? "E" : "O")),
      rise_fall: quotes
        .map((quote, index, arr) =>
          index === 0 ? "" : quote > arr[index - 1] ? "R" : "F"
        )
        .filter(Boolean),
      over_under: digits
        .map((digit, index, arr) =>
          index === 0 ? "" : digit > arr[index - 1] ? "O" : "U"
        )
        .filter(Boolean),
      matches_differs: digits
        .map((digit, index, arr) =>
          index === 0 ? "" : digit === arr[index - 1] ? "M" : "D"
        )
        .filter(Boolean),
      even_odd: digits.map((d) => (d % 2 === 0 ? "E" : "O")),
    };

    // Calculate market statistics for insights
    const recentDigits = lastNDigits.slice(-20);
    const recentQuotes = lastNQuotes.slice(-20);

    // Even/Odd distribution
    const evenCount = recentDigits.filter((d) => d % 2 === 0).length;
    const oddCount = recentDigits.filter((d) => d % 2 === 1).length;

    // Matches/Differs frequency
    const recentMatches = recentDigits
      .slice(0, -1)
      .filter((d, i) => d === recentDigits[i + 1]).length;
    const matchPercentage = (recentMatches / (recentDigits.length - 1)) * 100;

    // Rise/Fall trend analysis
    const riseCount = recentQuotes
      .slice(0, -1)
      .filter((quote, i) => recentQuotes[i + 1] > quote).length;
    const risePercentage = (riseCount / (recentQuotes.length - 1)) * 100;

    return {
      digitFrequency,
      probabilities: {
        over: overProbabilities,
        under: underProbabilities,
        even: evenProbability,
        odd: oddProbability,
        matches: matchProbabilities,
        differs: differProbabilities,
        rise: riseProbability,
        fall: fallProbability,
      },
      sequences,
      totalTicks: analysisTicks.length,
      analysisRange,
      averageQuote: quotes.reduce((sum, q) => sum + q, 0) / quotes.length,
      marketStats: {
        over_under: {
          hotDigits: digitFrequency
            .slice()
            .sort((a, b) => b.count - a.count)
            .slice(0, 3),
          coldDigits: digitFrequency
            .slice()
            .sort((a, b) => a.count - b.count)
            .slice(0, 3),
        },
        even_odd: {
          evenPercentage: evenProbability,
          oddPercentage: oddProbability,
          recentEvenCount: evenCount,
          recentOddCount: oddCount,
        },
        matches_differs: {
          matchRate: matchPercentage,
          recentMatches: recentMatches,
          totalOpportunities: recentDigits.length - 1,
        },
        rise_fall: {
          risePercentage: riseProbability,
          fallPercentage: fallProbability,
          trend: risePercentage > 50 ? "bullish" : "bearish",
          strength: Math.abs(risePercentage - 50) / 50,
        },
      },
    };
  }, [
    tickData,
    marketSetup.tickRange,
    marketSetup.predictionDigit,
    marketSetup.contractType,
    activeMarket,
  ]);
};

/**
 * Utility function to get market display name
 */
export const getMarketDisplayName = (market: MarketType): string => {
  return market
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get color based on probability value for visual indicators
 */
export const getProbabilityColor = (probability: number): string => {
  if (probability >= 70) return "text-green-600";
  if (probability >= 60) return "text-blue-600";
  if (probability >= 40) return "text-yellow-600";
  return "text-red-600";
};

/**
 * Get background color based on probability value for cards
 */
export const getProbabilityBgColor = (probability: number): string => {
  if (probability >= 70)
    return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
  if (probability >= 60)
    return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
  if (probability >= 40)
    return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
};

/**
 * Get color for sequence characters based on market
 */
export const getSequenceColor = (char: string, market: MarketType): string => {
  const colors = {
    digits: { E: "text-green-500", O: "text-blue-500" },
    rise_fall: { R: "text-green-500", F: "text-red-500" },
    over_under: { O: "text-green-500", U: "text-red-500" },
    matches_differs: { M: "text-green-500", D: "text-blue-500" },
    even_odd: { E: "text-green-500", O: "text-blue-500" },
  };

  const marketColors = colors[market] || colors.digits;
  return marketColors[char as keyof typeof marketColors] || "text-gray-600";
};
