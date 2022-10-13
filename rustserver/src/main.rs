
use actix_web::{get, middleware, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files as fs;

const DB_FILENAME : &'static str = "../build/pybookdb.sql";
const NOTEBOOK_DIR : &'static str = "../notebooks";

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

fn setup_db() {
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
        println!("File considered is {:}", filename);
        // Look for the filename in the documents
        let mut stmt = connection.prepare(
            "SELECT * FROM documents WHERE name = ?1"
        ).unwrap()
        .bind(1, filename)
        .unwrap();
        if stmt.next().unwrap() == sqlite::State::Row {
            println!("Found filename={}", stmt.read::<String>(1).unwrap());
        } else {
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
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    setup_db();
    println!("Starting web server");
    HttpServer::new(|| {
        App::new()
            .wrap(middleware::DefaultHeaders::new()
                .add(("Cross-Origin-Embedder-Policy", "require-corp"))
                .add(("Cross-Origin-Opener-Policy", "same-origin"))
            )
            .service(fs::Files::new("/static", "..", ))
            .service(hello)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await.unwrap();
    Ok(println!("Stopping web server"))
}
