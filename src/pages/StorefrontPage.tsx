import HorumarStorefront from "../components/HorumarStorefront";

interface StorefrontPageProps {
  onAdminClick: () => void;
}

export default function StorefrontPage({ onAdminClick }: StorefrontPageProps) {
  return <HorumarStorefront onAdminClick={onAdminClick} />;
}
