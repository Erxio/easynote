
let dragDeltaPosition = [0,0]
let dragTarget = null;

let backgroundTranslate = [0,0]


function dragStart(e){
    if (e.target.tagName == "TEXTAREA" || 
    e.target.tagName == "INPUT"){ return;}

    var target = e.target;
    var depth = 0;
    while ( target != null && target.classList != null && depth++ < 10 && !target.classList.contains("board")){
        target = target.parentNode;
    }

    if (target.classList != null && !target.classList.contains("board")){
        window.toast("No draggable object found", "error")
        dragTarget = null;
        return;
    } else if (target.classList == null){
        dragTarget = document.body;
        dragDeltaPosition =[e.screenX, e.screenY];
        return;
    }


    var dx = 0, dy = 0;
    dx = target.getBoundingClientRect().x - e.x - backgroundTranslate[0];
    dy = target.getBoundingClientRect().y - e.y - backgroundTranslate[1];
    dragDeltaPosition = [dx, dy];  

    dragTarget = target;
    target.classList.add("grabbing")
}

const CLAMPRANGE = 10
function dragMove(e){
    if (dragTarget != null && dragTarget.classList != null && dragTarget.classList.contains("board")){
        dragTarget.style.left = (e.pageX + dragDeltaPosition[0]) - (e.pageX + dragDeltaPosition[0]) % CLAMPRANGE + "px"
        dragTarget.style.top = (e.pageY + dragDeltaPosition[1]) - (e.pageY + dragDeltaPosition[1]) % CLAMPRANGE + "px"
    } else if (dragTarget != null && dragTarget == document.body){
        
        backgroundTranslate[0] = backgroundTranslate[0] - (e.movementX) * -1;
        backgroundTranslate[1] = backgroundTranslate[1] - (e.movementY) * -1;
        document.getElementById("container").style.transform = `translate(${backgroundTranslate[0]}px, ${backgroundTranslate[1]}px)`
    }
}

function dragEnd(){
    //if (dragTarget && dragTarget.onNoteUpdated){
    //    dragTarget.onNoteUpdated();
    //}

    dragTarget = null;
    dragDeltaPosition = [0, 0];  

}


function Note(data) {
    var noteElement = E("div", "", ["board", "note"]);

    noteElement.onUpdated = onNoteUpdated;
    noteElement.onRemoved = onNoteRemoved;

    var mediaElement = E("img", "", ["media"]);
    if (data.mediaUrl != null && data.mediaUrl != ""){
        //noteElement.style.backgroundImage = `url("${data.mediaUrl}")`
        //noteElement.style.backgroundSize = "cover"
        mediaElement.src = data.mediaUrl;
    }
    mediaElement.setAttribute("draggable", false)

    var urlElement = E("div", data.mediaUrl, ["url"]);

    var titleElement = E("div", data.title || "", ["title"]);
    var editTitleElement = E("input");
    editTitleElement.setAttribute("placeholder", "Note Title")
    //editTitleElement.style.display = "none";

    var textElement = E("div", data.text || "", ["text"]);
    var editTextElement = E("textarea");
    //editTextElement.setAttribute("rows", 2)
    editTextElement.setAttribute("placeholder", "Put your text here")
    editTextElement.style.height = "auto";

    if (data.mediaUrl != null && data.mediaUrl != ""){
        noteElement.appendChild(mediaElement);
        if ( !data.mediaUrl.startsWith("data:"))
            noteElement.appendChild(urlElement);
    }
    //noteElement.appendChild(titleElement);
    noteElement.appendChild(editTitleElement);
    editTitleElement.value = data.title;
    editTitleElement.addEventListener("change", function(e){
        data.title = this.value;
        onNoteUpdated(data);
    })
    
    //noteElement.appendChild(textElement);
    noteElement.appendChild(editTextElement);
    editTextElement.value = data.text;
    editTextElement.addEventListener("change", function(e){
        data.text = this.value;
        onNoteUpdated(data);
        
    })
    editTextElement.addEventListener("input", function(){
        editTextElement.style.height = "auto";
        editTextElement.style.height = (editTextElement.scrollHeight + 5) + "px";
    })
    setTimeout(() => {
        editTextElement.style.height = "auto";
        editTextElement.style.height = (editTextElement.scrollHeight + 5) + "px";
    }, 100)

    var removeAction = E("div", "✕", ["action", "a"])
    noteElement.appendChild(removeAction);
    removeAction.addEventListener("click", function(){
        //noteElement.parentNode.removeChild(noteElement);
        Q(".bin").appendChild(noteElement);
        onNoteRemoved(data);
    });

    var recolorAction = E("div", "", ["action", "b"])
    recolorAction.addEventListener("click", function(e){
        //pickColor()
        spawnCircularMenu(e, getColors().map(function(_, i){return i}), function(colorIndex){
            var action = E("div", "", ["action"]);
            action.style.backgroundColor = getColor(colorIndex);
            return action;
        }).then(function(c){
            if (c == "close") return;
            data.color = c;
            recolorAction.style.backgroundColor = getColor(data.color);
            noteElement.style.borderColor = getColor(data.color);
            onNoteUpdated(data);
        })
    })
    recolorAction.style.backgroundColor = getColor(data.color);
    noteElement.style.borderColor = getColor(data.color);   
    noteElement.appendChild(recolorAction);

    noteElement.addEventListener("mousedown", dragStart)
    noteElement.addEventListener("mouseup", function(e){
        dragEnd(e);
        var boundingRect = noteElement.getBoundingClientRect();
        data.x = boundingRect.x - backgroundTranslate[0];
        data.y = boundingRect.y - backgroundTranslate[1];
        onNoteUpdated(data);
    })
    noteElement.style.left = (data.x || 0) + "px";
    noteElement.style.top = (data.y || 0) + "px";

    noteElement.onEditRequest = function(){
        return;
    }

    noteElement.addEventListener("contextmenu", function(e){
        if (e.target.tagName == "TEXTAREA" || 
        e.target.tagName == "INPUT"){ return;}

        e.preventDefault();
    })
    document.getElementById("container").appendChild(noteElement);
    return noteElement;
}

