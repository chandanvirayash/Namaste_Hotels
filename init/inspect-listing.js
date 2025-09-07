const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/wanderlust';
const id = process.argv[2];
if (!id) {
    console.error('Usage: node init/inspect-listing.js <listingId>');
    process.exit(1);
}

async function main(){
    await mongoose.connect(dbUrl);
}

(async () => {
    try {
        await main();
        const doc = await Listing.findById(id);
        if (!doc) {
            console.log('Listing not found');
        } else {
            console.log('Location:', doc.location);
            console.log('Geometry:', JSON.stringify(doc.geometry, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})(); 