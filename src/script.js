const input = document.querySelector('input.search');
const container = document.querySelector('#container');
const loader = document.querySelector('.loading');
const modal = document.getElementById('myModal');
const img = document.getElementById('myImg');
const modalImg = document.getElementById("img01");
const captionText = document.getElementById("caption");
const closeTick = document.getElementsByClassName("close")[0];


const SearchState = new State('searchText');
const Pagination = new State('pagination', 'int');
const FetchState = new State('fetching', 'boolean');
const LimitReachedState = new State('maxLimitForAPIReached', 'boolean');

const DEBOUNCE_TIME = config.UTILS.DEBOUNCE_TIME; // ms

addCachingMechanism();

window.onload = function () {
    searchForGIFs(SearchState.getCurrentState().current);
    addSearchBarListener(input);
};

function addSearchBarListener(HTMLElement) {
    HTMLElement.oninput = debounce(handleSearchQueryChange, DEBOUNCE_TIME);
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

// infinite scroll
document.addEventListener('scroll', function () {
    const distToBottom = getDistFromBottom();
    if (!LimitReachedState.getCurrentState().current && !FetchState.getCurrentState().current && distToBottom >= 0 && distToBottom <= (window.innerHeight * (3 / 4))) {
        searchForGIFs(SearchState.getCurrentState().current, Pagination.getCurrentState().current);
    }
});

closeTick.onclick = function () {
    hideModal();
};

function handleSearchQueryChange(event) {
    let value = event.target.value.trim();
    if (value !== SearchState.getCurrentState().current) {

        if (value.length === 0) {
            value = "";
        }
        container.innerHTML = "";
        SearchState.changeState(value);
        Pagination.changeState(0, 'int');
        LimitReachedState.changeState(false, 'boolean');
        searchForGIFs(value);
    }
}

function addPaginationOffset(count) {
    Pagination.changeState(Pagination.getCurrentState().current + count);
}

function showModal() {
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.title;
}

function hideModal() {
    modal.style.display = "none";
}


function searchForGIFs(text, offset = 0) {
    showLoader(true);
    const fn = !!text ? APIRequest.SEARCH : APIRequest.TRENDING;

    fn(text, offset)
        .then((response) => {
            const {data, pagination} = response;

            const _modified = data.map((el) => {
                const {title, id} = el;
                const hasPreview = el['images'].hasOwnProperty('preview_gif');
                const selector = hasPreview ? 'preview_gif' : 'fixed_height_still';
                const stageOne = el['images'][`${isMobile() ? selector : 'original'}`]; // for quickly loading
                const finalStage = el['images'][`${isMobile() ? 'fixed_height' : 'original'}`];
                const still = el['images']['fixed_height_still'];

                // Find best size from low network cost perspective
                // const bestMatch = findAppropriateSize(el['images']);

                return {
                    title,
                    id,
                    low: stageOne,
                    high: finalStage,
                    still,
                }
            });

            return {
                data: _modified,
                pagination,
            };
        })
        .then((response) => {
            const {data, pagination} = response;

            addPaginationOffset(Number.parseInt(pagination['count']));

            const totalCount = pagination['total_count'];

            if (Pagination.getCurrentState().current === Number.parseInt(totalCount)) {
                LimitReachedState.changeState(true);
            }

            const fragment = document.createDocumentFragment();
            console.time(perfLog('Time to add elements'));
            data.forEach((el) => {
                fragment.appendChild(getImageDomElement(el));
            });
            container.appendChild(fragment);
            console.timeEnd(perfLog('Time to add elements'));
            showLoader(false);
        })
        .catch((err) => {
            console.warn('Error:', err);
            showLoader(false);
            LimitReachedState.changeState(true);
        })
}

function getImageDomElement(el) {

    const {
        title,
        id,
        low,
        high,
    } = el;

    const divContainer = document.createElement('div');
    const domImage = document.createElement('img');

    divContainer.classList.add('gif_item_container');


    domImage.classList.add('gif_item');
    domImage.classList.add('shine');

    domImage.setAttribute('title', title);
    domImage.setAttribute('src', low['url']);
    domImage.setAttribute('id', id);
    domImage.style.height = '200px';

    const addActiveUrl = () => domImage.setAttribute('src', high['url']);
    // const addStill = () => domImage.setAttribute('src', still['url']);

    domImage.addEventListener('load', () => {
        const highResDownloaded = (domImage.getAttribute('src') === high['url']);
        // upgrade
        highResDownloaded ? (domImage.onclick = showModal) : addActiveUrl();
    });

    domImage.style.width = `${getAppropriateWidth(
                                getItemWidthRange(200),
                                Number.parseInt(high['width']))}px`;
    divContainer.appendChild(domImage);
    return divContainer;
}

function getAppropriateWidth({max, min, ideal}, expected) {
    return (expected <= max && expected >= min) ? expected : ideal;
}

/**
 * Add play pause button
 * Not developed
 */
function addPlayPause() {
    // const play = document.createElement('div');
    // play.classList.add('box');
    // play.classList.add('center');
    // play.classList.add('pause');
    // play.addEventListener('click', (e) => {
    //     e.target.classList.toggle('play');
    //     e.target.classList.toggle('pause');
    //     if (domImage.dataset['play'] === PLAY) {
    //         // addStill();
    //         // domImage.src = dummy.src;
    //         console.log(still['url']);
    //         domImage.dataset['play'] = PAUSE;
    //         domImage.removeEventListener('mouseover', addActiveUrl);
    //         domImage.removeEventListener('mouseout', addLowUrl);
    //     } else {
    //         domImage.setAttribute('src', low['url']);
    //         domImage.addEventListener('mouseover', addActiveUrl);
    //         domImage.addEventListener('mouseout', addLowUrl);
    //         domImage.dataset['play'] = PLAY;
    //     }
    // });
    // divContainer.appendChild(play);
}
