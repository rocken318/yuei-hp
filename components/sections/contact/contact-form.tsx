"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight, Check, CircleCheck, CodeXml, Info, Loader2, Mail, MonitorPlay } from "lucide-react";
import { sendContact } from "@/app/contact/actions";
import {
  contactLimits,
  contactTypeLabels,
  contactTypes,
  emptyContactValues,
  validateContact,
  validateContactField,
  type ContactField,
  type ContactFieldErrors,
  type ContactType,
  type ContactValues,
} from "@/lib/contact/schema";
import { initialContactState, type ContactState } from "@/lib/contact/state";
import { revealVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TYPE_META: Record<ContactType, { note: string; Icon: typeof Mail }> = {
  signage: { note: "遊栄ビジョンへの広告掲載", Icon: MonitorPlay },
  web: { note: "Webサイト・映像の制作", Icon: CodeXml },
  other: { note: "取材・事業に関するご相談など", Icon: Mail },
};

/** Field order: the first invalid one gets focus on submit. */
const FIELD_ORDER: ContactField[] = ["type", "name", "company", "email", "tel", "message", "agree"];

type Props = {
  /** Preselected type (from `?type=`). */
  initialType?: ContactType;
  /** False when the mail env vars are missing: the form shows but can't send. */
  mailEnabled: boolean;
};

/**
 * The contact form. Validation runs on the client with the same schema the
 * Server Action uses (lib/contact/schema.ts): per field on blur, all fields
 * on submit (the first invalid field is focused). Errors are tied to their
 * inputs with aria-invalid / aria-describedby. Without JavaScript the form
 * still posts to the Server Action.
 */
export function ContactForm({ initialType, mailEnabled }: Props) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactValues>(() => emptyContactValues(initialType));
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [state, formAction, pending] = useActionState<ContactState, FormData>(async (prev, fd) => {
    const next = await sendContact(prev, fd);
    if (next.status === "invalid") setErrors(next.errors);
    return next;
  }, initialContactState);

  const disabled = !mailEnabled || state.status === "disabled";
  const id = (field: string) => `${formId}-${field}`;

  function setValue<K extends keyof ContactValues>(field: K, value: ContactValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Clear (or update) an error as soon as the input changes it.
    if (field !== "website" && errors[field as ContactField]) {
      setErrors((e) => ({ ...e, [field]: validateContactField(field as ContactField, next) }));
    }
  }

  function onBlur(field: ContactField) {
    setErrors((e) => ({ ...e, [field]: validateContactField(field, values) }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Dispatch manually (no automatic form reset — the inputs are controlled).
    e.preventDefault();
    if (pending || disabled) return;
    const result = validateContact(values);
    if (!result.success && values.website === "") {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  if (state.status === "success") return <ThankYou />;

  const described = (field: ContactField, ...extra: string[]) =>
    [...extra, errors[field] ? id(`${field}-error`) : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-describedby={disabled ? id("disabled") : undefined}
      data-testid="contact-form"
      className="grid gap-10 md:gap-12"
    >
      {disabled && (
        <div
          id={id("disabled")}
          role="status"
          data-testid="contact-disabled"
          className="flex gap-3 rounded-card border border-brand-blue/20 bg-brand-sky/25 p-5 text-sm leading-[1.9] text-brand-navy md:p-6 md:text-base"
        >
          <Info aria-hidden className="mt-1 size-5 shrink-0 text-brand-blue" />
          <p>
            <span className="block font-bold">現在、フォームからの送信は準備中です。</span>
            <span className="block text-ink-muted">送信の受け付けを開始するまで、しばらくお待ちください。</span>
          </p>
        </div>
      )}
      {state.status === "error" && (
        <div
          role="alert"
          className="flex gap-3 rounded-card border border-destructive/30 bg-destructive/5 p-5 text-sm leading-[1.9] text-ink md:p-6 md:text-base"
        >
          <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-destructive" />
          <p>送信できませんでした。お手数ですが、時間をおいて再度お試しください。</p>
        </div>
      )}

      {/* Inquiry type */}
      <fieldset aria-describedby={errors.type ? id("type-error") : undefined}>
        <legend className="mb-4 flex items-center gap-3 text-sm font-bold text-ink md:text-base">
          お問い合わせ種別 <RequiredBadge />
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {contactTypes.map((type, i) => {
            const { note, Icon } = TYPE_META[type];
            const checked = values.type === type;
            return (
              <label
                key={type}
                data-testid={`contact-type-${type}`}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-4 rounded-card border bg-surface p-5 transition-[border-color,background-color,box-shadow,transform] duration-hover ease-brand-out active:scale-[0.98] sm:flex-col sm:items-start sm:gap-5 md:active:scale-100",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue",
                  checked
                    ? "border-brand-blue bg-brand-sky/20 shadow-[inset_0_0_0_1px_var(--color-brand-blue)]"
                    : "border-line hover:border-brand-blue/40",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={checked}
                  onChange={() => setValue("type", type)}
                  data-field={i === 0 ? "type" : undefined}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-hover",
                    checked ? "bg-brand-blue text-surface" : "bg-brand-sky/40 text-brand-blue",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{contactTypeLabels[type]}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{note}</span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-hover sm:absolute sm:right-5 sm:top-5",
                    checked ? "border-brand-blue bg-brand-blue text-surface" : "border-line bg-surface",
                  )}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
              </label>
            );
          })}
        </div>
        <FieldError id={id("type-error")} message={errors.type} />
      </fieldset>

      <div className="grid gap-8 md:grid-cols-2 md:gap-x-6">
        <Field label="お名前" htmlFor={id("name")} required error={errors.name} errorId={id("name-error")}>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={contactLimits.name + 10}
            required
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            onBlur={() => onBlur("name")}
            data-field="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={described("name")}
            className={inputClass(!!errors.name)}
          />
        </Field>
        <Field label="会社名・団体名" htmlFor={id("company")} error={errors.company} errorId={id("company-error")}>
          <input
            id={id("company")}
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={contactLimits.company + 10}
            value={values.company}
            onChange={(e) => setValue("company", e.target.value)}
            onBlur={() => onBlur("company")}
            data-field="company"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={described("company")}
            className={inputClass(!!errors.company)}
          />
        </Field>
        <Field label="メールアドレス" htmlFor={id("email")} required error={errors.email} errorId={id("email-error")}>
          <input
            id={id("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            onBlur={() => onBlur("email")}
            data-field="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={described("email")}
            className={inputClass(!!errors.email)}
          />
        </Field>
        <Field label="電話番号" htmlFor={id("tel")} error={errors.tel} errorId={id("tel-error")}>
          <input
            id={id("tel")}
            name="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="例）022-000-0000"
            value={values.tel}
            onChange={(e) => setValue("tel", e.target.value)}
            onBlur={() => onBlur("tel")}
            data-field="tel"
            aria-invalid={errors.tel ? true : undefined}
            aria-describedby={described("tel")}
            className={inputClass(!!errors.tel)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="お問い合わせ内容"
            htmlFor={id("message")}
            required
            error={errors.message}
            errorId={id("message-error")}
            aside={
              <span
                id={id("message-count")}
                className={cn(
                  "font-display text-xs tabular-nums",
                  values.message.trim().length > contactLimits.messageMax ? "text-destructive" : "text-ink-muted",
                )}
              >
                {values.message.trim().length} / {contactLimits.messageMax}
              </span>
            }
          >
            <textarea
              id={id("message")}
              name="message"
              rows={8}
              required
              value={values.message}
              onChange={(e) => setValue("message", e.target.value)}
              onBlur={() => onBlur("message")}
              data-field="message"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={described("message", id("message-count"))}
              className={cn(inputClass(!!errors.message), "min-h-48 resize-y leading-[1.9]")}
            />
          </Field>
        </div>
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={id("website")}>ウェブサイト（入力しないでください）</label>
        <input
          id={id("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setValue("website", e.target.value)}
        />
      </div>

      <div className="grid gap-8 border-t border-line pt-8 md:pt-10">
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-[1.9] text-ink md:text-base">
            <input
              type="checkbox"
              name="agree"
              checked={values.agree}
              onChange={(e) => {
                setValue("agree", e.target.checked);
                setErrors((er) => ({ ...er, agree: undefined }));
              }}
              data-field="agree"
              aria-invalid={errors.agree ? true : undefined}
              aria-describedby={described("agree")}
              className="mt-1.5 size-5 shrink-0 cursor-pointer accent-brand-blue md:mt-2"
            />
            <span>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener"
                className="font-bold text-brand-blue underline underline-offset-4 transition-colors duration-hover hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                プライバシーポリシー
                <span className="sr-only">（新しいタブで開きます）</span>
              </Link>
              に同意のうえ送信します。 <RequiredBadge />
            </span>
          </label>
          <FieldError id={id("agree-error")} message={errors.agree} />
        </div>

        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={disabled || pending}
            data-testid="contact-submit"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-brand-navy px-10 py-4 text-sm font-bold text-surface transition-[background-color,transform] duration-hover ease-brand-out hover:bg-brand-blue active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:bg-ink-muted/40 disabled:active:scale-100 md:text-base md:active:scale-100"
          >
            {pending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
                送信中…
              </>
            ) : (
              <>
                送信する
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-hover group-hover:translate-x-1 group-disabled:translate-x-0"
                />
              </>
            )}
          </button>
          {disabled && <p className="text-xs text-ink-muted">送信は準備中のため、現在ご利用いただけません。</p>}
        </div>
      </div>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "block w-full rounded-xl border bg-surface px-4 py-3.5 text-base text-ink transition-[border-color,box-shadow] duration-hover placeholder:text-ink-muted/60",
    "focus:outline-none focus-visible:border-brand-blue focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-brand-blue)_18%,transparent)]",
    invalid ? "border-destructive" : "border-line hover:border-brand-blue/40",
  );
}

function RequiredBadge() {
  return (
    <span className="inline-flex rounded-full bg-brand-navy px-2 py-0.5 align-middle text-[0.625rem] font-bold leading-normal tracking-[0.1em] text-surface">
      必須
    </span>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  errorId,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  errorId: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="flex items-center gap-3 text-sm font-bold text-ink md:text-base">
          {label}
          {required ? <RequiredBadge /> : <span className="text-xs font-normal text-ink-muted">任意</span>}
        </label>
        {aside}
      </div>
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} data-testid="field-error" className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

function ThankYou() {
  return (
    <motion.div
      role="status"
      data-testid="contact-success"
      initial="hidden"
      animate="visible"
      variants={revealVariants(false)}
      className="flex flex-col items-center rounded-card bg-surface-muted px-6 py-16 text-center md:py-24"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-blue text-surface">
        <CircleCheck aria-hidden className="size-8" />
      </span>
      <h2 className="mt-8 text-2xl font-bold text-ink md:text-3xl">お問い合わせを受け付けました</h2>
      <p className="mt-5 max-w-lg text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:text-base">
        お問い合わせいただき、ありがとうございます。内容を確認のうえ、担当者よりご連絡いたします。
      </p>
      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-3 rounded-full bg-brand-navy px-8 py-4 text-sm font-bold text-surface transition-[background-color,transform] duration-hover ease-brand-out hover:bg-brand-blue active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:active:scale-100"
      >
        トップページへ戻る
        <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
