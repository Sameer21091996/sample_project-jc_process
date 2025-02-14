/*
Template Name: Admin Template
Author: Wrappixel

File: js
*/
// ============================================================== 
// Auto select left navbar
// ============================================================== 
$(function() {
    "use strict";
    
     var url = window.location + "";
        var path = url.replace(window.location.protocol + "//" + window.location.host + "/", "");
        var element = $('ul#sidebarnav a').filter(function() {
            return this.href === url || this.href === path;// || url.href.indexOf(this.href) === 0;
        });
        element.parentsUntil(".sidebar-nav").each(function (index)
        {
            if($(this).is("li") && $(this).children("a").length !== 0)
            {
                $(this).children("a").addClass("active");
                $(this).parent("ul#sidebarnav").length === 0
                    ? $(this).addClass("active")
                    : $(this).addClass("selected");
            }
            else if(!$(this).is("ul") && $(this).children("a").length === 0)
            {
                $(this).addClass("selected");
                
            }
            else if($(this).is("ul")){
                $(this).addClass('in');
            }
            
        });

    element.addClass("active"); 
    $('#sidebarnav a').on('click', function (e) {
        
            if (!$(this).hasClass("active")) {
                // hide any open menus and remove all other classes
                $("ul", $(this).parents("ul:first")).removeClass("in");
                $("a", $(this).parents("ul:first")).removeClass("active");
                
                // open our new menu and add the open class
                $(this).next("ul").addClass("in");
                $(this).addClass("active");
                
            }
            else if ($(this).hasClass("active")) {
                $(this).removeClass("active");
                $(this).parents("ul:first").removeClass("active");
                $(this).next("ul").removeClass("in");
            }
    })
    $('#sidebarnav >li >a.has-arrow').on('click', function (e) {
        e.preventDefault();
    });

    breadcrumb()
    
});


function breadcrumb()
{


    var a=window.location.host;
    var path = window.location.href;
    var arr=path.split(a);
    var ac=document.querySelectorAll('.sidebar-link');
    for(var i=1;i< ac.length;i++)
    { 
      console.log(ac[i].href)
      console.log('#')
      console.log(path)
     if(ac[i].href == path)
     {	
        
        var txtcurrent=ac[i].text.trim();		
        
        var parentNodVAl=ac[i].parentElement.parentElement.parentElement.firstElementChild.text.trim()
        
        //var current_lo=ac[1].parentElement;
        
        var out='<li class="breadcrumb-item"><a href="#">'+parentNodVAl+'</a></li><li class="breadcrumb-item active" aria-current="page">'+txtcurrent+'</li>';
        $('.breadcrumb').html(out)	
     }
     
    }
    

}