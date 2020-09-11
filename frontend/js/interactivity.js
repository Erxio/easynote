function newNoteTrigger(e) {

    if (e.target.tagName == "TEXTAREA" ||
        e.target.tagName == "INPUT") { return; }
    var target = e.target;
    var depth = 0;
    while (depth++ < 10 && target.classList != null && !target.classList.contains("board")) {
        target = target.parentNode;
    }
    if (target.classList && target.classList.contains("board")) {
        return;
    };
    Note({ x: e.clientX, y: e.clientY, color: 0, id: uuid() })
}

window.onload = async function () {
    onPageLoaded();
    document.body.addEventListener("mouseup", dragEnd);
    document.body.addEventListener("mousedown", function(e) {
        var dragBackground = !isChildOfClass("note", e.target)
        if (!dragBackground) return;

        dragStart(e);
    });
    document.body.addEventListener("mousemove", function (e) {
        dragMove(e);
        //circularmenu;
        if (closeCircularMenu) {
            var mouseDistance = 0;
            var dx = e.clientX - Q("#circularmenu").getBoundingClientRect().x;
            var dy = e.clientY - Q("#circularmenu").getBoundingClientRect().y;
            mouseDistance = Math.sqrt(dx * dx, dy * dy);
            if (mouseDistance > 100) closeCircularMenu();
        }
    });
    //document.body.addEventListener("dblclick", newNoteTrigger);
    document.body.addEventListener("contextmenu", function (e) {
        var openMenu = !isChildOfClass("note", e.target)
        if (!openMenu) return;

        e.preventDefault();
        spawnCircularMenu(e, ["Note", /*"List",*/ "Board"]).then(function (action) {
            window.toast(action)
            if (action == "Note") {
                var data = {
                    x: e.clientX - 125 - backgroundTranslate[0],
                    y: e.clientY - 20  - backgroundTranslate[1],
                    title: "",
                    text: "",
                    id: uuid()
                }
                Note(data);
                onNoteCreated(data);
            }
            else if (action == "Board") {
                var data = {
                    x: e.clientX - 125 - backgroundTranslate[0],
                    y: e.clientY - 20  - backgroundTranslate[1],
                    title: "New board",
                    from: BOARDID,
                    id: uuid()
                }
                Board(data);
                onNoteCreated(data);
            }
        })
    })

    document.body.addEventListener("keyup", function (e) {
        if (e.which === 90 && e.ctrlKey) {
            RevertRemoval();
        }
    })
    document.body.addEventListener("paste", function (e) {
        if (Q(":focus") != null) return; // dont act when a text is copied into a textfield 

        //create a new note and append it to the boards
        var data = {
            text: e.clipboardData.getData("text"),
            id: uuid(),
            title: "From Clipboard",
            x: 0.0,
            y: 0.0,
            color: 0
        };
        var clipboardHasFile = false,
            clipboardHasImage = false;
        let imageType = null
        for (var i = 0; i < e.clipboardData.items.length; i++) {
            if (!clipboardHasFile && e.clipboardData.items[i].kind == "file" && !clipboardHasImage && e.clipboardData.items[i].type.startsWith("image")) {
                clipboardHasFile = true;
                clipboardHasImage = true;
                imageType = e.clipboardData.items[i].type
                // Crossbrowser support for URL
                var URLObj = window.URL || window.webkitURL;

                var img = new Image();

                // Once the image loads, render the img on the canvas
                img.onload = function () {
                    var mycanvas = document.createElement("canvas");
                    mycanvas.width = img.width;
                    mycanvas.height = img.height;
                    var ctx = mycanvas.getContext('2d');
                    // Draw the image
                    ctx.drawImage(img, 0, 0);

                    // Execute callback with the base64 URI of the image
                    data.mediaUrl = mycanvas.toDataURL(imageType);
                    data.text = "";
                    data.title = "";
                    Note(data);
                    onNoteCreated(data);
                };
                img.src = URLObj.createObjectURL(e.clipboardData.items[i].getAsFile());
                break;
            }
        }


        axios.get(data.text).then(res => {
            var contentType = (res.headers["content-type"]);
            if (contentType.indexOf("image") >= 0) {
                data.mediaUrl = data.text;
                data.text = "";
                data.title = "";
                Note(data);
                onNoteCreated(data);
            }
        }).catch(function () {
            Note(data);
            onNoteCreated(data);
        })

    })
    /*
    setInterval( () => {
        window.toast("Toast! :)")
    }, 1000) */
}