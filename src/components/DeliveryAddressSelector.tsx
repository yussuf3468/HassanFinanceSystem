import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { EASTLEIGH_LOCATIONS, getDeliveryFee } from "../utils/eastleighLocations";

interface DeliveryAddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  onDeliveryFeeChange?: (fee: number) => void;
  disabled?: boolean;
  className?: string;
  dark?: boolean; // kept for API compatibility; styling is now theme-aware
}

export default function DeliveryAddressSelector({
  value,
  onChange,
  onDeliveryFeeChange,
  disabled = false,
  className = "",
}: DeliveryAddressSelectorProps) {
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const findLocationFromValue = (rawValue: string) => {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) return null;

    for (const area of EASTLEIGH_LOCATIONS) {
      const match = area.locations.find(
        (location) => location.trim().toLowerCase() === normalized,
      );
      if (match) return { area: area.area, location: match };
    }
    return null;
  };

  // Sync internal selector state when the parent provides / changes the value.
  // This is the ONLY effect — emitting onChange happens in the handlers below,
  // so the two never fight each other (previous bug: an emit-effect and this
  // sync-effect oscillated, causing rapid flicker).
  useEffect(() => {
    if (!value) {
      setUseCustom(false);
      setSelectedArea("");
      setSelectedLocation("");
      setCustomAddress("");
      return;
    }

    const locationMatch = findLocationFromValue(value);
    if (locationMatch) {
      setUseCustom(false);
      setSelectedArea(locationMatch.area);
      setSelectedLocation(locationMatch.location);
      setCustomAddress("");
      onDeliveryFeeChange?.(getDeliveryFee(locationMatch.location));
      return;
    }

    setUseCustom(true);
    setSelectedArea("");
    setSelectedLocation("");
    setCustomAddress(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    setSelectedLocation("");
    onChange(""); // no specific location chosen yet
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    onChange(location);
    onDeliveryFeeChange?.(getDeliveryFee(location));
  };

  const handleCustomToggle = (custom: boolean) => {
    setUseCustom(custom);
    if (custom) {
      setSelectedArea("");
      setSelectedLocation("");
      onChange(customAddress);
    } else {
      setCustomAddress("");
      onChange(selectedLocation);
    }
  };

  const handleCustomAddressChange = (next: string) => {
    setCustomAddress(next);
    onChange(next);
  };

  const toggleBase =
    "px-4 h-11 rounded-full border text-[14px] font-medium transition-colors flex-1";
  const toggleActive =
    "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] border-[#1d1d1f] dark:border-white";
  const toggleIdle =
    "bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white border-black/10 dark:border-white/10 hover:border-[#1d1d1f] dark:hover:border-white";
  const fieldClass =
    "w-full px-4 h-11 rounded-xl appearance-none bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 dark:focus:ring-white/20 focus:border-[#1d1d1f] dark:focus:border-white transition-all";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={() => handleCustomToggle(false)}
          disabled={disabled}
          className={`${toggleBase} ${
            !useCustom ? toggleActive : toggleIdle
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Eastleigh Locations
        </button>
        <button
          type="button"
          onClick={() => handleCustomToggle(true)}
          disabled={disabled}
          className={`${toggleBase} ${
            useCustom ? toggleActive : toggleIdle
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Other Location
        </button>
      </div>

      {!useCustom ? (
        <div className="space-y-3">
          {/* Area Selection */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-[#1d1d1f] dark:text-[#f5f5f7]">
              Select area
            </label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={disabled}
                className={fieldClass}
              >
                <option value="">Choose area…</option>
                {EASTLEIGH_LOCATIONS.map((area) => (
                  <option key={area.area} value={area.area}>
                    {area.area}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[#86868b]" />
            </div>
          </div>

          {/* Location Selection */}
          {selectedArea && (
            <div>
              <label className="block text-[13px] font-medium mb-1.5 text-[#1d1d1f] dark:text-[#f5f5f7]">
                Select specific location
              </label>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  disabled={disabled}
                  className={fieldClass}
                >
                  <option value="">Choose location…</option>
                  {EASTLEIGH_LOCATIONS.find(
                    (area) => area.area === selectedArea,
                  )?.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[#86868b]" />
              </div>
            </div>
          )}

          {/* Delivery Fee Display */}
          {selectedLocation && (
            <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#6e6e73] dark:text-[#a1a1a6]">
                Delivery fee
              </span>
              <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
                KES {getDeliveryFee(selectedLocation).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-[13px] font-medium mb-1.5 text-[#1d1d1f] dark:text-[#f5f5f7]">
            Enter delivery address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-[18px] h-[18px] text-[#86868b]" />
            <textarea
              value={customAddress}
              onChange={(e) => handleCustomAddressChange(e.target.value)}
              disabled={disabled}
              placeholder="Full delivery address with clear landmarks…"
              className="w-full pl-11 pr-4 py-3 rounded-xl resize-none bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white border border-black/10 dark:border-white/10 placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/15 dark:focus:ring-white/20 focus:border-[#1d1d1f] dark:focus:border-white transition-all"
              rows={3}
            />
          </div>
          <p className="text-[12px] mt-2 text-[#86868b]">
            Delivery fee for locations outside Eastleigh is calculated based on
            distance.
          </p>
        </div>
      )}
    </div>
  );
}
