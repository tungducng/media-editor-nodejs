const fs = require("node:fs");

const videosPath = "./data/videos";
const usersPath = "./data/users";
const sessionsPath = "./data/sessions";

class DB {
  constructor() {
    this.videos = JSON.parse(fs.readFileSync(videosPath, "utf8"));
    this.users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    this.sessions = JSON.parse(fs.readFileSync(sessionsPath, "utf8"));
  }

  update() {
    this.videos = JSON.parse(fs.readFileSync(videosPath, "utf8"));
    this.users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    this.sessions = JSON.parse(fs.readFileSync(sessionsPath, "utf8"));
  }

  save() {
    fs.writeFileSync(videosPath, JSON.stringify(this.videos));
    fs.writeFileSync(usersPath, JSON.stringify(this.users));
    fs.writeFileSync(sessionsPath, JSON.stringify(this.sessions));
  }
}

const db = new DB();

module.exports = db;
