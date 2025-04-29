const { app, Tray, Menu } = require('electron');
// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

let tray = null;
let locationInfo = 'Loading...';

async function fetchLocation() {
    try {
        const res = await fetch('http://ip-api.com/json/');
        const data = await res.json();
        locationInfo = `${data.city}, ${data.country}`;
        if (tray) {
            tray.setToolTip(locationInfo);
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        locationInfo = 'Error fetching location';
        if (tray) {
            tray.setToolTip(locationInfo);
        }
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
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Prevent app from quitting
});
