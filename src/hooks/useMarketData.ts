import { useState, useCallback, useRef } from "react";
import { TickData } from "../types/market";

export const useMarketData = () => {
  const [tickData, setTickData] = useState<TickData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const dataBuffer = useRef<TickData[]>([]);

  const addTick = useCallback(
    (tick: TickData) => {
      const newTick = {
        ...tick,
        id: `${tick.symbol}_${tick.epoch}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      setTickData((prev) => {
        const newData = [...prev, newTick];
        // Keep last 1000 ticks for performance
        return newData.slice(-1000);
      });

      if (isRecording) {
        dataBuffer.current.push(newTick);
      }
    },
    [isRecording]
  );

  const startRecording = useCallback(() => {
    dataBuffer.current = [];
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    return [...dataBuffer.current];
  }, []);

  const clearData = useCallback(() => {
    setTickData([]);
    dataBuffer.current = [];
  }, []);

  const getRecentTicks = useCallback(
    (count: number) => {
      return tickData.slice(-count);
    },
    [tickData]
  );

  const getTicksByTimeRange = useCallback(
    (startTime: number, endTime: number) => {
      return tickData.filter(
        (tick) => tick.epoch >= startTime && tick.epoch <= endTime
      );
    },
    [tickData]
  );

  const getDigitStatistics = useCallback(() => {
    if (tickData.length === 0) return null;

    const digits = tickData.map((tick) => Math.floor((tick.quote * 100) % 10));

    const frequency = digits.reduce((acc, digit) => {
      acc[digit] = (acc[digit] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const percentage = Object.fromEntries(
      Object.entries(frequency).map(([digit, count]) => [
        digit,
        (count / digits.length) * 100,
      ])
    );

    return {
      frequency,
      percentage,
      total: digits.length,
      mostFrequent: Object.entries(frequency).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0],
      leastFrequent: Object.entries(frequency).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )[0],
    };
  }, [tickData]);

  const getVolatility = useCallback(
    (period: number = 50) => {
      if (tickData.length < period) return 0;

      const recentTicks = tickData.slice(-period);
      const quotes = recentTicks.map((t) => t.quote);
      const average = quotes.reduce((sum, q) => sum + q, 0) / quotes.length;

      const variance =
        quotes.reduce((sum, q) => sum + Math.pow(q - average, 2), 0) /
        quotes.length;
      return Math.sqrt(variance);
    },
    [tickData]
  );

  return {
    tickData,
    isRecording,
    addTick,
    startRecording,
    stopRecording,
    clearData,
    getRecentTicks,
    getTicksByTimeRange,
    getDigitStatistics,
    getVolatility,
  };
};
