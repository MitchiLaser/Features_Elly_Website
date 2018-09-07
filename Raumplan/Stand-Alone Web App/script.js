// Definition der Räume als globales Objekt
var Rooms, Grundriss;

window.addEventListener("load", function () {

    // DOM Referenzen zu den wichtigen Positionen anlegen
    Grundriss = document.getElementById("Grundriss").contentDocument;
    var RaumnummerFeld = document.getElementById("RaumnummerAuswahl");

    /*window.setTimeout(function(){
        location.reload(true);
    }, 1000)*/


    /*
    * Event Handler für das Raumauswahl-Menü
    */
    RaumnummerFeld.addEventListener("change", function(){
        
        // der ausgewählte Raum wird in dem "Rooms" Objekt gesucht und daraus extrahiert
        var selectedRoom = undefined;
        for(var i = 0; i< Rooms.length && selectedRoom == undefined; i++){
            if(Rooms[i].id == RaumnummerFeld.value){
                selectedRoom = Rooms[i];
            }
        }

        StockwerkAnzeigen(selectedRoom.stockwerk);

        // TODO: den ausgewählten Raum farblich hervorheben
        RaumAnzeigen(selectedRoom.id);
        //Grundriss.getElementById("raum" + selectedRoom.id).style.fill = 'red';
    });
});


/*
 * Da die Räume auf unterschiedlichen Stockwerken liegen und diese sich auf unterschiedlichen Ebenen befinden,
 * muss je nach Raum die Ebene gewechselt werden 
 */
function StockwerkAnzeigen ( stockwerk ){
    for(var i = 0; i < 4; i++){
        Grundriss.getElementById(stockwerkID(i)).style.display = 'none';
    }
    Grundriss.getElementById(stockwerkID(stockwerk)).style.display = 'inline';
}

/*
 * In der JSON Datei sind die Stockwerke nach einer Nummer benannt, aber in der SVG haben sie eine andere ID.
 * Daher wird hier die Übersetzung vorgenommen
 */
function stockwerkID( stockwerk ){
    switch(stockwerk){
        case 0: return "Erdgeschoss";
        case 1: return "1Obergeschoss";
        case 2: return "2Obergeschoss";
        case 3: return "3Obergeschoss";
    }
}

/*
 * Diese Funktion bietet die Möglichkeit, einen einzelnen Raum in einer bestimmten Farbe hervorzuheben.
 * Dabei wird die Hervorhebung aller anderen Räume vorher rückgängig genacht
 */
function RaumAnzeigen ( raumid ){
    for(var i = 0; i < Rooms.length; i++){
        Grundriss.getElementById("raum" + Rooms[i].id).style.fill = 'none';
    }
    Grundriss.getElementById("raum" + raumid).style.fill = 'red';
}


/*
 * 
 * Nachfolgend werden die Infos über die Räume aus einer externen JSON Datei bezogen.
 * Dazu wird die Datei zu allererst über einen Get Request vom Server abgeholt.
 * Das Ergebnis wird in dem globalen Objekt "Rooms" gespeichert. Darin befindet sich ein Array aus Raum-Objekten.
 * Jedes Raum-Objekt besitzt die Werte:
 *  > "nummer" (String oder null) für die Raumnummer, sofern der Raum eine Nummer hat
 *  > "name" (String oder null) für den Raumnamen, sofern der Raum einen Raumnamen hat
 *  > "id" (String), um in der SVG Datei den Raum (bzw. die Gruppe) ansprechen zu können
 *  > "stockwerk" (Number) für das Stockwerk, in dem sich der Raum befindet
 * 
 */

// Die Rauminfos über einen GET Request abholen
window.addEventListener("load", function () {
    req = new XMLHttpRequest();
    req.open("GET", "rooms.json", true);
    req.addEventListener('readystatechange', function (req) {
        if (req.target.readyState == 4 && req.target.status == 200) {

            // JSON Objekt in JavaScript Objekt umwandeln
            if(window.JSON){
                Rooms = JSON.parse(req.target.responseText);
            }
            else{
                Rooms = eval("(" + req.target.responseText + ")");
            }

            // Das Menü für die Raumsuche aufbauen
            document.getElementById("RaumnummerAuswahl").innerHTML = Rooms.buildMenue();

        }
    });
    req.send();
});

// Prototyp-Funktion, um aus den Rauminfos das Auswahlmenü für die Raumsuche aufzubauen
Array.prototype.buildMenue = function(){
    var Menu = "";
    for(var i = 0; i < this.length; i++){
        Menu += "<option value='" + this[i].id + "'>";

        // Raumnummer hinzufügen, falls vorhanden
        if(this[i].nummer)
            Menu += this[i].nummer;

        // Trenner zwischen Raumnumer und Raumname hinzufügen, falls benötigt
        if(this[i].nummer && this[i].name)
            Menu += ": ";

        // Raumnamen hinzufügen, falls vorhanden
        if(this[i].name)
            Menu += this[i].name;

        Menu += "</option>";
    }

    return Menu;
};