import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PageHeader } from "@/components/page/page-header";
import { ContactForm } from "@/components/sections/contact/contact-form";
import { isMailConfigured } from "@/lib/contact/mail";
import { parseContactType } from "@/lib/contact/schema";

export const metadata: Metadata = pageMetadata({
  title: "お問い合わせ",
  description:
    "遊栄JAPANへのお問い合わせ。デジタルサイネージ「遊栄ビジョン」への広告掲載、Webサイト・映像の制作、取材などのご相談はこちらから。",
  path: "/contact",
});

const CRUMBS = [{ href: "/", label: "ホーム" }, { label: "お問い合わせ" }];

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { type } = await searchParams;
  // Read at request time: the form can't send until both env vars are set.
  const mailEnabled = isMailConfigured({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO: process.env.CONTACT_TO,
  });

  return (
    <>
      <PageHeader
        eyebrow="CONTACT"
        title="お問い合わせ"
        lead="サイネージ広告の掲載、Webサイト・映像の制作、取材など、お気軽にご相談ください。内容を確認のうえ、担当者よりご連絡いたします。"
        breadcrumbs={CRUMBS}
      />
      <BreadcrumbJsonLd items={CRUMBS} path="/contact" />
      <section aria-label="お問い合わせフォーム" className="bg-surface pb-24 pt-12 md:pb-36 md:pt-20">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <ContactForm initialType={parseContactType(type)} mailEnabled={mailEnabled} />
        </div>
      </section>
    </>
  );
}
