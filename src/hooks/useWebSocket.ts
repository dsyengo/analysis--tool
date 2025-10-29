import { useState, useEffect, useRef, useCallback } from "react";
import type {
  WebSocketMessage,
  TickData,
  VolatilityIndex,
} from "../types/market";
import { getSymbolForVolatility } from "../utils/derivConfig";

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [tickData, setTickData] = useState<TickData[]>([]);
  const [currentSymbol, setCurrentSymbol] = useState<string>("");
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((message: WebSocketMessage) => {
    setMessages((prev) => [...prev, message].slice(-100));
  }, []);

  const connect = useCallback(() => {
    if (isConnected || isConnecting) {
      console.log("Already connected or connecting, skipping...");
      return;
    }

    console.log("Connecting to WebSocket...");
    setIsConnecting(true);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        addMessage({
          type: "connection",
          data: "Connected to Deriv WebSocket",
          timestamp: Date.now(),
        });
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setCurrentSymbol("");
        addMessage({
          type: "connection",
          data: `Disconnected from Deriv WebSocket: ${event.code} ${
            event.reason || ""
          }`,
          timestamp: Date.now(),
        });

        // Auto-reconnect after 3 seconds if not a normal closure
        if (event.code !== 1000) {
          reconnectTimeout.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        addMessage({
          type: "error",
          data: "WebSocket connection error",
          timestamp: Date.now(),
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data.msg_type);

          if (data.msg_type === "tick") {
            const tick: TickData = {
              id: data.tick.id,
              epoch: data.tick.epoch,
              quote: data.tick.quote,
              symbol: data.tick.symbol,
            };
            setTickData((prev) => {
              const newData = [...prev, tick];
              // Keep last 200 ticks for performance
              return newData.slice(-200);
            });
            addMessage({
              type: "tick",
              data: `Tick: ${tick.symbol} - ${tick.quote}`,
              timestamp: Date.now(),
            });
          } else if (data.msg_type === "error") {
            console.error("API Error:", data.error);
            addMessage({
              type: "error",
              data: `API Error: ${data.error?.message || "Unknown error"}`,
              timestamp: Date.now(),
            });
          } else if (data.msg_type === "subscribe") {
            console.log("Subscription confirmed:", data);
            addMessage({
              type: "subscription",
              data: `Subscription confirmed for ${
                data.subscription?.symbols?.[0] || "unknown"
              }`,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Message parse error:", error);
          addMessage({
            type: "error",
            data: `Message parse error: ${error}`,
            timestamp: Date.now(),
          });
        }
      };
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnecting(false);
      addMessage({
        type: "error",
        data: `Connection failed: ${error}`,
        timestamp: Date.now(),
      });
    }
  }, [url, isConnected, isConnecting, addMessage]);

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebSocket...");

    // Clear any pending reconnection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    if (ws.current) {
      // First unsubscribe from current symbol
      if (currentSymbol) {
        const unsubscribeMsg = {
          forget: currentSymbol,
          unsubscribe: 1,
        };
        ws.current.send(JSON.stringify(unsubscribeMsg));
        addMessage({
          type: "subscription",
          data: `Unsubscribed from ${currentSymbol}`,
          timestamp: Date.now(),
        });
      }

      // Then close the connection
      ws.current.close(1000, "User initiated disconnect");
      ws.current = null;
    }

    setIsConnected(false);
    setCurrentSymbol("");
    setTickData([]);
  }, [currentSymbol, addMessage]);

  const subscribe = useCallback(
    (volatility: VolatilityIndex) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected, cannot subscribe");
        addMessage({
          type: "error",
          data: "WebSocket not connected, cannot subscribe",
          timestamp: Date.now(),
        });
        return;
      }

      const symbol = getSymbolForVolatility(volatility);
      console.log("Subscribing to symbol:", symbol);

      // Unsubscribe from current symbol first if different
      if (currentSymbol && currentSymbol !== symbol) {
        const unsubscribeMsg = {
          forget: currentSymbol,
          unsubscribe: 1,
        };
        ws.current.send(JSON.stringify(unsubscribeMsg));
        addMessage({
          type: "subscription",
          data: `Unsubscribed from ${currentSymbol}`,
          timestamp: Date.now(),
        });
      }

      // Subscribe to new symbol
      const subscribeMsg = {
        ticks: symbol,
        subscribe: 1,
      };

      try {
        ws.current.send(JSON.stringify(subscribeMsg));
        setCurrentSymbol(symbol);

        addMessage({
          type: "subscription",
          data: `Subscribed to ${symbol} (${volatility})`,
          timestamp: Date.now(),
        });

        // Clear previous tick data for the new symbol
        setTickData([]);
      } catch (error) {
        console.error("Failed to send subscribe message:", error);
        addMessage({
          type: "error",
          data: `Failed to subscribe: ${error}`,
          timestamp: Date.now(),
        });
      }
    },
    [currentSymbol, addMessage]
  );

  const unsubscribe = useCallback(() => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      currentSymbol
    ) {
      console.log("Unsubscribing from symbol:", currentSymbol);
      const unsubscribeMsg = {
        forget: currentSymbol,
        unsubscribe: 1,
      };
      ws.current.send(JSON.stringify(unsubscribeMsg));
      addMessage({
        type: "subscription",
        data: `Unsubscribed from ${currentSymbol}`,
        timestamp: Date.now(),
      });
      setCurrentSymbol("");
      setTickData([]);
    }
  }, [currentSymbol, addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close(1000, "Component unmounted");
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    messages,
    tickData,
    currentSymbol,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearMessages: () => setMessages([]),
  };
};
