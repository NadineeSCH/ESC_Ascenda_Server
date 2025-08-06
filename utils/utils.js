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

module.exports = { poller };
