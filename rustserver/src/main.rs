
use actix_web::{get, middleware, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files as fs;
use serde::{Serialize, Deserialize};

const DB_FILENAME : &'static str = "./pybookdb.sql";
const NOTEBOOK_DIR : &'static str = "./notebooks";
const FEEDBACK_FILE : &'static str = "./feedback.log";

struct Database {
    connection : sqlite::Connection,
}

#[derive(Serialize, Deserialize, Debug)]
struct Feedback {
    choice: String,
    message: String,
    email: String,
    timestamp: String,
}

#[derive(Serialize, Debug)]
struct NotebookEntry {
    identifier: i64,
    name: String,
    version: i64,
}

#[derive(Serialize, Debug)]
struct FullNotebookEntry {
    identifier: i64,
    name: String,
    version: i64,
    contents: String,
}

#[derive(Debug)]
struct CustomError {}

#[get("/notebooks")]
async fn notebooks(data: web::Data<std::sync::Mutex<Database>>) -> impl Responder {
    let db = data.lock().unwrap();
    let ids = db.get_notebooks().unwrap();
    web::Json(ids)
}

#[get("/notebook/{identifier}")]
async fn notebook(data: web::Data<std::sync::Mutex<Database>>, path: web::Path<i64>) -> impl Responder {
    let db = data.lock().unwrap();
    let identifier = path.into_inner();
    let full_notebook_entry = db.get_notebook(identifier).unwrap();
    web::Json(full_notebook_entry)
}

#[post("/notebook/{identifier}")]
async fn notebook_update(data: web::Data<std::sync::Mutex<Database>>, path: web::Path<i64>, req_body: String) -> impl Responder {
    let db = data.lock().unwrap();
    let identifier = path.into_inner();
    db.set_notebook(identifier, req_body).unwrap();
    HttpResponse::Ok()
}

#[post("/feedback")]
async fn feedback(form: web::Form<Feedback>) -> impl Responder {
    let _file = std::fs::OpenOptions::new()
        .write(true)
        .append(true)
        .open(FEEDBACK_FILE)
        .unwrap();
    let logline = format!("Feedback choice:{} message:{} email:{} timestamp:{}", form.choice, form.message, form.email, form.timestamp);
    print!("{}", logline);
    HttpResponse::Ok()
}

impl Database {

    fn new() -> Database {
        let connection = sqlite::open(DB_FILENAME).unwrap();
        // Create the tables if they don't exist
        connection.execute(
            "
            CREATE TABLE IF NOT EXiSTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, version INTEGER, current TEXT);
            CREATE TABLE IF NOT EXISTS history (id INTEGER, version INTEGER, datetime TEXT, data TEXT);
            "
        ).unwrap();
        // Add the files from the notebooks directory if they aren't already in the db
        for entry in std::fs::read_dir(NOTEBOOK_DIR).unwrap() {
            let entry = entry.unwrap();
            let path = entry.path();
            let filename = path.file_name().unwrap().to_str().unwrap();
            // Look for the filename in the documents
            let mut stmt = connection.prepare(
                "SELECT * FROM documents WHERE name = ?1"
            ).unwrap()
            .bind(1, filename)
            .unwrap();
            if stmt.next().unwrap() != sqlite::State::Row {
                // Not found, so read file and add contents to documents
                let contents = std::fs::read_to_string(entry.path()).unwrap();
                connection.prepare(
                    "INSERT INTO documents (name, version, current) VALUES (?1, ?2, ?3)"
                ).unwrap()
                .bind(1, filename)
                .unwrap()
                .bind(2, 1)
                .unwrap()
                .bind(3, contents.as_str())
                .unwrap()
                .next()
                .unwrap();
            }
        }
        return Database {
            connection: connection
        };
    }

    fn get_notebooks(&self) -> Result<std::vec::Vec<NotebookEntry>, CustomError> {
        let connection = &self.connection;
        let mut stmt = connection.prepare(
            "SELECT * FROM documents"
        ).unwrap();
        let mut result : std::vec::Vec<NotebookEntry> = std::vec::Vec::new();
        while stmt.next().unwrap() == sqlite::State::Row {
            let identifier = stmt.read::<i64>(0).unwrap();
            let name = stmt.read::<String>(1).unwrap();
            let version = stmt.read::<i64>(2).unwrap();
            result.push(NotebookEntry{identifier, name, version});
        }
        result.sort_by(|a, b| a.name.cmp(&b.name));
        return Ok(result);
    }

    fn get_notebook(&self, id: i64) -> Result<FullNotebookEntry, CustomError> {
        let connection = &self.connection;
        let mut stmt = connection.prepare(
            "SELECT * FROM documents WHERE id = ?1"
        ).unwrap()
        .bind(1, id)
        .unwrap();
        if stmt.next().unwrap() == sqlite::State::Row {
            let identifier = stmt.read::<i64>(0).unwrap();
            let name = stmt.read::<String>(1).unwrap();
            let version = stmt.read::<i64>(2).unwrap();
            let current = stmt.read::<String>(3).unwrap();
            return Ok(FullNotebookEntry{identifier, name, version, contents:current});
        }
        return Err(CustomError {});
    }

    fn set_notebook(&self, id: i64, contents: String) -> Result<(), CustomError> {
        let connection = &self.connection;
        let mut stmt = connection.prepare(
            "UPDATE documents SET current = ?2 WHERE id = ?1"
        ).unwrap()
        .bind(1, id)
        .unwrap()
        .bind(2, contents.as_str())
        .unwrap();
        if stmt.next().unwrap() == sqlite::State::Done {
            return Ok({});
        }
        return Err(CustomError {});
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db = Database::new();
    let data = web::Data::new(std::sync::Mutex::new(db));

    println!("Starting web server");
    HttpServer::new(move || {
        App::new()
            .app_data(data.clone())
            .wrap(middleware::DefaultHeaders::new()
                .add(("Cross-Origin-Embedder-Policy", "require-corp"))
                .add(("Cross-Origin-Opener-Policy", "same-origin"))
            )
            .service(fs::Files::new("/static", "..", ))
            .service(notebooks)
            .service(notebook)
            .service(notebook_update)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await.unwrap();
    Ok(println!("Stopping web server"))
}
