import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Lazy import to avoid bundling cost if never used
let docxPreview;
async function ensureDocxPreview() {
  if (!docxPreview) {
    const mod = await import('docx-preview');
    docxPreview = mod;
  }
  return docxPreview;
}

export default function DocxPrintPreview({ blob, onClose }) {
  const containerRef = useRef(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await ensureDocxPreview();
        if (cancelled) return;
        const arrayBuffer = await blob.arrayBuffer();
        // Clear container before render
        if (containerRef.current) containerRef.current.innerHTML = '';
        await mod.renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          useBase64URL: true,
          useMathMLPolyfill: true,
        });
      } catch (e) {
        console.error('docx-preview render error:', e);
        if (!cancelled) setRenderError(e?.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [blob]);

  const handlePrint = () => {
    // Print current page content focusing on preview area; hide rest using print CSS
    window.requestAnimationFrame(() => window.print());
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h5 style={{ margin: 0 }}>Vista previa del documento</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cerrar</button>
        </div>
        <div style={styles.body}>
          {renderError ? (
            <div className="alert alert-danger" role="alert">
              No se pudo renderizar el documento para previsualización. {renderError}
            </div>
          ) : (
            <div id="docx-print-area" ref={containerRef} style={styles.preview} />
          )}
        </div>
        <div style={styles.footer}>
          <button className="btn btn-info text-white" onClick={handlePrint} disabled={!!renderError}>
            Imprimir
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      {/* Print styles: only print the preview area */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #docx-print-area, #docx-print-area * { visibility: visible !important; }
          #docx-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

DocxPrintPreview.propTypes = {
  blob: PropTypes.instanceOf(Blob).isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 1050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 8,
    maxWidth: '80vw',
    maxHeight: '90vh',
    width: '900px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e5e5',
  },
  body: {
    padding: 16,
    overflow: 'auto',
    background: '#fafafa',
  },
  preview: {
    background: '#fff',
    padding: 16,
    boxShadow: '0 0 1px rgba(0,0,0,0.1) inset',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '10px 16px',
    borderTop: '1px solid #e5e5e5',
    background: '#fff',
  },
};
