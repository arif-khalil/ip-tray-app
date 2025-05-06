const { app, Tray, Menu, Notification  } = require('electron');
// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const si = require('systeminformation');

let tray = null;
let locationInfo = 'Loading...';
let lastIP = null;

async function fetchLocation() {
    try {
        const res = await fetch('http://ip-api.com/json/');
        const data = await res.json();
        locationInfo = `${data.city}, ${data.country}`;
        if (tray) {
            let tooltip = `IP: ${lastIP || 'N/A'}\nLocation: ${locationInfo}`;
            tray.setToolTip(tooltip);
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        locationInfo = 'Error fetching location';
        if (tray) {
            tray.setToolTip(locationInfo);
        }
    }
}

/**
 * Show Notification
 * @param {*} title 
 * @param {*} body 
 */
function showNotification(title, body) {
    new Notification({ title, body }).show();
}

/**
 * Check IP changes
 */
async function checkIPChange() {
    const nets = await si.networkInterfaces();
    const iface = nets.find(net => !net.internal && net.ip4);
    const currentIP = iface?.ip4;

    if (currentIP && currentIP !== lastIP) {
        if (lastIP !== null) {
            showNotification("IP Changed", `New IP: ${currentIP}`);
        }
        lastIP = currentIP;
        let tooltip = `IP: ${lastIP || 'N/A'}\nLocation: ${locationInfo}`;
        tray.setToolTip(tooltip);
    }
}

app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, 'icon.png')); // You'll need a small 16x16 or 32x32 icon
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Refresh Now', click: fetchLocation },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Checking location...');
    fetchLocation();
    setInterval(fetchLocation, 1 * 60 * 1000); // refresh every 1 minutes

    // Check ip change
    setInterval(checkIPChange, 5000); // Every 5 seconds
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Prevent app from quitting
});
