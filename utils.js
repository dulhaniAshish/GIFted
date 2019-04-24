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

function findBestPlacements(container, array) {
    const width = container.innerWidth;
    const res = [];

}

const variants = ['fixed_height', 'fixed_width', 'original'];
const modes = ['small', 'downsampled', ''];

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

const debounce = (func, delay) => {
    let inDebounce;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay)
    }
};