import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import type { ReactNode } from "react";
import Link from "next/link";
import { content } from "@/lib/content";
import { InfoTable } from "@/components/page/info-table";
import { PageHeader } from "@/components/page/page-header";
import { pad2 } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "個人情報保護方針",
  description:
    "遊栄JAPANの個人情報保護方針（プライバシーポリシー）。お問い合わせ等でお預かりする個人情報の取り扱いについて定めています。",
  path: "/privacy",
});

type Clause = { title: string; body: ReactNode };

const linkClass =
  "font-bold text-brand-blue underline underline-offset-4 transition-colors duration-hover hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

const CLAUSES: Clause[] = [
  {
    title: "取得する個人情報",
    body: (
      <>
        <p>当社は、お問い合わせフォーム等を通じて、次の個人情報を取得することがあります。</p>
        <ul className="mt-4 grid gap-2 pl-5 [list-style:disc] marker:text-brand-blue">
          <li>お名前、会社名・団体名</li>
          <li>メールアドレス、電話番号</li>
          <li>お問い合わせの内容</li>
        </ul>
      </>
    ),
  },
  {
    title: "利用目的",
    body: (
      <p>
        取得した個人情報は、お問い合わせへの回答・対応、およびそれに必要なご連絡のためにのみ利用し、本人の同意なく目的の範囲を超えて利用することはありません。
      </p>
    ),
  },
  {
    title: "第三者提供の制限",
    body: (
      <>
        <p>
          当社は、法令に基づく場合を除き、本人の同意を得ることなく個人情報を第三者に提供しません。なお、お問い合わせメールの送信など、利用目的の達成に必要な範囲で業務の一部を外部の事業者に委託する場合は、委託先に対して必要かつ適切な監督を行います。
        </p>
        {/* TODO(legal): 外国にある第三者への提供（改正個人情報保護法）の記載は専門家確認のうえ追記 */}
        <p className="mt-4">お問い合わせフォームの送信には、外部の電子メール配信サービスを利用する場合があります。</p>
      </>
    ),
  },
  {
    title: "安全管理",
    body: (
      <p>
        当社は、個人情報の漏えい、滅失または毀損を防止するため、必要かつ適切な安全管理措置を講じます。また、個人情報を取り扱う従業者に対して、適切な監督を行います。
      </p>
    ),
  },
  {
    title: "開示・訂正・削除等の請求",
    body: (
      <p>
        本人から、ご自身の個人情報について開示、訂正、追加、削除、利用の停止等のご請求があった場合は、本人であることを確認したうえで、法令に従い遅滞なく対応します。ご請求は、下記のお問い合わせ窓口までご連絡ください。
      </p>
    ),
  },
  {
    title: "本方針の改定",
    body: (
      <p>
        当社は、法令の改正や事業内容の変更等に応じて、本方針を改定することがあります。改定後の内容は、本ページに掲載した時点から効力を生じるものとします。
      </p>
    ),
  },
];

const CRUMBS = [{ href: "/", label: "ホーム" }, { label: "個人情報保護方針" }];

export default async function PrivacyPage() {
  const company = await content.getCompany();
  const items = CLAUSES;

  return (
    <>
      <PageHeader
        eyebrow="PRIVACY POLICY"
        title="個人情報保護方針"
        lead={`${company.name}（以下「当社」）は、お客様からお預かりする個人情報の重要性を認識し、個人情報の保護に関する法令を遵守して、次のとおり適切に取り扱います。`}
        breadcrumbs={CRUMBS}
      />
      <BreadcrumbJsonLd items={CRUMBS} path="/privacy" />
      <div className="bg-surface pb-24 pt-16 md:pb-36 md:pt-24">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <ol className="grid gap-12 md:gap-16">
            {items.map((c, i) => (
              <li key={c.title} className="grid gap-4 border-t border-line pt-8 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8 md:pt-10">
                <span aria-hidden className="font-display text-sm tracking-[0.2em] text-brand-blue">
                  {pad2(i + 1)}
                </span>
                <section aria-labelledby={`privacy-${i}`}>
                  <h2 id={`privacy-${i}`} className="text-xl font-bold text-ink md:text-2xl">
                    {c.title}
                  </h2>
                  <div className="mt-4 text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:mt-5 md:text-base">
                    {c.body}
                  </div>
                </section>
              </li>
            ))}
            <li className="grid gap-4 border-t border-line pt-8 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8 md:pt-10">
              <span aria-hidden className="font-display text-sm tracking-[0.2em] text-brand-blue">
                {pad2(items.length + 1)}
              </span>
              <section aria-labelledby="privacy-contact" data-testid="privacy-contact">
                <h2 id="privacy-contact" className="text-xl font-bold text-ink md:text-2xl">
                  お問い合わせ窓口
                </h2>
                <p className="mt-4 text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:mt-5 md:text-base">
                  個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。
                </p>
                <InfoTable
                  className="mt-6"
                  rows={[
                    { label: "事業者名", value: company.name },
                    { label: "所在地", value: company.address },
                    {
                      label: "お問い合わせ",
                      value: (
                        <Link href="/contact?type=other" className={linkClass}>
                          お問い合わせフォーム
                        </Link>
                      ),
                    },
                    // A channel that works even while the form isn't accepting submissions.
                    { label: "郵送でのお問い合わせ", value: `上記所在地 ${company.name} 宛` },
                  ]}
                />
              </section>
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}
