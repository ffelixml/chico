
/**
 * Positioner is a utility that resolve positioning problem for all UI-Objects.
 * @abstract
 * @name Positioner
 * @class Positioner
 * @memberOf ch
 * @param {Position Object} o Object with positioning properties
 * @return {jQuery Object}
 * @example
 * // First example
 * ch.positioner({
 *     element: $("#element1"),
 *     context: $("#context1"),
 *     points: "lt rt"                //  Element left-top point = Context left-bottom point
 * });
 * @example  
 * // Second example
 * ch.positioner({
 *     element: $("#element2"),
 *     context: $("#context2"),
 *     points: "lt lb"                //  Element center-middle point = Context center-middle point
 * });
 */
 
ch.positioner = function(o) {

    /**
     * Constructs a new positioning, get viewport size, check for relative parent's offests, 
     * find the context and set the position to a given element.
     * @constructs
     * @private
     * @function
     * @name initPosition
     * @memberOf ch.Positioner
     */
    var initPosition = function(){
        viewport = getViewport();
        parentRelative = getParentRelative();
        context = getContext();
        setPosition();        
    };


    /**
     * Object that contains all properties for positioning
     * @private
     * @name o
     * @type {Position Object}
     * @example
     * ch.Positioner({
     *   element: $element
     *   [context]: $element | viewport
     *   [points]: "cm cm"
     *   [offset]: "x y" 
     *   [hold]: false
     * });
     * @memberOf ch.Positioner
     */
	var o = o || this.conf.position;
        o.points = o.points || "cm cm";
        o.offset = o.offset || "0 0";
    
    /**
     * Reference to the DOM Element beign positioned
     * @private
     * @name element
     * @type {jQuery Object}
     * @memberOf ch.Positioner
     */
	var element = $(o.element);
		element.css("position","absolute");
    
    /**
     * Reference to the DOM Element that we will use as a reference
     * @private
     * @name context
     * @type {HTMLElement}
     * @memberOf ch.Positioner
     */
	var context;
    
    /**
     * Reference to the Window Object and it's size
     * @private
     * @name viewport
     * @type {Viewport Object}
     * @memberOf ch.Positioner
     */
	var viewport;
	
    /**
     * Reference to the element beign positioned
     * @private
     * @name parentRelative
     * @memberOf ch.Positioner
     */
	var parentRelative;

    /**
     * A map to reference the input points to output className
     * @private
     * @name classReferences
     * @memberOf ch.Positioner
     */
    var classReferences = {
		"lt lb": "bottom",
		"lb lt": "top",
		"rt rb": "bottom",
		"rb rt": "top",
		"lt rt": "right",
		"cm cm": "center"
	};

    /**
     * Array with offset information
     * @private
     * @name splittedOffset
     * @memberOf ch.Positioner
     */
    var splittedOffset = o.offset.split(" ");
   	/**
     * String with left offset information
     * @private
     */
   	var offset_left = parseInt(splittedOffset[0]);
   	/**
     * String with top offset information
     * @private
     */
    var offset_top = parseInt(splittedOffset[1]);

    /**
     * Get the viewport size
     * @private
     * @function
     * @name getViewport
     * @return {Viewport Object}
     * @memberOf ch.Positioner
     */
	var getViewport = function() {
        
        var viewport, width, height, left, top, pageX, pageY, scrollBar = 30;	    
	    	    
        // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
	    if (typeof window.innerWidth != "undefined") {
		    viewport = window;
			width = viewport.innerWidth - scrollBar;
			height = viewport.innerHeight;
			pageX = viewport.pageXOffset;
			pageY = viewport.pageYOffset;

			// Return viewport object
			return {
				element: viewport,			
				left: 0 + offset_left + pageX - scrollBar,
				top: 0 + offset_top + pageY,
				bottom: height + pageY,
				right: width + pageX,
				width: width,
				height: height
			}
		}
        // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
        // older versions of IE - viewport = document.getElementsByTagName('body')[0];		
		else {
			viewport = document.documentElement;
			width = viewport.clientWidth - scrollBar;
			height = viewport.clientHeight;
			pageX = viewport.scrollLeft;
			pageY = viewport.scrollTop;
			
			// Return viewport object
			return {
				element: viewport,			
				left: 0 + offset_left + pageX,
				top: 0 + offset_top + pageY,
				bottom: height + pageY,
				right: width + pageX,
				width: width,
				height: height
			}
	    }
	    
	};
	
 	
	/**
     * Calculate css left and top to element on context
     * @private
     * @function
     * @name getPosition
     * @return {Axis Object}
     * @memberOf ch.Positioner
     */
	var getPosition = function(unitPoints) {		     
		// my_x and at_x values together
		// cache properties 
		var contextLeft = context.left;
		var contextTop = context.top;
		var contextWidth = context.width;
		var contextHeight = context.height;
		var elementWidth = element.outerWidth();
		var elementHeight = element.outerHeight();
		
		var xReferences = {
			ll: contextLeft,
			lr: contextLeft + contextWidth,
			rr: contextLeft + contextWidth - elementWidth,
			cc: contextLeft + contextWidth/2 - elementWidth/2
			// TODO: lc, rl, rc, cl, cr
		}
		
		// my_y and at_y values together
		var yReferences = {
			// jquery 1.6 do not support offset on IE
			tt: contextTop,
			tb: contextTop + contextHeight,
			bt: contextTop - elementHeight,
			mm: contextTop + contextHeight/2 - elementHeight/2
			// TODO: tm, bb, bm, mt, mb
		}
		
		var axis = {
			left: xReferences[unitPoints.my_x + unitPoints.at_x],
			top: yReferences[unitPoints.my_y + unitPoints.at_y]	
		} 

		return axis;
	};
	
    /**
     * Evaluate viewport spaces and set points
     * @private
     * @function
     * @name calculatePoints
     * @return {Styles Object}
     * @memberOf ch.Positioner
     */
	var calculatePoints = function(points, unitPoints){					
		// Default styles
        var styles = getPosition(unitPoints);
        	styles.direction = classReferences[points];
		
		// Hold behavior
		if (o.hold) return styles;

        // Check viewport limits	
		// Bottom to top
		if ( (points == "lt lb") && ((styles.top + parentRelative.top + element.outerHeight()) > viewport.bottom) ) { // Element bottom > Viewport bottom
			unitPoints.my_y = "b";
			unitPoints.at_y = "t";

			//store old styles
			stylesBottom = styles;
			
			// New styles		 
			styles = getPosition(unitPoints);
			styles.direction = "top";
			styles.top -= (2 * offset_top);
		
			// Top to Bottom - Default again 
			if(styles.top + parentRelative.top < viewport.top){
				unitPoints.my_y = "t";
				unitPoints.at_y = "b";
				styles = stylesBottom;
				styles.direction = "bottom";
			};
		};
		
		// Left to right
		if ( (styles.left + parentRelative.left + element.outerWidth()) > viewport.right ) { // Element right > Viewport right
			unitPoints.my_x = "r";
			unitPoints.at_x = "r";
			
			//store old styles
			stylesLeft = styles;
			
			// New styles
			var current = styles.direction;
			styles = getPosition(unitPoints);
			styles.direction = current + "-right";						
			styles.left -= (2 * offset_left);
			if(current == "top") styles.top -= (2 * offset_top);
			
			// Right to Left - Default again 
			if(styles.left < viewport.left){
				unitPoints.my_y = "l";
				unitPoints.at_y = "l";
				styles = stylesLeft;
			};
		};

		return styles;
	};
	
	
    /**
     * Set position to element
     * @private
     * @function
     * @name setPosition
     * @memberOf ch.Positioner
     */
	var setPosition = function() {
		// Separate points config
        var splitted = o.points.split(" ");
        
        var unitPoints = {
        	my_x: splitted[0].slice(0,1),
        	my_y: splitted[0].slice(1,2),
        	at_x: splitted[1].slice(0,1),
        	at_y: splitted[1].slice(1,2)
        }

		var styles = calculatePoints(o.points, unitPoints);

		element
			.css({
				left: styles.left,
				top: styles.top
			})
			.removeClass( "ch-top ch-left ch-bottom ch-right ch-bottom-right ch-top-right  ch-right-right" )
			.addClass( "ch-" + styles.direction );
				
		if ( ch.utils.hasOwn(context, "element") && context.element !== ch.utils.window[0] ){
			$(context.element)
				.removeClass( "ch-top ch-left ch-bottom ch-right ch-bottom-right ch-top-right ch-right-right" )
				.addClass( "ch-" + styles.direction );
		};

	};	

    /**
     * Get context element for positioning, if ain't one, select the viewport as context.
     * @private
     * @function
     * @name getContext
     * @return {Context Object}
     * @memberOf ch.Positioner
     */
	var getContext = function(){
	    
	    if (!o.context) {
	        return viewport;
	    }
	     
        var contextOffset = o.context.offset();
        
        context = {
            element: o.context,
            top: contextOffset.top + offset_top - parentRelative.top,
            left: contextOffset.left + offset_left - parentRelative.left,
            width: o.context.outerWidth(),
            height: o.context.outerHeight()
        };
        
        return context;	        
	    
	};
	
    /**
     * Get offset values from relative parents
     * @private
     * @function
     * @name getParentRelative
     * @return {Offset Object}
     * @memberOf ch.Positioner 
     */
	var getParentRelative = function(){
		
		var relative = {};
			relative.left = 0;
			relative.top = 0;
		
		var parent = element.offsetParent();

		if ( parent.css("position") == "relative" ) {
			
			var borderLeft = (parent.outerWidth() - parent.width() - ( parseInt(parent.css("padding-left")) * 2 )) / 2;
			
			relative = parent.offset();
			relative.left -= offset_left - borderLeft;
			relative.top -= offset_top;
			
		};
		
		return {
			left: relative.left,
			top: relative.top
		};
		
	};
	
 	 
	var scrolled = false;

	// Scroll and resize events
	// Tested on IE, Magic! no lag!!
	ch.utils.window.bind("resize scroll", function() {
		scrolled = true;
	});
	
	setInterval(function() {
	    if( !scrolled ) return;
		scrolled = false;
		// Hidden behavior
		if( element.css("display") === "none" ) return; 	
		initPosition();
	}, 250);

   /**
    * @ignore
    */
    initPosition();
	
	// Return the reference to the positioned element
	return $(element);
};

