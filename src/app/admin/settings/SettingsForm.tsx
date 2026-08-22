'use client';

import { useState } from 'react';
import { saveSettingsAction } from '@/lib/actions';

type Props = { initial: Record<string, string> };

const SECTIONS = [
  {
    title: 'Company',
    fields: [
      { key: 'company_name_en', label: 'Company Name (EN)' },
      { key: 'company_name_bm', label: 'Company Name (BM)' },
      { key: 'company_name_zh', label: 'Company Name (ZH)' },
      { key: 'registration_no', label: 'Registration No.' },
      { key: 'tagline_en', label: 'Tagline (EN)' },
      { key: 'tagline_bm', label: 'Tagline (BM)' },
      { key: 'tagline_zh', label: 'Tagline (ZH)' },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'hq_address', label: 'HQ Address' },
      { key: 'hq_phone', label: 'HQ Phone' },
      { key: 'whatsapp_number', label: 'WhatsApp Number (international, no +)' },
      { key: 'email', label: 'Email' },
      { key: 'website', label: 'Website URL' },
      { key: 'facebook', label: 'Facebook URL' },
      { key: 'instagram', label: 'Instagram URL' },
    ],
  },
  {
    title: 'Hours',
    fields: [
      { key: 'opening_hours_en', label: 'Opening Hours (EN)' },
      { key: 'opening_hours_bm', label: 'Opening Hours (BM)' },
      { key: 'opening_hours_zh', label: 'Opening Hours (ZH)' },
    ],
  },
  {
    title: 'SEO Defaults',
    fields: [
      { key: 'seo_default_title_en', label: 'SEO Title (EN)' },
      { key: 'seo_default_title_bm', label: 'SEO Title (BM)' },
      { key: 'seo_default_title_zh', label: 'SEO Title (ZH)' },
      { key: 'seo_default_description_en', label: 'SEO Description (EN)' },
      { key: 'seo_default_description_bm', label: 'SEO Description (BM)' },
      { key: 'seo_default_description_zh', label: 'SEO Description (ZH)' },
    ],
  },
  {
    title: 'Footer',
    fields: [
      { key: 'footer_about_en', label: 'Footer About (EN)' },
      { key: 'footer_about_bm', label: 'Footer About (BM)' },
      { key: 'footer_about_zh', label: 'Footer About (ZH)' },
    ],
  },
];

export default function SettingsForm({ initial }: Props) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ''));
    const res = await saveSettingsAction(fd);
    setSaving(false);
    setSaved(res.ok);
    setTimeout(() => setSaved(false), 2000);
  }

  function setField(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className="card p-5">
          <h2 className="font-semibold text-brand-800 mb-4">{section.title}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {section.fields.map((f) => (
              <div key={f.key} className={f.key.includes('description') || f.key.includes('about') ? 'md:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {f.key.includes('description') || f.key.includes('about') ? (
                  <textarea
                    value={values[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    rows={3}
                    className="input"
                  />
                ) : (
                  <input
                    value={values[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5">
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>
    </form>
  );
}
