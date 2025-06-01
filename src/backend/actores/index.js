const { WebSocketServer, WebSocket } = require('ws');
const { start, dispatch, stop, spawn } = require('nact');

const wss = new WebSocketServer({ port: 8888 });
let clientes = [];

wss.on('connection', (ws) => {
    clientes.push(ws);

    ws.on('error', console.error);

    ws.on('message', (data) => {
        console.log('received: %s', data);
    });

    ws.on('close', () => {
        clientes = clientes.filter(cliente => cliente !== ws);
    });

    ws.send(JSON.stringify({ mensaje: 'Conexión exitosa' }));
});

const broadcast = (mensaje) => {
    const data = JSON.stringify(mensaje);
    clientes.forEach(cliente => {
        if (cliente.readyState === WebSocket.OPEN) {
            cliente.send(data);
        }
    });
};

const ACTOR_OPERACION = {
    CALCULAR_FUERZA_GRAVITACIONAL: 'calcular_fuerza_gravitacional',
    CALCULAR_POSICION: 'calcular_posicion',
    SOLICITAR_ESTADO_CUERPO: 'solicitar_estado_cuerpo',
    RESET_FUERZA: 'reset_fuerza',
};

const G = 6.674e-11;

const system = start();

const configuracionPlanetas = [
    {
        nombre: 'tierra',
        posicion: { x: 1.496e11, y: 0},
        velocidad: { x: 0, y: 29783},
        aceleracion: { x: 0, y: 0},
        masa: 5.972e24,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },  
    {
        nombre: 'sol',
        posicion: { x: 0, y: 0},
        velocidad: { x: 0, y: 0},
        aceleracion: { x: 0, y: 0},
        masa: 1.989e30,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'marte',
        posicion: { x: 2.279e11, y: 0},
        velocidad: { x: 0, y: 24077},
        aceleracion: { x: 0, y: 0},
        masa: 6.39e23,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'venus',
        posicion: { x: 1.082e11, y: 0},
        velocidad: { x: 0, y: 35020},
        aceleracion: { x: 0, y: 0},
        masa: 4.867e24,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'mercurio',
        posicion: { x: 5.79e10, y: 0},
        velocidad: { x: 0, y: 47362},
        aceleracion: { x: 0, y: 0},
        masa: 3.301e23,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'jupiter',
        posicion: { x: 7.785e11, y: 0},
        velocidad: { x: 0, y: 13060},
        aceleracion: { x: 0, y: 0},
        masa: 1.898e27,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'saturno',
        posicion: { x: 1.434e12, y: 0},
        velocidad: { x: 0, y: 9680},
        aceleracion: { x: 0, y: 0},
        masa: 5.683e26,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'urano',
        posicion: { x: 2.871e12, y: 0},
        velocidad: { x: 0, y: 6810},
        aceleracion: { x: 0, y: 0},
        masa: 8.681e25,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'neptuno',
        posicion: { x: 4.498e12, y: 0},
        velocidad: { x: 0, y: 5430},
        aceleracion: { x: 0, y: 0},
        masa: 1.024e26,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'pluton',
        posicion: { x: 5.906e12, y: 0},
        velocidad: { x: 0, y: 4748},
        aceleracion: { x: 0, y: 0},
        masa: 1.303e22,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
    {
        nombre: 'luna',
        posicion: { x: 3.844e8, y: 0},
        velocidad: { x: 0, y: 1022},
        aceleracion: { x: 0, y: 0},
        masa: 7.348e22,
        fuerzaVectorial: { x: 0, y: 0},
        fuerzaNeta: 0,
    },
];

const actoresPlanetas = configuracionPlanetas.map(planeta => spawn(system, (state ={...planeta}, msg, ctx) => {
    if (msg.tipo === ACTOR_OPERACION.RESET_FUERZA) {
        state.fuerzaVectorial = { x: 0, y: 0 };
        state.fuerzaNeta = 0;
        return state;
    }

    if (msg.tipo === ACTOR_OPERACION.SOLICITAR_ESTADO_CUERPO) {
        // El emisor le pide al receptor que calcule la fuerza de gravedad
        //dispatch(msg.cuerpo, { tipo: ACTOR_OPERACION.CALCULAR_FUERZA_GRAVITACIONAL, cuerpo: state });
        dispatch(msg.cuerpo, {
            tipo: ACTOR_OPERACION.CALCULAR_FUERZA_GRAVITACIONAL,
            cuerpo: { ...state } // se lo paso a él, y él calcula cuánto le afecto yo
        });        
        //return state;
    }

    if (msg.tipo === ACTOR_OPERACION.CALCULAR_FUERZA_GRAVITACIONAL) {    
        const deltaX = msg.cuerpo.posicion.x - state.posicion.x;
        const deltaY = msg.cuerpo.posicion.y - state.posicion.y;
        const distanciaCuadrado = Math.max(deltaX * deltaX + deltaY * deltaY, 1e-10);
        const distancia = Math.sqrt(distanciaCuadrado);
    
        const fuerzaMagnitud = G * state.masa * msg.cuerpo.masa / distanciaCuadrado;
    
        return {
            ...state,
            fuerzaVectorial: {
                x: state.fuerzaVectorial.x + fuerzaMagnitud * (deltaX / distancia),
                y: state.fuerzaVectorial.y + fuerzaMagnitud * (deltaY / distancia),
            },
            fuerzaNeta: state.fuerzaNeta + fuerzaMagnitud
        };
    }

    if (msg.tipo === ACTOR_OPERACION.CALCULAR_POSICION) {
        const aceleracion = {
            x: state.fuerzaVectorial.x / state.masa,
            y: state.fuerzaVectorial.y / state.masa,
        };
    
        const velocidadNueva = {
            x: state.velocidad.x + aceleracion.x * msg.dt,
            y: state.velocidad.y + aceleracion.y * msg.dt,
        };
    
        const posicionNueva = {
            x: state.posicion.x + velocidadNueva.x * msg.dt,
            y: state.posicion.y + velocidadNueva.y * msg.dt,
        };
    
        const newState = {
            ...state,
            aceleracion,
            velocidad: velocidadNueva,
            posicion: posicionNueva,
            fuerzaVectorial: { x: 0, y: 0 },
            fuerzaNeta: 0,
        };
    
        broadcast({ x: newState.posicion.x, y: newState.posicion.y, nombre: newState.nombre });
        console.log('Nueva posicion del cuerpo', newState.nombre, newState.posicion);
    
        return newState;
    }

    return state;
}, planeta.nombre));

const sleep = ms => new Promise(res => setTimeout(res, ms));

const iniciarSimulacionGravitacional = async () => {
    const dt = 60000;

    while (true) {
        for (const receptor of actoresPlanetas) {
            for (const emisor of actoresPlanetas) {
                if (receptor.name !== emisor.name) {
                    dispatch(emisor, { tipo: ACTOR_OPERACION.SOLICITAR_ESTADO_CUERPO, cuerpo: receptor });
                }
            }
        }

        await sleep(100);

        for (const planeta of actoresPlanetas) {
            dispatch(planeta, { tipo: ACTOR_OPERACION.CALCULAR_POSICION, dt: dt });
        }
    }
};


iniciarSimulacionGravitacional().then(() => {
    stop(system);
});