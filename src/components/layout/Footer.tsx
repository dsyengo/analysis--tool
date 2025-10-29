import React from "react";
import { ExternalLink, Github } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left Section - Version & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <span>Version 1.0.0</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center justify-center sm:justify-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Real-time Data
            </span>
          </div>

          {/* Center Section - Disclaimer */}
          <div className="text-center lg:text-left">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This is a third-party analysis tool and is not affiliated with
              Deriv
            </div>
          </div>

          {/* Right Section - Links */}
          <div className="flex items-center justify-center lg:justify-end space-x-4">
            <a
              href="https://deriv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Deriv API</span>
            </a>

            <a
              href="https://github.com/your-repo/deriv-analysis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Documentation</span>
            </a>
          </div>
        </div>

        {/* Mobile-only additional info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Optimized for real-time market analysis</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
