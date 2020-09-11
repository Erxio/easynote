
module.exports = class PgAdapter {
    constructor() {
        /* Postgre SQL */
        const pg = require("pg");
        this.pool = new pg.Pool({
            user: "postgres",
            host: "localhost",
            database: "EasyNote",
            password: "admin",
            port: 5432
        });
        this.pool.connect();
    }

    add_user(data){
        return new Promise((ok, fail) => {
            this.pool.query("INSERT INTO users(mail, name, hash, salt) VALUES ($1, $2, $3, $4);", [data.mail, data.name, data.hash, data.salt], (err, res)=> {
                if (err) {
                    fail();
                    return;
                }

                ok();
            })
        })
    }

    get_user(mail){
        return new Promise((ok, fail) => {
            this.pool.query("SELECT * from users WHERE mail = $1;", [mail], (err, res) => {
                if (err || res.rowCount != 1) {
                    fail();
                    return;
                } else {
                    ok(res.rows[0]);
                }
            })
        })
    }

    get_root_boards(user){
        return new Promise((ok, fail) => {
            this.pool.query("SELECT id,title  FROM boards where owner = $1;", [user], (err, res) => {
                if (err) {
                    fail();
                    return;
                }
                if (res.rowCount == 0) {
                    ok([]);
                } else {
                    var boards = res.rows;
                    var ids = boards.map(e => e.id);

                    this.pool.query("SELECT boards.id FROM boards, boards_notes where owner = $1 and boards_notes.note_id = boards.id;", [user], (err, res) => {
                        if (err) {
                            fail();
                            return;
                        }
                        if (res.rowCount == 0) {
                            ok([]);
                        } else {
                            res.rows.forEach(element => {
                                var index = ids.indexOf(element.id);
                                if (index >= 0){
                                    ids.splice(index, 1);
                                }
                            });
                            ok(boards.filter(b => ids.includes(b.id)))
                        }
                    })
                }
            })
        });
    }

    get_predecessor_board(boardId) {
        return new Promise((ok, fail) => {
            this.pool.query("SELECT board_id, title from boards_notes, boards WHERE boards_notes.note_id = $1 and boards.id = $1;", [boardId], (err, res) => {
                if (err) {
                    fail();
                    return;
                }
                if (res.rows.length == 0){
                    ok(null);
                    return;
                } else {

                    ok({id: res.rows[0].board_id, title: res.rows[0].title});
                    return;
                }
            })
        });
    }

    get_board(user, id) {
        return new Promise((ok, fail) => {
            this.pool.query("SELECT title, owner FROM boards WHERE id=$1", [id], (err, res) => {
                if (err){
                    fail();
                    return;
                }
                if (res.rows.length == 0) {
                    this.pool.query("INSERT INTO boards(id, title, owner) VALUES($1, $2, $3);", [id, "New Board", user], (err, res) => {
                        ok({
                            id: id,
                            notes: [],
                            title: "New Board",
                            owner: user
                        })
                    })
                } else if (res.rows[0].owner == user) {
                    var board = {
                        id: res.rows[0].id,
                        title: res.rows[0].title,
                        notes: []
                    }
                    this.pool.query("SELECT * FROM notes, boards_notes WHERE id = note_id AND board_id = $1;", [id], (err, res) => {
                        board.notes = res.rows.map(n => { n.color = parseInt(n.color); n.mediaUrl = n.mediaurl; delete n.mediaurl; return n; })
                        ok(board);
                    })
                    console.log("! get all notes for that specific board", res.rows[0].title);
                } else {
                    fail();
                }
            })
        })
    }

    update_board(user, boardId, data){
        console.log(user, boardId, data);
        return new Promise((ok, fail) => {
            //does that person really own note?
            this.pool.query("UPDATE boards SET title = $1 WHERE id = $2 AND owner = $3;",
                [data.title, boardId, user], async (err, res) => {
                    console.log("update board", err, res, data);
                    ok()
            })
            this.pool.query("UPDATE notes SET title = $1 WHERE id = $2 AND owner = $3;",
                [data.title, boardId, user], async (err, res) => {
                    console.log("update boardlink", err, res, data);
                    ok()
            })
        })
   }

    add_note(user, boardId, data) {
        return new Promise((ok, fail) => {
            let pool = this.pool;
            async function insertQuery() {
                pool.query("INSERT INTO notes(id, text, title, color, mediaUrl, x, y, \"from\", owner) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);",
                    [data.id || "", data.text || "", data.title || "", data.color || 0, data.mediaUrl || "", data.x || 0, data.y || 0, data.from, user], async (err, res) => {
                        if (!err) {
                            await pool.query("INSERT INTO boards_notes(board_id, note_id) VALUES($1, $2);",
                                [boardId, data.id])
                            ok()
                        } else {
                            console.log(err);
                            fail();
                            return;
                        }
                    })
            }
            //does that person really own the requested board?
            pool.query("SELECT title, owner FROM boards WHERE id=$1", [boardId], (err, res) => {
                if (err) {
                    fail();
                    return;
                }
                if (res.rows[0].owner == user) {
                    try {
                        insertQuery();
                    } catch {
                        fail();
                        return;
                    }
                } else {
                    fail();
                    return;
                }
            })
        })
    }

    update_note(user, data) {
        return new Promise((ok, fail) => {
            //does that person really own note?
            this.pool.query("UPDATE notes SET text = $1, title = $2, color = $3, mediaUrl = $4, x = $5, y = $6 WHERE id = $7 AND owner = $8;",
                [data.text, data.title, data.color, data.mediaUrl, data.x, data.y, data.id, user], async (err, res) => {
                    console.log(err, res, data);
                    ok()
                })
        })
    }

    remove_note(user, noteId) {
        //does that person really own the requested board and note?
        return new Promise((ok, fail) => {
            //does that person really own note?
            this.pool.query("DELETE FROM notes WHERE id = $1 AND owner = $2;",
                [noteId, user], async (err, res) => {
                    console.log(err, res);
                    ok({
                    })
                })
        })
    }
}