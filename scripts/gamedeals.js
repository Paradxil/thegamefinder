/* Get content areas to populate */
let dealsListEl = document.getElementById("deals-list")
let searchResultsList = document.getElementById('search-games-list');
let gameOverlayEl = document.getElementById('single-game-overlay');
let singleGameEl = document.getElementById('single-game-deals');
let mainContainerEl = document.getElementById('main-container');

/* Display Settings */
let MAX_COLUMNS = 6;
let lastID = -1;

let themeProperties = ['background-color', 'font-color', 'game-background-color', 
        'sale-price-background-color', 'button-background-color', 'store-button-background-color',
        'button-hover-background-color', 'shadow-color', 'line-color'];

/* Check if theme is set in a cookie */ 
let tmp = parseInt(getCookie("theme"));
let curTheme = 0;
if(tmp === 0 || tmp === 1 ) {
    curTheme = tmp;
}

setTheme();

/* Cache */
let storesCache = {};

/* Check for a search in the url*/
if(window.location.search !== null && window.location.search.length > 0) {
    let query = window.location.search.replace('?',"").split('=');

    if(query[0].toLowerCase() === "gameid") {
        openOverlay(query[1]);
    }
    else if(query[0].toLowerCase() === "searchquery") {
        document.getElementById("search-input").value = query[1];
        searchForGame(query[1]);
    }
}

/* Add callback for enter press in search box */
document.getElementById("search-input").addEventListener('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        searchForGame();
    }
});

/* Get current game deals */
var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

  
fetch("https://www.cheapshark.com/api/1.0/deals", requestOptions).then(response => response.json()).then((data) => {
    //dealsListEl.innerText = null;

    //Add gameEls to the columns
    buildGameList(data, dealsListEl);

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    //Load store icons
    fetch("https://www.cheapshark.com/api/1.0/stores", requestOptions)
    .then(response => response.json())
    .then(stores => {
        //Load button icons
        let iconEls = document.getElementsByClassName('game-store-icon');
        for(let store of stores) {
            storesCache[store.storeID] = store;
            for(let i = 0; i < iconEls.length; i++) {
                if(iconEls[i].getAttribute('storeID') === store.storeID) {
                    iconEls[i].innerHTML = "<img title=\""+store.storeName+"\" src=\"https://www.cheapshark.com" + store.images.icon + "\"/>";
                }
            }
        }

        //Load logos
        iconEls = document.getElementsByClassName('store-logo');
        for(let store of stores) {
            storesCache[store.storeID] = store;
            for(let i = 0; i < iconEls.length; i++) {
                if(iconEls[i].getAttribute('storeID') === store.storeID) {
                    iconEls[i].innerHTML = "<img title=\""+store.storeName+"\" src=\"https://www.cheapshark.com" + store.images.logo + "\"/>";
                }
            }
        }
        document.getElementById("loading-games").remove();

    })
    .catch(error => console.log('error', error));
})
.catch(error => console.log('error', error));

function buildGameList(games, el) {

    /* Create Columns */
    let columns = [];

    for(let i = 0; i < MAX_COLUMNS; i++) {
        columns.push(document.createElement("div"));
        columns[i].className = "game-list-column";
    }

    let curColumn = 0;

    for(let game of games) {
        columns[curColumn].innerHTML += createGameHtml(game);
        curColumn++;
        if(curColumn >= MAX_COLUMNS) {
            curColumn = 0;
        }
    }

    //Add columns to the document
    for(let i = 0; i < MAX_COLUMNS; i++) {
        el.appendChild(columns[i]);
    }

}

function createGameHtml(data) {
    //check for free price
    if(parseFloat(data.salePrice||data.cheapest) === 0) {
        data.salePrice = "Free";
    }
    else {
        data.salePrice = "$" + (data.salePrice||data.cheapest);
    }

    data.normalPrice = data.normalPrice?"<p></p>was<p>$"+data.normalPrice+"</p>":"best deal:";

    let html = "";

    html += "<div class=\"game-item\">";

    html += "<div title=\""+data.title+"\" class=\"game-img\">"
    html += "<img src=\"" + data.thumb + "\"/>";
    html += "<div class=\"game-title\">" + (data.title||data.external) + "</div>";
    html += "</div>";
    html += "<div class=\"game-details\">";
    html += "<div class=\"game-price\">";
    html += "<div class=\"game-normal-price\">"+data.normalPrice+"</div>";
    html += "<div class=\"game-sale-price\">" + data.salePrice+ "</div>";
    html += "</div>";
    html += "</div>";
    html += "<a><div class=\"game-info-button\" onclick=\"openOverlay('"+data.gameID+"')\">All Deals</div><\a>";
    html += "<a href=\"https://www.cheapshark.com/redirect?dealID="+(data.dealID||data.cheapestDealID)+"\">" + 
            "<div class=\"game-store-button\"><div class=\"game-store-icon\" storeID=\""+data.storeID+"\">" +
            "</div>View Now</div></a>";
    html += "</div>";

    return html;
}

