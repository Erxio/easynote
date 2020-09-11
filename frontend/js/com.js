const BOARDID = window.location.search.replace("?", "") || "root";
let previousBoard = null;

function onPageLoaded() {
    //Get `/api/${BOARDID}`
    // if (BOARDID != "root") {
        Q("#btn_back").addEventListener("click", () => {
            if (previousBoard != null)
                window.location = "?" + previousBoard;
        })
    // }
    axios.get(`http://localhost:3000/api/${BOARDID}`).then(function (res) {
        var notes = res.data.notes;
        Q("input#boardtitle").value = res.data.title
        Q("input#boardtitle").addEventListener("change", (e) => {
            console.log(e.target.value);
            onBoardLinkUpdated({
                title: e.target.value
            })
            // axios.post(`http://localhost:3000/api/${BOARDID}/update`, {
            //     title: e.target.value
            // })
        })
        if (notes == null) {
            return;
        }
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].from != null) {
                Board(notes[i]);
            } else {
                Note(notes[i]);
            }
        }
        placeCornerStone();
    })
}

function onBoardLinkUpdated(data){
    axios.post(`http://localhost:3000/api/${data.id || BOARDID}/update`, data).then(function (res) {
    })
    placeCornerStone();
}

function getPreviousBoard(){
    axios.get(`http://localhost:3000/api/${BOARDID}/previous/`).then(function (res) {
        console.log(res.data);
        previousBoard = res.data.id;
        if (previousBoard != null){
            Q("#btn_back").style.opacity = "1"
            Q("#btn_back").style.pointerEvents = "inherit"
            Q("#btn_back").innerText = res.data.title
        }
        // console.log("?"+res.data.id);
    })
}

function onNoteCreated(data) {
    window.toast("Note created")
    axios.post(`http://localhost:3000/api/${BOARDID}/notes/add`, data).then(function (res) {
    })
    placeCornerStone();
    //Post `/api/${BOARDID}/notes/add`
}
function onNoteUpdated(data) {
    if (data == null) return;
    window.toast("Note updated")
    axios.post(`http://localhost:3000/api/${BOARDID}/notes/update/${data.id}`, data).then(function (res) {
    })
    placeCornerStone();
    //Post `/api/${BOARDID}/notes/update/${data.id}`
}
function onNoteRemoved(data) {
    window.toast("Note removed")

    axios.get(`http://localhost:3000/api/${BOARDID}/notes/remove/${data.id}`).then(function (res) {
    })
    placeCornerStone();
    //Get `/api/${BOARDID}/notes/remove/${data.id}`
}

function onBoardCreated(data) {
    window.toast("Board created")
    axios.post(`http://localhost:3000/api/${BOARDID}/boards/add`, data).then(function (res) {
    })
    //Post `/api/${BOARDID}/boards/add`
}
function onBoardUpdated(data) {
    if (data == null) return;
    window.toast("Board updated")
    axios.post(`http://localhost:3000/api/${BOARDID}/boards/update/${data.id}`, data).then(function (res) {
    })
    //Post `/api/${BOARDID}/boards/update/${data.id}`
}
function onBoardRemoved(data) {
    window.toast("Board removed")

    axios.get(`http://localhost:3000/api/${BOARDID}/boards/remove/${data.id}`).then(function (res) {
    })
    //Get `/api/${BOARDID}/boards/remove/${data.id}`
}

function onListCreated(data) {
    window.toast("List created")
    // `/api/${BOARDID}/lists/add`
}
function onListUpdated(data) {
    window.toast("List updated")
    // `/api/${BOARDID}/lists/update/${data.id}`
}
function onListRemoved(data) {
    window.toast("List removed")
    // `/api/${BOARDID}/lists/remove/${data.id}`
}
