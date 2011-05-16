//-------------------------------------------------
//		youtube playlist jquery plugin
//		Created by dan@geckonm.com
//		www.geckonewmedia.com
//
//		v1.1 - updated to allow fullscreen 
//			 - thanks Ashraf for the request
//      v1.2 - updated to allow for mixed yt/image galleries
//           - for Markus Thyberg
//-------------------------------------------------

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}


jQuery.fn.ytplaylist = function(options) {
 
  // default settings
  var options = jQuery.extend( {
    holderId: 'ytvideo',
	playerHeight: 300,
	playerWidth: 450,
	addThumbs: false,
	thumbSize: 'small',
	showInline: false,
	autoPlay: true,
	showRelated: true,
	allowFullScreen: false
  },options);
 
  return this.each(function() {
							
   		var $el = $(this);
		
		var autoPlay = "";
		var showRelated = "&rel=0";
		var fullScreen = "";
		if(options.autoPlay) autoPlay = "&autoplay=1"; 
		if(options.showRelated) showRelated = "&rel=1"; 
		if(options.allowFullScreen) fullScreen = "&fs=1"; 
		
		//throw a youtube player in
		function playOld(id) {
		   var html  = '';
	
		   html += '<object height="'+options.playerHeight+'" width="'+options.playerWidth+'">';
		   html += '<param name="movie" value="http://www.youtube.com/v/'+id+autoPlay+showRelated+fullScreen+'"> </param>';
		   html += '<param name="wmode" value="transparent"> </param>';
		   if(options.allowFullScreen) { 
		   		html += '<param name="allowfullscreen" value="true"> </param>'; 
		   }
		   html += '<embed src="http://www.youtube.com/v/'+id+autoPlay+showRelated+fullScreen+'"';
		   if(options.allowFullScreen) { 
		   		html += ' allowfullscreen="true" '; 
		   	}
		   html += 'type="application/x-shockwave-flash" wmode="transparent"  height="'+options.playerHeight+'" width="'+options.playerWidth+'"></embed>';
		   html += '</object>';
			
		   return html;
		};
		
		
		function playNew (id) {
		  var html = '';
		  html += '<iframe width="'+ options.playerWidth +'" height="'+ options.playerHeight +'"';
		  html += ' src="http://www.youtube.com/embed/'+ id +'" frameborder="0"';
		  hml += ' allowfullscreen></iframe>';
		}
		
		
		//grab a youtube id from a (clean, no querystring) url (thanks to http://jquery-howto.blogspot.com/2009/05/jyoutube-jquery-youtube-thumbnail.html)
		function youtubeid(url) {
			var ytid = url.match("[\\?&]v=([^&#]*)");
			ytid = ytid[1];
			return ytid;
		};
		
		
		//load inital video
		var firstVid = $el.children("li:first-child").addClass("currentvideo").children("a").attr("href");
		$("#"+options.holderId+"").html(playOld(youtubeid(firstVid)));
		
		//
		$el.children('li').each(function() {
            $(this).find('a').each(function() {
                var thisHref = $(this).attr('href');
                
                //old-style youtube links
                if (thisHref.startsWith('http://www.youtube.com')) {
                    $(this).addClass('yt-vid');
                    $(this).data('yt-id', youtubeid(thisHref) );
                }
                //new style youtu.be links
                else if (thisHref.startsWith('http://youtu.be')) {
                    $(this).addClass('yt-vid');
                    var id = thisHref.substr(thisHref.lastIndexOf("/") + 1);
                    $(this).data('yt-id', id );
                }
                else {
                    //must be an image link (naive)
                    $(this).addClass('img-link');
                }
                
               // alert(thisHref);
            });
		});
		
		
		//load video on request
		$el.children("li").children("a.yt-vid").click(function() {
			
			if(options.showInline) {
				$("li.currentvideo").removeClass("currentvideo");
				$(this).parent("li").addClass("currentvideo").html(playOld($(this).data("yt-id")));
			}
			else {
				$("#"+options.holderId+"").html(playOld($(this).data("yt-id")));
				$(this).parent().parent("ul").find("li.currentvideo").removeClass("currentvideo");
				$(this).parent("li").addClass("currentvideo");
			}	
			return false;
		});

		$el.find("a.img-link").click(function() {
		    var $img = $('<img/>');
		    $img.attr({
		        src:$(this).attr('href'),
		        width : options.playerWidth });
		    
		    if(options.showInline) {
		        $("li.currentvideo").removeClass("currentvideo");
		        $(this).parent("li").addClass("currentvideo").html($img);
	        }
	        else {
	            
	            $("#"+options.holderId+"").html($img);
	            var contentGap = options.playerHeight - parseInt($img.height(), 10);
	            $img.css({
	                position: 'relative',
	                top: parseInt(contentGap/2, 10)
	            })
				$(this).closest("ul").find("li.currentvideo").removeClass("currentvideo");
				$(this).parent("li").addClass("currentvideo");
				
	        }
            
		    return false;
	    });
		
		
		//do we want thumns with that?
		if(options.addThumbs) {
			
			$el.children().each(function(i){
				
				//replace first link
				var $link = $(this).find('a:first');
				var replacedText = $(this).text();
				
				if ($link.hasClass('yt-vid')) {
				    
				    if(options.thumbSize == 'small') {
    					var thumbUrl = "http://img.youtube.com/vi/"+$link.data("yt-id")+"/2.jpg";
    				}
    				else {
    					var thumbUrl = "http://img.youtube.com/vi/"+$link.data("yt-id")+"/0.jpg";
    				}

    				var thumbHtml = "<img src='"+thumbUrl+"' alt='"+replacedText+"' />";
    				$link.empty().html(thumbHtml+replacedText).attr("title", replacedText);
				    
				}
				else {
				    //is an image link
				    var $img = $('<img/>').attr('src',$link.attr('href'));
				    $link.empty().html($img).attr("title", replacedText);
				}
				
				
				
				
				
				
			});	
			
		}
			
		
   
  });
 
};