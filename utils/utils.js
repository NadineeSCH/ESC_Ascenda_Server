const axios = require('axios');
const querystring = require('querystring');

// ------------ poller fn -------------------- //
async function poller(targetUrl) {
  let completed = false;
  const POLL_INTERVAL = 500; // Poll every half a second
  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  return new Promise((resolve, reject) => {
    const fetchData = async () => {
      try {
        attempts++;
        if (attempts <= MAX_ATTEMPTS) {
            const response = await fetch(targetUrl);
            const data = await response.json();

            // Stop polling if completed is true
            if (data.completed == true) {
            completed = true;
            resolve(data);
            }
            else {
            // If not completed, continue polling
            loop();
            }
        }
        else {
            throw new Error();
        }
      } catch (err) {
        console.error("Error fetching data", err);
        reject(err);
      }
    };

    const loop = async () => {
        setTimeout(fetchData,POLL_INTERVAL);
    }
    loop(); // Start the polling loop
  });
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
        fullUrl = `${baseUrl}/prices?${querystring.stringify(reqParams)}`;
    }
    if (api_no === 2) {
        fullUrl = `${baseUrl}?${querystring.stringify(reqParams)}`;
    }
    if (api_no === 3) {
        fullUrl = `${baseUrl}/${reqParams.hotel_id}/price?${querystring.stringify(reqParams)}`;
    }
    if (api_no === 4) {
        fullUrl = `${baseUrl}/${reqParams.hotel_id}`;
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
        if (api_no === 1 || api_no === 3) {
            data = await poller(targetUrl);
        }
        else {
            const response = await fetch(targetUrl);
            data = await response.json();
        }
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch from external API: ${error.message}`);
    }
}

function safeAssign(value) {
  return (value === undefined || value === '' || value === null) ? null : value;
}

module.exports = {poller, ascendaApiBuilder, ascendaApiCaller, safeAssign};