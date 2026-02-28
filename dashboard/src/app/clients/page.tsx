'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

type Section = 'basics' | 'brand' | 'integrations';
type AssetFile = {
  name: string;
  path: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
};

const EMPTY_FORM = {
  name: '', email: '', company: '', industry: '', domain: '', website: '', website_assets: '',
  tone_of_voice: '', status: 'active', tagline: '', notes: '',
  poc_contacts: '',

  brand_assets_hub: '',
  brand_asset_links: '',
  social_instagram: '', social_linkedin: '', social_twitter: '', social_tiktok: '', social_facebook: '',
  social_meta: '', social_youtube: '', social_threads: '', social_pinterest: '', social_other: '',

  ga4_property_id: '', gsc_property: '', google_ads_id: '',
  integration_registry: '', enabled_channels: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [activeSection, setActiveSection] = useState<Section>('basics');
  const [integrationPick, setIntegrationPick] = useState('GA4');
  const [brandFiles, setBrandFiles] = useState<AssetFile[]>([]);
  const [docFiles, setDocFiles] = useState<AssetFile[]>([]);
  const [uploading, setUploading] = useState(false);

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
      brand_assets_hub: client.visual_style?.brand_assets_hub || '',
      brand_asset_links: client.visual_style?.brand_asset_links || '',

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
      notes: formData.notes || null,

      ga4_property_id: formData.ga4_property_id || null,
      gsc_property: formData.gsc_property || null,
      google_ads_id: formData.google_ads_id || null,

      visual_style: {
        website_assets: formData.website_assets || null,
        poc_contacts: formData.poc_contacts || null,
        brand_assets_hub: formData.brand_assets_hub || null,
        brand_asset_links: formData.brand_asset_links || null,
        brand_files: brandFiles,
        client_documents: docFiles,
      },
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
      const { data, error } = await supabase.from('clients').insert([payload]).select('id').single();
      if (!error && data?.id) {
        setEditingId(data.id);
      }
    }

    await fetchClients();

    if (editingId) {
      setShowForm(false);
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
      setBrandFiles([]);
      setDocFiles([]);
    }
  }

  function handleEdit(client: any) {
    setFormData(flattenForEdit(client));
    setEditingId(client.id);
    setBrandFiles(client.visual_style?.brand_files || []);
    setDocFiles(client.visual_style?.client_documents || []);
    setShowForm(true);
    setActiveSection('basics');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
  }

  async function uploadFiles(files: FileList | null, kind: 'brand' | 'documents') {
    if (!files?.length) return;
    if (!editingId) {
      alert('Save the client first, then upload files.');
      return;
    }

    setUploading(true);

    try {
      const uploaded: AssetFile[] = [];

      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/\s+/g, '_');
        const path = `clients/${editingId}/${kind}/${Date.now()}_${safeName}`;

        const { error } = await supabase.storage.from('client-assets').upload(path, file);
        if (error) throw error;

        const { data } = supabase.storage.from('client-assets').getPublicUrl(path);

        uploaded.push({
          name: file.name,
          path,
          url: data.publicUrl,
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploaded_at: new Date().toISOString(),
        });
      }

      if (kind === 'brand') {
        setBrandFiles(prev => [...prev, ...uploaded]);
      } else {
        setDocFiles(prev => [...prev, ...uploaded]);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(file: AssetFile, kind: 'brand' | 'documents') {
    if (!confirm(`Remove ${file.name}?`)) return;

    await supabase.storage.from('client-assets').remove([file.path]);

    if (kind === 'brand') {
      setBrandFiles(prev => prev.filter(f => f.path !== file.path));
    } else {
      setDocFiles(prev => prev.filter(f => f.path !== file.path));
    }
  }

  function addIntegrationFromPicker() {
    const current = formData.enabled_channels ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!current.includes(integrationPick)) {
      set('enabled_channels', [...current, integrationPick].join(', '));
    }
  }

  function removeIntegration(name: string) {
    const current = formData.enabled_channels ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean) : [];
    set('enabled_channels', current.filter(x => x !== name).join(', '));
  }

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));
  const enabledChannels = formData.enabled_channels ? formData.enabled_channels.split(',').map(s => s.trim()).filter(Boolean) : [];

  const s = {
    card: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 16 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none' } as React.CSSProperties,
    label: { color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' } as React.CSSProperties,
    field: { marginBottom: 16 } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
    row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', minHeight: 90, resize: 'vertical' as const } as React.CSSProperties,
    tab: (active: boolean) => ({ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: active ? '#3b82f6' : '#334155', color: active ? '#fff' : '#94a3b8' }) as React.CSSProperties,
    sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 16 } as React.CSSProperties,
    hint: { color: '#64748b', fontSize: 11, marginTop: 4 } as React.CSSProperties,
    chip: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#334155', color: '#e2e8f0', fontSize: 12, borderRadius: 999, padding: '6px 10px' } as React.CSSProperties,
    btn: (color: string) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: color, color: '#fff' }) as React.CSSProperties,
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
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ ...EMPTY_FORM }); setBrandFiles([]); setDocFiles([]); setActiveSection('basics'); }} style={s.btn('#3b82f6')}>
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
                    <div style={s.field}><label style={s.label}>Name *</label><input style={s.input} value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Client name" required /></div>
                    <div style={s.field}><label style={s.label}>Company</label><input style={s.input} value={formData.company} onChange={e => set('company', e.target.value)} placeholder="Company name" /></div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}><label style={s.label}>Email</label><input style={s.input} type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="contact@client.com" /></div>
                    <div style={s.field}><label style={s.label}>Industry</label><input style={s.input} value={formData.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Fintech, SaaS, E-commerce" /></div>
                  </div>
                  <div style={s.row}>
                    <div style={s.field}><label style={s.label}>Primary Website (Root Domain)</label><input style={s.input} value={formData.domain} onChange={e => set('domain', e.target.value)} placeholder="client.com" /><div style={s.hint}>Canonical domain for analytics mapping.</div></div>
                    <div style={s.field}><label style={s.label}>Primary URL</label><input style={s.input} value={formData.website} onChange={e => set('website', e.target.value)} placeholder="https://client.com" /></div>
                  </div>
                  <div style={s.field}><label style={s.label}>Additional Web Assets</label><textarea style={s.textarea} value={formData.website_assets} onChange={e => set('website_assets', e.target.value)} placeholder={'Subdomains/folders, one per line\nblog.client.com\nclient.com/es/'} /></div>
                  <div style={s.field}><label style={s.label}>Points of Contact (Multiple)</label><textarea style={s.textarea} value={formData.poc_contacts} onChange={e => set('poc_contacts', e.target.value)} placeholder={'One per line: Name | Role | Email | Phone'} /></div>
                  <div style={s.row}>
                    <div style={s.field}><label style={s.label}>Tagline</label><input style={s.input} value={formData.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Brand tagline" /></div>
                    <div style={s.field}><label style={s.label}>Status</label><select style={s.input} value={formData.status} onChange={e => set('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  </div>

                  <div style={s.sectionTitle}>Social Properties</div>
                  <div style={s.row}><div style={s.field}><label style={s.label}>Instagram</label><input style={s.input} value={formData.social_instagram} onChange={e => set('social_instagram', e.target.value)} placeholder="@handle" /></div><div style={s.field}><label style={s.label}>LinkedIn</label><input style={s.input} value={formData.social_linkedin} onChange={e => set('social_linkedin', e.target.value)} placeholder="company/page" /></div></div>
                  <div style={s.row3}><div style={s.field}><label style={s.label}>X / Twitter</label><input style={s.input} value={formData.social_twitter} onChange={e => set('social_twitter', e.target.value)} /></div><div style={s.field}><label style={s.label}>TikTok</label><input style={s.input} value={formData.social_tiktok} onChange={e => set('social_tiktok', e.target.value)} /></div><div style={s.field}><label style={s.label}>Facebook</label><input style={s.input} value={formData.social_facebook} onChange={e => set('social_facebook', e.target.value)} /></div></div>
                  <div style={s.row3}><div style={s.field}><label style={s.label}>Meta Business</label><input style={s.input} value={formData.social_meta} onChange={e => set('social_meta', e.target.value)} /></div><div style={s.field}><label style={s.label}>YouTube</label><input style={s.input} value={formData.social_youtube} onChange={e => set('social_youtube', e.target.value)} /></div><div style={s.field}><label style={s.label}>Threads</label><input style={s.input} value={formData.social_threads} onChange={e => set('social_threads', e.target.value)} /></div></div>
                  <div style={s.row}><div style={s.field}><label style={s.label}>Pinterest</label><input style={s.input} value={formData.social_pinterest} onChange={e => set('social_pinterest', e.target.value)} /></div><div style={s.field}><label style={s.label}>Other</label><input style={s.input} value={formData.social_other} onChange={e => set('social_other', e.target.value)} /></div></div>

                  <div style={s.field}><label style={s.label}>Notes</label><textarea style={s.textarea} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context" /></div>
                </div>
              )}

              {activeSection === 'brand' && (
                <div>
                  <div style={s.sectionTitle}>Brand Asset Intake</div>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>No manual brand fields. Upload source files (guidelines, logos, contracts, briefs) directly.</p>

                  <div style={s.field}>
                    <label style={s.label}>Tone of Voice (optional)</label>
                    <input style={s.input} value={formData.tone_of_voice} onChange={e => set('tone_of_voice', e.target.value)} placeholder="Can be filled later from brand docs" />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Primary Brand Asset Hub (optional)</label>
                    <input style={s.input} value={formData.brand_assets_hub} onChange={e => set('brand_assets_hub', e.target.value)} placeholder="Drive/Dropbox/etc main folder" />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Brand Asset Links (multiple + typed)</label>
                    <textarea
                      style={s.textarea}
                      value={formData.brand_asset_links}
                      onChange={e => set('brand_asset_links', e.target.value)}
                      placeholder={"One per line: Type | URL | Notes\nLogos | https://... | Main logo pack\nVoice & Tone | https://... | Brand voice guidelines\nTemplates | https://... | Social templates"}
                    />
                    <div style={s.hint}>Use types like: Logos, Isotypes, Voice & Tone, Guidelines, Templates, Creative Assets, Other.</div>
                  </div>

                  <div style={{ ...s.card, padding: 16 }}>
                    <label style={s.label}>Upload Brand Files (logos, guidelines, assets)</label>
                    <input type="file" multiple onChange={e => uploadFiles(e.target.files, 'brand')} disabled={!editingId || uploading} />
                    {!editingId && <div style={s.hint}>Save client first to enable uploads.</div>}
                    {brandFiles.length > 0 && (
                      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {brandFiles.map(file => (
                          <div key={file.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: 8, borderRadius: 6 }}>
                            <a href={file.url} target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>{file.name}</a>
                            <button type="button" onClick={() => removeFile(file, 'brand')} style={s.btn('#b91c1c')}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ ...s.card, padding: 16, marginTop: 16 }}>
                    <label style={s.label}>Upload Client Documents (SOW, contracts, briefs)</label>
                    <input type="file" multiple onChange={e => uploadFiles(e.target.files, 'documents')} disabled={!editingId || uploading} />
                    {!editingId && <div style={s.hint}>Save client first to enable uploads.</div>}
                    {docFiles.length > 0 && (
                      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {docFiles.map(file => (
                          <div key={file.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: 8, borderRadius: 6 }}>
                            <a href={file.url} target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>{file.name}</a>
                            <button type="button" onClick={() => removeFile(file, 'documents')} style={s.btn('#b91c1c')}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'integrations' && (
                <div>
                  <div style={s.sectionTitle}>Integrations & Digital Channels</div>
                  <div style={s.row}>
                    <div style={s.field}>
                      <label style={s.label}>Add Channel / Integration</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select style={s.input} value={integrationPick} onChange={e => setIntegrationPick(e.target.value)}>
                          <option>GA4</option><option>GSC</option><option>GTM</option><option>Google Ads</option><option>Meta Ads</option><option>Bing Ads</option><option>LinkedIn Ads</option><option>TikTok Ads</option><option>Email/CRM</option><option>SEO</option><option>Web/CRO</option>
                        </select>
                        <button type="button" onClick={addIntegrationFromPicker} style={s.btn('#2563eb')}>Add</button>
                      </div>
                    </div>
                    <div style={s.field}><label style={s.label}>Enabled (CSV)</label><input style={s.input} value={formData.enabled_channels} onChange={e => set('enabled_channels', e.target.value)} placeholder="GA4, Meta Ads, Bing Ads" /></div>
                  </div>

                  {enabledChannels.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {enabledChannels.map(ch => (
                        <span key={ch} style={s.chip}>{ch}<button type="button" onClick={() => removeIntegration(ch)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button></span>
                      ))}
                    </div>
                  )}

                  <div style={s.field}><label style={s.label}>Integration Registry Details</label><textarea style={s.textarea} value={formData.integration_registry} onChange={e => set('integration_registry', e.target.value)} placeholder={'One per line: Integration | Account/Property ID | Status | Notes'} /></div>
                  <div style={s.row3}><div style={s.field}><label style={s.label}>GSC Property</label><input style={s.input} value={formData.gsc_property} onChange={e => set('gsc_property', e.target.value)} /></div><div style={s.field}><label style={s.label}>GA4 Property ID</label><input style={s.input} value={formData.ga4_property_id} onChange={e => set('ga4_property_id', e.target.value)} /></div><div style={s.field}><label style={s.label}>Google Ads Account ID</label><input style={s.input} value={formData.google_ads_id} onChange={e => set('google_ads_id', e.target.value)} /></div></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
                <button type="submit" style={s.btn('#22c55e')}>{editingId ? 'Update' : 'Create'} Client</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ ...EMPTY_FORM }); setBrandFiles([]); setDocFiles([]); }} style={s.btn('#475569')}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</p>
        ) : clients.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: 60 }}><p style={{ color: '#64748b', fontSize: 16 }}>No clients yet. Add your first client to get started.</p></div>
        ) : (
          clients.map(client => (
            <div key={client.id} style={s.clientCard}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{client.name}</span>
                  <span style={{ background: client.status === 'active' ? '#166534' : '#334155', color: client.status === 'active' ? '#4ade80' : '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{client.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13 }}>
                  {client.company && <span>{client.company}</span>}
                  {client.industry && <span>• {client.industry}</span>}
                  {client.domain && <span>• {client.domain}</span>}
                </div>
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
