import { useState, useCallback, memo } from "react";
import { MapPin, Truck, Calculator, Clock } from "lucide-react";

interface DeliveryCalculatorProps {
  cartTotal: number;
  onDeliveryChange: (fee: number) => void;
}

const DeliveryCalculator = memo(
  ({ cartTotal, onDeliveryChange }: DeliveryCalculatorProps) => {
    const [selectedLocation, setSelectedLocation] = useState("");
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState("");

    const locations = [
      { name: "Nairobi CBD", fee: 200, time: "1-2 hours" },
      { name: "Westlands", fee: 250, time: "2-3 hours" },
      { name: "Karen", fee: 300, time: "2-4 hours" },
      { name: "Kasarani", fee: 350, time: "3-4 hours" },
      { name: "Kiambu", fee: 400, time: "4-5 hours" },
      { name: "Thika", fee: 500, time: "5-6 hours" },
      { name: "Machakos", fee: 600, time: "6-8 hours" },
      { name: "Other Nairobi Areas", fee: 300, time: "2-4 hours" },
    ];

    const calculateDelivery = useCallback(
      (location: string) => {
        const selected = locations.find((loc) => loc.name === location);
        if (!selected) return;

        let finalFee = selected.fee;

        // Free delivery for orders over KES 2,000
        if (cartTotal >= 2000) {
          finalFee = 0;
        }

        setSelectedLocation(location);
        setDeliveryFee(finalFee);
        setEstimatedTime(selected.time);
        onDeliveryChange(finalFee);
      },
      [cartTotal, onDeliveryChange]
    );

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Delivery Calculator
          </h3>
        </div>

        <div className="space-y-4">
          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select your location:
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => calculateDelivery(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose location...</option>
              {locations.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.name} - KES {location.fee}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Info */}
          {selectedLocation && (
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{selectedLocation}</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {deliveryFee === 0
                    ? "FREE"
                    : `KES ${deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-600">
                  Estimated delivery: {estimatedTime}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-slate-600">
                  Express delivery available
                </span>
              </div>

              {cartTotal >= 2000 && deliveryFee === 0 && (
                <div className="bg-green-100 text-green-800 p-2 rounded-lg text-sm font-medium">
                  🎉 Congratulations! You qualify for FREE delivery!
                </div>
              )}

              {cartTotal < 2000 && (
                <div className="bg-yellow-100 text-yellow-800 p-2 rounded-lg text-sm">
                  💡 Add KES {(2000 - cartTotal).toLocaleString()} more for FREE
                  delivery!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DeliveryCalculator.displayName = "DeliveryCalculator";

export default DeliveryCalculator;
