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

    return {
      digitProbabilities,
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

      {/* Current Selection Display */}
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
      )}

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 lg:p-6">
        {tickData.length > 0 ? (
          <div className="h-full flex flex-col justify-center">
            {/* Horizontal Digit Layout - Responsive */}
            <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 xl:gap-6 mb-6 lg:mb-8">
              {Array.from({ length: 10 }, (_, digit) => {
                const probability =
                  analysisData?.digitProbabilities[digit]?.probability || 0;
                const isActive = cursorPosition === digit;
                const isCurrent = currentDigit === digit;
                const isSelected = isSelectedDigit(digit);

                return (
                  <div
                    key={digit}
                    className="relative flex flex-col items-center"
                  >
                    {/* Circular Digit */}
                    <div
                      className={`
                        relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full border-2 flex items-center justify-center
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
                      {/* Digit */}
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                        {digit}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full" />
                      )}

                      {/* Cursor Indicator */}
                      {isActive && !isSelected && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full" />
                      )}
                    </div>

                    {/* Percentage Text */}
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {probability.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Digit and Price Display */}
            {lastTick && (
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current Last Digit
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                  {currentDigit}
                </div>

                {/* Current Price below Selected Digit */}
                {marketSetup.predictionDigit !== undefined && (
                  <div className="mt-4">
                    <div className="text-lg sm:text-xl text-blue-600 dark:text-blue-400 font-mono">
                      {lastTick.quote}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Current Price
                    </div>
                  </div>
                )}

                {marketSetup.predictionDigit !== undefined && (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
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
    </div>
  );
};
