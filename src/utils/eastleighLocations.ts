export const EASTLEIGH_LOCATIONS = [
  {
    area: "Section One",
    locations: [
      "Global Apartment",
      "Global Plaza",
      "Nyayo House",
      "Pioneer Building",
      "Eastleigh Hotel",
      "Dubai Plaza",
      "California Mall",
    ],
  },
  {
    // previously "Section Two" — renamed to a commonly used name
    area: "Eastleigh North",
    locations: [
      "Garissa Lodge",
      "Towfiq Plaza",
      "Olympic Building",
      "Riverside Complex",
      "Unity Plaza",
      "Twin Tower",
    ],
  },
  {
    area: "Section Three",
    locations: [
      "Amal Plaza",
      "Darussalam Plaza",
      "Nairobi Mall",
      "General Karangi Road",
      "Airport Road",
    ],
  },
  {
    // previously "Section Four" — renamed to a commonly used name
    area: "Jogoo Road",
    locations: [
      "Eastleigh High School Area",
      "Jogoo Road",
      "12th Street",
      "13th Street",
    ],
  },
  {
    // previously "Section Five" — renamed to a commonly used name
    area: "Community Area",
    locations: [
      "Eastmatt Supermarket",
      "Eastleigh Community Center",
      "Chief Road",
    ],
  },
  {
    area: "First Avenue",
    locations: [
      "First Avenue Main Road",
      "First Avenue Shops",
      "First Avenue Junction",
    ],
  },
  {
    area: "Second Avenue",
    locations: [
      "Second Avenue Main Road",
      "Second Avenue Market",
      "Second Avenue Plaza",
    ],
  },
  {
    area: "Third Avenue",
    locations: [
      "Third Avenue Main Road",
      "Third Avenue Complex",
      "Third Avenue Junction",
    ],
  },
];

export const DELIVERY_FEES: Record<string, number> = {
  "Section One": 150,
  "Eastleigh North": 200,
  "Section Three": 250,
  "Jogoo Road": 200,
  "Community Area": 300,
  "First Avenue": 180,
  "Second Avenue": 200,
  "Third Avenue": 220,
};

export function getDeliveryFee(selectedLocation: string): number {
  const input = (selectedLocation || "").toLowerCase();

  for (const [area, fee] of Object.entries(DELIVERY_FEES)) {
    const areaLC = area.toLowerCase();
    // direct match against area name (e.g., "Section One" or "Eastleigh North")
    if (input.includes(areaLC)) {
      return fee;
    }

    // find area data and try matching any known location (case-insensitive)
    const areaData = EASTLEIGH_LOCATIONS.find((loc) => loc.area === area);
    if (
      areaData?.locations.some((location) =>
        input.includes(location.toLowerCase())
      )
    ) {
      return fee;
    }
  }

  return 250; // Default fee for other locations
}