function Board(data) {
    var boardElement = E("div", "", ["board", "note", "link"]);

    boardElement.onUpdated = onNoteCreated;
    boardElement.onRemoved = onNoteRemoved;


    var titleElement = E("div", data.title || "", ["title"]);
    var editTitleElement = E("input");
    editTitleElement.setAttribute("placeholder", "Board Title")

    boardElement.appendChild(editTitleElement);
    editTitleElement.value = data.title;
    editTitleElement.addEventListener("change", function(e){
        data.title = this.value;
        onBoardLinkUpdated({title: data.title, id :data.id});
    })

    var removeAction = E("div", "✕", ["action", "a"])
    boardElement.appendChild(removeAction);
    removeAction.addEventListener("click", function(){
        //noteElement.parentNode.removeChild(noteElement);
        Q(".bin").appendChild(boardElement);
        onNoteRemoved(data);
    });

    var recolorAction = E("div", "", ["action", "b"])
    recolorAction.addEventListener("click", function(e){
        //pickColor()
        spawnCircularMenu(e, getColors().map(function(_, i){return i}), function(colorIndex){
            var action = E("div", "", ["action"]);
            action.style.backgroundColor = getColor(colorIndex);
            return action;
        }).then(function(c){
            if (c == "close") return;
            data.color = c;
            recolorAction.style.backgroundColor = getColor(data.color);
            boardElement.style.backgroundColor = getColor(data.color);
            editTitleElement.style.color = getColor(data.color, "text");
            onNoteUpdated(data);
        })
    })
    recolorAction.style.backgroundColor = getColor(data.color);
    boardElement.style.backgroundColor = getColor(data.color);   
    editTitleElement.style.color = getColor(data.color, "text");
    boardElement.style.borderStyle = "none"
    boardElement.appendChild(recolorAction);

    boardElement.addEventListener("mousedown", dragStart)
    boardElement.addEventListener("mouseup", function(e){
        dragEnd(e);
        var boundingRect = boardElement.getBoundingClientRect();
        data.x = boundingRect.x;
        data.y = boundingRect.y;
        onNoteUpdated(data);
    })
    boardElement.addEventListener("dblclick", function(e){
        if (e.target.tagName == "TEXTAREA" || 
        e.target.tagName == "INPUT"){ return;}
        
        window.location = "?"+data.id
    })

    boardElement.style.left = (data.x || 0) + "px";
    boardElement.style.top = (data.y || 0) + "px";

    boardElement.addEventListener("contextmenu", function(e){
        if (e.target.tagName == "TEXTAREA" || 
        e.target.tagName == "INPUT"){ return;}

        e.preventDefault();
    })
    document.getElementById("container").appendChild(boardElement);
    return boardElement;
}

function RevertRemoval(){
    if(Q(".bin").children.length > 0)
        document.getElementById("container").appendChild(Q(".bin").lastElementChild)
} 

