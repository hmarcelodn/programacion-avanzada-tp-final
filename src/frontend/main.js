class Cuerpo {
    constructor(x, y, radio, color) {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.color = color;
    }

    dibujar(ctx) {
        const tiempo = Date.now() / 500; // más chico = parpadeo más rápido
        const pulsoRadio = 12 + 4 * Math.sin(tiempo);  // tamaño pulsante
        const pulsoAlpha = 0.3 + 0.2 * Math.sin(tiempo); 
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;

        if (this.color === "yellow") {
            ctx.strokeStyle = `rgba(255, 255, 150, ${pulsoAlpha.toFixed(2)})`;
            ctx.lineWidth = 10;
            ctx.stroke();
        }

        ctx.fill();
    }
}

let ws;
const canvasWidth = 800;
const canvasHeight = 800;

const animar = (ctx) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);    
    const gradiente = ctx.createRadialGradient(
        canvasWidth / 2, canvasHeight / 2, 100, // centro y radio inicial
        canvasWidth / 2, canvasHeight / 2, canvasWidth / 1.5 // centro y radio final
    );
    
    // Colores: centro gris claro, bordes negro
    gradiente.addColorStop(0, '#444');   // Gris más claro en el centro
    gradiente.addColorStop(1, '#000');   // Negro en los bordes
    
    ctx.fillStyle = gradiente;    
    //ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 800;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    sol.dibujar(ctx);
    tierra.dibujar(ctx);
    marte.dibujar(ctx);
    mercurio.dibujar(ctx);
    jupiter.dibujar(ctx);
    urano.dibujar(ctx);
    neptuno.dibujar(ctx);
    pluton.dibujar(ctx);
    requestAnimationFrame(() => animar(ctx));
}

const escalar = (metros) => {
    let valor = 400 + (metros / 1.5e9);
    if (valor < 0) valor = 0;
    if (valor > 800) valor = valor - 300;
    return valor;
}

const connect = (ctx) => {
    ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => {
        console.log("Conectado al servidor WebSocket");
    };

    ws.onmessage = (event) => {
        const cuerpo = JSON.parse(event.data);

        ctx.clearRect(0, 0, 2000, 2000);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 2000, 2000);

        if (cuerpo.nombre === 'sol') {
            sol.x = escalar(cuerpo.x);
            sol.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'tierra') {
            tierra.x = escalar(cuerpo.x);
            tierra.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'marte') {
            marte.x = escalar(cuerpo.x);
            marte.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'venus') {
            venus.x = escalar(cuerpo.x);
            venus.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'mercurio') {
            mercurio.x = escalar(cuerpo.x);
            mercurio.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'jupiter') {
            jupiter.x = escalar(cuerpo.x);
            jupiter.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'saturno') {
            saturno.x = escalar(cuerpo.x);
            saturno.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'urano') {
            urano.x = escalar(cuerpo.x);
            urano.y = escalar(cuerpo.y);
        } else if (cuerpo.nombre === 'neptuno') {
            neptuno.x = escalar(cuerpo.x);
            neptuno.y = escalar(cuerpo.y);
        }

        requestAnimationFrame(() => animar(ctx));
    };

    ws.onclose = () => {
        console.log("Conexion cerrada, intentando nuevamente...");
        setTimeout(() => connect(ctx), 2000);
    };

    ws.onerror = (error) => {
        console.error("Error en la conexion:", error);
    };
}

const actualizarInfoSimulacion = () => {

}

/**
 * Planetas Orbitando.
 */
const sol = new Cuerpo(1500, 1500, 20, 'yellow');
const tierra = new Cuerpo(1510, 1510, 8, 'red');
const marte = new Cuerpo(1600, 1600, 6, 'orange');
const venus = new Cuerpo(1650, 1650, 7, 'green');
const mercurio = new Cuerpo(1700, 1700, 4, 'blue');
const jupiter = new Cuerpo(1750, 1750, 12, 'purple');
const saturno = new Cuerpo(1800, 1800, 10, 'pink');
const urano = new Cuerpo(1750, 1750, 9, 'gray');
const neptuno = new Cuerpo(1800, 1800, 8, 'brown');
const pluton = new Cuerpo(1850, 1850, 3, 'white'); 

/**
 * Recibe novedades de los demas planetas y actualiza su posicion en el plano.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('universo');
    const ctx = canvas.getContext('2d');
    
    connect(ctx);
    animar(ctx);
});