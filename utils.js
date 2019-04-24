const initialValues = {
    'int': 0,
    'string': 'fuck',
    'object': {},
    'boolean': false,
};

const defaultValues = {
    'int': 0,
    'string': '',
    'object': {},
    'boolean': false,
};

function State(name, type = 'string') {
    let currentState = {
        prev: defaultValues[type],
        current: initialValues[type],
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