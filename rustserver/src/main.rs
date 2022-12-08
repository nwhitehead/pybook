
use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Serialize, Deserialize};
use std::io::{BufRead, BufReader};
use mailjet_rs::{Client, SendAPIVersion};
use mailjet_rs::common::Recipient;
use mailjet_rs::v3::{Message, Attachment};

const MAILJET_CONFIG_FILE : &'static str = "./mailjet.keys";

struct MailSetup {
    client: Client,
    email_from: String,
    name_from: String,
    email_to: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Feedback {
    choice: String,
    message: String,
    email: String,
    location: String,
    screenshot: Option<String>,
}

#[post("/feedback")]
async fn feedback(data: web::Data<std::sync::Mutex<MailSetup>>, req_body: String) -> impl Responder {
    let mailsetup = data.lock().unwrap();
    let v:Feedback = serde_json::from_str(&req_body).unwrap();
    let msg = format!("Location: {}\nEmail: {}\nChoice: {}\nMesage:\n{}\n", v.location, v.email, v.choice, v.message);
    let mut message = Message::new(
        &mailsetup.email_from,
        &mailsetup.name_from,
        Some("Feedback!".to_string()),
        Some(msg.to_string())
    );

    message.push_recipient(Recipient::new(&mailsetup.email_to));

    let screenshot_data = v.screenshot.unwrap_or("".to_string());
    let screenshot_stripped = screenshot_data.strip_prefix("data:image/png;base64,").unwrap_or("");
    let screenshot = Attachment::new("image/png", "screenshot.png", &screenshot_stripped);
    message.attach_inline(screenshot);
    let html_msg = format!("<h3>Feedback</h3>\n<p>Location: {}</p>\n<p>Email: {}</p>\n<p>Choice: {}</p>\n<p>Message:</p>\n<pre>{}</pre>\n<img src=\"cid:screenshot.png\">\n", v.location, v.email, v.choice, v.message);
    message.html_part = Some(html_msg.to_string());
    let _response = mailsetup.client.send(message).await;

    HttpResponse::Ok()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    println!("Starting web server");

    let mut mailjet_file = BufReader::new(std::fs::File::open(MAILJET_CONFIG_FILE).unwrap()).lines();
    let mailjet_public_key = mailjet_file.next().unwrap().unwrap();
    let mailjet_private_key = mailjet_file.next().unwrap().unwrap();
    let email_from = mailjet_file.next().unwrap().unwrap();
    let name_from = mailjet_file.next().unwrap().unwrap();
    let email_to = mailjet_file.next().unwrap().unwrap();
    let client = Client::new(
        SendAPIVersion::V3,
        &mailjet_public_key,
        &mailjet_private_key,
    );
    let setup = MailSetup {
        client: client,
        email_from: email_from,
        name_from: name_from,
        email_to: email_to,
    };
    let data = web::Data::new(std::sync::Mutex::new(setup));

    HttpServer::new(move || {
        App::new()
            .app_data(data.clone())
            .app_data(web::PayloadConfig::new(2000000))
            .service(feedback)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await.unwrap();
    Ok(println!("Stopping web server"))
}
