import React, { useMemo, useState, useEffect } from "react";
import type {
  TickData,
  VolatilityIndex,
  MarketType,
  MarketSetup,
} from "../../types/market";
import { VOLATILITY_SYMBOLS } from "../../utils/derivConfig";

interface LiveMarketDataProps {
  tickData: TickData[];
  volatilityIndex: VolatilityIndex;
  currentSymbol: string;
  activeMarket: MarketType;
  marketSetup: MarketSetup;
}

export const LiveMarketData: React.FC<LiveMarketDataProps> = ({
  tickData,
  volatilityIndex,
  currentSymbol,
  activeMarket,
  marketSetup,
}) => {
  const [currentDigit, setCurrentDigit] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const lastTick = tickData[tickData.length - 1];
  const symbolInfo = VOLATILITY_SYMBOLS[volatilityIndex];

  // Use ACTUAL tick range from marketSetup, default to 100
  const analysisRange = marketSetup.tickRange || 100;

  // Calculate digit probabilities and market sequences using ACTUAL tick range
  const analysisData = useMemo(() => {
    if (tickData.length === 0) return null;

    // Use the ACTUAL analysis range from marketSetup
    const analysisTicks = tickData.slice(-analysisRange);
    const quotes = analysisTicks.map((t) => t.quote);
    const digits = quotes.map((quote) => Math.floor((quote * 100) % 10));

    // Calculate digit probabilities using ACTUAL range
    const digitProbabilities = Array.from({ length: 10 }, (_, digit) => ({
      digit,
      probability:
        (digits.filter((d) => d === digit).length / digits.length) * 100,
    }));

    // Generate market-specific sequences using ACTUAL range
    const sequenceData = {
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

    return {
      digitProbabilities,
      sequence: sequenceData[activeMarket] || sequenceData.digits,
      lastDigits: digits,
      analysisRange, // Include the actual range used
    };
  }, [tickData, activeMarket, analysisRange]);

  // Animate cursor movement between digits
  useEffect(() => {
    if (!lastTick || !analysisData) return;

    const newDigit = Math.floor((lastTick.quote * 100) % 10);
    setCurrentDigit(newDigit);
    setCursorPosition(newDigit);

    // Reset animation
    const timer = setTimeout(() => {
      // Find digit with highest probability for cursor positioning
      const highestProbDigit = analysisData.digitProbabilities.reduce(
        (max, curr) => (curr.probability > max.probability ? curr : max),
        analysisData.digitProbabilities[0]
      );
      setCursorPosition(highestProbDigit.digit);
    }, 3000);

    return () => clearTimeout(timer);
  }, [lastTick, analysisData]);

  // Check if current digit is the selected prediction digit
  const isSelectedDigit = (digit: number) => {
    return marketSetup.predictionDigit === digit;
  };

  // Get market display name
  const getMarketDisplayName = (market: MarketType) => {
    return market
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get color for sequence characters based on market
  const getSequenceColor = (char: string) => {
    const colors = {
      digits: { E: "text-green-500", O: "text-blue-500" },
      rise_fall: { R: "text-green-500", F: "text-red-500" },
      over_under: { O: "text-green-500", U: "text-red-500" },
      matches_differs: { M: "text-green-500", D: "text-blue-500" },
      even_odd: { E: "text-green-500", O: "text-blue-500" },
    };

    const marketColors = colors[activeMarket] || colors.digits;
    return marketColors[char as keyof typeof marketColors] || "text-gray-600";
  };

  // Get legend items based on market
  const getLegendItems = () => {
    const legends = {
      digits: [
        { char: "E", label: "Even", color: "text-green-500" },
        { char: "O", label: "Odd", color: "text-blue-500" },
      ],
      rise_fall: [
        { char: "R", label: "Rise", color: "text-green-500" },
        { char: "F", label: "Fall", color: "text-red-500" },
      ],
      over_under: [
        { char: "O", label: "Over", color: "text-green-500" },
        { char: "U", label: "Under", color: "text-red-500" },
      ],
      matches_differs: [
        { char: "M", label: "Matches", color: "text-green-500" },
        { char: "D", label: "Differs", color: "text-blue-500" },
      ],
      even_odd: [
        { char: "E", label: "Even", color: "text-green-500" },
        { char: "O", label: "Odd", color: "text-blue-500" },
      ],
    };

    return legends[activeMarket] || legends.digits;
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 space-y-2 lg:space-y-0">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center lg:text-left">
          Live Market - {symbolInfo.displayName}
        </h2>
        <div className="flex items-center justify-center lg:justify-end space-x-3 lg:space-x-4 text-xs lg:text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Symbol:{" "}
            <strong className="font-mono">{currentSymbol || "N/A"}</strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Ticks: <strong>{tickData.length}</strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Range: <strong>{analysisRange}</strong>
          </span>
        </div>
      </div>

      {/* Current Selection Display
      {marketSetup.predictionDigit !== undefined && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            <strong>Current Selection:</strong>{" "}
            {marketSetup.contractType === "even_odd"
              ? marketSetup.predictionDigit === 0
                ? "Even"
                : "Odd"
              : `Digit ${marketSetup.predictionDigit}`}{" "}
            | Analysis Range: {analysisRange} ticks
          </div>
        </div>
      )} */}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Digit Circles Visualization - Main Area */}
        <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 lg:p-6">
          {tickData.length > 0 ? (
            <div className="h-full flex flex-col">
              {/* Digit Circles Grid */}
              <div className="flex-1 relative">
                {/* Desktop Layout - Arc Arrangement */}
                <div className="hidden lg:flex justify-center items-center h-full">
                  <div className="relative w-80 h-64">
                    {Array.from({ length: 10 }, (_, digit) => {
                      const probability =
                        analysisData?.digitProbabilities[digit]?.probability ||
                        0;
                      const isActive = cursorPosition === digit;
                      const isCurrent = currentDigit === digit;
                      const isSelected = isSelectedDigit(digit);

                      return (
                        <div
                          key={digit}
                          className={`absolute transition-all duration-500 ease-out ${
                            isActive ? "z-10" : "z-0"
                          }`}
                          style={{
                            left: `${
                              50 +
                              40 * Math.cos(((digit * 36 - 90) * Math.PI) / 180)
                            }%`,
                            top: `${
                              50 +
                              40 * Math.sin(((digit * 36 - 90) * Math.PI) / 180)
                            }%`,
                            transform: `translate(-50%, -50%) scale(${
                              isActive ? 1.2 : 1
                            })`,
                          }}
                        >
                          <div
                            className={`
                            relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center
                            transition-all duration-300
                            ${
                              isActive
                                ? "bg-blue-100 dark:bg-blue-900 border-blue-400 shadow-lg"
                                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            }
                            ${isCurrent ? "ring-2 ring-green-400" : ""}
                            ${
                              isSelected
                                ? "ring-4 ring-yellow-400 dark:ring-yellow-500 shadow-lg"
                                : ""
                            }
                          `}
                          >
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {digit}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {probability.toFixed(1)}%
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Animated Cursor */}
                    <div
                      className="absolute w-6 h-6 bg-red-500 rounded-full shadow-lg z-20 transition-all duration-500 ease-out"
                      style={{
                        left: `${
                          50 +
                          40 *
                            Math.cos(
                              ((cursorPosition * 36 - 90) * Math.PI) / 180
                            )
                        }%`,
                        top: `${
                          50 +
                          40 *
                            Math.sin(
                              ((cursorPosition * 36 - 90) * Math.PI) / 180
                            )
                        }%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </div>
                </div>

                {/* Mobile Layout - Grid Arrangement */}
                <div className="lg:hidden grid grid-cols-5 gap-3 justify-items-center">
                  {Array.from({ length: 10 }, (_, digit) => {
                    const probability =
                      analysisData?.digitProbabilities[digit]?.probability || 0;
                    const isActive = cursorPosition === digit;
                    const isCurrent = currentDigit === digit;
                    const isSelected = isSelectedDigit(digit);

                    return (
                      <div
                        key={digit}
                        className={`
                          relative w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 flex flex-col items-center justify-center
                          transition-all duration-300
                          ${
                            isActive
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-400 shadow-lg scale-110"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          }
                          ${isCurrent ? "ring-2 ring-green-400" : ""}
                          ${
                            isSelected
                              ? "ring-4 ring-yellow-400 dark:ring-yellow-500 shadow-lg"
                              : ""
                          }
                        `}
                      >
                        <div className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                          {digit}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {probability.toFixed(0)}%
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                        )}

                        {/* Mobile Cursor Indicator */}
                        {isActive && !isSelected && (
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Digit Highlight */}
              {lastTick && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Current Last Digit
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {currentDigit}
                  </div>
                  {marketSetup.predictionDigit !== undefined && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                      Selected:{" "}
                      {marketSetup.contractType === "even_odd"
                        ? marketSetup.predictionDigit === 0
                          ? "Even"
                          : "Odd"
                        : `Digit ${marketSetup.predictionDigit}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-lg mb-2">No market data</div>
                <div className="text-sm">
                  Connect and start analysis to see live digits
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Sequence Display */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          {/* Current Tick Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm lg:text-base">
              Current Tick
            </h3>
            {lastTick ? (
              <div className="space-y-2 text-xs lg:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Quote:
                  </span>
                  <span className="font-mono text-green-600">
                    {lastTick.quote.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Last Digit:
                  </span>
                  <span className="font-mono text-blue-600">
                    {currentDigit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Time:
                  </span>
                  <span className="font-mono">
                    {new Date(lastTick.epoch * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Analysis Range:
                  </span>
                  <span className="font-mono">{analysisRange} ticks</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No tick data
              </div>
            )}
          </div>

          {/* Market Sequence */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm lg:text-base">
              {getMarketDisplayName(activeMarket)} Sequence
            </h3>
            {analysisData ? (
              <div className="bg-gray-100 dark:bg-gray-900 rounded p-3">
                <div className="font-mono text-sm lg:text-base text-center overflow-hidden">
                  <div className="whitespace-nowrap animate-pulse-slow">
                    {analysisData.sequence.slice(-15).map((char, index) => (
                      <span
                        key={index}
                        className={`inline-block mx-1 ${getSequenceColor(
                          char
                        )}`}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Last 15 of {analysisData.sequence.length} movements
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Calculating sequence...
              </div>
            )}
          </div>

          {/* Market Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base">
              Legend
            </h3>
            <div className="text-xs lg:text-sm space-y-1">
              {getLegendItems().map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className={`font-mono ${item.color}`}>{item.char}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
