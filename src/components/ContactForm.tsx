'use client';

import { useState } from 'react';
import { Locale, t } from '@/lib/i18n';

type Props = {
  lang: Locale;
  initialType?: string;
  initialProduct?: string;
};

export default function ContactForm({ lang, initialType = 'general', initialProduct = '' }: Props) {
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
      const res = await fetch('/api/enquiry', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) {
        setResult('success');
        setWhatsappLink(data.whatsappLink ?? '');
        form.reset();
      } else setResult('error');
    } catch {
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      {result === 'success' ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="heading-3 mb-2">{t(lang, 'contact.success')}</h3>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-4 inline-flex">
              {t(lang, 'common.whatsappUs')}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t(lang, 'contact.formName')}</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formPhone')}</label>
            <input name="phone" type="tel" className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formEmail')}</label>
            <input name="email" type="email" className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formEnquiryType')}</label>
            <select name="type" defaultValue={initialType} className="input">
              {['general', 'product', 'project', 'parts', 'wholesale'].map((k) => (
                <option key={k} value={k}>{t(lang, `enquiryTypes.${k}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formProduct')}</label>
            <input name="product" defaultValue={initialProduct} className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formBrand')}</label>
            <input name="brand" className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formModel')}</label>
            <input name="model" className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formQuantity')}</label>
            <input name="quantity" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t(lang, 'contact.formMessage')}</label>
            <textarea name="message" rows={4} required className="input" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formPhoto')}</label>
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <div>
            <label className="label">{t(lang, 'contact.formVideo')}</label>
            <input name="video" type="file" accept="video/mp4,video/quicktime,video/webm" className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <div className="sm:col-span-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5">
              {submitting ? t(lang, 'common.loading') : t(lang, 'contact.formSubmit')}
            </button>
          </div>
          {result === 'error' && (
            <div className="sm:col-span-2 text-sm text-red-600">{t(lang, 'contact.error')}</div>
          )}
        </form>
      )}
    </div>
  );
}
