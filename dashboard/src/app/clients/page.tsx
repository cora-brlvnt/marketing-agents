'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

const EMPTY_FORM = {
  name: '', email: '', company: '', industry: '', domain: '', tone_of_voice: '',
  status: 'active', tagline: '', logo_url: '', website: '', notes: '',
  ga4_property_id: '', gsc_property: '', google_ads_id: '',
  colors_primary: '', colors_secondary: '', colors_accent: '',
  typo_headline: '', typo_body: '',
  style_imagery: '', style_whitespace: '', style_contrast: '',
  target_audiences: '',
  key_values: '',
  positioning: '', primary_benefit: '', cta_style: '',
  social_instagram: '', social_linkedin: '', social_twitter: '', social_tiktok: '', social_facebook: '',
  dos: '', donts: '',
};

type Section = 'basics' | 'brand' | 'visual' | 'strategy' | 'integrations';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [activeSection, setActiveSection] = useState<Section>('basics');

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  function flattenForEdit(client: any) {
    return {
      name: client.name || '', email: client.email || '', company: client.company || '',
      industry: client.industry || '', domain: client.domain || '',
      tone_of_voice: client.tone_of_voice || '', status: client.status || 'active',
      tagline: client.tagline || '', logo_url: client.logo_url || '',
      website: client.website || '', notes: client.notes || '',
      ga4_property_id: client.ga4_property_id || '', gsc_property: client.gsc_property || '',
      google_ads_id: client.google_ads_id || '',
      colors_primary: client.colors?.primary || '', colors_secondary: client.colors?.secondary || '',
      colors_accent: client.colors?.accent || '',
      typo_headline: client.typography?.headline_font || '', typo_body: client.typography?.body_font || '',
      style_imagery: client.visual_style?.imagery || '', style_whitespace: client.visual_style?.whitespace || '',
      style_contrast: client.visual_style?.contrast || '',
      target_audiences: (client.target_audiences || []).join(', '),
      key_values: (client.key_values || []).join(', '),
      positioning: client.ad_strategy?.positioning || '',
      primary_benefit: client.ad_strategy?.primary_benefit || '',
      cta_style: client.ad_strategy?.cta_style || '',
      social_instagram: client.social_handles?.instagram || '',
      social_linkedin: client.social_handles?.linkedin || '',
      social_twitter: client.social_handles?.twitter || '',
      social_tiktok: client.social_handles?.tiktok || '',
      social_facebook: client.social_handles?.facebook || '',
      dos: (client.dos || []).join(', '),
      donts: (client.donts || []).join(', '),
    };
  }

  function buildPayload() {
    return {
      name: formData.name,
      email: formData.email || null,
      company: formData.company || null,
      industry: formData.industry || null,
      domain: formData.domain || null,
      tone_of_voice: formData.tone_of_voice || null,
      status: formData.status,
      tagline: formData.tagline || null,
      logo_url: formData.logo_url || null,
      website: formData.website || null,
      notes: formData.notes || null,
      ga4_property_id: formData.ga4_property_id || null,
      gsc_property: formData.gsc_property || null,
      google_ads_id: formData.google_ads_id || null,
      colors: {
        primary: formData.colors_primary || null,
        secondary: formData.colors_secondary || null,
        accent: formData.colors_accent || null,
      },
      typography: {
        headline_font: formData.typo_headline || null,
        body_font: formData.typo_body || null,
      },
      visual_style: {
        imagery: formData.style_imagery || null,
        whitespace: formData.style_whitespace || null,
        contrast: formData.style_contrast || null,
      },
      target_audiences: formData.target_audiences ? formData.target_audiences.split(',').map(s => s.trim()).filter(Boolean) : [],
      key_values: formData.key_values ? formData.key_values.split(',').map(s => s.trim()).filter(Boolean) : [],
      ad_strategy: {
        positioning: formData.positioning || null,
        primary_benefit: formData.primary_benefit || null,
        cta_style: formData.cta_style || null,
      },
      social_handles: {
        instagram: formData.social_instagram || null,
        linkedin: formData.social_linkedin || null,
        twitter: formData.social_twitter || null,
        tiktok: formData.social_tiktok || null,
        facebook: formData.social_facebook || null,
      },
      dos: formData.dos ? formData.dos.split(',').map(s => s.trim()).filter(Boolean) : [],
      donts: formData.donts ? formData.donts.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    if (editingId) {
      await supabase.from('clients').update(payload).eq('id', editingId);
    } else {
      await supabase.from('clients').insert([payload]);
    }
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
    fetchClients();
  }

  function handleEdit(client: any) {
    setFormData(flattenForEdit(client));
    setEditingId(client.id);
    setShowForm(true);
    setActiveSection('basics');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
  }

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const s = {
    card: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 16 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none' } as React.CSSProperties,
    label: { color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    field: { marginBottom: 16 } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
    row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical' as const } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
      background: active ? '#3b82f6' : '#334155', color: active ? '#fff' : '#94a3b8',
    }) as React.CSSProperties,
    sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 16 } as React.CSSProperties,
    hint: { color: '#64748b', fontSize: 11, marginTop: 4 } as React.CSSProperties,
    btn: (color: string) => ({
      padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
      background: color, color: '#fff',
    }) as React.CSSProperties,
    clientCard: { background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Clients</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Manage your client portfolio</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ ...EMPTY_FORM }); setActiveSection('basics'); }} style={s.btn('#3b82f6')}>
            + Add Client
          </button>
        </div>

        {showForm && (
          <div style={s.card}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'New'} Client</h2>
                <span style={{ color: '#64748b', fontSize: 12 }}>* Only Name is required</span>
              </div>

              {/* Section Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {([
                  ['basics', '📋 Basics'],
                  ['brand', '🎨 Brand'],
                  ['visual', '👁️ Visual'],
                  ['strategy', '🎯 Strategy'],
                  ['integrations', '🔗 Integrations'],
                ] as [Section, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setActiveSection(key)} style={s.tab(activeSection === key)}>
                    {label}
                  </button>
                ))}
              </div>

              {/* BASICS */}
              {activeSection === 'basics' && (
                <div>
                  <div style={s.sectionTitle}>Basic Information</div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Name *</label>
                      <input style={s.input} value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Client name" required />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Company</label>
                      <input style={s.input} value={formData.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
                    </div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Email</label>
                      <input style={s.input} type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="contact@client.com" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Industry</label>
                      <input style={s.input} value={formData.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Fintech, SaaS, E-commerce" />
                    </div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Website / Domain</label>
                      <input style={s.input} value={formData.domain} onChange={e => set('domain', e.target.value)} placeholder="client.com" />
                      <div style={s.hint}>Used for GSC/GA4 data lookups</div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Website URL</label>
                      <input style={s.input} value={formData.website} onChange={e => set('website', e.target.value)} placeholder="https://client.com" />
                    </div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Tagline</label>
                      <input style={s.input} value={formData.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Your brand tagline" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Status</label>
                      <select style={s.input} value={formData.status} onChange={e => set('status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Notes</label>
                    <textarea style={s.textarea} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional context about this client..." />
                  </div>
                </div>
              )}

              {/* BRAND */}
              {activeSection === 'brand' && (
                <div>
                  <div style={s.sectionTitle}>Brand Identity</div>
                  <div style={s.field}>
                    <label style={s.label}>Tone of Voice</label>
                    <input style={s.input} value={formData.tone_of_voice} onChange={e => set('tone_of_voice', e.target.value)} placeholder="e.g. Professional, Bold, Friendly, Authoritative" />
                  </div>
                  <div style={s.row3}>
                    <div style={s.field}>
                      <label style={s.label}>Primary Color</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="color" value={formData.colors_primary || '#1a1a1a'} onChange={e => set('colors_primary', e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        <input style={{ ...s.input, flex: 1 }} value={formData.colors_primary} onChange={e => set('colors_primary', e.target.value)} placeholder="#1a1a1a" />
                      </div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Secondary Color</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="color" value={formData.colors_secondary || '#0f7ba7'} onChange={e => set('colors_secondary', e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        <input style={{ ...s.input, flex: 1 }} value={formData.colors_secondary} onChange={e => set('colors_secondary', e.target.value)} placeholder="#0f7ba7" />
                      </div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Accent Color</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="color" value={formData.colors_accent || '#e8e4df'} onChange={e => set('colors_accent', e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        <input style={{ ...s.input, flex: 1 }} value={formData.colors_accent} onChange={e => set('colors_accent', e.target.value)} placeholder="#e8e4df" />
                      </div>
                    </div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Headline Font</label>
                      <input style={s.input} value={formData.typo_headline} onChange={e => set('typo_headline', e.target.value)} placeholder="e.g. Inter, Playfair Display" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Body Font</label>
                      <input style={s.input} value={formData.typo_body} onChange={e => set('typo_body', e.target.value)} placeholder="e.g. Inter, Open Sans" />
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Logo URL</label>
                    <input style={s.input} value={formData.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://... or path to logo" />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Target Audiences</label>
                    <input style={s.input} value={formData.target_audiences} onChange={e => set('target_audiences', e.target.value)} placeholder="Active traders, Beginners, Institutional investors (comma-separated)" />
                    <div style={s.hint}>Comma-separated list of audience segments</div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Key Brand Values</label>
                    <input style={s.input} value={formData.key_values} onChange={e => set('key_values', e.target.value)} placeholder="Trust, Innovation, Simplicity (comma-separated)" />
                  </div>
                </div>
              )}

              {/* VISUAL */}
              {activeSection === 'visual' && (
                <div>
                  <div style={s.sectionTitle}>Visual Style</div>
                  <div style={s.field}>
                    <label style={s.label}>Imagery Style</label>
                    <input style={s.input} value={formData.style_imagery} onChange={e => set('style_imagery', e.target.value)} placeholder="e.g. Professional photography, Minimalist illustrations, Bold graphics" />
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Whitespace</label>
                      <select style={s.input} value={formData.style_whitespace} onChange={e => set('style_whitespace', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="generous">Generous</option>
                        <option value="balanced">Balanced</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Contrast</label>
                      <select style={s.input} value={formData.style_contrast} onChange={e => set('style_contrast', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="subtle">Subtle</option>
                      </select>
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Do&apos;s</label>
                    <textarea style={s.textarea} value={formData.dos} onChange={e => set('dos', e.target.value)} placeholder="Use bold typography, Include data in visuals, Show real people (comma-separated)" />
                    <div style={s.hint}>Comma-separated. Things to always do in creative.</div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Don&apos;ts</label>
                    <textarea style={s.textarea} value={formData.donts} onChange={e => set('donts', e.target.value)} placeholder="No stock photos, Avoid jargon, Never use red (comma-separated)" />
                    <div style={s.hint}>Comma-separated. Things to never do.</div>
                  </div>
                </div>
              )}

              {/* STRATEGY */}
              {activeSection === 'strategy' && (
                <div>
                  <div style={s.sectionTitle}>Ad Strategy</div>
                  <div style={s.field}>
                    <label style={s.label}>Market Positioning</label>
                    <textarea style={s.textarea} value={formData.positioning} onChange={e => set('positioning', e.target.value)} placeholder="How does this brand position itself? e.g. Premium fintech solution for active traders" />
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Primary Benefit</label>
                      <input style={s.input} value={formData.primary_benefit} onChange={e => set('primary_benefit', e.target.value)} placeholder="Main benefit to emphasize" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>CTA Style</label>
                      <input style={s.input} value={formData.cta_style} onChange={e => set('cta_style', e.target.value)} placeholder="e.g. Action-oriented, Professional, Urgent" />
                    </div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Social Media Handles</label>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={{ ...s.label, fontSize: 11 }}>Instagram</label>
                      <input style={s.input} value={formData.social_instagram} onChange={e => set('social_instagram', e.target.value)} placeholder="@handle" />
                    </div>
                    <div style={s.field}>
                      <label style={{ ...s.label, fontSize: 11 }}>LinkedIn</label>
                      <input style={s.input} value={formData.social_linkedin} onChange={e => set('social_linkedin', e.target.value)} placeholder="company/name" />
                    </div>
                  </div>
                  <div style={s.row3}>
                    <div style={s.field}>
                      <label style={{ ...s.label, fontSize: 11 }}>X / Twitter</label>
                      <input style={s.input} value={formData.social_twitter} onChange={e => set('social_twitter', e.target.value)} placeholder="@handle" />
                    </div>
                    <div style={s.field}>
                      <label style={{ ...s.label, fontSize: 11 }}>TikTok</label>
                      <input style={s.input} value={formData.social_tiktok} onChange={e => set('social_tiktok', e.target.value)} placeholder="@handle" />
                    </div>
                    <div style={s.field}>
                      <label style={{ ...s.label, fontSize: 11 }}>Facebook</label>
                      <input style={s.input} value={formData.social_facebook} onChange={e => set('social_facebook', e.target.value)} placeholder="page name" />
                    </div>
                  </div>
                </div>
              )}

              {/* INTEGRATIONS */}
              {activeSection === 'integrations' && (
                <div>
                  <div style={s.sectionTitle}>API Integrations</div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Connect data sources so agents can pull real performance data for this client.</p>
                  <div style={s.field}>
                    <label style={s.label}>GSC Property</label>
                    <input style={s.input} value={formData.gsc_property} onChange={e => set('gsc_property', e.target.value)} placeholder="sc-domain:client.com or https://client.com/" />
                    <div style={s.hint}>Google Search Console property. Vision agent uses this for search data.</div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>GA4 Property ID</label>
                    <input style={s.input} value={formData.ga4_property_id} onChange={e => set('ga4_property_id', e.target.value)} placeholder="properties/123456789" />
                    <div style={s.hint}>Google Analytics 4 property. Nova agent uses this for traffic data.</div>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Google Ads Account ID</label>
                    <input style={s.input} value={formData.google_ads_id} onChange={e => set('google_ads_id', e.target.value)} placeholder="123-456-7890" />
                    <div style={s.hint}>Apex agent uses this for PPC performance data.</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
                <button type="submit" style={s.btn('#22c55e')}>{editingId ? 'Update' : 'Create'} Client</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={s.btn('#475569')}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Client List */}
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</p>
        ) : clients.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#64748b', fontSize: 16 }}>No clients yet. Add your first client to get started.</p>
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} style={s.clientCard}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{client.name}</span>
                  <span style={{
                    background: client.status === 'active' ? '#166534' : '#334155',
                    color: client.status === 'active' ? '#4ade80' : '#94a3b8',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                  }}>{client.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13 }}>
                  {client.company && <span>{client.company}</span>}
                  {client.industry && <span>• {client.industry}</span>}
                  {client.domain && <span>• {client.domain}</span>}
                </div>
                {client.tone_of_voice && (
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Voice: {client.tone_of_voice}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(client)} style={s.btn('#3b82f6')}>Edit</button>
                <button onClick={() => handleDelete(client.id)} style={s.btn('#dc2626')}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
