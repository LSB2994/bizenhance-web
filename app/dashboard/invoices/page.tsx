'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, InvoiceHeaderDTO, InvoiceSignatureDTO, InvoiceNoteDTO } from '@/lib/types';
import {
    FileText,
    Plus,
    Trash2,
    Save,
    Image as ImageIcon,
    Type,
    AlignLeft,
    Settings2,
    Loader2,
    CheckCircle2,
    Signature,
    StickyNote,
} from 'lucide-react';

export default function InvoicesPage() {
    const [header, setHeader] = useState<InvoiceHeaderDTO | null>(null);
    const [signatures, setSignatures] = useState<InvoiceSignatureDTO[]>([]);
    const [notes, setNotes] = useState<InvoiceNoteDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch the first invoice header for the business
            const { data } = await api.get<ApiResponse<InvoiceHeaderDTO[]>>('/api/invoices/headers');
            if (data?.payload && data.payload.length > 0) {
                const h = data.payload[0];
                setHeader(h);

                // Fetch relations
                const [sigRes, noteRes] = await Promise.all([
                    api.get<ApiResponse<InvoiceSignatureDTO[]>>(`/api/invoices/headers/${h.id}/signatures`),
                    api.get<ApiResponse<InvoiceNoteDTO[]>>(`/api/invoices/headers/${h.id}/notes`),
                ]);

                if (sigRes.data?.payload) setSignatures(sigRes.data.payload);
                if (noteRes.data?.payload) setNotes(noteRes.data.payload);
            }
        } catch (error) {
            console.error('Failed to load invoice settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveHeader = async () => {
        if (!header) return;
        setIsSaving(true);
        try {
            await api.put(`/api/invoices/headers/${header.id}`, header);
            setSuccessMsg('Settings saved successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin-slow" size={40} color="var(--accent-cyan)" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Invoice Settings
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Customize your professional invoice templates
                    </p>
                </div>
                <button className="btn-primary" onClick={handleSaveHeader} disabled={isSaving || !header}>
                    {isSaving ? <Loader2 size={18} className="animate-spin-slow" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            {successMsg && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px 16px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }} className="animate-fade-in">
                    <CheckCircle2 size={18} /> {successMsg}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Header Section */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Settings2 size={18} color="var(--accent-cyan)" />
                            Basic Layout
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">Invoice Name (Display Title)</label>
                                <div style={{ position: 'relative' }}>
                                    <Type size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: 44 }}
                                        value={header?.invoiceName || ''}
                                        onChange={(e) => setHeader(h => h ? { ...h, invoiceName: e.target.value } : null)}
                                        placeholder="e.g. OFFICIAL INVOICE"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Header Description</label>
                                <div style={{ position: 'relative' }}>
                                    <AlignLeft size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                                    <textarea
                                        className="input-field"
                                        style={{ paddingLeft: 44, resize: 'none' }}
                                        rows={3}
                                        value={header?.description || ''}
                                        onChange={(e) => setHeader(h => h ? { ...h, description: e.target.value } : null)}
                                        placeholder="Add company details, tax ID, or address..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Logo URL</label>
                                <div style={{ position: 'relative' }}>
                                    <ImageIcon size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: 44 }}
                                        value={header?.logo || ''}
                                        onChange={(e) => setHeader(h => h ? { ...h, logo: e.target.value } : null)}
                                        placeholder="https://yourbrand.com/logo.png"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <StickyNote size={18} color="var(--accent-cyan)" />
                                Terms & Notes
                            </h3>
                            <button className="icon-btn" title="Add note"><Plus size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {notes.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No terms or notes added</p>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{note.noteTitle}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{note.note}</div>
                                        </div>
                                        <button className="icon-btn" style={{ color: 'var(--accent-red)' }}><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Preview & Signatures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Signatures */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Signature size={18} color="var(--accent-cyan)" />
                                Signatories
                            </h3>
                            <button className="icon-btn"><Plus size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {signatures.map(sig => (
                                <div key={sig.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{sig.signatureName}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'cursive', marginTop: 4 }}>{sig.signature || 'No digital signature set'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Preview */}
                    <div className="glass-card" style={{ padding: 20, background: 'white', color: 'black' }}>
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
                            {header?.logo ? (
                                <img src={header.logo} alt="Logo" style={{ height: 32, marginBottom: 8 }} />
                            ) : (
                                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>BRAND</div>
                            )}
                            <div style={{ fontSize: 10, fontWeight: 800 }}>{header?.invoiceName || 'INVOICE'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ height: 6, width: '100%', background: '#f5f5f5', borderRadius: 2 }} />
                            <div style={{ height: 6, width: '80%', background: '#f5f5f5', borderRadius: 2 }} />
                            <div style={{ height: 6, width: '60%', background: '#f5f5f5', borderRadius: 2 }} />
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 8, color: '#999' }}>
                            {header?.description ? header.description.substring(0, 50) + '...' : 'Template footer and notes...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
