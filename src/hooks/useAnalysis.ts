import { useState, useEffect, useMemo } from "react";
import type {
  TickData,
  MarketAnalysis,
  ProbabilityData,
  TrendPoint,
  PatternDetection,
} from "../types/market";

export const useAnalysis = (
  tickData: TickData[],
  lookbackPeriod: number = 100
) => {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);

  const processedAnalysis = useMemo(() => {
    if (tickData.length === 0) return null;

    const recentTicks = tickData.slice(-lookbackPeriod);
    const quotes = recentTicks.map((t) => t.quote);
    const digits = quotes.map((quote) => Math.floor((quote * 100) % 10));

    // Calculate basic statistics
    const average =
      quotes.reduce((sum, quote) => sum + quote, 0) / quotes.length;

    // Calculate volatility (standard deviation)
    const variance =
      quotes.reduce((sum, quote) => sum + Math.pow(quote - average, 2), 0) /
      quotes.length;
    const volatility = Math.sqrt(variance);

    // Calculate digit frequency
    const digitFrequency = digits.reduce((freq, digit) => {
      freq[digit] = (freq[digit] || 0) + 1;
      return freq;
    }, {} as Record<number, number>);

    // Calculate trends (moving average)
    const trends: TrendPoint[] = recentTicks.map((tick, index) => ({
      timestamp: tick.epoch,
      value:
        quotes.slice(0, index + 1).reduce((sum, q) => sum + q, 0) / (index + 1),
    }));

    // Calculate probabilities
    const probabilities = calculateProbabilities(digits);

    return {
      lastDigit: digits[digits.length - 1] || 0,
      average,
      volatility,
      digitFrequency,
      trends,
      probabilities,
      lastTick: recentTicks[recentTicks.length - 1] || null,
    };
  }, [tickData, lookbackPeriod]);

  useEffect(() => {
    setAnalysis(processedAnalysis);
  }, [processedAnalysis]);

  return analysis;
};

const calculateProbabilities = (digits: number[]): ProbabilityData => {
  const probabilities: ProbabilityData = {
    over: Array(10).fill(0),
    under: Array(10).fill(0),
    matches: Array(10).fill(0),
    differs: Array(10).fill(0),
  };

  if (digits.length < 2) return probabilities;

  // Calculate probabilities based on historical frequency
  const total = digits.length;

  for (let digit = 0; digit < 10; digit++) {
    // Over probability
    probabilities.over[digit] = digits.filter((d) => d > digit).length / total;

    // Under probability
    probabilities.under[digit] = digits.filter((d) => d < digit).length / total;

    // Matches probability (next digit equals this digit)
    const matches = digits
      .slice(0, -1)
      .filter((d, i) => d === digit && digits[i + 1] === digit).length;
    const opportunities = digits.slice(0, -1).filter((d) => d === digit).length;
    probabilities.matches[digit] =
      opportunities > 0 ? matches / opportunities : 0;

    // Differs probability (next digit different from this digit)
    const differs = digits
      .slice(0, -1)
      .filter((d, i) => d === digit && digits[i + 1] !== digit).length;
    probabilities.differs[digit] =
      opportunities > 0 ? differs / opportunities : 0;
  }

  return probabilities;
};

// Additional analysis utilities
export const usePatternDetection = (tickData: TickData[]) => {
  return useMemo(() => {
    if (tickData.length < 10) return [];

    const digits = tickData.map((t) => Math.floor((t.quote * 100) % 10));
    const patterns: PatternDetection[] = [];

    // Check for streaks
    const recentDigits = digits.slice(-20);
    const currentDigit = recentDigits[recentDigits.length - 1];
    const streak = recentDigits.filter((d) => d === currentDigit).length;

    if (streak >= 3) {
      patterns.push({
        type: "streak",
        digit: currentDigit,
        length: streak,
        confidence: Math.min(streak / 10, 0.9),
      });
    }

    // Check for missing digits
    const missingDigits = Array.from({ length: 10 }, (_, i) => i).filter(
      (digit) => !recentDigits.includes(digit)
    );

    if (missingDigits.length > 0 && recentDigits.length >= 15) {
      patterns.push({
        type: "missing",
        digits: missingDigits,
        length: recentDigits.length,
        confidence: Math.min(missingDigits.length / 10, 0.8),
      });
    }

    // Check for alternating patterns
    if (recentDigits.length >= 6) {
      const lastSix = recentDigits.slice(-6);
      const isAlternating = lastSix.every((digit, index) => {
        if (index < 2) return true;
        return digit === lastSix[index - 2];
      });

      if (isAlternating) {
        patterns.push({
          type: "alternating",
          pattern: lastSix,
          confidence: 0.7,
        });
      }
    }

    return patterns;
  }, [tickData]);
};
