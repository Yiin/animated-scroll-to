interface Options {
  speed?: number,
  minDuration?: number,
  maxDuration?: number,
  offset?: number,
  element?: HTMLElement,
  [optionKey: string]: any, // TODO ts types revisit
}

interface XY {
  x: number,
  y: number,
}


class WindowScoller {
  getMaxScrollForDimension(dimension: 'Width' | 'Height') {
    const scrollDimenstion = `scroll${ dimension }`; // scrollWidth or scrollHeight
    const offsetDimenstion = `offset${ dimension }`; // offsetWidth or offsetHeight
    const clientDimenstion = `client${ dimension }`; // clientWidth or clientHeight
    const innerDimenstion = `inner${ dimension }`; // innerWidth or innerHeight

    // TODO ts types revisit
    const documentBody = (document.body as any);
    const documentElement = (document.documentElement as any);

    // cross browser document width (or height) minus window width (or height)
    return Math.max(
      documentBody[scrollDimenstion],
      documentBody[offsetDimenstion],
      documentBody[clientDimenstion],
      documentElement[scrollDimenstion],
      documentElement[offsetDimenstion],
      documentElement[clientDimenstion],
    ) - (window as any)[innerDimenstion];
  }

  getMaxScroll():XY {
    return {
      x: this.getMaxScrollForDimension('Width'),
      y: this.getMaxScrollForDimension('Height'),
    };
  }
  
  getScrollPosition() {
    return {
      x: window.scrollX || document.documentElement.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop,
    }
  }

  scrollTo(x:number, y:number) {
    window.scrollTo(x, y);
  }
}

class ElementScoller {
  element:HTMLElement;

  constructor(element:HTMLElement){
    this.element = element;
  }

  getMaxScroll():XY {
    return {
      x: this.element.scrollWidth - this.element.clientWidth,
      y: this.element.scrollWidth - this.element.clientWidth,
    };
  }
  
  getScrollPosition() {
    return {
      x: this.element.scrollLeft,
      y: this.element.scrollTop,
    }
  }

  scrollTo(x:number, y:number) {
    this.element.scrollLeft = x;
    this.element.scrollTop = y;
  }
}

// Executes callback if any
function executeCallback(callback:Function) {
  if (callback && typeof callback === 'function') {
    callback();
  }
}

const eventTypes:string[] = [
  'mousedown',
  'touchstart',
  'keydown',
];

function getScroller(element:HTMLElement):ElementScoller | WindowScoller {
  // Scroller interface
  // Based on element we should scroll 
  // (window or user defined element)
  let scroller = null;

  if (element) {
    if (element instanceof HTMLElement) {
      scroller = new ElementScoller(element);
    } else {
      console.warn(`Animate scroll to - "options.element" is not instance of HTMLElement: ${ element }`);
      return;
    }
  } else {
    scroller = new WindowScoller();
  }

  return scroller;
}

function animateScrollTo(y:number, userOptions:Options = {}) {
  // Default options
  const options:Options = {
    speed: 500,
    minDuration: 500,
    maxDuration: 1500,
    element: null,
    offset: 0,
  };

  // Request animation frame ID
  this.requestID = null;  

  // Merge default and user options
  Object.keys(options).forEach(optionKey => {
    if (typeof userOptions[optionKey] !== 'undefined') {
      options[optionKey] = userOptions[optionKey];
    }
  });

  // Removes all listeners
  this.removeListeners = () => {
    eventTypes.forEach(eventName => 
      window.removeEventListener(eventName, this.stopAnimation));
  }

  this.stopAnimation = () => {
    // Stop animation by removing animation frame
    cancelAnimationFrame(this.requestID);
    
    this.removeListeners();
  };

  // Add listeners
  eventTypes.forEach(eventName => 
    window.addEventListener(eventName, this.stopAnimation, { passive: true }));
  
  // Get scroller interface
  const scroller = getScroller(options.element);

  // Add user offset
  y = y + options.offset;

  const initialPositions = scroller.getScrollPosition();
  const maxScroll = scroller.getMaxScroll();

  // If the scroll position is greater than maximum available scroll
  if (y > maxScroll.y) {
    y = maxScroll.y;
  }

  const yDiff = y - initialPositions.y;

  // Do nothing if the page is already there
  if (yDiff === 0) {
    executeCallback(options.onComplete);
    return;
  }

  const yDuration = Math.abs(Math.round((yDiff / 1000) * options.speed));
  let duration = yDuration;

  // Set minimum and maximum duration
  if (duration < options.minDuration) {
    duration = options.minDuration;
  } else if (duration > options.maxDuration) {
    duration = options.maxDuration;
  }

  // Animation starting time
  const startTime = Date.now();

  this.doAnimationStep = () => {
    const timeDiff = Date.now() - startTime;
    const yStep = timeDiff / duration;
    // TODO Add easing - yStep = yStep * easing
    const yPosition = Math.round(initialPositions.y + (yDiff * yStep));

    if (timeDiff < duration && yPosition !== y) {
      // If scroll didn't reach desired offset or time is not elapsed
      // Scroll to a new position
      // And request a new step
      scroller.scrollTo(0, yPosition);

      this.requestID = requestAnimationFrame(this.doAnimationStep);
    } else {
      // If the time elapsed or we reached the desired offset
      // Set scroll to the desired offset (when easing and rounding made it to be off a pixel or two)
      scroller.scrollTo(0, y);

      this.removeListeners();
      cancelAnimationFrame(this.requestID);
      executeCallback(options.onComplete);
    }
  }

  // Start animation
  this.requestID = requestAnimationFrame(this.doAnimationStep);
}

//export default animateScrollTo;