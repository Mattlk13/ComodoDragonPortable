//window.addEventListener("load", function load(e)
//{
//    sometestfunction();
////    CallExtension();
//});

window.addEventListener("message", receiveMessage, false);


document.addEventListener("MyAnswerEvent", function(e) {
    ExtensionAnswer(e);
}, false);

var element;

function CallExtension()
{
    var element = document.createElement("MyExtensionDataElement");
    element.setAttribute("attribute1", "foobar");
    element.setAttribute("attribute2", "hello world");
    document.documentElement.appendChild(element);
    var evt = document.createEvent("Events");
    evt.initEvent("MyExtensionEvent", true, false);
    element.dispatchEvent(evt);
}

function ExtensionAnswer(EvtAnswer)
{
    var lastul = document.getElementById("embedList");
    var node = document.createElement("LI");
    node.innerHTML = "hello js";
    lastul.appendChild(node);
}