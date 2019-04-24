const APIRequest = (function gen() {
    const API_KEY = config.GIPHY.API_KEY;

    const HOST = config.GIPHY.HOST_URL;
    const SEARCH_API_PATH = config.GIPHY.SEARCH_ENDPOINT;
    const BASE_URL = `${HOST}`;

    function SEARCH(string, offset = 0) {
        const finalUrl = `${BASE_URL}${SEARCH_API_PATH}?q=${string}&api_key=${API_KEY}&offset=${offset}`;
        return fetch(finalUrl)
            .then((blob) => {
                if (blob['status'] === 200)
                    return blob.json();
                else throw new Error('Some error in fetching');
            })
            .then((res) => {
                if (res['meta']['status'] === 200) {
                    return res;
                }
            })
    }

    return {
        SEARCH
    }
}());