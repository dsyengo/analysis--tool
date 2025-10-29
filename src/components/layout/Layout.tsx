import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { MarketType, VolatilityIndex } from "../../types/market";

interface LayoutProps {
  children: React.ReactNode;
  activeMarket: MarketType;
  volatilityIndex: VolatilityIndex;
  isConnected: boolean;
  isConnecting: boolean;
  onMarketChange: (market: MarketType) => void;
  onVolatilityChange: (volatility: VolatilityIndex) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeMarket,
  volatilityIndex,
  isConnected,
  isConnecting,
  onMarketChange,
  onVolatilityChange,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <Header
        activeMarket={activeMarket}
        volatilityIndex={volatilityIndex}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onMarketChange={onMarketChange}
        onVolatilityChange={onVolatilityChange}
      />

      {/* Main content area with proper mobile spacing */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </main>

      <Footer />
    </div>
  );
};
