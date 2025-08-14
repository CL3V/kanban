"use client";

import { useState, useEffect } from "react";

interface DatabaseStatus {
  status: "Connected" | "Disconnected" | "Loading";
  database?: string;
  error?: string;
  timestamp?: string;
}

export default function DatabaseStatusIndicator() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    status: "Loading",
  });
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkDatabaseStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/db-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      } else {
        setDbStatus({
          status: "Disconnected",
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      setDbStatus({
        status: "Disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    // Check immediately
    checkDatabaseStatus();

    // Then check every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (dbStatus.status) {
      case "Connected":
        return "bg-green-500";
      case "Disconnected":
        return "bg-red-500";
      case "Loading":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (dbStatus.status) {
      case "Connected":
        return "AWS DSQL Connected";
      case "Disconnected":
        return "Database Disconnected";
      case "Loading":
        return "Checking Connection...";
      default:
        return "Unknown Status";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[250px]">
        <div className="flex items-center gap-3">
          {/* Status Indicator Dot */}
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor()} ${
              dbStatus.status === "Loading" ? "animate-pulse" : ""
            }`}
          />

          {/* Status Text */}
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {getStatusText()}
            </div>

            {/* Database Info */}
            {dbStatus.database && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {dbStatus.database}
              </div>
            )}

            {/* Error Message */}
            {dbStatus.error && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Error: {dbStatus.error}
              </div>
            )}

            {/* Last Check Time */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last check: {lastCheck.toLocaleTimeString()}
            </div>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={checkDatabaseStatus}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
            title="Refresh status"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Detailed Status for Developers */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
              API: {process.env.NEXT_PUBLIC_API_URL}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
