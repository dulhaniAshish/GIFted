const config = {
    GIPHY: {
        API_KEY: 'ef17xOMpGjjKRgTGUirrnLjQeXn8ylAQ',
        HOST_URL: 'https://api.giphy.com',
        SEARCH_ENDPOINT: '/v1/gifs/search',
        TRENDING_ENDPOINT: '/v1/gifs/trending',
    },

    UTILS: {
        MAX_GIF_SIZE: 500 * 1000,   // if want to cut down on network cost
                                    // use @Utils.findAppropriateSize method
        DEBOUNCE_TIME: 500, // debounce for search
        IDEAL_ASPECT_RATIO: 1.33, // 4:3 is considered as good aspect ratio
        TOLERANCE: 0.75,    // tolerance value in aspect ratio
        ENABLE_CACHING: true,
        BASE_HEIGHT: 200,
        ENABLE_LAZY_LOADING: true,
    }
};