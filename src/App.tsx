import React, { useState, useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { MarketSetupPanel } from "./components/market/MarketSetupPanel";
import { LiveMarketData } from "./components/market/LiveMarketData";
import { AnalysisDashboard } from "./components/market/AnalysisDashboard";
// import { ActivityLog } from "./components/market/ActivityLog";
import { useWebSocket } from "./hooks/useWebSocket";
import type { MarketType, VolatilityIndex, MarketSetup } from "./types/market";

const DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id=1089";

function App() {
  const [activeMarket, setActiveMarket] = useState<MarketType>("digits");
  const [volatilityIndex, setVolatilityIndex] =
    useState<VolatilityIndex>("vol50");
  const [marketSetup, setMarketSetup] = useState<MarketSetup>({
    contractType: "over_under",
    predictionDigit: 0,
    tickRange: 100,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    isConnected,
    isConnecting,
    messages,
    tickData,
    currentSymbol,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearMessages,
  } = useWebSocket(DERIV_WS_URL);

  const handleConnect = () => {
    console.log("Connect button clicked, current state:", {
      isConnected,
      isConnecting,
    });
    if (!isConnected && !isConnecting) {
      connect();
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnect button clicked");
    if (isConnected) {
      setIsAnalyzing(false);
      unsubscribe();
      disconnect();
    }
  };

  const handleStartAnalysis = () => {
    console.log("Start Analysis clicked", { isConnected, isAnalyzing });
    if (isConnected && !isAnalyzing) {
      console.log("Subscribing to:", volatilityIndex);
      subscribe(volatilityIndex);
      setIsAnalyzing(true);
    } else {
      console.log("Cannot start analysis - conditions:", {
        isConnected,
        isAnalyzing,
      });
    }
  };

  const handleStopAnalysis = () => {
    console.log("Stop Analysis clicked");
    if (isAnalyzing) {
      unsubscribe();
      setIsAnalyzing(false);
    }
  };

  const handleVolatilityChange = (newVolatility: VolatilityIndex) => {
    console.log("Volatility changed to:", newVolatility);
    setVolatilityIndex(newVolatility);
    if (isAnalyzing && isConnected) {
      console.log("Resubscribing with new volatility:", newVolatility);
      subscribe(newVolatility);
    }
  };

  // Handle market change from header - sync with marketSetup
  const handleMarketChange = (market: MarketType) => {
    setActiveMarket(market);
    // Update marketSetup to match the selected market
    setMarketSetup((prev) => ({
      ...prev,
      contractType: market as any, // Use 'as any' since MarketType and ContractType should align
      // Reset prediction digit when market changes to appropriate default
      predictionDigit:
        market === "even_odd"
          ? 0
          : market === "over_under" || market === "matches_differs"
          ? 0
          : undefined,
    }));
  };

  // Auto-connect on component mount
  useEffect(() => {
    console.log("App mounted, auto-connecting...");
    handleConnect(); // Auto-connect on load

    return () => {
      console.log("App unmounting, cleaning up...");
      handleDisconnect();
    };
  }, []);

  // Debug effect to log connection state changes
  useEffect(() => {
    console.log("Connection state changed:", {
      isConnected,
      isConnecting,
      isAnalyzing,
    });
  }, [isConnected, isConnecting, isAnalyzing]);

  // Sync activeMarket with marketSetup.contractType when marketSetup changes from panel
  useEffect(() => {
    if (marketSetup.contractType !== activeMarket) {
      setActiveMarket(marketSetup.contractType as MarketType);
    }
  }, [marketSetup.contractType]);

  return (
    <Layout
      activeMarket={activeMarket}
      volatilityIndex={volatilityIndex}
      isConnected={isConnected}
      isConnecting={isConnecting}
      onMarketChange={handleMarketChange}
      onVolatilityChange={handleVolatilityChange}
    >
      {/* Mobile-first responsive layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Market Setup Panel - Top on mobile, Sidebar on desktop */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-b lg:border-r border-gray-200 dark:border-gray-700">
          <MarketSetupPanel
            marketSetup={marketSetup}
            isConnected={isConnected}
            isConnecting={isConnecting}
            isAnalyzing={isAnalyzing}
            onMarketSetupChange={setMarketSetup}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onStartAnalysis={handleStartAnalysis}
            onStopAnalysis={handleStopAnalysis}
            volatilityIndex={volatilityIndex}
            onVolatilityChange={handleVolatilityChange}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Live Market Data - Top Section */}
          <div className="flex-1 min-h-0 bg-white dark:bg-gray-800">
            <LiveMarketData
              tickData={tickData}
              volatilityIndex={volatilityIndex}
              currentSymbol={currentSymbol}
              activeMarket={activeMarket}
              marketSetup={marketSetup}
            />
          </div>

          {/* Analysis Dashboard - Bottom Section */}
          <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <AnalysisDashboard
              activeMarket={activeMarket}
              tickData={tickData}
              marketSetup={marketSetup}
            />
          </div>
        </div>
      </div>

      {/* Activity Log - Bottom Panel (commented out) */}
      {/* <div className="h-48 lg:h-64 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <ActivityLog messages={messages} onClearMessages={clearMessages} />
      </div> */}
    </Layout>
  );
}

export default App;
