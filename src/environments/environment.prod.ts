export const environment = {
    production: true,
    baseUrl: 'https://twh.pe/apitwh3',
    socketUrl: 'https://twh.pe/apitwh3', // URL base para SignalR Hub (el servicio construirá la URL completa: {socketUrl}/hubs/ordenSalida)
    enableWebSocket: true // Habilitar/deshabilitar SignalR (poner false si el servidor aún no está configurado)
};
