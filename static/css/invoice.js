function sendmailtosupp(oracel_order_number)
{
	  
    var today = new Date();
	  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	  var dateTime = date+' '+time;		 	 
	  var element = document.getElementById('v-invoice'); 
	  
	  var opt = {
	    margin:       [0,0,0,0],
	    filename:     oracel_order_number+".pdf",
	    image:        { type: 'jpeg', quality:0.98},
	    html2canvas: 
        {
            scale: 2.5,
	        //   scale:2.5,
	        useCORS: true,
	        
	        },
	  	 
	       
         jsPDF:{  unit: 'in', format: [11.26772, 18.2669], orientation: 'portrait'  },	   
         
       //pagebreak: { before: "#page1" },
           
	   
	  };  
	  
	 html2pdf().from(element).set(opt).outputPdf().then(function(pdf)
     {	       

             var ht=document.getElementById('v-invoice').innerHTML
             var   globalpdftoemail=b2a(pdf);
             //console.log(globalpdftoemail)
           axios.post("{% url 'invoice_save_in_table' %}",
           {
               po : globalpdftoemail,   
               oracel_order_number:oracel_order_number   ,
               document_type:'PDF',
               invoice_html:ht,
               type:'invoice'        
           })
           .then(function (res) 
           {
               
                       // console.log(res);
                        
                       // document.getElementById('v-invoice').innerHTML='<object data="'+res.data.invoice_path+'" type="application/pdf" width="100%" height="100%"><p>link <a href="'+res.data.invoice_path+'">to the PDF!</a></p></object>'
                        
                        
                 //  window.location.href = res.data.invoice_path;
                        
                        
                        
                        //<embed src="'+res.data.invoice_path+'" type="application/pdf" width="100%" height="100%" />'



           })
           .catch(function () 
           {
                
               // alert('No Invoice Record found');

               //window.close();
           })
        	
		 
		    
	}); 
	
	
}
    function b2a(a) {
        var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
        if (!a) return a;
        do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e, 
        f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length);
        return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) :m) + "===".slice(o || 3);
        }
