package main

import (
	"math"
	"math/rand"
	"time"
)

type Vector struct {
	x, y float64
}

type Cuerpo struct {
	id         int
	posicion   Vector
	velocidad  Vector
	masa       float64
	canalFuerza chan Vector // solo usado por la paralela
}

const (
	G        = 0.0001
	CANTIDAD = 500   // Cantidad de cuerpos
	PASOS    = 3
	DT       = 0.1
)

// ==== Funciones comunes ====

func calcularFuerza(c1, c2 Cuerpo) Vector {
	dx := c2.posicion.x - c1.posicion.x
	dy := c2.posicion.y - c1.posicion.y
	distanciaCuadrado := dx*dx + dy*dy
	distancia := math.Sqrt(distanciaCuadrado) + 1e-5
	fuerza := G * c1.masa * c2.masa / distanciaCuadrado
	return Vector{fuerza * dx / distancia, fuerza * dy / distancia}
}

func cuerpoAleatorio(id int) Cuerpo {
	return Cuerpo{
		id:       id,
		masa:     rand.Float64()*10 + 1,
		posicion: Vector{rand.Float64() * 100, rand.Float64() * 100},
		velocidad: Vector{0, 0},
	}
}

// ==== Simulación Secuencial ====

func SimulacionSecuencial() {
	rand.Seed(time.Now().UnixNano())
	cuerpos := make([]Cuerpo, CANTIDAD)
	for i := range cuerpos {
		cuerpos[i] = cuerpoAleatorio(i)
	}

	for paso := 0; paso < PASOS; paso++ {
		fuerzas := make([]Vector, CANTIDAD)
		for i := 0; i < CANTIDAD; i++ {
			var fuerzaTotal Vector
			for j := 0; j < CANTIDAD; j++ {
				if i != j {
					fuerzaTotal.x += calcularFuerza(cuerpos[i], cuerpos[j]).x
					fuerzaTotal.y += calcularFuerza(cuerpos[i], cuerpos[j]).y
				}
			}
			fuerzas[i] = fuerzaTotal
		}
		for i := 0; i < CANTIDAD; i++ {
			a := Vector{fuerzas[i].x / cuerpos[i].masa, fuerzas[i].y / cuerpos[i].masa}
			cuerpos[i].velocidad.x += a.x * DT
			cuerpos[i].velocidad.y += a.y * DT
			cuerpos[i].posicion.x += cuerpos[i].velocidad.x * DT
			cuerpos[i].posicion.y += cuerpos[i].velocidad.y * DT
		}
	}
}

// ==== Simulación Paralela (con goroutines y canales) ====

func generarCuerpoParalelo(id int) Cuerpo {
	return Cuerpo{
		id:          id,
		masa:        rand.Float64()*10 + 1,
		posicion:    Vector{rand.Float64() * 100, rand.Float64() * 100},
		velocidad:   Vector{0, 0},
		canalFuerza: make(chan Vector, CANTIDAD),
	}
}

func iniciarActorCuerpo(cuerpo Cuerpo, pasoListo chan<- Cuerpo, avanzar <-chan bool) {
	for paso := 0; paso < PASOS; paso++ {
		var fuerzaTotal Vector
		for i := 0; i < CANTIDAD-1; i++ {
			f := <-cuerpo.canalFuerza
			fuerzaTotal.x += f.x
			fuerzaTotal.y += f.y
		}
		a := Vector{fuerzaTotal.x / cuerpo.masa, fuerzaTotal.y / cuerpo.masa}
		cuerpo.velocidad.x += a.x * DT
		cuerpo.velocidad.y += a.y * DT
		cuerpo.posicion.x += cuerpo.velocidad.x * DT
		cuerpo.posicion.y += cuerpo.velocidad.y * DT
		pasoListo <- cuerpo
		<-avanzar
	}
}

func SimulacionParalela() {
	rand.Seed(time.Now().UnixNano())

	cuerpos := make([]Cuerpo, CANTIDAD)
	pasoListo := make(chan Cuerpo, CANTIDAD)
	avanzar := make(chan bool)

	for i := 0; i < CANTIDAD; i++ {
		cuerpos[i] = generarCuerpoParalelo(i)
		go iniciarActorCuerpo(cuerpos[i], pasoListo, avanzar)
	}

	for paso := 0; paso < PASOS; paso++ {
		for i := 0; i < CANTIDAD; i++ {
			for j := 0; j < CANTIDAD; j++ {
				if i != j {
					f := calcularFuerza(cuerpos[i], cuerpos[j])
					cuerpos[j].canalFuerza <- f
				}
			}
		}
		for i := 0; i < CANTIDAD; i++ {
			c := <-pasoListo
			cuerpos[c.id] = c
		}
		for i := 0; i < CANTIDAD; i++ {
			avanzar <- true
		}
	}
}

