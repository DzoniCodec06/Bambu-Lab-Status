const { app, BrowserWindow, screen } = require("electron/main");
const ipc = require("electron").ipcMain;

const fs = require("fs");
//const ipcRd = require("electron").ipcRenderer;

const path = require("path");

let readyToConnect = false;
let readyToCheck = false;

let checked = false;

let fileData = fs.readFile("./src/props.txt", "utf8", (err, data) => {
    if (err) console.log(err);
    else {
        console.log(data);
        if (data != "") {
            readyToCheck = true;
            readyToConnect = true;
        } else {
            readyToCheck = true;  
            readyToConnect = false;
        } 
    }
})

ipc.on("close-window", () => {
    console.log("quit window");
    app.quit();
});

ipc.on("openProgressWin", () => {
    console.log("Oppening progress window");

    let windows = BrowserWindow.getAllWindows();
    console.log(windows.length);
    windows[0].close();
    createWin(winWidth, winHeight, true, "./src/index.html", true);

    ipc.emit("connect-to-ptinter");
})

const winWidth = 500;
const winHeight = 150;

const createWin = ( windowWidth, windowHeight, alwaysOnTop, fileSrc, bottomRight ) => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const win = new BrowserWindow({
        x: bottomRight == true ? width - winWidth : "",
        y: bottomRight == true ? height - winHeight : "",
        width: windowWidth,
        height: windowHeight,
        maximizable: false,
        resizable: false,
        autoHideMenuBar: true,
        alwaysOnTop: alwaysOnTop,
        visibleOnAllWorkspaces: true, // Optional
        hasShadow: false, // Optional
        frame: false,
        //titleBarStyle: "hidden",
        //titleBarOverlay: {
            //color: "#2f3241",
            //symbolColor: '#74b1be',
            //height: 20,
        //},
        webPreferences: {
            devTools: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(fileSrc));
    checked = true;
    //win.webContents.openDevTools();
}

app.whenReady().then(() => {
    let interval = setInterval(() => {
        if (BrowserWindow.getAllWindows().length === 0 && readyToCheck == true) {
            //createWin(winWidth, winHeight, true, "./src/index.html");
            if (readyToConnect == true) createWin(winWidth, winHeight, true, "./src/index.html", true);
            else createWin(350, 350, false, "./src/addPrinter.html", false);
        }
    }, 100);

    if (checked == true) {
        clearInterval(interval);
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})