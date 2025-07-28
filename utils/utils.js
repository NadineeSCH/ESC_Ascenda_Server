const axios = require('axios');
const querystring = require('querystring');

// ------------ poller fn -------------------- //
const delay = (ms) => new Promise (resolve => setTimeout(resolve,ms));

async function poller(targetUrl) {
    let attempt = 1;
    const max_attempts = 5;
    let completed = false;

    while (!completed && attempt <= max_attempts) {
        try {
            const response = await fetch(targetUrl);
            const data = await response.json();

            if (data.completed) {
                completed = true;
                return data;
            } else {
                await delay(1000);
                attempt++;
            }
        } catch (error) {
            await delay(1000);
            attempt++;
        }
    }
    throw new Error(`poller failed: max attempts (${max_attempts}) reached for ${targetUrl}`);
}

// -----------------------------------------//


function ascendaApiBuilder (api_no, reqParams) {
    /*
    api_no = 1 -> 3.1 -> hotel prices for a given destination
    api_no = 2 -> 3.2 -> static info about the hotels belonging to a particular destination
    api_no = 3 -> 3.3 -> price of rooms for a given hotel
    api_no = 4 -> 3.4 -> static info for a given hotel
    */
    const baseUrl = "https://hotelapi.loyalty.dev/api/hotels";
    let fullUrl;
    if (api_no === 1) {
        fullUrl = `${baseUrl}/prices?${querystring.stringify(reqParams)}`
    }
    if (api_no === 2) {
        fullUrl = `${baseUrl}?${querystring.stringify(reqParams)}`
    }
    return fullUrl;
}

async function ascendaApiCaller (api_no, reqParams) {
    /*
    api_no = 1 -> 3.1 -> use poller
    api_no = 2 -> 3.2 -> dont use poller
    api_no = 3 -> 3.3 -> use poller
    api_no = 4 -> 3.4 -> dont use poller
    */

    const targetUrl = ascendaApiBuilder(api_no, reqParams);

    try {
        let data;
        if (api_no === 1) {
            data = await poller(targetUrl);
        }
        else {
            const response = await fetch(targetUrl)
            data = await response.json();
        }
        return data;
    } catch (error) {
        throw new Error(`ascendaApiCaller failed for api_no ${api_no}: ${error.message}`, {cause: error});
    }
}

function safeAssign(value) {
  return (value === undefined || value === '' || value === null) ? null : value;
}

module.exports = {delay, poller, ascendaApiBuilder, ascendaApiCaller, safeAssign};