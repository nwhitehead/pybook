
use actix_web::{get, middleware, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files as fs;

const DB_FILENAME : &'static str = "../build/pybookdb.sql";
const NOTEBOOK_DIR : &'static str = "../notebooks";

struct Database {
    connection : sqlite::Connection,
}

#[derive(Debug)]
struct CustomError {}

#[get("/notebooks")]
async fn notebooks(data: web::Data<std::sync::Mutex<Database>>) -> impl Responder {
    let db = data.lock().unwrap();
    let ids = db.get_notebooks().unwrap();
    HttpResponse::Ok().body(format!("Notebook ids are {:?}\n", ids))
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

impl Database {

    fn new() -> Database {
        let connection = sqlite::open(DB_FILENAME).unwrap();
        // Create the tables if they don't exist
        connection.execute(
            "
            CREATE TABLE IF NOT EXiSTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, current TEXT);
            CREATE TABLE IF NOT EXISTS history (id INTEGER, datetime TEXT, data TEXT);
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
                    "INSERT INTO documents (name, current) VALUES (?1, ?2)"
                ).unwrap()
                .bind(1, filename)
                .unwrap()
                .bind(2, contents.as_str())
                .unwrap()
                .next()
                .unwrap();
            }
        }
        return Database {
            connection: connection
        };
    }
    fn get_notebooks(&self) -> Result<std::vec::Vec<i64>, CustomError> {
        let connection = &self.connection;
        let mut stmt = connection.prepare(
            "SELECT * FROM documents"
        ).unwrap();
        let mut result : std::vec::Vec<i64> = std::vec::Vec::new();
        while stmt.next().unwrap() == sqlite::State::Row {
            let id = stmt.read::<i64>(0).unwrap();
            result.push(id);
        }
        return Ok(result)/* Err(CustomError {}) */
    }
}

// fn get_notebooks() -> Result<std::vec::Vec<i64>, Box<dyn std::error::Error>> {
//     return Err()
// }

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
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await.unwrap();
    Ok(println!("Stopping web server"))
}
