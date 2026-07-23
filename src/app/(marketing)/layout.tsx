import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  generateSoftwareAppSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={generateWebSiteSchema()} />
      <JsonLd data={generateSoftwareAppSchema()} />
      <MarketingNav />
      {children}
    </>
  );
}
