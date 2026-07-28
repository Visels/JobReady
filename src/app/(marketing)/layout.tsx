import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  generateSoftwareAppSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <JsonLd data={generateWebSiteSchema()} />
      <JsonLd data={generateSoftwareAppSchema()} />
      <MarketingNav isAuthenticated={Boolean(user)} />
      {children}
    </>
  );
}
