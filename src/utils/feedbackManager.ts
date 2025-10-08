// Haptic and Audio Feedback Utility for Enhanced UX

interface FeedbackOptions {
  enableSound?: boolean;
  enableVibration?: boolean;
  soundVolume?: number;
  vibrationType?:
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "error"
    | "warning";
}

class FeedbackManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private vibrationEnabled = true;

  constructor() {
    // Initialize audio context on user interaction
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      // Create audio context only when needed to avoid autoplay restrictions
      if (!this.audioContext && typeof window !== "undefined") {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
    } catch (error) {
      console.warn("Audio context not supported:", error);
      this.soundEnabled = false;
    }
  }

  // Generate different types of notification sounds
  private async playSound(
    frequency: number,
    duration: number,
    volume: number = 0.1
  ) {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (mobile browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = "sine";

      // Create a smooth envelope for the sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn("Sound playback failed:", error);
    }
  }

  // Play success sound (pleasant chime)
  async playSuccessSound(volume: number = 0.1) {
    if (!this.soundEnabled) return;

    // Pleasant success chord progression
    setTimeout(() => this.playSound(523.25, 0.1, volume * 0.8), 0); // C5
    setTimeout(() => this.playSound(659.25, 0.1, volume * 0.6), 50); // E5
    setTimeout(() => this.playSound(783.99, 0.15, volume), 100); // G5
  }

  // Play error sound (gentle warning)
  async playErrorSound(volume: number = 0.1) {
    if (!this.soundEnabled) return;

    // Gentle error sound (not harsh)
    setTimeout(() => this.playSound(349.23, 0.1, volume), 0); // F4
    setTimeout(() => this.playSound(293.66, 0.15, volume), 80); // D4
  }

  // Play warning sound
  async playWarningSound(volume: number = 0.1) {
    if (!this.soundEnabled) return;

    // Double beep for warning
    setTimeout(() => this.playSound(440, 0.1, volume), 0);
    setTimeout(() => this.playSound(440, 0.1, volume), 150);
  }

  // Play info sound (subtle notification)
  async playInfoSound(volume: number = 0.1) {
    if (!this.soundEnabled) return;

    // Subtle single tone
    this.playSound(523.25, 0.12, volume * 0.7); // C5
  }

  // Trigger vibration patterns
  triggerVibration(type: FeedbackOptions["vibrationType"] = "light") {
    if (!this.vibrationEnabled || !navigator.vibrate) return;

    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200],
      success: [50, 50, 100], // Short-Short-Long
      error: [100, 50, 100], // Long-Short-Long
      warning: [80, 40, 80, 40, 80], // Triple pulse
    };

    try {
      navigator.vibrate(patterns[type] || patterns.light);
    } catch (error) {
      console.warn("Vibration not supported:", error);
    }
  }

  // Combined feedback for different toast types
  async triggerFeedback(
    type: "success" | "error" | "warning" | "info",
    options: FeedbackOptions = {}
  ) {
    const {
      enableSound = true,
      enableVibration = true,
      soundVolume = 0.08,
      vibrationType,
    } = options;

    // Determine vibration type based on toast type if not specified
    const vibType = vibrationType || (type === "info" ? "light" : type);

    if (enableVibration) {
      this.triggerVibration(vibType);
    }

    if (enableSound) {
      switch (type) {
        case "success":
          await this.playSuccessSound(soundVolume);
          break;
        case "error":
          await this.playErrorSound(soundVolume);
          break;
        case "warning":
          await this.playWarningSound(soundVolume);
          break;
        case "info":
          await this.playInfoSound(soundVolume);
          break;
      }
    }
  }

  // Enable/disable features
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
  }

  // Check device capabilities
  isVibrationSupported(): boolean {
    return typeof navigator !== "undefined" && "vibrate" in navigator;
  }

  isAudioSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      (window.AudioContext || (window as any).webkitAudioContext) !== undefined
    );
  }
}

// Singleton instance
export const feedbackManager = new FeedbackManager();

// Convenience functions
export const playFeedback = {
  success: (options?: FeedbackOptions) =>
    feedbackManager.triggerFeedback("success", options),
  error: (options?: FeedbackOptions) =>
    feedbackManager.triggerFeedback("error", options),
  warning: (options?: FeedbackOptions) =>
    feedbackManager.triggerFeedback("warning", options),
  info: (options?: FeedbackOptions) =>
    feedbackManager.triggerFeedback("info", options),
};

export default feedbackManager;
