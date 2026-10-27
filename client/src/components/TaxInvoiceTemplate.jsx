import React from 'react';
import uravuuLogo from '../assets/uravin-logo.png';

export default function TaxInvoiceTemplate({ invoice, id }) {
  if (!invoice) return null;

  const {
    invoiceNumber,
    dateOfIssue,
    billingPeriod,
    placeOfSupply,
    status,
    reverseCharge,
    supplier,
    billedTo,
    description,
    taxableAmountRupees,
    cgstRupees,
    sgstRupees,
    totalRupees,
    footerText,
    footerThankYou,
    footerCompany,
  } = invoice;

  return (
    <div
      id={id || `invoice-${invoiceNumber}`}
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '52px 56px',
        boxSizing: 'border-box',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      <div>
        {/* Header: Logo & TAX INVOICE title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={uravuuLogo}
              alt="Uravuu Logo"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Uravuu</span>
                <span style={{ height: '3px', width: '22px', backgroundColor: '#10B981', display: 'inline-block', borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, letterSpacing: '0.02em' }}>
                a product of Tarvino Pvt Ltd
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', lineHeight: 1.15 }}>
              TAX
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', lineHeight: 1.15 }}>
              INVOICE
            </div>
          </div>
        </div>

        {/* Supplier Details */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            SUPPLIER DETAILS:
          </div>
          <div style={{ fontSize: '12px', color: '#475569', maxWidth: '620px', lineHeight: 1.6 }}>
            Registered Address: {supplier?.address || 'No 334, Kamaraj Nagar, Seplanatham, Cuddalore, Panruti, Tamil Nadu, India, 607802'}
            <br />
            GSTIN: <span style={{ fontWeight: 600, color: '#1E293B' }}>{supplier?.gstin || '33AANCT1942J1Z5'}</span> | State: {supplier?.state || 'Tamil Nadu (33)'}
            <br />
            SAC Code: {supplier?.sacCode || '998315 (Software as a Service)'}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#E2E8F0', marginBottom: '28px' }} />

        {/* Billed To & Invoice Details Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '36px' }}>
          {/* Left Column: Billed To */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              BILLED TO:
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              {billedTo?.name || 'Customer'}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.65 }}>
              State: {billedTo?.state || 'Tamil Nadu (33)'}
              <br />
              GSTIN: {billedTo?.gstin || 'Unregistered (B2C)'}
              <br />
              Phone: {billedTo?.phone || 'N/A'}
              <br />
              Email: {billedTo?.email || 'N/A'}
            </div>
          </div>

          {/* Right Column: Invoice Details */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              INVOICE DETAILS:
            </div>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: '#475569' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', width: '42%' }}>Invoice No:</td>
                  <td style={{ padding: '3px 0', fontWeight: 700, color: '#0F172A' }}>{invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Date of Issue:</td>
                  <td style={{ padding: '3px 0', color: '#1E293B' }}>{dateOfIssue}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Place of Supply:</td>
                  <td style={{ padding: '3px 0', color: '#1E293B' }}>{placeOfSupply || 'Tamil Nadu (33)'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Billing Period:</td>
                  <td style={{ padding: '3px 0', color: '#1E293B' }}>{billingPeriod}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Status:</td>
                  <td style={{ padding: '3px 0', fontWeight: 700, color: '#16A34A' }}>{status || 'PAID'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0' }}>Reverse Charge:</td>
                  <td style={{ padding: '3px 0', color: '#1E293B' }}>{reverseCharge || 'No'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1A4CB0', color: '#FFFFFF' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em' }}>
                  Description
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, textAlign: 'right', letterSpacing: '0.03em' }}>
                  Amount (INR)
                </th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px', color: '#1E293B' }}>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>{description}</td>
                <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Rs. {taxableAmountRupees}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', color: '#475569' }}>CGST (9%)</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', color: '#475569' }}>Rs. {cgstRupees}</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 20px', color: '#475569' }}>SGST (9%)</td>
                <td style={{ padding: '14px 20px', textAlign: 'right', color: '#475569' }}>Rs. {sgstRupees}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: '12px',
              padding: '18px 28px',
              minWidth: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              TOTAL PAID
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
              Rs. {totalRupees}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '24px', marginTop: 'auto' }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '8px' }}>
          {footerText || 'This is a computer-generated invoice and does not require a physical signature.'}
        </div>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
          {footerThankYou || 'Thank you for your business!'}
        </div>
        <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700, marginTop: '2px' }}>
          {footerCompany || 'Uravuu by Tarvino Pvt Ltd'}
        </div>
      </div>
    </div>
  );
}
