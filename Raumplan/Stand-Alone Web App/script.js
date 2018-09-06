window.addEventListener("load", function(){

    var Grundriss = document.getElementById("Grundriss").contentDocument;
    /*window.setTimeout(function(){
        location.reload(true);
    }, 1000)*/
})

window.addEventListener("load", function(){
    req = new XMLHttpRequest();
    req.open("get", "rooms.js", true);
    req.addEventListener("readystatechange", function(){
        if(req.target.readyState == 4 && req.target.status == 200){
            alert(req.target.responseText);
        }
    })
    req.send()
})