function changeTheme() {
    if(curTheme === 0) {
        curTheme = 1;
    }
    else {
        curTheme = 0
    }

    setCookie("theme", curTheme, 100);
    setTheme();
}

function setTheme() {
    var r = document.querySelector(':root');
    var rs = getComputedStyle(r);
    var theme = '--theme-' + curTheme + '-';
    for(let prop of themeProperties) {
        r.style.setProperty('--' + prop, rs.getPropertyValue(theme + prop));
    }

    if(curTheme === 0) {
        document.getElementById("theme-label").innerText = "Light Mode";
    }
    else {
        document.getElementById("theme-label").innerText = "Dark Mode";
    }
}

function searchForGame(search) {
    searchResultsList.innerHTML = null;
    let query = document.getElementById("search-input").value || search;

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch("https://www.cheapshark.com/api/1.0/games?title="+query, requestOptions)
    .then(response => response.json())
    .then(data => {
        if(data.length > 0) {
            document.getElementById('close-results').classList.add('visible');
            searchResultsList.innerHTML = null;
        }
        buildGameList(data, searchResultsList);
        window.history.pushState('The Game Finder', 'The Game Finder', '?searchquery='+query);
    })
    .catch(error => console.log('error', error));
}

function hideSearchResults() {
    document.getElementById('close-results').classList.remove('visible');
    searchResultsList.innerHTML = null;
}

function hideOverlay() {
    gameOverlayEl.classList.remove('visible');
    mainContainerEl.classList.remove('no-scroll');
    window.history.pushState('The Game Finder', 'The Game Finder', '/');
}

function openOverlay(gameID) {
    loadSingleGame(gameID);
    lastID = gameID;
}

function loadSingleGame(gameID) {
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };
      
    fetch("https://www.cheapshark.com/api/1.0/games?id="+gameID, requestOptions)
    .then(response => response.json())
    .then(data => {

        singleGameEl.innerHTML = createGameHTML(data);

        mainContainerEl.classList.add('no-scroll');
        gameOverlayEl.classList.add('visible');

        window.history.pushState(data.info.title, data.info.title, '?gameid='+gameID);
    })
    .catch(error => console.log('error', error));
}

function createGameHTML(data) {
    let date = new Date(parseInt(data.cheapestPriceEver.date) * 1000);
    console.log(parseInt(data.cheapestPriceEver.date));


    html = "";

    html += "<div class=\"single-game-title\">" + data.info.title + "</div>";
    html += "<div class=\"single-game-info\">";

    html += "<div class=\"single-game-img\">";
    html += "<img src=\"" + data.info.thumb + "\"/>";
    html += "</div>";

    html += "<div class=\"lowest-price-wrapper\">";
    html += "<div class=\"lowest-price-title\"> Lowest Ever Price </div>";
    html += "<div class=\"lowest-price-date\">on " + date.toLocaleDateString() + "</div>";
    html += "<div class=\"lowest-price\">$" + data.cheapestPriceEver.price + "</div>";
    html += "</div>";

    html += "</div>";

    html += "<div class=\"single-game-deals\">";
    html += "<div>All Deals</div>";
    html += "<div class=\"all-deals-list\">";

    for(let deal of data.deals) {
        html += createDealHTML(deal);
    }

    html += "</div>";
    html += "</div>";

    return html;
}

function createDealHTML(deal) {
    let store = storesCache[deal.storeID]||{images:{}};

    html = "<div class=\"game-single-deal\">";

    html += "<div class=\"store-logo\" storeID=\""+deal.storeID+"\"><img src=\"https://www.cheapshark.com"+store.images.logo+"\"/></div>";

    html += "<div class=\"game-purchase-info\">";
    html += "<div class=\"game-price\">";
    html += "<div class=\"game-normal-price\">Retail: $" + deal.retailPrice + "</div>";
    html += "<div class=\"game-sale-price\">$" + deal.price + "</div>";
    html += "</div>";

    html += "<a href=\"https://www.cheapshark.com/redirect?dealID="+deal.dealID+"\">" + 
            "<div class=\"game-store-button\"><div class=\"game-store-icon\" storeID=\""+deal.storeID+"\">" +
            "<img title=\""+(store.storeName||null)+"\" src=\"https://www.cheapshark.com" + (store.images.icon||null) + "\"/>" +
            "</div>View Now</div></a>";
    
    html += "</div>";
    html += "</div>";

    return html;
}


window.onpopstate = function(e){
    if(gameOverlayEl.classList.contains('visible')) {
        hideOverlay();
    }
};


/* Handle Cookies */
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
var name = cname + "=";
var decodedCookie = decodeURIComponent(document.cookie);
var ca = decodedCookie.split(';');
for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
    c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
    return c.substring(name.length, c.length);
    }
}
return "";
}