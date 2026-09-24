/** Serializable business data every lab variant renders (built in app/lab/businesses/page.tsx). */
export type LabBusiness = {
  slug: string;
  /** Displayed title: brand ?? name. */
  title: string;
  /** Line-break units of `title` (see components/sections/business/title-parts.ts). */
  titleParts: string[];
  /** The formal business name when a brand is shown as the title. */
  subName?: string;
  nameEn: string;
  lead?: string;
  summary: string;
  heroImage?: string;
  href: string;
};
