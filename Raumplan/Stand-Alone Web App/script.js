// Definition der Räume als globales Objekt
var Rooms, Grundriss;

window.addEventListener("load", function () {

    // DOM Referenzen zu den wichtigen Positionen anlegen
    Grundriss = document.getElementById("Grundriss").contentDocument;
    var RaumnummerFeld = document.getElementById("RaumnummerAuswahl");



    /*
    * Event Handler für das Raumauswahl-Menü
    * Wenn ein Raum ausgewählt wird, kümmert sich dieser Event Handler dazu, den Raum anzuzeigen
    */
    RaumnummerFeld.addEventListener("change", function(){
        
        // der ausgewählte Raum wird in dem "Rooms" Objekt gesucht und daraus extrahiert
        var selectedRoom = undefined;
        for(var i = 0; i< Rooms.length && selectedRoom == undefined; i++){
            if(Rooms[i].id == RaumnummerFeld.value){
                selectedRoom = Rooms[i];
            }
        }

        // den ausgewählten Raum farblich hervorheben
        StockwerkAnzeigen(selectedRoom.stockwerk);
        RaumAnzeigen(selectedRoom.id);

        // TODO: Problem: zuerst ausgewählter Raum kann nicht zuerst ausgewählt werden 
    });



    /*
     * Event-Handler für die optische Veränderung des Hauptmenüs bei einem Mausklick
     * werden über eine Callback Funktion initialisiert
     * Außerdem wird die Hervorhebung eines Raumes aufgehoben, sofern dies vorher der Fall war
     */
    var Hauptmenue = document.getElementById("Hauptmenue").children[0].children;
    for(var i = 0; i < Hauptmenue.length; i++){
        Hauptmenue[i].addEventListener("click", function(){
            for(var i = 0; i < 4; i++){
                document.getElementById("Hauptmenue").children[0].children[i].classList.remove("aktiviert");
            }
            this.classList.add("aktiviert");

            for(var i = 0; i < Rooms.length; i++){
                Grundriss.getElementById("raum" + Rooms[i].id).style.fill = 'none';
            }
            SanitäreAnlagenAusblenden();
            StockwerkAnzeigen(0);
        })
    }


    /*
     * Event Handler für das Menü um die Fluchtpläne anzuzeigen, bzw. auszublenden
     */
    for(var i = 0; i < (Hauptmenue.length - 1); i++){
        Hauptmenue[i].addEventListener("click", function(){
            Fluchtplaene( false );
        })
    }
    Hauptmenue[3].addEventListener("click", function(){
        Fluchtplaene( true );
    })


    /*
     * Event Handler für das Menü um die sanitären Anlagen im EG beim Aufruf anzuzeigen
     */
    Hauptmenue[2].addEventListener("click", function(){
        SanitäreAnlagen(0);
    })

    
    /*
     * Event Handler, um das Menü für die Stockwerkauswahl einzublenden / auszublenden
     */
    Hauptmenue[0].addEventListener("click", function(){
        document.getElementById("Stockwerkauswahl").style.display = 'none';
        document.getElementById("Raumsuche").style.display = 'block';


    })
    for(var i = 1; i < Hauptmenue.length; i++){
        Hauptmenue[i].addEventListener("click", function(){
            document.getElementById("Stockwerkauswahl").style.display = 'block';
            document.getElementById("Raumsuche").style.display = 'none';

            // aktiviere den ersten Menüeintrag
            for(var i = 1; i < 4; i++){
                var that = document.getElementById("Stockwerkauswahl").children[0].children[i].classList;
                if(that.item("aktiviert")){
                    that.remove("aktiviert");
                }
            }
            document.getElementById("Stockwerkauswahl").children[0].children[0].classList.add("aktiviert");

        })
    }

    // aktiviere den ersten Menueeintrag nachdem die Seite geladen wurde
    Hauptmenue[0].classList.add("aktiviert");

    
    /*
     * Event-Handler für die optische Veränderung des Stockwerkauswahlmenüs bei einem Mausklick
     * werden über eine Callback Funktion initialisiert
     */
    var Stockwerkauswahl = document.getElementById("Stockwerkauswahl").children[0].children;
    for(var i = 0; i < Stockwerkauswahl.length; i++){
        Stockwerkauswahl[i].addEventListener("click", function(){
            for(var i = 0; i < 4; i++){
                document.getElementById("Stockwerkauswahl").children[0].children[i].classList.remove("aktiviert");
            }
            this.classList.add("aktiviert");

            var Hauptmenue = document.getElementById("Hauptmenue").children[0].children;
            var aktieverMenuepunkt, gefunden;
            for(aktieverMenuepunkt = 0, gefunden = false; aktieverMenuepunkt < Hauptmenue.length && !gefunden; aktieverMenuepunkt++){
                if(Hauptmenue[aktieverMenuepunkt].classList.item("aktiviert")){
                    gefunden = true;
                    aktieverMenuepunkt--;
                }
            }

            var Stockwerkmenue = document.getElementById("Stockwerkauswahl").children[0].children;
            var aktivesStockwerk;
            for(aktivesStockwerk = 0, gefunden = false; aktivesStockwerk < Stockwerkmenue.length && !gefunden; aktivesStockwerk++){
                if(Stockwerkmenue[aktivesStockwerk].classList.item("aktiviert")){
                    gefunden = true;
                    aktivesStockwerk--;
                }
            }

            StockwerkAnzeigen(aktivesStockwerk);

            if(aktieverMenuepunkt == 2 && aktivesStockwerk < 3){ // Sanitäre Anlagen
                SanitäreAnlagen(aktivesStockwerk);
            }
        })
    }

    // TODO: bei sanitären anlagen aufruf wc eg hervorheben



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
    * Die aus dem Request erhaltenen Daten werden über eine Prototyp-Funktion verarbeitet,
    * um das Auswahlmenü zusammenzustellen
    */

    // Die Rauminfos über einen GET Request abholen
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
            
            // die Fluchtpläne ausblenden
            Fluchtplaene(false);

            // Auf das erste Stockwerk wechseln
            StockwerkAnzeigen(0);
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




/*
 * Da die Räume auf unterschiedlichen Stockwerken liegen und diese sich auf unterschiedlichen Ebenen befinden,
 * muss je nach Raum die Ebene gewechselt werden 
 */
function StockwerkAnzeigen ( stockwerk ){
    for(var i = 0; i < 4; i++){
        Grundriss.getElementById(stockwerkID(i)).style.display = 'none';
        document.getElementById("Headlines").children[i].style.display = 'none';
    }
    Grundriss.getElementById(stockwerkID(stockwerk)).style.display = 'inline';
    document.getElementById("Headlines").children[stockwerk].style.display = 'block';
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
    SanitäreAnlagenAusblenden();

    Grundriss.getElementById("raum" + raumid).style.fill = 'red';
    Grundriss.getElementById("raum" + raumid).style.fillOpacity = '0.5';
}


function zeigeStockwerkmenue(){
    
}


/*
 * Diese Funktion bietet die Möglichkeit, die Fluchtwege anzuzeigen oder zu verstecken
 */
function Fluchtplaene( state ){
    var sichtbarkeit = 'none';
    if(state){
        sichtbarkeit = 'inline';
    }
    
    Grundriss.getElementById("fluchtwege" + "EG").style.display = sichtbarkeit;
    Grundriss.getElementById("fluchtwege" + "1OG").style.display = sichtbarkeit;
    Grundriss.getElementById("fluchtwege" + "2OG").style.display = sichtbarkeit;
    Grundriss.getElementById("fluchtwege" + "3OG").style.display = sichtbarkeit;
}


/*
 * Diese Funktion hebt die sanitären Anlagen auf einem bestimmten Stockwerk hervor
 */
function SanitäreAnlagen(Stockwerk){
    var id = "";
    switch(Stockwerk){
        case 0: id = "WCEG"; break;
        case 1: id = "WC1OG"; break;
        case 2: id = "WC2OG"; break;
    }
    var hervorheben = Grundriss.getElementById(id).children;
    for(var i = 0; i < hervorheben.length; i++){
        if(hervorheben[i].id.match("raum")){
            hervorheben[i].style.fill = 'red';
            hervorheben[i].style.fillOpacity = '0.5';
        }
    } 
}

function SanitäreAnlagenAusblenden(){
    for(var j = 0; j < 3; j++){
        var id = "";
        switch(j){
            case 0: id = "WCEG"; break;
            case 1: id = "WC1OG"; break;
            case 2: id = "WC2OG"; break;
        }
        var hervorheben = Grundriss.getElementById(id).children;
        for(var i = 0; i < hervorheben.length; i++){
            if(hervorheben[i].id.match("raum")){
                hervorheben[i].style.fill = 'none';
                hervorheben[i].style.fillOpacity = '0.5';
            }
        } 
    }
}