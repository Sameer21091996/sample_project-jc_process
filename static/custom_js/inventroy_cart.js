
var invTransfersCart = (function() {
    // =============================
    // Private methods and propeties
    // =============================
    var cart = [];
    
    // Constructor
    function Item(obj, price, count) {
      this.obj = obj;
      this.price = price;
      this.count = count;
    }
    
    // Save cart
    function saveCart() {
      localStorage.setItem('invTransfersCart', JSON.stringify(cart));
    }
    
      // Load cart
    function loadCart() {
      cart = JSON.parse(localStorage.getItem('invTransfersCart'));
    }
    if (localStorage.getItem("invTransfersCart") != null) {
      loadCart();
    }
    
  
    // =============================
    // Public methods and propeties
    // =============================
    var obj = {};
    
    // Add to cart
    obj.addItemToCart_invTransfersCart = function(obj, price, count) {
      for(var item in cart) {
        if(cart[item].obj.name === obj.name)
         {
          // alert(Number(cart[item].obj.onhand_qty))
          // alert(cart[item].count)
          if (Number(cart[item].obj.onhand_qty) < cart[item].count )
          {
              
              alert('Requested Quantity is greater than on hand quantity.');
              return 
          }
  
  
            console.log(cart[item].obj);
            console.log(cart[item]);
          cart[item].count ++;
          saveCart();
          return;
        }
      }
      var item = new Item(obj, price, count);
      cart.push(item);
      saveCart();
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
    // Set count from item
    obj.setCommentForItem = function(obj, comment) {
      for(var i in cart) {
        if (cart[i].obj.name === obj.name) {
          cart[i].obj.comment = comment;
          break;
        }
      }
    };
    // Set count from item
    obj.setRequiredDateForItem = function(obj, date) {
      for(var i in cart) {
        if (cart[i].obj.name === obj.name) {
          cart[i].obj.required_date = date;
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
        if(cart[item].obj.name == obj.name) {
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
      var current_org = JSON.parse(localStorage.getItem('defs')).organization_code;
  
      var totalCount = 0;
      for(var item in cart) {
          if (cart[item].obj.current_org == current_org){
              totalCount += cart[item].count;
          }
      }
      return totalCount;
    }
  
    // Total cart
    obj.totalCart = function() {
      var current_org = JSON.parse(localStorage.getItem('defs')).organization_code;
      var totalCart = 0;
      for(var item in cart) {
          console.log(cart[item]);
          console.log(current_org);
          if (cart[item].obj.current_org == current_org){
              totalCart += cart[item].obj.vin_price * cart[item].count;
          }
      }
      return Number(totalCart.toFixed(2));
    }
  
    // List cart
    obj.listCart = function() {
      var cartCopy = [];
      var current_org = JSON.parse(localStorage.getItem('defs')).organization_code;
      for(i in cart) {
          item = cart[i];
          if (item.obj.current_org == current_org){
              itemCopy = {};
              for(p in item) {
                  itemCopy[p] = item[p];
              }
              itemCopy.total = Number(item.obj.vin_price * item.count).toFixed(2);
              cartCopy.push(itemCopy);
          }
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