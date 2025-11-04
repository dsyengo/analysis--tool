import React, { useState, useEffect } from "react";
import { Play, Square, ChevronDown, ChevronUp, Settings } from "lucide-react";
import type {
  MarketSetup,
  ContractType,
  VolatilityIndex,
} from "../../types/market";
import { VOLATILITY_SYMBOLS } from "../../utils/derivConfig";

interface MarketSetupPanelProps {
  marketSetup: MarketSetup;
  isConnected: boolean;
  isConnecting: boolean;
  isAnalyzing: boolean;
  onMarketSetupChange: (setup: MarketSetup) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartAnalysis: () => void;
  onStopAnalysis: () => void;
  volatilityIndex: VolatilityIndex;
  onVolatilityChange: (volatility: VolatilityIndex) => void;
}

const CONTRACT_TYPES = [
  { id: "over_under" as ContractType, label: "Over/Under" },
  { id: "matches_differs" as ContractType, label: "Matches/Differs" },
  { id: "rise_fall" as ContractType, label: "Rise/Fall" },
  { id: "even_odd" as ContractType, label: "Even/Odd" },
];

const VOLATILITY_OPTIONS = Object.entries(VOLATILITY_SYMBOLS).map(
  ([key, value]) => ({
    id: key as VolatilityIndex,
    label: value.displayName,
    frequency: value.tickFrequency,
  })
);

export const MarketSetupPanel: React.FC<MarketSetupPanelProps> = ({
  marketSetup,
  isConnected,
  isConnecting,
  isAnalyzing,
  onMarketSetupChange,
  onConnect,
  onDisconnect,
  onStartAnalysis,
  onStopAnalysis,
  volatilityIndex,
  onVolatilityChange,
}) => {
  // Auto-connect and start analysis when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      console.log("Auto-connecting on component mount...");
      onConnect();
    }
  }, []);

  // Auto-start analysis when connection is established and not already analyzing
  useEffect(() => {
    if (isConnected && !isAnalyzing && !isConnecting) {
      console.log("Auto-starting analysis after connection...");
      onStartAnalysis();
    }
  }, [isConnected, isAnalyzing, isConnecting]);

  // Handle market changes - restart analysis with new market
  useEffect(() => {
    if (isAnalyzing && isConnected) {
      console.log("Market changed - restarting analysis with new market...");
      // Stop current analysis
      onStopAnalysis();
      // Small delay to ensure clean stop before restart
      const timer = setTimeout(() => {
        onStartAnalysis();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [marketSetup.contractType, volatilityIndex]);

  const handleInputChange = (field: keyof MarketSetup, value: any) => {
    onMarketSetupChange({
      ...marketSetup,
      [field]: value,
    });
  };

  const handleAnalysisToggle = () => {
    if (isAnalyzing) {
      console.log("Manually stopping analysis...");
      onStopAnalysis();
    } else {
      console.log("Manually starting analysis...");
      onStartAnalysis();
    }
  };

  const handleDigitSelect = (digit: number) => {
    handleInputChange("predictionDigit", digit);
  };

  const handleTickRangeChange = (value: number) => {
    // Fixed: Proper validation for 1-1000 range
    const validatedValue = Math.min(1000, Math.max(1, value));
    handleInputChange("tickRange", validatedValue);
  };

  const handleVolatilityChange = (volatility: VolatilityIndex) => {
    onVolatilityChange(volatility);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:w-80 lg:z-30">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="w-full px-4 py-4 flex items-center justify-between text-left">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Market Setup
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected
                  ? isAnalyzing
                    ? "Analyzing..."
                    : "Connected"
                  : "Connecting..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Content - Always visible on both mobile and desktop */}
      <div className="flex-1">
        <div className="p-4 lg:p-6 h-full flex flex-col w-full">
          {/* Desktop-only title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 hidden lg:block">
            Market Setup
          </h2>

          <div className="space-y-4 lg:space-y-6 flex-1 overflow-y-auto">
            {/* Volatility Selection - Select Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Volatility Index
              </label>
              <select
                value={volatilityIndex}
                onChange={(e) =>
                  handleVolatilityChange(e.target.value as VolatilityIndex)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {VOLATILITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.frequency})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose volatility instrument and frequency
              </div>
            </div>

            {/* Market Type Selection - Select Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market Type
              </label>
              <select
                value={marketSetup.contractType}
                onChange={(e) =>
                  handleInputChange("contractType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {CONTRACT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select the type of market analysis
              </div>
            </div>

            {/* Tick Range Input - Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Tick Range (1-1000)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={marketSetup.tickRange}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleTickRangeChange(value);
                }}
                onBlur={(e) => {
                  // Ensure value is within range when input loses focus
                  const value = parseInt(e.target.value) || 1;
                  const validatedValue = Math.min(1000, Math.max(1, value));
                  if (value !== validatedValue) {
                    handleTickRangeChange(validatedValue);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter tick range (1-1000)"
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of recent ticks to analyze (minimum: 1, maximum: 1000)
              </div>
            </div>

            {/* Digit Selection for Over/Under and Matches/Differs */}
            {(marketSetup.contractType === "over_under" ||
              marketSetup.contractType === "matches_differs") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {marketSetup.contractType === "over_under"
                    ? "Select Prediction Digit"
                    : "Select Match Digit"}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, digit) => (
                    <button
                      key={digit}
                      onClick={() => handleDigitSelect(digit)}
                      className={`aspect-square rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center ${
                        marketSetup.predictionDigit === digit
                          ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                {marketSetup.predictionDigit !== undefined && (
                  <div className="mt-2 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Selected:{" "}
                      <strong className="text-blue-600 dark:text-blue-400">
                        Digit {marketSetup.predictionDigit}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Even/Odd Selection */}
            {marketSetup.contractType === "even_odd" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Prediction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleInputChange("predictionDigit", 0)}
                    className={`p-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                      marketSetup.predictionDigit === 0
                        ? "bg-green-500 border-green-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    Even
                  </button>
                  <button
                    onClick={() => handleInputChange("predictionDigit", 1)}
                    className={`p-4 rounded-lg border-2 font-semibold transition-all duration-200 ${
                      marketSetup.predictionDigit === 1
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    Odd
                  </button>
                </div>
              </div>
            )}

            {/* Barrier Offset for Rise/Fall */}
            {marketSetup.contractType === "rise_fall" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barrier Offset
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={marketSetup.barrierOffset || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "barrierOffset",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}
          </div>

          {/* Analysis Control Buttons */}
          <div className="space-y-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAnalysisToggle}
              disabled={!isConnected}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                isAnalyzing
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Analysis
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </button>

            {/* Auto-analysis Status */}
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              {isConnected && isAnalyzing ? (
                <span className="text-green-600">✓ Auto-analysis running</span>
              ) : isConnected ? (
                <span className="text-blue-600">
                  Connected - Ready to analyze
                </span>
              ) : (
                <span className="text-yellow-600">Connecting...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
