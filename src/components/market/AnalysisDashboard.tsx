import React from "react";
import type { MarketType, TickData, MarketSetup } from "../../types/market";
import {
  useAnalysisData,
  getMarketDisplayName,
  getProbabilityColor,
  getProbabilityBgColor,
  getSequenceColor,
} from "./analysisLogic";

interface AnalysisDashboardProps {
  activeMarket: MarketType;
  tickData: TickData[];
  marketSetup: MarketSetup;
}

/**
 * Pure UI Component - Handles only presentation and rendering
 * All business logic is separated into analysisLogic.ts
 */
export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  activeMarket,
  tickData,
  marketSetup,
}) => {
  // Use the custom hook from analysisLogic.ts to get processed data
  const analysisData = useAnalysisData(tickData, marketSetup, activeMarket);

  // Get the current sequence for the active market
  const currentSequence = analysisData?.sequences[activeMarket] || [];

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-6">
      {/* Header - Fully responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 space-y-2 lg:space-y-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white text-center lg:text-left">
          Analysis - {getMarketDisplayName(activeMarket)}
        </h2>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center lg:text-right">
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
        <div className="flex-1 overflow-auto space-y-6 lg:space-y-8">
          {/* Probability Card Section */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Over/Under Market Card */}
              {marketSetup.contractType === "over_under" &&
                analysisData &&
                marketSetup.predictionDigit !== undefined && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                      Selected Prediction Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      {/* Over Probability Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          analysisData.probabilities.over[
                            marketSetup.predictionDigit
                          ]?.probability || 0
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Over {marketSetup.predictionDigit}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            analysisData.probabilities.over[
                              marketSetup.predictionDigit
                            ]?.probability || 0
                          )}`}
                        >
                          {analysisData.probabilities.over[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability that next digit is greater than{" "}
                          {marketSetup.predictionDigit}
                        </div>
                      </div>

                      {/* Under Probability Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          analysisData.probabilities.under[
                            marketSetup.predictionDigit
                          ]?.probability || 0
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Under {marketSetup.predictionDigit}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            analysisData.probabilities.under[
                              marketSetup.predictionDigit
                            ]?.probability || 0
                          )}`}
                        >
                          {analysisData.probabilities.under[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability that next digit is less than{" "}
                          {marketSetup.predictionDigit}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Matches/Differs Market Card */}
              {marketSetup.contractType === "matches_differs" &&
                analysisData &&
                marketSetup.predictionDigit !== undefined && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                      Selected Prediction Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      {/* Match Probability Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          analysisData.probabilities.matches[
                            marketSetup.predictionDigit
                          ]?.probability || 0
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Matches {marketSetup.predictionDigit}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            analysisData.probabilities.matches[
                              marketSetup.predictionDigit
                            ]?.probability || 0
                          )}`}
                        >
                          {analysisData.probabilities.matches[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability that next digit equals{" "}
                          {marketSetup.predictionDigit}
                        </div>
                      </div>

                      {/* Differ Probability Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          analysisData.probabilities.differs[
                            marketSetup.predictionDigit
                          ]?.probability || 0
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Differs from {marketSetup.predictionDigit}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            analysisData.probabilities.differs[
                              marketSetup.predictionDigit
                            ]?.probability || 0
                          )}`}
                        >
                          {analysisData.probabilities.differs[
                            marketSetup.predictionDigit
                          ]?.probability.toFixed(1) || "0.0"}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability that next digit differs from{" "}
                          {marketSetup.predictionDigit}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Even/Odd Market Card */}
              {marketSetup.contractType === "even_odd" &&
                analysisData &&
                marketSetup.predictionDigit !== undefined && (
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                      Selected Prediction Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      {/* Selected Prediction Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          marketSetup.predictionDigit === 0
                            ? analysisData.probabilities.even
                            : analysisData.probabilities.odd
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {marketSetup.predictionDigit === 0 ? "Even" : "Odd"}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            marketSetup.predictionDigit === 0
                              ? analysisData.probabilities.even
                              : analysisData.probabilities.odd
                          )}`}
                        >
                          {(marketSetup.predictionDigit === 0
                            ? analysisData.probabilities.even
                            : analysisData.probabilities.odd
                          ).toFixed(1)}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability of{" "}
                          {marketSetup.predictionDigit === 0 ? "Even" : "Odd"}{" "}
                          occurrence
                        </div>
                      </div>

                      {/* Opposite Prediction Card */}
                      <div
                        className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                          marketSetup.predictionDigit === 0
                            ? analysisData.probabilities.odd
                            : analysisData.probabilities.even
                        )}`}
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {marketSetup.predictionDigit === 0 ? "Odd" : "Even"}
                        </div>
                        <div
                          className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                            marketSetup.predictionDigit === 0
                              ? analysisData.probabilities.odd
                              : analysisData.probabilities.even
                          )}`}
                        >
                          {(marketSetup.predictionDigit === 0
                            ? analysisData.probabilities.odd
                            : analysisData.probabilities.even
                          ).toFixed(1)}
                          %
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Probability of{" "}
                          {marketSetup.predictionDigit === 0 ? "Odd" : "Even"}{" "}
                          occurrence
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Rise/Fall Market Card */}
              {marketSetup.contractType === "rise_fall" && analysisData && (
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center">
                    Price Movement Analysis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {/* Rise Probability Card */}
                    <div
                      className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                        analysisData.probabilities.rise
                      )}`}
                    >
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rise Probability
                      </div>
                      <div
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                          analysisData.probabilities.rise
                        )}`}
                      >
                        {analysisData.probabilities.rise.toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Next tick higher than current
                      </div>
                    </div>

                    {/* Fall Probability Card */}
                    <div
                      className={`p-4 sm:p-6 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${getProbabilityBgColor(
                        analysisData.probabilities.fall
                      )}`}
                    >
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fall Probability
                      </div>
                      <div
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getProbabilityColor(
                          analysisData.probabilities.fall
                        )}`}
                      >
                        {analysisData.probabilities.fall.toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Next tick lower than current
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Market Sequence Display */}
          {analysisData && currentSequence.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto w-full">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm lg:text-base text-center">
                {getMarketDisplayName(activeMarket)} Sequence
              </h3>
              <div className="bg-gray-100 dark:bg-gray-900 rounded p-3">
                <div className="font-mono text-sm lg:text-base text-center overflow-hidden">
                  <div className="whitespace-nowrap animate-pulse-slow">
                    {currentSequence.slice(-15).map((char, index) => (
                      <span
                        key={index}
                        className={`inline-block mx-1 ${getSequenceColor(
                          char,
                          activeMarket
                        )}`}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Last 15 of {currentSequence.length} movements
                </div>
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          {analysisData && (
            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Based on {analysisData.totalTicks} ticks analyzed • Range:{" "}
              {analysisData.analysisRange} ticks
            </div>
          )}
        </div>
      )}
    </div>
  );
};
