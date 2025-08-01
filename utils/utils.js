const axios = require("axios");
const querystring = require("querystring");

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

          // CHECK for HTTP error status
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.completed === true) {
            completed = true;
            resolve(data);
          } else {
            loop();
          }
        } else {
          throw new Error("Max attempts reached");
        }
      } catch (err) {
        console.error("Error fetching data", err);
        reject(err);
      }
    };

    const loop = async () => {
      setTimeout(fetchData, POLL_INTERVAL);
    };

    loop();
  });
}

// -----------------------------------------//

function ascendaApiBuilder(api_no, reqParams) {
  /*
    api_no = 1 -> 3.1 -> hotel prices for a given destination
    api_no = 2 -> 3.2 -> static info about the hotels belonging to a particular destination
    */
  const baseUrl = "https://hotelapi.loyalty.dev/api/hotels";
  const devEnv = "&landing_page=wl-acme-earn&product_type=earn";
  let fullUrl;
  if (api_no === 1) {
    fullUrl = `${baseUrl}/prices?${querystring.stringify(reqParams)}${devEnv}`;
  }
  if (api_no === 2) {
    fullUrl = `${baseUrl}?${querystring.stringify(reqParams)}${devEnv}`;
  }
  return fullUrl;
}

async function ascendaApiCaller(api_no, reqParams) {
  /*
    api_no = 1 -> 3.1 -> use poller
    api_no = 2 -> 3.2 -> dont use poller
    */

  const targetUrl = ascendaApiBuilder(api_no, reqParams);

  try {
    let data;
    if (api_no === 1 || api_no === 3) {
      data = await poller(targetUrl);
    } else {
      const response = await fetch(targetUrl);
      data = await response.json();
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch from external API: ${error.message}`);
  }
}

function safeAssign(value) {
  return value === undefined || value === "" || value === null ? null : value;
}

module.exports = { poller, ascendaApiBuilder, ascendaApiCaller, safeAssign };
