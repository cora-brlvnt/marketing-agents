'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

const EMPTY_FORM = {
  name: '', email: '', company: '', industry: '', domain: '', website: '', website_assets: '',
  tone_of_voice: '', status: 'active', tagline: '', notes: '',
  poc_contacts: '',

  colors_primary: '', colors_secondary: '', colors_accent: '',
  typo_headline: '', typo_body: '',
  logo_url: '', target_audiences: '', key_values: '',
  brand_assets_hub: '', documents_links: '',

  social_instagram: '', social_linkedin: '', social_twitter: '', social_tiktok: '', social_facebook: '',
  social_meta: '', social_youtube: '', social_threads: '', social_pinterest: '', social_other: '',

  ga4_property_id: '', gsc_property: '', google_ads_id: '',
  integration_registry: '', enabled_channels: '',
};

type Section = 'basics' | 'brand' | 'integrations';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [activeSection, setActiveSection] = useState<Section>('basics');
  const [integrationPick, setIntegrationPick] = useState('GA4');

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  function flattenForEdit(client: any) {
    return {
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      industry: client.industry || '',
      domain: client.domain || '',
      website: client.website || '',
      website_assets: client.visual_style?.website_assets || '',
      tone_of_voice: client.tone_of_voice || '',
      status: client.status || 'active',
      tagline: client.tagline || '',
      notes: client.notes || '',
      poc_contacts: client.visual_style?.poc_contacts || '',

      colors_primary: client.colors?.primary || '',
      colors_secondary: client.colors?.secondary || '',
      colors_accent: client.colors?.accent || '',
      typo_headline: client.typography?.headline_font || '',
      typo_body: client.typography?.body_font || '',
      logo_url: client.logo_url || '',
      target_audiences: (client.target_audiences || []).join(', '),
      key_values: (client.key_values || []).join(', '),
      brand_assets_hub: client.visual_style?.brand_assets_hub || '',
      documents_links: client.visual_style?.documents_links || '',

      social_instagram: client.social_handles?.instagram || '',
      social_linkedin: client.social_handles?.linkedin || '',
      social_twitter: client.social_handles?.twitter || '',
      social_tiktok: client.social_handles?.tiktok || '',
      social_facebook: client.social_handles?.facebook || '',
      social_meta: client.social_handles?.meta || '',
      social_youtube: client.social_handles?.youtube || '',
      social_threads: client.social_handles?.threads || '',
      social_pinterest: client.social_handles?.pinterest || '',
      social_other: client.social_handles?.other || '',

      ga4_property_id: client.ga4_property_id || '',
      gsc_property: client.gsc_property || '',
      google_ads_id: client.google_ads_id || '',
      integration_registry: client.ad_strategy?.integration_registry || '',
      enabled_channels: (client.ad_strategy?.enabled_channels || []).join(', '),
    };
  }

  function buildPayload() {
    return {
      name: formData.name,
      email: formData.email || null,
      company: formData.company || null,
      industry: formData.industry || null,
      domain: formData.domain || null,
      website: formData.website || null,
      tone_of_voice: formData.tone_of_voice || null,
      status: formData.status,
      tagline: formData.tagline || null,
      logo_url: formData.logo_url || null,
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
        website_assets: formData.website_assets || null,
        poc_contacts: formData.poc_contacts || null,
        documents_links: formData.documents_links || null,
        brand_assets_hub: formData.brand_assets_hub || null,
      },
      target_audiences: formData.target_audiences ? formData.target_audiences.split(',').map(s => s.trim()).filter(Boolean) : [],
      key_values: formData.key_values ? formData.key_values.split(',').map(s => s.trim()).filter(Boolean) : [],
      ad_strategy: {
        integration_registry: formData.integration_registry || null,
        enabled_channels: formData.enabled_channels ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
      social_handles: {
        instagram: formData.social_instagram || null,
        linkedin: formData.social_linkedin || null,
        twitter: formData.social_twitter || null,
        tiktok: formData.social_tiktok || null,
        facebook: formData.social_facebook || null,
        meta: formData.social_meta || null,
        youtube: formData.social_youtube || null,
        threads: formData.social_threads || null,
        pinterest: formData.social_pinterest || null,
        other: formData.social_other || null,
      },
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

  function addIntegrationFromPicker() {
    const current = formData.enabled_channels
      ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    if (!current.includes(integrationPick)) {
      current.push(integrationPick);
      set('enabled_channels', current.join(', '));
    }
  }

  function removeIntegration(name: string) {
    const current = formData.enabled_channels
      ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    set('enabled_channels', current.filter(x => x !== name).join(', '));
  }

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const s = {
    card: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 16 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none' } as React.CSSProperties,
    label: { color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    field: { marginBottom: 16 } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
    row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', minHeight: 90, resize: 'vertical' as const } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
      background: active ? '#3b82f6' : '#334155', color: active ? '#fff' : '#94a3b8',
    }) as React.CSSProperties,
    sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 16 } as React.CSSProperties,
    hint: { color: '#64748b', fontSize: 11, marginTop: 4 } as React.CSSProperties,
    chip: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#334155', color: '#e2e8f0', fontSize: 12, borderRadius: 999, padding: '6px 10px' } as React.CSSProperties,
    btn: (color: string) => ({
      padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
      background: color, color: '#fff',
    }) as React.CSSProperties,
    clientCard: { background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
  };

  const enabledChannels = formData.enabled_channels
    ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean)
    : [];

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

              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {([
                  ['basics', '📋 Basics'],
                  ['brand', '🎨 Brand'],
                  ['integrations', '🔗 Integrations'],
                ] as [Section, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setActiveSection(key)} style={s.tab(activeSection === key)}>
                    {label}
                  </button>
                ))}
              </div>

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
                      <label style={s.label}>Primary Website (Root Domain)</label>
                      <input style={s.input} value={formData.domain} onChange={e => set('domain', e.target.value)} placeholder="client.com" />
                      <div style={s.hint}>Canonical domain used for analytics property mapping.</div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Primary URL</label>
                      <input style={s.input} value={formData.website} onChange={e => set('website', e.target.value)} placeholder="https://client.com" />
                    </div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Additional Web Assets</label>
                    <textarea
                      style={s.textarea}
                      value={formData.website_assets}
                      onChange={e => set('website_assets', e.target.value)}
                      placeholder={'Subdomains, folders, microsites (one per line)\nblog.client.com\nclient.com/es/\nlanding.client.com/campaign'}
                    />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Points of Contact (Multiple)</label>
                    <textarea
                      style={s.textarea}
                      value={formData.poc_contacts}
                      onChange={e => set('poc_contacts', e.target.value)}
                      placeholder={'One per line: Name | Role | Email | Phone\nJane Doe | Marketing Lead | jane@client.com | +1 ...'}
                    />
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

                  <div style={s.sectionTitle}>Social Properties</div>
                  <div style={s.row}>
                    <div style={s.field}><label style={s.label}>Instagram</label><input style={s.input} value={formData.social_instagram} onChange={e => set('social_instagram', e.target.value)} placeholder="@handle" /></div>
                    <div style={s.field}><label style={s.label}>LinkedIn</label><input style={s.input} value={formData.social_linkedin} onChange={e => set('social_linkedin', e.target.value)} placeholder="company/name" /></div>
                  </div>
                  <div style={s.row3}>
                    <div style={s.field}><label style={s.label}>X / Twitter</label><input style={s.input} value={formData.social_twitter} onChange={e => set('social_twitter', e.target.value)} placeholder="@handle" /></div>
                    <div style={s.field}><label style={s.label}>TikTok</label><input style={s.input} value={formData.social_tiktok} onChange={e => set('social_tiktok', e.target.value)} placeholder="@handle" /></div>
                    <div style={s.field}><label style={s.label}>Facebook</label><input style={s.input} value={formData.social_facebook} onChange={e => set('social_facebook', e.target.value)} placeholder="page name" /></div>
                  </div>
                  <div style={s.row3}>
                    <div style={s.field}><label style={s.label}>Meta Business</label><input style={s.input} value={formData.social_meta} onChange={e => set('social_meta', e.target.value)} placeholder="Business Manager / ad account" /></div>
                    <div style={s.field}><label style={s.label}>YouTube</label><input style={s.input} value={formData.social_youtube} onChange={e => set('social_youtube', e.target.value)} placeholder="Channel URL" /></div>
                    <div style={s.field}><label style={s.label}>Threads</label><input style={s.input} value={formData.social_threads} onChange={e => set('social_threads', e.target.value)} placeholder="@handle" /></div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}><label style={s.label}>Pinterest</label><input style={s.input} value={formData.social_pinterest} onChange={e => set('social_pinterest', e.target.value)} placeholder="Profile URL" /></div>
                    <div style={s.field}><label style={s.label}>Other Social</label><input style={s.input} value={formData.social_other} onChange={e => set('social_other', e.target.value)} placeholder="Any additional channels" /></div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Notes</label>
                    <textarea style={s.textarea} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional context about this client..." />
                  </div>
                </div>
              )}

              {activeSection === 'brand' && (
                <div>
                  <div style={s.sectionTitle}>Brand & Asset Hub</div>

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
                    <label style={s.label}>Brand Asset Hub (Drive Folder Link)</label>
                    <input style={s.input} value={formData.brand_assets_hub} onChange={e => set('brand_assets_hub', e.target.value)} placeholder="https://drive.google.com/..." />
                    <div style={s.hint}>Use this for logos, isotypes, guidelines, templates, and approved assets.</div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Documents (SOW / Contract / Briefs)</label>
                    <textarea style={s.textarea} value={formData.documents_links} onChange={e => set('documents_links', e.target.value)} placeholder={'Paste one link per line\nSOW, contract, onboarding brief, etc.'} />
                  </div>

                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Primary Logo URL (optional)</label>
                      <input style={s.input} value={formData.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Target Audiences</label>
                      <input style={s.input} value={formData.target_audiences} onChange={e => set('target_audiences', e.target.value)} placeholder="Comma-separated" />
                    </div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Key Brand Values</label>
                    <input style={s.input} value={formData.key_values} onChange={e => set('key_values', e.target.value)} placeholder="Trust, Innovation, Simplicity" />
                  </div>
                </div>
              )}

              {activeSection === 'integrations' && (
                <div>
                  <div style={s.sectionTitle}>Integrations & Digital Channels</div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                    Flexible registry. Add only channels in scope (Meta Ads, Bing Ads, etc.).
                  </p>

                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Add Channel / Integration</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select style={s.input} value={integrationPick} onChange={e => setIntegrationPick(e.target.value)}>
                          <option>GA4</option>
                          <option>GSC</option>
                          <option>GTM</option>
                          <option>Google Ads</option>
                          <option>Meta Ads</option>
                          <option>Bing Ads</option>
                          <option>LinkedIn Ads</option>
                          <option>TikTok Ads</option>
                          <option>Email/CRM</option>
                          <option>SEO</option>
                          <option>Web/CRO</option>
                        </select>
                        <button type="button" onClick={addIntegrationFromPicker} style={s.btn('#2563eb')}>Add</button>
                      </div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Enabled (CSV)</label>
                      <input style={s.input} value={formData.enabled_channels} onChange={e => set('enabled_channels', e.target.value)} placeholder="GA4, Meta Ads, Bing Ads" />
                    </div>
                  </div>

                  {enabledChannels.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {enabledChannels.map(ch => (
                        <span key={ch} style={s.chip}>
                          {ch}
                          <button type="button" onClick={() => removeIntegration(ch)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={s.field}>
                    <label style={s.label}>Integration Registry (details)</label>
                    <textarea
                      style={s.textarea}
                      value={formData.integration_registry}
                      onChange={e => set('integration_registry', e.target.value)}
                      placeholder={'One per line: Integration | Property/Account ID | Status | Notes\nMeta Ads | act_12345 | pending_access | need partner access'}
                    />
                  </div>

                  <div style={s.row3}>
                    <div style={s.field}>
                      <label style={s.label}>GSC Property</label>
                      <input style={s.input} value={formData.gsc_property} onChange={e => set('gsc_property', e.target.value)} placeholder="sc-domain:client.com" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>GA4 Property ID</label>
                      <input style={s.input} value={formData.ga4_property_id} onChange={e => set('ga4_property_id', e.target.value)} placeholder="properties/123456789" />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Google Ads Account ID</label>
                      <input style={s.input} value={formData.google_ads_id} onChange={e => set('google_ads_id', e.target.value)} placeholder="123-456-7890" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
                <button type="submit" style={s.btn('#22c55e')}>{editingId ? 'Update' : 'Create'} Client</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={s.btn('#475569')}>Cancel</button>
              </div>
            </form>
          </div>
        )}

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
