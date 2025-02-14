var global_data;
var api;
function datatable_reload(res,tbl)
{
            global_data=res;
            console.log('datatable_reload')
            var oTblReport = $(tbl)
            console.log(tbl)
            console.log(res.data); 
            if(tbl=='#products')
            {         
            table= oTblReport.DataTable ({
            //"scrollX": true,
            lengthMenu: [
                [ -1],
                 [ 'Show all']],        	
		        	"dom": "<'row'<'col-md-2'B><'col-md-2'l><'col-md-4 lbl_qty_count'><'col-md-4'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",
		      	buttons: [
              {
                text: 'Add To Cart',
                action: function ( e, dt, node, config ) 
                {
                    console.log("Add To Cart 23")
                    //alert( 'Button activated' );
                }
            }
        ],
        "data" : res.data.data,
        "columns" : res.data.columns,
        "columnDefs": [
        {
                "targets": [ 0 ],
                "render": function(data,type,row,meta)
                {
                   // return ' <button  type="button" class="add-to-cart btn btn-sm btn-info"   style="">Add To Cart <i style="color: white;" class="fa fa-cart-plus fa-1x "  aria-hidden="true"></i></button>';

                    return '<input type="checkbox" class="row-checkbox" >';
                }
        },
        {
                "targets": [ 1 ],
                visible:false
        },
        ],
        rowId:function(d)
        {
                    return (d.inventory_item_id + d.serial_number).split(' ').join('').trim();
        },
        drawCallback:function()
        {
           var obj= shoppingCart.listCart()
           for(var i=0;i<obj.length;i++)
           {
               console.log($('#'+id).find('.row-checkbox'))
                var id = obj[i].obj.name.split(' ').join('');
                $('#'+id).find('.row-checkbox').hide();

           }
               api = this.api();
             //console.log('#123123')
             //console.log(api.column( 19, {page:'current'} ).data().sum().toLocaleString())
              $(".lbl_qty_count").html(
                "<b>Total Available Quantity:"+api.column( 18, {page:'all'} ).data().sum().toLocaleString()+"</b>"
              );
             // console.log('#123123')

        },
         initComplete: function () 
         {

            $('#products thead th').each( function ()
            {
             var title = $(this).text();

            var cmpTitle = $(this).text().toLowerCase().trim();

        if(!cmpTitle=='')
        {

            if(cmpTitle.includes('date'))
            {

                $(this).html( title+'<br><input type="text" class="dt-date-fltr dt-inputs  form-control" placeholder="..." />' );

            }
            else
            {

                $(this).html( title+'<br><input type="text" class=" dt-inputs form-control" placeholder="..." />' );

            }


        }
        else
        {
            return $(this).html( 'Select all <br><input type="checkbox" class="select-all-checkbox" >');
        }



} );

var i=0;
this.api().columns().every( function () {

    var that = this;

   // console.log(that)
  //  console.log('tayyab')



        $( 'input', this.header() ).on( 'keyup change clear', function (e) {
            var ifDate = $(this).attr('class').includes('dt-date-fltr');
            if(e.which == 13 || ifDate)
             {
                if ( that.search() !== this.value )
                 {
                    that.search(this.value).draw();
                 }
            }
        });

        $('input', this.header()).on('click', function(e) {

            e.stopPropagation();

        });

});

}


            });

}
            else
            {

               var  table_1= oTblReport.DataTable ({"data":res.data.data,"columns" : res.data.columns,
                "columnDefs": [
                {
                    "targets": [ 0 ],
                    "render": function(data,type,row,meta)
                    {  return '';  }
                },
                {
                    "targets": [ 1 ],
                    visible:false
                },],})   

                $('#pre_filter').on( 'click', 'tr', function () 
                {
                             console.log( table_1.row( this ).data());
                            var temp1=table_1.row( this ).data()                             
                             update_datatable(temp1.inventory_item_id)
                } );  

            }



}
function update_datatable(inventory_item_id,table_name='')
{

    ShowDIV()
   console.log(inventory_item_id);  
   console.log('#121212') 
   axios.get("filtered_stock?defs="+ localStorage.getItem('defs')+"&inventory_item_id="+inventory_item_id)
    .then(function(res)
    {

        HideDIV()
        var tbl='#products'
       if(table_name!='')
       {
            tbl=table_name
       }
       console.log(res)
        if ($.fn.dataTable.isDataTable(tbl))
        {
            $(tbl).DataTable().destroy();
            $(tbl).innerHTML = '';
            $(tbl).html('')

            datatable_reload(res,tbl);

        }
        else
        {
            
            datatable_reload(res,tbl);
        }       

    })
    .catch(function()
    {
       

    })
}
var selected='';
function  Preview_Order()
{

    //alert(1)
    //get_selected_cust()
   

    displayCart();
    //$('#profile-tab').click()
    refresh_reservation_details()
    //get_selected_cust()
    //get_tax_()
    setTimeout(get_selected_cust, 1000);
    

}
function onDashClick(e) 
{
            selected= e.children[1].children[0].textContent.trim();
            console.log(selected)
            //
            var all_dash_icon= document.querySelectorAll('.info-box')
            for (var i = 0, len = all_dash_icon.length; i < len; i++) 
            {
                all_dash_icon[i].style.background='#fff'
            }
            $(".common_area_cls").hide(); 

            if(selected=='Create Reservation')
            {
                e.style.background='#a0a0a0';                            
                $("#avlable_stock").show();
            }
            //if(selected=='Confirmed Reservations')
            if(selected=='Temporary Reservations')
            {
                e.style.background='#a0a0a0';      
                //status='ENTERED','ADVANCE PAYMENT INITIATED','ADVANCE PAYMENT RECEIVED' 
                str='ENTERED';
                str1='ADVANCE PAYMENT INITIATED';
                str2='ADVANCE PAYMENT RECEIVED';
                //str3='CANCELED';
                var res =str+"'"+','+"'"+str1+"'"+',+'+"'"+str2//+"'"+',+'+"'"+str3;         
                update_reserved_stock('reserved_stock',res); 

            }
            //if(selected=='On Order Stock')
            if(selected=='Confirmed Reservations')
            {
                e.style.background='#a0a0a0';     
                str='RESERVED';               
                var res =str;        
                update_reserved_stock('reserved_stock',res);
            }
             if(selected=='All Reservations')
            {
                e.style.background='#a0a0a0';  
                str='RESERVED';               
                var res =str;          
                update_reserved_stock('reserved_stock',res,1);
            } 
}

$(document).on('change','input.select-all-checkbox',function () 
{
        if (this.checked)
        {
              $('.row-checkbox').prop('checked',true);
              $('.row-checkbox').closest('tr').addClass('table-info');
        }
        else
        {
              $('.row-checkbox').prop('checked',false);
              $('.row-checkbox').closest('tr').removeClass('table-info');
        }
});
  
  
  $(document).on('click','.row-checkbox',function (e) {
        console.log(e)
        if (e.target.checked)
        {
            $(e.target).closest('tr').addClass('table-info');
    
        }else
        {
            $(e.target).closest('tr').removeClass('table-info');
    
        }
        e.stopPropagation();
  });
  
