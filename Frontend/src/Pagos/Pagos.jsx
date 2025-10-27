import React, { useState } from 'react';

const PagosAvila = () => {
  const [formData, setFormData] = useState({
    nombrePaciente: '',
    numeroFactura: '',
    monto: '',
    metodoPago: '',
    email: ''
  });

  const [procesando, setProcesando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcesando(true);
    
    // Simular procesamiento de pago
    setTimeout(() => {
      setProcesando(false);
      setPagoExitoso(true);
      // Aquí iría la lógica real de procesamiento de pago
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      nombrePaciente: '',
      numeroFactura: '',
      monto: '',
      metodoPago: '',
      email: ''
    });
    setPagoExitoso(false);
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header de la página */}
      
      {/* Contenido principal */}
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          {pagoExitoso ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="text-success mb-3">¡Pago Procesado Exitosamente!</h3>
                <p className="text-muted mb-4">
                  Su pago ha sido procesado correctamente. Recibirá un comprobante en su email.
                </p>
                <button 
                  className="btn btn-info text-white"
                  onClick={resetForm}
                >
                  Realizar Otro Pago
                </button>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 pb-0">
                <h4 className="card-title mb-3" style={{ color: '#333' }}>
                  Información del Pago
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nombrePaciente" className="form-label">
                        Nombre del Paciente *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombrePaciente"
                        name="nombrePaciente"
                        value={formData.nombrePaciente}
                        onChange={handleChange}
                        required
                        placeholder="Ingrese nombre completo"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="numeroFactura" className="form-label">
                        Número de Factura *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="numeroFactura"
                        name="numeroFactura"
                        value={formData.numeroFactura}
                        onChange={handleChange}
                        required
                        placeholder="Ej: AV-2024-001"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="monto" className="form-label">
                        Monto a Pagar ($) *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="monto"
                        name="monto"
                        value={formData.monto}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="metodoPago" className="form-label">
                        Método de Pago *
                      </label>
                      <select
                        className="form-select"
                        id="metodoPago"
                        name="metodoPago"
                        value={formData.metodoPago}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione método</option>
                        <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="efectivo">Pago en Efectivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="form-label">
                      Email para Comprobante
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                    />
                    <div className="form-text">
                      Enviaremos el comprobante de pago a este email
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-info text-white py-2"
                      disabled={procesando}
                    >
                      {procesando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Procesando Pago...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-credit-card me-2"></i>
                          Proceder al Pago
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="card-body">
                  <h6 className="card-title text-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Importante
                  </h6>
                  <ul className="list-unstyled mb-0 small">
                    <li className="mb-1">
                      <i className="fas fa-shield-alt text-info me-2"></i>
                      Todos los pagos son procesados de forma segura
                    </li>
                    <li className="mb-1">
                      <i className="fas fa-clock text-info me-2"></i>
                      Procesamiento inmediato
                    </li>
                    <li>
                      <i className="fas fa-envelope text-info me-2"></i>
                      Comprobante enviado por email
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagosAvila;