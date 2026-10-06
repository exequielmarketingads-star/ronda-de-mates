# 🧉 Ronda de Mates Online

Juego de mates para dos jugadores en el navegador del celu. Servidor propio (Node + WebSocket), sin Claude ni cuentas.

## Probar en tu compu
    npm install
    npm start
Abrí http://localhost:3000 en dos pestañas: una crea sala, la otra se une con el código.

## Publicarlo online (gratis)
1. Subí esta carpeta a un repo de GitHub.
2. En render.com (o Railway / Fly.io): New > Web Service > tu repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Te da una URL https://...onrender.com. Pasásela a tu amigo y jueguen.

El servidor solo retransmite el estado entre los dos jugadores de cada sala.
