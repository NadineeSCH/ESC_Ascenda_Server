//      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Polling effect

async function poller(targetUrl) {
  let completed = false;
  const POLL_INTERVAL = 500; // Poll every half a second

//   const response = await fetch(targetUrl);
//         const data = await response.json();
//         return data;

  // while (!completed){
  //     try {
  //         const response = await fetch(targetUrl);
  //         const data = await response.json();
  //         if (data.completed){
  //             completed = true;
  //             return data;
  //         }
  //         else{
  //             await delay(1000); // Wait for 1 second before polling again
  //         }
  //     }
  //     catch (error){
  //         console.error(error);
  //         await delay(1000); // Wait for 1 second before retrying on error
  //     }
  // }

  ///

  return new Promise((resolve, reject) => {
    const fetchData = async () => {
      try {
        const response = await fetch(targetUrl);
        const data = await response.json();

        // Stop polling if completed is true
        if (data.completed == true) {
          completed = true;
          //clearInterval(pollingInterval); // Stop polling
          resolve(data);
        }
        else {
          // If not completed, continue polling
          loop();
        }
      } catch (err) {
        console.error("Error fetching data", err);
        //clearInterval(pollingInterval); // Stop polling on error
        reject(err);
      }
    };

    // const pollingInterval = setInterval(() => {
    //   if (!completed) {
    //     fetchData(); // Keep polling if completed is false
    //   }
    // }, POLL_INTERVAL);

    const loop = async () => {
        setTimeout(fetchData,POLL_INTERVAL);
    }
    loop(); // Start the polling loop
  });
}

module.exports = { poller };
