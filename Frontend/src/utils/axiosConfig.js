import axios from 'axios';
import Swal from 'sweetalert2';

// Configurar interceptor global para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la devolvemos
    return response;
  },
  (error) => {
    // Si hay un error de respuesta
    if (error.response) {
      const { status } = error.response;
      
      // Si el token ha expirado o no es válido (401 Unauthorized)
      if (status === 401) {
        const errorMessage = error.response.data?.message || '';
        
        // Verificar si el error es por token expirado o inválido
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('expired') ||
            errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('no autorizado')) {
          
          // Limpiar el almacenamiento local
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Mostrar mensaje al usuario
          Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            html: `
              <p>Tu sesión ha expirado por seguridad.</p>
              <p>Has alcanzado el <b>tiempo límite de 10 horas</b> de trabajo continuo.</p>
              <p>Por favor, <b>inicia sesión nuevamente</b> si deseas continuar trabajando por 10 horas adicionales.</p>
            `,
            confirmButtonText: 'Iniciar sesión',
            confirmButtonColor: '#00C2CC',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            // Redirigir al login
            window.location.href = '/';
          });
          
          // Rechazar la promesa para que no continúe la ejecución
          return Promise.reject(error);
        }
      }
      
      // Si es un error 403 (Forbidden), puede ser cuenta desactivada
      if (status === 403) {
        const errorMessage = error.response.data?.message || '';
        
        if (errorMessage.toLowerCase().includes('desactivada')) {
          Swal.fire({
            icon: 'error',
            title: 'Cuenta desactivada',
            text: errorMessage,
            confirmButtonColor: '#d33',
          }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          });
          
          return Promise.reject(error);
        }
      }
    }
    
    // Para cualquier otro error, simplemente lo rechazamos
    return Promise.reject(error);
  }
);

export default axios;
