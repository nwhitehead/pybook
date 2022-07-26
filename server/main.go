package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// For any type T, return pointer to given value of type T
// This lets us create literals for pointer types
func Ptr[T any](v T) *T {
    return &v
}

type notebook struct {
	Identifier *string `json:"identifier,omitempty"`
	Title *string `json:"name,omitempty"`
	Author *string `json:"author,omitempty"`
	Contents *string `json:"contents,omitempty"`
}

// Demo data
var notebooks = []notebook{
	{Identifier:Ptr("1234"), Title:Ptr("Test Notebook 1"), Author:Ptr("Nathan"), Contents:Ptr("blah")},
	{Identifier:Ptr("8375309"), Title:Ptr("Test Notebook 2"), Author:Ptr("Nathan"), Contents:Ptr("foobar")},
}

// Get single notebook
func getNotebookByIdentifier(c *gin.Context) {
	id := c.Param("identifier");
	for _, notebook := range notebooks {
		if *notebook.Identifier == id {
			c.IndentedJSON(http.StatusOK, notebook)
			return
		}
	}
	c.IndentedJSON(http.StatusNotFound, gin.H{
		"message": "Notebook not found",
		"identifier": id,
	})
}

// getNotebooks responds with the list of all notebooks as JSON.
func getNotebooks(c *gin.Context) {
	lst := []notebook{}
	for _, notebook := range notebooks {
		notebook.Contents = nil;
		lst = append(lst, notebook)
	}
	c.IndentedJSON(http.StatusOK, lst)
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
    router.GET("/notebook/:identifier", getNotebookByIdentifier)
	router.Static("/static", "../")
	router.Run("localhost:8080")
}
