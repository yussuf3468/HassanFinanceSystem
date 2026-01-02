import { useState, useEffect } from "react";
import { X, Share, Plus, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissedIOS = localStorage.getItem("pwa-ios-prompt-dismissed");
    const dismissedAndroid = localStorage.getItem(
      "pwa-android-prompt-dismissed"
    );
    const lastDismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");

    // Reset dismissal after 30 days
    if (lastDismissedTime) {
      const daysSinceDismissed =
        (Date.now() - parseInt(lastDismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed > 30) {
        localStorage.removeItem("pwa-ios-prompt-dismissed");
        localStorage.removeItem("pwa-android-prompt-dismissed");
        localStorage.removeItem("pwa-prompt-dismissed-time");
      }
    }

    // Detect iOS devices
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    const isInStandaloneMode =
      ("standalone" in window.navigator &&
        (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    // Show iOS prompt if conditions are met
    if (isIOS && isSafari && !isInStandaloneMode && dismissedIOS !== "true") {
      // Delay showing the prompt for better UX
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Desktop Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      if (dismissedAndroid !== "true") {
        // Delay showing the prompt
        setTimeout(() => {
          setShowAndroidPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleIOSDismiss = () => {
    setShowIOSPrompt(false);
    localStorage.setItem("pwa-ios-prompt-dismissed", "true");
    localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
  };

  const handleAndroidDismiss = () => {
    setShowAndroidPrompt(false);
    localStorage.setItem("pwa-android-prompt-dismissed", "true");
    localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
      localStorage.setItem("pwa-android-prompt-dismissed", "true");
      localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  // iOS Install Banner
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slideUp">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 shadow-2xl border-t-4 border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
          <div className="max-w-screen-xl mx-auto flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl">
              <Plus className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">Install Hassan Bookshop App</h3>
              <p className="text-sm text-blue-100 mb-3">
                Install this app on your iPhone for quick access and better
                experience.
              </p>

              {/* Instructions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 mb-3 border border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">1.</span>
                  <span>Tap the</span>
                  <Share className="w-4 h-4 inline" />
                  <span className="font-bold">Share</span>
                  <span>button below</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className="font-semibold">2.</span>
                  <span>Select</span>
                  <Plus className="w-4 h-4 inline" />
                  <span className="font-bold">'Add to Home Screen'</span>
                </div>
              </div>

              {/* Browser hint */}
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <Share className="w-3 h-3" />
                <span>Look for the Share icon in Safari's toolbar</span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleIOSDismiss}
              className="flex-shrink-0 p-2 hover:bg-gradient-to-br hover:from-amber-50 hover:to-white rounded-xl transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Chrome Install Banner
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slideUp">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-400/30 p-4 shadow-2xl border-t-4 border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
          <div className="max-w-screen-xl mx-auto flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl">
              <Download className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">Install Hassan Bookshop App</h3>
              <p className="text-sm text-green-100 mb-3">
                Install our app for quick access, offline support, and a better
                experience!
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAndroidInstall}
                  className="px-4 py-2 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-lg shadow-amber-300/10"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Install Now
                </button>
                <button
                  onClick={handleAndroidDismiss}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors font-medium"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleAndroidDismiss}
              className="flex-shrink-0 p-2 hover:bg-gradient-to-br hover:from-amber-50 hover:to-white rounded-xl transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
