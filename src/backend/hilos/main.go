package main

import (
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan string)

type Vector struct {
	x, y float64
}

type Mensaje struct {
	cuerpo *Cuerpo
	tipo   string
}

type Cuerpo struct {
	nombre          string
	posicion        Vector
	velocidad       Vector
	aceleracion     Vector
	masa            float64
	inbox           chan Mensaje
	fuerzaVectorial Vector
	fuerzaNeta      float64
}

const G = 6.674e-11
const dt = 100000

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func manejarWebsockets(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}

	clients[conn] = true

	defer conn.Close()

	for {
		_, message, err := conn.ReadMessage()

		if err != nil {
			fmt.Println("Error reading message:", err)
			delete(clients, conn)
			break
		}

		broadcast <- string(message)

		fmt.Printf("Received: %s\\n", message)
		if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
			fmt.Println("Error writing message:", err)
			break
		}
	}
}

func manejarBroadcast() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, []byte(msg))
			if err != nil {
				fmt.Println("Error enviando mensaje:", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// En esta funcion calculo la distancia de euclides entre los dos cuerpos
// Luego aplico la ley de gravitacion universal para calcular la fuerza de atraccion entre los dos cuerpos
// Sumo la fuerza neta a la fuerza neta del cuerpo 1, que es la suma de todas las fuerzas de todos los cuerpos
// Luego con esto aplico la segunda ley de newton para calcular la aceleracion y la velocidad
// Luego actualizo la posicion del cuerpo 1 y reseteo la fuerza neta
func calcularFuerza(c1 *Cuerpo, c2 *Cuerpo) {
	// Calculo la distancia
	deltaX := c2.posicion.x - c1.posicion.x
	deltaY := c2.posicion.y - c1.posicion.y
	distanciaCuadrado := deltaX*deltaX + deltaY*deltaY
	distancia := math.Sqrt(distanciaCuadrado) + 1e-5

	// Aplico la ley de gravitacion universal
	fuerzaMagnitud := G * c1.masa * c2.masa / distanciaCuadrado

	// Sumo la fuerza neta a la fuerza neta del cuerpo 1, que es la suma de todas las fuerzas de todos los cuerpos
	// Luego con esto aplico la segunda ley de newton para calcular la aceleracion y la velocidad
	c1.fuerzaNeta += fuerzaMagnitud
	c1.fuerzaVectorial = Vector{
		fuerzaMagnitud*(deltaX/distancia) + c1.fuerzaVectorial.x,
		fuerzaMagnitud*(deltaY/distancia) + c1.fuerzaVectorial.y,
	}
}

// Con las nuevas fuerzas de gravedad puedo calcular la nueva velocidad y la nueva posicion
func actualizarPosicion(c *Cuerpo, dt float64) {
	c.aceleracion = Vector{c.fuerzaVectorial.x / c.masa, c.fuerzaVectorial.y / c.masa}
	c.velocidad = Vector{c.velocidad.x + c.aceleracion.x*dt, c.velocidad.y + c.aceleracion.y*dt}
	c.posicion = Vector{c.posicion.x + c.velocidad.x*dt, c.posicion.y + c.velocidad.y*dt}
	c.fuerzaVectorial = Vector{0, 0}
	c.fuerzaNeta = 0
}

// Un factory de cuerpos nuevos
func crearNuevoCuerpo(nombre string, masa float64, posicion Vector, velocidad Vector) *Cuerpo {
	cuerpo := &Cuerpo{
		nombre:    nombre,
		masa:      masa,
		inbox:     make(chan Mensaje),
		posicion:  posicion,
		velocidad: velocidad,
	}

	go func(c *Cuerpo) {
		for msg := range c.inbox {
			switch msg.tipo {
			case "cuerpo":
				calcularFuerza(c, msg.cuerpo)
			}
		}
	}(cuerpo)

	return cuerpo
}

// Un hilo que maneja la simulación
func iniciarSimulacion() {
	fmt.Println("Iniciando simulacion")

	// Crear cuerpos celestes, cada uno con su masa, una posicion inicial, y una velocidad inicial
	// Como operamos en un plano, la posicion inicial es un vector de 2 posiciones al igual que la velocidad
	sol := crearNuevoCuerpo("sol", 1.989e30, Vector{0, 0}, Vector{0, 0})
	mercurio := crearNuevoCuerpo("mercurio", 3.301e23, Vector{5.79e10, 0}, Vector{0, 47362})
	venus := crearNuevoCuerpo("venus", 4.867e24, Vector{1.082e11, 0}, Vector{0, 35020})
	tierra := crearNuevoCuerpo("tierra", 5.972e24, Vector{1.496e11, 0}, Vector{0, 29783})
	marte := crearNuevoCuerpo("marte", 6.39e23, Vector{2.279e11, 0}, Vector{0, 24077})
	jupiter := crearNuevoCuerpo("jupiter", 1.898e27, Vector{7.785e11, 0}, Vector{0, 13060})
	saturno := crearNuevoCuerpo("saturno", 5.683e26, Vector{1.434e12, 0}, Vector{0, 9680})
	urano := crearNuevoCuerpo("urano", 8.681e25, Vector{2.871e12, 0}, Vector{0, 6810})
	neptuno := crearNuevoCuerpo("neptuno", 1.024e26, Vector{4.498e12, 0}, Vector{0, 5430})
	pluton := crearNuevoCuerpo("pluton", 1.303e22, Vector{5.906e12, 0}, Vector{0, 4748})
	cuerpos := []*Cuerpo{sol, tierra, marte, venus, mercurio, jupiter, saturno, urano, neptuno, pluton}

	// Hacer broadcast de la informacion de cada planeta hacia los demas
	// utilizando el inbox de cada actor (usando canales)
	for {
		for _, cuerpo := range cuerpos {
			for _, otroCuerpo := range cuerpos {
				if cuerpo.nombre != otroCuerpo.nombre {
					cuerpo.inbox <- Mensaje{cuerpo: otroCuerpo, tipo: "cuerpo"}
				}
			}
		}

		// Esperamos que los cuerpos calculen sus fuerzas
		time.Sleep(100 * time.Millisecond)

		// Actualizar posiciones
		for _, cuerpo := range cuerpos {
			actualizarPosicion(cuerpo, dt)
		}

		// Enviar al frontend las novedades de cada cuerpo luego de obtener sus nuevs posiciones
		for _, cuerpo := range cuerpos {
			fmt.Println("Posicion del ", cuerpo.nombre, ": ", cuerpo.posicion)
			json := fmt.Sprintf(`{"x": %.2f, "y": %.2f, "nombre": "%s"}`, cuerpo.posicion.x, cuerpo.posicion.y, cuerpo.nombre)
			broadcast <- json
		}

	}
}

func main() {
	http.HandleFunc("/", manejarWebsockets)
	fmt.Println("WebSocket server started on :8888")

	go iniciarSimulacion()
	go manejarBroadcast()

	err := http.ListenAndServe(":8888", nil)

	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
