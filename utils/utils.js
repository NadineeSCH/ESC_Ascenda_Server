const delay = (ms) => new Promise (resolve => setTimeout(resolve,ms));

async function poller (targetUrl){
    let completed = false;
    while (!completed){
        try {
            const response = await fetch(targetUrl);
            const data = await response.json();
            if (data.completed){
                completed = true;
                return data;
            }
            else{
                await delay(1000); // Wait for 1 second before polling again
            }
        }
        catch (error){
            console.error(error);
            await delay(1000); // Wait for 1 second before retrying on error
        }
    }
}

module.exports = { poller };