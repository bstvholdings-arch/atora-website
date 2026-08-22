'use client';

import { useState } from 'react';
import { Locale, t } from '@/lib/i18n';
import Link from 'next/link';
import { Brand } from '@/lib/db';

type Props = {
  lang: Locale;
  whatsappNumber: string;
  brands: Brand[];
};

/**
 * Quick Photo/Video Enquiry form on the homepage.
 * Submits to /api/enquiry (server route) and shows success.
 */
export default function QuickEnquiryForm({ lang, whatsappNumber, brands }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [whatsappLink, setWhatsappLink] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult('idle');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setResult('success');
        setWhatsappLink(data.whatsappLink ?? '');
        form.reset();
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h3 className="heading-3 mb-1">{t(lang, 'home.quickEnquiryTitle')}</h3>
      <p className="text-sm text-gray-600 mb-5">{t(lang, 'home.quickEnquirySub')}</p>

      {result === 'success' ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <p className="font-medium mb-1">{t(lang, 'quickEnquiry.success')}</p>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-2 inline-flex"
            >
              {t(lang, 'common.whatsappUs')}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t(lang, 'quickEnquiry.name')}</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.phone')}</label>
            <input name="phone" className="input" type="tel" />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.whatsapp')}</label>
            <input name="whatsapp" className="input" type="tel" placeholder="+60..." />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.email')}</label>
            <input name="email" className="input" type="email" />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.brand')}</label>
            <select name="brand" className="input">
              <option value="">—</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name_en}>{b.name_en}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.model')}</label>
            <input name="model" className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.quantity')}</label>
            <input name="quantity" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t(lang, 'quickEnquiry.message')}</label>
            <textarea name="message" rows={3} className="input" required />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.uploadPhoto')}</label>
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <div>
            <label className="label">{t(lang, 'quickEnquiry.uploadVideo')}</label>
            <input name="video" type="file" accept="video/mp4,video/quicktime,video/webm" className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? t(lang, 'common.loading') : t(lang, 'quickEnquiry.submit')}
            </button>
            <Link href={`/${lang}/contact`} className="btn-secondary">
              {t(lang, 'nav.contact')}
            </Link>
          </div>
          {result === 'error' && (
            <div className="sm:col-span-2 text-sm text-red-600">{t(lang, 'quickEnquiry.error')}</div>
          )}
        </form>
      )}
    </div>
  );
}
