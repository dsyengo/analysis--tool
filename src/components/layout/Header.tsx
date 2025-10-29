import React, { useState } from "react";
import { Sun, Moon, Wifi, WifiOff, Loader, Menu, X } from "lucide-react";
import type { MarketType, VolatilityIndex } from "../../types/market";
import { VOLATILITY_SYMBOLS } from "../../utils/derivConfig";

interface HeaderProps {
  activeMarket: MarketType;
  volatilityIndex: VolatilityIndex;
  isConnected: boolean;
  isConnecting: boolean;
  onMarketChange: (market: MarketType) => void;
  onVolatilityChange: (volatility: VolatilityIndex) => void;
}

const MARKET_TYPES = [
  { id: "digits" as MarketType, label: "Digits" },
  { id: "rise_fall" as MarketType, label: "Rise/Fall" },
  { id: "matches_differs" as MarketType, label: "Matches/Differs" },
  { id: "even_odd" as MarketType, label: "Even/Odd" },
];

const VOLATILITY_OPTIONS = Object.entries(VOLATILITY_SYMBOLS).map(
  ([key, value]) => ({
    id: key as VolatilityIndex,
    label: value.displayName,
    frequency: value.tickFrequency,
  })
);

export const Header: React.FC<HeaderProps> = ({
  activeMarket,
  volatilityIndex,
  isConnected,
  isConnecting,
  onMarketChange,
  onVolatilityChange,
}) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const connectionStatus = isConnecting
    ? "Connecting..."
    : isConnected
    ? "Connected"
    : "Disconnected";
  const connectionColor = isConnecting
    ? "text-yellow-600"
    : isConnected
    ? "text-green-600"
    : "text-red-600";
  const ConnectionIcon = isConnecting ? Loader : isConnected ? Wifi : WifiOff;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              {/* Branding */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Deriv Analysis Pro
                </h1>
              </div>

              {/* Market Selector */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {MARKET_TYPES.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => onMarketChange(market.id)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeMarket === market.id
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {market.label}
                  </button>
                ))}
              </div>

              {/* Volatility Index Dropdown */}
              <select
                value={volatilityIndex}
                onChange={(e) =>
                  onVolatilityChange(e.target.value as VolatilityIndex)
                }
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
              >
                {VOLATILITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.frequency})
                  </option>
                ))}
              </select>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <ConnectionIcon
                  className={`w-4 h-4 ${connectionColor} ${
                    isConnecting ? "animate-spin" : ""
                  }`}
                />
                <span
                  className={`text-sm font-medium ${connectionColor} hidden sm:inline`}
                >
                  {connectionStatus}
                </span>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Deriv Analysis
                </h1>
                <div className="flex items-center space-x-2">
                  <ConnectionIcon
                    className={`w-3 h-3 ${connectionColor} ${
                      isConnecting ? "animate-spin" : ""
                    }`}
                  />
                  <span className={`text-xs font-medium ${connectionColor}`}>
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="mt-4 pb-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Market Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Market Type
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {MARKET_TYPES.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => {
                        onMarketChange(market.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                        activeMarket === market.id
                          ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {market.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volatility Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volatility Index
                </label>
                <select
                  value={volatilityIndex}
                  onChange={(e) => {
                    onVolatilityChange(e.target.value as VolatilityIndex);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {VOLATILITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
