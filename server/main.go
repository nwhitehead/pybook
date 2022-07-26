package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type notebook struct {
	Title string `json:"name"`
	Author string `json:"author"`
	Contents string `json:"contents"`
}

// Demo data
var notebooks = []notebook{
	{Title:"Test Notebook 1", Author:"Nathan", Contents:"blah"},
	{Title:"Test Notebook 2", Author:"Nathan", Contents:"foobar"},
}

// getNotebooks responds with the list of all notebooks as JSON.
func getNotebooks(c *gin.Context) {
    c.IndentedJSON(http.StatusOK, notebooks)
}

func middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
		// Turn off caching
		c.Writer.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Writer.Header().Set("Pragma", "no-cache")
		c.Writer.Header().Set("Expires", "0")
		// Turn on cross origin isolation (to allow SharedArrayBuffer)
		c.Writer.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		c.Writer.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		// Turn on cross origin resource sharing
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Cross-Origin-Resource-Policy", "same-origin")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    }
}

func main() {
    router := gin.Default()
	router.Use(middleware());
    router.GET("/notebooks", getNotebooks)
	router.Static("/static", "../")
	router.Run("localhost:8080")
}
