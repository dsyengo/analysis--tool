import React, { useState, useEffect } from "react";
import { Play, Square, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tickRange, setTickRange] = useState(100);

  // Auto-connect on component mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      onConnect();
    }
  }, []);

  const handleInputChange = (field: keyof MarketSetup, value: any) => {
    onMarketSetupChange({
      ...marketSetup,
      [field]: value,
    });
  };

  const handleAnalysisToggle = () => {
    if (isAnalyzing) {
      onStopAnalysis();
    } else {
      onStartAnalysis();
    }
  };

  const handleDigitSelect = (digit: number) => {
    handleInputChange("predictionDigit", digit);
  };

  const handleTickRangeChange = (value: number) => {
    const validatedValue = Math.min(1000, Math.max(0, value));
    setTickRange(validatedValue);
    handleInputChange("tickRange", validatedValue);
  };

  const handleVolatilityChange = (volatility: VolatilityIndex) => {
    onVolatilityChange(volatility);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Mobile Header - Collapsible */}
      <div className="lg:hidden border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? isAnalyzing
                    ? "bg-green-500"
                    : "bg-blue-500"
                  : "bg-gray-400"
              }`}
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analysis Parameters
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected
                  ? isAnalyzing
                    ? "Analyzing..."
                    : "Connected"
                  : "Disconnected"}
              </p>
            </div>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Panel Content */}
      <div
        className={`flex-1 overflow-y-auto ${
          isCollapsed ? "hidden lg:block" : "block"
        }`}
      >
        <div className="p-4 lg:p-6">
          {/* Desktop-only title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 hidden lg:block">
            Analysis Parameters
          </h2>

          <div className="space-y-4 lg:space-y-6">
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
                className="w-full px-3 py-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
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
                className="w-full px-3 py-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
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
                Analysis Tick Range (0-1000)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={tickRange}
                onChange={(e) =>
                  handleTickRangeChange(parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
                placeholder="Enter tick range (0-1000)"
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of recent ticks to analyze
              </div>
            </div>

            {/* Digit Selection for Over/Under and Matches/Differs - Radio Buttons */}
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
                    <label
                      key={digit}
                      className={`aspect-square rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        marketSetup.predictionDigit === digit
                          ? "bg-blue-500 border-blue-600 text-white shadow-lg scale-105"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="predictionDigit"
                        value={digit}
                        checked={marketSetup.predictionDigit === digit}
                        onChange={() => handleDigitSelect(digit)}
                        className="sr-only" // Hide the actual radio input
                      />
                      {digit}
                    </label>
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

            {/* Even/Odd Selection - Radio Buttons */}
            {marketSetup.contractType === "even_odd" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Prediction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      marketSetup.predictionDigit === 0
                        ? "bg-green-500 border-green-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="evenOdd"
                      value="0"
                      checked={marketSetup.predictionDigit === 0}
                      onChange={() => handleInputChange("predictionDigit", 0)}
                      className="sr-only"
                    />
                    Even
                  </label>
                  <label
                    className={`p-4 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                      marketSetup.predictionDigit === 1
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="evenOdd"
                      value="1"
                      checked={marketSetup.predictionDigit === 1}
                      onChange={() => handleInputChange("predictionDigit", 1)}
                      className="sr-only"
                    />
                    Odd
                  </label>
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
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm"
                />
              </div>
            )}
          </div>

          {/* Analysis Control Buttons */}
          <div className="space-y-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAnalysisToggle}
              disabled={!isConnected}
              className={`w-full flex items-center justify-center px-4 py-4 lg:py-3 rounded-lg font-medium transition-all duration-200 text-base lg:text-sm ${
                isAnalyzing
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Square className="w-5 h-5 lg:w-4 lg:h-4 mr-2" />
                  Stop Analysis
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 lg:w-4 lg:h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
