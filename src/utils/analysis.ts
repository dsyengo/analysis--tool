import { TickData, ProbabilityData, TrendPoint } from "../types/market";

export const calculateMovingAverage = (
  ticks: TickData[],
  period: number
): number[] => {
  if (ticks.length < period) return [];

  const quotes = ticks.map((t) => t.quote);
  const movingAverages: number[] = [];

  for (let i = period - 1; i < quotes.length; i++) {
    const slice = quotes.slice(i - period + 1, i + 1);
    const average = slice.reduce((sum, value) => sum + value, 0) / period;
    movingAverages.push(average);
  }

  return movingAverages;
};

export const calculateRSI = (
  ticks: TickData[],
  period: number = 14
): number | null => {
  if (ticks.length < period + 1) return null;

  const quotes = ticks.map((t) => t.quote);
  let gains = 0;
  let losses = 0;

  // Calculate initial average gains and losses
  for (let i = 1; i <= period; i++) {
    const change = quotes[i] - quotes[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate subsequent values using Wilder's smoothing method
  for (let i = period + 1; i < quotes.length; i++) {
    const change = quotes[i] - quotes[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

export const detectSupportResistance = (
  ticks: TickData[],
  sensitivity: number = 0.001
): { support: number[]; resistance: number[] } => {
  if (ticks.length < 20) return { support: [], resistance: [] };

  const quotes = ticks.map((t) => t.quote);
  const support: number[] = [];
  const resistance: number[] = [];

  // Simple peak and trough detection
  for (let i = 5; i < quotes.length - 5; i++) {
    const current = quotes[i];
    const left = quotes.slice(i - 5, i);
    const right = quotes.slice(i + 1, i + 6);

    // Check for resistance (peak)
    if (current > Math.max(...left) && current > Math.max(...right)) {
      resistance.push(current);
    }

    // Check for support (trough)
    if (current < Math.min(...left) && current < Math.min(...right)) {
      support.push(current);
    }
  }

  // Cluster nearby levels
  const clusterLevels = (levels: number[], threshold: number): number[] => {
    const clustered: number[] = [];

    levels.sort((a, b) => a - b);
    let currentCluster: number[] = [];

    for (const level of levels) {
      if (currentCluster.length === 0) {
        currentCluster.push(level);
      } else {
        const lastLevel = currentCluster[currentCluster.length - 1];
        if (Math.abs(level - lastLevel) <= threshold) {
          currentCluster.push(level);
        } else {
          clustered.push(
            currentCluster.reduce((sum, l) => sum + l, 0) /
              currentCluster.length
          );
          currentCluster = [level];
        }
      }
    }

    if (currentCluster.length > 0) {
      clustered.push(
        currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length
      );
    }

    return clustered;
  };

  return {
    support: clusterLevels(support, sensitivity),
    resistance: clusterLevels(resistance, sensitivity),
  };
};

export const calculateProbability = (
  ticks: TickData[],
  condition: (digit: number) => boolean
): number => {
  if (ticks.length === 0) return 0;

  const digits = ticks.map((t) => Math.floor((t.quote * 100) % 10));
  const favorable = digits.filter(condition).length;

  return favorable / digits.length;
};

export const generateTradingSignals = (
  ticks: TickData[],
  marketType: string
) => {
  if (ticks.length < 50) return [];

  const signals = [];
  const recentTicks = ticks.slice(-50);
  const digits = recentTicks.map((t) => Math.floor((t.quote * 100) % 10));
  const quotes = recentTicks.map((t) => t.quote);

  // Digit-based signals for Over/Under
  if (marketType === "over_under") {
    const digitFrequency = digits.reduce((freq, digit) => {
      freq[digit] = (freq[digit] || 0) + 1;
      return freq;
    }, {} as Record<number, number>);

    // Signal for under-represented digits
    const averageFrequency = digits.length / 10;
    for (let digit = 0; digit < 10; digit++) {
      const frequency = digitFrequency[digit] || 0;
      if (frequency < averageFrequency * 0.5) {
        signals.push({
          type: "DIGIT_UNDER_REPRESENTED",
          digit,
          confidence: 0.7,
          message: `Digit ${digit} is under-represented in recent ticks`,
        });
      }
    }

    // Signal for hot digits
    for (let digit = 0; digit < 10; digit++) {
      const frequency = digitFrequency[digit] || 0;
      if (frequency > averageFrequency * 1.5) {
        signals.push({
          type: "DIGIT_OVER_REPRESENTED",
          digit,
          confidence: 0.6,
          message: `Digit ${digit} is appearing frequently`,
        });
      }
    }
  }

  // Trend-based signals
  const shortMA = calculateMovingAverage(recentTicks, 5);
  const longMA = calculateMovingAverage(recentTicks, 15);

  if (shortMA.length > 0 && longMA.length > 0) {
    const currentShort = shortMA[shortMA.length - 1];
    const currentLong = longMA[longMA.length - 1];
    const previousShort = shortMA[shortMA.length - 2];
    const previousLong = longMA[longMA.length - 2];

    if (currentShort > currentLong && previousShort <= previousLong) {
      signals.push({
        type: "TREND_UP",
        confidence: 0.65,
        message: "Short-term trend turning upward",
      });
    }

    if (currentShort < currentLong && previousShort >= previousLong) {
      signals.push({
        type: "TREND_DOWN",
        confidence: 0.65,
        message: "Short-term trend turning downward",
      });
    }
  }

  // Volatility signals
  const volatility = calculateVolatility(quotes);
  if (volatility > 0.1) {
    signals.push({
      type: "HIGH_VOLATILITY",
      confidence: 0.8,
      message: "High volatility detected - consider wider stops",
    });
  }

  return signals;
};

const calculateVolatility = (prices: number[]): number => {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const averageReturn =
    returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) /
    returns.length;

  return Math.sqrt(variance);
};

export const formatProbability = (probability: number): string => {
  return `${(probability * 100).toFixed(1)}%`;
};

export const getConfidenceLevel = (
  probability: number
): "low" | "medium" | "high" => {
  if (probability >= 0.7) return "high";
  if (probability >= 0.5) return "medium";
  return "low";
};
