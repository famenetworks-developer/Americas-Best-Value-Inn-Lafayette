package main

import (
	cms "abvi-lafayette/server"
	"log/slog"
	"net/http"
	"os"
)

func main() {
	address := os.Getenv("APP_ADDR")
	if address == "" {
		address = ":18082"
	}
	server := &http.Server{Addr: address, Handler: cms.Handler()}
	slog.Info("CMS server ready", "address", address)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		panic(err)
	}
}
