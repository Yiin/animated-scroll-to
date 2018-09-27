var WindowScoller = (function () {
    function WindowScoller() {
    }
    WindowScoller.prototype.getMaxScrollForDimension = function (dimension) {
        var scrollDimenstion = "scroll" + dimension;
        var offsetDimenstion = "offset" + dimension;
        var clientDimenstion = "client" + dimension;
        var innerDimenstion = "inner" + dimension;
        var documentBody = document.body;
        var documentElement = document.documentElement;
        return Math.max(documentBody[scrollDimenstion], documentBody[offsetDimenstion], documentBody[clientDimenstion], documentElement[scrollDimenstion], documentElement[offsetDimenstion], documentElement[clientDimenstion]) - window[innerDimenstion];
    };
    WindowScoller.prototype.getMaxScroll = function () {
        return {
            x: this.getMaxScrollForDimension('Width'),
            y: this.getMaxScrollForDimension('Height'),
        };
    };
    WindowScoller.prototype.getScrollPosition = function () {
        return {
            x: window.scrollX || document.documentElement.scrollLeft,
            y: window.scrollY || document.documentElement.scrollTop,
        };
    };
    WindowScoller.prototype.scrollTo = function (x, y) {
        window.scrollTo(x, y);
    };
    return WindowScoller;
}());
var ElementScoller = (function () {
    function ElementScoller(element) {
        this.element = element;
    }
    ElementScoller.prototype.getMaxScroll = function () {
        return {
            x: this.element.scrollWidth - this.element.clientWidth,
            y: this.element.scrollWidth - this.element.clientWidth,
        };
    };
    ElementScoller.prototype.getScrollPosition = function () {
        return {
            x: this.element.scrollLeft,
            y: this.element.scrollTop,
        };
    };
    ElementScoller.prototype.scrollTo = function (x, y) {
        this.element.scrollLeft = x;
        this.element.scrollTop = y;
    };
    return ElementScoller;
}());
function executeCallback(callback) {
    if (callback && typeof callback === 'function') {
        callback();
    }
}
var eventTypes = [
    'mousedown',
    'touchstart',
    'keydown',
];
function getScroller(element) {
    var scroller = null;
    if (element) {
        if (element instanceof HTMLElement) {
            scroller = new ElementScoller(element);
        }
        else {
            console.warn("Animate scroll to - \"options.element\" is not instance of HTMLElement: " + element);
            return;
        }
    }
    else {
        scroller = new WindowScoller();
    }
    return scroller;
}
function animateScrollTo(y, userOptions) {
    var _this = this;
    if (userOptions === void 0) { userOptions = {}; }
    var options = {
        speed: 500,
        minDuration: 500,
        maxDuration: 1500,
        element: null,
        offset: 0,
    };
    this.requestID = null;
    Object.keys(options).forEach(function (optionKey) {
        if (typeof userOptions[optionKey] !== 'undefined') {
            options[optionKey] = userOptions[optionKey];
        }
    });
    this.removeListeners = function () {
        eventTypes.forEach(function (eventName) {
            return window.removeEventListener(eventName, _this.stopAnimation);
        });
    };
    this.stopAnimation = function () {
        cancelAnimationFrame(_this.requestID);
        _this.removeListeners();
    };
    eventTypes.forEach(function (eventName) {
        return window.addEventListener(eventName, _this.stopAnimation, { passive: true });
    });
    var scroller = getScroller(options.element);
    y = y + options.offset;
    var initialPositions = scroller.getScrollPosition();
    var maxScroll = scroller.getMaxScroll();
    if (y > maxScroll.y) {
        y = maxScroll.y;
    }
    var yDiff = y - initialPositions.y;
    if (yDiff === 0) {
        executeCallback(options.onComplete);
        return;
    }
    var yDuration = Math.abs(Math.round((yDiff / 1000) * options.speed));
    var duration = yDuration;
    if (duration < options.minDuration) {
        duration = options.minDuration;
    }
    else if (duration > options.maxDuration) {
        duration = options.maxDuration;
    }
    var startTime = Date.now();
    this.doAnimationStep = function () {
        var timeDiff = Date.now() - startTime;
        var yStep = timeDiff / duration;
        var yPosition = Math.round(initialPositions.y + (yDiff * yStep));
        if (timeDiff < duration && yPosition !== y) {
            scroller.scrollTo(0, yPosition);
            _this.requestID = requestAnimationFrame(_this.doAnimationStep);
        }
        else {
            scroller.scrollTo(0, y);
            _this.removeListeners();
            cancelAnimationFrame(_this.requestID);
            executeCallback(options.onComplete);
        }
    };
    this.requestID = requestAnimationFrame(this.doAnimationStep);
}
//# sourceMappingURL=index.js.map