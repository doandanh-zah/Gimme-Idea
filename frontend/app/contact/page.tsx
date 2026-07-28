'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AtSign,
  BookOpenText,
  Building2,
  CheckCircle,
  Clock3,
  Compass,
  ExternalLink,
  FileText,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CONTACT_INFO = {
  email: 'gimmeidea.contact@gmail.com',
  telegram: 'https://t.me/+s7KW91Nf4G1iZWVl',
  twitter: '@gimme_idea',
  twitterUrl: 'https://twitter.com/gimme_idea',
};

const INQUIRY_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

const contactLinks = [
  {
    label: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    icon: Mail,
    external: false,
  },
  {
    label: CONTACT_INFO.twitter,
    href: CONTACT_INFO.twitterUrl,
    icon: AtSign,
    external: true,
  },
  {
    label: 'Telegram',
    href: CONTACT_INFO.telegram,
    icon: MessageCircle,
    external: true,
  },
];

const quickLinks = [
  {
    title: 'Documentation',
    description: 'Learn how to use Gimme Idea.',
    href: '/docs',
    icon: BookOpenText,
  },
  {
    title: 'GTM Assistant',
    description: 'Validate and go to market faster.',
    href: '/idea',
    icon: Compass,
  },
  {
    title: 'Support Us',
    description: 'Help keep the product running.',
    href: '/donate',
    icon: Heart,
  },
];

function ContactPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: 'general',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Enter your name.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.message.trim()) {
      nextErrors.message = 'Tell us what you need help with.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidId = Object.keys(nextErrors)[0];
      document.getElementById(firstInvalidId)?.focus();
      toast.error('Check the highlighted fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const subject = encodeURIComponent(
        `[${formData.inquiryType.toUpperCase()}] ${formData.subject || 'Contact Form'}`
      );
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company || 'N/A'}\nType: ${INQUIRY_TYPES.find((type) => type.value === formData.inquiryType)?.label}\n\nMessage:\n${formData.message}`
      );

      window.location.href = `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;

      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast.success('Opening your email client...');
      }, 500);
    } catch {
      setIsSubmitting(false);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', company: '', inquiryType: 'general', subject: '', message: '' });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <main className="relative min-h-screen pb-20 pt-28 text-gray-300">

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-8">
          <p className="ui-eyebrow">Contact</p>
          <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Send the team a focused note.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Use this for product questions, partnerships, feature requests, and security-sensitive reports that need direct handling.
              </p>
            </div>

            <div className="grid gap-2">
              {contactLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="flex min-h-[48px] items-center gap-3 border border-white/10 bg-white/[0.03] px-4 text-sm text-gray-300 transition hover:border-[#FFD700]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                >
                  <item.icon className="h-4 w-4 text-[#FFD700]" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.external ? <ExternalLink className="h-3.5 w-3.5 text-gray-500" /> : null}
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 pt-8 lg:grid-cols-[1fr_0.52fr] lg:items-start">
          <section className="border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10">
                <Send className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Send a Message</h2>
                <p className="text-sm text-gray-500">We usually respond within 24-48 hours.</p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="border border-emerald-300/20 bg-emerald-300/10 px-5 py-10 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-300" />
                <h3 className="mt-4 text-xl font-semibold text-white">Ready to Send</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
                  Your email client should open. If it does not, email us directly at{' '}
                  <span className="text-[#FFD700]">{CONTACT_INFO.email}</span>.
                </p>
                <button type="button" onClick={resetForm} className="btn-ghost mx-auto mt-6">
                  New Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                      Name <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                      <input
                        id="name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        aria-invalid={errors.name ? 'true' : undefined}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className="w-full border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                        required
                      />
                    </div>
                    {errors.name ? <p id="name-error" className="mt-1.5 text-xs text-red-300">{errors.name}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                      Email <span className="text-red-300">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? 'true' : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className="w-full border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                        required
                      />
                    </div>
                    {errors.email ? <p id="email-error" className="mt-1.5 text-xs text-red-300">{errors.email}</p> : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                      Company <span className="text-gray-600">(optional)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                      <input
                        id="company"
                        type="text"
                        name="company"
                        autoComplete="organization"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your company"
                        className="w-full border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                      Type
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className="w-full cursor-pointer border border-white/10 bg-black/25 px-4 py-3 text-sm text-white transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                    >
                      {INQUIRY_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-[#151515]">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                    Subject
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      autoComplete="off"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this about?"
                      className="w-full border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                    Message <span className="text-red-300">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us what you need."
                    rows={5}
                    aria-invalid={errors.message ? 'true' : undefined}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className="w-full resize-none border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder-gray-600 transition focus:border-[#FFD700]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60"
                    required
                  />
                  {errors.message ? <p id="message-error" className="mt-1.5 text-xs text-red-300">{errors.message}</p> : null}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-gray-600">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="text-gray-400 transition hover:text-[#FFD700]">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="space-y-4">
            <section className="border border-white/10 bg-white/[0.03] p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white">
                <Clock3 className="h-4 w-4 text-[#FFD700]" />
                Response
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Most messages get a reply within 24-48 hours. Security-sensitive notes should include steps to reproduce and impact.
              </p>
            </section>

            <section className="border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Quick Links</h2>
              <div className="mt-4 space-y-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 border border-white/10 bg-black/20 p-3 transition hover:border-[#FFD700]/35 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-[#FFD700]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{item.title}</span>
                      <span className="block truncate text-xs text-gray-500">{item.description}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ContactPage;