var invd = new Vue({
    delimiters:['[[',']]'],
    el: '#v-inv-detail',
    data:
    {
        invs:[],
        inv:[]
    },
    methods:{
    },  
});
var inv_tot= new Vue({
      delimiters:['[[',']]'],
      el:"#invoice_total_v",
      data:{
              't':0,
               'td':0,
               'tv':0,
               'gt':0,
               'vat_p':'',
               'dp_req':0
            }
})

  var cust_selected_add_arr=[];
  function get_selected_cust()
  {   
      // try
      // {
    
     //toaster_create();
  
    //  try{
    //       // console.log(selected_customer);
           
    //   } 
    //   catch (error) 
    //   {
    //       toastr.error(error.message,'Error');  
    //       toastr.info('Please select main customer');  
    //   }
  
      var cartArray = shoppingCart.listCart();
      var length_cartArray=cartArray.length;       
  
      var total_= cartArray[length_cartArray-1].obj.total_;
      var total_discount= cartArray[length_cartArray-1].obj.total_discount;
      var total_vat=cartArray[length_cartArray-1].obj.total_vat;
  
      inv_tot.t = total_-total_vat;
      inv_tot.td = total_discount;
      inv_tot.tv = total_vat;
      inv_tot.gt = +total_;
      inv_tot.dp_req = total_/10;
      
  
  
      for(var j=0;j<cartArray.length;j++)
      {
  
          var obj= cartArray[j].obj;
          obj['total_vat']=inv_tot.tv;
          obj['total_discount']=inv_tot.td;
          obj['grand_total']=inv_tot.gt;
          obj['total_excl']=inv_tot.t;
          obj['dp_req']=inv_tot.dp_req;
          save_to_cart_custom(obj);
      }
    
  
      // alert($('#number').val())
       if ($('#searchCust').val() == null)
       {          
          toastr.info('main customer/ ship to customer missing','Error', {timeOut: 5000});
          toastr.options.closeButton = true;              
          return 
       }
  
  
    //   var ship_to_customer_number=$('#number').val();  
              
  
    //   var ship_to_customer_address=$('#address').val();  
  
    //   var ship_to_customer_contact=$('#contact').val();  
  
  
    //   var bill_to_custmoer_number=$('#number_bill').val();
  
    //   var bill_to_custmoer_address=$('#address_bill').val();
  
    //   var bill_to_customer_contact=$('#contact_bill').val();  


     global_lov_order_type= shoppingCart.load_order_info('order_type_text');  
    //  var main_customner_name= document.getElementById('main_cust').value;
    //  var main_customer_number= document.getElementById('main_customer_number').value;
    //  var main_customer_id= document.getElementById('main_customer_id').value;
    
    //  if(main_customer_number==ship_to_customer_number || main_customer_number==bill_to_custmoer_number)
    //  {
  
    //  }
    //  else
    //  {
    //       toastr.warning('Bill to or Ship to must be a main customer','Error');
    //       return;
  
    //  }
  
    var customer_po= shoppingCart.load_order_info('customer_po'); 
  
      
     // alert(total_)
      invd.invs =[{
        //   'hdr':[selected_customer.hdr_data.columns,selected_customer.hdr_data.data[0]],
        //   'lines':[selected_customer.lines_data.columns,selected_customer.lines_data.data],
          'cart':[cartArray],
        //   'bill_to_custmoer_number':[bill_to_custmoer_number],
        //   'bill_to_custmoer_address':[bill_to_custmoer_address],
        //   'ship_to_customer_address':[ship_to_customer_address],
        //   'ship_to_customer_number':[ship_to_customer_number],
        //   'bill_to_customer_contact':[bill_to_customer_contact],
        //   'ship_to_customer_contact':[ship_to_customer_contact],
          'order_type_lov':[global_lov_order_type],
          'customer_po':[customer_po],
          'order_total':[total_],
          'total_vat':[total_vat],
          'order_discount':[total_discount],
          'so_number':'', 
        //   'main_customner_name':[main_customner_name],
        //   'main_customer_number':[main_customer_number],
        //   'main_customer_id':[main_customer_id]
      }];
      invd.inv[1] ='';   
      invd.$nextTick    
      invd.$nextTick(function()
      {
         $('.select2-input').select2({ dropdownAutoWidth : true, width: 'resolve' })
      })       
      //console.log('324')
    
      return 1;
  // } 
  // catch (error) 
  // {
  
  //     toastr.error(error.message+ 'line number : '+error.stack ,'Error 1111');    
  // }
  }
  
  $("body").on("click", ".btn-delete", function()
  {     
      $(this).parents("tr").remove();
      get_order_type_lov()
  });
  
  var selected_customer;
  $(document).on('select2:select','#searchCust',function(e){
      console.log(e)
     // $('#v-form-detail').hide();        
          
     // blockDIV('#viewCust');
     // console.log(e.params.data);
      var id = e.params.data.id;
      var customer_name=e.params.data.customer_name;
      var customer_number=e.params.data.customer_number;
      var main_customer_id= e.params.data.id;
      
      document.getElementById('main_cust').value=customer_name;
      document.getElementById('main_customer_number').value=customer_number;
      document.getElementById('main_customer_id').value=main_customer_id;      
      
      axios.get("get-customer-data?caid="+id+"&defs="+localStorage.getItem('defs'))
      .then(function(res)
      {
         // alert(12)
  
         //customer_infoo
         //get_tax_()
         document.getElementById('customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >'+res.data.hdr.mob_no+'</span></div>';
         $('#sel_cust').html(res.data.hdr.customer_name)
      //document.getElementById('selected_cust').innerHTML='<b> Customer Name :</b> '+res.data.hdr.customer_name+'<br>';
  
      //document.getElementById('selected_cust_account').innerHTML='<b> Customer Number :</b>'+ res.data.hdr.account_number+'<br>';
  
  
     // document.getElementById('selected_cust_email').innerHTML='<b> Customer Email :</b> '+res.data.hdr.email_id+'<br>';
  
     // document.getElementById('selected_cust_phone').innerHTML='<b> Customer Mobile :</b> '+res.data.hdr.mob_no;
  
      
      
  
      //console.log(res.data)
      selected_customer=res.data;           
  
    //   for (var k in formDetails.data)
    //   {
    //   if (formDetails.data[k] == null)
    //   {
    //          formDetails.data[k] = '-';
    //   }
    //   }
  
          //http://lp00735/cust/get-customer-data?caid=3579
      $("#available_customer_address_div").removeClass('d-none');    
      var out='';
      for(var i=0;i<res.data.lines_data.data.length;i++)
      {
             // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';
  
             // alert(res.data.lines_data.data[i][9])
  
      if(res.data.lines_data.data[i][9]=='SHIP_TO')
      {   
          var $select = $('#customer');
          $select.empty();                     
          $select.append("<option value="+res.data.lines_data.data[0][14]+">"+res.data.lines_data.data[0][12]+"</option>"); 
  
  
        //   var $select = $('#number');
        //   $select.empty();                     
        //   $select.append("<option value="+res.data.lines_data.data[0][11]+">"+res.data.lines_data.data[0][11]+"</option>"); 
  
  
                  // document.getElementById('number').value=res.data.lines_data.data[i][11];
  
  
                  //document.getElementById('customer').value=res.data.hdr_data.data[0][7];
                //   document.getElementById('location').value=res.data.lines_data.data[i][10];
  
                //   document.getElementById('address').value=res.data.lines_data.data[i][2];
                //   document.getElementById('address_2').value=res.data.lines_data.data[i][3];
                //   document.getElementById('address_3').value=res.data.lines_data.data[i][4];
  
                //   document.getElementById('area').value=res.data.lines_data.data[i][6];
                //   document.getElementById('country').value=res.data.lines_data.data[i][8];
                //   document.getElementById('contact').value=res.data.lines_data.data[i][13];
                 // alert(3333)
                 // alert(2)
                //   console.log(res.data.lines_data.data[i])

                
               // document.getElementById('ship_to_customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span>'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span>'+res.data.hdr.mob_no+'</span></div>';
  
                document.getElementById('ship_to_customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >'+res.data.hdr.mob_no+'</span></div>';
  

               
                
               }
  
               if(res.data.lines_data.data[i][9]=='BILL_TO')
              {
                  
                  //alert(1)
                 // console.log(res.data.lines_data.data[i])
                 // alert(res.data.lines_data.data[i][12])
  
                  var $select = $('#customer_bill');
                  $select.html('');                     
                  $select.append("<option value="+res.data.lines_data.data[i][14]+">"+res.data.lines_data.data[i][12]+"</option>"); 
  
  
                //    var $select_1 = $('#number_bill');
                //    $select_1.empty();                     
                //    $select_1.append("<option value="+res.data.lines_data.data[i][11]+">"+res.data.lines_data.data[i][11]+"</option>"); 
                  
  
                 // document.getElementById('customer_bill').value=res.data.hdr_data.data[0][7] || '';
                //   document.getElementById('location_bill').value=res.data.lines_data.data[i][10] || '';                   
                //   document.getElementById('address_bill').value=res.data.lines_data.data[i][2] || '';                                     
                  //document.getElementById('address_2_bill').value=res.data.lines_data.data[i][3] || '';                   
                  //document.getElementById('address_3_bill').value=res.data.lines_data.data[i][4] || '';                   
                //   document.getElementById('area_bill').value=res.data.lines_data.data[i][6] || '';
                 
                 /// document.getElementById('country_bill').value=res.data.lines_data.data[i][8] || '';
                //   document.getElementById('contact_bill').value=res.data.lines_data.data[i][13] || '';
                  
                document.getElementById('bill_to_customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >'+res.data.hdr.mob_no+'</span></div>';
  
  
               }
  
  
  
              
              // alert(123)
  
  
          }
  
         // document.getElementById('available_customer_address').innerHTML=out;
         // $('#available_customer_address').select2(); 
          //
         // alert(res.data.lines_data.data.length)
         // available_customer_address
         get_tax_()
         //get_selected_cust()
      })
      .catch(function(){
          //$('#viewCust').unblock();
         // $('#v-form-detail').hide();
  
      })
  })
  
  
  var ship_to_customer_list=[];
  $(document).on('select2:select','#customer',function(e){
     // $('#v-form-detail').hide();        
     // $("#btn_confirm_cust").removeClass('d-none');       
      //blockDIV('#viewCust');
      //console.log(e.params.data);
      var id = e.params.data.id;
      axios.get("get-customer-data?caid="+id)
      .then(function(res){
         // alert(12)
          //console.log(res.data)
         
          //$('#viewCust').unblock();
         // $('#v-form-detail').show(); 
          var out='';
          for(var i=0;i<res.data.lines_data.data.length;i++)
          {
              //alert(1)
             // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';
  
             
  
              if(res.data.lines_data.data[i][9]=='SHIP_TO')
              {   
                  //$('#number').select2('destroy');
                 // alert(res.data.lines_data.data[i][11])
  
                //   ship_to_customer_list[0]=res.data.lines_data.data[i][11];
                //   ship_to_customer_list[1]=res.data.lines_data.data[i][2];
  
                //   var $select = $('#number');
                //   $select.empty();                     
                //    $select.append("<option value="+res.data.lines_data.data[i][11]+" >"+res.data.lines_data.data[i][11]+"</option>"); 
                //    //intilizeeer();
                  //re intilize serach y number
  
                  // $('#number').val(res.data.lines_data.data[i][11]).trigger("change")
  
                  //document.getElementById('customer').value=res.data.hdr_data.data[0][7];
                //   document.getElementById('location').value=res.data.lines_data.data[i][10];
                  
                //    //document.getElementById('number').value=res.data.lines_data.data[i][11];
                //   document.getElementById('address').value=res.data.lines_data.data[i][2];
                //   document.getElementById('address_2').value=res.data.lines_data.data[i][3];
                //   document.getElementById('address_3').value=res.data.lines_data.data[i][4];
  
                //   document.getElementById('area').value=res.data.lines_data.data[i][6];
                //   document.getElementById('country').value=res.data.lines_data.data[i][8];
                //  // console.log(res.data.lines_data.data[i])
                //  // alert(1)
  
                //   document.getElementById('contact').value=res.data.lines_data.data[i][13];

                  document.getElementById('ship_to_customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span>'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span>'+res.data.hdr.mob_no+'</span></div>';
  

               }             
              // alert(123)
  
          }
          get_tax_()
      })
      .catch(function(){
          //$('#viewCust').unblock();
          //$('#v-form-detail').hide();
  
      })
  })
  
  var out='';
  global_lov_order_type=''



  function get_order_type_lov()
  {        
      
      $("#demo").collapse('show');   
    //    $("#stock_view").addClass('col-sm-8')
    //    $("#stock_view").removeClass('col-sm-12')
  
       var defs= localStorage.getItem('defs')       
        axios.get("/sales/get_order_type_lov_based_on_loc?loc_id="+defs)
        .then(function(res)
        {
           //alert(12)
          //   console.log(res.data.data)           
          //   out='<option> </option>';
          //   for(var i=0;i<res.data.data.length;i++)
          //   {
            
          //     out+='<option value="'+res.data.data[i].order_type_id+'">'+res.data.data[i].name+'('+res.data.data[i].description+')</option>';  
            
          //   }
          //  // alert(out);
          //   global_lov_order_type=out;
          //   document.getElementById('order_type_lov_item_page').innerHTML=out;
          $("#order_type_lov_item_page").select2({
            data:res.data,
          })


        //   $('#order_type_lov_item_page').select2({
        //         data:res.data,
        //         width: 'resolve' 
        //      })
              
        //     $('#order_type_lov_item_page').select2('destroy')
              
        //    var  order_type_val= shoppingCart.load_order_info('order_type_val');
        //   // alert(order_type_val)
        //    //alert(order_type_val)

        //     if(order_type_val==null || typeof order_type_val==undefined    ||  order_type_val=='' )
        //     {
        //      // alert('trigger')
        //         $('#order_type_lov_item_page').val(order_type_val).trigger('change');
  
        //     }
        //     else
        //     {
        //         //alert(1111)
        //        // alert(order_type_val)
        //        //alert('trigger')
        //         $('#order_type_lov_item_page').val(order_type_val).trigger('change');
  
        //     }

           // $('.card-body').unblock()
           // $('.select2-input').select2({   width: 'resolve' })
          
            
           refresh_reservation_details()
        })
        .catch(function(){
         // $('.card-body').unblock()
  
        })
  
  }
  function selected_line_type(a,order_header_type_id)
  {
                
                  var x = a.id;                
                  cartArray=shoppingCart.listCart();  
                  var j=x;
                  //JSON.stringify(cartArray)                
                  var inventory_id=cartArray[j].obj.inventory_item_id;
                  var item_code=cartArray[j].obj.item_code;
                  var uom=cartArray[j].obj.uom;
                  var color=cartArray[j].obj.color;
                  var all_data=localStorage.getItem('defs');
                  var year=cartArray[j].obj.model_year;                    
                  axios.get("get_def_line_type?inventory_id="+inventory_id+"&order_header_type_id="+order_header_type_id+"&line_type_id="+a.value+"&item_code="+item_code+"&uom="+uom+"&color="+color+"&year="+year+"&all_data="+all_data)
                  .then(function(res)
                 { 
                 
                    //alert(res.data.price)
                    //$('#'+j+'-list-price').html(res.data);
                   //table.cell( document.getElementById(j+'-list-price') ).data();
                  if(res.data.price==null)
                  {
                      res.data.price=0;

                  }
                   document.getElementById(j+'-list-price').innerHTML=Number(res.data.price).toFixed(2);
                   document.getElementById(j+'-price').innerHTML=Number(res.data.price).toFixed(2);
                   document.getElementById(j+'-price').onblur();
                  //var cell = table.cell( document.getElementById(j+'-list-price'));
                  // cell.data(res.data.price).draw();
  
  
                   var obj= cartArray[j].obj;                   
                   obj['line_price_list_id']=res.data.list_header_id;
                   obj['line_price_list_name']=res.data.list_header_name;
                   save_to_cart_custom(obj);
  
                    //alert('#'+j+'-list-price')
                    //console.log(res);
                    var status=save_item_and_price()
    
                    var status= get_selected_cust()
                    //$('.show-cart').unblock()
  
  
                  }).catch(function(){
                    //  $('.show-cart').unblock()
                      //console.log('exception _line price')
  
               }) 
  
  
  
  
  }


  function refresh_reservation_details()
  {
  
    ShowDIV()
    $('#btn_order').prop('disabled', false);
   var order_header_type_id=$('#order_type_lov_item_page').val();
   if(order_header_type_id==null)
   {
     $('#btn_order').prop('disabled', true);
     toastr.error('selected order type');

   }
   var cartArray = shoppingCart.listCart();    
  axios.get("get_line_type_base_on_order_header?o_typ_hdr_id="+order_header_type_id+"&defs="+ localStorage.getItem('defs')+"&cart="+JSON.stringify(shoppingCart.listCart()))
  .then(function(res)
  { 
    console.log("line 819")          
        HideDIV()
      for(var j=0;j<cartArray.length;j++)
      {         
        if(res.data.def_line_type_price[j].error!="")
        {
            toastr.error( res.data.def_line_type_price[j].error +' ' + cartArray[j].obj.item_code );
            $('#btn_order').prop('disabled', true);
            return;
        }
       


                var out='';
                for(var i=0;i<res.data.data.length;i++)
                {
                
                  console.log(res.data.def_line_type_price[j].unique_cart_name)
                  if(cartArray[j].obj.name==res.data.def_line_type_price[j].unique_cart_name && res.data.def_line_type_price[j].line_type_id==res.data.data[i].value)
                  {
                         out+="<option value="+res.data.data[i].value+" selected>"+res.data.data[i].display+"</option>";  
                  }
                  else
                  {
                     out+="<option value="+res.data.data[i].value+">"+res.data.data[i].display+"</option>";  
                  }

                }                 
                document.getElementById(j+'-line-type').innerHTML='<select style="height: 24px;" id='+j+' disabled onchange="selected_line_type(this,'+order_header_type_id+')">'+out+'</<select>';
                
                document.getElementById(j+'-list-price').innerHTML=Number(res.data.def_line_type_price[j].price).toFixed(2);
                document.getElementById(j+'-price').innerHTML=Number(res.data.def_line_type_price[j].price).toFixed(2);
                
                var obj= cartArray[j].obj;                   
                obj['line_price_list_id']=res.data.def_line_type_price[j].list_header_id;
                obj['line_price_list_name']=res.data.def_line_type_price[j].list_header_name;
                save_to_cart_custom(obj);
      }
      var status=save_item_and_price()
      //var status= get_selected_cust()
      for(var j=0;j<cartArray.length;j++)
      {  
            document.getElementById(j+'-price').onblur();
      }   
    get_tax_()
  
  })
  .catch(function()
  {        
     
  
  })
  }









  function order_header_change(thizz)
  {

    ShowDIV()
    $('#btn_order').prop('disabled', false);
     // blockDIV('.card-body');
      shoppingCart.save_order_info('order_type_val',thizz.value)
      //alert(thizz.value);
  
      var e = document.getElementById(thizz.id);
  
      var strUser = e.options[e.selectedIndex].text;
      //alert(strUser)
  
      shoppingCart.save_order_info('order_type_text',strUser);
  
  
      var order_header_type_id=thizz.value;        
        //alert(order_header_type_id)
      var cartArray = shoppingCart.listCart();  
  


      if(order_header_type_id==null)
     {
             $('#btn_order').prop('disabled', true);
             toastr.error('selected order type');
     }
  // for(var j=0;j<cartArray.length;j++)
  // {               
   
  //    // alert(cartArray[j].obj.inventory_item_id);       
  
  // }
  $('.btn_order').prop('disabled', false);
  axios.get("get_line_type_base_on_order_header?o_typ_hdr_id="+order_header_type_id+"&defs="+ localStorage.getItem('defs')+"&cart="+JSON.stringify(shoppingCart.listCart()))
  .then(function(res)
  {  
    console.log("line 919")         
      //console.log(res.data);
     HideDIV()
     // alert(out)
      //set line type value 
      for(var j=0;j<cartArray.length;j++)
      {         


        if(res.data.def_line_type_price[j].error!="")
        {
            toastr.error( res.data.def_line_type_price[j].error +' ' + cartArray[j].obj.item_code );
            $('#btn_order').prop('disabled', true);
            return;

        }
                  //var j=0;
                 // console.log(JSON.stringify(cartArray))
                 //  $('#'+j+'-line-type').html('<select style="height: 24px;" id='+j+' onclick="selected_line_type(this,'+order_header_type_id+')">'+out+'</<select>');
                  //table.cell( document.getElementById(j+'-list-price') ).data();
                 // var cell = table_cart.cell(document.getElementById(j+'-line-type'));
  
                //// alert('#12')
                var out='';
                for(var i=0;i<res.data.data.length;i++)
                {
                // alert(res.data.data[0].display);  
                  console.log(res.data.def_line_type_price[j].unique_cart_name)

                  if(cartArray[j].obj.name==res.data.def_line_type_price[j].unique_cart_name && res.data.def_line_type_price[j].line_type_id==res.data.data[i].value)
                  {
                    out+="<option value="+res.data.data[i].value+" selected>"+res.data.data[i].display+"</option>";  
                  }
                  else
                  {
                    out+="<option value="+res.data.data[i].value+">"+res.data.data[i].display+"</option>";  
                  }

                }
                 console.log('42000')
                 document.getElementById(j+'-line-type').innerHTML='<select style="height: 24px;" id='+j+' disabled onchange="selected_line_type(this,'+order_header_type_id+')">'+out+'</<select>';
                
                 document.getElementById(j+'-list-price').innerHTML=Number(res.data.def_line_type_price[j].price).toFixed(2);
                 document.getElementById(j+'-price').innerHTML=Number(res.data.def_line_type_price[j].price).toFixed(2);
                
                 console.log('42001')
                 //var cell = table.cell( document.getElementById(j+'-list-price'));
                  // cell.data(res.data.price).draw(); 
  
                   var obj= cartArray[j].obj;                   
                   obj['line_price_list_id']=res.data.def_line_type_price[j].list_header_id;
                   obj['line_price_list_name']=res.data.def_line_type_price[j].list_header_name;
                   save_to_cart_custom(obj);




                   //   cell.data('<select style="height: 24px;" id='+j+' onchange="selected_line_type(this,'+order_header_type_id+')">'+out+'<///<select>').draw();   
                 // $( "#"+j ).change();
                  // var inventory_id=cartArray[j].obj.inventory_item_id;
                  // var item_code=cartArray[j].obj.item_code;
                  // var uom=cartArray[j].obj.uom;
                  // var color=cartArray[j].obj.color;
                  // var year=cartArray[j].obj.model_year;                   
                  //axios.get("get_def_line_type?inventory_id="+inventory_id+"&order_header_type_id="+order_header_type_id+"&loc_code=94&org_code=50U&line_type_id="+res.data.data[0].value+"&item_code="+item_code+"&uom="+uom+"&color="+color+"&year="+year+"&all_data="+JSON.stringify(cartArray))
                //  .then(function(res)
               //   { 
  
               //       alert(res.data)
               //       $('#'+j+'-list-price').html(res.data);
               // //      alert('#'+j+'-list-price')
  
               //       console.log(res);
  
  
  
             //     }).catch(function(){
               //   })                
  
           //cartArray[j].obj.inventory_item_id               
           //order_header_type_id
           //379
           //organization_code this is menu 50U
          // document.getElementById(j+'-price').onblur();
      }
      var status=save_item_and_price()
      var status= get_selected_cust()
      for(var j=0;j<cartArray.length;j++)
      {  
            document.getElementById(j+'-price').onblur();
      }
      //$('.card-body').unblock()
     get_tax_()
  
  })
  .catch(function()
  {        
     // $('.card-body').unblock()   
  
  })
  }
  
  var  bill_to_customer_list=[];
  
  $(document).on('select2:select','#number_bill',function(e){       
     // $('#v-form-detail').hide();        
        
      //blockDIV('#viewCust');
      console.log(e.params.data);
      var id = e.params.data.id;
      axios.get("get-customer-data?caid="+id)
      .then(function(res){
         // alert(12)
          console.log(res.data)
       
         // $('#viewCust').unblock();
         // $('#v-form-detail').show(); 
          var out='';
          for(var i=0;i<res.data.lines_data.data.length;i++)
          {
             // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';
  
             
  
              if(res.data.lines_data.data[i][9]=='BILL_TO')
              {   
  
                  bill_to_customer_list[0]=res.data.lines_data.data[i][11];
                  bill_to_customer_list[1]=res.data.lines_data.data[i][2];
                  var $select = $('#customer_bill');
                  $select.html('');                     
                   $select.append("<option value="+res.data.lines_data.data[i][12]+">"+res.data.lines_data.data[i][12]+"</option>"); 
                  
                 //  var $select = $('#number_bill');
                 // $select.html('');                     
                 //  $select.append("<option value="+res.data.lines_data.data[i][11]+">"+res.data.lines_data.data[i][11]/+"</option>"); 
  
  
                   document.getElementById('location_bill').value=res.data.lines_data.data[i][10];
                  
                   //document.getElementById('number_bill').value=res.data.lines_data.data[i][11];
  
                  document.getElementById('address_bill').value=res.data.lines_data.data[i][2];
                  document.getElementById('address_2_bill').value=res.data.lines_data.data[i][3];
                  document.getElementById('address_3_bill').value=res.data.lines_data.data[i][4];
  
                  document.getElementById('area_bill').value=res.data.lines_data.data[i][6];
                  document.getElementById('country_bill').value=res.data.lines_data.data[i][8];
                 
               }             
              // alert(123)
  
          }
         
      })
      .catch(function(){
          $('#viewCust').unblock();
          //$('#v-form-detail').hide();
  
      })
  
  
    
  })
  
  $(document).on('select2:select','#number',function(e){       
     
      console.log(e.params.data);
      var id = e.params.data.id;
      axios.get("get-customer-data?caid="+id)
      .then(function(res){
         // alert(12)
          console.log(res.data)
                 
          var out='';
          for(var i=0;i<res.data.lines_data.data.length;i++)
          {
             
              if(res.data.lines_data.data[i][9]=='SHIP_TO')
              {   
  
                  ship_to_customer_list[0]=res.data.lines_data.data[i][11];
                  ship_to_customer_list[1]=res.data.lines_data.data[i][2];
  
                  var $select = $('#customer');
                  $select.html('');                     
                   $select.append("<option value="+res.data.lines_data.data[i][14]+">"+res.data.lines_data.data[i][12]+"</option>"); 
  
                   document.getElementById('location').value=res.data.lines_data.data[i][10];
                  
                   //document.getElementById('number_bill').value=res.data.lines_data.data[i][11];
  
                  document.getElementById('address').value=res.data.lines_data.data[i][2];
                  document.getElementById('address_2').value=res.data.lines_data.data[i][3];
                  document.getElementById('address_3').value=res.data.lines_data.data[i][4];
  
                  document.getElementById('area').value=res.data.lines_data.data[i][6];
                  console.log(res.data.lines_data.data[i])
                  alert(3)
                  document.getElementById('country').value=res.data.lines_data.data[i][8];
               }             
              // alert(123)
  
          }
      })
      .catch(function(){
         // $('#viewCust').unblock();
         // $('#v-form-detail').hide();
  
      })
  })
  
  
  $(document).on('select2:select','#customer_bill',function(e){
      //$('#v-form-detail').hide();        
           
      //blockDIV('#viewCust');
      console.log(e.params.data);
      var id = e.params.data.id;
      axios.get("get-customer-data?caid="+id)
      .then(function(res){
         // alert(12)
          console.log(res.data)
          
         // $('#viewCust').unblock();
         // $('#v-form-detail').show(); 
          var out='';
          for(var i=0;i<res.data.lines_data.data.length;i++)
          {
             // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';
  
             
  
              if(res.data.lines_data.data[i][9]=='BILL_TO')
              {  
                 // alert(res.data.lines_data.data[i][11])
  
                //  bill_to_customer_list[0]=res.data.lines_data.data[i][11];
                //   bill_to_customer_list[1]=res.data.lines_data.data[i][2];
                //   document.getElementById('location_bill').value=res.data.lines_data.data[i][10];
                  
                   //document.getElementById('number_bill').value=res.data.lines_data.data[i][11];
  
                //   document.getElementById('address_bill').value=res.data.lines_data.data[i][2];
                //   document.getElementById('address_2_bill').value=res.data.lines_data.data[i][3];
                //   document.getElementById('address_3_bill').value=res.data.lines_data.data[i][4];
  
                //   document.getElementById('area_bill').value=res.data.lines_data.data[i][6];
                //   document.getElementById('country_bill').value=res.data.lines_data.data[i][8];
  
                //   var $select = $('#number_bill');
                //   $select.empty();                     
                //    $select.append("<option value="+res.data.lines_data.data[i][11]+">"+res.data.lines_data.data[i][11]+"</option>"); 
             
                document.getElementById('bill_to_customer_infoo').innerHTML='<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >'+res.data.hdr.customer_name+'</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history('+ res.data.hdr.account_number +')" >'+ res.data.hdr.account_number +'</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >'+res.data.hdr.email_id+'</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >'+res.data.hdr.mob_no+'</span></div>';
  
                }             
              // alert(123)
  
          }
      })
      .catch(function()
      {
          //$('#viewCust').unblock();
         // $('#v-form-detail').hide();
  
      })
  
  })
  
  // function getCustAccDetails(id,no) 
  // {
  //     axios.get("get-customer-data?caid="+id+"&cano="+no)
  //     .then(function(res){
  //         $('#viewCust').unblock();
  //       //  $('#v-form-detail').show();
  //        // $('#v-form-detail').find('table').remove();
  //        // formDetails.data = res.data.hdr;
  //        // $('#v-form-detail').append(res.data.lines);
  
  //       //   for (var k in formDetails.data){
  //       //       if (formDetails.data[k] == null){
  //       //           formDetails.data[k] = '-';
  //       //       }
  //       //   } 
  
  
  //     })
  //     .catch(function(){
  //         $('#viewCust').unblock();
  //        // $('#v-form-detail').hide();
  
  //     })
  // }
  
  
  // var addressLOV;
  // function getLOVsForAddress(){
  //     //blockUIEntirePage();
  //     axios.get("cust-address-lovs")
  //     .then(function (res) {
  //         console.log(res.data);
  //         addressLOV = res.data;
  //         for (key in addressLOV){
  //             $('[name="'+key+'"]').select2({
  //                 data: addressLOV[key].data,
  //                 placeholder:addressLOV[key].placeholder
  //             });
  //         }
  
  //         //unblockUIEntirePage();
  
  
  //     })
  //     .catch(function () {
  //        // unblockUIEntirePage();
  
  //     });
  // }
  
  $(document).ready(function () {
     // getLOVsForAddress();
      get_lov_customer_table();
      $('select.select2').select2({}); 
     // $('#customer_bill').select2({}); 
     // $('#customer').select2({});     
      //$('#v-form-detail').hide();
     // get_order_type_lov();          
  });
  
  
  
  
  function  get_lov_customer_table(){
  
      axios.get("get_lov_onload").then(function(res)
      {            
         var data = res.data;           
         // console.log(data)
          var out=''; 
          //for (var i=0;i<data.length;i++)
         // {
              for (var j=0;j<data[0].length;j++)
              {
                  out+="<option value="+data[0][j]+">"+data[1][j]+"</option>";
              } 
              document.getElementById('serach_based_on_type').innerHTML=out;
              $('#serach_based_on_type').select2();
              $('#customer_type_list').select2(); 
              $('#serach_based_on_type').val(data[0][1]).trigger('change')
          //} 
  
      })
      .catch(function(){
         
  
      })
  
  }
  function getAddressDetails() {
      var formArray = [];
      var no = $('.address-area').length;
      for (i=0; i< no; i++){
          formArray.push(getFormData($($('.address-area')[i])));
      }
      console.log(formArray);
      return formArray;
  }
  var thiz;
  function extraAddress() 
  {
     // blockDIV('#address-box');
      $('select.select2').select2('destroy');
      var node = $('#address-field').clone();
  
      var id = parseInt(Math.random()*1000);
      node.addClass('node'+id);
      $('.node'+id).hide();
  
      // add remove btn
      var html = $(node).append('<div class="col-sm-1">\
                                          <button class="btn btn-sm btn-danger" type="button" onclick="removeAddressField(this)">\
                                              <i class="ti-close"> Remove</i>\
                                          </button>\
                                      </div>')
                          .prop('outerHTML');
      $('#address-field').parent().append(html);
      $('#address-field').parent().append('<hr class="table-info">');
  
      $('.node'+id).hide();
  
      setTimeout(() => {
          for (key in addressLOV){
              $('[name="'+key+'"]').select2({
                  data: addressLOV[key].data,
                  placeholder:addressLOV[key].placeholder
              }); 
          }
      $('#address-box').unblock();
      $('.node'+id).slideDown('slow');
      }, 150);
  
  }
  
  function removeAddressField(t) {
      if(confirm('Are you sure you want to remove ?')){
          console.log(t);
          $(t).closest('.address-area').next().remove(); // removes <hr>
          $(t).closest('.address-area').remove();
      }
  
  }
  function getFormData($form){
      var unindexed_array = $form.serializeArray();
      var indexed_array = {};
  
      $.map(unindexed_array, function(n, i){
          indexed_array[n['name']] = n['value'];
      });
  
      return indexed_array;
  }
  $('#searchCust').select2({
     




    
      ajax: {
          url: "search-customers?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type: document.getElementById('serach_based_on_type').value,
                  page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
            
          params.page = params.page || 1;
  
          return {
              results: data.items,
              pagination: {
              more: (params.page * 30) < data.total_count
              }
          };
          },
          cache: true
      },
      placeholder: 'Search for a customer',
      minimumInputLength: 3,
      templateResult: formatRepo,
      templateSelection: formatRepoSelection,
    //   dropdownAutoWidth : true






  });
  
  
  $('#customer').select2({
      ajax: {
          url: "search-customers?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type: document.getElementById('serach_based_on_type').value,
                  page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
             
          params.page = params.page || 1;
  
          return {
              results: data.items,
              pagination: {
              more: (params.page * 30) < data.total_count
              }
          };
          },
          cache: true
      },
      placeholder: 'ship to customer',
      minimumInputLength: 1,
      templateResult: formatRepo,
      templateSelection: formatRepoSelection
  
  });
  $('#number_bill').select2({
      ajax: {
          url: "search-customers?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type: 'CUSTOMER_NUMBER',
                  page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
          
          params.page = params.page || 1;
  
          return {
              results: data.items,
              pagination: {
              more: (params.page * 30) < data.total_count
              }
          };
          },
          cache: true
      },
      placeholder: 'Search for a customer',
      minimumInputLength: 1,
      //templateResult: formatRepo,
     // templateSelection:formatRepoSelection_number_bill
  });
  
  $('#number').select2({
      ajax: {
          url: "search-customers?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type: 'CUSTOMER_NUMBER',
                  page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
               
          params.page = params.page || 1;
  
          return {
              results: data.items,
              pagination: {
              more: (params.page * 30) < data.total_count
              }
          };
          },
          cache: false
      },
     
      placeholder: 'Search for a customer',
      minimumInputLength: 1,
     // templateResult:formatRepo,
     // templateSelection: formatRepoSelection_number_bill
  });
  
  
  
  $('#customer_bill').select2({

      ajax: {
          url: "search-customers?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type: 'CUSTOMER_NAME',
                  page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
              
          params.page = params.page || 1;
  
          return {
              results: data.items,
              pagination: {
              more: (params.page * 30) < data.total_count
              }
          };
          },
          cache: true
      },
      placeholder: 'Bill to  customer',
      minimumInputLength: 1,
      templateResult: formatRepo,
      templateSelection: formatRepoSelection
  });
  
  
  
  
  function formatRepoSelection_number_bill (repo) 
  {        
  
      return repo.id ;
  }
  



