const fs = require("fs");
const ipc = require('electron').ipcRenderer;
const { BambuClient, isMCPrintMessage } = require("bambu-node");

//ipc.send("close-window");

//let printerProps = {
//    ip,
//    accessTok,
//    serNum
//}


//const printer = new BambuClient({
    //host: "192.168.1.6",
    //accessToken: "41806474",
    //serialNumber: "0309DA521601674"
    //host: printerProps.ip,
    //accessToken: printerProps.accessTok,
    //serialNumber: printerProps.serNum
//});

let fileData;

const propsFile = fs.readFile("./src/props.txt", "utf8", (err, data) => {
    let j = 0;
    if (err) {
        console.error(err);
    } else {
        //console.log(data);

        fileData = data.split(/\r\n|\n/);

        console.log(fileData);
    }
})

const printer = new BambuClient({host: "", accessToken: "", serialNumber: ""});

const submitBtn = document.getElementById("submitBtn");
const printerIpEl = document.getElementById("ipAdress");
const accessTokenEl = document.getElementById("accessToken");
const serialNumEl = document.getElementById("serialNum");

let readyToConnect = false;

submitBtn?.addEventListener("click", e => {
    e.preventDefault();
    console.log("Connect to printer");

    //printerProps.ip = printerIpEl?.value;
    //printerProps.accessTok = accessTokenEl.value;
    //printerProps.serNum = serialNumEl.value;

    //printer.clientOptions.host = printerIpEl?.value;
    //printer.clientOptions.accessToken = accessTokenEl?.value;
    //printer.clientOptions.serialNumber = serialNumEl?.value;

    if (printerIpEl.value == "" || accessTokenEl.value == "" || serialNumEl.value == "") {
        return;
    }

    let dataForFile = `${printerIpEl.value}\r\n${accessTokenEl.value}\r\n${serialNumEl.value}`;

    const fileProps = fs.writeFile("./src/props.txt", dataForFile, (err) => {
        if (err) console.error(err);
        else console.log("Written to files");
    })

    ipc.send("openProgressWin");

    readyToConnect = true;
});

window.onload = () => {
    if (fileData != "") {
        readyToConnect = true;
    } else readyToConnect = false;
}

const serialNumbers = ["030", "00M", "093"];

const prgNumber = document.getElementById("prgNum");
const timeEl = document.getElementById("time");

const progressBar = document.getElementById("prg");
const printerStatus = document.getElementById("printerStatus");

const printerName = document.getElementById("printerName");

const rootCss = document.querySelector(":root");

const loadingScreen = document.getElementById("loading-screen");

const headerEl = document.getElementById("header");
const containerEl = document.getElementById("container");
const notConnecetdScreen = document.getElementById("notConnectedScreen");

function checkPrinter() {
    if (printer.clientOptions.serialNumber.startsWith("030")) {
        //printerName.innerText = "A1 Mini";    
        return "A1 Mini";
    } else if (printer.clientOptions.serialNumber.startsWith("00M")) {
        //printerName.innerText = "X1C";
        return "X1C";
    } else if (printer.clientOptions.serialNumber.startsWith("093")) {
        //printerName.innerText = "H2S";
        return "H2S";
    } else return "Unknown";
}


//const rootVars = getComputedStyle(rootCss);  *** FOR READ ONLY 

//prgNumber.innerText = "50 %";
//timeEl.innerText = "15 min";

//progressBar.value = 50;

window.addEventListener("keypress", async (e) => {
    //console.log(e);
    if (e.key == "\x11") {
        console.log("quit window");

        console.log("Disconnecting from printer");

        if (printer.status !== "OFFLINE") {
            await printer.disconnect().then(() => {
                console.log(printer.status);
                ipc.send("close-window");
            });
        } else {
            console.log("Quitting app");
            ipc.send("close-window");
        }
    }
});

let globalStatus = null;

if (globalStatus == null) {
    printerStatus.style.backgroundColor = "grey";
    printerStatus.title = "OFFLINE";
    printerName.innerText = `${checkPrinter()} - OFFLINE`;
    rootCss.style.setProperty("--status-color", "#00000017");

    prgNumber.innerText = "/";
    timeEl.innerText = "/";

    progressBar.value = 0;
} else if (globalStatus == "IDLE") {
    printerStatus.style.backgroundColor = "orange";
    printerStatus.title = "IDLE";

} else {
    printerStatus.style.backgroundColor = "#4CAF50";
    printerStatus.title = "ACTIVE";
    printerName.innerText += `${checkPrinter()} - ONLINE`;
}

printer.on("printer:statusUpdate", (oldStatus, newStatus) => {
    if (newStatus == "RUNNING") {
        console.log(newStatus);
        globalStatus = newStatus;
        printerName.innerText = `${checkPrinter()} - ONLINE`;
        rootCss.style.setProperty("--status-color", "#00ff0063");
        return;
    } else if (newStatus == "FINISH") {
        console.log(newStatus);
        globalStatus = newStatus;
        return;
    } else if (newStatus == "IDLE" || oldStatus == "IDLE") {
        globalStatus = "IDLE";
        printerName.innerText = `${checkPrinter()} - IDLE`;
        rootCss.style.setProperty("--status-color", "#ffa60063");
        return;
    } else if (newStatus == "FAILED") {
        globalStatus = newStatus;
        progressBar.classList.replace("fine", "failed");
        prgNumber.innerText = "CANCELLED or FAILED";
        timeEl.innerText = "0 min";
        printerName.innerText = `${checkPrinter()} - ONLINE`;
        
        let timeout = setTimeout(() => {
            progressBar.classList.replace("failed", "fine");
            progressBar.value = 0;
            prgNumber.innerText = "/";
            timeEl.innerText = "/";
            
            console.log("canncelled print");

            clearTimeout(timeout);
        }, 3000);
    }
});

printer.on("printer:dataUpdate", (data, updatePackage) => {
    if (globalStatus == "RUNNING") {
        printerStatus.style.backgroundColor = "#4CAF50";
        printerStatus.title = "ACTIVE";

        rootCss.style.setProperty("--status-color", "#00ff0063");
        
        let printingProgress = data.mc_percent;
        let timeRemaining = data.mc_remaining_time;
        //let nozzleTemp = data.nozzle_temper;

        prgNumber.innerText = `${printingProgress} %`;
        timeEl.innerText = `${timeRemaining} min`;

        progressBar.value = printingProgress;
    } else return;

});

if (readyToConnect == true) {
    console.log(`Printer ip: ${printer.clientOptions.host}`);
    console.log(`Printer Ac Token: ${printer.clientOptions.accessToken}`);
    console.log(`Printer Ser Num: ${printer.clientOptions.serialNumber}`);

    printer.clientOptions.host = fileData[0];
    printer.clientOptions.accessToken = fileData[1];
    printer.clientOptions.serialNumber = fileData[2];

    printer.connect().then(() => {
        console.log("Printer Connected");
        
        loadingScreen.classList.replace("loading", "loading-false");
        headerEl.classList.remove("false");
        containerEl.classList.replace("container-false", "container");
    
        printerStatus.style.backgroundColor = "orange";
        printerStatus.title = "IDLE";
        printerName.innerText = `${checkPrinter()} - IDLE`;
        rootCss.style.setProperty("--status-color", "#ffa60063");
    
        progressBar.classList.add("fine");
    }).catch(err => {
        if (err) {
            console.error(err);
            loadingScreen.classList.replace("loading", "loading-false");
            headerEl.classList.add("false");
            containerEl.classList.replace("container", "container-false");
            notConnecetdScreen.classList.replace("not-connected-false", "not-connected");
        }
    });
}



