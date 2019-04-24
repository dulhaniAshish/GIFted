const input = document.querySelector('input.search');
const container = document.querySelector('#container');
const loader = document.querySelector('.loading');
const modal = document.getElementById('myModal');
const img = document.getElementById('myImg');
const modalImg = document.getElementById("img01");
const captionText = document.getElementById("caption");
const span = document.getElementsByClassName("close")[0];


const SearchState = new State('searchText');
const Pagination = new State('pagination', 'int');
const FetchState = new State('fetching', 'boolean');
const LimitReachedState = new State('maxLimitForAPIReached', 'boolean');

const SIZE_LIMIT = config.UTILS.MAX_GIF_SIZE; // bytes
const DEBOUNCE_TIME = config.UTILS.DEBOUNCE_TIME; // ms

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

span.onclick = function () {
    modal.style.display = "none";
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
                const stageOne = el['images'][`${selector}`];
                const finalStage = el['images']['fixed_height'];
                const bestMatch = findAppropriateSize(el['images']);

                return {
                    title,
                    id,
                    low: stageOne,
                    high: finalStage,
                }
            });

            return Promise.resolve({
                data: _modified,
                pagination,
            });
        })
        .then((response) => {
            const {data, pagination} = response;

            addPaginationOffset(Number.parseInt(pagination['count']));

            const totalCount = pagination['total_count'];

            if (Pagination.getCurrentState().current === Number.parseInt(totalCount)) {
                LimitReachedState.changeState(true);
            }
            const fragment = document.createDocumentFragment();
            console.time('add els');
            data.forEach((el) => {
                fragment.appendChild(getImageDomElement(el));
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

function getImageDomElement(el) {
    const domImage = document.createElement('img');

    domImage.classList.add('gif_item');
    domImage.classList.add('shine');

    const {
        title,
        id,
        low,
        high
    } = el;

    domImage.setAttribute('title', title);
    domImage.setAttribute('src', low['url']);
    domImage.setAttribute('id', id);
    domImage.style.display = 'flex';

    const addActiveUrl = () => domImage.setAttribute('src', high['url']);

    const addStillUrl = () => domImage.setAttribute('src', low['url']);

    const expectedWidth = `${high['width']}px`;
    domImage.addEventListener('mouseover', addActiveUrl);
    domImage.addEventListener('mouseout', addStillUrl);

    domImage.addEventListener('load', () => {
        domImage.getAttribute('src') === low['url'] ?
            domImage.classList.remove('shine') :    // remove shimmer
            domImage.removeEventListener('mouseout', addStillUrl);  // best gif downloaded
        // no need to revert to preview url on mouse out
    });

    domImage.onclick = showModal;
    domImage.style.height = '200px';
    domImage.style.width = expectedWidth;

    return domImage;
}