function update(a)
{

   
    $('.select2-results__options .select2-results__option').each(function()
    {
        // alert();
        console.log('12341234123412341234123412341234')
        var str=a
        if ($(this).html().toLowerCase().indexOf(str) > -1){
    
            var s= $(this).html().toLowerCase();
            var start = s.indexOf(str);
            var end = start + str.length;
            var html = $(this).html().slice(0,start)+'<span class="font-weight-bold">'+$(this).html().slice(start,end)+'</span>'+ $(this).html().slice(end);
            // alert(html)
            $(this).html(html)
        }
    })

}

  
  function formatRepo (repo) {
      if (repo.loading) {
          return 'Searching for customer...';
          // return repo.text;
      }
      
    //   var $container = $(
    //     '<table><tr> <th class="small" scope="row">Customer Name:</th>\
    //         <td>' + repo.text + '</td>\
    //     </tr>\
    //     <tr>\
    //         <th class="small" scope="row">Telephone No:</th>\
    //         <td>'+repo.telephone_no+'</td>\
    //     </tr>\
    //     <tr>\
    //         <th class="small" scope="row">Email:</th>\
    //         <td>'+repo.email+'</td>\
    //     </tr>\
    //     <tr>\
    //         <th class="small" scope="row">Mobile No:</th>\
    //         <td>'+repo.mobile_no+'</td>\
    //     </tr>\
    // </table>'              
    //   );

    
     //update()
     //$(
      var $container =
        '<table style="width: 100%;font-size:14px;"><tr> <th class="small" scope="row">Customer Name:</th>\
            <td>' + repo.customer_name + '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Telephone No:</th>\
            <td>'+repo.default_phone_no+'</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Email:</th>\
            <td>'+repo.additional_email_address+'</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Mobile No:</th>\
            <td>'+repo.default_mobile_no+'</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">TRN No:</th>\
            <td>'+repo.trn_number+'</td>\
        </tr>\
    </table>' 
                 
     // );
      
      
    //   $('.select2-search__field').change(function(e) 
    //   {    
    //           alert(2)
    //           update(e.value);
             
           
      
    //   })
      

      //var markup=[];
      //window.Select2.util.markMatch(repo.customer_name, query.term, markup, escapeMarkup);
      
         // return '<span class="post-tag">'+markup.join("")+'</span><span class="item-multiplier">×&nbsp;'+result.customer_name+'</span>';
      

//       '<div class="border-bottom border-info">\
//       <div class="d-flex justify-content-between pl-2 pr-2">\
//           <h6 class="m-b-2">\
//               <label >Customer Name:</label> '+repo.text+'\
//           </h6>\
//       </div>\
//       <div class="d-flex justify-content-between pl-2 pr-2">\
//           <h6 class="m-b-0 p-0">\
//               <span class=" p-0">Telephone No:</span>\
//               <span class="font-light p-0">'+repo.telephone_no+'</span>\
//           </h6>\
//           <br><h6 class="m-b-0 p-0">\
//               <span class=" p-0">Email:</span>\
//               <span class="font-light p-0">'+repo.email+'</span>\
//           </h6>\
//       </div>\
//       <div class="d-flex justify-content-between pl-2 pr-2">\
//           <h6 class="m-b-0 p-0">\
//               <span class=" p-0">Mobile No: </span>\
//               <span class="font-light p-0">'+repo.mobile_no+'</span>\
//           </h6>\
//       </div>\
//   </div>'



      // $container.find(".select2-result-repository__title").text(repo.text);
      // $container.find(".select2-result-repository__forks").append(repo.email + " Forks");
      // $container.find(".select2-result-repository__stargazers").append(repo.mobile_no + " Stars");
      // $container.find(".select2-result-repository__watchers").append(repo.telephone_no + " Watchers");
      
        var str=document.querySelector("body > span > span > span.select2-search.select2-search--dropdown > input").value
    //  // alert(str)
    // //   alert($container)
        str=(str.toUpperCase()).trim()
        str_arr=str.split(' ');
        for (var i=0;i<str_arr.length;i++)
        {
            str=str_arr[i]
            if(str!='')
            {
                $container= $container.replaceAll(str,"<span class='font-weight-bold' style='color: yellow;'>"+str+"</span>");
            }

        }
    //   content=$container;
     // alert(content)
     // $container.replace(str,"<span class='font-weight-bold'>"+str+"</span>");

    //   if ($container.toLowerCase().indexOf(str) > -1)
    //   {
  
    //       var s= $container.toLowerCase();
    //       var start = s.indexOf(str);
    //       var end = start + str.length;
    //       var html = $container.slice(0,start)+'<span class="font-weight-bold">'+$container.slice(start,end)+'</span>'+ $container.slice(end);
    //       // alert(html)
    //      $container.html(html)
    //   }



      //$container = markMatch($container, document.querySelector("body > span > span > span.select2-search.select2-search--dropdown > input").value);
      return $($container);
  }
  
  function markMatch (text, term) {

    // Find where the match is
    var match = text.toUpperCase().indexOf(term.toUpperCase());
  
    var $result = $('<span></span>');
  
    // If there is no match, move on
    if (match < 0) 
    {
      return $result.text(text);
    }
  
    // Put in whatever text is before the match
    $result.text(text.substring(0, match));
  
    // Mark the match
    var $match = $('<span class="select2-rendered__match"></span>');
    $match.text(text.substring(match, match + term.length));
  
    // Append the matching text
    $result.append($match);
  
    // Put in whatever is after the match
    $result.append(text.substring(match + term.length));
  
    return $result;
  }


  function formate_number(a)
  {
         var num= Number(a).toFixed(2)
         var str =parseFloat(num).toLocaleString();  
         return str;
  }
  function formate_ref_number(a)
  {
      var num = a.replace(/\D/g,'');
      return  num; 
  }
  
  
  function formatRepoSelection (repo) 
  {
    return  repo.text || repo.customer_name;
    return repo.text || repo.email;
      return repo.text || repo.email;
  }
  
  
  function displayCart() 
  {
      
      var cartArray = shoppingCart.listCart();
      //stepsCompnent.tab1.count = shoppingCart.totalCount();
    
      if (cartArray.length == 0)
      {
        $('.show-cart').html('');
        $('.cart-tot').remove();
        $('.show-cart').html('<h4 class="cart-zero">Cart is empty.</h4>');
        $('.total-count').html(shoppingCart.totalCount());
        inv_tot.t = 0;
        inv_tot.td =0;
        inv_tot.tv =0;
        inv_tot.gt = 0;
          
        return;
      }
      $('.show-cart').html('');
      // $('.show-cart').append('<thead>\
      //                           <tr>\
      //                               <td>Line Type</td>\
      //                               <td>Location</td>\
      //                               <td>Aval Qty</td>\
      //                               <td>Item Code</td>\
      //                               <td>UOM</td>\
      //                               <td>Serial Number</td>\
      //                               <td>Color</td>\
      //                               <td>Model Year</td>\
      //                               <td>Requested Qty</td>\
      //                               <td>List Price</td>\
      //                               <td>Price</td>\
      //                               <td>Discount / Surcharge</td>\
      //                               <td>VAT</td>\
      //                               <td>Line Total</td>\
      //                               <td></td>\
      //                           </tr>\
      //                       </thead><tbody>');
      // $('.show-cart').append('<thead>\
      //                           <tr>\
      //                               <td>Line Type</td>\
      //                               <td>Location</td>\
      //                               <td>Aval Qty</td>\
      //                               <td>Item Code</td>\
      //                               <td>UOM</td>\
      //                               <td>Serial Number</td>\
      //                               <td>Color</td>\
      //                               <td>Model Year</td>\
      //                               <td>Requested Qty</td>\
      //                               <td>List Price</td>\
      //                               <td>Price</td>\
      //                               <td>Discount / Surcharge</td>\
      //                               <td>VAT</td>\
      //                               <td>Line Total</td>\
      //                               <td></td>\
      //                           </tr>\
      //                       </thead><tbody>');

                            

      $('.show-cart').append('<thead>\
                                    <td>Location</td>\
                                    <td>Item Code</td>\
                                    <td>Serial Number</td>\
                                    <td>Color</td>\
                                    <td>Model Year</td>\
                                    <td>Requested Qty</td>\
                                    <td>List Price</td>\
                                    <td>Price</td>\
                                    <td>Discount / Surcharge</td>\
                                    <td>VAT</td>\
                                    <td>Line Total</td>\
                                    <td style="display:none">Line Type</td>\
                                    <td></td>\
                                </tr>\
                            </thead><tbody>');  
                            

                                    
                                  
                                    // <td>Aval Qty</td>\
                                    // <td>Item Code</td>\
                                    // <td>UOM</td>\                                               
      var output = "";
      //<button class='minus-item btn-sm input-group-addon btn btn-primary' data-onhand-qty="+cartArray[i].obj.onhand_qty+" data-name=" + cartArray[i].obj.name  + ">-</button>\
                //      <button class='plus-item btn btn-sm btn-primary input-group-addon'  data-onhand-qty="+cartArray[i].obj.onhand_qty+" data-name=" + cartArray[i].obj.name  + ">+</button>\
    
                //<button class='delete-item btn btn-sm btn-danger' data-name=" + cartArray[i].obj.name  + ">X</button>       
      var last_line;
      $('#selected_item').html(' ');
      for(var i in cartArray) {
        output += "<tr>\
                          <td>" + cartArray[i].obj.from_org_name + "</td>\
                          <td>" + cartArray[i].obj.item_code + "</td>\
                          <td>" + cartArray[i].obj.serial_number + "</td>\
                          <td>" + cartArray[i].obj.color + "</td>\
                          <td>" + cartArray[i].obj.model_year + "</td>\
                          <td>\
                          <div class='input-group'>\
                              <input type='number'  id='"+i+"-quantity' style='text-align: right;'   class='item-count btn-sm form-control form-control-sm' data-onhand-qty="+cartArray[i].obj.onhand_qty+"  data-name='" + cartArray[i].obj.name  + "' value='" + cartArray[i].count + "' readonly>\
                          </div>\
                          </td>\
                          <td id='"+i+"-list-price' style='    text-align: right;' readonly>0</td>\
                          <td   id='"+i+"-price' class='entered_price' data-from-org-name='"+cartArray[i].obj.from_org_name+"'    data-serial-number="+cartArray[i].obj.serial_number+" data-inventry-id="+cartArray[i].obj.inventory_item_id+"      onblur='price_enter_change(this,"+i+")'    contenteditable='false'  style='    text-align: right;' >"+Number(cartArray[i].obj.price).toFixed(2)+"</td>\
                          <td  id='"+i+"-discount' style='    text-align: right;'>"+Number(cartArray[i].obj.discount).toFixed(2)+" </td>\
                          <td id='"+i+"-line-vat' style='    text-align: right;'>"+Number(cartArray[i].obj.line_vat).toFixed(2)+"</td>\
                          <td id='"+i+"-line-total' style='    text-align: right;'>"+Number(cartArray[i].obj.line_total).toFixed(2)+"</td>\
                          <td style='display:none'  id='"+i+"-line-type'></td>\
                          <td><button class='delete-item btn btn-sm btn-danger' data-name="+cartArray[i].obj.name + ">X</button></td>\
                          </tr>";
                        // <td>" + cartArray[i].total + "</td>\
          last_line="<tr>\
                        <td ></td>\
                        <td></td>\
                        \
                        <td></td>\
                        <td></td>\
                        <td></td>\
                        <td  id='total_line_req_qty' style='text-align: right;'> </td>\
                        <td id='total_line_list_price' style='text-align: right;'></td>\
                        <td  id='total_line_entered_price' style='text-align: right;'></td>\
                        <td id='total_line_discount' style='text-align: right;'></td>\
                        <td id='total_line_vat' style='text-align: right;'></td>\
                        <td id='total_line_total' style='text-align: right;'></td>\
                        <td style='display:none'></td>\
                        <td></td>\
                        </tr>";
  

                   $('#selected_item').append(+i + +1 +' : ' +cartArray[i].obj.item_code+'<br>')         
        }
      $('.show-cart').prepend(output+last_line+'</tbody>');
      $('.cart-zero').remove();
      $('.cart-tot').remove();
    
    //   $('.show-cart').after('<div class="cart-tot" class="pull-right">Total price: AED <span class="total-cart">'+shoppingCart.totalCart()+'</span></div>');
    // //   $('.total-cart').html(shoppingCart.totalCart());
      $('.total-count').html(shoppingCart.totalCount());
  
  }
  
  
  function u(a)
  {
  
  if (typeof a === 'undefined') 
  {
      return '';
  }
  return a;
  
  
  }
  var total_discount=0;
  var total_vat=0;
  var total_=0;
  var table;
  var table_cart;
  $(document).ready(function()
  {   
  
  displayCart();
  var cartArray = shoppingCart.listCart();
  if(cartArray.length > 0)
  {
     // alert('datatable')
     // table_cart =  $('#show-cart').DataTable({
    //  columnDefs: [  
     // { "visible": false, "targets": 1 },
     //   {width: 200, targets: 1 },
     //   {"orderable": false, "targets": 0 }],
    //    paging: false,
    //    "searching": false
  
   //  });
  
  }
  
  })
  
  var myArray1=[]; 
  function save_item_and_price()
  {
    //return 1; 
      // try
      // {
          
    
      //toaster_create()  
      // var data = table.rows().data();
  
      
  
  
      // console.log(data); 
      var cartArray = shoppingCart.listCart();  
      var e = document.getElementById('order_type_lov_item_page');
  
      var txt_header = e.options[e.selectedIndex].text;
  
      var txt_val = e.options[e.selectedIndex].value;
  
      // alert(strUser)
      shoppingCart.save_order_info('order_type_val',txt_val)
      shoppingCart.save_order_info('order_type_text',txt_header);
  
      var ecustomer_po = document.getElementById('customer_po').innerHTML;
     
      var order_remarks = document.getElementById('order_remarks').value;    
  
      shoppingCart.save_order_info('customer_po',ecustomer_po);  
  
      shoppingCart.save_order_info('order_remarks',order_remarks);
      
      total_=0;
      total_discount=0;
      total_vat=0;
      total_req_qty=0;
      total_list_price=0;
        
     
      var myTab = document.getElementById('show-cart');
    //  alert( myTab.rows.length)
          for (i = 1; i < myTab.rows.length-1; i++) 
          {
              myArray1[i-1] = new Array(5);
  
              var objCells = myTab.rows.item(i).cells;
              for (var j = 0; j < objCells.length; j++)
              {               
                 // if(j==0)
                  if(j==11)
                  {
                      var asdf = myTab.rows[i].cells[j].childNodes[0].id;
                      itemname = $("#" + asdf + " option:selected").text();
                      //alert(itemname)
                      myArray1[i-1][j] =itemname; 
                  }
                  if(j==2)
                  {
                      var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;                  
                      myArray1[i-1][j] =valll; 
                  }
                  if(j==5)
                  {  
                     // sum += isNaN(cls[i].innerHTML) ? 0 : parseInt(cls[i].innerHTML);  
                     var asdf =  myTab.rows[i].cells[j].childNodes[1].childNodes[1].value;
                     total_req_qty=+total_req_qty+  +asdf 
                  }              
                  if(j==6)
                  {
                      var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue; 
                     // alert(valll)                 
                      myArray1[i-1][j] =valll;
                      total_list_price=+Number(total_list_price)+ +Number(valll);                  
                  }
                
  
  
              }
             // info.innerHTML = info.innerHTML + '<br />';     // ADD A BREAK (TAG).
          }
 
        
      for(var j=0;j<cartArray.length;j++)
      {
  
          for(var i=0;i<myArray1.length;i++)
          {             
              if(myArray1[i][2]==cartArray[j].obj.serial_number)
              {
                console.log('#1212')
                 var obj= cartArray[j].obj;
                  //alert(data[i][8])
                 obj['list_price']=myArray1[i][6];
                 //alert(obj['list_price'])
                 if(obj['list_price']=="0" || obj['list_price']=='' || obj['list_price']==undefined)
                 {
                      toaster_create('List price not loaded  at line '+i+ ' please reload the page');
                      return ;  
                 }
                // alert(data[i][8]);
                 obj['req_quantity']=$('#'+i+'-quantity').val()//data[i][6];
                 obj['price']=$('#'+i+'-price').html()//data[i][8];
  
                 if(obj['price']=="0" || obj['price']=='' || obj['price']==undefined  || obj['price']==null  || obj['price']=='0.00')
                 {
                      toaster_create('Please Enter Price at line '+i);

                      return  ;
                 }
                 obj['discount']= $('#'+i+'-discount').html()//data[i][9];
                 obj['line_total']=$('#'+i+'-line-total').html()//data[i][10]; 
                 obj['line_vat']=$('#'+i+'-line-vat').html()//data[i][10];                    
                 obj['selected_line_type']=$('#'+i).val()//data[i][10];                          
                 if(obj['selected_line_type']==null || obj['selected_line_type']=='' || obj['selected_line_type']==undefined)
                 {
                      toaster_create('Please Select Line Type at line  '+i);
                      //return ;
                 }
                 obj['selected_line_type_text']=$('#'+i).text()//data[i][10];  
  
  
                 total_discount=+total_discount  +  +obj['discount'];
                 
  
                 total_vat=+total_vat  +  +obj['line_vat'];
  
                 //alert(total_vat)
                 obj['total_vat']=total_vat;
  
                 obj['total_discount']=total_discount;                   
                 total_=+total_+ +obj['line_total'];
                 obj['total_']=total_;  
                
                // console.log(23456789)  
                 console.log( obj);
                 //console.log(23456789)  
                 save_to_cart_custom(obj);
              }   
              //alert(4)
          }
  
      }
          $('#total_line_req_qty').html(total_req_qty);
          $('#total_line_list_price').html(Number(total_list_price).toFixed(2));
          $('#total_line_entered_price').html(Number(total_list_price).toFixed(2))
           // <td id='total_line_discount'></td>\
          $('#total_line_vat').html(Number(total_vat).toFixed(2))
          $('#total_line_total').html(Number(total_).toFixed(2));
  
      //get_selected_cust()
      if(cartArray.length==0)
      {
  
          return 0;
      }
      return 1; 
  // } 
  // catch (error) 
  // {
  //     toastr.error(error.message + 'line number : '+error.stack ,'Error');    
  // }

  }
  
  
  function reload_data_based_on_tax()
  {
      var myTab = document.getElementById('show-cart');     
      for (i = 1; i < myTab.rows.length-1; i++) 
          {           
           var objCells = myTab.rows.item(i).cells;
          // alert(objCells.length);
           for (var j = 0; j < objCells.length; j++)
              {              
                   if(j == 7)
                  {
                      var acprice=myTab.rows[i].cells[j].innerText;
  
                      var total_line_vat= vat_calculate(acprice)-acprice    //  (((acprice/100)*(vat+100))-acprice).toFixed(2);
  
                      document.getElementById(i-1+'-line-vat').innerHTML=Number(total_line_vat).toFixed(2);
  
                      document.getElementById(i-1+'-line-total').innerHTML=Number(+acprice + +total_line_vat).toFixed(2);
  
  
                   }
              }
          }
          save_item_and_price()
  }

  function vat_calculate(a)
{

    return (a*1.05).toFixed(2);  

}

  function submit_order(thizz)
  {
  
      var status=save_item_and_price()      
      if(status==1)
      {        
           var status= get_selected_cust()  
           //alert(status)     
          if(status==1)
          {   
  
                    swal({
                    title: 'Press OK to create temporary reservation',
                    text: "",
                    type: 'success',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'OK'
                    }, function()
                    {

                         finalize_inv(thizz)
                            // swal(
                            //  'Done!',
                            //  'Reservation successfuly created.',
                            // );

                    })
          
              //finalize_inv(thizz)         
  
          }
          else
          {
              toastr.error('customer bill to and ship is not propery entered','error');
          }    
      }
      else
      {
          toastr.error('line data is not properly entered','error')
  
      }
  
  }
  
  function moveCursorToEnd(el) 
  {
  if (typeof el.selectionStart == "number")
  {
      el.selectionStart = el.selectionEnd = el.value.length;
  } else if (typeof el.createTextRange != "undefined") 
  {
      el.focus();
      var range = el.createTextRange();
      range.collapse(false);
      range.select();
  }
  }
  function formatAmount( number ) 
  {
      number = number.replace( /[^0-9]/g, '' );
      number = new Number(number);
      return  number;
  }
  var vat = 5;
  function price_enter_change(a,b)
  {
  
      thizzzzzzzz=a; 
      $(a).closest('tr').css("background-color", "#fff");
      var enterred_price=Number($('#'+a.id).html()).toFixed(2);
      //alert(enterred_price)
      var x, text;
  
    if (isNaN(enterred_price) || enterred_price < 1) 
      {
          toastr.info('enterred_price price is not valid : ',' ');
          $('#btn_order').prop('disabled', true);

          return ;
      } 
      $('#btn_order').prop('disabled', false);
      var item_serial_number=document.getElementById(a.id).getAttribute("data-serial-number");

      var stock_org_name=document.getElementById(a.id).getAttribute("data-from-org-name");

      var item_inventry_id=document.getElementById(a.id).getAttribute("data-inventry-id");
      var defs= localStorage.getItem('defs');    
  
      document.getElementById(a.id).innerHTML=Number(enterred_price).toFixed(2);
  
      var list_price=Number($('#'+b+'-list-price').html()).toFixed(2);  
  
      if(enterred_price < list_price)
      {
          
       toastr.info('Below list price for serial number : '+item_serial_number+' , Need Approval to Process order');
       show_errorss('Below list price for item  : '+ +b + 1 +' , Need Approval to Process order')
       $(a).closest('tr').css("background-color", "rgb(255, 214, 204)");
       ShowDIV()          
      axios.get("get_cost_price?defs="+defs+"&item_inventry_id="+item_inventry_id+"&serial_number="+item_serial_number+'&stock_org_name='+stock_org_name)
      .then(function(res)
      {
          HideDIV()
          console.log(res.data[0].cost)
          //alert(res.data[0].cost)
          //toastr.error('Entered price is less then the list price','Error');
          if(enterred_price<res.data[0].cost)
          {

        
              toastr.error('selling price of the item in line number','Error');
              show_errorss('selling price of the item in line number')

              //var eee='selling price of the item in line number'+   (parseInt(i) + 1+' is below cost ');



              $('#'+a.id).html(Number(list_price).toFixed(2));
             
              document.getElementById(b+'-discount').innerHTML=0      
              
  
              var status=save_item_and_price()  
              //var status= get_selected_cust()
              return;
  
          }   
          else
          {
  
  
              
          }
          
         // alert(res.data.data)
          //unblockUIEntirePage();      
         
      })
      .catch(function()
      {
        HideDIV()
          //unblockUIEntirePage();    
      })
  
     
      }
      else
      {
          var enterd_quantiy=$('#'+b+'-quantity').val();
  
          document.getElementById(b+'-discount').innerHTML= parseFloat(enterred_price).toFixed(2)-parseFloat(list_price).toFixed(2)
  
  
  
  
 // var total_line_vat=(((enterred_price/100)*(vat+100))-enterred_price).toFixed(2);

  var total_line_vat= vat_calculate(enterred_price)-enterred_price;
  
  if(isNaN(total_line_vat))
  {
      $('#'+b+'-line-vat').html(0);
  }
  else
  {
       document.getElementById(b+'-line-vat').innerHTML=Number(total_line_vat).toFixed(2);
  
  }
    document.getElementById(b+'-line-total').innerHTML= Number(+(parseFloat(enterred_price).toFixed(2)*parseFloat(enterd_quantiy).toFixed(2))+ +(total_line_vat)).toFixed(2);
    var status=save_item_and_price()  
    //var status= get_selected_cust()
  
  }
  
     
  
  }
  var resssssssss;
  function get_tax_()
  {
  
      get_selected_cust()
      var defs= localStorage.getItem('defs');    
      // try 
      // {
     var e = document.getElementById('order_type_lov_item_page');
     var txt_header = e.options[e.selectedIndex].text;
     var txt_val = e.options[e.selectedIndex].value; 
      // }
      // catch(err) 
      // {
      //      toastr.info('Please select order type');
      //      return ;
      // }
      // try 
      // {
    
  
    //   var bill_to= invd.invs[0].bill_to_custmoer_address
    //   var bill_to_cust_number=invd.invs[0].bill_to_custmoer_number[0];
      
     var ship_cust_id=  $('#customer').val()
     if(ship_cust_id=='' || ship_cust_id==null)
     {
        toaster_create('ship to customer is not selected')
        return;


     }
      // }
      // catch(err) 
      // {
      //     toastr.info('Please select  bill to customer');
      //     return ;
      // }
  
      axios.get("get_tax_percentage?defs="+defs+"&ship_cust_id="+ship_cust_id+"&txt_header="+txt_header)
      .then(function(res)
      {
          resssssssss=res;
          console.log(res.data.v_vat_percent)
          console.log(res.data.v_vat_apply)
  
          if((res.data.v_vat_apply).toUpperCase()=='Y')
          {             
                 vat =res.data.v_vat_percent;
                 inv_tot.vat_p=res.data.v_vat_percent;
                 reload_data_based_on_tax();
  
  
  
          }               
         
      })
      .catch(function()
      {
          
      })
  
  
  
  }
  
  (function($) 
  {
  "use strict";
  $(document).ready(function () 
  {        
      $(document).on('click','#datagrid .add',function () 
      {	
         // alert(2)
             var row=$(this).closest('tr');
             var clone = row.clone();
             var tr= clone.closest('tr');
             tr.find('input[type=text]').val('');
             $(this).closest('tr').after(clone);
             var $span=$("#datagrid tr");
             $span.attr('id',function (index) 
             {
                   return 'row' + index;		   
             });			
      });		
     


     

  });   
  
  })(jQuery);
  
  var dropDown = ".dropdn";
  var empName = ".name";
  $(document).on("change",(dropDown),function(e)
  { 
    var value = $.trim($(this).val());		
    $(this).closest('tr').find(empName).val(value);		
  }); 
  
  $(document).on('click','#datagrid .removeRow',function () 
  {  
    if ($('#datagrid .removeRow').length > 1) 
    {
        $(this).closest('tr').remove();
    }			
  });	
  
  $("#btn").click(function()
  {
    cloneIndex=((Math.random()*((10000-1584)+1027))+10).toFixed(0)
    var $lastRow = $("#datagrid tr:not('.ui-widget-header'):last"); //grab row before the last row
    
    var $newRow = $lastRow.clone().attr("id","clonedtr"+cloneIndex); //clone it
    $newRow.find(":text").val(""); //clear out textbox values    
    $lastRow.after($newRow); //add in the new row at the end
  });
  
  
  var get_draft_reciept_data;
 
  function formatCalculation(d)
{
	return parseFloat(d).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits: 2});
}
function undo_formatCalculation(d)
{

    var str =d;
    var a=str.split('.');
    str=a[0];
    var num = str.replace(/\D/g,'');
    console.log('string without commas', num);
	return num+'.'+a[1];
}

  function draft_line_type_change(a)
  {
  
  alert(a)
  alert(1)
  }
  function draft_receipt_no_change(a)
  {
  //alert(a)
  //alert(2)
  // var e = document.getElementById(a.id);
  var parent_tr=a.closest('tr').id;
  alert(parent_tr)      
  //var strUser = a.options[e.selectedIndex].value;
  strUser=a.options[a.selectedIndex].value;
  alert(a.options[a.selectedIndex].value);
  //alert(strUser)
  for (var i=0;i<get_draft_reciept_data.data.length;i++)
  {
      if(strUser==get_draft_reciept_data.data[i].receipt_number)
      {
         alert('found')
         //alert(i)           
         // document.getElementById('receipt_no').innerHTML=out_rec;                
         $("#"+parent_tr+"  >  #orignal_amt").html(get_draft_reciept_data.data[i].orig_receipt_amt)
         $("#"+parent_tr+"  >  #unapp_amt").html(get_draft_reciept_data.data[i].unapp_amt)
         $("#"+parent_tr+"  >  #doc_date").html(get_draft_reciept_data.data[i].deposit_date)
         $("#"+parent_tr+"  >  #avbl_balance").html(get_draft_reciept_data.data[i].orig_receipt_amt)  
  
      }
  
  }

  
  }
  
  

