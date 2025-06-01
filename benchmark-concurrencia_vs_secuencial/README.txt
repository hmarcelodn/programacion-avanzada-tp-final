Correr simulación:
------------------

go test -bench=. -benchmem

Ejemplo de columnas del test
----------------------------

BenchmarkSimulacionSecuencial-12	Nombre del benchmark y -12 que indica que se usaron 12 threads (GOMAXPROCS=12) durante la prueba.
170					Cantidad de veces que Go ejecutó la función de benchmark para medir con precisión. Se elige automáticamente.
7040887 ns/op				Tiempo promedio por ejecución en nanosegundos por operación (op = una corrida de la simulación).
0 B/op					Cantidad promedio de bytes asignados en memoria por ejecución.
0 allocs/op				Cantidad promedio de asignaciones de memoria por ejecución.
