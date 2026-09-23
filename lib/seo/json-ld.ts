import { absoluteUrl } from "@/lib/site";

/** A JSON-LD node (schema.org). */
export type JsonLdNode = { "@context"?: "https://schema.org"; "@type": string; [key: string]: unknown };

/**
 * JSON for a <script type="application/ld+json">. `<` is escaped so a string
 * in the data can never close the script element.
 */
export function serializeJsonLd(data: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type PostalAddress = {
  "@type": "PostalAddress";
  addressCountry: "JP";
  addressRegion: string;
  addressLocality: string;
  streetAddress: string;
};

/**
 * A Japanese address → schema.org PostalAddress: prefecture (addressRegion),
 * city with its ward / county with its town / Tokyo ward (addressLocality),
 * and the rest (streetAddress). No postal code (not in the content). Returns
 * undefined when the address doesn't start with a prefecture and a locality.
 */
export function parseJapaneseAddress(address: string): PostalAddress | undefined {
  const m = /^(東京都|北海道|(?:京都|大阪)府|[^\s都道府県]{2,3}県)\s*([^\s\d０-９]+?市(?:[^\s\d０-９]{1,4}?区)?|[^\s\d０-９]+?郡[^\s\d０-９]+?[町村]|[^\s\d０-９]+?区)\s*(.+)$/.exec(
    address.trim(),
  );
  if (!m) return undefined;
  return {
    "@type": "PostalAddress",
    addressCountry: "JP",
    addressRegion: m[1],
    addressLocality: m[2],
    streetAddress: m[3].trim(),
  };
}

export type OrganizationInput = {
  name: string;
  nameEn?: string;
  nameKana?: string;
  corporateNumber?: string;
  address?: string;
};

/** Organization for the home page. */
export function organizationJsonLd(company: OrganizationInput, baseUrl: string): JsonLdNode {
  const alternateName = [company.nameEn, company.nameKana].filter((n): n is string => Boolean(n));
  const address = company.address ? parseJapaneseAddress(company.address) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    ...(alternateName.length > 0 && { alternateName }),
    url: absoluteUrl("/", baseUrl),
    logo: absoluteUrl("/brand/yuei-logo.svg", baseUrl),
    ...(address && { address }),
    ...(company.corporateNumber && {
      identifier: { "@type": "PropertyValue", propertyID: "法人番号", value: company.corporateNumber },
    }),
  };
}

export type BreadcrumbInput = { href?: string; label: string };

/**
 * BreadcrumbList from the items passed to the visible breadcrumbs. The last
 * item is the current page (no href there), so it gets `currentPath`.
 */
export function breadcrumbJsonLd(items: readonly BreadcrumbInput[], currentPath: string, baseUrl: string): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => {
      const href = i === items.length - 1 ? (item.href ?? currentPath) : item.href;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        ...(href && { item: absoluteUrl(href, baseUrl) }),
      };
    }),
  };
}

export type LocalBusinessInput = {
  business: string;
  kind: "store" | "signage";
  name: string;
  address?: string;
  tel?: string;
  heroImage?: string;
  siteUrl?: string;
  sns?: Partial<Record<string, string | undefined>>;
};

/**
 * LocalBusiness for a store page — only for a store (not a signage location)
 * whose address is known and parses. Otherwise undefined (nothing emitted).
 */
export function localBusinessJsonLd(venue: LocalBusinessInput, path: string, baseUrl: string): JsonLdNode | undefined {
  if (venue.kind !== "store" || !venue.address) return undefined;
  const address = parseJapaneseAddress(venue.address);
  if (!address) return undefined;
  const sameAs = [venue.siteUrl, ...Object.values(venue.sns ?? {})].filter((u): u is string => Boolean(u));
  return {
    "@context": "https://schema.org",
    "@type": venue.business === "dining" ? "Restaurant" : "LocalBusiness",
    name: venue.name,
    url: absoluteUrl(path, baseUrl),
    address,
    ...(venue.tel && { telephone: venue.tel }),
    ...(venue.heroImage && { image: absoluteUrl(venue.heroImage, baseUrl) }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}
