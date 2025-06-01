package main

import "testing"

func BenchmarkSimulacionSecuencial(b *testing.B) {
	for i := 0; i < b.N; i++ {
		SimulacionSecuencial()
	}
}

func BenchmarkSimulacionParalela(b *testing.B) {
	for i := 0; i < b.N; i++ {
		SimulacionParalela()
	}
}

