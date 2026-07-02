import StorefrontApp from "../storefront/StorefrontApp";

interface StorefrontPageProps {
  onAdminClick: () => void;
}

export default function StorefrontPage({ onAdminClick }: StorefrontPageProps) {
  return <StorefrontApp onAdminClick={onAdminClick} />;
}
