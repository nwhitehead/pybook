
#[macro_use] extern crate rocket;

use rocket::http::{Header, ContentType};

#[derive(Responder)]
#[response()]
struct JavaScriptApplication {
    text: &'static str
}

#[rocket::get("/")]
fn index() -> JavaScriptApplication {
    JavaScriptApplication { text: "Hello, world!\n" }
}

struct Wrapping<R>(R);

// struct JavaScriptFile(&'static str);

// impl rocket::response::Responder for JavaScriptFile {}

#[rocket::launch]
fn rocket() -> _ {
    rocket::build().mount("/", rocket::routes![index])
        .mount("/static", rocket::fs::FileServer::from(".."))
}
