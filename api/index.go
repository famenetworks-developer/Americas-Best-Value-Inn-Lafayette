package handler

import (
	cms "abvi-lafayette/server"
	"net/http"
	"strings"
)

// Handler is the Vercel Go Function entry point. vercel.json retains the
// original API path in __path while routing every endpoint to this function.
func Handler(w http.ResponseWriter, r *http.Request) {
	if path := r.URL.Query().Get("__path"); path != "" {
		r.URL.Path = "/api/" + strings.TrimPrefix(path, "/")
		query := r.URL.Query()
		query.Del("__path")
		r.URL.RawQuery = query.Encode()
	}
	cms.Handler().ServeHTTP(w, r)
}
