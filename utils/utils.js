//      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Polling effect

async function poller(targetUrl) {
  let completed = false;
  const POLL_INTERVAL = 500; // Poll every half a second
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  console.log("Polling started for URL:", targetUrl);

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

module.exports = { poller };
