import CustomerStoreNew from "../components/CustomerStoreNew";

interface StorefrontPageProps {
  onAdminClick: () => void;
}

export default function StorefrontPage({ onAdminClick }: StorefrontPageProps) {
  return <CustomerStoreNew onAdminClick={onAdminClick} />;
}
