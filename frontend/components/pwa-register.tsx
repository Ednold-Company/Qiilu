"use client";

import { useEffect } from "react";
import { useState } from "react";

export function PwaRegister() {
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => {
          if ("caches" in window) {
            return caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
          }

          return undefined;
        })
        .catch(() => undefined);
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          setUpdateMessage("Updating Qiilu for the latest fixes...");

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              installingWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch {
        // Keep registration failures silent in the UI.
      }
    };

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) {
        return;
      }

      refreshing = true;
      setUpdateMessage("Qiilu has been updated. Reloading...");
      window.location.reload();
    });

    void register();
  }, []);

  if (!updateMessage) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[9999] rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">
      {updateMessage}
    </div>
  );
}