var arraySystme_recipt=[];
var arrayUser_recipt=[];

function calculate_enable_sum()
{           
    alert(1)
            arraySystme_recipt=[];
            var sum=0;
            var cash_collection = document.getElementById('datagrid');  
            for (i = 1; i < cash_collection.rows.length; i++) 
            {
              
                arraySystme_recipt[i-1] = new Array(5);
                var objCells = cash_collection.rows.item(i).cells;
                for (var j = 0; j < objCells.length; j++)
                {   
                    //if(cash_collection.rows[i].cells[0].childNodes[0].checked == true)
                    //{     
                         
                            if(j==1)
                            {
                                //amt  assigned
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value; 
                                arraySystme_recipt[i-1][13] =cash_collection.rows[i].cells[j].childNodes[1].value;
                                sum=+sum+ +cash_collection.rows[i].cells[j].childNodes[0].value; 
                            }
                            if(j==2)
                            {
                                     //vat amt  
                                    arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value;
                                    var total= cash_collection.rows[i].cells[1].childNodes[0].value;                               
                                    var vat=5;
                                    var total_line_vat=((total / (100 + vat)) * vat).toFixed(2)
                                    //alert(total_line_vat)
                                    cash_collection.rows[i].cells[j].childNodes[0].value=total_line_vat;
                                    arraySystme_recipt[i-1][14] =total_line_vat; 
                            }
                            if(j==3)
                            {
                                //orignal amt
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].innerHTML; 
                           
                            }
                            if(j==4)
                            {
                                //unapp  amt
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].innerHTML; 
                            }
                            if(j==5)
                            {
                                //cust ref
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value; 
                            }
                            if(j==6)
                            {
                                //type
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].innerHTML; 
                            }

                            if(j==7)
                            {
                                //receipt number
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].innerHTML; 
                            }
                            if(j==10)
                            {
                                //cash receipt id 
                                arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].innerHTML; 
                            }

                    //}
                // if(cash_collection.rows[i].cells[0].childNodes[0].checked == false && j==0)
                // // //   else 
                //  {

                //         j=1;
                //         cash_collection.rows[i].cells[j].childNodes[0].value=0;
                //         cash_collection.rows[i].cells[j].childNodes[1].value=0;
                //         arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value; 
                //         arraySystme_recipt[i-1][13] =cash_collection.rows[i].cells[j].childNodes[1].value;
                //         sum=+sum+ +cash_collection.rows[i].cells[j].childNodes[0].value; 


                //         j=2;
                //         arraySystme_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value;
                //         var total= cash_collection.rows[i].cells[1].childNodes[0].value;                               
                //         var vat=5;
                //         var total_line_vat=((total / (100 + vat)) * vat).toFixed(2)
                //         //alert(total_line_vat)
                //         cash_collection.rows[i].cells[j].childNodes[0].value=total_line_vat;
                //         arraySystme_recipt[i-1][14] =total_line_vat; 


                        
                //    }
                
                }
            }



}

 
  function addZero(i)
  {
       if (i < 10) 
       {
           i = "0" + i;
       }
       return i;
  } 
  
      
  function toaster_create(msg=" ")
  {   
  


    // Toast.fire({
    //     type: 'success',
    //     title: msg
    //   })

  var d = new Date();
  var x = document.getElementById("demo");
  var h = addZero(d.getHours());
  var m = addZero(d.getMinutes());
  var s = addZero(d.getSeconds());
  var time_now = h + ":" + m + ":" + s;
  var out=' <div class="alert alert-info fade show alert-dismissible" role="alert"> <strong><i class="fa fa-check-circle" aria-hidden="true"></i></strong>'+msg+' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span> </button></div>';
  if(msg==" ")
  {
   //document.getElementById('notify_error').innerHTML='';
  }
  else
  {
  //document.getElementById('notify_error').innerHTML=out;
  
  }
  
  toastr.options.closeButton = true;
  toastr.success(msg, {timeOut: 10000})
  
  
  }

 
  

  function finalize_inv(thizz)
  {
  
    reload_data_based_on_tax()
     get_tax_();
  thizz.disabled = true;
 // blockUIEntirePage();
  // alert(1)
//   var all_data=localStorage.getItem('defs'); 

  var order_type_txt= shoppingCart.load_order_info('order_type_text');    
  var order_type_id= shoppingCart.load_order_info('order_type_val');

  var main_customer_id=$('#searchCust').val();

    //var main_customner_name=$('#searchCust').text().trim()

  try
  {
     var main_customner_name=$('#searchCust').select2('data')[0]['customer_name']
  }
  catch(ex)
  {
      toaster_create('customer not selected');
  }



//   var ship_to_cust_id=$('#customer').val();
//   var bill_to_cust_id=$('#customer_bill').val();



  
  //var bill_to= invd.invs[0].bill_to_custmoer_address
//   var bill_to_cust_number=invd.invs[0].bill_to_custmoer_number[0];
//   var ship_to_customer_number=invd.invs[0].ship_to_customer_number[0];
  
//   var main_customner_name=invd.invs[0].main_customner_name[0];
  
//   var main_customer_number=invd.invs[0].main_customer_number[0];

  var main_customer_number=$('#searchCust').select2('data')[0]['customer_number'] 
  
//   var main_customer_id=invd.invs[0].main_customer_id[0];
  
  var defs= localStorage.getItem('defs');
  
  var cart= JSON.stringify(shoppingCart.listCart());
  
  
  var customer_po= shoppingCart.load_order_info('customer_po');
  
  var order_remarks= shoppingCart.load_order_info('order_remarks');
  
  var vat_percent =document.getElementById('vat_percent').innerHTML;

  var ship_to_customer_id=$('#customer').val();

  var bill_to_customer_id=$('#customer_bill').val();

  var deposit_amt=$('#dep_amt').val();
  

//   axios.get("insert_sales_order?defs="+defs+"&cart="+cart+"&bill_cust="+bill_to_cust_number+"&ship_to="+ship_to_customer_number+"&order_type_id="+order_type_id+"&order_type_txt="+order_type_txt+"&main_customer_name="+main_customner_name+"&main_customer_number="+main_customer_number+"&main_customer_id="+main_customer_id+"&customer_po="+customer_po+"&order_remarks="+order_remarks+"&vat_percent="+vat_percent
//   +'&shipto_id='+ship_to_customer_id+'&billto_id='+bill_to_customer_id+'&deposit_amt='+deposit_amt).then(function(res)
 

  
  axios.get("insert_sales_order?defs="+defs+"&cart="+cart+"&order_type_id="+order_type_id+"&order_type_txt="+order_type_txt+"&main_customer_name="+main_customner_name+"&main_customer_id="+main_customer_id+"&customer_po="+customer_po+"&order_remarks="+order_remarks+"&vat_percent="+vat_percent
  +'&shipto_id='+ship_to_customer_id+'&billto_id='+bill_to_customer_id+'&deposit_amt='+deposit_amt+"&main_customer_number="+main_customer_number).then(function(res)
      {
         // console.log(res.data)
         // alert(res.data.data)
          //unblockUIEntirePage();
          if(res.data.status=='S')
          {
  
            
            swal({
               title: "Temporary Reservation successfuly created : "+ res.data.order_number,
               text: " ",
               type: 'success',
              // showCancelButton: true,
               confirmButtonColor: '#3085d6',
               cancelButtonColor: '#d33',
               confirmButtonText: 'OK'
              }, 
            function()
            {  
              
              force_clear_cart()
              //location.href = "checkout_page?ohid="+res.data.header_id;
            //    swal(
            //        'Done!',
            //        'Moving to next  page.',
            //        'success'
            //       ); 
              
              initiate_payment(res.data.order_number)  
              
              //get_draft_data(res.data.order_number,1);


             })

            }
         else
         {
              //toastr.error(res.data.message,'Error');
             // toastr.error(res.data.application_message,'Error');  
             toastr.error(res.data.message,'Error');  
             thizz.disabled = false;
             //force_clear_cart();
            // location.reload();

             // thizz.disabled = false;
  
          }
  
  
  
         // $('#first_click').addClass('disabled');
         // $('#sec_click').addClass('disabled');
        //  $('#the_click').addClass('disabled');    
       // alert(res.data.header_id)
         // if (isNaN(res.data.header_id))
         // {
         //     toastr.error(res.data,'Error');
         //     thizz.disabled = false;
              
         // }
         // else
         // {
  
              //alert('order number is created :'+res.data.order_number);
              //checkout_page?ohid=6798894
              //location.href = "checkout_page?ohid="+res.data.header_id;
  
      
          //}
      
  
        // invd.invs[0].so_number =res.data;                
        // document.getElementById('4th_click').click();
  
  
      })
      .catch(function()
      {
          //unblockUIEntirePage();
      
      })
  
  }

 
  var status_collapse='Closed'

