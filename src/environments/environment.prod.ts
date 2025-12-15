export const environment = {
    production: true,
    baseUrl: 'https://twh3api-cffhghgjcahfgrc7.brazilsouth-01.azurewebsites.net',
    socketUrl: 'https://twh3api-cffhghgjcahfgrc7.brazilsouth-01.azurewebsites.net', // URL base para SignalR Hub (el servicio construirá la URL completa: {socketUrl}/hubs/ordenSalida)
    enableWebSocket: true // Habilitar/deshabilitar SignalR (poner false si el servidor aún no está configurado)
};


