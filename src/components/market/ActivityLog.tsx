import React, { useState, useRef, useEffect } from "react";
import { Trash2, Play, Pause, Filter } from "lucide-react";
import type { WebSocketMessage } from "../../types/market";

interface ActivityLogProps {
  messages: WebSocketMessage[];
  onClearMessages: () => void;
}

type LogFilter = "all" | "tick" | "subscription" | "error" | "connection";

export const ActivityLog: React.FC<ActivityLogProps> = ({
  messages,
  onClearMessages,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<LogFilter>("all");
  const logEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(
    (message) => filter === "all" || message.type === filter
  );

  const getMessageColor = (type: WebSocketMessage["type"]) => {
    switch (type) {
      case "tick":
        return "text-green-600 dark:text-green-400";
      case "subscription":
        return "text-blue-600 dark:text-blue-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "connection":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getMessageIcon = (type: WebSocketMessage["type"]) => {
    switch (type) {
      case "tick":
        return "●";
      case "subscription":
        return "↔";
      case "error":
        return "⚠";
      case "connection":
        return "🔗";
      default:
        return "·";
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages, isPaused]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Event Logs
        </h3>

        <div className="flex items-center space-x-2">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogFilter)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="all">All Events</option>
            <option value="tick">Ticks</option>
            <option value="subscription">Subscriptions</option>
            <option value="error">Errors</option>
            <option value="connection">Connection</option>
          </select>

          {/* Pause/Resume Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearMessages}
            className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 font-mono text-sm">
          {filteredMessages.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              No logs to display
            </div>
          ) : (
            filteredMessages.map((message, index) => (
              <div key={index} className="flex items-start space-x-3 py-1">
                <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-medium ${getMessageColor(message.type)}`}
                >
                  {getMessageIcon(message.type)}
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300">
                  {typeof message.data === "string"
                    ? message.data
                    : JSON.stringify(message.data)}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredMessages.length} of {messages.length} total messages
        {isPaused && " • Auto-scroll paused"}
      </div>
    </div>
  );
};
