export const environment = {
    production: true,
    baseUrl: 'http://199.89.55.49/apitwh4',
    socketUrl: 'http://199.89.55.49/apitwh4', // URL base para SignalR Hub (el servicio construirá la URL completa: {socketUrl}/hubs/ordenSalida)
    enableWebSocket: true // Habilitar/deshabilitar SignalR (poner false si el servidor aún no está configurado)
};
