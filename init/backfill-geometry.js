const mongoose = require("mongoose");
const listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
require('dotenv').config();

const mapToken = process.env.MAP_TOKEN;
if (!mapToken) {
    console.error("MAP_TOKEN is missing in environment. Aborting.");
    process.exit(1);
}

const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/wanderlust';

async function main(){
    await mongoose.connect(dbUrl);
}

(async () => {
    try {
        await main();
        console.log('Connected to DB');
        const toFix = await listing.find({ $or: [ { geometry: { $exists: false } }, { 'geometry.coordinates.0': { $exists: false } } ] });
        console.log(`Found ${toFix.length} listings to backfill.`);
        for (const doc of toFix) {
            const query = doc.location;
            if (!query) {
                console.warn(`Skipping ${doc._id}: missing location`);
                continue;
            }
            try {
                const response = await geocodingClient.forwardGeocode({ query, limit: 1 }).send();
                const geometry = response?.body?.features?.[0]?.geometry;
                if (geometry) {
                    doc.geometry = geometry;
                    await doc.save();
                    console.log(`Updated ${doc._id} with coordinates ${geometry.coordinates.join(',')}`);
                } else {
                    console.warn(`No geometry for ${doc._id} (${query})`);
                }
            } catch (err) {
                console.error(`Geocoding failed for ${doc._id}:`, err.message || err);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
    }
})(); 