const defaultValues = {
    'int': 0,
    'string': '',
    'object': {},
    'boolean': false,
};

function State(name, type = 'string') {
    let currentState = {
        prev: defaultValues[type],
        current: defaultValues[type],
    };
    this.name = name;

    this.changeState = function(newValue) {
        currentState = {
            ...currentState,
            prev: currentState['current'],
            current: newValue,
        };
        return currentState;
    };

    this.getCurrentState = function() {
        return currentState;
    };
}


const variants = ['fixed_height', 'fixed_width', 'original'];
const modes = ['small', 'downsampled', ''];

const SIZE_LIMIT = config.UTILS.MAX_GIF_SIZE; // bytes
const findAppropriateSize = (images, sizeLimit = SIZE_LIMIT) => {
    let key = 'original';
    let type = 'url';
    let iterator = variants.length - 1;

    while (iterator >= 0) {
        let modeIterator = modes.length - 1;
        let foundBestMatch = false;

        while (modeIterator >= 0 && !foundBestMatch) {
            const suffix = modes[modeIterator].length > 0 ? `_${modes[modeIterator]}` : '';
            const k = `${variants[iterator]}${suffix}`;
            if (images[k] && images[k]['webp_size'] <= sizeLimit) {
                key = `${variants[iterator]}`;
                type = 'webp';
                foundBestMatch = true;
            } else if (images[k] && images[k]['size'] <= sizeLimit) {
                key = `${variants[iterator]}`;
                type = 'normal';
                foundBestMatch = true;
            }
            modeIterator--;
        }

        if (foundBestMatch) break;
        iterator--;
    }
    return {
        key,
        type
    };
};

// debounce for button clicks & other events
const debounce = (func, delay) => {
    let inDebounce;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay)
    }
};

// Add service worker for caching if allowed
// for enabling OFFLINE FIRST feature
function addCachingMechanism() {
    if (!config.UTILS.ENABLE_CACHING) return;
    console.warn('Caching enabled! Data(gifs) May use up a lot of space');
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    getStorageEstimate();
                    console.debug(`Service Worker registered! Scope: ${registration.scope}`);
                })
                .catch(err => {
                    console.debug(`Service Worker registration failed: ${err}`);
                });
        });
    }
}

// Get current Storage state of application
function getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate()
            .then(function(estimate){
                console.debug(`Using ${estimate.usage} out of ${estimate.quota} bytes.`);
            });
    }
}

// Utility to estimate the best width for a gif
// Conditioned by width that is to be rendered
// and baseHeight set in Config
const getItemWidthRange = (baseHeight = config.UTILS.BASE_HEIGHT) => {
    const idealWidth = baseHeight * config.UTILS.IDEAL_ASPECT_RATIO;
    const toleranceWidthMin = (config.UTILS.IDEAL_ASPECT_RATIO - config.UTILS.TOLERANCE) * baseHeight;
    const toleranceWidthMax = (config.UTILS.IDEAL_ASPECT_RATIO + config.UTILS.TOLERANCE) * baseHeight;

    return {
        min: toleranceWidthMin,
        max: toleranceWidthMax,
        ideal: idealWidth,
    }
};

// Check the type of agent requesting
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);

// For performance logging
const perfLog = (label) => `Perf::${label}`;