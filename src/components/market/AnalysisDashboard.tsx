import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MarketType, TickData, MarketSetup } from "../../types/market";

interface AnalysisDashboardProps {
  activeMarket: MarketType;
  tickData: TickData[];
  marketSetup: MarketSetup;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  activeMarket,
  tickData,
  marketSetup,
}) => {
  const analysisData = useMemo(() => {
    if (tickData.length === 0) return null;

    // Use ACTUAL tick range from marketSetup, default to 100
    const analysisRange = marketSetup.tickRange || 100;
    const analysisTicks = tickData.slice(-analysisRange);

    const quotes = analysisTicks.map((t) => t.quote);
    const digits = quotes.map((quote) => Math.floor((quote * 100) % 10));

    // Use the ACTUAL analysis range for all calculations
    const lastNDigits = digits; // Already sliced to analysisRange
    const lastNQuotes = quotes; // Already sliced to analysisRange

    // Calculate digit frequency using ACTUAL range
    const digitFrequency = Array.from({ length: 10 }, (_, digit) => ({
      digit,
      count: digits.filter((d) => d === digit).length,
      percentage:
        (digits.filter((d) => d === digit).length / digits.length) * 100,
    }));

    // Calculate basic probabilities for all markets using ACTUAL range
    const probabilities = {
      // Over/Under probabilities
      over: Array.from({ length: 10 }, (_, digit) => ({
        digit,
        probability:
          (lastNDigits.filter((d) => d > digit).length / lastNDigits.length) *
          100,
      })),
      under: Array.from({ length: 10 }, (_, digit) => ({
        digit,
        probability:
          (lastNDigits.filter((d) => d < digit).length / lastNDigits.length) *
          100,
      })),

      // Even/Odd probabilities
      even:
        (lastNDigits.filter((d) => d % 2 === 0).length / lastNDigits.length) *
        100,
      odd:
        (lastNDigits.filter((d) => d % 2 === 1).length / lastNDigits.length) *
        100,

      // Matches/Differs probabilities
      matches: Array.from({ length: 10 }, (_, digit) => {
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
      }),
      differs: Array.from({ length: 10 }, (_, digit) => {
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
      }),

      // Rise/Fall probabilities
      rise:
        (lastNQuotes
          .slice(0, -1)
          .filter((quote, i) => lastNQuotes[i + 1] > quote).length /
          (lastNQuotes.length - 1)) *
        100,
      fall:
        (lastNQuotes
          .slice(0, -1)
          .filter((quote, i) => lastNQuotes[i + 1] < quote).length /
          (lastNQuotes.length - 1)) *
        100,
    };

    // Generate alerts based on patterns for all markets using ACTUAL range
    const alerts = [];
    const recentDigits = lastNDigits.slice(-20);
    const recentQuotes = lastNQuotes.slice(-20);

    // Over/Under alerts - Show probability for selected digit
    const selectedDigit = marketSetup.predictionDigit;
    if (
      selectedDigit !== undefined &&
      marketSetup.contractType === "over_under"
    ) {
      const overProb = probabilities.over[selectedDigit]?.probability || 0;
      const underProb = probabilities.under[selectedDigit]?.probability || 0;
      alerts.push({
        type: "info",
        market: "over_under",
        message: `Selected Digit ${selectedDigit}: Over ${overProb.toFixed(
          1
        )}% | Under ${underProb.toFixed(1)}%`,
      });
    }

    // Matches/Differs alerts - Show probability for selected digit
    if (
      selectedDigit !== undefined &&
      marketSetup.contractType === "matches_differs"
    ) {
      const matchProb = probabilities.matches[selectedDigit]?.probability || 0;
      const differProb = probabilities.differs[selectedDigit]?.probability || 0;
      alerts.push({
        type: "info",
        market: "matches_differs",
        message: `Selected Digit ${selectedDigit}: Match ${matchProb.toFixed(
          1
        )}% | Differ ${differProb.toFixed(1)}%`,
      });
    }

    // Even/Odd alerts - Show probability for selected prediction
    if (
      selectedDigit !== undefined &&
      marketSetup.contractType === "even_odd"
    ) {
      const selectedProb =
        selectedDigit === 0 ? probabilities.even : probabilities.odd;
      const oppositeProb =
        selectedDigit === 0 ? probabilities.odd : probabilities.even;
      alerts.push({
        type: "info",
        market: "even_odd",
        message: `Selected ${
          selectedDigit === 0 ? "Even" : "Odd"
        }: ${selectedProb.toFixed(1)}% | ${
          selectedDigit === 0 ? "Odd" : "Even"
        }: ${oppositeProb.toFixed(1)}%`,
      });
    }

    // Digit streak alerts
    const currentDigit = digits[digits.length - 1];
    const digitStreak = recentDigits.filter((d) => d === currentDigit).length;
    if (digitStreak >= 3) {
      alerts.push({
        type: "info",
        market: "over_under",
        message: `Digit ${currentDigit} has appeared ${digitStreak} times in recent ticks`,
      });
    }

    // Missing digits alert
    const missingDigits = Array.from(
      { length: 10 },
      (_, digit) => digit
    ).filter((digit) => !recentDigits.includes(digit));

    if (missingDigits.length > 0 && recentDigits.length >= 15) {
      alerts.push({
        type: "warning",
        market: "over_under",
        message: `Digits ${missingDigits.join(", ")} haven't appeared in last ${
          recentDigits.length
        } ticks`,
      });
    }

    // Even/Odd distribution alerts
    const evenCount = recentDigits.filter((d) => d % 2 === 0).length;
    const oddCount = recentDigits.filter((d) => d % 2 === 1).length;

    if (evenCount >= 12) {
      alerts.push({
        type: "info",
        market: "even_odd",
        message: `Even numbers dominated: ${evenCount} of last ${recentDigits.length} ticks`,
      });
    }

    if (oddCount >= 12) {
      alerts.push({
        type: "info",
        market: "even_odd",
        message: `Odd numbers dominated: ${oddCount} of last ${recentDigits.length} ticks`,
      });
    }

    // Matches/Differs frequency alerts
    const recentMatches = recentDigits
      .slice(0, -1)
      .filter((d, i) => d === recentDigits[i + 1]).length;
    const matchPercentage = (recentMatches / (recentDigits.length - 1)) * 100;

    if (matchPercentage > 60) {
      alerts.push({
        type: "info",
        market: "matches_differs",
        message: `High match frequency: ${matchPercentage.toFixed(
          1
        )}% of recent ticks matched previous digit`,
      });
    }

    if (matchPercentage < 20) {
      alerts.push({
        type: "info",
        market: "matches_differs",
        message: `Low match frequency: ${matchPercentage.toFixed(
          1
        )}% of recent ticks matched previous digit`,
      });
    }

    // Rise/Fall alerts
    const riseCount = recentQuotes
      .slice(0, -1)
      .filter((quote, i) => recentQuotes[i + 1] > quote).length;
    const risePercentage = (riseCount / (recentQuotes.length - 1)) * 100;

    if (risePercentage > 70) {
      alerts.push({
        type: "info",
        market: "rise_fall",
        message: `Strong upward trend: ${risePercentage.toFixed(
          1
        )}% of recent ticks rose`,
      });
    }

    if (risePercentage < 30) {
      alerts.push({
        type: "info",
        market: "rise_fall",
        message: `Strong downward trend: ${risePercentage.toFixed(
          1
        )}% of recent ticks rose`,
      });
    }

    // Volatility alert
    const priceChanges = recentQuotes
      .slice(0, -1)
      .map((quote, i) => Math.abs((recentQuotes[i + 1] - quote) / quote));
    const avgVolatility =
      priceChanges.reduce((sum, change) => sum + change, 0) /
      priceChanges.length;

    if (avgVolatility > 0.001) {
      alerts.push({
        type: "warning",
        market: "all",
        message: `High volatility detected: ${(avgVolatility * 100).toFixed(
          2
        )}% average change`,
      });
    }

    return {
      digitFrequency,
      probabilities,
      alerts,
      totalTicks: analysisTicks.length, // Show actual analyzed ticks count
      analysisRange, // Include the actual range used
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
          evenPercentage: probabilities.even,
          oddPercentage: probabilities.odd,
          recentEvenCount: evenCount,
          recentOddCount: oddCount,
        },
        matches_differs: {
          matchRate: matchPercentage,
          recentMatches: recentMatches,
          totalOpportunities: recentDigits.length - 1,
        },
        rise_fall: {
          risePercentage: probabilities.rise,
          fallPercentage: probabilities.fall,
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
  ]);

  // Get market display name
  const getMarketDisplayName = (market: MarketType) => {
    return market
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 space-y-2 lg:space-y-0">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center lg:text-left">
          Analysis - {getMarketDisplayName(activeMarket)}
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-right">
          Analyzing {analysisData?.totalTicks || 0} ticks (
          {marketSetup.tickRange || 100} range)
        </div>
      </div>

      {tickData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg mb-2">No analysis data</div>
            <div className="text-sm">
              Start analysis to see real-time insights
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 overflow-auto">
          {/* Digit Frequency Chart */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base lg:text-lg">
              Last Digit Frequency ({marketSetup.tickRange || 100} ticks)
            </h3>
            {analysisData && (
              <div className="h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData.digitFrequency}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="digit"
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis fontSize={12} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => [value, "Count"]}
                      labelStyle={{ color: "#374151" }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div> */}

          {/* Probability Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base lg:text-lg">
              Probability Analysis
            </h3>
            {analysisData && marketSetup.contractType === "over_under" && (
              <div className="space-y-4 lg:space-y-6">
                {/* Show only the selected digit for Over/Under */}
                {marketSetup.predictionDigit !== undefined ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Analysis for Selected Digit
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {marketSetup.predictionDigit}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          Over {marketSetup.predictionDigit}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {analysisData.probabilities.over[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                          Under {marketSetup.predictionDigit}
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {analysisData.probabilities.under[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Based on {analysisData.totalTicks} ticks analyzed
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-2">
                      Select a digit to see probabilities
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      Click on a digit in the setup panel
                    </div>
                  </div>
                )}
              </div>
            )}

            {analysisData && marketSetup.contractType === "matches_differs" && (
              <div className="space-y-4 lg:space-y-6">
                {/* Show only the selected digit for Matches/Differs */}
                {marketSetup.predictionDigit !== undefined ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Analysis for Selected Digit
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {marketSetup.predictionDigit}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          Matches {marketSetup.predictionDigit}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {analysisData.probabilities.matches[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Next digit same as {marketSetup.predictionDigit}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Differs from {marketSetup.predictionDigit}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisData.probabilities.differs[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Next digit different from{" "}
                          {marketSetup.predictionDigit}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Based on {analysisData.totalTicks} sequence pairs analyzed
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-2">
                      Select a digit to see match probabilities
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      Click on a digit in the setup panel
                    </div>
                  </div>
                )}
              </div>
            )}

            {marketSetup.contractType === "even_odd" && analysisData && (
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <h4 className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 lg:mb-3">
                    Even/Odd Probability
                  </h4>
                  <div className="space-y-3">
                    <div
                      className={`flex items-center justify-between p-3 rounded ${
                        marketSetup.predictionDigit === 0
                          ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700"
                          : "bg-gray-50 dark:bg-gray-700"
                      }`}
                    >
                      <span className="text-sm lg:text-base font-medium">
                        Even
                      </span>
                      <span className="font-mono text-green-600 text-lg">
                        {analysisData.probabilities.even.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className={`flex items-center justify-between p-3 rounded ${
                        marketSetup.predictionDigit === 1
                          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700"
                          : "bg-gray-50 dark:bg-gray-700"
                      }`}
                    >
                      <span className="text-sm lg:text-base font-medium">
                        Odd
                      </span>
                      <span className="font-mono text-blue-600 text-lg">
                        {analysisData.probabilities.odd.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Based on {analysisData.totalTicks} ticks analyzed
                  </div>
                </div>
              </div>
            )}

            {marketSetup.contractType === "rise_fall" && analysisData && (
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <h4 className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 lg:mb-3">
                    Price Movement Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        Rise Probability
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {analysisData.probabilities.rise.toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Next tick higher than current
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Fall Probability
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {analysisData.probabilities.fall.toFixed(1)}%
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Next tick lower than current
                      </div>
                    </div>
                  </div>

                  {/* Additional Rise/Fall Insights */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Trend Analysis
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-yellow-700 dark:text-yellow-300">
                          Current Trend:
                        </span>
                        <span
                          className={`font-medium ${
                            analysisData.marketStats.rise_fall.trend ===
                            "bullish"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {analysisData.marketStats.rise_fall.trend ===
                          "bullish"
                            ? "Bullish ↗"
                            : "Bearish ↘"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700 dark:text-yellow-300">
                          Trend Strength:
                        </span>
                        <span className="font-medium text-yellow-600">
                          {(
                            analysisData.marketStats.rise_fall.strength * 100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700 dark:text-yellow-300">
                          Volatility:
                        </span>
                        <span className="font-medium text-yellow-600">
                          {(
                            (analysisData.probabilities.rise +
                              analysisData.probabilities.fall) /
                            2
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Based on {analysisData.totalTicks} price movements analyzed
                  </div>
                </div>
              </div>
            )}

            {!analysisData && (
              <div className="text-gray-500 dark:text-gray-400 text-sm lg:text-base text-center py-8">
                No analysis data available
              </div>
            )}
          </div>

          {/* Live Alerts & Indicators */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base lg:text-lg">
              Live Indicators
            </h3>
            {analysisData && analysisData.alerts.length > 0 ? (
              <div className="space-y-2 lg:space-y-3 max-h-48 lg:max-h-64 overflow-y-auto">
                {analysisData.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 lg:p-2 rounded text-sm ${
                      alert.type === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <div className="font-medium text-xs lg:text-sm mb-1">
                      {alert.market === "all"
                        ? "System"
                        : getMarketDisplayName(alert.market as MarketType)}
                    </div>
                    <div className="text-xs lg:text-sm">{alert.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm lg:text-base text-center py-8">
                No significant patterns detected
              </div>
            )}

            {/* Current Setup Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                Current Setup
              </h4>
              <div className="space-y-2 text-sm lg:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Market:
                  </span>
                  <span className="font-medium capitalize">
                    {marketSetup.contractType.replace("_", " ")}
                  </span>
                </div>
                {marketSetup.predictionDigit !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Prediction:
                    </span>
                    <span className="font-medium">
                      {marketSetup.contractType === "even_odd"
                        ? marketSetup.predictionDigit === 0
                          ? "Even"
                          : "Odd"
                        : `Digit ${marketSetup.predictionDigit}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Analysis Range:
                  </span>
                  <span className="font-medium">
                    {marketSetup.tickRange || 100} ticks
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Data Points:
                  </span>
                  <span className="font-medium">
                    {analysisData?.totalTicks || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
