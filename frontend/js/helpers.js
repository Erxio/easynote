function E(tag, text = "", classes = []) {
    var e = document.createElement(tag);
    for (var i = 0; i < classes.length; i++) {
        e.classList.add(classes[i])
    }
    e.innerText = text;
    return e;
}

function Q(query) {
    return document.querySelector(query);
}

function QA(query) {
    return document.querySelectorAll(query);
}


window.toast = function (text, color) {
    let toast = E("div", text, ["toast", color]);

    Q(".toaster").appendChild(toast);

    this.setTimeout(function () {
        toast.classList.add("hide");
        this.setTimeout(function () {
            Q(".toaster").removeChild(toast);
        }, 550);
    }, 2000);
}

function showModal(name) {
    var modal = Q("[target='" + name + "']");
    if (modal != null) {
        modal.classList.toggle("hide", false);
        modal.classList.toggle("show", true);
        Q(".backdrop").classList.toggle("show", true);
    }
}
function hideModal(name) {
    var modal = Q("[target='" + name + "']");
    if (modal != null) {
        modal.classList.toggle("hide", true);
        setTimeout(function () {
            modal.classList.toggle("show", false);
            Q(".backdrop").classList.toggle("show", false);
        }, 180);

    }
}

function getColor(colorIndex = 0, alternative = null) {
    var text = alternative == "text"
    switch (colorIndex) {
        case 1: return text ? "#fff" : "#940a37";
        case 2: return text ? "#000" : "#ee4540";
        case 3: return text ? "#000" : "#4d80e4";
        case 4: return text ? "#000" : "#46b3e6";
        case 5: return text ? "#fff" : "#2c7873";
        case 6: return text ? "#000" : "#6fb98f";
        case 7: return text ? "#000" : "#eb8242";
        case 8: return text ? "#000" : "#f6da63";
        case 9: return text ? "#fff" : "#9656a1";
        case 10: return text ? "#000" : "#c2b0c9";
        default: return text ? "#fff" : "#222831";
    }
}

function getColors() {
    let colors = [];
    while (colors[0] != getColor(colors.length)) {
        colors.push(getColor(colors.length))
    }
    return colors;
}

function pickColor() {
    return;
    showModal("colorpicker")
    return new Promise((ok, fail) => {
        let colors = getColors();
        Q("[target='colorpicker'] .content").innerHTML = "";
        for (let i = 0; i < colors.length; i++) {
            var colorPicker = E("div", "", ["color"]);
            colorPicker.style.backgroundColor = colors[i];
            colorPicker.setAttribute("colorIndex", i);
            colorPicker.addEventListener("click", function () {
                ok({ index: i, hex: colors[i] })
                hideModal("colorpicker")
            })
            Q("[target='colorpicker'] .content").appendChild(colorPicker)
        }
    });
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isParentOf(parent, potentialChild){
    var child = potentialChild;
    while(child != document.body){
        if (child == parent) return true;
        child = child.parentNode;
    }
    return false;
}

function isChildOfClass(selector, _element){
    var element = _element;
    while (element != document.body.parentNode){
        if (element.classList.contains(selector)){
            return true;
        }
        element = element.parentNode
    }
    return false;
}

var closeCircularMenu = null;

function spawnCircularMenu(e, actions,  actionRenderer = null){
    return new Promise(function(okay, fail){
        var menu = Q("#circularmenu")
        closeCircularMenu = function(){
            menu.style.display = "none";
            closeCircularMenu = null;
            okay("close");
        }
        menu.style.display = "block";
        menu.style.left = e.pageX + "px";
        menu.style.top = e.pageY + "px";
        var close = Q("#circularmenu .close").cloneNode();
        close.addEventListener("click", function(){
            okay("close");
            menu.style.display = "none";
        })
        close.innerText = Q("#circularmenu .close").innerText;
        menu.replaceChild(close, Q("#circularmenu .close"));

        var actionContainer = Q("#circularmenu .actions")
        actionContainer.innerHTML = "";
        for(let i = 0; i < actions.length; i++){
            let action = actionRenderer ? actionRenderer(actions[i]) : E("DIV", actions[i], ["action"]);
            var deg = (360 * i) / actions.length;
            deg -= 90;
            let x = 64 * Math.cos( deg * Math.PI / 180);
            let y = 64 * Math.sin(deg * Math.PI / 180);

            setTimeout(function(){
                action.style.transform = `translate(${x}px, ${y}px)`
            }, 1)
            action.addEventListener("click", function(){
                okay(actions[i])
                menu.style.display = "none";
            })
            actionContainer.appendChild(action);
        }
    });
}

function placeCornerStone(){
    var mX = 0, mY = 0;

    for (const noteElement of QA(".note")){
        var rect = noteElement.getBoundingClientRect();
        var x = window.scrollX + rect.x + rect.width;
        var y = window.scrollY + rect.y + rect.height;
        mX = Math.max(x, mX)
        mY = Math.max(y, mY)
    }

    var cornerElement = Q("#corner");
    cornerElement.style.left = (mX + 250) + "px";
    cornerElement.style.top = (mY + 250) + "px";
}