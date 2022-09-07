package main

import (
	"encoding/json"
	"fmt"
	"github.com/fsnotify/fsnotify"
    "github.com/gin-gonic/gin"
	"io/ioutil"
	"log"
    "net/http"
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

// Notebook data
var notebooks = map[string]notebook{}

func getFile(filename string, displayName string) {
	// Run python script to convert ipnb to json format
	// First lookup python location
	path, errpath := exec.LookPath("python")
	if errpath != nil {
		log.Fatal(errpath)
	}
	// Setup command to run
	cmd := exec.Command(path, "../src/parser.py", "--infile=" + filename)
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
	notebooks[filename] = notebook{
		Identifier:displayName,
		Title:displayName,
		Author:"Nathan",
		Contents:result}

}

func getFiles(dir string) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		if !file.IsDir() {
			fmt.Println(file.Name())
			name := filepath.Join(dir, file.Name())
			getFile(name, file.Name())
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
	for key, notebook := range notebooks {
		if notebook.Identifier == id {
			if entry, ok := notebooks[key]; ok {
				entry.Contents = json
				notebooks[key] = entry
			}
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
	dir := "../notebooks"
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal("NewWatcher failed: ", err)
	}
	defer watcher.Close()

	done := make(chan bool)
	go func() {
		defer close(done)

		for {
			log.Printf("Hi\n")
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				log.Printf("%s %s\n", event.Name, event.Op)
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("error:", err)
			}
		}

	}()
	err = watcher.Add(dir)
	if err != nil {
		log.Fatal("Add failed:", err)
	}
	getFiles(dir)
    router := gin.Default()
	router.Use(middleware())
    router.GET("/notebooks", getNotebooks)
    router.GET("/notebook/:identifier", getNotebookByIdentifier)
    router.POST("/notebook/:identifier", setNotebookByIdentifier)
	router.Static("/static", "../")
	router.Run("localhost:8080")
	<-done
}
