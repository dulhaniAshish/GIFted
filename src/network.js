const APIRequest = (function gen() {
    const API_KEY = config.GIPHY.API_KEY;

    const HOST = config.GIPHY.HOST_URL;
    const BASE_URL = `${HOST}`;

    const GET = (endpoint) => {
        const API_PATH = endpoint;
        return function (string, offset = 0) {
            const finalUrl = `${BASE_URL}${API_PATH}?q=${string}&api_key=${API_KEY}&offset=${offset}`;
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
    };

    return {
        SEARCH: GET(config.GIPHY.SEARCH_ENDPOINT),
        TRENDING: GET(config.GIPHY.TRENDING_ENDPOINT),
    }
}());