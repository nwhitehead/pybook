package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
	"encoding/json"
	"io/ioutil"
	"log"
	"fmt"
	"os/exec"
	"path/filepath"
)

type contents map[string]interface{}

type notebook struct {
	Identifier string `json:"identifier"`
	Title string `json:"name"`
	Author string `json:"author"`
	Contents contents `json:"contents"`
}

// Unmarshall needs a result area, so wrap this in a function that returns parsed result
func emptyNotebook() contents {
	var result contents
	json.Unmarshal([]byte(`{"select":0,"page":0,"cells":[[{"id":0,"source":"","cell_type":"code","language":"python","evalstate":"","outputs":[]}]]}`), &result);
	return result;	
}

// Demo data
var notebooks = []notebook{}

func getFiles() {
	dir := "../notebooks"
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		if !file.IsDir() {
			fmt.Println(file.Name())
			name := filepath.Join(dir, file.Name())

			// Run python script to convert ipnb to json format
			// First lookup python location
			path, errpath := exec.LookPath("python")
			if errpath != nil {
				log.Fatal(errpath)
			}
			// Setup command to run
			cmd := exec.Command(path, "../src/parser.py", "--infile=" + name)
			out, cmderr := cmd.Output()
			if cmderr != nil {
				log.Fatal(cmderr)
			}

			// Parse JSON output
			var result contents
			jsonerr := json.Unmarshal([]byte(out), &result)
			if jsonerr != nil {
				log.Fatal(jsonerr)
			}

			// Store in array
			notebooks = append(notebooks, notebook{
				Identifier:file.Name(),
				Title:file.Name(),
				Author:"Nathan",
				Contents:result})
		}
	}
}

// Get single notebook
func getNotebookByIdentifier(c *gin.Context) {
	id := c.Param("identifier")
	for _, notebook := range notebooks {
		if notebook.Identifier == id {
			c.IndentedJSON(http.StatusOK, notebook)
			return
		}
	}
	c.IndentedJSON(http.StatusNotFound, gin.H{
		"message": "Notebook not found",
		"identifier": id,
	})
}

// Set contents of single notebook
func setNotebookByIdentifier(c *gin.Context) {
	id := c.Param("identifier")
	var json contents
	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"identifier": id,
			"error": err.Error(),
		})
		return
	}
	for index, notebook := range notebooks {
		if notebook.Identifier == id {
			notebooks[index].Contents = json;
			c.IndentedJSON(http.StatusOK, gin.H{
				"message": "Notebook updated",
				"identifier": id,
				"data": json,
			})
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
		notebook.Contents = nil
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
	getFiles()
    router := gin.Default()
	router.Use(middleware())
    router.GET("/notebooks", getNotebooks)
    router.GET("/notebook/:identifier", getNotebookByIdentifier)
    router.POST("/notebook/:identifier", setNotebookByIdentifier)
	router.Static("/static", "../")
	router.Run("localhost:8080")
}
