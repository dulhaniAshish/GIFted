const input = document.querySelector('input.search');
const container = document.querySelector('#container');
const loader = document.querySelector('.loading');

const SearchState = new State('searchText');
const Pagination = new State('pagination', 'int');
const FetchState = new State('fetching', 'boolean');
const LimitReachedState = new State('maxLimitForAPIReached', 'boolean');

const SIZE_LIMIT = config.UTILS.MAX_GIF_SIZE; // bytes
const DEBOUNCE_TIME = config.UTILS.DEBOUNCE_TIME; // ms
const variants = ['fixed_height', 'fixed_width', 'original'];
const modes = ['small', 'downsampled', ''];

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

    if (!LimitReachedState.getCurrentState().current && !FetchState.getCurrentState().current && distToBottom >= 0 && distToBottom <= (window.innerHeight * (3 / 4))) {
        searchForGIFs(SearchState.getCurrentState().current, Pagination.getCurrentState().current);
    }
});

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
            const {data} = response;
            Pagination.changeState(Pagination.getCurrentState().current + Number.parseInt(response['pagination']['count']));
            if (Pagination.getCurrentState().current === Number.parseInt(response['pagination']['total_count'])) {
                LimitReachedState.changeState(true);
            }
            const fragment = document.createDocumentFragment();
            console.time('add els');
            data.forEach((el) => {
                const domImage = document.createElement('img');
                domImage.classList.add('gif_item');
                domImage.classList.add('shine');
                const {title} = el;
                const bestMatch = findAppropriateSize(el['images']);
                domImage.setAttribute('title', title);
                const previewAvailalble = el['images'].hasOwnProperty('preview_gif');
                const selector = previewAvailalble ? 'preview_gif' : 'fixed_height_still';
                const stillUrl = el['images'][`${selector}`]['url'];
                domImage.setAttribute('src', stillUrl);
                domImage.setAttribute('id', el['id']);
                const expectedWidth = `${el['images']['fixed_height']['width']}px`;
                domImage.addEventListener('mouseover', () => {
                    domImage.setAttribute('src', el['images']['fixed_height']['url'])
                });
                const addStillUrl = () => domImage.setAttribute('src', stillUrl)
                domImage.addEventListener('mouseout', addStillUrl);
                domImage.addEventListener('load', () => {
                    if (domImage.getAttribute('src') === stillUrl) {
                        console.log('yes');
                        domImage.classList.remove('shine');
                    } else {
                        console.log('final url loaded');
                        domImage.removeEventListener('mouseout', addStillUrl);
                    }
                });
                domImage.style.height = '200px';
                // console.log(title, selector, expectedWidth);
                domImage.style.width = expectedWidth;
                fragment.appendChild(domImage);
            });
            container.appendChild(fragment);
            console.timeEnd('add els');
            showLoader(false);
        })
        .catch((err) => {
            console.warn('Error:', err);
            showLoader(false);
            LimitReachedState.changeState(true);
        })
}



