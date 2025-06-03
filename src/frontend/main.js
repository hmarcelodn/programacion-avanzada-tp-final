class Cuerpo {
    constructor(nombre, x, y, radio, color) {
        this.nombre = nombre;
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.color = color;
    }

    dibujar(ctx, zoom, offsetX, offsetY) {
        const pantallaX = this.x * zoom + offsetX;
        const pantallaY = this.y * zoom + offsetY;

        // Pulsación para el sol
        const tiempo = Date.now() / 500;
        const pulsoRadio = this.radio;
        const pulsoAlpha = 0.3 + 0.2 * Math.sin(tiempo);

        ctx.beginPath();
        ctx.arc(pantallaX, pantallaY, pulsoRadio, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;

        if (this.color === "yellow") {
            ctx.strokeStyle = `rgba(255, 255, 150, ${pulsoAlpha.toFixed(2)})`;
            ctx.lineWidth = 10;
            ctx.stroke();
        }

        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(this.nombre, pantallaX + this.radio + 4, pantallaY - this.radio - 4);
    }
}

let ws;
const canvasWidth = 800;
const canvasHeight = 800;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const planetas = {
    sol: new Cuerpo('Sol', 0, 0, 20, 'yellow'),
    tierra: new Cuerpo('Tierra', 100, 0, 8, 'red'),
    marte: new Cuerpo('Marte', 150, 0, 6, 'orange'),
    venus: new Cuerpo('Venus', 200, 0, 7, 'green'),
    mercurio: new Cuerpo('Mercurio', 250, 0, 4, 'blue'),
    jupiter: new Cuerpo('Júpiter', 300, 0, 12, 'purple'),
    saturno: new Cuerpo('Saturno', 350, 0, 10, 'pink'),
    urano: new Cuerpo('Urano', 400, 0, 9, 'gray'),
    neptuno: new Cuerpo('Neptuno', 450, 0, 8, 'brown'),
    pluton: new Cuerpo('Plutón', 500, 0, 3, 'white')
};

const escalar = (metros) => metros / 1.5e9;

const animar = (ctx) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fondo con gradiente
    const gradiente = ctx.createRadialGradient(
        canvasWidth / 2, canvasHeight / 2, 100,
        canvasWidth / 2, canvasHeight / 2, canvasWidth / 1.5
    );
    gradiente.addColorStop(0, '#444');
    gradiente.addColorStop(1, '#000');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Estrellas aleatorias
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    // Dibujar planetas
    Object.values(planetas).forEach(cuerpo => cuerpo.dibujar(ctx, zoom, offsetX, offsetY));

    requestAnimationFrame(() => animar(ctx));
};

const connect = () => {
    ws = new WebSocket("ws://localhost:8888");

    ws.onopen = () => {
        console.log("Conectado al servidor WebSocket");
    };

    ws.onmessage = (event) => {
        const cuerpo = JSON.parse(event.data);
        if (planetas[cuerpo.nombre]) {
            planetas[cuerpo.nombre].x = escalar(cuerpo.x);
            planetas[cuerpo.nombre].y = escalar(cuerpo.y);
        }
    };

    ws.onclose = () => {
        console.log("Conexion cerrada, intentando nuevamente...");
        setTimeout(connect, 2000);
    };

    ws.onerror = (error) => {
        console.error("Error en la conexion:", error);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('universo');
    const ctx = canvas.getContext('2d');

    // Centrar el universo al inicio
    offsetX = canvasWidth / 2;
    offsetY = canvasHeight / 2;

    // Mouse wheel para zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoom *= delta;
        if (zoom < 0.1) zoom = 0.1;
        if (zoom > 10) zoom = 10;
    });

    // Mouse drag para mover
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            offsetX = e.clientX - dragStartX;
            offsetY = e.clientY - dragStartY;
        }
    });

    connect();
    animar(ctx);
});
