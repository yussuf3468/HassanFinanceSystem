import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  EASTLEIGH_LOCATIONS,
  getDeliveryFee,
} from "../utils/eastleighLocations";

interface DeliveryAddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  onDeliveryFeeChange?: (fee: number) => void;
  disabled?: boolean;
  className?: string;
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

  // Update delivery fee when location changes
  // Note: don't include onDeliveryFeeChange in deps to avoid identity-change loops
  useEffect(() => {
    if (selectedLocation && onDeliveryFeeChange) {
      const fee = getDeliveryFee(selectedLocation);
      onDeliveryFeeChange(fee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Update form value when selections change
  // Avoid putting onChange in deps; only emit when derived value actually changes
  useEffect(() => {
    const nextValue = useCustom ? customAddress : selectedLocation;
    // Only notify parent if value actually changed to prevent loops
    if (nextValue !== undefined && nextValue !== value) {
      onChange(nextValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, customAddress, useCustom, value]);

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    setSelectedLocation("");
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleCustomToggle = (custom: boolean) => {
    setUseCustom(custom);
    if (custom) {
      setSelectedArea("");
      setSelectedLocation("");
    } else {
      setCustomAddress("");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => handleCustomToggle(false)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border transition-colors flex-1 ${
            !useCustom
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Eastleigh Locations
        </button>
        <button
          type="button"
          onClick={() => handleCustomToggle(true)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border transition-colors flex-1 ${
            useCustom
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-slate-700 border-slate-300 hover:border-blue-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Other Location
        </button>
      </div>

      {!useCustom ? (
        <div className="space-y-3">
          {/* Area Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Area / Dooro Degaanka
            </label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose area...</option>
                {EASTLEIGH_LOCATIONS.map((area) => (
                  <option key={area.area} value={area.area}>
                    {area.area}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Location Selection */}
          {selectedArea && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Specific Location / Dooro Meesha
              </label>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  disabled={disabled}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Choose location...</option>
                  {EASTLEIGH_LOCATIONS.find(
                    (area) => area.area === selectedArea
                  )?.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Delivery Fee Display */}
          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  Delivery Fee / Lacagta Gaarsiin:
                </span>
                <span className="text-lg font-bold text-green-600">
                  KSH {getDeliveryFee(selectedLocation)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter Custom Address / Gali Ciwaanka
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <textarea
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              disabled={disabled}
              placeholder="Enter your full delivery address with clear landmarks..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Note: Delivery fee for locations outside Eastleigh will be
            calculated based on distance.
          </p>
        </div>
      )}
    </div>
  );
}
