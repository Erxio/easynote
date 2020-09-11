const demouser = "48637a90-64df-45f1-b788-ba3be451d996",
    demoboard = "e2a93136-f1c9-45d6-8359-910353fed9a4"

var express = require("express");
const cors = require("cors")
const PGA = new (require("./pg_adapter.js"))();
const uuid = require("uuid/v1")
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

let sessionTokens = {

}

function addToken(mail){
    var key = uuid();
    sessionTokens[key] = {
        timeout: new Date().setDate(new Date().getDate() + 1),
        mail
    }
    return key;
}

const crypto = require("crypto");
var genRandomString = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length);   /** return required number of characters */
};
var sha512 = function (password, salt) {
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};
function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    return {
        salt: passwordData.salt,
        hash: passwordData.passwordHash
    }
}
function comparePassword(userpassword, salt, hash) {
    var _hash = sha512(userpassword, salt).passwordHash;
    return _hash == hash;
}

// var {hash, salt} = saltHashPassword('MYPASSWORD');
// var okay = comparePassword('MYPASSWORD2', salt, hash);
// console.log(okay);

/*
user:
    id
    hash
    salt
    name
    mail
*/

// const lowdb = require("lowdb")
// const FileSync = require("lowdb/adapters/FileSync")
// const adapter = new FileSync("data.db")
// const db = lowdb(adapter)
// db.defaults({
//     boards: [],
//     users: []
// }).write();

// PGA.get_board(demouser, demoboard)
// PGA.add_note(demouser, demoboard, {id: "791f619c-6ccd-4650-8b5a-ac44ebe5bd0b", title:"Test Note", text:"This is a test!", color:2, x: 200.34, y: 215.25}).catch(_=>{})
// PGA.add_note(demouser, demoboard, {id: "791f619c-6ccd-4650-8b5a-ac44ebe5bd0c", title:"Test Media Note", mediaUrl:"This is a test!", color:2, x: 200.34, y: 215.25}).catch(_=>{})
// PGA.update_note(demouser, demoboard, {id: "791f619c-6ccd-4650-8b5a-ac44ebe5bd0c", title:"Updated Title", mediaUrl:"This is a test!", color:2, x: 200.34, y: 215.25}).catch(_=>{})
// PGA.remove_note(demouser, demoboard, "791f619c-6ccd-4650-8b5a-ac44ebe5bd0c").catch(_=>{})
const _MDL_Board = {
    id: "id",
    lists: [],
    notes: [],
    links: [],
    title: "Title",
    owner: "userId"
}

app.use(cors())


app.post("/api/login", async (req, res) => {
    console.log("/api/login/", req.body);
    if (req.body.mail && req.body.password){
        PGA.get_user(req.body.mail).then(user => {
            if (comparePassword(req.body.password, user.salt, user.hash)){
                res.send(`{ "token" : "${addToken(req.body.mail)}"}`)
            } else {
                res.sendStatus(401)
            }
        }).catch(() => {
            res.sendStatus(401)
            return;
        });

    }
})
app.post("/api/register", async (req, res) => {
    var user = {...req.body};
    if (user.mail && user.name && user.password) {
        var {salt, hash} = saltHashPassword(user.password);
        delete user.password;
        delete user.password_check;
        delete user.mail_check;
        user.salt = salt;
        user.hash = hash;

        await PGA.add_user(user).then(() => {
            res.sendStatus(201);
        }).catch((err) => {
            res.sendStatus(400);
        });
    }
})
app.use(function (req, res, next) {
    if (!req.headers.authorization || sessionTokens[req.headers.authorization] == null || new Date().getTime() > sessionTokens[req.headers.authorization].timeout){
        delete sessionTokens[req.headers.authorization];
        res.sendStatus(401);
        return;
    }
    req.user = sessionTokens[req.headers.authorization].mail
    next();
});

app.get("/api/boards", async (req, res) => {
    res.send(await PGA.get_root_boards("admin@flexnote"));
})
app.get("/api/:boardId", async (req, res) => {
    // var data = db.get("boards").filter({id: req.params.boardId}).value();
    // if (data.length == 0/* && req.params.boardId == "root"*/){
    //     data = {title: "New Board", notes:[], links:[], lists:[], id:req.params.boardId};
    //     db.get("boards").push(data).write()
    // }
    // res.send(data[0])
    res.send(await PGA.get_board(req.user, req.params.boardId))
})
app.get("/api/:boardId/previous", async (req, res) => {
    var data = await PGA.get_predecessor_board(req.params.boardId);
    res.send(data);
    // var boards = db.get("boards").filter({}).value();
    // boards.forEach(element => {
    //     if (element.notes){
    //         var notes = element.notes.filter(n => n.id == req.params.boardId) 
    //         if (notes.length == 1){
    //             res.send({id: notes[0].from})
    //             return;
    //         }
    //     }
    // });
})
app.post("/api/:boardId/update", async (req, res) => {
    await PGA.update_board(req.user, req.params.boardId, req.body);
    res.send("ok");
})

app.post("/api/:boardId/notes/add", async (req, res) => {
    // var board = db.get("boards").find({id: req.params.boardId}).value();
    // board.notes.push(req.body);
    // db.get("boards").find({id: req.params.boardId}).assign({notes: board.notes}).write();
    await PGA.add_note(req.user, req.params.boardId, req.body);

    res.send("ok");
})
app.post("/api/:boardId/notes/update/:noteId", async (req, res) => {
    // var board = db.get("boards").find({id: req.params.boardId}).value();
    // for(var i = 0; i < board.notes.length; i++){
    //     var note = board.notes[i];
    //     if (req.body.id == note.id){
    //         board.notes[i] = req.body;
    //         break;
    //     }
    // }
    // db.get("boards").find({id: req.params.boardId}).assign({notes: board.notes}).write();
    await PGA.update_note(req.user, req.body);

    res.send("ok");
})
app.get("/api/:boardId/notes/remove/:noteId", async (req, res) => {
    // var board = db.get("boards").find({id: req.params.boardId}).value();
    // // console.log(board.notes.map(e => e.id))
    // // console.log(board.notes.map(e => e.id).indexOf(req.params.noteId))
    // board.notes.splice(board.notes.map(e => e.id).indexOf(req.params.noteId),1)
    // db.get("boards").find({id: req.params.boardId}).assign({notes: board.notes}).write();
    await PGA.remove_note(req.user, req.params.noteId);

    res.send(req.params.boardId);
})

console.log("listening")
app.listen(3000);