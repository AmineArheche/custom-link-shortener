import React, { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { copyTextToClipboard } from '../utils/helpers';

export default function QRCodeModal({ link, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const canvasRef = useRef(null);

  if (!link) return null;

  const handleCopy = () => {
    copyTextToClipboard(link.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${link.short_code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>QR Code Scanner</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan with mobile camera to test redirect</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          padding: 24,
          borderRadius: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 20px',
          width: 'fit-content',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <QRCodeCanvas
            id="qr-code-canvas"
            value={link.short_url}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Link Details Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target Short Code</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent-secondary)' }}>
            {link.short_url}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownloadPNG} className="btn btn-primary" style={{ flex: 1 }}>
            <Download size={15} />
            <span>Download PNG</span>
          </button>
          <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1 }}>
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copied URL' : 'Copy URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
