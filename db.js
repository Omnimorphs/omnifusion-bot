const fs = require('fs');

const path = './db.json';

class Db {

  constructor() {
    this.read();
  }

  save() {
    fs.writeFileSync(path, JSON.stringify(this.json, null, 2));
  }

  read() {
    this.json = JSON.parse(fs.readFileSync(path, 'utf-8'))
  }
}

module.exports = {
  db: new Db()
}
