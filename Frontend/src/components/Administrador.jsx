import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Administrador() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordEmail, setCurrentPasswordEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // read stored user once at component scope so JSX can access it
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();
  const mustChange = storedUser?.requiereCambioPassword || storedUser?.requiere_cambio_password;

  // Validaciones en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'newPassword':
        if (value.length > 0 && value.length < 8) {
          newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
        } else if (value.length >= 8) {
          const strongRe = /(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
          if (!strongRe.test(value)) {
            newErrors.newPassword = 'Debe contener mayúscula, número y carácter especial';
          } else {
            delete newErrors.newPassword;
          }
        } else {
          delete newErrors.newPassword;
        }
        break;

      case 'confirmPassword':
        if (value && value !== newPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (setter, fieldName) => (e) => {
    const value = e.target.value;
    setter(value);
    validateField(fieldName, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validaciones finales
    const finalErrors = {};
    if (!currentPassword) finalErrors.currentPassword = 'La contraseña actual es requerida';
    if (!newPassword) finalErrors.newPassword = 'La nueva contraseña es requerida';
    if (!confirmPassword) finalErrors.confirmPassword = 'Confirma tu nueva contraseña';
    
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({...errors, confirmPassword: 'Las contraseñas no coinciden'});
      return;
    }

    if (newPassword.length < 8) {
      setErrors({...errors, newPassword: 'La contraseña debe tener al menos 8 caracteres'});
      return;
    }

    const strongRe = /(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (!strongRe.test(newPassword)) {
      setErrors({...errors, newPassword: 'Debe contener mayúscula, número y carácter especial'});
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return setMessage({ type: 'danger', text: 'No autorizado' });

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      if (!res.ok) {
        setMessage({ type: 'danger', text: data?.message || 'Error al cambiar contraseña' });
      } else {
        setMessage({ type: 'success', text: data?.message || 'Contraseña cambiada correctamente' });
        // limpiar campos
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setErrors({});
        // opcional: redirigir o forzar logout
        setTimeout(() => {
          // opcional: cerrar sesión después de cambio
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }, 1200);
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handler to change email (requires current password)
  const handleEmailChange = async () => {
    setMessage(null);
    const finalErrors = {};
  if (!newEmail) finalErrors.newEmail = 'El nuevo correo es requerido';
  if (!confirmEmail) finalErrors.confirmEmail = 'Confirma el nuevo correo';
  if (newEmail && confirmEmail && newEmail !== confirmEmail) finalErrors.confirmEmail = 'Los correos no coinciden';
  if (!currentPasswordEmail) finalErrors.currentPasswordEmail = 'La contraseña actual es requerida para validar';
    if (Object.keys(finalErrors).length > 0) { setErrors(finalErrors); return; }

    const token = localStorage.getItem('token');
    if (!token) return setMessage({ type: 'danger', text: 'No autorizado' });

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/change-email', {
        method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: currentPasswordEmail, newEmail })
      });
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      if (!res.ok) {
        setMessage({ type: 'danger', text: data?.message || 'Error al cambiar correo' });
      } else {
        setMessage({ type: 'success', text: data?.message || 'Correo actualizado' });
        // actualizar email en localStorage user si existe
        try {
          const u = JSON.parse(localStorage.getItem('user') || 'null');
          if (u) { u.correo = newEmail; localStorage.setItem('user', JSON.stringify(u)); }
        } catch {}
        // limpiar campos (solo del formulario de email)
        setNewEmail(''); setConfirmEmail(''); setCurrentPasswordEmail(''); setErrors({});
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginLeft: "250px", minHeight: "100vh", backgroundColor: "#F0F0F0", padding: "20px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#111" }}>Administración</h2>
          <p className="text-muted small mb-0">Cambia la contraseña de tu cuenta y administra tu perfil</p>
        </div>
      </div>

      <div className="container-fluid">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="row">
          {/** Email change: shown above password change; hidden when user must change password after temporary recovery */}
          {!mustChange && (
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Cambiar correo electrónico</h5>
              </div>
              <div className="card-body">
                <form onSubmit={async (e) => { e.preventDefault(); await handleEmailChange(); }}>
                  <div className="mb-3">
                    <label className="form-label">Nuevo correo</label>
                    <input type="email" className={`form-control ${errors.newEmail ? 'is-invalid' : ''}`} value={newEmail} onChange={(e) => { setNewEmail(e.target.value); if (errors.newEmail) setErrors(prev=>{ const n = {...prev}; delete n.newEmail; return n; }); }} required />
                    {errors.newEmail && <div className="invalid-feedback">{errors.newEmail}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmar nuevo correo</label>
                    <input type="email" className={`form-control ${errors.confirmEmail ? 'is-invalid' : ''}`} value={confirmEmail} onChange={(e) => { setConfirmEmail(e.target.value); if (errors.confirmEmail) setErrors(prev=>{ const n = {...prev}; delete n.confirmEmail; return n; }); }} required />
                    {errors.confirmEmail && <div className="invalid-feedback">{errors.confirmEmail}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña actual (para validar)</label>
                    <div className="input-group">
                      <input type={showCurrent ? 'text' : 'password'} className={`form-control ${errors.currentPasswordEmail ? 'is-invalid' : ''}`} value={currentPasswordEmail} onChange={(e) => { setCurrentPasswordEmail(e.target.value); if (errors.currentPasswordEmail) setErrors(prev => { const n = {...prev}; delete n.currentPasswordEmail; return n; }); }} />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCurrent(s => !s)}>
                        <i className={`bi bi-eye${showCurrent ? '-slash' : ''}`}></i>
                      </button>
                      {errors.currentPasswordEmail && <div className="invalid-feedback">{errors.currentPasswordEmail}</div>}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button className="btn" type="submit" style={{ backgroundColor: '#00C2CC', color: '#fff' }} disabled={loading}>{loading ? 'Guardando...' : 'Cambiar correo'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          )}
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Cambiar contraseña</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Contraseña actual</label>
                    <div className="input-group">
                      <input 
                        type={showCurrent ? 'text' : 'password'} 
                        className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`} 
                        value={currentPassword} 
                        onChange={handleChange(setCurrentPassword, 'currentPassword')} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => setShowCurrent(s => !s)}
                      >
                        <i className={`bi bi-eye${showCurrent ? '-slash' : ''}`}></i>
                      </button>
                      {errors.currentPassword && (
                        <div className="invalid-feedback">
                          {errors.currentPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nueva contraseña</label>
                    <div className="input-group">
                      <input 
                        type={showNew ? 'text' : 'password'} 
                        className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`} 
                        value={newPassword} 
                        onChange={handleChange(setNewPassword, 'newPassword')} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => setShowNew(s => !s)}
                      >
                        <i className={`bi bi-eye${showNew ? '-slash' : ''}`}></i>
                      </button>
                      {errors.newPassword && (
                        <div className="invalid-feedback">
                          {errors.newPassword}
                        </div>
                      )}
                    </div>
                    <small className="text-muted">Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Confirmar nueva contraseña</label>
                    <div className="input-group">
                      <input 
                        type={showConfirm ? 'text' : 'password'} 
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} 
                        value={confirmPassword} 
                        onChange={handleChange(setConfirmPassword, 'confirmPassword')} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => setShowConfirm(s => !s)}
                      >
                        <i className={`bi bi-eye${showConfirm ? '-slash' : ''}`}></i>
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button className="btn" type="submit" style={{ backgroundColor: "#00C2CC", color: "#fff" }} disabled={loading || Object.keys(errors).length > 0}>
                      {loading ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/home_normal')}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Información</h5>
              </div>
              <div className="card-body">
                <p className="text-muted">Aquí puedes cambiar tu contraseña para mantener segura tu cuenta. Después de cambiar la contraseña se cerrará la sesión automáticamente.</p>
                <ul>
                  <li>Contraseña mínima: 8 caracteres</li>
                  <li>Incluye al menos una mayúscula, un número y un carácter especial</li>
                  <li>Si tienes problemas contacta al administrador del sistema</li>
                </ul>
                
                <div className="mt-4">
                  <h6 className="fw-bold">Requisitos de contraseña:</h6>
                  <div className="small">
                    <div className="mb-1">✓ Mínimo 8 caracteres</div>
                    <div className="mb-1">✓ Al menos una letra mayúscula (A-Z)</div>
                    <div className="mb-1">✓ Al menos un número (0-9)</div>
                    <div className="mb-1">✓ Al menos un carácter especial (!@#$%^&* etc.)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Administrador;