import { BambuClient } from "bambu-node";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

const printer = new BambuClient({
    host: "192.168.1.4",
    accessToken: "41806474",
    serialNumber: "0309DA521601674"
})

let maxProgress = 100;
let newProgress;

let globalStatus;

printer.on("printer:statusUpdate", (oldStatus, newStatus) => {
    //console.log(`Old Status: ${oldStatus}`);
    //console.log(`New Status: ${newStatus}`);
    if (newStatus == "RUNNING") {
        console.log(newStatus);
        globalStatus = newStatus;
        return;
    } else if (newStatus == "FINISH" || newStatus == "FAILED") {
        console.log(newStatus);
        globalStatus = newStatus;
        process.exit(0);
    }
})

printer.on("printer:dataUpdate", (data, updatePackage) => {
    if (globalStatus == "RUNNING") {
        //let printingProgress = data.upload?.progress;
        console.clear();
        let printingProgress = data.mc_percent;
        let nozzleTemp = data.nozzle_temper;
        let timeRemaining = data.mc_remaining_time;

        process.stdout.write('Printing progress: [');
        for (let i = 0; i < maxProgress; i++) {
            if (i < printingProgress) {
                //console.log(` ` += `#` + `${printingProgress} %`);
                process.stdout.write('#');
            } else {
                process.stdout.write('_');
            }
        }
        process.stdout.write(`] ${printingProgress} %\n`);
        console.log(`Nozzle temp: ${nozzleTemp} °C`);
        console.log(`Time remaining: ${timeRemaining} min`);
        //console.log(data);
    } else return;

})

await printer.connect();

process.stdin.on("data", async (key) => {
    if (key == "\u001B") {
        console.log("Disconnecting from printer");
        await printer.disconnect().then(() => {
            console.log(printer.status);
            process.exit(0);
        });
    }
});
