"use client";

import { env } from "@/env";
import { useLogger } from "@logtail/next";

const ButtonFetcher = () => {
  const log = useLogger();

  const FetchInfoLog = () => {
    try {
      try {
        fetch("/api/logging", { method: "GET" }).catch((error) => {
          console.error("Error calling logging API:", error);
        });
      } catch (error) {
        console.error("Error in GET request:", error);
      }
    } catch (error) {
      console.error("Error sending log to Logtail:", error);
    } finally {
      console.log("Info log sent to Logtail");
    }
  };

  return (
    <button
      className="cursor-pointer rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      onClick={FetchInfoLog}
    >
      Fetch Info Log
    </button>
  );
};

export default ButtonFetcher;