//   fullscreen('full_screen')
//   function fullscreen(thizz=null)
//   {
  
//       //alert(status_collapse)
//       if(status_collapse=='Closed')
//       {
//           $('#'+thizz).removeClass('fa fa-minus')
//           $('#'+thizz).addClass('fa fa-plus' , 100, "easeOutBounce" )       
//           $("#demo").collapse('show');  
  
//           $("#stock_view").addClass('col-sm-8')
//           $("#stock_view").removeClass('col-sm-12')
//       }
//       else
//       {
//           $('#'+thizz).removeClass('fa fa-plus')
//           $('#'+thizz).addClass('fa fa-minus', 100, "easeOutBounce" )
//           $("#demo").collapse('hide');  
  
//           $("#stock_view").removeClass('col-sm-8')
//           $("#stock_view").addClass('col-sm-12')
  
//       }
  
//   }
  $('#demo').on('shown.bs.collapse', function () 
  {
     console.log("Opened")
     status_collapse="Opened"
   
  
  });
  
  $('#demo').on('hidden.bs.collapse', function () 
  {
     console.log("Closed")
     status_collapse='Closed'
   
  });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  //new changes 2 sep 2020 
  
  $(function(){
  
  $('.select2-filter').select2({
      ajax: {
          url: "manufacturer_list?defs="+ localStorage.getItem('defs'),
          dataType: 'json',
          delay: 250,
          data: function (params) {
              if ( $('.select2-results').find('.search-loader').length == 0)
              {
                  $('.select2-results').append('<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>');
              }
              return {
                  q: params.term, // search term
                  type:$(this).attr('id')
                  //type: 'CUSTOMER_NUMBER',
                 // page: params.page
              };
          },
          processResults: function (data, params) {
              $('.search-loader').remove();
               
          params.page = params.page || 1;
  
          return {
              results: data,
             // pagination: {
            //  more: (params.page * 30) < data.total_count
             // }
          };
          },
          cache: true
      },
     
      //placeholder: 'Search for a customer',
      //minimumInputLength: 1,
      //templateResult:formatRepo,
      //templateSelection: formatRepoSelection_number_bill
  });
  
  
  })
 
  
  
