const input = document.querySelector('input.search');
const container = document.querySelector('#container');
const loader = document.querySelector('.loading');
var fetching = false, maxLimitReached = false;

const SearchState = new State('searchText');
const Pagination = new State('pagination', 'int');
const FetchState = new State('fetching', 'boolean');
const LimitReachedState = new State('maxLimitForAPIReached', 'boolean');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log(`Service Worker registered! Scope: ${registration.scope}`);
            })
            .catch(err => {
                console.log(`Service Worker registration failed: ${err}`);
            });
    });
}

function showLoader(show) {
    FetchState.changeState(show);
    loader.style.display = show ? 'block' : 'none';
}

function getDistFromBottom() {

    const scrollPosition = window.pageYOffset;
    const windowSize = window.innerHeight;
    return Math.max(container.offsetHeight - (scrollPosition + windowSize), 0);

}

document.addEventListener('scroll', function () {
    const distToBottom = getDistFromBottom();

    if (!LimitReachedState.getCurrentState().current && !FetchState.getCurrentState().current && distToBottom >= 0 && distToBottom <= (window.innerHeight*(3/4))) {
        searchForGIFs(SearchState.getCurrentState().current, Pagination.getCurrentState().current);
    }
});

const debounce = (func, delay) => {
    let inDebounce;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay)
    }
};


const SIZE_LIMIT = config.UTILS.MAX_GIF_SIZE; // bytes
const DEBOUNCE_TIME = config.UTILS.DEBOUNCE_TIME; // ms
const variants = ['fixed_height', 'fixed_width', 'original'];
const modes = ['small', 'downsampled', ''];

window.onload = function () {
    searchForGIFs(SearchState.getCurrentState().current);
};

input.oninput = debounce(handleSearchQueryChange, DEBOUNCE_TIME);

function handleSearchQueryChange(event) {
    let value = event.target.value.trim();
    if (value !== SearchState.getCurrentState().current) {

        if (value.length === 0) {
            value = "welcome";
        }
        container.innerHTML = "";
        SearchState.changeState(value);
        Pagination.changeState(0, 'int');
        LimitReachedState.changeState(false, 'boolean');
        searchForGIFs(value);
    }
}


function searchForGIFs(text, offset = 0) {
    showLoader(true);
    APIRequest.SEARCH(text, offset)
        .then((response) => {
            showLoader(false);
            const {data} = response;
            Pagination.changeState(Pagination.getCurrentState().current + Number.parseInt(response['pagination']['count']));
            const fragment = document.createDocumentFragment();
            console.time('add els');
            data.forEach((el) => {
                const domImage = document.createElement('img');
                domImage.classList.add('gif_item');
                const {title} = el;
                const bestMatch = findAppropriateSize(el['images']);
                domImage.setAttribute('title', title);
                const previewAvailalble = el['images'].hasOwnProperty('preview_gif');
                const selector = previewAvailalble ? 'fixed_height_still' : 'fixed_height_still';
                const stillUrl = el['images'][`${selector}`]['url'];
                domImage.setAttribute('src', stillUrl);
                domImage.addEventListener('mouseover', () => {
                    domImage.setAttribute('src', el['images']['fixed_height']['url'])
                });
                domImage.addEventListener('mouseout', () => domImage.setAttribute('src', stillUrl));
                domImage.style.height = '200px';
                fragment.appendChild(domImage);
            });
            container.appendChild(fragment);
            console.timeEnd('add els');
        })
        .catch((err) => {
            console.warn('Error:', err);
            showLoader(false);
            LimitReachedState.changeState(true);
        })
}


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


