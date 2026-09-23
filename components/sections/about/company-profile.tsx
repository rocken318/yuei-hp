import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { InfoTable } from "@/components/page/info-table";
import type { SummaryItem } from "@/lib/page/about";
import type { Company } from "@/lib/content";
import { SectionHeading } from "./section-heading";

type Props = { company: Company; summary: SummaryItem[] };

/** 会社概要: the facts table. Rows without data are left out (InfoTable). */
export function CompanyProfile({ company, summary }: Props) {
  const rows = [
    {
      label: "社名",
      value: (
        <>
          {company.name}
          <span className="mt-0.5 block font-display text-xs tracking-[0.12em] text-ink-muted md:text-sm">
            {company.nameEn}
          </span>
        </>
      ),
    },
    { label: "代表者", value: company.representative },
    { label: "設立", value: company.established },
    { label: "資本金", value: company.capital },
    { label: "所在地", value: company.address },
    { label: "電話番号", value: company.tel },
    { label: "従業員数", value: company.employees },
    {
      label: "事業内容",
      value:
        summary.length > 0 ? (
          <ul className="space-y-1.5">
            {summary.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 underline-offset-4 transition-colors duration-hover hover:text-brand-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                  >
                    {item.label}
                    <ArrowRight
                      aria-hidden
                      className="size-3.5 text-brand-blue transition-transform duration-hover group-hover:translate-x-1"
                    />
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        ) : undefined,
    },
  ];

  return (
    <section data-testid="company-profile" aria-labelledby="company-heading" className="bg-surface py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
        <SectionHeading id="company-heading" eyebrow="COMPANY" className="md:sticky md:top-32 md:self-start">
          会社概要
        </SectionHeading>
        <Reveal>
          <InfoTable rows={rows} />
        </Reveal>
      </div>
    </section>
  );
}