function update_reserved_stock(div_id,status,status_1='',all='')
{
     //blockDIV('body')
     console.log(status_1)
      ShowDIV();
      $("#"+div_id).show();
      
     axios.get("reserved_stock?defs="+ localStorage.getItem('defs')+'&status='+status+'&status_1='+status_1+'&all='+all+'&from_date='+localStorage.getItem("fromdate")+'&to_date='+localStorage.getItem("todate"))
      .then(function(res)
      {
  
         // unblockUIEntirePage()
          if ($.fn.dataTable.isDataTable('#tbl_reserved_stock'))
          {
              $('#tbl_reserved_stock').DataTable().destroy();
              $('#tbl_reserved_stock')[0].innerHTML = '';
             
              updat_tbl('#tbl_reserved_stock',res);     
  
          }
          else
          {
              updat_tbl('#tbl_reserved_stock',res);     
             
          }    
          HideDIV();   
  
      })
      .catch(function()
      {
         
  
      })
}
var m=0;
function updat_tbl(id,res){
    m=0;
    var oTblReport = $(id)
    console.log(res.data); 
    //data=res.data.data;
    table= oTblReport.DataTable ({   
        // "scrollX": true,            
        "data" : res.data.data,
        "columns" : res.data.columns,
        "order": [[ 2, "desc" ]],
         //dom: 'Blfrtip',
        "dom": "<'row'<'col-md-2'B><'col-md-2'l><' toolbar col-md-5 '><'col-md-3'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",  
      
        buttons: [ 'csv', 'excel'],
        "initComplete": function(settings, json) 
        {
            //alert( 'DataTables has finished its initialisation.' );            
            loop_for_timer();

            for(var i=0;i<document.querySelectorAll("#counts_row > div > div > div > span.info-box-text").length;i++)
            {
                if(document.querySelectorAll("#counts_row > div > div > div > span.info-box-text")[i].innerText==selected)
                {

                    document.querySelectorAll("#counts_row > div > div > div > span.info-box-number")[i].innerText= res.data.data.length
                }

            }

               

        },
        "drawCallback": function( settings ) 
        {
            //alert( 'DataTables has redrawn the table' );
            loop_for_timer()
        },
        "columnDefs": [
        {
            "targets": [ 0,1,2,6 ],
            "render": function(data,type,row,meta)
        {
            console.log(row)
            console.log(data)
            //console.log('12312313123')
            console.log(meta)
            console.log(row.status)
        if(meta.col==6 )
        {
                if(data=='CANCELED')
                return '<span    class="badge badge-danger" >'+data+'</span> ';
                else if (data=='ENTERED') 
                {
                    return '<span    class="badge badge-warning" >'+data+'</span> ';                    
                }
                else
                return '<span    class="badge badge-success" >'+data+'</span> ';             
    
        }     
        if(meta.col==2 )
        {
            return '<span  style="color: -webkit-link;cursor: pointer; text-decoration: underline;"      onclick="invoice_info('+row.order_header+')" >'+data+'</span> ';

        } 
        if(row.status =='ENTERED')
        {
            m++;
            m+=Math.floor((Math.random() * 925441470) + 1);
            return '<div style="    display: inline-flex; "> <button type="button" class="btn btn-block bg-gradient-primary btn-xs" style="   padding-left: 7px;            padding-right: 7px;"  onclick="initiate_payment('+row.order_header+')">Initiate </button><span    class="badge badge-danger"  style="    padding: 6px;            padding-top: 7px;  margin-left: 15px;    cursor: pointer;"   onclick="invoice_cancel('+row.order_header+')" ><i class="fa fa-window-close" aria-hidden="true"></i></span></div> Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'     data-reservation="'+row.reservation_end_date_formate+'"    class="timer"></span>';
            //return '<span <button  type="button" class="btn btn-sm btn-info"   onclick="initiate_payment('+row.order_header+')">Initiate </button><span  style="color: -webkit-link;cursor: pointer; text-decoration: underline;    float: right; color:red"      onclick="invoice_cancel('+row.order_header+')" ><i class="fa fa-window-close" aria-hidden="true"></i></span> ';

        }
        if(row.status =='ADVANCE PAYMENT INITIATED')
        {
            m++;
            m+=Math.floor((Math.random() * 925441470) + 1);
            return '<div style="   display: inline-flex; "><span   class="badge badge-danger"  style="padding:6px;padding-top: 7px;  margin-left: 15px;    cursor: pointer;"   onclick="invoice_cancel('+row.order_header+')" ><i class="fa fa-window-close" aria-hidden="true"></i></span></div> Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'     data-reservation="'+row.reservation_end_date_formate+'"    class="timer"></span>';
          
        }        
        if(row.status =='ADVANCE PAYMENT RECEIVED')
        {
              return '';
        }
        //if(row.status =='RESERVED' && selected=='All Reservations')
        if(row.status =='RESERVED' && selected=='All Reservations')
        {
            m++;
            m+=Math.floor((Math.random() * 925441470) + 1);
            //alert(123)
            if(row.om_order_number!='')
            {
                return  '<div style="      color: green;  font-weight: bold;text-align: center;">Order Number: '+row.om_order_number+'</div>';               
            }

            else
            {

                return '<button type="button" class="btn btn-block bg-gradient-primary btn-xs" style="   padding-left: 7px;            padding-right: 7px;" onclick="extends_reservation('+row.order_header+')">Extend Reservation </button> Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'     data-reservation="'+row.reservation_end_date_formate+'"    class="timer"></span>';
            }


            
         
        }
        if(row.status =='RESERVED' && selected=='Confirmed Reservations')
        {
            m++;


            m+=Math.floor((Math.random() * 925441470) + 1);
            //alert(row.om_order_number)
            if(row.om_order_number!='')
            {
                 //alert(123)
                //row.status=row.status+'Order Created'
                return  '<div style="       color: green; font-weight: bold;text-align: center;">Order Number: '+row.om_order_number+'</div>';
               
            }
            else if( row.diff <  0)
            {

                m++;
                m+=Math.floor((Math.random() * 925441470) + 1);
                return  ' Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'     data-reservation="'+row.reservation_end_date_formate+'"    class="timer"></span>';
               

            }
            else
            {
            //alert(123)
                    m+=Math.floor((Math.random() * 925441470) + 1);
                    return '<button type="button" class="btn btn-block bg-gradient-primary btn-xs" style="   padding-left: 7px;            padding-right: 7px;" onclick="create_sales_order('+row.order_header+')">Create Sales Order</button>  Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'     data-reservation="'+row.reservation_end_date_formate+'"    class="timer"></span>';
            }
        }
        // if(row.status =='RESERVED' && selected=='Confirmed Reservations')
        // {
        //     m++;
        //     return 'Time left:  <span id="countdown_'+m+'" data-diff='+row.diff+'  class="timer"></span>';
         
        // }

        
        else 
        {
            return '';

        }         
        
        }},
        ],
        rowId:function(d)
        {
            return (d.order_header).split(' ').join('').trim();
        },

        "rowCallback": function( row, data, index ) 
        {
            console.log("row")
            console.log(data.reservation_end_date)
            console.log(row)
            var stock =data.diff
            if(stock!='')
            {

                if( stock < 3   )
                {
                    $(row).addClass('forty_eight')
                // $(row).addClass("label-warning");
                    //$node = this.api().row(row).nodes().to$();
                /// $node.addClass('pink')
                }
                if(stock < 1  )
                {

                   // $(row).addClass('blink')
                }

            }
         
         
         // minimum = parseFloat(data[1]),
        
          
      //if (stock < minimum )
     // {
      //   $node.addClass('pink')
      //}
  } 



    });
    $("div.toolbar").html('<p id="date_filter"><input  id="fromdate"  style="    margin-right: 20px;"  class="form-control-sm"  autocomplete="off"  /><input class="form-control-sm"  autocomplete="off"  id="todate" />    <button class="btn bg-gradient-primary btn-xs" style="     margin-bottom: 3px;   height: 30px;"  onclick="updatedate()"   tabindex="0" aria-controls="tbl_reserved_stock" type="button"><span>Set Date</span></button></p>');
    date_range()
}

