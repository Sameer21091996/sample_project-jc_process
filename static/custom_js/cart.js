 // ************************************************
    // 22Shopping Cart API
    // ************************************************
    
    var shoppingCart = (function() {

     
        // =============================
        // Private methods and propeties
        // =============================
        cart = [];
        order_other_info=[];
        
        // Constructor
        function Item(obj, price, count) 
        {
          this.obj = obj;
          this.price = price;
          this.count = count;
        }
      
      
        // Save cart
        function saveCart() 
        {
          localStorage.setItem('shoppingCart', JSON.stringify(cart));
           
        }
       
        
          // Load cart
        function loadCart()
         {
         
          cart = JSON.parse(localStorage.getItem('shoppingCart'));
        
         
        }
        if (localStorage.getItem("shoppingCart") != null)
        {
          loadCart();
        }
        
      
        // =============================
        // Public methods and propeties
        // =============================
        var obj = {};
        
        obj.load_order_info=function(name_)
        {

         order_other_info = localStorage.getItem(name_);

         return order_other_info;
        }

        obj.save_order_info=function(name_,vall)
        { 
          //alert(112233333333333333333333333)
          
           localStorage.setItem(name_, vall); 
       
        }
        // Add to cart
        obj.addItemToCart = function(obj, price, count,custo_validation=0) 
        {
          for(var item in cart) 
          {
            if(cart[item].obj.name === obj.name) 
            {      
              if (Number(cart[item].obj.onhand_qty) <= cart[item].count    && custo_validation==0 )
              {
                   
                  cart[item].count=1;
                  alert('Requested Quantity is greater than on hand quantity');
                  refresh_reservation_details(update=true);
                  return
                  
              }  
              console.log(cart[item].obj);
              console.log(cart[item]);
              console.log(1)
              if(custo_validation==1)
              {
                cart[item].count=cart[item].obj.req_quantity;
              }
              else
              {
                cart[item].count ++;


              }
              console.log("95")
              saveCart();              
              return;
            }

          }
          console.log("line # 100")
          var item = new Item(obj, price, count);
          cart.push(item);
          saveCart();
          //get_selected_cust();
        }
        // Set count from item
        obj.setCountForItem = function(obj, count) {
          for(var i in cart) {
            if (cart[i].obj.name === obj.name) {
              cart[i].count = count;
              break;
            }
          }
        };
        // Remove item from cart
        obj.removeItemFromCart = function(obj) {
            for(var item in cart) {
              if(cart[item].obj.name == obj.name) {
                cart[item].count --;
                if(cart[item].count === 0) {
                  cart.splice(item, 1);
                }
                break;
              }
          }
          saveCart();
        }
      
        // Remove all items from cart
        obj.removeItemFromCartAll = function(obj) {

          for(var item in cart) {
            if(cart[item].obj.inventory_item_id == obj.name) {
              cart.splice(item, 1);
              break;
            }
          }
          saveCart();
        }
      
        // Clear cart
        obj.clearCart = function() {
          cart = [];
          saveCart();
        }
      
        // Count cart 
        obj.totalCount = function() {
          var totalCount = 0;
          for(var item in cart) {
            totalCount += cart[item].count;
          }
          return totalCount;
        }
      
        // Total cart
        obj.totalCart = function() {
          var totalCart = 0;
          for(var item in cart) {
            totalCart += cart[item].price * cart[item].count;
          }
          return Number(totalCart.toFixedRound(2));
        }
      
        // List cart
        obj.listCart = function() {
          var cartCopy = [];
          for(i in cart) {
            item = cart[i];
            itemCopy = {};
            for(p in item) {
              itemCopy[p] = item[p];
      
            }
            itemCopy.total = Number(item.price * item.count).toFixedRound(2);
            cartCopy.push(itemCopy)
          }
          return cartCopy;
        }
      
        // cart : Array
        // Item : Object/Class
        // addItemToCart : Function
        // removeItemFromCart : Function
        // removeItemFromCartAll : Function
        // clearCart : Function
        // countCart : Function
        // totalCart : Function
        // listCart : Function
        // saveCart : Function
        // loadCart : Function
        return obj;
      })();
      
      function flyToCart(e) 
      {
          var cart = $("#btn_cart");
          var imgtodrag = $(e);
          if (imgtodrag) {
              var imgclone = imgtodrag.clone()
                  .offset({
                  top: imgtodrag.offset().top,
                  left: imgtodrag.offset().left
              })
                  .css({
                  'opacity': '0.5',
                      'position': 'absolute',
                      'height': '150px',
                      'width': '150px',
                      'z-index': '100'
              })
                  .appendTo($('body'))
                  .animate({
                  'top': cart.offset().top + 10,
                      'left': cart.offset().left + 10,
                      'width': 75,
                      'height': 75
              }, 1000, 'easeInOutExpo');
              
              setTimeout(function () {
                  cart.effect("shake", {
                      times: 2
                  }, 200);
              }, 1500);
      
              imgclone.animate({
                  'width': 0,
                      'height': 0
              }, function () {
                  $(this).detach()
              });
          }
      }
      // *****************************************
      // Triggers / Events
      // ***************************************** 
      // Add item
      //$(document).on('click','.add-to-cart',function(event) {

        $(document).on('click','.dt-button',function(event) {
        
      
        event.preventDefault();    
        var rowsData = $('#products').DataTable().rows($('#products tr.table-info')).data();

        if (rowsData.length ==0)
        {
          toaster_create('no item  selected ');
          HideDIV();
          return;

        }
        

        for (var i = 0; i < rowsData.length; i++) {
          var e = rowsData[i];
          var obj = {};
          obj['name'] = e.inventory_item_id + e.organization_id;
          obj['name'] = obj['name'].trim();
          obj['item_code'] = e.item_code;
          obj['organization_code'] = e.organization_code;
          obj['from_org_name'] = e.organization_name;
          obj['serial_number'] = e.serial_number;
          obj['inventory_item_id'] = e.inventory_item_id;
          obj['subinventory'] = e.subinventory;
          obj['onhand_qty'] = e.reservable_qty;
          obj['barcode'] = e.barcode;
          obj['price']= e.price;
          
          // obj['color']=e.color;
          // obj['model_year']=e.model_year;
          obj['uom']=e.primary_uom_code;
          obj['organization_id']=e.organization_id;
          //obj['print_charges']='true';
          
          obj['e']=e;
        
          var price = Number(0);
        
        
            // flyToCart($(this).closest('tr')[0]);
            shoppingCart.addItemToCart(obj, price, 1);
            toaster_create(obj['item_code'] +' item added in cart click on  2. Fill Customer Details to view details ');
            //get_tax_();
            //get_selected_cust();
          
        }
      
      //   if(rowData.stock_status=='Available'){
      
      //   } else {
      //     alert('Stock status is not available');
      //   }
      
      
        //displayCart();
       // $('#profile-tab').click()
       // refresh_reservation_details()




       var cartArray = shoppingCart.listCart();
       var totalqtyy=0;
       for(var i in cartArray) 
       {

          totalqtyy=+totalqtyy +  +cartArray[i].count;
                 
      }

      
      var el = document.querySelector('#qty_selected');
      el.setAttribute('data-count', totalqtyy);
      console.log("315")
      refresh_reservation_details();
      console.log("315")
      //$('#qty_selected').append(totalqtyy)  

      //alert('call')


      //Preview_Order()
      });
      
      // Clear items
      $(document).on('click','#clear-cart',function(event) {
      
        shoppingCart.clearCart();
        console.log("clear_cart")
        displayCart();      
      });
            
     function save_to_cart_custom(obj,qty=1)
     {

        var price = Number(0);

        shoppingCart.addItemToCart(obj, price, qty,1);

     }
      
      // Delete item button
      
      $(document).on("click", ".delete-item", function(event) 
      {
        // var r = confirm("Press Ok to remove line");
        // if (r == true) 
        // {
        //     //txt = "You pressed OK!";
        // }
        // else{
        //   return;
        // }
        
        var name = $(this).data('name')
        var NewArray = items.filter(function(element,index,self){
            return index === self.indexOf(element); 
        });
  
        $.each(NewArray, function(index, value){
          rowdata = value.split("/")
          const vala = rowdata[0].replace(/(?:\\[rn])+/g, "")
          if($.trim(vala) == name){
            items.splice(index,1)
          }
        })
        $('#excel_data').val(items)
        tr = $("#"+name).remove()
        shoppingCart.removeItemFromCartAll({'name':name});
        var rowCount = $('#sp_product_id tr').length;
        $('#total_records').html(rowCount)
        updateNo()
        getInvoiceTotal()
        // displayCart(hide_remove_btn='', update=true);
        if($('#order_type_lov_item_page').val())
        {
          var e=document.getElementById('order_type_lov_item_page')
        }
      })
      
      
      // -1
      $(document).on("click", ".minus-item", function(event) {
        var name = $(this).data('name')
        shoppingCart.removeItemFromCart({'name':name});
      
        //refresh_reservation_details();
        refresh_reservation_details()
        //displayCart();
        
      })
      // +1
      $(document).on("click", ".plus-item", function(event) 
      {     
        //alert(2)
        var name = this.getAttribute('data-name');
      //   var price = this.getAttribute('data-price');
        var onhandQty = parseInt(this.getAttribute('data-onhand-qty'));
        var inpQty = Number(this.closest('div').getElementsByTagName('input')[0].value);
        console.log(inpQty);
        console.log(onhandQty);
        if(inpQty > onhandQty )
        {
              alert('Requested Quantity is greater than on hand quantity');
              //this.closest('div').getElementsByTagName('input')[0].value  =inpQty-1;
              //refresh_reservation_details();
              return;
        }
        else
        {
          this.closest('div').getElementsByTagName('input')[0].value=+this.closest('div').getElementsByTagName('input')[0].value+1
          shoppingCart.addItemToCart({'name':name});          
          refresh_reservation_details(update=true)
        }
        //refresh_reservation_details()displayCart
        //displayCart();
        
      })
      
      // Item count input
      $('.show-cart').on("change", ".item-count", function(event) {
          var name = this.getAttribute('data-name');
         var count = Number($(this).val());
      
         var onhandQty = parseInt(this.getAttribute('data-onhand-qty'));
          var inpQty = Number(this.closest('div').getElementsByTagName('input')[0].value);
          if(inpQty >= onhandQty ){
              shoppingCart.setCountForItem({'name':name}, onhandQty);
              displayCart();
              return alert('Requested Quantity is greater than on hand quantity....');
          }
          console.log("here 444")
          shoppingCart.setCountForItem({'name':name}, inpQty);
          displayCart();
      });
      
      //displayCart();


     
      
      function force_clear_cart()
      {

        shoppingCart.clearCart();

      }