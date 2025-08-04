const axios = require("axios");
const querystring = require("querystring");
const fetch = require('node-fetch');
const {poller} = require('./utils.js');

function ascendaApiBuilder(api_no, reqParams) {
  /*
    api_no = 1 -> 3.1 -> hotel prices for a given destination
    api_no = 2 -> 3.2 -> static info about the hotels belonging to a particular destination
  */

  // In ascendaApiCaller
  if (![1, 2].includes(api_no)) {
    throw new Error(`Unsupported api_no in ascendaApiBuilder: ${api_no}`);
  }

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
  
  if (![1, 2].includes(api_no)) {
    throw new Error(`Unsupported api_no in ascendaApiCaller: ${api_no}`);
  }

  const targetUrl = ascendaApiBuilder(api_no, reqParams);

  try {
    let data = null;
    if (api_no === 1) {
      data = await poller(targetUrl);
    } else if (api_no === 2) {
      const response = await fetch(targetUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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