function create_sales_order(a)
{
      
    swal({
        title: 'This action will create sales order in system. Press OK to continue',
        text: "",
        type: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'OK'
        }, function()
        {

        //    alert(1)
        //         // swal(
        //         //  'Done!',
        //         //  'Reservation successfuly created.',
        //         // );

        ShowDIV();
        axios.get("reservation_to_order?defs="+ localStorage.getItem('defs')+"&reservation_number="+a).then(function(res)
        {
            HideDIV();
            console.log(res.data)
            if(res.data.status=='S' || res.data.status=='s' || res.data.status==' ')
            {
                    swal({
                        title: 'SUCCESS',
                        text:  res.data.message, //+res.data.header_id,
                        type: 'success',
                        confirmButtonColor: '#3085d6',  
                        confirmButtonText: 'Ok'
                    }, 
                    function()
                    {                          
                        str='RESERVED';                        
                        var res =str;         
                        update_reserved_stock('reserved_stock',res); 
                    })
            }
            else
            {
                swal({
                    title: 'SUCCESS',
                    text: res.data.message,
                    type: 'success',
                    confirmButtonColor: '#3085d6',  
                    confirmButtonText: 'Ok'
                }, 
                function()
                {  
                    str='RESERVED';                        
                    var res =str;         
                    update_reserved_stock('reserved_stock',res); 

                })

            }

   })
   .catch(function()
   {
         HideDIV()   
   })











     })

      //  return true;


      

}

function date_range()
{
            $("#fromdate").datepicker({ dateFormat: 'd/mm/yy' });
            $("#todate").datepicker({ dateFormat: 'd/mm/yy' });
            var d = new Date();
            var currMonth = d.getMonth();
            var currYear = d.getFullYear();
            var currday=d.getDate();
            var fromdate = localStorage.getItem("fromdate");
            var todate = localStorage.getItem("todate");				 
            if(fromdate!=null && todate!=null)
            {			  
            $("#todate").datepicker("setDate", todate);
            $("#fromdate").datepicker("setDate", fromdate);
            }
            else
            {			  

            var startDate = new Date(currYear, currMonth,currday);		  
            if(document.getElementById("todate").value==startDate)
            {

            }
            else if(document.getElementById("todate").value.trim()=='')
            {			  

            $("#todate").datepicker("setDate", startDate);

            }		 
            var startDate = new Date(currYear, currMonth,currday-30 );	

            if(document.getElementById("fromdate").value==startDate)
            {


            }
            else if(document.getElementById("fromdate").value.trim()=='')
            {

            $("#fromdate").datepicker("setDate", startDate);

            }
            else
            {		  


            }	  
            }	
            updatedate4();
}
function updatedate4()
{		   		   
        localStorage.setItem("fromdate",document.getElementById("fromdate").value);	
        localStorage.setItem("todate",document.getElementById("todate").value);		   
}
function updatedate()
{		   		   
    localStorage.setItem("fromdate",document.getElementById("fromdate").value);	
    localStorage.setItem("todate",document.getElementById("todate").value);
    toastr.options.closeButton = true;   
    toastr.success("A new date selection was made: " + document.getElementById("fromdate").value + ' to ' + document.getElementById("todate").value);
    
    for(var i=0;i<document.querySelectorAll('.info-box').length;i++)
    {
            if(document.querySelectorAll('.info-box')[i].style.background=="rgb(160, 160, 160)")
            {
                document.querySelectorAll('.info-box')[i].click();
            }  
    }     
}  

function loop_for_timer()
{
 
   var a= document.querySelectorAll('.timer').length;

   for (var i=0;i<a;i++)
   {
    //data-reservation='+row.reservation_end_date_formate+'
        var hours= document.querySelectorAll('.timer')[i].getAttribute('data-reservation')
        var id=document.querySelectorAll('.timer')[i].getAttribute('id')
        if(document.getElementById(id).innerHTML=='')
        {         
            $("#"+id).fadeIn(1000);
            createCountDown(id,hours)
        }
   }
}

function createCountDown(elementId, hours_1) 
{  
    var countDownDate = new Date(hours_1).getTime();
    var x=elementId   
    x= setInterval(function() 
    {

	  var now = new Date().getTime();	
	 //  countDownDate= d.getTime();	
      var distance = countDownDate - now;       
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));    
	  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      if(document.getElementById(elementId) !=null)
      {
            document.getElementById(elementId).innerHTML = '&nbsp;&nbsp;'+ days + "d " + hours + "h "
            + minutes + "m " + seconds + "s ";

            if(days < 2)
            {
                document.getElementById(elementId).style.color='red'
            }
            else
            {
                document.getElementById(elementId).style.color='black';
            }
           

      }      
	  if (distance < 0) 
	  {
		clearInterval(x);
        document.getElementById(elementId).innerHTML = "&nbsp;&nbsp;EXPIRED";
        document.getElementById(elementId).style.color='red'
      }
      
	}, 1000);
}
function cancel_reservation()
{
    var order_header_id=$('#reservation_number').html();
    var request_number = order_header_id;
    // AJAX request
    //blockDIV('body')
    $.ajax({
     url: "cancel_temp_reservation?defs="+ localStorage.getItem('defs')+"&order_number="+request_number,
     type: "get",    
     success: function(response)
     { 
         //unblockUIEntirePage()
         HideDIV()
         str='ENTERED';
         str1='ADVANCE PAYMENT INITIATED';
         str2='ADVANCE PAYMENT RECEIVED';
        // str3='CANCELED';
         var res =str+"'"+','+"'"+str1+"'"+',+'+"'"+str2//+"'"+',+'+"'"+str3;         
         update_reserved_stock('reserved_stock',res); 



         
         swal('Done!', response.data,'success'); 


       // Add response in Modal body
    //    $("#empModal_data").html(response);  
    //    // Display Modal
    //    $("#empModal").modal("show"); 


     }
   });
   




}
function invoice_cancel(idd)
{
   
    
    document.getElementById('cancel_reservation').style.display='block';
    ShowDIV()
    //$("#empModal").modal("show");
    var request_number = idd;
    // AJAX request
    //blockDIV('body')
    $.ajax({
     url: "order_info?defs="+ localStorage.getItem('defs')+"&order_number="+request_number,
     type: "get",    
     success: function(response)
     { 
         //unblockUIEntirePage()
         HideDIV()
       // Add response in Modal body
       $("#empModal_data").html(response);  
       // Display Modal
       $("#empModal").modal("show"); 


     }
   });
   



}


function invoice_info(idd)
{

    document.getElementById('cancel_reservation').style.display='none';
      ShowDIV()
     //$("#empModal").modal("show");
     var request_number = idd;
     // AJAX request
     //blockDIV('body')
     $.ajax({
      url: "order_info?defs="+ localStorage.getItem('defs')+"&order_number="+request_number,
      type: "get",    
      success: function(response){ 
          //unblockUIEntirePage()
          HideDIV()
        // Add response in Modal body
        $("#empModal_data").html(response);  
        // Display Modal
        $("#empModal").modal("show"); 
      }
    });
    
  }
  
function extends_reservation(idd)
{ 
    var request_number = idd;

    $("#reservation_modal").modal("show"); 
    $("#res_number").html(request_number);  
    
}
function extend_reser()
{
    var days=$('#days').val();
    var remarks=$('#remarks').val();
    var request_number = $("#res_number").html(); 




    axios.get("extend_reser?defs="+localStorage.getItem('defs')+'&order_number='+request_number+'&n_days='+days)
   .then(function(res)
   {
          //unblockUIEntirePage()
          console.log(res.data) 
         // alert(res.data)
          

          if(res.data=='S')
          {
            swal('The reservation is extended for '+days+' Days','','success'); 

            $("#reservation_modal").modal("hide"); 



            //update_reserved_stock('reserved_stock','ADVANCE PAYMENT RECEIVED','','all');

             str='RESERVED';
                
             var res =str;         
             update_reserved_stock('reserved_stock',res); 
              


          }
     
  }).catch(function()
    {
     
   })


}


