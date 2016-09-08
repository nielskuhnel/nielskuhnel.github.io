$(function() {        
    var fakeSortDesc = false;    

    var cols = 10;
    var maxRows = 8;
    var fixed = 1;
    var sparkIndex = document.location.hash == "#spark" ? 3 : -1;      
    
    var testData = [];
    for( var i = 0; i < 500; i++ ) {
        var row = { id: i, cols: []};
        for( var j = 0; j < cols; j++ ) {            
            row.cols[j] = "Item " + (i+1) + "." + (j + 1);
            if( j == sparkIndex ) {   
                Math.seedrandom(i + 1);
                var ys = [];
                for( var k = 0; k < 6; k++) {
                    ys.push(10*Math.random());                    
                }
                row.cols[j] = ys;                
            }
        }
        row.id = "row-" + i;
        testData.push(row);
    }
    
    
    var nextReq = 0, prevReq = 0, reqs = 0;    

    function requestData (start, count, callback) {
        var req = ++nextReq;
    
        ++reqs;
        document.getElementById("loader").style.opacity = 1;
                        
        setTimeout(function() {               
            if( --reqs == 0 ) {
                document.getElementById("loader").style.opacity = 0;            
            }
            if( req <= prevReq ) return;
            prevReq = req;
            var data = [];                
            for( var i = start; i < start + count; i++) {
                var ix = fakeSortDesc ? filtered.length - i - 1 : i;
                if( ix >= 0 && ix < filtered.length ) {
                    data.push(filtered[ix]); 
                } else {                    
                    data.push(null);
                }
            }                   
            setCount(filtered.length);            
            callback(data);            
        }, Math.random()*750);	        
    }

    function updateContent (el, data, hide) {                
        el.style.display = hide ? "none" : "";                
        if( hide ) return;

        if( !data ) {                        
            $(el).addClass("loading");
            //Data is unavailable. Clear row. (It's probably being loaded.)            
            for(var i = 0, n = el.children.length; i < n; i++ ) {        
                el.children[i].innerHTML = "";
            }        
            return;
        }	
        
        $(el).removeClass("loading");
        el.setAttribute("data-id", data.id);
        for(var i = 0, n = el.children.length; i < n; i++ ) {        
            var ix = i < fixed ? i : i + fixed;
            if( ix == sparkIndex ) {                                
                //$(el.children[i]).sparkline(data.cols[ix], { width: "100px", spotRadius: 0, fillColor: "#b3e5fc", lineColor: "#03a9f4", disableTooltips: true, disableHighlight: true});                
                  var target = $("span.spark", el.children[i]);
                  if( target.length ) {
                      target.text(data.cols[ix]).change();                      
                  } else {                       
                      $("<span></span>").addClass("spark").appendTo(el.children[i]).text(data.cols[ix]).peity("line", {width: 100});
                  }                                   
            } else {
                el.children[i].innerHTML = data.cols[ix];
            }
        }	    
    }

    
    var filtered = testData;
    var prevFilter = "";
    function setFilter(filter) {
        if( filter != prevFilter ) {
            filtered = filter ? testData.filter(function(d) {
                for( var i = 0; i < d.cols.length; i++ ) {
                    if( d.cols[i].indexOf(filter) != -1 ) {
                        return true;
                    }
                }
                return false;
            }) : testData;            
            mScroll.reload(false, true);
            prevFilter = filter;            
        }
    }      

    //When the total count has changed. For example, when filtering.
    var prevCount = -1;
    function setCount(count) {
        if( count == prevCount ) {
            return;
        }        
        prevCount = count;        
        $("#l > .scroller").css("height", (114 + count*51) + "px");
        $("#m > .scroller").css("height", count*51 + "px");        
        mScroll.options.infiniteLimit = count;        
        lScroll.options.infiniteLimit = count;                
        
        
        $("#l").css("height", (114 + Math.min(count, maxRows) * 51) + "px");
        $("#m").css("height", (Math.min(count, maxRows) * 51) + "px");
        
        mScroll.refresh();
        lScroll.refresh();
    }


    var $tl = document.getElementById("tl-inner");
    var $t = document.getElementById("t-inner");
    var $l = document.getElementById("l-inner");
    var $m = document.getElementById("m");

    function defaultOptions(options) {
        var ops = {
            mouseWheel: true,
            disableMouse: false,
            deceleration: 0.001,
            bounceTime: 400,
            click: true,

            cacheSize: 50,
        }
        
        for(var k in options) {
            ops[k] = options[k];
        }
        
        return ops;
    }


    var tScroll = new IScroll($t, defaultOptions({
      scrollX: true,
      scrollY: false,
      probeType: 3
    }));    

    var lScroll = new IScroll($l, defaultOptions({
      scrollX: false,
      scrollY: true,
      probeType: 3,
      
        infiniteElements: '#l ul.row',        
        dataFiller: updateContent,
        externallyUpdated: true
    }));
    lScroll.on("scroll", function(){
        var newY = this.y >= 0 ? 0 : this.y <= this.maxScrollY ? this.maxScrollY : this.y;
        if( newY != mScroll.y ) {
            mScroll.scrollTo(mScroll.x, newY);
        }
    });

    var mScroll = new IScroll($m, defaultOptions({
        scrollX: true,
        scrollY: true,
        freeScroll: true,    
        
        scrollbars: true,
        interactiveScrollbars: true,      
        shrinkScrollbars: 'scale',
        fadeScrollbars: true,
        probeType: 3,

        infiniteElements: '#m ul.row',
        infiniteLimit: 50,        
        dataset: requestData,
        dataFiller: updateContent,    
        infiniteParticipants: [lScroll]      
    }));
    
    mScroll.synchronize(tScroll);


    setCount(filtered.length);

    $("#open-search").click(function(e) {
        $("#search-container").addClass("open");
        $("#search").focus();
        e.preventDefault();
    });

    $("#close-search").click(function(e) {
        $("#search-container").removeClass("open");
        $("#search").val("");
        $("#search").blur();
        
        setFilter("");
        e.preventDefault();
    });

    $("#search").on("keydown", function(e) {
        if( e.keyCode == 13) $(this).blur();
    });
    $("#search").on("keydown", $.debounce(250, function() {
        setFilter($(this).val());        
    }));

    var headers = $(".row.head li.sortable");
    headers.on("click", function(e) {
        var i = $("i.sort-icon", this);    
        if( !$(this).is(".sorted") ) {            
            headers.removeClass("sorted");            
            $("i.sort-desc", headers).removeClass("sort-desc");
            $(this).addClass("sorted");            
        } else {
            i.toggleClass("sort-desc");             
        }
                        
        fakeSortDesc = i.is(".sort-desc");        
        
        mScroll.reload(false, true);        
        
        e.preventDefault();
    });   
});