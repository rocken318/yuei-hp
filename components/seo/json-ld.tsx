import { breadcrumbJsonLd, serializeJsonLd, type BreadcrumbInput, type JsonLdNode } from "@/lib/seo/json-ld";
import { SITE_URL } from "@/lib/site";

/** Structured data as a native <script> (not next/script: it isn't executable). */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

/** BreadcrumbList for the trail shown on the page (`path`: the current page). */
export function BreadcrumbJsonLd({ items, path }: { items: readonly BreadcrumbInput[]; path: string }) {
  return <JsonLd data={breadcrumbJsonLd(items, path, SITE_URL)} />;
}
