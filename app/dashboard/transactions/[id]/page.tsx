'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { ApiResponse, SaleHeaderDTO, InvoiceHeaderDTO, InvoiceSignatureDTO, InvoiceNoteDTO } from '@/lib/types';
import {
    Printer,
    ChevronLeft,
    Download,
    Mail,
    Share2,
    CheckCircle2,
    Calendar,
    Hash,
    User,
    Package,
    Loader2,
    AlertCircle,
} from 'lucide-react';

export default function TransactionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [transaction, setTransaction] = useState<SaleHeaderDTO | null>(null);
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceHeaderDTO | null>(null);
    const [signatures, setSignatures] = useState<InvoiceSignatureDTO[]>([]);
    const [notes, setNotes] = useState<InvoiceNoteDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [txRes, invHeadersRes] = await Promise.all([
                api.get<ApiResponse<SaleHeaderDTO>>(`/api/sales/transactions/${id}`),
                api.get<ApiResponse<InvoiceHeaderDTO[]>>('/api/invoices/headers'),
            ]);

            if (txRes.data?.payload) {
                setTransaction(txRes.data.payload);

                // If we have invoice settings, fetch related signatures and notes
                if (invHeadersRes.data?.payload && invHeadersRes.data.payload.length > 0) {
                    const header = invHeadersRes.data.payload[0];
                    setInvoiceSettings(header);

                    const [sigRes, noteRes] = await Promise.all([
                        api.get<ApiResponse<InvoiceSignatureDTO[]>>(`/api/invoices/headers/${header.id}/signatures`),
                        api.get<ApiResponse<InvoiceNoteDTO[]>>(`/api/invoices/headers/${header.id}/notes`),
                    ]);

                    if (sigRes.data?.payload) setSignatures(sigRes.data.payload);
                    if (noteRes.data?.payload) setNotes(noteRes.data.payload);
                }
            } else {
                setError('Transaction not found');
            }
        } catch (err) {
            console.error('Failed to load transaction:', err);
            setError('Failed to load transaction data. It might have been deleted or moved.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin-slow" size={40} color="var(--accent-cyan)" />
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <AlertCircle size={48} color="var(--accent-red)" style={{ opacity: 0.5, marginBottom: 16 }} />
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Oops! Error Occurred</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
                <button className="btn-secondary" onClick={() => router.back()}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Actions Header - Hidden on Print */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <button
                    onClick={() => router.back()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
                >
                    <ChevronLeft size={20} />
                    Back to list
                </button>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={18} />
                        Download PDF
                    </button>
                    <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Printer size={18} />
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Document */}
            <div
                ref={printRef}
                className="glass-card invoice-box"
                style={{
                    background: 'white',
                    color: '#1e293b',
                    padding: '60px',
                    maxWidth: '850px',
                    margin: '0 auto',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    borderRadius: 0, // Paper feel
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 60 }}>
                    <div>
                        {invoiceSettings?.logo ? (
                            <img src={invoiceSettings.logo} alt="Logo" style={{ maxHeight: 60, marginBottom: 16 }} />
                        ) : (
                            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em', color: '#000' }}>BIZENHANCE</div>
                        )}
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 300 }}>
                            {invoiceSettings?.description || 'Your professional business management partner.'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#000', margin: '0 0 10px', textTransform: 'uppercase' }}>
                            {invoiceSettings?.invoiceName || 'INVOICE'}
                        </h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                                <span style={{ color: '#94a3b8', marginRight: 8 }}>NO:</span>
                                {transaction.saleNumber}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                                <span style={{ color: '#94a3b8', marginRight: 8 }}>DATE:</span>
                                {new Date(transaction.saleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                                <span style={{ color: '#94a3b8', marginRight: 8 }}>STATUS:</span>
                                <span style={{ color: '#10b981' }}>{transaction.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginBottom: 60, padding: '30px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>Billed To</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 4 }}>General Customer</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Walk-in Client</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>Handled By</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 4 }}>{transaction.createdByUserName}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>POS Cashier</div>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: 60 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                                <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: 100 }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: 150 }}>Price</th>
                                <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: 150 }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transaction.lines?.map((line, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px', fontSize: 14 }}>
                                        <div style={{ fontWeight: 700, color: '#000' }}>{line.itemName}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>SKU: {line.itemCode || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '20px', fontSize: 14, textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{line.quantity}</td>
                                    <td style={{ padding: '20px', fontSize: 14, textAlign: 'right', color: '#1e293b' }}>${line.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding: '20px', fontSize: 14, textAlign: 'right', color: '#000', fontWeight: 700 }}>${line.totalPrice.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 80 }}>
                    <div style={{ width: 300 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 14, color: '#64748b' }}>Subtotal</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>${transaction.totalAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 14, color: '#64748b' }}>Tax (0%)</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>$0.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 0', alignItems: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#000' }}>Total Amount</span>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#000' }}>${transaction.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Signatures Row */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(signatures.length, 1)}, 1fr)`, gap: 40, marginBottom: 60, textAlign: 'center' }}>
                    {signatures.length > 0 ? signatures.map(sig => (
                        <div key={sig.id}>
                            <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 12 }}>
                                <div style={{ fontSize: 20, fontFamily: 'cursive', color: '#64748b' }}>{sig.signature || '________________'}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>{sig.signatureName}</div>
                        </div>
                    )) : (
                        <>
                            <div>
                                <div style={{ height: 60, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}></div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Customer Signature</div>
                            </div>
                            <div>
                                <div style={{ height: 60, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}></div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Authorized Signatory</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Notes */}
                {notes.length > 0 && (
                    <div style={{ padding: '30px', background: '#f8fafc', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Terms & Notes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {notes.map(note => (
                                <div key={note.id}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>{note.noteTitle}:</div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{note.note}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 60, fontSize: 11, color: '#94a3b8' }}>
                    This is a computer-generated document. No signature is required unless specified.
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-box, .invoice-box * { visibility: visible; }
          .invoice-box {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
        </div>
    );
}