$("#search-tbl tbody tr").click(function() 
{
    console.log('clicked');
    $(this).addClass('selected').siblings().removeClass("selected");
});

  var table;
  function initiate_payment(d)
  {
       ShowDIV();
       console.log(d);
       //document.querySelectorAll('.info-box')[1].click();      
  
       var request_number = d;
     // AJAX request
     //blockDIV('body')
      $.ajax({
      url: "order_info?defs="+ localStorage.getItem('defs')+"&order_number="+request_number,
      type: "get",    
      success: function(response)
      { 
          HideDIV()
        // Add response in Modal body
        //unblockUIEntirePage()  
        $("#initiate_payment_modal_data").html(response);
        $("#initiate_payment_modal_data_footer").html('<button type="button" class="btn btn-secondary" onclick="initiate_payment_to_accountant('+d+')">Submit Request</button>');
       
        $("#initiate_payment_modal_data").html( $("#initiate_payment_modal_data").html()+'<br><div class="row"><div class="col-sm-2"><label  style="padding-top: 5px;">Collection Type : </label></div><div class="col-sm-4"><select id="advance_collection_type" class="form-control form-control-sm"></select></div><div class="col-sm-3" style="    text-align: right;"><label  id="lbl_payment_collected" > Payment to be collected :</label></div><div class="col-sm-3"><input type="number"    class="form-control-sm form-control" readonly   id="'+d+'_advance"   /></div></div><br> <div id="customer_receipt"></div>')
       
        advance_collection_type(d);
        
        // Display Modal
        $("#initiate_payment_modal").modal("show"); 
        document.getElementById('dept_line').style.display='flex';        

  
      }
    });   
  
  
  }


  function customer_email_mobile_update(order_number,params)
  {
    axios.get("customer_email_mobile?defs="+localStorage.getItem('defs')+'&order_number='+order_number)
   .then(function(res)
   {   
        
            HideDIV();
            $("#form").modal("show"); 
            $('#email1').val(res.data.email);
            $('#mobile1').val(res.data.mobile);
            $('#order_number_1').val(res.data.order_number);    
            $('#customer_id_1').val(res.data.customer_id);   
            //submit_customer_req(params)
            console.log(res.data)  

   }).catch(function()
   {
    
   
   })


  }

  function save_customer_mobile()
  {   

    var email=$('#email1').val();
    var mobile= $('#mobile1').val();
    var order_number= $('#order_number_1').val(); 
    var customer_id=$('#customer_id_1').val();
   
    //alert(email)
    //alert(mobile);
    if(email =='' && mobile =='')
    {
            toaster_create('email or mobile number cannot be null')
            return;

    }

    axios.get("update_customer_email_mobile?defs="+localStorage.getItem('defs')+'&order_number='+order_number+'&customer_id='+customer_id+
    '&email='+email+'&mobile='+mobile)
    .then(function(res)
    {   
         
             if(res.data=='success')
             {

                $("#form").modal("hide");
                submit_customer_req(); 

             }
             else
             {
                alert(res.data)
             }
             //submit_customer_req(params)
             console.log(res.data)     
    
         
 
    }).catch(function()
    {
     
    
    })

  }

  function submit_customer_req()
  {


    ShowDIV();
    var order_header_id=$('#reservation_number').html();
    var params=
    {
        //_draft_initilize:_draft_initilize,
        order_header_id:order_header_id,
        data:arraySystme_recipt,          
        // data_user:arrayUser_recipt,
        defs:localStorage.getItem('defs')
   }    

    axios.defaults.xsrfCookieName = 'csrftoken';
    axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
    axios.defaults.withCredentials = true;
    axios.post("insert_draft_app",params)
    .then(function(res)
        {
            HideDIV();  
            console.log(res)  
            $("#initiate_payment_modal").modal("hide"); 
            
            str='ENTERED';
            str1='ADVANCE PAYMENT INITIATED';
            str2='ADVANCE PAYMENT RECEIVED';
            //str3='CANCELED';
            var res =str+"'"+','+"'"+str1+"'"+',+'+"'"+str2//+"'"+',+'+"'"+str3; 
            swal('Unit has been reserved successfully. reservation: #'+order_header_id,'','success'); 
            update_reserved_stock('reserved_stock',res); 
            //update_reserved_stock('reserved_stock','ENTERED','ADVANCE PAYMENT INITIATED');   
       })
    .catch(function(error)
    {               
        HideDIV();
    })



  }
  function initiate_payment_to_accountant(d,amount=0)
  {
  
      ShowDIV();  
      var advance_req=$('#'+d+'_advance_req').val();    
      if($("#advance_collection_type").val()=="2" && amount==0)
      {


        calculate_enable_sum();
        var order_header_id=$('#reservation_number').html();
        order_total=document.querySelector("#initiate_payment_modal_data > table.dataframe.order-total > tbody > tr > td:nth-child(4)").innerText;
       
       order_total = Number(order_total.replace(/[^0-9\.-]+/g,""));
       console.log(order_total);    
       
        result = arraySystme_recipt.reduce(function (r, a) 
        {    a.forEach(function (b, i) 
            {
                r[i] = +(r[i] || 0) + +b;
            });
             return r;
        }, []);
        //alert(result[1])
        if(result[1]!=advance_req)
        {
            HideDIV();  
           
            toaster_create('Error enter amount is not matching');
            return ;
        }

        
        var params=
        {
            //_draft_initilize:_draft_initilize,
            order_header_id:order_header_id,
            data:arraySystme_recipt,          
            // data_user:arrayUser_recipt,
            defs:localStorage.getItem('defs')
       }        
        customer_email_mobile_update(order_header_id,params);
        return ; 
        // blockUIEntirePage();        


       }
      else
      {


        console.log($('#'+d+'_advance').val());  
        var  advance_amount=$('#'+d+'_advance').val();
        if(amount!=0)
        {
            var a=JSON.parse(localStorage.getItem('defs'))
            advance_amount=a.reservation_amount;

        }

        if(advance_amount!=advance_req)
        {
            HideDIV();  
            toaster_create('Error enter amount is not matching');
            return ;
        }      
        axios.get("initiate_payment_to_accountant?defs="+localStorage.getItem('defs')+"&advance_amount="+advance_amount+"&order_number="+d)
        .then(function(res)
        {
              //unblockUIEntirePage()
              HideDIV();
              console.log(res.data.message)    
              if (res.data.status=='E')
              {
                swal(
                    'issue with reservation # '+d+ ' and message is :'+ res.data.message,
                    '',
                    ''
                   ); 
                return;

              }

              //alert(res.data.message);

              swal(
                'Please proceed to make the payment at Payment Counter. Reservation: # '+d,
                '',
                ''
               ); 

              $("#initiate_payment_modal").modal("hide"); 
             // update_reserved_stock('reserved_stock','ENTERED','ADVANCE PAYMENT INITIATED');  

                // str='ENTERED';
                // str1='ADVANCE PAYMENT INITIATED';
                // str2='ADVANCE PAYMENT RECEIVED';
                // //str3='CANCELED';
                // var res =str+"'"+','+"'"+str1+"'"+',+'+"'"+str2//+"'"+',+'+"'"+str3;         
                // update_reserved_stock('reserved_stock',res); 
              
                document.querySelectorAll('.info-box')[1].click();
              
              
        }).catch(function()
        {
            HideDIV();  
        })



      }
      
     
  
  }

  function advance_collection_type(d)
 {
   axios.get("advance_collection_type?defs="+localStorage.getItem('defs')+'&order_number='+d)
   .then(function(res)
   {
          //unblockUIEntirePage()
          console.log(res.data) 
          $("#advance_collection_type").select2({
                data: res.data,
                width: 'auto' 
            })            
        $("#"+d+'_advance').hide();
        $("#lbl_payment_collected").hide();
        $("#customer_receipt").html('');
        $("#customer_receipt").show();
        
        var order_number=$("#advance_collection_type").select2("data")[0].order_number;
        //alert(order_number)
        //get_draft_data(order_number)
        initiate_payment_to_accountant(d,amount=1000);

        
         // alert(res.data.message)
     
  }).catch(function()
    {
     
   })

   $("#advance_collection_type").on("select2:select", function (e) 
    {    

        var select_val = $(e.currentTarget).val();
        console.log(select_val)
        if(select_val==1)
        {
            $("#"+d+'_advance').show();
            $("#"+d+'_advance').val($("#"+d+'_advance_req').val())
            $("#lbl_payment_collected").show();
            $("#customer_receipt").hide();
            $("#customer_receipt").html('');
            
        }
        else
        {
            $("#"+d+'_advance').hide();
            $("#lbl_payment_collected").hide();
            $("#customer_receipt").html('');
            $("#customer_receipt").show();
            
            var order_number=$("#advance_collection_type").select2("data")[0].order_number;
            //alert(order_number)
            get_draft_data(order_number)
        }
       
    
    });


  }
  function get_draft_data(d ,a=0)
  {
        ShowDIV()
        axios.defaults.xsrfCookieName = 'csrftoken';
        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
        axios.defaults.withCredentials = true; 
        axios.get("get_draft_reciept?defs="+localStorage.getItem('defs')+'&order_number='+d)
        .then(function(res)
        {            

            console.log(res);
            console.log('#');
            console.log(a);
            if(a==1  &&  typeof(temp1.data.data[0].receivable_level_id) !=   'undefined')
            {
            
               initiate_payment_to_accountant(d,amount=1000);

            }
            HideDIV()
            var e =res.data.data;              
            $("#customer_receipt").html('');         
            var col =res.data.columns;
            console.log(res)
            if(res.data=='')
            {
                $("#customer_receipt").append('No Record Found');
                $("#customer_receipt").append();
            }
            $("#customer_receipt").append('* ship to customer ');
            var header='<table id="datagrid" class="table-sm table dataframe tbl_font table-sm table-striped" ><thead><tr>';
            for(var i=0;i<col.length;i++)
            {
               // alert(i)
                if(i==0)
                {
                    header+='<th>   </th>';
                }
               else if(i==1)
                {
                    header+='<th>AMOUNT ASSIGNED</th>';
                }
               else if(i==2)
                {
                    header+='<th>VAT</th>';
                }
                else if(i==5)
                {
                    header+='<th  style="display:none">'+col[i]+'</th>';
                }

                else
                {
                    header+='<th>'+col[i]+'</th>';
                }             

            }
            header+='</tr></thead><tbody id="dataTable">';
            var dataTable='';
            for(var i=0;i<e.length;i++)
            {
                cloneIndex=((Math.random()*((10000-1584)+1027))+10).toFixed(0)      
                var id ="clonedtr"+cloneIndex; 

                //console.log(e[i][col[j]]);

                dataTable+='<tr data-id="1" id='+id+'>';
                //console.log(col.length)
                for(var j=0;j<col.length;j++)
                {
                  
                    if(j==0)
                    {
                        dataTable+='<td><input   onclick="line_enable_receipt(this)" type="checkbox" id="line_enable"  style="    zoom: 1.5;"  /></td>';
                    }
                    else if(j==1) 
                    {
                        dataTable+='<td    data-field="amt_assigned" id="amt_assigned" ><input type="number" value="0"   onkeyup="onchange_amt_assigned(this)"   class="sum 5"  /><input type="hidden" value="'+e[i]['cash_receipt_id']+'" />'

                    }
                    else if(j==2)
                    {

                        dataTable+='<td ><input class="sum 6" type="text" value=0 style="width:70px"   disabled/></td>'

                    }
                    else if(j==5)
                    {


                        dataTable+='<td style="display:none" > <input  type="text"  style="width:70px" /></td>'

                    }
                    //else if(col[j]=='orig_receipt_amt')     
                    //else if(col[j]=='AVAILABLE AMOUNT')               
                    else if(j==3)
                    {
                        //dataTable+='<td data-field="avbl_balance" class="sum 2" id="avbl_balance">'+e[i][col[j]]+'</td>';

                        dataTable+='<td class="sum 2" >'+e[i][col[j]]+'</td>';
                        //<td >'+res.data[i].orig_receipt_amt+'

                    }
                    else if(j==4)
                    {
                        dataTable+='<td class="sum 3"  data-field="avbl_balance"  id="avbl_balance"  >'+e[i][col[j]]+'</td>';

                    }
                    else
                    {
                        dataTable+='<td>'+e[i][col[j]]+'</td>';
                    }
                  
                }
                dataTable+='</tr>';
             
            }  
            var aaa='<tr><td  style="text-align:right;">Total:</td><td class="total sum-5"></td><td class="total sum-6"></td><td class="total sum-2"></td><td class="total sum-3"></td><td class="total sum-4"></td><td></td></tr>';
         
            dataTable+=aaa+'</tbody></table>'; 
           $("#customer_receipt").append(header+dataTable);             
            line_enable_receipt();
           
            sumThisClass_html("3")
            sumThisClass_html("2")

        }).catch(function()
        {

        })
 }      
 
function onchange_amt_assigned(a)
{
        //console.log(a)
        var e = document.getElementById(a.id);
        var parent_tr=a.closest('tr').id;
       
        var line_entered_amt=parseFloat($("#"+parent_tr+"  >  #amt_assigned > input").val());
        parseFloat($("#"+parent_tr+"  >  #amt_assigned > input").val(line_entered_amt))
       
         //alert($("#"+parent_tr+"  >  #avbl_balance").html())
       // var avbl_balance=undo_formatCalculation($("#"+parent_tr+"  >  #avbl_balance").html());   

        var avbl_balance=$("#"+parent_tr+"  >  #avbl_balance").html();   
        //alert(avbl_balance)
      
        if(isNaN(line_entered_amt))
        {
            toastr.warning('Assign ammount is not a number','error');
            $("#"+parent_tr+"  >  #amt_assigned > input").val(0)
            return;    
        }
        if(line_entered_amt >avbl_balance )
        {
            toastr.warning('Assign ammount is greater then avl balance','error');
            $("#"+parent_tr+"  >  #amt_assigned > input").val(avbl_balance)
            calculate_enable_sum() 
            return;  
        }       
        calculate_enable_sum()   
        sumThisClass("5");           
        sumThisClass("6"); 


       // sumThisClass_html("4")
        sumThisClass_html("3")
        sumThisClass_html("2")
    //
       // amt_assigned
    
}

function sumThisClass_html(className) 
{
    var sumTotal = 0;
    $("." + className).each(function(index, el) 
    {
    //var elValue = undo_formatCalculation($(el).html());
    var elValue = $(el).html();
    
    // alert(elValue)
    if (!isNaN(elValue)) 
    { 
        sumTotal =+elValue+ +sumTotal;
        console.log(sumTotal)
    }
    });
    sumTotal=Number(sumTotal).toFixed(2)

    $(".sum-" + className).text(sumTotal.toFixed(2));

}   
function sumThisClass(className) 
{
    var sumTotal = 0;
    $("." + className).each(function(index, el) 
    {
    var elValue = $(el).val();
    if (!isNaN(elValue)) 
    { 
    sumTotal +=parseFloat($(el).val()).toFixed(2);
    console.log(sumTotal)

    }
    });
    sumTotal=formatCalculation(sumTotal.toFixed(2))
    $(".sum-" + className).text(sumTotal.toFixed(2));
    if(className=='6')
    {
    // document.getElementById('collected_total_vat').value=sumTotal; 
    }
}
 function line_enable_receipt(thizz='') 
{
             var cash_collection = document.getElementById('datagrid');  
            for (i = 1; i < cash_collection.rows.length; i++) 
            {
             
                var objCells = cash_collection.rows.item(i).cells;
                for (var j = 0; j < objCells.length; j++)
                {        
                  
                    if(j==0 && cash_collection.rows[i].cells[j].childNodes[0].checked == true)
                    { 
                            cash_collection.rows[i].cells[1].childNodes[0].disabled=false;                         
                            cash_collection.rows[i].cells[1].childNodes[0].style.backgroundColor ="#ffff";                
                            cash_collection.rows[i].style.backgroundColor = "white";           
                    }

                   else if(j==0 && cash_collection.rows[i].cells[j].childNodes[0].checked == false)
                    {       
                            cash_collection.rows[i].cells[1].childNodes[0].disabled=true;                          

                   }
                }

            }
        calculate_enable_sum()   
        sumThisClass("5");           
        sumThisClass("6");     
}


  function getCurUrlGETObj()
  {
		return JSON.parse('{"' + decodeURI(window.location.search.substring(1).replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}');
	}
	var vProductTbl = new Vue({
		delimiters:['[[',']]'],
		el: '#vProductTbl',
		data:{
			columns:[],
			data:[],
		}
	}) 

//function initDT(d){  }	

function buildTheadTfoot(d)
{
    var html = '<thead><tr>';	
    d.forEach(function(e){
        html += '<th>'+e.title+'</th>';
    });
    html += '</tr></thead><tfoot><tr>';
    d.forEach(function(e){
        html += '<th><input type="text" placeholder="Search '+e.title+'" />'+'</th>';
    });
    console.log(html);
    return html + '</tr></tfoot>';		
}


$( document ).ready(function() 
{  
    console.log( "ready!" );
    //get_order_type_lov()
});






