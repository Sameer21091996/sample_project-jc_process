var global_data;
var api;

function Preview_Order() {

  //alert(1)
  //get_selected_cust()

  //displayCart();
  //$('#profile-tab').click()
  //refresh_reservation_details()

  if ($("#collapseTwo").hasClass("show") == false) {
    //alert(1)
    refresh_reservation_details();

    //document.getElementById('check_all').click()
  } else {
    // $('.show-cart').html('');
    //alert(2)
  }

  //get_selected_cust()
  //get_tax_()
  //setTimeout(get_selected_cust, 1000);
}

//$('.dt-button').hide();
$(".dt-button").hide();

function datatable_reload2(res, tbl) {
  global_data = res;
  var oTblReport = $(tbl);
  if (tbl == "#sp_products") {
    table = oTblReport.DataTable({
      lengthMenu: [[-1], ["Show all"]],
      dom: "<'row'<'col-md-2'B><'col-md-2'l><'col-md-4 lbl_qty_count'><'col-md-4'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",
      buttons: [
        {
          text: "Add To Cart",
          action: function (e, dt, node, config) {
            //alert( 'Button activated' );
          },
        },
      ],
      data: res.data.data,
      columns: res.data.columns,
      aaSorting: [],
      columnDefs: [
        {
          targets: [3],
          render: function (data, type, row, meta) {
            return (
              ' <button  type="button" class="btn btn-sm btn-info" id="item_code[' +
              meta.row +
              ']"   contenteditable>' +
              data +
              "</button>"
            );
          },
        },
        {
          targets: [0],
          render: function (data, type, row, meta) {
            return '<input type="checkbox" class="row-checkbox" >';
          },
        },
        {
          targets: [1],
          visible: false,
        },
        {
          width: "0.5%",
          targets: 0,
        },
        {
          targets: [0],
          orderable: false,
        },
      ],
    });
  }
}

function datatable_reload(res, tbl) {
  console.log("in datatable_reload");
  global_data = res;

  var oTblReport = $(tbl);

  if (res.data.data.length == 0) {
    $(".dt-button").hide();
  } else {
    $(".dt-button").show();
  }
  if (tbl == "#products") {
    table = oTblReport.DataTable({
      //"scrollX": true,
      lengthMenu: [[-1], ["Show all"]],
      dom: "<'row'<'col-md-2'l><'col-md-4 lbl_qty_count'><'col-md-4'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",
      buttons: [
        {
          text: "Add To Cart",
          action: function (e, dt, node, config) {
            //alert( 'Button activated' );
          },
        },
      ],
      data: res.data.data,
      columns: res.data.columns,
      aaSorting: [],
      columnDefs: [
        {
          targets: [3],
          render: function (data, type, row, meta) {
            return (
              ' <button  type="button" class="btn btn-sm btn-info btn-item waves-effect waves-light"   style="">' +
              data +
              "</button>"
            );
          },
        },
        {
          targets: [0],
          render: function (data, type, row, meta) {
            // return ' <button  type="button" class="add-to-cart btn btn-sm btn-info"   style="">Add To Cart <i style="color: white;" class="fa fa-cart-plus fa-1x "  aria-hidden="true"></i></button>';

            var organization_id = JSON.parse(localStorage.getItem("defs"))[
              "organization_id"
            ];

            if (
              row.organization_id == organization_id &&
              row.reservable_qty > 0
            ) {
              return '<input type="checkbox" class="row-checkbox" >';
            } else {
              //return '';
              if (row.reservable_qty > 0) {
                return ' <button  type="button" disabled class="btn-sio add-to-cart btn btn-sm btn-info waves-effect waves-light"   style="">Inventory Transfer<i style="color: white;" class="fa fa-cart-plus fa-1x "  aria-hidden="true"></i></button>';
              } else {
                return "";
              }
            }
          },
        },
        {
          targets: [1],
          visible: false,
        },
        { width: "0.5%", targets: 0 },
        {
          targets: [0],
          orderable: false,
        },
      ],
      rowId: function (d) {
        return (d.inventory_item_id + d.organization_id)
          .split(" ")
          .join("")
          .trim();
      },
      drawCallback: function () {
        $(".btn-sio").prop("disabled", true);

        invTransfersCart.listCart().forEach((x) =>
          $("#" + x.obj.name.split(" ").join(""))
            .find("button.add-to-cart")
            .hide()
        );

        var obj = shoppingCart.listCart();
        for (var i = 0; i < obj.length; i++) {
          var id = obj[i].obj.name.split(" ").join("");
          // $('#'+id).find('.row-checkbox').hide();
        }
        api = this.api();
        $(".lbl_qty_count").html(
          "<b>Total Available Quantity:" +
            api.column(16, { page: "all" }).data().sum().toLocaleString() +
            "</b>"
        );
        // console.log('#123123')
      },
      initComplete: function () {
        $("#products thead th").each(function () {
          var title = $(this).text();

          var cmpTitle = $(this).text().toLowerCase().trim();

          if (!cmpTitle == "") {
            if (cmpTitle == "inventory item id") {
              $(this).html("");
            } else if (cmpTitle.includes("date")) {
              $(this).html(
                title +
                  '<br><input type="text" class="dt-date-fltr dt-inputs  form-control" placeholder="..." />'
              );
            } else {
              $(this).html(
                title +
                  '<br><input type="text" class=" dt-inputs form-control" placeholder="..." />'
              );
            }
          } else {
            return $(this).html(
              'Select all <br><input type="checkbox" class="select-all-checkbox" >'
            );
          }
        });

        var i = 0;
        this.api()
          .columns()
          .every(function () {
            var that = this;

            // console.log(that)
            //  console.log('tayyab')

            $("input", this.header()).on("keyup change clear", function (e) {
              var ifDate = $(this).attr("class").includes("dt-date-fltr");
              if (e.which == 13 || ifDate) {
                if (that.search() !== this.value) {
                  that.search(this.value).draw();
                }
              }
            });

            $("input", this.header()).on("click", function (e) {
              e.stopPropagation();
            });
          });
      },
    });
  } else {
    var table_1 = oTblReport.DataTable({
      data: res.data.data,
      columns: res.data.columns,
      columnDefs: [
        {
          targets: [0],
          render: function (data, type, row, meta) {
            return "";
          },
        },
        {
          targets: [1],
          visible: false,
        },
      ],
    });

    $("#pre_filter").on("click", "tr", function () {
      console.log(table_1.row(this).data());
      var temp1 = table_1.row(this).data();
      console.log(temp1);
      update_datatable(temp1.inventory_item_id);
    });
  }
}

let lines_errors = []
let header_error = {}
let needValidations=true;
function previewOrderDetail(){

  if (itemLinesEntry.shippingInstructionsRequired() && $('#customer_po').val().length == 0){
      setTimeout(function(){
        $('a:contains("Create Order")').click();
      },250);
      return toastr.error("Capture Serial No in 'Customer LPO' To Proceed Further !");
  }

  
  var qtyNotEnteredForAllLines = [...$('tbody td[data-column="qty"]').slice(0,-1)].map(x=>({
    'text':x.innerText.trim(),
    'element':x
  })).filter(x=>x.text=="");
  if (qtyNotEnteredForAllLines.length){
    setTimeout(function(){
      $('a:contains("Create Order")').click();
      qtyNotEnteredForAllLines[0].element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    },250);
    return toastr.error("Please enter 'Ord Qty' !");
  }

  if ( ['8885','8886'].includes($('#selectSaleTypeId').val()) && $('#customer_po').val().trim() == ''  ){
    setTimeout(function(){
      $('a:contains("Create Order")').click();
    },250);
    return toastr.error("Please enter 'Customer LPO' to proceed !")
  }

  if ($('tbody td[data-column="avl_qty"].text-danger').length != 0 ){
    setTimeout(function(){
      $('a:contains("Create Order")').click();
    },250);
    return toastr.error("Insufficient Stock ! Please Check !")
  }
  
  if ($('#searchCust').val() == null){
    setTimeout(function(){
      $('a:contains("Create Order")').click();
    },250);
    return toastr.error("Please select bill to customer !")
  }





  try {
    // calculate_enable_sum();
    
  } catch (error) {
    console.log(error);
  } 
  itemLinesEntry.$nextTick(()=>{
    $('[data-toggle="popover"]').popover()
  })

  inv_tot.t = itemLinesEntry.column_aggregates['line_total']
  inv_tot.gt = itemLinesEntry.column_aggregates['line_total']
  inv_tot.td = itemLinesEntry.column_aggregates['discount']
  inv_tot.tv = itemLinesEntry.column_aggregates['vat']
// 't':'0',
// 'td':'0',
// 'tv':'0',
// 'gt':'0',
// 'vat_p':'',
// 'et':'0'

  // ShowDIV()
  // if (!itemLinesEntry.needValidations){
  //   HideDIV()
  //   return 
  // }

  const cust_account_id = $('#bill-to-cust_account_id').val()
  if (!cust_account_id){

    // toastr.error('Customer not selected!!!');
    // HideDIV()
    return;
  }
  const defs = JSON.parse(localStorage.getItem("defs"));
 
  const validLinesData = itemLinesEntry.lines_data.slice(0,-1).filter(line=>(parseFloat(line.unit_price) > 0)).filter(x=>x.item_type == 'ACC' );
  // if (!validLinesData.length){
  //     HideDIV()
  //     toastr.error("Please add atleast one valid row")
  //     return;
  // }
  
  validationsPassed = true
  lines_errors = []
  header_error = {}
  $('#disocunt_sum_2').removeClass('bg-danger')


  itemLinesEntry.lines_data.forEach(item=>{
    item.line_error = null
  });

  itemLinesEntry.header_error = null;

  var lines = itemLinesEntry.lines_data.filter(x=> x.barcode == null || x.barcode == ''|| x.barcode == 'null').filter(x=>x.inventory_item_enabled_flag == 'Y').map(x=>({
    'unit_price':x.unit_price,
    'unit_selling_price':x.unit_selling_price,
    'item_desc':x.item_desc,
    'inventory_item_id':x.inventory_item_id,
    'item_code':x.item_code,
    'link':x.link,
  }));
  axios.post(`/sales/check-units-discount/`, {lines:lines , items: validLinesData, cust_account_id, defs, total_gross: itemLinesEntry.column_aggregates['gross_amount'] || 0, total_discount: parseFloat($('tfoot [data-column="discount"]').text().replace(",","")) || 0, discount_perc:$('tfoot td[data-column="discount_perc"]').text() || 0})
  .then((res)=>{    console.log(res.data);


    if (res.data['header_error']['amount'] || res.data['header_error']['percentage']){
      itemLinesEntry.header_error = res.data['header_error']; 
      show_errorss(res.data['header_error']['amount'] || res.data['header_error']['percentage'])
      $('#disocunt_sum_2').addClass('text-danger text-bold')
      header_error = res.data['header_error']
      validationsPassed = false
    }
    else {
      $('[data-toggle="popover"]').popover('hide')
      $('#order-header-error').addClass("d-none");
      $('#error_area').empty();
    }
    if (res.data['line_errors'].length){
      lines_errors = res.data['line_errors']
      validationsPassed = false
      res.data['line_errors'].forEach(err => {
        const realDataLine = itemLinesEntry.lines_data.filter(lineee=>(lineee['item_code'] == err['item_code'] && lineee['link'] == err['link']));
        if (realDataLine.length){
          realDataLine[0].line_error = err['error']
        }

        // $("[data-special-id='preview-discount-line-"+err['item_code']+"']").addClass("text-danger text-bold");
        // $('#line-error-'+err['item_code']).removeClass("d-none")
        // $('#line-error-'+err['item_code']).attr('data-content', err['error'])
      })
    }
    itemLinesEntry.needValidations = false;
    itemLinesEntry.$nextTick(()=>{
      $('[data-toggle="popover"]').popover()
    })

    HideDIV();




                ShowDIV();
                var defs = JSON.parse(JSON.stringify(itemLinesEntry.source_org));
                defs['org_id'] = defs['operating_unit_id'];

                axios.post(`/sales/check-acs-discount/`, {items: validLinesData, cust_account_id, defs, total_gross: itemLinesEntry.column_aggregates['gross_amount'] || 0, total_discount: parseFloat($('tfoot [data-column="discount"]').text().replace(",","")) || 0, discount_perc:$('tfoot td[data-column="discount_perc"]').text() || 0}).then((res)=>{    console.log(res.data);


                  if (res.data['header_error']['amount'] || res.data['header_error']['percentage']){
                    itemLinesEntry.header_error = res.data['header_error']; 
                    show_errorss(res.data['header_error']['amount'] || res.data['header_error']['percentage'])
                    $('#disocunt_sum_2').addClass('text-danger text-bold')
                    header_error = res.data['header_error']
                    validationsPassed = false
                  }
                  else {
                    $('[data-toggle="popover"]').popover('hide')
                    $('#order-header-error').addClass("d-none");
                    $('#error_area').empty();
                  }
                  if (res.data['line_errors'].length){
                    lines_errors = res.data['line_errors']
                    validationsPassed = false
                    res.data['line_errors'].forEach(err => {
                      const realDataLine = itemLinesEntry.lines_data.find(lineee=>(lineee['item_code'] == err['item_code']))
                      realDataLine.line_error = err['error']
              
                      // $("[data-special-id='preview-discount-line-"+err['item_code']+"']").addClass("text-danger text-bold");
                      // $('#line-error-'+err['item_code']).removeClass("d-none")
                      // $('#line-error-'+err['item_code']).attr('data-content', err['error'])
                    })
                  }
                  itemLinesEntry.needValidations = false
                  itemLinesEntry.$nextTick(()=>{
                    $('[data-toggle="popover"]').popover()
                  })
              
                  // HideDIV()
                }).catch((err)=>{
                  // HideDIV()
                })


    
  }).catch((err)=>{
    // HideDIV()
  })

}


function update_datatable(inventory_item_id, table_name = "") {
  //alert(2321)
  ShowDIV();
  axios
    .get(
      "/sales/filtered_stock?defs=" +
        localStorage.getItem("defs") +
        "&inventory_item_id=" +
        inventory_item_id
    )
    .then(function (res) {
      HideDIV();
      var tbl = "#products";
      if (table_name != "") {
        tbl = table_name;
      }
      if ($.fn.dataTable.isDataTable(tbl)) {
        $(tbl).DataTable().destroy();
        $(tbl).innerHTML = "";
        $(tbl).html("");

        datatable_reload(res, tbl);
      } else {
        datatable_reload(res, tbl);
      }
    })
    .catch(function () {});
}

function update_datatable2(inventory_item_id, table_name = "") {
  ShowDIV();
  // axios.get("/saleswores/darft_app_data")
  // .then(function(res)
  // {
  //     console.log(res)
  // })
  // .catch(function()
  // {})
  console.log(inventory_item_id);
  axios
    .get(
      "/sales/filtered_stock2?defs=" +
        localStorage.getItem("defs") +
        "&inventory_item_id=" +
        inventory_item_id
    )
    .then(function (res) {
      console.log("here");
      var tbl = "#products";
      if (table_name != "") {
        tbl = table_name;
      }
      if ($.fn.dataTable.isDataTable(tbl)) {
        $(tbl).DataTable().destroy();
        $(tbl).innerHTML = "";
        $(tbl).html("");
        datatable_reload(res, tbl);
      } else {
        datatable_reload(res, tbl);
      }
      console.log("here2");
      quantity = {};
      $.each(inventory_item_id, function (data_index, data_value) {
        aa = data_value.replace(/\n/g, "");
        tet = aa.split(",");
        $.each(tet, function (data_index1, data_value1) {
          items_array = data_value1.split("/");
          quantity[items_array[0].replace(/\n/g, "")] = {
            quantity: items_array[1],
          };
        });
      });
      // var organization_id=JSON.parse(localStorage.getItem('defs'))['organization_id'];
      $.each(quantity, function (index1, value1) {
        $.each(res.data.data, function (index, value) {
          // if (value.organization_id == organization_id){
          if (index1 == value.item_code) {
            if (value.reservable_qty > 0) {
              $("#" + index1)
                .find("td")
                .eq(6)
                .text(value.reservable_qty);
              $("#" + index1)
                .find("td")
                .attr("res_quantity", value.reservable_qty);
            } else {
              $("#" + index1)
                .find("td")
                .eq(6)
                .text(value.reservable_qty);
              $("#" + index1).attr("style", "color:red");
            }
          }
          // }
        });
      });
      shoppingCart.clearCart();
      $("#products").closest("tr").addClass("table-info");
      var rowsData = $("#products").DataTable().rows($("#products tr")).data();
      console.log(rowsData);
      price_list = {};
      $("#sp_product_id tr").each(function (i) {
        if ($($(this).find("td")[13]).text()) {
          line_total = $($(this).find("td")[13]).text();
          line_vat = $($(this).find("td")[12]).text();
          discount = $($(this).find("td")[10]).text();
          const list_price = $($(this).find("td")[8]).text()
          price = parseFloat(list_price);              //TAKE UNIT PRICE
          price_list[$($(this).find("td")[3]).text()] = {
            price: parseFloat(price),
            vat: parseFloat(line_vat),
            discount: parseFloat(discount),
          };
        }
      });

      if (rowsData.length == 0) {
        HideDIV();
        return;
      }
      var quantity = {};

      $.each(inventory_item_id, function (data_index, data_value) {
        aa = data_value.replace(/\n/g, "");

        tet = aa.split(",");

        $.each(tet, function (data_index1, data_value1) {
          items_array = data_value1.split("/");
          quantity[items_array[0].replace(/\n/g, "")] = {
            quantity: items_array[1],
          };
        });
      });

      console.log("price_list", price_list);
      console.log("rowsData", rowsData);
      // var organization_id=JSON.parse(localStorage.getItem('defs'))['organization_id'];
      // console.log(organization_id)
      $.each(quantity, function (index1, value1) {
        for (var i = 0; i < rowsData.length; i++) {
          var e = rowsData[i];
          console.log("oaoaoaoaoa", e);
          // debugger;
          console.log(index1);
          // console.log(e.organization_id)
          // console.log(e.item)
          if (index1 == e.item_code) {
            if (e.reservable_qty > 0) {
              var obj = {};
              obj["name"] = e.inventory_item_id + e.organization_id;
              obj["name"] = obj["name"].trim();
              obj["item_code"] = e.item_code;
              obj["organization_id"] = e.organization_id;
              obj["from_org_name"] = e.organization_name;
              obj["serial_number"] = e.serial_number;
              obj["inventory_item_id"] = e.inventory_item_id;
              obj["subinventory"] = e.subinventory;
              obj["onhand_qty"] = e.reservable_qty;
              obj["barcode"] = e.barcode;
              obj["line_price"] = e.price;
              obj["quantity"] = e.quantity;
              $.each(price_list, function (index2, value2) {
                if (index2 == e.item_code) {
                  console.log(value2);
                  console.log(value1);
                  obj["price"] = value2.price;
                  obj["list_price"] = value2.price;
                  obj["vat"] = value2.vat;
                  obj["discount"] = value2.discount;
                  e.price = value2.price * parseInt(value1.quantity);
                }
              });
              obj["uom"] = e.primary_uom_code;
              obj["organization_id"] = e.organization_id;
              //obj['print_charges']='true';
              obj["e"] = e;
              var price = Number(0);
              console.log(obj);
              // debugger;
              if (parseFloat(e.price) != 0){
                shoppingCart.addItemToCart(obj, price, value1.quantity);
              }
            }
          }
        }
      });
      console.log("HideDIV(); before");
      HideDIV();
      console.log("HideDIV(); after");
      var cartArray = shoppingCart.listCart();
      var totalqtyy = 0;
      for (var i in cartArray) {
        totalqtyy = +totalqtyy + +cartArray[i].count;
      }
      var el = document.querySelector("#qty_selected");
      el.setAttribute("data-count", totalqtyy);
      console.log("refresh_reservation_details");
      if (cartArray) {
        refresh_reservation_details();
      } else {
        refresh_reservation_details();
      }
      // Preview_Order()
      // $("#sp_product_id").empty();
      // var delay = 3000;
      // setTimeout(function() {
      //     html1 = ""
      //     var rowCount = $('#sp_product_id tr').length;
      //     $.each(res.data.not_found, function(index1, value1) {
      //         rowCount = (rowCount + 1)
      //         html1 += `<tr style="color:red" id=`+value1+`>`
      //         html1 += `<td><button class="delete-item btn btn-sm btn-danger" style="margin-right: 10px;" "+stylehide_btn_remove+"  data-name=`+value1+`>X</button></td>`
      //         html1 += `<td>`+rowCount+`</td>`
      //         html1 += `<td></td>`
      //         html1 += `<td>`+value1+`</td>`
      //         html1 += `<td>Not found</td>`
      //         html1 += `<td></td>`
      //         html1 += `<td></td>`
      //         html1 += `<td></td>`
      //         html1 += `<td></td>`
      //         html1 += `<td></td>`
      //         html1 += '<td></td>'
      //         html1 += '<td></td>'
      //         html1 += '<td></td>'
      //         html1 += `</tr>`
      //     });
      //     $('#sp_product_id').append(html1)
      // }, delay);
      $("#sales_order_div").show();
      $("#products_wrapper").hide();
      $("#products").hide();

      $('#total_disc_srsum').text($('#discount_amount_sum').text())
      $('#disocunt_sum_2').text($('#discount_amount_sum').text())

      inv_tot.t = $('#grand_line_total2').text()
      inv_tot.tv = $('#grand_line_total2').text()
      inv_tot.td = $('#discount_amount_sum').text()
      inv_tot.gt = $('#grand_line_total2').text()

    })
    .catch(function () {});
}

var selected = "";
function onDashClick(e) {
  selected = e.children[1].children[0].textContent.trim();
  console.log(selected);
  //
  var all_dash_icon = document.querySelectorAll(".info-box");
  for (var i = 0, len = all_dash_icon.length; i < len; i++) {
    all_dash_icon[i].style.background = "#fff";
  }
  $(".common_area_cls").hide();

  if (selected == "Create Sales Order") {
    e.style.background = "#a0a0a0";
    $("#avlable_stock").show();
  }
  //if(selected=='Approved Orders ')
  if (selected == "In Process Orders") {
    e.style.background = "#a0a0a0";
    //status='ENTERED','ADVANCE PAYMENT INITIATED','ADVANCE PAYMENT RECEIVED'
    str = "ENTERED";
    str2 = "REJECTED";
    str1 = "CANCELLED";
    str3 = "PENDING INTERNAL APPROVAL";
    str4 = "TEMP";
    str5 = "";

    //str3='CANCELED';
    var res =
      str +
      "'" +
      "," +
      "'" +
      str1 +
      "'" +
      "," +
      "'" +
      str2 +
      "'" +
      "," +
      "'" +
      str3 +
      "'" +
      "," +
      "'" +
      str4 +
      "'" +
      ",+" +
      "'" +
      str5;

    update_reserved_stock("reserved_stock", res);
  }
  //if(selected=='On Order Stock')
  if (selected == "Approved Orders") {
    //alert(1)
    e.style.background = "#a0a0a0";
    // str='CLOSED';
    // str1='BOOKED';
    str = "PAYMENT RECEIVED";
    str1 = "AWAITING PAYMENT CONFIRMATION";

    var res = str + "'" + "," + "'" + str1;
    update_reserved_stock("reserved_stock", res);
  }

  if (selected == "Closed Orders") {
    //alert(1)
    e.style.background = "#a0a0a0";
    str = "CLOSED";
    str1 = "CLOSED";

    var res = str + "'" + "," + "'" + str1;
    update_reserved_stock("reserved_stock", res);
  }

  if (selected == "Return Orders") {
    e.style.background = "#a0a0a0";

    str = "CLOSED";
    str1 = "CLOSED";
    str2 = "ENTERED";
    str3 = "REJECTED";
    str4 = "CANCELLED";
    str5 = "PENDING_INTERNAL_APPROVAL";
    str6 = "RETURN INITIATED";
    str7 = "";
    var res =
      str +
      "'" +
      "," +
      "'" +
      str1 +
      "'" +
      "," +
      "'" +
      str2 +
      "'" +
      "," +
      "'" +
      str3 +
      "'" +
      "," +
      "'" +
      str4 +
      "'" +
      "," +
      "'" +
      str5 +
      "'" +
      "," +
      "'" +
      str6 +
      "'" +
      "," +
      "'" +
      str7;
    update_reserved_stock("reserved_stock", res, 1);
  }

  if (selected == "PDI Requests") {
    e.style.background = "#a0a0a0";
    str = "PDI";
    var res = str;
    update_reserved_stock("reserved_stock", res, 1);
  }
}

$(document).on("change", "input.select-all-checkbox", function () {
  if (this.checked) {
    $(".row-checkbox").prop("checked", true);
    $(".row-checkbox").closest("tr").addClass("table-info");
  } else {
    $(".row-checkbox").prop("checked", false);
    $(".row-checkbox").closest("tr").removeClass("table-info");
  }
});

$(document).on("click", ".row-checkbox", function (e) {
  console.log(e);
  if (e.target.checked) {
    $(e.target).closest("tr").addClass("table-info");
  } else {
    $(e.target).closest("tr").removeClass("table-info");
  }
  e.stopPropagation();
});

var invd = new Vue({
  delimiters: ["[[", "]]"],
  el: "#v-inv-detail",
  data: {
    invs: [],
    inv: [],
  },
  methods: {},
});
var inv_tot = new Vue({
  delimiters: ["[[", "]]"],
  el: "#invoice_total_v",
  data: {
    t: 0,
    td: 0,
    tv: 0,
    gt: 0,
    vat_p: 0,
    dp_req: 0,
    total_line_charges: 0,
    leads: [],
    order_category: [],
  },
});

var cust_selected_add_arr = [];

function get_selected_cust() {
  console.log(
    "get_selected_cust get_selected_cust get_selected_cust get_selected_cust get_selected_cust"
  );
  var cartArray = shoppingCart.listCart();
  var length_cartArray = cartArray.length;

  // var total_ = $('tfoot [data-column="line_total"]').text();
  // var total_discount =  $('tfoot [data-column="discount"]').text()
  // var total_vat =   $('tfoot [data-column="vat"]').text();
  //charges_validator();
  // inv_tot.t = total_ - total_vat;
  // inv_tot.td = total_discount;
  // inv_tot.tv = total_vat;
  //inv_tot.gt = +total_;
  // inv_tot.gt = +total_ + +inv_tot.total_line_charges;

  //inv_tot.dp_req = total_/10;

  //   var cartArray = shoppingCart.listCart();
  //   var  checkboxes = document.querySelectorAll('input[name="print_charges"]');
  //   for(var j=0;j<cartArray.length;j++)
  //   {
  //       var obj= cartArray[j].obj;
  //       obj['total_vat']=inv_tot.tv;
  //       obj['total_discount']=inv_tot.td;
  //       obj['grand_total']=inv_tot.gt;
  //       obj['total_excl']=inv_tot.t;
  //       obj['dp_req']=inv_tot.dp_req;
  //       //obj['print_charges']=checkboxes[j].checked;
  //       save_to_cart_custom(obj);
  //   }

  //   // alert($('#number').val())
  //    if ($('#searchCust').val() == null)
  //    {
  //       toastr.info('main customer/ ship to customer missing','Error', {timeOut: 5000});
  //       toastr.options.closeButton = true;
  //       return
  //    }
  global_lov_order_type = shoppingCart.load_order_info("order_type_text");
  // var customer_po= shoppingCart.load_order_info('customer_po');

  // alert(total_)
  //   invd.invs =[{
  //       'cart':[cartArray],
  //       'order_type_lov':[global_lov_order_type],
  //       'customer_po':[customer_po],
  //       'order_total':[total_],
  //       'total_vat':[total_vat],
  //       'order_discount':[total_discount],
  //       'so_number':'',
  //   }];
  //   invd.inv[1] ='';
  //   invd.$nextTick
  //   invd.$nextTick(function()
  //   {
  //      $('.select2-input').select2({ dropdownAutoWidth : true, width: 'resolve' })
  //   })
  // get_draft_data((order_number = 0));
  return 1;
}
function call_darft_order() {
  var main_customer_id = $("#searchCust").val();
  if (main_customer_id) {
    status = "Darft";
    $("#order_status").val(status);
    submit_order(this, (darft = true));
  }
}

$("body").on("click", ".btn-delete", function () {
  $(this).parents("tr").remove();
  get_order_type_lov();
});

$(document).on(
  "select2:select",
  '[data-special-id="customer-search"]',
  function (e) {
    console.log(e.params.data);
    var id = e.params.data.id;
    var customer_name = e.params.data.customer_name;
    var customer_number = e.params.data.customer_number;
    var main_customer_id = e.params.data.id;
    $("#customer_id").val(id);
    document.getElementById("main_cust").value = customer_name;
    document.getElementById("main_customer_number").value = customer_number;
    document.getElementById("main_customer_id").value = main_customer_id;

    axios
      .get(
        "/sales/get-acs-customer-data?caid=" +
          id +
          "&defs=" +
          localStorage.getItem("defs")
      )
      .then(function (res) {
        console.log(res);
        console.log(
          'IN THE .THEN FUNC OF data-special-id="customer-search" SELECT'
        );

        document.getElementById("ship_to_customer_infoo").innerHTML =
          '<div class="col-md-6"  style="border: 1px solid #d5d5d5;"><div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" style="margin-bottom:0px" hidden>Name :</label><span class="col-sm-8" hidden >' +
          res.data.hdr_ship_to.customer_name +
          '</span></div><div class=" row"><label class="col-sm-4"  for="name" style="margin-bottom:0px"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
          res.data.hdr_ship_to.account_number +
          ')" >' +
          res.data.hdr_ship_to.account_number +
          '</span></div> <div class=" row "><label class="col-sm-4"  for="name" style="margin-bottom:0px">Email :</label><span class="col-sm-8"  >' +
          res.data.hdr_ship_to.email_id +
          '</span></div><div class=" row "><label style="margin-bottom:0px" for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >' +
          res.data.hdr_ship_to.mob_no +
          '</span></div></div><div class="col-md-6" style="border: 1px solid #d5d5d5;"><label class="" style="">Ship to address: </label><p class="" >' +
          res.data.new_lines.filter(x=>x.site_use_code == 'SHIP_TO').filter(x=>x.primary_flag == 'Y')[0].address_full +
          "</p></div>";

        $("#shiptocust").val(res.data.hdr_ship_to.customer_name);
      })
      .catch((err) => {});
  }
);

var selected_customer;
$(document).on("select2:select", "#searchCust", function (e) {
  console.log(
    "INSIDEEEEEEEEEEEEEEEEEEEEEEEEEEEEE MAIN $(document).on('select2:select','#searchCust'"
  );
  // $('#v-form-detail').hide();
    ShowDIV()
  // blockDIV('#viewCust');
  // console.log(e.params.data);
  var id = e.params.data.id;
  var customer_name = e.params.data.customer_name;
  var customer_number = e.params.data.customer_number;
  var main_customer_id = e.params.data.id;
  $("#customer_id").val(id);
  document.getElementById("main_cust").value = customer_name;
  document.getElementById("main_customer_number").value = customer_number;
  document.getElementById("main_customer_id").value = main_customer_id;

  axios
    .get(
      "/sales/get-acs-customer-data?o="+glo_order_number+"&caid=" +
        id +
        "&defs=" +
        localStorage.getItem("defs")
    )
    .then(function (res) {
      HideDIV();
      //customer_infoo
      glo_customer_classification = res.data.customer_classification || "";
      if (res.data.customer_discount.length){
        var max_perc = res.data.customer_discount[0].max_discount_perc;
        $('#cust_discount_label').text(max_perc);
        $('#cust_discount').val(max_perc);
        $('#cust_discount').attr('value',max_perc);
        if (parseFloat(max_perc) > 0 ){
          $('.discount-btn').show();
        } else{
          $('.discount-btn').hide();

        }
      }

      document.getElementById("customer_infoo").innerHTML =
        '<div class="col-md-6" style="border: 1px solid #d5d5d5;"><div class="row" id="customer_infoo_tbl"><label for="name" class="col-sm-4" style="margin-bottom:0px" hidden>Name :</label><span hidden class="col-sm-8"  >' +
        res.data.hdr.customer_name + '<input id="bill-to-cust_account_id" value="'+res.data.hdr.cust_account_id+'"/>'+
        '</span></div><div class=" row"><label class="col-sm-4" style="margin-bottom:0px"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
        res.data.hdr.account_number +
        ')" >' +
        res.data.hdr.account_number +
        '</span></div> <div class=" row "><label class="col-sm-4" style="margin-bottom:0px"  for="name">Email :</label><span class="col-sm-8"  >' +
        res.data.hdr.email_id +
        '</span></div><div class="row"><label for="name" class="col-sm-4" style="margin-bottom:0px"> Mobile : </label><span class="col-sm-8" >' +
        res.data.hdr.mob_no +
        `</span></div></div><div class="col-md-6" style="border: 1px solid #d5d5d5;"><label class="" style="">Bill to address: </label> <p class="" >` +
        // `</span></div></div><div class="col-md-6" style="border: 1px solid #d5d5d5;"><label class="" style="">Bill to address: </label> Site: ${
        //             res.data.new_lines.filter(x=>x.site_use_code == 'BILL_TO').filter(x=>x.primary_flag == 'Y')[0].location
        // }<p class="" >` +
        res.data.new_lines.filter(x=>x.site_use_code == 'BILL_TO').filter(x=>x.primary_flag == 'Y')[0].address_full +
        `</p></div>`;
      $("#sel_cust").html(res.data.hdr.customer_name);

      //document.getElementById('selected_cust').innerHTML='<b> Customer Name :</b> '+res.data.hdr.customer_name+'<br>';

      //document.getElementById('selected_cust_account').innerHTML='<b> Customer Number :</b>'+ res.data.hdr.account_number+'<br>';

      // document.getElementById('selected_cust_email').innerHTML='<b> Customer Email :</b> '+res.data.hdr.email_id+'<br>';

      // document.getElementById('selected_cust_phone').innerHTML='<b> Customer Mobile :</b> '+res.data.hdr.mob_no;

      //console.log(res.data)
      selected_customer = res.data;

      //   for (var k in formDetails.data)
      //   {
      //   if (formDetails.data[k] == null)
      //   {
      //          formDetails.data[k] = '-';
      //   }
      //   }

      //http://lp00735/cust/get-customer-data?caid=3579
      $("#available_customer_address_div").removeClass("d-none");
      var out = "";
      for (var i = 0; i < res.data.lines_data.data.length; i++) {
        // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';

        // alert(res.data.lines_data.data[i][9])

        if (res.data.lines_data.data[i][9] == "SHIP_TO") {
          var $select = $("#customer");
          $select.empty();
          $select.append(
            "<option value=" +
              res.data.hdr_ship_to.cust_account_id +
              ">" +
              res.data.hdr_ship_to.customer_name +
              "</option>"
          );

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

          document.getElementById("ship_to_customer_infoo").innerHTML =
            '<div class="col-md-6" style="border: 1px solid #d5d5d5;"><div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" style="margin-bottom:0px" hidden>Name :</label><span class="col-sm-8" hidden >' +
            res.data.hdr_ship_to.customer_name +
            '</span></div><div class=" row"><label class="col-sm-4"  for="name" style="margin-bottom:0px"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
            res.data.hdr_ship_to.account_number +
            ')" >' +
            res.data.hdr_ship_to.account_number +
            '</span></div> <div class=" row "><label class="col-sm-4"  for="name" style="margin-bottom:0px">Email :</label><span class="col-sm-8"  >' +
            res.data.hdr_ship_to.email_id +
            '</span></div><div class=" row "><label style="margin-bottom:0px" for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >' +
            res.data.hdr_ship_to.mob_no +
            `</span></div></div><div class="col-md-6" style="border: 1px solid #d5d5d5;"><label class="" style="">Ship to address: </label> <p class="" >` +
            // `</span></div></div><div class="col-md-6" style="border: 1px solid #d5d5d5;"><label class="" style="">Ship to address: </label> Site: ${
            //             res.data.new_lines.filter(x=>x.site_use_code == 'SHIP_TO').filter(x=>x.primary_flag == 'Y')[0].location
            // }<p class="" >` +
            res.data.new_lines.filter(x=>x.site_use_code == 'SHIP_TO').filter(x=>x.primary_flag == 'Y')[0].address_full +
            `</p></div>`;

          $("#shiptocust").val(res.data.hdr_ship_to.customer_name);
        }

        if (res.data.lines_data.data[i][9] == "BILL_TO") {
          //alert(1)
          // console.log(res.data.lines_data.data[i])
          // alert(res.data.lines_data.data[i][12])

          var $select = $("#customer_bill");
          $select.html("");
          $select.append(
            "<option value=" +
              res.data.lines_data.data[i][14] +
              ">" +
              res.data.lines_data.data[i][12] +
              "</option>"
          );

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

          document.getElementById("bill_to_customer_infoo").innerHTML =
            '<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >' +
            res.data.hdr.customer_name +
            '</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
            res.data.hdr.account_number +
            ')" >' +
            res.data.hdr.account_number +
            '</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >' +
            res.data.hdr.email_id +
            '</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >' +
            res.data.hdr.mob_no +
            "</span></div>";

          $("#billtocust").val(res.data.hdr.customer_name);
        }

        // alert(123)
      }

      // document.getElementById('available_customer_address').innerHTML=out;
      // $('#available_customer_address').select2();
      //
      // alert(res.data.lines_data.data.length)
      // available_customer_address
      get_tax_();
      
      
    })
    .catch(function () {
      //$('#viewCust').unblock();
      // $('#v-form-detail').hide();
      HideDIV();
    });
});

var ship_to_customer_list = [];
$(document).on("select2:select", "#customer", function (e) {
  // $('#v-form-detail').hide();
  // $("#btn_confirm_cust").removeClass('d-none');
  //blockDIV('#viewCust');
  //console.log(e.params.data);
  var id = e.params.data.id;
  axios
    .get("/sales/get-acs-customer-data?caid=" + id)
    .then(function (res) {
      // alert(12)
      //console.log(res.data)

      //$('#viewCust').unblock();
      // $('#v-form-detail').show();
      var out = "";
      for (var i = 0; i < res.data.lines_data.data.length; i++) {
        //alert(1)
        // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';

        if (res.data.lines_data.data[i][9] == "SHIP_TO") {
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

          document.getElementById("ship_to_customer_infoo").innerHTML =
            '<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" style="margin-bottom:0px" hidden>Name :</label><span hidden class="col-sm-8"  >' +
            res.data.hdr_ship_to.customer_name +
            '</span></div><div class=" row"><label class="col-sm-4"  for="name" style="margin-bottom:0px"> Customer #: </label><span  style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
            res.data.hdr_ship_to.account_number +
            ')" >' +
            res.data.hdr_ship_to.account_number +
            '</span></div> <div class=" row "><label class="col-sm-4"  for="name" style="margin-bottom:0px">Email :</label><span>' +
            res.data.hdr_ship_to.email_id +
            '</span></div><div class=" row "><label for="name" class="col-sm-4" style="margin-bottom:0px"> Mobile : </label><span>' +
            res.data.hdr_ship_to.mob_no +
            "</span></div>";
          $("#shiptocust").val(res.data.hdr_ship_to.customer_name);
        }
        // alert(123)
      }
      get_tax_();
    })
    .catch(function () {
      //$('#viewCust').unblock();
      //$('#v-form-detail').hide();
    });
});

var out = "";
global_lov_order_type = "";

function get_order_type_lov() {
  // ShowDIV()
  $("#demo").collapse("show");
  //    $("#stock_view").addClass('col-sm-8')
  //    $("#stock_view").removeClass('col-sm-12')

  var defs = localStorage.getItem("defs");
  axios
    .get("/sales/get_order_type_lov_based_on_loc?loc_id=" + defs)
    .then(function (res) {
      res.data =   res.data.filter(x=>x.text.includes('-CA-')).concat( 
                      res.data.filter(x=>  {
                        if (x.text.includes('-CA-')||x.text.includes('-CAR') || x.text.includes('-CRR') || x.text.includes('-WCAR')){
                          return false;
                        }
                        return true; 
                      })   
                    );
      $("#order_type_lov_item_page").select2({
        data: res.data,
        dropdownParent: $("#order_type_lov_item_page").closest('div'),
      });
      setTimeout(() => {
        get_tax_();
      }, 1000);
      HideDIV();

      if (Object.keys(glo_order_det).includes('order_type')){

        
        $('#order_type_lov_item_page').val(glo_order_det.transaction_type_id).trigger('change');

          
        }

      if ($('#order_type_lov_item_page').select2('data')[0].text.includes("-CA-")){
          get_draft_data(true);
      }

      //refresh_reservation_details()
    })
    .catch(function () {
      // $('.card-body').unblock()

      HideDIV();
    });
}
function selected_line_type(a, order_header_type_id) {
  var x = a.id;
  cartArray = shoppingCart.listCart();
  var j = x;
  //JSON.stringify(cartArray)
  var inventory_id = cartArray[j].obj.inventory_item_id;
  var item_code = cartArray[j].obj.item_code;
  var uom = cartArray[j].obj.uom;
  var color = cartArray[j].obj.color;
  var all_data = localStorage.getItem("defs");
  var year = cartArray[j].obj.model_year;
  axios
    .get(
      "get_def_line_type?inventory_id=" +
        inventory_id +
        "&order_header_type_id=" +
        order_header_type_id +
        "&line_type_id=" +
        a.value +
        "&item_code=" +
        item_code +
        "&uom=" +
        uom +
        "&color=" +
        color +
        "&year=" +
        year +
        "&all_data=" +
        all_data
    )
    .then(function (res) {
      //alert(res.data.price)
      //$('#'+j+'-list-price').html(res.data);
      //table.cell( document.getElementById(j+'-list-price') ).data();
      if (res.data.price == null) {
        res.data.price = 0;
      }
      document.getElementById(j + "-list-price").innerHTML = Number(
        res.data.price
      ).toFixedRound(2);

      //document.getElementById(j+'-price').innerHTML=Number(res.data.price).toFixedRound(2);
      if (
        $("#" + j + "-price").val() == "undefined" ||
        $("#" + j + "-price").val() == 0 ||
        $("#" + j + "-price").val() == "0" ||
        $("#" + j + "-price").val() == "NaN"
      ) {
        $("#" + j + "-price").val(Number(res.data.price).toFixedRound(2));
      }

      document.getElementById(j + "-price").onblur();
      //var cell = table.cell( document.getElementById(j+'-list-price'));
      // cell.data(res.data.price).draw();

      var obj = cartArray[j].obj;
      obj["list_price"] = res.data.price;
      obj["line_price_list_id"] = res.data.list_header_id;
      obj["line_price_list_name"] = res.data.list_header_name;
      save_to_cart_custom(obj);

      //alert('#'+j+'-list-price')
      //console.log(res);
      //var status=save_item_and_price()

      //$('.show-cart').unblock()
    })
    .catch(function () {
      //  $('.show-cart').unblock()
      //console.log('exception _line price')
    });
}


$(document).on('select2:select','#order_type_lov_item_page',function(){
  // alert()
  get_tax_();
})

function refresh_reservation_details(update = false) {
  total_discount = 0;
  total_vat = 0;
  total_ = 0;
  $("#btn_order").prop("disabled", false);
  var order_header_type_id = $("#order_type_lov_item_page").val();

  if (order_header_type_id == null) {
    $("#btn_order").prop("disabled", true);
    toastr.error("selected order type");
  }

  var txt_header = $("#order_type_lov_item_page").select2("data")[0]["name"];
  var txt_val = $("#order_type_lov_item_page").val();
  shoppingCart.save_order_info("order_type_val", txt_val);
  shoppingCart.save_order_info("order_type_text", txt_header);

  var cartArray = shoppingCart.listCart();
  ShowDIV();

  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;
  axios
    .post("/sales/get_line_type_base_on_order_header", {
      sales_type_id:$('#selectSaleTypeId').val(),
      o_typ_hdr_id: order_header_type_id,
      defs: localStorage.getItem("defs"),
      cart: JSON.stringify(getCartDataForLineType()),
    })
    .then(function (res) {
      setTimeout(() => {
        HideDIV();
      }, 1500);
      inv_tot.leads = res.data.leads[0].data;
      inv_tot.order_category = res.data.order_category[0].data;
      get_selected_cust();

      itemLinesEntry.charge_groups = res.data.charge_groups;
      itemLinesEntry.source_org = res.data.source_org;

      if (itemLinesEntry.lines_data.length > 1){
        itemLinesEntry.lines_data.filter((x,i)=>i!=itemLinesEntry.lines_data.length-1).forEach((obj,j)=>{
          var unqiue_key = obj.inventory_item_id.toString() +JSON.parse(localStorage.defs).organization_id;
          var def_line_type_price = res.data.def_line_type_price.filter(x=>x.unique_cart_name == unqiue_key);
          res.data.data.forEach((x,i)=> {
              if (res.data.data[i].value == res.data.def_line_type_price[j].line_type_id && def_line_type_price.length){
                selected_line_type = res.data.data[i].value;
                selected_line_type_text = res.data.data[i].display;
                
                
              }
            });
            
          obj["selected_line_type"] = selected_line_type;
          obj["selected_line_type_text"] = selected_line_type_text;
          obj["list_price"] = obj["unit_price"].toString();
            
          obj["line_price_list_id"] = res.data.def_line_type_price[j].list_header_id;
          obj["line_price_list_name"] = res.data.def_line_type_price[j].list_header_name;


            




        });

        itemLinesEntry.setChargeGroup();
      }



      for (var j = 0; j < cartArray.length; j++) {
        // if(res.data.def_line_type_price[j].error!=""){
        //     toastr.error( res.data.def_line_type_price[j].error +' ' + cartArray[j].obj.item_code );
        //     $('#btn_order').prop('disabled', true);
        //     return;
        // }
        var out = "";
        const _customer_vat = $('#customer_vat').val() || 0
        for (var i = 0; i < res.data.data.length; i++) {
          if (
            cartArray[j].obj.name ==
              res.data.def_line_type_price[j].unique_cart_name &&
            res.data.def_line_type_price[j].line_type_id ==
              res.data.data[i].value
          ) {
            out +=
              "<option value=" +
              res.data.data[i].value +
              " selected>" +
              res.data.data[i].display +
              "</option>";
            selected_line_type = res.data.data[i].value;
            selected_line_type_text = res.data.data[i].display;
          } else {
            out +=
              "<option value=" +
              res.data.data[i].value +
              ">" +
              res.data.data[i].display +
              "</option>";
          }
        }

        if (
          $("#" + j + "-price").val() == "undefined" ||
          $("#" + j + "-price").val() == 0 ||
          $("#" + j + "-price").val() == "0" ||
          $("#" + j + "-price").val() == "NaN"
        ) {
          $("#" + j + "-price").val(
            Number(res.data.def_line_type_price[j].price).toFixedRound(2)
          );
        } else {
        }
        console.log(
          "res.data.def_line_type_price",
          res.data.def_line_type_price
        );
        var obj = cartArray[j].obj;
        console.log(obj);
        obj["line_type_html"] =
          '<select style="height: 24px;" id=' +
          j +
          ' disabled onchange="selected_line_type(this,' +
          order_header_type_id +
          ')">' +
          out +
          "</<select>";
        obj["selected_line_type"] = selected_line_type;
        obj["selected_line_type_text"] = selected_line_type_text;
        // obj['list_price']  =  res.data.def_line_type_price[j].price;
        obj["list_price"] = obj["list_price"].toString();
        obj["line_price_list_id"] =
          res.data.def_line_type_price[j].list_header_id;
        obj["line_price_list_name"] =
          res.data.def_line_type_price[j].list_header_name;
        obj["req_quantity"] = cartArray[j].count;
        obj["discount"] = $("#dis_val" + obj["item_code"]).val();


        obj['price'] = obj["list_price"] * obj["req_quantity"]

        const total_exc_vat = ((parseFloat(obj["list_price"])  * parseFloat(obj["req_quantity"])) - parseFloat(obj["discount"]))

        obj["line_vat"] = obj['vat']

        obj["line_total"] = parseFloat(obj["line_vat"]) + total_exc_vat;

        total_discount = +total_discount + +obj["discount"];
        total_vat = +total_vat + +obj["line_vat"];
        obj["total_vat"] = total_vat;
        obj["total_discount"] = total_discount;
        total_ = +total_ + +obj["line_total"];
        obj["total_"] = total_;
        obj["grand_total"] = total_;
        obj["total_excl"] = total_ - obj["total_vat"];
        obj["dp_req"] = 0;
        console.log('1367 pr cart item', obj);
        save_to_cart_custom(obj);
      }
      for (var j = 0; j < cartArray.length; j++) {
        var obj = cartArray[j].obj;
        obj["total_vat"] = total_vat;
        obj["total_discount"] = total_discount;
        obj["total_"] = total_;
        obj["grand_total"] = total_;
        obj["total_excl"] = total_ - obj["total_vat"];
      }
      $("#g_total").val(total_);
      if (update == false) {
        console.log("hello");
        displayCart();
      } else {
        displayCart((hide_remove_btn = ""), (update = true));
      }

      // get_tax_()
      //   for(var j=0;j<cartArray.length;j++)
      //   {
      //        // document.getElementById(j+'-price').onblur();
      //   }
      
      $('#total_disc_srsum').text($('#discount_amount_sum').text())
      $('#disocunt_sum_2').text($('#discount_amount_sum').text())
      // previewOrderDetail();

    })
    .catch(function (error) {
      HideDIV();
      // toastr.error("Unable to get order line type! ");

      if (update == false) {
        console.log("hello");
        displayCart();
      } else {
        displayCart((hide_remove_btn = ""), (update = true));
      }
      // previewOrderDetail()
      console.log(error);
    });
}

function order_header_change(thizz) {
  // alert(1);


  refresh_reservation_details();

  if ($('.discount-btn:visible').length == 0){

    if ($(thizz).select2('data')[0].text.includes('-CR-')){
      
      // $('#credit-order-get-bal-btn').removeClass('d-none');
      // get_draft_data();
      $('#customer_receipt').html("");
      
      // get_draft_data(false);
      
    } else {
      // $('#credit-order-get-bal-btn').addClass('d-none');
      // get_draft_data(true);
      
    }
  }
  


}

var bill_to_customer_list = [];

$('.nav-item').click(function() {
  $('[data-toggle="popover"]').popover('hide')
});


$(document).on("select2:select", "#number_bill", function (e) {
  // $('#v-form-detail').hide();

  //blockDIV('#viewCust');
  console.log(e.params.data);
  var id = e.params.data.id;
  axios
    .get("/sales/get-acs-customer-data?caid=" + id)
    .then(function (res) {
      // alert(12)
      console.log(res.data);

      // $('#viewCust').unblock();
      // $('#v-form-detail').show();
      var out = "";
      for (var i = 0; i < res.data.lines_data.data.length; i++) {
        // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';

        if (res.data.lines_data.data[i][9] == "BILL_TO") {
          bill_to_customer_list[0] = res.data.lines_data.data[i][11];
          bill_to_customer_list[1] = res.data.lines_data.data[i][2];
          var $select = $("#customer_bill");
          $select.html("");
          $select.append(
            "<option value=" +
              res.data.lines_data.data[i][12] +
              ">" +
              res.data.lines_data.data[i][12] +
              "</option>"
          );

          //  var $select = $('#number_bill');
          // $select.html('');
          //  $select.append("<option value="+res.data.lines_data.data[i][11]+">"+res.data.lines_data.data[i][11]/+"</option>");

          document.getElementById("location_bill").value =
            res.data.lines_data.data[i][10];

          //document.getElementById('number_bill').value=res.data.lines_data.data[i][11];

          document.getElementById("address_bill").value =
            res.data.lines_data.data[i][2];
          document.getElementById("address_2_bill").value =
            res.data.lines_data.data[i][3];
          document.getElementById("address_3_bill").value =
            res.data.lines_data.data[i][4];

          document.getElementById("area_bill").value =
            res.data.lines_data.data[i][6];
          document.getElementById("country_bill").value =
            res.data.lines_data.data[i][8];
        }
        // alert(123)
      }
      get_tax_();
    })
    .catch(function () {
      $("#viewCust").unblock();
      //$('#v-form-detail').hide();
    });
});

$(document).on("select2:select", "#number", function (e) {
  console.log(e.params.data);
  var id = e.params.data.id;
  axios
    .get("/sales/get-acs-customer-data?caid=" + id)
    .then(function (res) {
      // alert(12)
      console.log(res.data);

      var out = "";
      for (var i = 0; i < res.data.lines_data.data.length; i++) {
        if (res.data.lines_data.data[i][9] == "SHIP_TO") {
          ship_to_customer_list[0] = res.data.lines_data.data[i][11];
          ship_to_customer_list[1] = res.data.lines_data.data[i][2];

          var $select = $("#customer");
          $select.html("");
          $select.append(
            "<option value=" +
              res.data.lines_data.data[i][14] +
              ">" +
              res.data.lines_data.data[i][12] +
              "</option>"
          );

          document.getElementById("location").value =
            res.data.lines_data.data[i][10];

          //document.getElementById('number_bill').value=res.data.lines_data.data[i][11];

          document.getElementById("address").value =
            res.data.lines_data.data[i][2];
          document.getElementById("address_2").value =
            res.data.lines_data.data[i][3];
          document.getElementById("address_3").value =
            res.data.lines_data.data[i][4];

          document.getElementById("area").value =
            res.data.lines_data.data[i][6];
          console.log(res.data.lines_data.data[i]);
          alert(3);
          document.getElementById("country").value =
            res.data.lines_data.data[i][8];
        }
        // alert(123)
      }
    })
    .catch(function () {
      // $('#viewCust').unblock();
      // $('#v-form-detail').hide();
    });
});

$(document).on("select2:select", "#customer_bill", function (e) {
  //$('#v-form-detail').hide();

  //blockDIV('#viewCust');
  console.log(e.params.data);
  var id = e.params.data.id;
  axios
    .get("/sales/get-acs-customer-data?caid=" + id)
    .then(function (res) {
      // alert(12)
      console.log(res.data);

      // $('#viewCust').unblock();
      // $('#v-form-detail').show();
      var out = "";
      for (var i = 0; i < res.data.lines_data.data.length; i++) {
        // out+='<option value="'+res.data.lines_data.data[i][2]+'">'+res.data.lines_data.data[i][2]+'</option>';

        if (res.data.lines_data.data[i][9] == "BILL_TO") {
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

          document.getElementById("bill_to_customer_infoo").innerHTML =
            '<div class=" row" id="customer_infoo_tbl"> <label for="name" class="col-sm-4" >Name :</label><span class="col-sm-8"  >' +
            res.data.hdr.customer_name +
            '</span></div><div class=" row"><label class="col-sm-4"  for="name"> Customer #: </label><span  class="col-sm-8"   style="color: #007bff;text-decoration: none; background-color: transparent;cursor: pointer;" onclick="customer_history(' +
            res.data.hdr.account_number +
            ')" >' +
            res.data.hdr.account_number +
            '</span></div> <div class=" row "><label class="col-sm-4"  for="name">Email :</label><span class="col-sm-8"  >' +
            res.data.hdr.email_id +
            '</span></div><div class=" row "><label for="name" class="col-sm-4"> Mobile : </label><span class="col-sm-8" >' +
            res.data.hdr.mob_no +
            "</span></div>";

          $("#billtocust").val(res.data.hdr.customer_name);
        }
        // alert(123)
      }
    })
    .catch(function () {
      //$('#viewCust').unblock();
      // $('#v-form-detail').hide();
    });
});

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
  $("select.select2").select2({});


  // $('#customer_bill').select2({});
  // $('#customer').select2({});
  //$('#v-form-detail').hide();
  //get_order_type_lov();
});

function get_lov_customer_table() {
  axios
    .get("/sales/get_lov_onload")
    .then(function (res) {
      var data = res.data;
      // console.log(data)
      var out = "";
      //for (var i=0;i<data.length;i++)
      // {
      for (var j = 0; j < data[0].length; j++) {
        out += "<option value=" + data[0][j] + ">" + data[1][j] + "</option>";
      }
      document.getElementById("serach_based_on_type").innerHTML = out;
      $("#serach_based_on_type").select2();
      $("#customer_type_list").select2();
      $("#serach_based_on_type").val(data[0][1]).trigger("change");
      //}
    })
    .catch(function (error) {


    });
}
function getAddressDetails() {
  var formArray = [];
  var no = $(".address-area").length;
  for (i = 0; i < no; i++) {
    formArray.push(getFormData($($(".address-area")[i])));
  }
  console.log(formArray);
  return formArray;
}
var thiz;
function extraAddress() {
  // blockDIV('#address-box');
  $("select.select2").select2("destroy");
  var node = $("#address-field").clone();

  var id = parseInt(Math.random() * 1000);
  node.addClass("node" + id);
  $(".node" + id).hide();

  // add remove btn
  var html = $(node)
    .append(
      '<div class="col-sm-1">\
                                          <button class="btn btn-sm btn-danger" type="button" onclick="removeAddressField(this)">\
                                              <i class="ti-close"> Remove</i>\
                                          </button>\
                                      </div>'
    )
    .prop("outerHTML");
  $("#address-field").parent().append(html);
  $("#address-field").parent().append('<hr class="table-info">');

  $(".node" + id).hide();

  setTimeout(() => {
    for (key in addressLOV) {
      $('[name="' + key + '"]').select2({
        data: addressLOV[key].data,
        placeholder: addressLOV[key].placeholder,
      });
    }
    $("#address-box").unblock();
    $(".node" + id).slideDown("slow");
  }, 150);
}

function removeAddressField(t) {
  if (confirm("Are you sure you want to remove ?")) {
    console.log(t);
    $(t).closest(".address-area").next().remove(); // removes <hr>
    $(t).closest(".address-area").remove();
  }
}

// $(document).on('select2:open', () => {
//   document.querySelector('.select2-search__field').focus();
// });



function getFormData($form) {
  var unindexed_array = $form.serializeArray();
  var indexed_array = {};

  $.map(unindexed_array, function (n, i) {
    indexed_array[n["name"]] = n["value"];
  });

  return indexed_array;
}

var getDetOnceUsingCustID = false;
function reload_customer() {
  console.log(
    "INSIDE RELOAD CUSTOMERSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS"
  );

  $test = $("#searchCust").select2({
    dropdownParent:$("#searchCust").closest('div'),
    ajax: {
      url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
      dataType: "json",
      delay: 250,
      data: function (params) {
        if ($(".select2-results").find(".search-loader").length == 0) {
          $(".select2-results").append(
            '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
          );
        }
        var obj = {
          q: params.term, // search term
          type: document.getElementById("serach_based_on_type").value,
          page: params.page,
          cust_id_flag:!getDetOnceUsingCustID,
          type:'bill_to',
        }
        return obj;
      },
      processResults: function (data, params) {
        $(".search-loader").remove();
        
        params.page = params.page || 1;
        if (!getDetOnceUsingCustID && window.location.search.includes('order_number=')){
          setTimeout(function() { $('.select2-results__option:nth(0)').trigger("mouseup"); }, 2000);
          getDetOnceUsingCustID = true;
          
        }

        return {
          results: data.items,
          pagination: {
            more: params.page * 30 < data.total_count,
          },
        };
      },
      cache: true,
    },
    placeholder: "Search for a customer",
    minimumInputLength: 3,
    templateResult: formatRepo,
    templateSelection: formatRepoSelection,
    //   dropdownAutoWidth : true
  });
}

$test = $("#searchCust").select2({
  dropdownParent:$("#searchCust").closest('div'),
  ajax: {
    url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
    dataType: "json",
    delay: 250,
    data: function (params) {
      if ($(".select2-results").find(".search-loader").length == 0) {
        $(".select2-results").append(
          '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
        );
      }
      var obj = {
        q: params.term, // search term
        type: document.getElementById("serach_based_on_type").value,
        page: params.page,
        cust_id_flag:window.location.search.includes('order_number=')?  !getDetOnceUsingCustID : false,
        type:'BILL_TO',
      }
      return obj;
    },
    processResults: function (data, params) {
      $(".search-loader").remove();
      
      params.page = params.page || 1;
      if (!getDetOnceUsingCustID && window.location.search.includes('order_number=')){
        
        setTimeout(function() { $('.select2-results__option:nth(0)').trigger("mouseup"); }, 2000);
        getDetOnceUsingCustID = true;

      }

      return {
        results: data.items,
        pagination: {
          more: params.page * 30 < data.total_count,
        },
      };
    },
    cache: true,
  },
  placeholder: "Search for a customer",
  minimumInputLength: 3,
  templateResult: formatRepo,
  templateSelection: formatRepoSelection,
  //   dropdownAutoWidth : true
});

$test.select2("val", ["test1", "test2"], true);

$("#customer").select2({
  dropdownParent:$("#customer").closest('div'),
  ajax: {
    url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
    dataType: "json",
    delay: 250,
    data: function (params) {
      if ($(".select2-results").find(".search-loader").length == 0) {
        $(".select2-results").append(
          '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
        );
      }
      return {
        q: params.term, // search term
        type: document.getElementById("serach_based_on_type").value,
        page: params.page,
        type: 'SHIP_TO',
      };
    },
    processResults: function (data, params) {
      $(".search-loader").remove();

      params.page = params.page || 1;
      // setTimeout(function() { $('.select2-results__option:visible:nth(0)').trigger("mouseup"); }, 2000);

      return {
        results: data.items,
        pagination: {
          more: params.page * 30 < data.total_count,
        },
      };
    },
    cache: true,
  },
  placeholder: "ship to customer",
  minimumInputLength: 1,
  templateResult: formatRepo,
  templateSelection: formatRepoSelection,
});
$("#number_bill").select2({
  ajax: {
    url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
    dataType: "json",
    delay: 250,
    data: function (params) {
      if ($(".select2-results").find(".search-loader").length == 0) {
        $(".select2-results").append(
          '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
        );
      }
      return {
        q: params.term, // search term
        type: "CUSTOMER_NUMBER",
        page: params.page,
      };
    },
    processResults: function (data, params) {
      $(".search-loader").remove();

      params.page = params.page || 1;

      return {
        results: data.items,
        pagination: {
          more: params.page * 30 < data.total_count,
        },
      };
    },
    cache: true,
  },
  placeholder: "Search for a customer",
  minimumInputLength: 1,
  //templateResult: formatRepo,
  // templateSelection:formatRepoSelection_number_bill
});

$("#number").select2({
  ajax: {
    url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
    dataType: "json",
    delay: 250,
    data: function (params) {
      if ($(".select2-results").find(".search-loader").length == 0) {
        $(".select2-results").append(
          '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
        );
      }
      return {
        q: params.term, // search term
        type: "CUSTOMER_NUMBER",
        page: params.page,
      };
    },
    processResults: function (data, params) {
      $(".search-loader").remove();

      params.page = params.page || 1;

      return {
        results: data.items,
        pagination: {
          more: params.page * 30 < data.total_count,
        },
      };
    },
    cache: false,
  },

  placeholder: "Search for a customer",
  minimumInputLength: 1,
  // templateResult:formatRepo,
  // templateSelection: formatRepoSelection_number_bill
});

$("#customer_bill").select2({
  ajax: {
    url: "/sales/search-customers?defs=" + localStorage.getItem("defs"),
    dataType: "json",
    delay: 250,
    data: function (params) {
      if ($(".select2-results").find(".search-loader").length == 0) {
        $(".select2-results").append(
          '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
        );
      }
      return {
        q: params.term, // search term
        type: "CUSTOMER_NAME",
        page: params.page,
      };
    },
    processResults: function (data, params) {
      $(".search-loader").remove();

      params.page = params.page || 1;

      return {
        results: data.items,
        pagination: {
          more: params.page * 30 < data.total_count,
        },
      };
    },
    cache: true,
  },
  placeholder: "Bill to  customer",
  minimumInputLength: 1,
  templateResult: formatRepo,
  templateSelection: formatRepoSelection,
});

function formatRepoSelection_number_bill(repo) {
  return repo.id;
}

function update(a) {
  $(".select2-results__options .select2-results__option").each(function () {
    // alert();
    console.log("12341234123412341234123412341234");
    var str = a;
    if ($(this).html().toLowerCase().indexOf(str) > -1) {
      var s = $(this).html().toLowerCase();
      var start = s.indexOf(str);
      var end = start + str.length;
      var html =
        $(this).html().slice(0, start) +
        '<span class="font-weight-bold">' +
        $(this).html().slice(start, end) +
        "</span>" +
        $(this).html().slice(end);
      // alert(html)
      $(this).html(html);
    }
  });
}


var glo_last_typed_select2_text = "";

$(document).on('keyup keydown input','input.select2-search__field',function(){
  glo_last_typed_select2_text = this.value;
})

function formatRepo(repo) {
  console.log(this);
  console.log(repo);
  if (repo.loading) {
    return "Searching for customer...";
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
            <td>' +
    repo.customer_name +
    '</td>\
        </tr>\
        <tr>\
        <th class="small" scope="row">Customer No:</th>\
        <td>' +
    repo.customer_number +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Telephone No:</th>\
            <td>' +
    repo.default_phone_no +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Email:</th>\
            <td>' +
    repo.email_address +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Mobile No:</th>\
            <td>' +
    repo.default_mobile_no +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Additional Email:</th>\
            <td>' +
    repo.additional_email_address +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">Additional No:</th>\
            <td>' +
    repo.additional_mobile_no +
    '</td>\
        </tr>\
        <tr>\
            <th class="small" scope="row">TRN No:</th>\
            <td>' +
    repo.trn_number +
    "</td>\
        </tr>\
    </table>";

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

  var str =glo_last_typed_select2_text;
  //  // alert(str)
  // //   alert($container)
  str = str.toUpperCase().trim();
  str_arr = str.split(" ");
  for (var i = 0; i < str_arr.length; i++) {
    str = str_arr[i];
    if (str != "") {
      $container = $container.replaceAll(
        str,
        "<span class='font-weight-bold' style='color: yellow;'>" +
          str +
          "</span>"
      );
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

function markMatch(text, term) {
  // Find where the match is
  var match = text.toUpperCase().indexOf(term.toUpperCase());

  var $result = $("<span></span>");

  // If there is no match, move on
  if (match < 0) {
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

function formate_number(a) {
  var num = Number(a).toFixedRound(2);
  var str = parseFloat(num).toLocaleString();
  return str;
}
function formate_ref_number(a) {
  var num = a.replace(/\D/g, "");
  return num;
}

function formatRepoSelection(repo) {
  return repo.text || repo.customer_name;
  return repo.text || repo.email;
  return repo.text || repo.email;
}

function displayCart(hide_remove_btn = "", update = false) {
  
  var cartArray = shoppingCart.listCart();
  console.log("***********************************");
  console.log(update);
  console.log(shoppingCart.listCart());
  console.log("***********************************");
  if ($.fn.DataTable.isDataTable(".show-cart")) {
    $(".show-cart").DataTable().clear().draw();
  }
  if (cartArray.length == 0) {
    $("#show-cart-parent_div").html("");
    $("#show-cart-parent_div").html(
      '<table class="table table-sm table-bordered text-sm mt-2 mb-0 text-nowrap show-cart" id="show-cart"></table>'
    );
    $(".show-cart").html();
    $(".cart-tot").remove();
    $(".show-cart").after('<h4 class="cart-zero">Cart is empty.</h4>');
    $(".total-count").html(shoppingCart.totalCount());
    inv_tot.t = 0;
    inv_tot.td = 0;
    inv_tot.tv = 0;
    inv_tot.gt = 0;
    return;
  }
  $(".total-count").html(shoppingCart.totalCount());
  $("#show-cart-parent_div").html(
    '<table class="table table-sm table-bordered text-sm mt-2 mb-0 text-nowrap show-cart" id="show-cart" style="    width: 100%;"></table>'
  );

  $(".show-cart").html("");
  $(".show-cart").append(
    '<thead><tr class="font-weight-normal">\
        <td colspan="7" style="border-top: unset; border:none;"></td>\
        <td style="border: 1px solid #17a2b861;font-size: 15px; font-weight: 400;" id="gross_amount_sum_preview">0.0</td>\
        <td style="border: 1px solid #17a2b861;font-size: 15px; font-weight: 400;" id="discount_amount_sum_preview">0.0</td>\
        <td style="border: 1px solid #17a2b861;font-size: 15px; font-weight: 400;" id="total_discount_percentage_preview">0.00%</td>\
        <td style="border: 1px solid #17a2b861;font-size: 15px; font-weight: 400;" id="grand_val2_preview">0.0</td>\
        <td style="border: 1px solid #17a2b861;font-size: 15px; font-weight: 400;" id="grand_line_total2_preview">0.0</td>\
        <td colspan="2" style="border-top: unset; border:none;"></td>\
    </tr>\
    <tr>\
              <td>No #</td>\
              <td>Barcode</td>\
              <td>Item Code</td>\
              <td>Item Desc</td>\
              <td>UOM</td>\
              <td>Qty</td>\
              <td>Unit Price</td>\
              <td>Gross Amount</td>\
              <td>Discount</td>\
              <td>Discount Perc	</td>\
              <td>VAT</td>\
              <td>Line Total</td>\
              <td style="display:none">Line Type</td>\
              <td>Info</td>\
          </tr>\
      </thead><tbody>'
  );
  var output = "";
  var last_line;
  $("#selected_item").html(" ");
  stylehide_btn_remove = "";
  if (hide_remove_btn == 1) {
    stylehide_btn_remove = 'style="display:none"';
  }
  for (var i in cartArray) {
    var fisher_man = $("#cust_disc_perc").val();
    if (fisher_man > 0) {
      if (cartArray[i].obj.list_price == cartArray[i].obj.price) {
        var price = cartArray[i].obj.list_price;
        cartArray[i].obj.price = price - price * (fisher_man / 100);
      }
    }
    var line_number = +i + +1;
    if (cartArray[i].obj.onhand_qty <= 0) {
      output +=
        "<tr style='color:red'  id=" +
        cartArray[i].obj.inventory_item_id +
        ">\
                          <td>" +
        line_number +
        "</td>\
                          <td >" +
        cartArray[i].obj.barcode +
        "</td>\
                          <td>" +
        cartArray[i].obj.item_code +
        "</td>\
                          <td>" +
        cartArray[i].obj.e.description +
        "</td>\
                          <td>" +
        cartArray[i].obj.uom +
        "</td>\
                          <td style='width: 0px'>\
                          <div class='input-group' style='width: 110px;'><button class='minus-item input-group-addon btn btn-primary' readonly  style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;'  data-name='" +
        cartArray[i].obj.name +
        "'>-</button><input class='form-control form-control-sm' readonly  id='" +
        i +
        "-quantity' style='  width:59%;text-align: right;'  class='item-count' data-onhand-qty=" +
        cartArray[i].obj.onhand_qty +
        "  data-name='" +
        cartArray[i].obj.name +
        "' value='" +
        cartArray[i].count +
        "'     oonblur='on_quantity_change(this," +
        i +
        ")'    ><button class='plus-item btn btn-primary input-group-addon' data-name='" +
        cartArray[i].obj.name +
        "'        style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;' >+</button>\
                          </div>\
                          </td>\
                          <td id='" +
        i +
        "-list-price' class='list_prices' style='    text-align: right;' readonly>" +
        Number(cartArray[i].obj.list_price).toFixedRound(2) +
        "</td>\
                          <td  style='    text-align: right;    width: 80px;' ><input class='form-control form-control-sm' readonly  data-from-org-name='" +
        cartArray[i].obj.from_org_name +
        "'  id='" +
        i +
        "-price' class='entered_price'  data-serial-number='" +
        cartArray[i].obj.organization_id +
        "'      data-inventry-id='" +
        cartArray[i].obj.inventory_item_id +
        "'   oonblur='price_enter_change(this," +
        i +
        ")'     value='" +
        parseFloat(cartArray[i].obj.price).toFixedRound(2) +
        "'   /></td>\
                          <td  id='" +
        i +
        "' data-special-id='preview-discount-line-"+cartArray[i].obj.item_code+"' class=''  style='text-align: right;'>" +
        Number(cartArray[i].obj.discount).toFixedRound(2) +
        "</td>\
        <td id='"+i+"' data-special-id='preview-discount-perc-line-"+cartArray[i].obj.item_code+"' class='' style='text-align: right;'>" +
        Number(((cartArray[i].obj.discount)/parseFloat(cartArray[i].obj.price))*100).toFixedRound(2) +
        "</td>\
        <td id='" +
        i +
        "-line-vat' style='    text-align: right;'  class='vat'>" +
        Number(cartArray[i].obj.line_vat).toFixedRound(2) +
        "</td>\
                          <td id='" +
        i +
        "-line-total' style='text-align: right;' class='line_t'   >" +
        Number(cartArray[i].obj.line_total).toFixedRound(2) +
        "</td>\
                          <td  id='" +
        i +
        "-line-charges' style='display:none'   class='line_charges' ></td>\
                          <td  style='display:none'  id='" +
        i +
        "-line-type' >  " +
        cartArray[i].obj.line_type_html +
        "</td><td><button type='button' class='btn btn-danger d-none' id='line-error-"+cartArray[i].obj.item_code+"' data-toggle='popover' title='Line Error' data-content=''><i class='right fas fa-info'></i></button></td></tr>";
    } else {
      output +=
        "<tr  id=" +
        cartArray[i].obj.inventory_item_id +
        ">\
                          <td>" +
        line_number +
        "</td>\
                          <td >" +
        cartArray[i].obj.barcode +
        "</td>\
                          <td>" +
        cartArray[i].obj.item_code +
        "</td>\
                          <td>" +
        cartArray[i].obj.e.description +
        "</td>\
                          <td>" +
        cartArray[i].obj.uom +
        "</td>\
                          <td style='width: 0px'>\
                          <div class='input-group' style='width: 110px;'><button class='minus-item input-group-addon btn btn-primary'  style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;'  data-name='" +
        cartArray[i].obj.name +
        "'>-</button><input class='form-control form-control-sm' readonly  id='" +
        i +
        "-quantity' style='  width:59%;text-align: right;'  class='item-count' data-onhand-qty=" +
        cartArray[i].obj.onhand_qty +
        "  data-name='" +
        cartArray[i].obj.name +
        "' value='" +
        cartArray[i].count +
        "' item_code ='" +
        cartArray[i].obj.item_code +
        "'     oonblur='on_quantity_change(this," +
        i +
        ")'     ><button class='plus-item btn btn-primary input-group-addon' data-name='" +
        cartArray[i].obj.name +
        "'        style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;' >+</button>\
                          </div>\
                          </td>\
                          <td id='" +
        i +
        "-list-price' class='list_prices' style='    text-align: right;' readonly>" +
        Number(cartArray[i].obj.list_price).toFixedRound(2) +
        "</td>\
                          <td  style='    text-align: right;    width: 80px;' ><input class='form-control form-control-sm'  data-from-org-name='" +
        cartArray[i].obj.from_org_name +
        "'  id='" +
        i +
        "-price' class='entered_price'  data-serial-number='" +
        cartArray[i].obj.organization_id +
        "'      data-inventry-id='" +
        cartArray[i].obj.inventory_item_id +
        "' readonly   oonblur='price_enter_change(this," +
        i +
        ")'     value='" +
        parseFloat(cartArray[i].obj.price).toFixedRound(2) +
        "'   /></td>\
        <td id='"+i+"' data-special-id='preview-discount-line-"+cartArray[i].obj.item_code+"' class='' style='text-align: right;'>" +
        Number(cartArray[i].obj.discount).toFixedRound(2) +
        "</td>\
        <td id='"+i+"' data-special-id='preview-discount-perc-line-"+cartArray[i].obj.item_code+"' class='' style='text-align: right;'>" +
        Number(((cartArray[i].obj.discount)/parseFloat(cartArray[i].obj.price))*100).toFixedRound(2) +
        "</td>\
                          <td id='" +
        i +
        "-line-vat' style='text-align: right;'  class='vat'>" +
        Number(cartArray[i].obj.line_vat).toFixedRound(2) +
        "</td>\
                          <td id='" +
        i +
        "-line-total' style='text-align: right;' class='line_t'   >" +
        Number(cartArray[i].obj.line_total).toFixedRound(2) +
        "</td>\
                          <td  id='" +
        i +
        "-line-charges' style='display:none'   class='line_charges' ></td>\
                          <td  style='display:none'  id='" +
        i +
        "-line-type' >  " +
        cartArray[i].obj.line_type_html +
        "</td><td><button type='button' class='btn btn-danger d-none' id='line-error-"+cartArray[i].obj.item_code+"' data-toggle='popover' title='Line Error' data-content=''><i class='right fas fa-info'></i></button></td></tr>";
      // <td>" + cartArray[i].total + "</td>\
    }

    $("#selected_item").append(
      +i + +1 + " : " + cartArray[i].obj.item_code + "<br>"
    );
  }
  $(".show-cart").append(output + "</tbody>");
  // if(update==true){
  //     for(var i in cartArray){
  //         tr_id = cartArray[i].obj.inventory_item_id
  //         old_tr = $("#"+tr_id).attr('id')
  //         if(tr_id == old_tr){
  //             $("#"+tr_id).remove()
  //         }
  //     }
  // }
  // $('#sp_product_id').prepend(output);

  var total_sum = 0;

  for (var i in cartArray) {
    if (cartArray[i].obj.price < cartArray[i].obj.list_price) {
      var eee =
        "Selling price of the item in line number" +
        (parseInt(i) + 1 + " is less then list price  ");
      line_popover_error(
        cartArray[i].obj.inventory_item_id + cartArray[i].obj.barcode,
        eee,
        i
      );
      $(
        "#" + cartArray[i].obj.inventory_item_id + cartArray[i].obj.barcode
      ).css("background-color", "rgb(255, 214, 204)");
      $(
        "." + cartArray[i].obj.inventory_item_id + cartArray[i].obj.barcode
      ).html("&#9432;");
      $(
        "." + cartArray[i].obj.inventory_item_id + cartArray[i].obj.barcode
      ).css("background-color", "red");
      $(
        "." + cartArray[i].obj.inventory_item_id + cartArray[i].obj.barcode
      ).css("display", "initial");
    }
    total_sum = Number(total_sum) + Number(cartArray[i].obj.list_price);
  }
  console.log(total_sum);
  $("#g_total").val(total_sum);
  $(".cart-zero").remove();
  $(".cart-tot").remove();
  console.log(sum_total(".item-count"));
  sum_total(".item-count");
  sum_total(".disc_sr", "yes", "yes");
  sum_total(".vat", "yes");
  sum_total(".line_t", "yes");
  sum_total(".line_charges", "yes");
  get_selected_cust();
  // $('#disocunt_sum_2').text($('#total_disc_srsum').text())

  $('#gross_amount_sum_preview').html($('#gross_amount_sum').html())
  $('#discount_amount_sum_preview').html($('#discount_amount_sum').html())
  $('#total_discount_percentage_preview').html($('#total_discount_percentage').html()) 
  $('#grand_val2_preview').html($('#grand_val2').html()) 
  $('#grand_line_total2_preview').html($('#grand_line_total2').html()) 




}

// function displayCart(hide_remove_btn='')
// {
//   console.log("displayCart")

//     var cartArray = shoppingCart.listCart();
//     //stepsCompnent.tab1.count = shoppingCart.totalCount();

//     if ( $.fn.DataTable.isDataTable('.show-cart') )
//     {

//      // $('.show-cart').DataTable().destroy();
//       $('.show-cart').DataTable().clear().draw();
//       //$('.show-cart').DataTable().destroy(true);

//     }

//     if (cartArray.length == 0)
//     {

//       $('#show-cart-parent_div').html('');
//       $('#show-cart-parent_div').html('<table class="table table-sm table-bordered text-sm mt-2 mb-0 text-nowrap show-cart" id="show-cart"></table>');

//       $('.show-cart').html();
//       $('.cart-tot').remove();
//       $('.show-cart').after('<h4 class="cart-zero">Cart is empty.</h4>');
//       $('.total-count').html(shoppingCart.totalCount());
//       inv_tot.t = 0;
//       inv_tot.td =0;
//       inv_tot.tv =0;
//       inv_tot.gt = 0;

//       return;
//     }
//     $('#show-cart-parent_div').html('<table class="table table-sm table-bordered text-sm mt-2 mb-0 text-nowrap show-cart" id="show-cart" style="    width: 100%;"></table>');

//     $('.show-cart').html('');

//     $('.show-cart').append('<thead><tr>\
//                                   <td colspan="6"><a type="button" id="btnaddd" class="btn btn-sm btn-primary rounded-0" href="#collapseOne" style="    float: left;line-height: 13px;">Add Items</a></td>\
//                                   <td class="item-countsum right"></td>\
//                                   <td class="list_pricessum right"></td>\
//                                   <td class="entered_pricesum right"></td>\
//                                   <td  class="disc_srsum right"></td>\
//                                   <td class="vatsum right"></td>\
//                                   <td class="line_tsum right"></td>\
//                                   <td  style="display:none"></td>\
//                                   <td style="display:none"></td>\
//                                   <td ></td>\
//                               </tr>\
//                               <tr>\
//                                   <td>No #</td>\
//                                   <td >Barcode</td>\
//                                   <td>Item Code</td>\
//                                   <td >Item Desc</td>\
//                                   <td>UOM</td>\
//                                    <td>Avl Qty</td>\
//                                   <td>Ordered Qty</td>\
//                                   <td>List Price</td>\
//                                   <td>Selling Price</td>\
//                                   <td>Discount / <br>Surcharge</td>\
//                                   <td>VAT</td>\
//                                   <td>Line Total</td>\
//                                   <td style="display:none">Line Type</td>\
//                                   <td ></td>\
//                               </tr>\
//                           </thead><tbody>');

//     var output = "";

//     var last_line;
//     $('#selected_item').html(' ');
//     stylehide_btn_remove='';
//     if(hide_remove_btn==1)
//     {
//           stylehide_btn_remove='style="display:none"';
//     }
//          for(var i in cartArray)
//        {

//        //   cartArray[i].obj.price

//        var fisher_man=$('#cust_disc_perc').val()

//        if (fisher_man > 0)
//        {

//           if (cartArray[i].obj.list_price== cartArray[i].obj.price)
//           {

//               var price =cartArray[i].obj.list_price;
//               cartArray[i].obj.price= price - (price * (fisher_man/100));

//           }

//        }

//       var line_number=+i + +1;
//       output += "<tr  id="+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode+">\
//                         <td>" + line_number +"</td>\
//                         <td >" + cartArray[i].obj.barcode + "</td>\
//                         <td>" + cartArray[i].obj.item_code + "</td>\
//                         <td>" + cartArray[i].obj.e.description + "</td>\
//                         <td>" + cartArray[i].obj.uom + "</td>\
//                         <td>" + cartArray[i].obj.onhand_qty + "</td>\
//                         <td>\
//                         <div class='input-group' style='width: 110px;'><button class='minus-item input-group-addon btn btn-primary'  style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;'  data-name='" + cartArray[i].obj.name + "'>-</button><input type='number'  id='"+i+"-quantity' style='  width:59%;text-align: right;'  class='item-count' data-onhand-qty="+cartArray[i].obj.onhand_qty+"  data-name='" + cartArray[i].obj.name  + "' value='" + cartArray[i].count + "'     onblur='on_quantity_change(this,"+i+")'    ><button class='plus-item btn btn-primary input-group-addon' data-name='" + cartArray[i].obj.name + "'        style='width: 20px;line-height: 20px;margin-right: 2px; padding: 0px;' >+</button>\
//                         </div>\
//                         </td>\
//                         <td id='"+i+"-list-price' class='list_prices' style='    text-align: right;' readonly>" + cartArray[i].obj.list_price + "</td>\
//                         <td  style='    text-align: right;    width: 80px;' ><input type='number'  data-from-org-name='"+cartArray[i].obj.from_org_name+"'  id='"+i+"-price' class='entered_price'  data-serial-number='"+cartArray[i].obj.organization_id+"'      data-inventry-id='"+cartArray[i].obj.inventory_item_id+"'   onblur='price_enter_change(this,"+i+")'     value='"+(parseFloat(cartArray[i].obj.price)).toFixedRound(2)    +"'   /></td>\
//                         <td  id='"+i+"-discount'   class='disc_sr'  style='    text-align: right;'>"+Number(cartArray[i].obj.discount).toFixedRound(2)+" </td>\
//                         <td id='"+i+"-line-vat' style='    text-align: right;'  class='vat'>"+Number(cartArray[i].obj.line_vat).toFixedRound(2)+"</td>\
//                         <td id='"+i+"-line-total' style='text-align: right;' class='line_t'   >"+Number(cartArray[i].obj.line_total).toFixedRound(2)+"</td>\
//                         <td  id='"+i+"-line-charges' style='display:none'   class='line_charges' ></td>\
//                         <td  style='display:none'  id='"+i+"-line-type' >  "+cartArray[i].obj.line_type_html+"</td>\
//                         <td style='width: 100px'><button class='delete-item btn btn-sm btn-danger' style='     margin-right: 10px;'  "+stylehide_btn_remove+"  data-name="+cartArray[i].obj.name + ">X</button><button   style='display:none;background-color:transparent; font-size: 11px;color: white;padding: 7px 7px;' class="+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode+" id='blink-bg'></button></td>\
//                         </tr>";
//                       // <td>" + cartArray[i].total + "</td>\
//       //   last_line="<tr>\
//       //                 <td ></td>\
//       //                 <td></td>\
//       //                 \
//       //                 <td></td>\
//       //                 <td></td>\
//       //                 <td></td>\
//       //                 <td  id='total_line_req_qty' style='text-align: right;'> </td>\
//       //                 <td id='total_line_list_price' style='text-align: right;'></td>\
//       //                 <td  id='total_line_entered_price' style='text-align: right;'></td>\
//       //                 <td id='total_line_discount' style='text-align: right;'></td>\
//       //                 <td id='total_line_vat' style='text-align: right;'></td>\
//       //                 <td id='total_line_total' style='text-align: right;'></td>\
//       //                 <td ></td>\
//       //                 <td></td>\
//       //                 </tr>";

//                  $('#selected_item').append(+i + +1 +' : ' +cartArray[i].obj.item_code+'<br>')
//       }
//     //$('.show-cart').prepend(output+last_line+'</tbody>');
//     $('.show-cart').prepend(output+'</tbody>');

//     for(var i in cartArray)
//     {

//       if (cartArray[i].obj.price    < cartArray[i].obj.list_price )
//       {
//           //var eee='Below list price for item  at line number '+ (parseInt(i)   +1) +'';
//           var eee='Selling price of the item in line number'+   (parseInt(i) + 1+' is less then list price  ');

//           line_popover_error(cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode,eee,i);

//           console.log(cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode)
//           $('#'+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode).css("background-color", "rgb(255, 214, 204)");

//           $('.'+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode).html('&#9432;');

//           $('.'+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode).css("background-color", "red");

//           $('.'+cartArray[i].obj.inventory_item_id+cartArray[i].obj.barcode).css("display", "initial");

//       }

//     }

//     if ( $.fn.DataTable.isDataTable('.show-cart') )
//     {

//      // $('.show-cart').DataTable().destroy();

//     // $('.show-cart').DataTable().clear().draw();

//     }
//     else
//     {

//       // show_cart_data_tble = $('.show-cart').DataTable( {
//       //         "paging":   false,
//       //         "ordering": false,
//       //         "info":     false,
//       //         "searching": false
//       //     })

//     }

//     $('.cart-zero').remove();
//     $('.cart-tot').remove();
//    // refresh_reservation_details()

//     sum_total('.item-count');
//     //sum_total('.list_prices','yes')  ;
//     //sum_total('.entered_price');
//     sum_total('.disc_sr','yes','yes');
//     sum_total('.vat','yes');
//     sum_total('.line_t','yes');
//     sum_total('.line_charges','yes');
//     get_selected_cust()
//     //displayCart()

//   //   $('.show-cart').after('<div class="cart-tot" class="pull-right">Total price: AED <span class="total-cart">'+shoppingCart.totalCart()+'</span></div>');
//   // //   $('.total-cart').html(shoppingCart.totalCart());
//   //  $('.total-count').html(shoppingCart.totalCount());
// //HideDIV();
// }

var show_cart_data_tble;
var abcdef = 0;
function check_btn(thiz) {
  console.log("check_btn");
  if (abcdef == 0) {
    check(true);
    //$(thiz).html('Uncheck All');
    abcdef = 1;
  } else {
    abcdef = 0;
    check(false);
    $(thiz).html("check All");
  }

  get_selected_cust();
}
function check(checked = true) {
  const cbs = document.querySelectorAll('input[name="print_charges"]');
  cbs.forEach((cb) => {
    cb.checked = checked;
  });
}

function sum_total(id_or_class, html_val = "n", disc_sr = "n") {
  var a = document.querySelectorAll(id_or_class);
  var sum_a = 0;
  var sum_a_disc = 0;
  for (var i = 0; i < a.length; i++) {
    if (html_val == "yes") {
      if (disc_sr == "yes") {
        if (Math.sign(a[i].innerHTML) > 0) {
          sum_a = +sum_a + +a[i].innerHTML;
        } else {
          sum_a_disc = sum_a_disc - a[i].innerHTML;
        }
      } else {
        sum_a = +sum_a + +a[i].innerHTML;
      }
    } else {
      sum_a = +sum_a + +a[i].value;
    }
  }
  if (disc_sr == "yes") {
    $(id_or_class + "sum").html(
      sum_a_disc.toFixedRound(2)
    );
  } else {
    $(id_or_class + "sum").html(sum_a.toFixedRound(2));
  }
}
var thizzzz = "";

function expandhdr(thizz) {
  try {
    var main_customner_name =
      $("#searchCust").select2("data")[0]["customer_name"];
  } catch (ex) {
    // toaster_create("customer not selected");
    HideDIV();
    return;
  }

  thizzzz = thizz;
  // var clickedDT = $($(thizz).closest('tr')).closest('table').DataTable();
  //var rowData= clickedDT.row($(thizz).closest('tr')).data();
  //var tr = $(thizz).closest('tr');
  //alert(tr)
  // var tr_id=tr[0].id;
  var tr_id = $(thizzzz).attr("data-id");
  //alert(tr_id)
  var row = show_cart_data_tble.row("#" + tr_id);
  console.log(row);
  //var row = clickedDT.row(tr);
  //var tdi = tr.find("i.fa-plus");
  var uid = tr_id;
  //alert($(thizz).attr('class'))

  if ($(thizz).attr("class") == "fa fa-minus") {
    $("." + thizz.dataset.id)
      .first()
      .css("display", "none");
    $(thizz).removeClass("fa-minus").addClass("fa-plus");
  } else {
    //alert('c')
    //   alert($('.'+thizz.dataset.id).children().length )
    if ($("." + thizz.dataset.id).children().length > 0) {
      // alert(1)
      //alert('cc')
      $("." + thizz.dataset.id)
        .first()
        .css("display", "contents");
    } else {
      //alert('ccc')
      // alert(2)
      console.log(row.data());
      row.child(format(row.data(), uid), uid + " cus_st").show();
    }

    $(thizz).removeClass("fa-plus").addClass("fa-minus");
  }
  return;
  // $('.'+thizz.dataset.id).css('display', 'none')

  //return

  //     $(thizz).attr('class');
  //    // alert($(thizz).attr('class'))

  //     if($(thizz).attr('class')=='fa-minus fa')
  //     {
  //          var class_to_hide=  $(thizz).attr('data-id');
  //          //alert(class_to_hide)
  //         $(thizz).removeClass('fa fa-minus').addClass('fa fa-plus');
  //         //var class_to_hide=$(thizz).attr('data-id');
  //         $('.'+class_to_hide).hide();
  //        // document.getElementsByClassName(class_to_hide).style.display='none';
  //         return;
  //     }
  //     else
  //     {

  //         if($(thizz).attr('class')=='fa fa-minus')
  //         {
  //             $(thizz).removeClass('fa fa-minus').addClass('fa fa-plus');

  //         }
  //         else
  //         {
  //             $('#line_id_1').removeClass('fa fa-minus').addClass('fa fa-plus');

  //             $('.cus_st').attr('colspan',10);

  //         }

  //         $('.'+uid).show();
  //         tr.addClass('shown');
  //         //tdi.first().removeClass('fa fa-plus').addClass('fa fa-minus');

  //         //$('div.slider', row.child()).slideDown();

  //         return;
  //     }
}
function format(d, uid) {
  //alert(uid)
  // `d` is the original data object for the row
  return (
    '<div class="table-responsive slider" style="width: 78%;padding-left: 5%;"><table  style="padding-left:50px;white-space:nowrap"  class="table table-sm dtl-tbl" id="dtl-tbl' +
    uid +
    '" data-mapping-id="' +
    uid +
    '" ><tr><th><button style="    border: none;    background: transparent;" type="button" name="add" onclick="add_charge_line(this)"  id="line' +
    uid +
    '"   data-parent-id="' +
    uid +
    '"  class="add_charge_line"><span class="fa fa-plus" style="border: 1px solid;padding: 2px 2px 2px;cursor: pointer;    color: #008000a6;    font-size: 13px;    border-radius: 50%;"></span></button></th><th>Charge Type</th><th>Item Code</th><th>Quantity</th><th>Price</th><th>Vat</th><th>Line Total</th><th>Line Type</th><th>Action</th></tr></table></div>'
  );
}

var objectJSON;
// var myArray_charges;
function charges_validator() {
  //alert(123123)
  var charges_tbl = document.querySelectorAll(".dtl-tbl");
  var line_index = -1;
  myDataObject = new Object();
  var total_line_sum = 0;
  for (var i = 0; i < charges_tbl.length; i++) {
    var table_id = charges_tbl[i].id;
    var main_item = charges_tbl[i].getAttribute("data-mapping-id");
    var table = document.getElementById(table_id);
    var total_price = 0;
    var total_vat = 0;
    var total_line = 0;
    for (var m = 1; m < table.rows.length; m++) {
      line_index++;
      // myArray_charges[line_index] = new Array(5);
      var line_id = table.rows[m].cells[0].innerHTML;
      var charge_type = table.rows[m].cells[1].children[0].value;
      var item_code = table.rows[m].cells[2].children[0].value;
      var qty = table.rows[m].cells[3].innerHTML;
      var enter_price = table.rows[m].cells[4].children[0].value;

      var listpricename =
        table.rows[m].cells[4].children[0].getAttribute("data-listpricename");
      var listpriceid =
        table.rows[m].cells[4].children[0].getAttribute("data-listpriceid");
      //table.rows[1].cells[4].children[0].getAttribute('data-listpricename')

      var vat = table.rows[m].cells[5].innerHTML;
      var line_total = table.rows[m].cells[6].innerHTML;
      try {
        var line_type = table.rows[m].cells[7].children[0].value;
      } catch (error) {
        //alert('line type missing fpr : '+item_code)
      }
      total_price = +total_price + +enter_price;
      total_vat = +total_vat + +vat;
      total_line = +total_line + +line_total;

      myArray_charges = new Object();
      myArray_charges.line_id = line_id;
      myArray_charges.charge_type = charge_type;
      myArray_charges.item_code = item_code;
      myArray_charges.inventory_item_id = item_code;
      myArray_charges.enter_price = enter_price;
      myArray_charges.line_type = line_type;
      myArray_charges.qty = qty;
      myArray_charges.main_item = main_item;
      myArray_charges.vat = vat;
      myArray_charges.line_total = line_total;
      myArray_charges.listpricename = listpricename;
      myArray_charges.listpriceid = listpriceid;
      myDataObject["obj"] = myArray_charges;
    }

    var line_i = i;
    try {
      set_lines_t(total_line, "#" + line_i + "-line-charges");
      console.log(total_line + ",#" + line_i + "-line-charges");
    } catch (error) {
      alert(error);
    }

    table.rows[0].cells[4].innerHTML = "Price <br> (" + total_price + ")";
    table.rows[0].cells[5].innerHTML = "Vat <br>  (" + total_vat + ")";
    table.rows[0].cells[6].innerHTML = "Line Total<br>  (" + total_line + ")";
    $($("#" + main_item + " >td")[11]).html(total_line);

    total_line_sum = +total_line_sum + +total_line;

    //inv_tot.gt=inv_tot.gt + total_line
  }
  inv_tot.total_line_charges = total_line_sum;
  //$('.line_chargessum').html(total_line_sum);
  localStorage.setItem("charges_", JSON.stringify(myDataObject));
}

function set_lines_t(vall, id) {
  $(id).html(vall);

  //alert('call')
}

function add_charge_line(thizz) {
  var parent_id = thizz.dataset.parentId;
  //alert(parent_id)
  console.log(thizz.id);
  var table_id = "dtl-tbl" + parent_id;
  $("#" + table_id)[0].rows.length;

  var html = "";
  var x = Math.floor(Math.random() * 1016982209794163 + 1);
  html += '<tr data-parent-id="' + parent_id + '" id=' + x + ">";
  html += "<td>" + $("#" + table_id)[0].rows.length + "</td>";
  html += '<td id="charge_type' + x + '"></td>';
  html += '<td id="item_code' + x + '"></td>';
  html += '<td id="qty' + x + '" >1</td>';
  //html += '<td id="list_price'+x+'">0</td>';
  html +=
    '<td id="ent_price' +
    x +
    '"><input type="text"  readonly  data-uniqueid="' +
    x +
    '"    style="    width: 100%;"  class="item_quantity" onblur="update_line_vat_t(this)"  /></td>';
  html += '<td id="vat' + x + '"></td>';
  html += '<td id="line_total' + x + '" ></td>';
  html += '<td id="line_type' + x + '" ></td>';
  html +=
    '<td><button type="button"    style="border:none;background:transparent;" name="remove" class="remove"><span class="fa fa-minus" style="border: 1px solid;padding:2px 2px 2px; cursor: pointer;color: #008000a6;    font-size: 13px;    border-radius: 50%;"></span></button></td></tr>';
  $("#" + table_id).append(html);
  get_charg_types(x, parent_id);
}
function update_line_vat_t(thiz) {
  var price = $(thiz).val();
  var uniqueid = thiz.dataset.uniqueid;
  var line_vat = vat_calculate(price); //(price*1.05).toFixedRound(2)
  line_vat = line_vat - price;
  $("#vat" + uniqueid).html(to_fix(line_vat));
  price = +line_vat + +price;
  $("#line_total" + uniqueid).html(to_fix(price));
  //save_item_and_price()
  //charges_validator();
}
function get_charg_types(idd, parent_id) {
  var lineid = idd;
  var defs = localStorage.getItem("defs");
  axios
    .get("/saleswores/charge_types?defs=" + defs)
    .then(function (res) {
      console.log(res.data.data);
      var a = res.data.data;
      var out =
        '<select   onchange="get_item_based_on_charge(this)"  data-lineid=' +
        lineid +
        "  data-parentid=" +
        parent_id +
        " >";
      out += "<option></option>";
      for (var i = 0; i < a.length; i++) {
        out += "<option value=" + a[i].value + ">" + a[i].display + "</option>";
      }
      out += "</select>";
      $("#charge_type" + idd).html(out);
    })
    .catch(function () {
      $("#charge_type" + idd).html("");
    });
}

function get_item_based_on_charge(idd) {
  var parent_id = idd.dataset.parentid;
  var lineid = idd.dataset.lineid;

  $("#item_code" + lineid).html("");

  // var typelov=idd.dataset.typelov
  var val = idd.value;
  var ysss = "";
  if (val == "SC") {
    ysss = "true";
  }
  //alert(parent_id)
  //alert(typelov)

  var inventory_item_id = "";
  var defs = localStorage.getItem("defs");
  var a = shoppingCart.listCart();
  for (var i = 0; i < a.length; i++) {
    if (a[i].obj.name == parent_id) {
      inventory_item_id = a[i].obj.inventory_item_id;
      break;
    }
  }

  axios
    .get(
      "/saleswores/get_item_based_on_charge?defs=" +
        defs +
        "&inventory_item_id=" +
        inventory_item_id +
        "&val=" +
        val
    )
    .then(function (res) {
      console.log(res.data.data);

      // console.log('123123123123');
      var a = res.data.data;
      var out =
        '<select  style="    width: 120px;"  data-servicecontratct="' +
        ysss +
        '"     onchange="get_def_line_and_price(this)"      data-lineid=' +
        lineid +
        "   data-parentid=" +
        parent_id +
        "  >";
      out += "<option ></option>";
      for (var i = 0; i < a.length; i++) {
        out +=
          "<option value=" +
          a[i].value +
          ">" +
          a[i].display +
          "<br> " +
          a[i].ITEM_DESC +
          "</option>";
      }
      out += "</select>";
      $("#item_code" + lineid).html(out);
    })
    .catch(function () {
      $("#item_code" + lineid).html("");
    });
}

var res = "";
function get_def_line_and_price(th) {
  // refresh_reservation_details();
  // return;

  //alert(3)

  // charges_validator();
  var parent_id = th.dataset.parentid;
  var lineid = th.dataset.lineid;
  var servicecontratct = th.dataset.servicecontratct;
  //alert(servicecontratct)
  var order_header_type_id = $("#order_type_lov_item_page").val();
  var a = shoppingCart.listCart();
  var iii = "";
  var inventory_item_id = th.value;

  var out =
    "<select  data-lineid=" +
    lineid +
    "  disabled  data-parentid=" +
    parent_id +
    "  >";
  console.log(out);
  ShowDIV();
  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;

  //?o_typ_hdr_id="+order_header_type_id+"&defs="+ localStorage.getItem('defs')+"&cart="+JSON.stringify(shoppingCart.listCart())+"&inventory_item_id="+inventory_item_id

  axios
    .post("/sales/get_line_type_base_on_order_header", {
      o_typ_hdr_id: order_header_type_id,
      defs: localStorage.getItem("defs"),
      cart: JSON.stringify(shoppingCart.listCart()),
      inventory_item_id: inventory_item_id,
    })
    .then(function (res) {
      console.log("line 2912");
      HideDIV();
      console.log(res);
      res = res;
      for (var i = 0; i < res.data.data.length; i++) {
        // console.log(res.data.def_line_type_price[j].unique_cart_name)

        if (
          res.data.def_line_type_price[0].line_type_id == res.data.data[i].value
        ) {
          out +=
            "<option value=" +
            res.data.data[i].value +
            " selected>" +
            res.data.data[i].display +
            "</option>";
        } else {
          out +=
            "<option value=" +
            res.data.data[i].value +
            ">" +
            res.data.data[i].display +
            "</option>";
        }
      }
      out += "</select>";
      $("#line_type" + lineid).html(out);
      $("#ent_price" + lineid)
        .children()
        .attr("disabled", false);

      if (servicecontratct == "true") {
        $("#ent_price" + lineid)
          .children()
          .attr("disabled", true);
        $("#ent_price" + lineid)
          .children()
          .attr(
            "data-listpriceid",
            res.data.def_line_type_price[0].list_header_id
          );
        $("#ent_price" + lineid)
          .children()
          .attr(
            "data-listpricename",
            res.data.def_line_type_price[0].list_header_name
          );

        $("#ent_price" + lineid)
          .children()
          .val(Number(res.data.def_line_type_price[0].price).toFixedRound(2));

        var price = Number(res.data.def_line_type_price[0].price).toFixedRound(2);
        var uniqueid = lineid;
        var line_vat = vat_calculate(price); // (price*1.05).toFixedRound(2)
        line_vat = line_vat - price;
        $("#vat" + uniqueid).html(line_vat);
        price = +line_vat + +price;
        $("#line_total" + uniqueid).html(price);
        document.querySelector("#ent_price" + lineid + " > input").onblur();
      } else {
        $("#ent_price" + lineid)
          .children()
          .val(0);
        $("#ent_price" + lineid)
          .children()
          .attr(
            "data-listpriceid",
            res.data.def_line_type_price[0].list_header_id
          );
        $("#ent_price" + lineid)
          .children()
          .attr(
            "data-listpricename",
            res.data.def_line_type_price[0].list_header_name
          );

        // $('#ent_price'+lineid).children().attr('data-listpriceid','');
        //$('#ent_price'+lineid).children().attr('data-listpricename', '');

        var price = 0;
        var uniqueid = lineid;
        var line_vat = vat_calculate(price); //(price*1.05).toFixedRound(2)
        line_vat = line_vat - price;
        $("#vat" + uniqueid).html(to_fix(line_vat));
        price = +line_vat + +price;
        $("#line_total" + uniqueid).html(to_fix(price));
      }
    })
    .catch((error) => {
      HideDIV();
      console.log(error);
      $("#line_type" + lineid).html("");
      $("#ent_price" + lineid)
        .children()
        .val(0);
      document.querySelector("#ent_price" + lineid + " > input").onblur();
    })
    .then((response) => {
      // this is now called!
      // alert(1)
      console.log("done");
      HideDIV();
    });
}

function to_fix(a) {
  return a.toFixedRound(2);
}

$(document).on("click", ".remove", function () {
  $(this).closest("tr").remove();
});

function u(a) {
  if (typeof a === "undefined") {
    return "";
  }
  return a;
}
var total_discount = 0;
var total_vat = 0;
var total_ = 0;
var table;
var table_cart;
$(document).ready(function () {
  displayCart();
  var cartArray = shoppingCart.listCart();
  if (cartArray.length > 0) {
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
});

var myArray1 = [];
function save_item_and_price() {
  var cartArray = shoppingCart.listCart();
  var e = document.getElementById("order_type_lov_item_page");
  var txt_header = $("#order_type_lov_item_page").select2("data")[0]["name"];
  var txt_val = e.options[e.selectedIndex].value;
  shoppingCart.save_order_info("order_type_val", txt_val);
  shoppingCart.save_order_info("order_type_text", txt_header);

  var ecustomer_po = document.getElementById("customer_po").value;
  var order_remarks = document.getElementById("order_remarks").value;
  shoppingCart.save_order_info("customer_po", ecustomer_po);
  shoppingCart.save_order_info("order_remarks", order_remarks);

  total_ = 0;
  total_discount = 0;
  total_vat = 0;
  total_req_qty = 0;
  total_list_price = 0;

  var myTab = document.getElementById("show-cart");
  var arrayindex = -1;
  //   for (i = 2; i < myTab.rows.length; i++)
  //   {

  //      if(myTab.rows[i].cells.length == 1)
  //      {

  //         continue;
  //      }
  //       arrayindex++;
  //       myArray1[arrayindex] = new Array(5);
  //       var objCells = myTab.rows.item(i).cells;
  //       for (var j = 0; j < objCells.length; j++)
  //       {
  //          // if(j==0)
  //           if(j==1)
  //           {
  //              // var asdf = myTab.rows[i].cells[j].childNodes[0].id;
  //             //  itemname = $("#" + asdf + " option:selected").text();
  //             var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //             myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==2)
  //           {
  //               var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //               myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==5)
  //           {
  //              // sum += isNaN(cls[i].innerHTML) ? 0 : parseInt(cls[i].innerHTML);
  //              var asdf =  myTab.rows[i].cells[j].childNodes[1].childNodes[1].value;

  //              myArray1[arrayindex][j] =asdf;
  //              total_req_qty=+total_req_qty+  +asdf
  //           }
  //           if(j==6)
  //           {
  //               var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //              // alert(valll)
  //               myArray1[arrayindex][j] =valll;
  //               total_list_price=+Number(total_list_price)+ +Number(valll);
  //           }
  //           if(j==7)
  //           {
  //               var valll=myTab.rows[i].cells[j].childNodes[0].value;
  //               myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==8)
  //           {
  //               var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //               myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==9)
  //           {
  //             var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //             myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==10)
  //           {
  //             var valll=myTab.rows[i].cells[j].childNodes[0].nodeValue;
  //             myArray1[arrayindex][j] =valll;
  //           }
  //           if(j==12)
  //           {
  //             try
  //             {

  //               var valll=myTab.rows[i].cells[j].childNodes[0].value;
  //               myArray1[arrayindex][j] =valll;
  //             } catch (error) {

  //             }

  //           }

  //       }
  //      // info.innerHTML = info.innerHTML + '<br />';     // ADD A BREAK (TAG).
  //   }

  //   for(var j=0;j<cartArray.length;j++)
  //   {

  //       for(var i=0;i<myArray1.length;i++)
  //       {
  //           if(myArray1[i][1]==cartArray[j].obj.barcode)
  //           {
  //              var obj= cartArray[j].obj;
  //              obj['list_price']=myArray1[i][6];
  //              if(obj['list_price']=="0" || obj['list_price']=='' || obj['list_price']==undefined)
  //              {
  //                 toaster_create('List price not loaded  at line '+i+ ' please reload the page');
  //                 return ;
  //              }
  //              obj['req_quantity']= myArray1[i][5] //$('#'+i+'-quantity').val()//data[i][6];
  //              obj['price']=myArray1[i][7]//$('#'+i+'-price').val()//data[i][8];
  //              if(obj['price']=="0" || obj['price']=='' || obj['price']==undefined  || obj['price']==null  || obj['price']=='0.00')
  //              {
  //                 toaster_create('Please Enter Price at line '+i);
  //                 return  ;
  //              }
  //              obj['discount']= myArray1[i][8]    // $('#'+i+'-discount').html()//data[i][9];
  //              obj['line_total']=myArray1[i][10]  //  $('#'+i+'-line-total').html()//data[i][10];
  //              obj['line_vat']= myArray1[i][9] * obj['req_quantity']; // $('#'+i+'-line-vat').html()//data[i][10];
  //              obj['selected_line_type']= myArray1[i][12]        // $('#'+i).val()//data[i][10];
  //              if(obj['selected_line_type']==null || obj['selected_line_type']=='' || obj['selected_line_type']==undefined)
  //              {
  //                   toaster_create('Please Select Line Type at line  '+i);
  //                   return ;
  //              }
  //              obj['selected_line_type_text']=$('#'+i).text()//data[i][10];
  //              total_discount=+total_discount  +  +obj['discount'];
  //              total_vat=+total_vat  +  +obj['line_vat'];

  //              //alert(total_vat)
  //              obj['total_vat']= total_vat * obj['req_quantity'];
  //              obj['total_discount']=total_discount;
  //              total_=+total_+ +obj['line_total'];
  //              obj['total_']=total_;
  //              console.log( obj);
  //              //console.log(23456789)
  //              save_to_cart_custom(obj);
  //           }
  //           //alert(4)
  //       }

  //   }

  //   sum_total('.item-count');
  //   sum_total('.list_prices','yes')  ;
  //   sum_total('.entered_price');
  //   sum_total('.disc_sr','yes','yes');
  //   sum_total('.vat','yes');
  //   sum_total('.line_t','yes');
  //   sum_total('.line_charges','yes');
  //   get_selected_cust()

  //   $('#total_line_req_qty').html(total_req_qty);
  //   $('#total_line_list_price').html(Number(total_list_price).toFixedRound(2));
  //   $('#total_line_entered_price').html(Number(total_).toFixedRound(2))
  //    // <td id='total_line_discount'></td>\
  //   $('#total_line_vat').html(Number(total_vat).toFixedRound(2))
  //   $('#total_line_total').html(Number(total_).toFixedRound(2));

  if (cartArray.length == 0) {
    return 0;
  }
  return 1;
  // }
  // catch (error)
  // {
  //     toastr.error(error.message + 'line number : '+error.stack ,'Error');
  // }
}

function reload_data_based_on_tax() {
  var myTab = document.getElementById("show-cart");
  var arrayindex = -1;
  for (i = 2; i < myTab.rows.length; i++) {
    if (myTab.rows[i].cells.length == 1) {
      continue;
    }
    //alert(arrayindex)
    arrayindex++;

    var objCells = myTab.rows.item(i).cells;
    // alert(objCells.length);
    for (var j = 0; j < objCells.length; j++) {
      if (j == 10) {
        var acprice = myTab.rows[i].cells[j].innerText;

        //var total_line_vat= vat_calculate(acprice)  // (((acprice/100)*(vat+100))-acprice).toFixedRound(2);
        //alert(arrayindex)
        //document.getElementById(arrayindex+'-line-vat').innerHTML=total_line_vat

        // document.getElementById(arrayindex+'-line-total').innerHTML=+acprice + +total_line_vat
      }
    }
  }
  // save_item_and_price()
}

$(document).on(
  "keyup keydown input",
  "table#cash_collection tr td:nth-child(4) input",
  function () {
    var e = $(this);
    var tr = $(e).closest("tr");
    var select = $(e).closest("tr").find("select");

    if (select.val() == "CREDIT CARD") {
      if (e.val().length > 6) {
        // e.val("");
        // toastr.error("Cannot exceed 6 !");
        e.val(e.val().slice(0,6))
      }
    }
    if (e.val().length < 6 && e.val().length > 0) {
      // e.val("");
      // toastr.error("Cannot be less than 6 !");
    }
  }
);


$(document).on('input keyup keydown','[data-column="qty"]',function(){
    var self =this;
    // return;
    var textContent = $(self).text();
    var trIndex = $(this).closest('tr').index();

    itemLinesEntry.$nextTick(function(){
      setTimeout(() => {
        var avl_qty = parseFloat($(self).closest('tr').find('[data-column="avl_qty"]').text().replace(",","") || 0);
        if (parseFloat(textContent||0) > avl_qty){
          $(self).text(avl_qty);
          if (itemLinesEntry.lines_data[trIndex].item_type == 'ACC'){
            itemLinesEntry.lines_data[trIndex][$(self).data('column')] =  avl_qty;
          }
        }
        placeCaretAtEnd(self);
      }, 150);
    })
})

var glo_documents_uploaded = false;
function submit_order(thizz, draft = false) {




  var exit_flag = false;
  [].slice
    .call($("table#cash_collection tbody tr td:nth-child(4) input"))
    .forEach(function (e) {
      var e = $(e);
      var tr = $(e).closest("tr");
      var select = $(e).closest("tr").find("select");

      if (select.val() == "CREDIT CARD") {
        debugger;
        if (e.val().length > 6) {
          e.val("");
          toastr.error("Credit card receipt no cannot exceed 6 !");
          exit_flag = true;
        }
        if (e.val().length < 6 && e.val().length >= 0) {
          e.val("");
          toastr.error("Credit card receipt no cannot be less than 6 !");
          exit_flag = true;
        }
      }
    });
  if (exit_flag) return;








  if ($('#cust-docs tbody tr').length != 0){
    glo_documents_uploaded = true;
  }



  if (
    glo_documents_uploaded == false 
    && 
    (parseFloat($('tfoot [data-column="discount_perc"] ').text()||0 ) >= 40 )
      )
  {

    // if (! ['GOVT_SEMI_GOVT','SEMI_GOVT','GOVERNMENT'].includes(glo_customer_classification.trim())){

    //   return toastr.error("Please upload Emirates ID to proceed further!");
    // }
  }




  // $("#number0").on('change', function() {
  line_tsum = $(".line_tsum").text();
  rem_amount = $("#number0").val();
  line_tsum = $(".line_tsum").text();
  rem_amount_html = $("#rem_amount_").text();
  console.log("rem_amount", rem_amount);
  console.log("line_tsumv", line_tsum);
  console.log(rem_amount_html);


  if (rem_amount_html != 0.0) {
    toastr.error(
      "The Draft application amount should match with the sales order amount"
    );
    return;
  } else {
    $("btn_order").removeAttr("disabled");
  }


  
  if ($('#order_type_lov_item_page').find('option:selected').text().includes("-CR-")  && thizz.id !='btn_draft_it'){

    if (parseFloat(itemLinesEntry.column_aggregates['line_total']) !=  glo_total_AMT_ASSIGNED){
      HideDIV();
      return toastr.error("The Draft application amount should match with the sales order amount"); 
    }

  }




  var status = 1;
  console.log(status);
  console.log(shoppingCart.listCart());
  console.log('validationsPassedvalidationsPassedvalidationsPassed', validationsPassed);
  var items_str = itemLinesEntry.lines_data.filter((x,i)=>i!=itemLinesEntry.lines_data.length-1).filter(x=>Object.keys(x).includes('item_code') && parseInt(x.avl_qty)>0).map(x=> x.item_code+'~'+x.qty).join(",");

  var str = JSON.stringify(itemLinesEntry.lines_data.filter((x,i)=>i!=itemLinesEntry.lines_data.length-1).map(x=>({
    inventory_item_id:x.inventory_item_id,
      unit_selling_price:x.unit_selling_price,
      item_code:x.item_code,
      SERIAL_NUMBER: (Object.keys(x).includes('SERIAL_NUMBER')) ?  x.SERIAL_NUMBER:'',
      item_type: x.item_type,
  })));
    



  
  ShowDIV(["Onhand Stock Verification Inprogress"]);
  axios
  .get(
    "/sales/filtered_stock2?items="+encodeURIComponent(str)+"&type=create&defs=" +
      localStorage.getItem("defs") +
      "&inventory_item_id=" +encodeURIComponent(items_str)
  )
  .then(function (res) {
    HideDIV()


    itemLinesEntry.lines_data.filter(x=>x.item_type == 'ACC').forEach((shshs)=>{
      const ojjjj = res.data.data.find(fif=>(fif['item_code'] == shshs['item_code']))
      if (parseInt(ojjjj['reservable_qty']) < parseInt(shshs['qty'])){
        toastr.error("On Hand quantity not available for item "+ojjjj['item_code']+ "Please retry getting stock in Create order tab")
        HideDIV()
        throw new Error("On Hand quantity not available for item "+ojjjj['item_code']+ "Please retry getting stock in Create order tab")
      }
    })


    if (status == 1) {
      //alert(status)
      if (status == 1) {
        var iddd = $(thizz).attr("id");
        if (draft) {
          finalize_inv(thizz);
        } else {
          if (iddd == "btn_draft_it") {
            swal(
              {
                title: "Press OK to Save Order",
                text: "",
                type: "success",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "OK",
              },
              function () {
                finalize_inv(thizz);
              }
            );
          } else {
            if (!validationsPassed){
              swal(
                {
                  title: "Order is not eligible for processing, it exceeds discount limits. Do you want to send for discount approval??",
                  text: "",
                  type: "success",
                  showCancelButton: true,
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#d33",
                  confirmButtonText: "OK",
                },
                function () {
                  finalize_inv(thizz, trigger_workflow=true);
                }
              );
            } else {
              swal(
                {
                  title: "Press OK to create Sales Order",
                  text: "",
                  type: "success",
                  showCancelButton: true,
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#d33",
                  confirmButtonText: "OK",
                },
                function () {
                  finalize_inv(thizz);
                }
              );
            }
          }
        }
  
        //finalize_inv(thizz)
      } else {
        toastr.error("customer bill to and ship is not propery entered", "error");
      }
    } else {
      toastr.error("line data is not properly entered", "error");
    }



  })
  .catch(err => {
    console.log('IAIAIAIAIA', err);
    HideDIV();

    
    if (err.response.data.message != null){
      toastr.error(err.response.data.message);
    } else {

      toastr.error("Incomplete item information. Please check and retry !");

    }
    
  })


  
}


function moveCursorToEnd(el) {
  if (typeof el.selectionStart == "number") {
    el.selectionStart = el.selectionEnd = el.value.length;
  } else if (typeof el.createTextRange != "undefined") {
    el.focus();
    var range = el.createTextRange();
    range.collapse(false);
    range.select();
  }
}
function formatAmount(number) {
  number = number.replace(/[^0-9]/g, "");
  number = new Number(number);
  return number;
}
var vat = 5;

function line_popover_error(line_number, message) {
  //$('table#show-cart tbody tr:eq('+line_number+')')

  try {
    $("." + line_number).popover("dispose");
    $("." + line_number).popover({
      placement: "left",
      html: true,
      trigger: "hover",
      title: "<strong>Information!</strong>",
      container: "body",
      content: message,
    });

    // if (typeof line_popover_error_array[b][0] != "undefined" )
    // {
    //     var message=line_popover_error_array[b][0]
    // }

    // $('.'+line_number).popover({
    //     placement: 'left',
    //     html: true,
    //     trigger: 'hover',
    //     title: '<strong>Information!</strong>',
    //     container: 'body',
    //     content: message,
    // })
  } catch (error) {
    console.log(error);
    $("." + line_number).popover({
      placement: "left",
      html: true,
      trigger: "hover",
      title: "<strong>Information!</strong>",
      container: "body",
      content: message,
    });
  }

  //$('#'+line_number+'-price').insertAfter('<div class="tooltip">&#x1F6C8;<span class="tooltiptext">Tooltip text</span></div>');
}

function on_quantity_change(a, b) {
  thizzzzzzzz = a;

  var inpQty = $(a).val();
  var req_qty = thizzzzzzzz.getAttribute("item_code");
  if (req_qty) {
    data = $("#excel_data").val();
    tst = data.split(",");
    items_code = [];
    $.each(tst, function (data_index1, data_value1) {
      items_array = data_value1.split("/");
      if (items_array[0].replace(/\n/g, "") == req_qty) {
        item = items_array[0] + "/" + inpQty;
      } else {
        item = items_array[0] + "/" + items_array[1];
      }
      items_code.push(item);
    });
    $("#excel_data").val(items_code);
  }
  if (isNaN(inpQty) || inpQty < 1) {
    // toastr.info('Requested Quantity is greater than on hand quantity. ',' ');
    // return ;
  }
  var onhandQty = parseInt(thizzzzzzzz.getAttribute("data-onhand-qty"));
  if (inpQty > onhandQty) {
    $(a).val(onhandQty);
    return;
  }
  var name = thizzzzzzzz.getAttribute("data-name");
  var cartArray = shoppingCart.listCart();
  for (var j = 0; j < cartArray.length; j++) {
    if (cartArray[j].obj.name == name) {
      var obj = cartArray[j].obj;
      obj["req_quantity"] = inpQty;
      console.log(obj);
      save_to_cart_custom(obj, inpQty);
      refresh_reservation_details((update = true));
    }
  }
}
function price_enter_change(a, b) {
  //sum_total('.entered_price')
  thizzzzzzzz = a;
  $(a).closest("tr").css("background-color", "#fff");
  var enterred_price = Number(
    $("#" + a.id)
      .first()
      .val()
  ); //   .//html()).toFixedRound(2);
  //alert(enterred_price)
  var x, text;

  if (isNaN(enterred_price) || enterred_price < 1) {
    toastr.info("enterred_price price is not valid : ", " ");
    $("#btn_order").prop("disabled", true);
    return;
  }

  $("#btn_order").prop("disabled", false);

  var item_serial_number = document
    .getElementById(a.id)
    .getAttribute("data-serial-number");
  var item_inventry_id = document
    .getElementById(a.id)
    .getAttribute("data-inventry-id");
  var stock_org_name = document
    .getElementById(a.id)
    .getAttribute("data-from-org-name");

  var defs = localStorage.getItem("defs");

  document.getElementById(a.id).innerHTML = Number(enterred_price).toFixedRound(2);

  var list_price = Number($("#" + b + "-list-price").html()).toFixedRound(2);

  if (enterred_price < parseFloat(list_price)) {
    ShowDIV();
    var eee =
      "Selling price of the item in line number" +
      (parseInt(b) + 1 + " is less then list price  ");
    toastr.info(eee);
    show_errorss(eee);

    // line_popover_error(b,eee);

    // $(a).closest('tr').css("background-color", "rgb(255, 214, 204)");
    // axios.get("/sales/get_cost_price?defs=" + defs + "&item_inventry_id=" + item_inventry_id + "&serial_number=" + item_serial_number + '&stock_org_name=' + stock_org_name)
    //     .then(function (res) {
    //         HideDIV()
    //         console.log(res.data[0].cost)
    //         if (enterred_price < res.data[0].cost) {

    //             swal({
    //                     title: "Enter Item price is less then cost price  Please confirm to proceed",
    //                     text: "still it wil go for approval",
    //                     type: "warning",
    //                     showCancelButton: true,
    //                     confirmButtonColor: '#DD6B55',
    //                     confirmButtonText: 'Yes, I am sure!',
    //                     cancelButtonText: "No, cancel it!",
    //                     closeOnConfirm: false,
    //                     closeOnCancel: false
    //                 },
    //                 function (isConfirm) {

    //                     if (isConfirm) {

    //                         var eee = 'Selling price of the item in line number' + (parseInt(b) + 1 + ' is less then list price  ');
    //                         toastr.info(eee);
    //                         show_errorss(eee)

    //                         //alert(1)

    //                         $('#btn_order').prop('disabled', true);
    //                         // alert(list_price)
    //                         // alert('#'+a.id)
    //                         //   $('#'+a.id).val(list_price);

    //                         var cartArray = shoppingCart.listCart();
    //                         for (var j = 0; j < cartArray.length; j++) {

    //                             if (cartArray[j].obj.name == item_inventry_id + item_serial_number) {
    //                                 var obj = cartArray[j].obj;
    //                                 obj['price'] = (parseFloat(enterred_price)).toFixedRound(2)
    //                                 obj['cost_price'] = res.data[0].cost;
    //                                 console.log(obj);
    //                                 //console.log(23456789)
    //                                 save_to_cart_custom(obj);
    //                                 refresh_reservation_details(update=true);
    //                             }
    //                         }

    //                         swal("Thanks!", "Now you can procced", "success");
    //                         insert_approval_saleswores_order((parseInt(b) + 1))
    //                         return;

    //                     } else {

    //                         $('#' + a.id).val(list_price);
    //                         var cartArray = shoppingCart.listCart();
    //                         for (var j = 0; j < cartArray.length; j++) {

    //                             if (cartArray[j].obj.name == item_inventry_id + item_serial_number) {
    //                                 var obj = cartArray[j].obj;
    //                                 obj['price'] = (parseFloat(list_price)).toFixedRound(2);
    //                                 obj['cost_price'] = res.data[0].cost;
    //                                 console.log(obj);
    //                                 //console.log(23456789)
    //                                 save_to_cart_custom(obj);
    //                                 refresh_reservation_details(update=true);
    //                             }
    //                         }
    //                         swal("No", "Item list price is default )", "error");
    //                         return;

    //                         //    e.preventDefault();

    //                     }
    //                 });

    //         } else {

    //             HideDIV();
    //             var cartArray = shoppingCart.listCart();
    //             for (var j = 0; j < cartArray.length; j++) {
    //                 if (cartArray[j].obj.name == item_inventry_id + item_serial_number) {
    //                     var obj = cartArray[j].obj;
    //                     obj['price'] = (parseFloat(enterred_price)).toFixedRound(2);
    //                     console.log(obj);
    //                     //console.log(23456789)
    //                     save_to_cart_custom(obj);
    //                     refresh_reservation_details(update=true);
    //                 }
    //             }

    //             //var enterd_quantiy=$('#'+b+'-quantity').val();

    //             // document.getElementById(b+'-discount').innerHTML=formate_number (enterred_price-list_price)
    //             // var total_line_vat=    (vat_calculate(enterred_price)-enterred_price).toFixedRound(2) // price_enter_change   (((enterred_price/100)*(vat+100))-enterred_price).toFixedRound(2);
    //             //  if(isNaN(total_line_vat))
    //             // {

    //             //   sum_total('.entered_price')
    //             //  }
    //             // else
    //             // {
    //             // alert(12)
    //             //    document.getElementById(b+'-line-vat').innerHTML=total_line_vat

    //             //  }
    //             // document.getElementById(b+'-line-total').innerHTML= Number(+(parseFloat(enterred_price).toFixedRound(2)*parseFloat(enterd_quantiy).toFixedRound(2))+ +(total_line_vat)).toFixedRound(2);
    //             //  var status=save_item_and_price()
    //             //  sum_total('.entered_price')
    //         }

    //         // alert(res.data.data)
    //         //unblockUIEntirePage();
    //         //displayCart()

    //     })
    //     .catch(function () {
    //         HideDIV()
    //         //unblockUIEntirePage();
    //     })
  } else {
    var enterd_quantiy = $("#" + b + "-quantity").val();
    //document.getElementById(b+'-discount').innerHTML= formate_number(enterred_price-list_price)
    //var total_line_vat= (vat_calculate(enterred_price) -enterred_price).toFixedRound(2) // (((enterred_price/100)*(vat+100))-enterred_price).toFixedRound(2);

    //if(isNaN(total_line_vat))
    // {
    //     $('#'+b+'-line-vat').html(0);
    // }
    // else
    // {
    //      //alert(34)
    //    document.getElementById(b+'-line-vat').innerHTML=total_line_vat

    // }
    //document.getElementById(b+'-line-total').innerHTML= Number(+(parseFloat(enterred_price).toFixedRound(2)*parseFloat(enterd_quantiy).toFixedRound(2))+ +(total_line_vat)).toFixedRound(2);
    //var status=save_item_and_price()

    var cartArray = shoppingCart.listCart();
    for (var j = 0; j < cartArray.length; j++) {
      if (cartArray[j].obj.name == item_inventry_id + item_serial_number) {
        var obj = cartArray[j].obj;
        obj["price"] = parseFloat(enterred_price).toFixedRound(2);
        console.log(obj);
        //console.log(23456789)
        save_to_cart_custom(obj);
        refresh_reservation_details((update = true));
      }
    }
  }
}

function vat_calculate(a) {
  var tax_percent = "1.0" + inv_tot.vat_p;
  //alert(tax_percent)
  return (a * tax_percent).toFixedRound(2);
}
var resssssssss;
function get_tax_() {
  // alert(12222)
  var defs = localStorage.getItem("defs");

  var e = document.getElementById("order_type_lov_item_page");
  var txt_header = e.options[e.selectedIndex].text;
  var txt_val = e.options[e.selectedIndex].value;

  var ship_cust_id = $("#customer").val();
  if (ship_cust_id == "" || ship_cust_id == null) {
    if (performance.now() / 1000 > 20)
      toaster_create("ship to customer is not selected");
    return;
  }
  // }
  // catch(err)
  // {
  //     toastr.info('Please select  bill to customer');
  //     return ;
  // }

  var order_type_id = shoppingCart.load_order_info("order_type_val");

  ShowDIV();

  var cart = JSON.stringify(shoppingCart.listCart());

  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;

  axios
    .post("/sales/get_tax_percentage", {
      cart: cart,
      order_type_id: order_type_id,
      ship_cust_id: ship_cust_id,
      txt_header: txt_header,
      customer_number:$("#searchCust").select2("data")[0]["customer_number"],
    })
    //axios.get("/sales/get_tax_percentage?&ship_cust_id="+ship_cust_id+"&txt_header="+txt_header)
    .then(function (res) {
      HideDIV();
      resssssssss = res;
      itemLinesEntry.customer_vat_perc = parseFloat(res.data.v_vat_percent) / 100;

      itemLinesEntry.$nextTick(function(){
        // alert();
        itemLinesEntry.updateAmounts();

      })


      if (res.data.v_vat_apply.toUpperCase() == "Y") {
        $("#customer_vat").val(res.data.v_vat_percent);
        itemLinesEntry.customerVatChange()
        updateVat(res.data.v_vat_percent);
 
        vat = res.data.v_vat_percent;
        inv_tot.vat_p = res.data.v_vat_percent;
        //save_item_and_price()
        //reload_data_based_on_tax();
        refresh_reservation_details(true);
      }
      if (res.data.v_vat_apply.toUpperCase() == "N") {
        $("#customer_vat").val(0);
        itemLinesEntry.customerVatChange()
        updateVat(0);
 
        vat = 0;
        inv_tot.vat_p = 0;
        //save_item_and_price()
        //reload_data_based_on_tax();
        refresh_reservation_details(true);
      }
      
    })
    .catch(function (error) {
      console.log('ERROR AT 4008', error,  error.response);
      HideDIV();
    });
}

(function ($) {
  "use strict";
  $(document).ready(function () {
    $(document).on("click", "#datagrid .add", function () {
      // alert(2)
      var row = $(this).closest("tr");
      var clone = row.clone();
      var tr = clone.closest("tr");
      tr.find("input[type=text]").val("");
      $(this).closest("tr").after(clone);
      var $span = $("#datagrid tr");
      $span.attr("id", function (index) {
        return "row" + index;
      });
    });
  });
})(jQuery);

var dropDown = ".dropdn";
var empName = ".name";
$(document).on("change", dropDown, function (e) {
  var value = $.trim($(this).val());
  $(this).closest("tr").find(empName).val(value);
});

$(document).on("click", "#datagrid .removeRow", function () {
  if ($("#datagrid .removeRow").length > 1) {
    $(this).closest("tr").remove();
  }
});

$("#btn").click(function () {
  cloneIndex = (Math.random() * (10000 - 1584 + 1027) + 10).toFixedRound(0);
  var $lastRow = $("#datagrid tr:not('.ui-widget-header'):last"); //grab row before the last row

  var $newRow = $lastRow.clone().attr("id", "clonedtr" + cloneIndex); //clone it
  $newRow.find(":text").val(""); //clear out textbox values
  $lastRow.after($newRow); //add in the new row at the end
});

var get_draft_reciept_data;

function formatCalculation(d) {
  return parseFloat(d).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function undo_formatCalculation(d) {
  var str = d;
  var a = str.split(".");
  str = a[0];
  var num = str.replace(/\D/g, "");
  console.log("string without commas", num);
  return num + "." + a[1];
}

//   function draft_line_type_change(a)
//   {

//   alert(a)
//   alert(1)
//   }

function draft_line_type_change(a = "") {
  //alert(a.value)

  var cash_collection = document.getElementById("cash_collection");
  for (i = 1; i < cash_collection.rows.length; i++) {
    var objCells = cash_collection.rows.item(i).cells;
    for (var j = 0; j < objCells.length; j++) {
      //&& cash_collection.rows[i].cells[j].childNodes[0].value=='CASH'
      if (j == 1) {
        if (cash_collection.rows[i].cells[1].childNodes[0].value == "CASH") {
          cash_collection.rows[i].cells[2].childNodes[0].disabled = false;
          cash_collection.rows[i].cells[3].childNodes[0].disabled = true;
          // cash_collection.rows[i].cells[5].childNodes[0].disabled=true;
        } else if (
          cash_collection.rows[i].cells[1].childNodes[0].value == "CREDIT CARD"
        ) {
          cash_collection.rows[i].cells[2].childNodes[0].disabled = false;
          cash_collection.rows[i].cells[3].childNodes[0].disabled = false;
          // cash_collection.rows[i].cells[5].childNodes[0].disabled=true;
        }
      } else if (
        j == 1 &&
        cash_collection.rows[i].cells[j].childNodes[0].value ==
          "DOWN PAYMENT ON US"
      ) {
        cash_collection.rows[i].cells[2].childNodes[0].disabled = true;
        cash_collection.rows[i].cells[4].childNodes[0].disabled = true;
        // cash_collection.rows[i].cells[5].childNodes[0].disabled=true;
      } else if (
        j == 1 &&
        cash_collection.rows[i].cells[j].childNodes[0].value == "LPO"
      ) {
        cash_collection.rows[i].cells[2].childNodes[0].disabled = true;
        cash_collection.rows[i].cells[4].childNodes[0].disabled = true;
        cash_collection.rows[i].cells[5].childNodes[0].disabled = false;
      }
    }
  }
}

function draft_receipt_no_change(a) {
  //alert(a)
  //alert(2)
  // var e = document.getElementById(a.id);
  var parent_tr = a.closest("tr").id;
  alert(parent_tr);
  //var strUser = a.options[e.selectedIndex].value;
  strUser = a.options[a.selectedIndex].value;
  alert(a.options[a.selectedIndex].value);
  //alert(strUser)
  for (var i = 0; i < get_draft_reciept_data.data.length; i++) {
    if (strUser == get_draft_reciept_data.data[i].receipt_number) {
      alert("found");
      //alert(i)
      // document.getElementById('receipt_no').innerHTML=out_rec;
      $("#" + parent_tr + "  >  #orignal_amt").html(
        get_draft_reciept_data.data[i].orig_receipt_amt
      );
      $("#" + parent_tr + "  >  #unapp_amt").html(
        get_draft_reciept_data.data[i].unapp_amt
      );
      $("#" + parent_tr + "  >  #doc_date").html(
        get_draft_reciept_data.data[i].deposit_date
      );
      $("#" + parent_tr + "  >  #avbl_balance").html(
        get_draft_reciept_data.data[i].orig_receipt_amt
      );
    }
  }
}

var arraySystme_recipt = [];
var arrayUser_recipt = [];

function calculate_enable_sum() {
  //alert(2)
  arraySystme_recipt = [];
  arrayUser_recipt = [];
  var sum = 0;

  var cash_collection = document.getElementById("datagrid");
  if (cash_collection != null) {
    //alert('12')
    // cash_collection.rows=0;
    // return;

    for (i = 1; i < cash_collection.rows.length; i++) {
      arraySystme_recipt[i - 1] = new Array(5);
      var objCells = cash_collection.rows.item(i).cells;
      for (var j = 0; j < objCells.length; j++) {
        if (cash_collection.rows[i].cells[0].childNodes[0].checked == true) {
          if (j == 1) {
            //amt  assigned
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].childNodes[0].value;
            arraySystme_recipt[i - 1][13] =
              cash_collection.rows[i].cells[j].childNodes[1].value;
            sum = +sum + +cash_collection.rows[i].cells[j].childNodes[0].value;
            var rem_amount = inv_tot.gt - sum;
            rem_amount = parseFloat(rem_amount).toFixedRound(2);

            // $("#rem_amount_").html(
            //   '<b style="color:red"> ' + rem_amount + "</b>"
            // );

            if (rem_amount == "0") {
              $("#g_total").css("background-color", "green");
              $("#g_total").css("color", "white");
              $("#btn_order").css("background-color", "green");
            } else {
              $("#g_total").css("background-color", "#e9ecef");
              $("#g_total").css("color", "black");
              $("#btn_order").css("background-color", "#007bff");
            }
          }
          if (j == 2) {
            //vat amt
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].childNodes[0].value;
            var total = cash_collection.rows[i].cells[1].childNodes[0].value;

            var total_line_vat = vat_calculate(total) - total; // ((total / (100 + vat)) * vat).toFixedRound(2)
            //alert(total_line_vat)

            total_line_vat = parseFloat(total_line_vat).toFixedRound(2);
            var type = cash_collection.rows[i].cells[6].innerHTML;
            type = type.trim();
            if (type == "CREDIT MEMO" || type == "CREDIT LIMIT") {
              cash_collection.rows[i].cells[j].childNodes[0].value = 0;
              arraySystme_recipt[i - 1][14] = 0;
            } else {
              cash_collection.rows[i].cells[j].childNodes[0].value =
                total_line_vat;
              arraySystme_recipt[i - 1][14] = total_line_vat;
            }
          }
          if (j == 3) {
            //orignal amt
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 4) {
            //unapp  amt
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 5) {
            //cust ref
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].childNodes[0].value;
          }
          if (j == 6) {
            //type
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }

          if (j == 7) {
            //receipt number
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 10) {
            //cash receipt id
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 12) {
            //cash receipt id
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 14) {
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 15) {
            //	CREDIT MEMO
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
          if (j == 16) {
            //	CREDIT MEMO TRX ID
            arraySystme_recipt[i - 1][j] =
              cash_collection.rows[i].cells[j].innerHTML;
          }
        }
        if (
          cash_collection.rows[i].cells[0].childNodes[0].checked == false &&
          j == 0
        ) {
          // //   else
          j = 1;
          cash_collection.rows[i].cells[j].childNodes[0].value = 0;
          cash_collection.rows[i].cells[j].childNodes[1].value = 0;
          arraySystme_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;
          //    arraySystme_recipt[i-1][13] =cash_collection.rows[i].cells[j].childNodes[1].value;
          sum = +sum + +cash_collection.rows[i].cells[j].childNodes[0].value;

          j = 2;
          arraySystme_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;
          var total = cash_collection.rows[i].cells[1].childNodes[0].value;

          var total_line_vat = vat_calculate(total); //((total / (100 + vat)) * vat).toFixedRound(2)
          //alert(total_line_vat)
          cash_collection.rows[i].cells[j].childNodes[0].value = total_line_vat;
          //    arraySystme_recipt[i-1][14] =total_line_vat;
        }
      }
    }
  }

  //document.getElementById('collected_total').value=sum;
  try {
    var cash_collection = document.getElementById("cash_collection");

    for (i = 1; i < cash_collection.rows.length; i++) {
      arrayUser_recipt[i - 1] = new Array(5);

      var objCells = cash_collection.rows.item(i).cells;
      for (var j = 0; j < objCells.length; j++) {
        if (
          cash_collection.rows[i].cells[3].childNodes[0].value == 0 &&
          cash_collection.rows[i].cells[j].childNodes[0].value == "" &&
          cash_collection.rows[i].cells[j].childNodes[0].value == "0"
        ) {
          continue;
        }
        if (j == 1) {
          //amt   assigned
          arrayUser_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;
          //arrayUser_recipt[i-1][j+1] =cash_collection.rows[i].cells[j].childNodes[0].value;
        }
        // if(j==2)
        //{
        //arrayUser_recipt[i-1][j] =cash_collection.rows[i].cells[j].childNodes[0].value;
        // }
        if (j == 2) {
          // alert(cash_collection.rows[i].cells[j].childNodes[0].value)
          arrayUser_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;

          sum = +sum + +cash_collection.rows[i].cells[j].childNodes[0].value;

          var rem_amount = parseFloat(itemLinesEntry.column_aggregates['line_total']) - sum;
          rem_amount = parseFloat(rem_amount).toFixedRound(2);
          var color = 'color:red';
          if (parseFloat(rem_amount) == 0){
            color = 'color:mediumseagreen';
          }

          $("#rem_amount_").html(
            '<b style="'+color+'"> ' + rem_amount + "</b>"
          );
        }
        if (j == 3) {
          arrayUser_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;
        }
        if (j == 4) {
          arrayUser_recipt[i - 1][j] =
            cash_collection.rows[i].cells[j].childNodes[0].value;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function toaster_create(msg = " ") {
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
  var out =
    ' <div class="alert alert-info fade show alert-dismissible" role="alert"> <strong><i class="fa fa-check-circle" aria-hidden="true"></i></strong>' +
    msg +
    ' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span> </button></div>';
  if (msg == " ") {
    //document.getElementById('notify_error').innerHTML='';
  } else {
    //document.getElementById('notify_error').innerHTML=out;
  }

  toastr.options.closeButton = true;
  toastr.success(msg, { timeOut: 10000 });
}

var line_popover_error_array = [];
function insert_approval_saleswores_order(line_number_) {
  var order_type_txt = shoppingCart.load_order_info("order_type_text");
  var order_type_id = shoppingCart.load_order_info("order_type_val");
  try {
    var main_customer_id = $("#searchCust").val();
    var main_customner_name =
      $("#searchCust").select2("data")[0]["customer_name"];
    var main_customer_number =
      $("#searchCust").select2("data")[0]["customer_number"];
  } catch (ex) {
    var main_customer_number = 0;
    var main_customner_name = "";
    var main_customer_id = 0;
  }

  var invoice_type = shoppingCart.load_order_info("invoice_type");

  var defs = localStorage.getItem("defs");

  var cart = JSON.stringify(shoppingCart.listCart());
  var customer_po = shoppingCart.load_order_info("customer_po");

  var order_remarks = shoppingCart.load_order_info("order_remarks");

  var vat_percent = document.getElementById("vat_percent").innerHTML;

  var ship_to_customer_id = $("#customer").val();

  var bill_to_customer_id = $("#customer_bill").val();

  var deposit_amt = ""; //$('#dep_amt').val();
  var leads = $("#leads_lov").val();
  var order_category = $("#order_category_lov").val();

  charges_ = localStorage.getItem("charges_");
  var temp_order_number_to_oracle_order = $(
    "#temp_order_number_to_oracle_order"
  ).val();

  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;

  axios
    .post("insert_approval_saleswores_order", {
      billto_id: bill_to_customer_id,
      cart: cart,
      charges_: charges_,
      customer_po: customer_po,
      defs: defs,
      deposit_amt: deposit_amt,
      leads: leads,
      main_customer_name: main_customner_name,
      main_customer_id: main_customer_id,
      main_customer_number: main_customer_number,
      order_category: order_category,
      order_remarks: order_remarks,
      order_type_id: order_type_id,
      order_type_txt: order_type_txt,
      shipto_id: ship_to_customer_id,
      temp_order_number_to_oracle_order: temp_order_number_to_oracle_order,
      vat_percent: vat_percent,

      data: arraySystme_recipt,
      data_user: arrayUser_recipt,
      invoice_type: invoice_type,
    })
    .then(function (res) {
      console.log(res.data.status);
      console.log(res.data.message);

      if (res.data.status == "S") {
        //var eee='This order will go for approval';
        //alert('t')
        toastr.info(res.data.message);
        show_errorss(res.data.message + " Line Number " + line_number_, "info");

        // var eee='Entered price is less then the cost '+  (parseInt(b)  + 1);
        // toastr.info(eee);
        // show_errorss(eee)

        for (i = 0; i < line_number_; i++) {
          if (line_number_ - 1 == i) {
            line_popover_error_array[i] = new Array(5);
            line_popover_error_array[i][0] = res.data.message;
          }
        }

        // var b=line_number_-1
        //alert(b)
        // var cartArray = shoppingCart.listCart();
        // line_number_ = cartArray[b].obj.inventory_item_id+cartArray[b].obj.barcode;
        // var message =res.data.message;

        //alert('call')
        // alert(line_number_)
        //alert(message)
        //line_popover_error(line_number_ ,message,b);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

$(document).on("change", "#number0", function () {
  line_tsum = $(".line_tsum").text();
  rem_amount = $("#number0").val();
  line_tsum = $(".line_tsum").text();
  rem_amount_html = $("#rem_amount_").html();
  console.log("rem_amount", rem_amount);
  console.log("line_tsumv", line_tsum);
  if (parseFloat(rem_amount) == parseFloat(line_tsum)) {
    console.log("hello");
    $("#btn_order").removeAttr("disabled");
  } else {
  }
});



toastr.options.timeOut  = 10000;
toastr.options.extendedTimeOut  = 10000;
toastr.options.closeDuration  = 1000;
toastr.options.closeButton = true;


var glo_order_number = '';
var glo_doc_ids = [];
function finalize_inv(thizz, trigger_workflow=false) {
  // reload_data_based_on_tax()
  //get_tax_();
  thizz.disabled = true;
  calculate_enable_sum();
  var iddd = $(thizz).attr("id");

  if (iddd == "btn_draft_it") {
    iddd = "btn_draft_it";
  } else {
    iddd = "";
  }
  // blockUIEntirePage();
  // alert(1)
  //   var all_data=localStorage.getItem('defs');

  var order_type_txt = shoppingCart.load_order_info("order_type_text");
  var order_type_id = shoppingCart.load_order_info("order_type_val");

  var main_customer_id = $("#searchCust").val();
  try {
    var main_customner_name =
      $("#searchCust").select2("data")[0]["customer_name"];
  } catch (ex) {
    // toaster_create("customer not selected");
    HideDIV();
  }

  //submit_order

  var page_info = $("#page_info").val();
  var invoice_type = shoppingCart.load_order_info("invoice_type");

  var main_customer_number =
    $("#searchCust").select2("data")[0]["customer_number"];

  var defs = localStorage.getItem("defs");

  var cart = JSON.stringify(shoppingCart.listCart());

  var customer_po = $('#customer_po').val();

  var order_remarks = shoppingCart.load_order_info("order_remarks");

  var vat_percent = document.getElementById("vat_percent").innerHTML;

  var ship_to_customer_id = $("#customer").val();

  var bill_to_customer_id = $("#customer_bill").val();

  var deposit_amt = ""; //$('#dep_amt').val();
  var leads = $("#leads_lov").val();
  var order_category = $("#order_category_lov").val();

  var fisher_man_limit = $("#actual_bal_amount").val();

  var fisher_man_order_limit = $("#customer_limit").val();

  var discount_id = $("#discount_id").val();

  var case_mark = $('#case_mark').val();
  var p_instructions = $('#p_instructions').val();

  if (case_mark.length >  240){
    return toastr.error("Max Allowed characters 240! for Case Mark");
  } 
  if ( p_instructions.length >240){
    return toastr.error("Max Allowed characters 240! for Case Mark");
  } 

  var emirates_id = $('#doc_name').val() || "";


  if ($("#order_status").val()) {
    status = $("#order_status").val();
  } else {
    status = "AWAITING PAYMENT CONFIRMATION";
  }
  if (!validationsPassed){
    status = "PENDING DISCOUNT APPROVAL";
    trigger_workflow = true
  }

  //var print_charges=$('#print_charges').val();
  //var print_charges=$('#print_charges').is(":checked")

  //   axios.get("insert_sales_order?defs="+defs+"&cart="+cart+"&bill_cust="+bill_to_cust_number+"&ship_to="+ship_to_customer_number+"&order_type_id="+order_type_id+"&order_type_txt="+order_type_txt+"&main_customer_name="+main_customner_name+"&main_customer_number="+main_customer_number+"&main_customer_id="+main_customer_id+"&customer_po="+customer_po+"&order_remarks="+order_remarks+"&vat_percent="+vat_percent
  //   +'&shipto_id='+ship_to_customer_id+'&billto_id='+bill_to_customer_id+'&deposit_amt='+deposit_amt).then(function(res)

  charges_ = localStorage.getItem("charges_");
  var temp_order_number_to_oracle_order = $(
    "#temp_order_number_to_oracle_order"
  ).val();
  ShowDIV();

  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;
  // axios.post("/sales/get_line_type_base_on_order_header"
  // ,{
  //   o_typ_hdr_id:order_header_type_id,
  //   defs: localStorage.getItem('defs'),
  //   cart:JSON.stringify(shoppingCart.listCart())

  // })

  // axios.get("insert_saleswores_order?defs="+defs+"&cart="+cart+"&order_type_id="+order_type_id+"&order_type_txt="+order_type_txt+"&main_customer_name="+main_customner_name+"&main_customer_id="+main_customer_id+"&customer_po="+customer_po+"&order_remarks="+order_remarks+"&vat_percent="+vat_percent
  // +'&shipto_id='+ship_to_customer_id+'&billto_id='+bill_to_customer_id+'&deposit_amt='+deposit_amt+"&main_customer_number="+main_customer_number+'&charges_='+charges_
  // +'&leads='+leads+'&order_category='+order_category+'&temp_order_number_to_oracle_order='+temp_order_number_to_oracle_order+'&iddd='+iddd).then(function(res)
  var templateArr = [
    null,
    "7.35",
    "0.37",
    "",
    "",
    null,
    "",
    "",
    null,
    null,
    "400000",
    null,
    "",
    "0",
    "",
    "CREDIT LIMIT",
    ""
  ];



  arraySystme_recipt = [].slice.call($('#initDraftAppTable')
                                      .find('tr input:checked')
                                      .closest('tr'))
                                      .map(x=> {

                                          var obj = $(x).closest('table').DataTable().row(x).data();
                                          obj['VAT_AMT'] = ['ADVANCE PAYMENT',
                                                            'DOWN PAYMENT',
                                                            'DOWN PAYMENT ON US'].includes(
                                                                $(x).find('td')[$(x).closest("table").find('thead th:contains("Type")').index()].innerText
                                                            ) 
                                                          ? 
                                                          (
                                                            parseFloat($(x).find('._AMT_ASSIGNED').val()) - (parseFloat($(x).find('._AMT_ASSIGNED').val())  * (1/(1+parseFloat(itemLinesEntry.customer_vat_perc))))
                                                          ).toFixedRound(2)  
                                                          : null;
                                          obj['AMT_ASSIGNED'] = parseFloat($(x).find('._AMT_ASSIGNED').val()).toFixedRound(2);
                                          delete obj['A1']
                                          return obj;


                                      });                                                     
                            // [
                            //   null,
                            //           parseFloat($(x).find('._AMT_ASSIGNED').val()).toFixedRound(2),

                            //            ,
                            //     "",
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Credit Memo")').index()].innerText,
                            //     null,
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Rcd Loan No")').index()].innerText,
                            //     "",
                            //     null,
                            //     null,
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Loc Avlb Amt")').index()].innerText,
                            //     null,
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Receipt No")').index()].innerText,
                            //     "0",
                            //     "",
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Type")').index()].innerText,
                            //     $(x).find('td')[$(x).closest("table").find('thead th:contains("Unapplied Amt")').index()].innerText,
                                
                            //   ]           
                          
        var cart  = getCartDataForCreateSO();

        var apiData = {
          header_error,
          lines_errors,
          trigger_workflow,
          page_info: page_info,
          usingMob: usingMob,
          billto_id: bill_to_customer_id,
          cart: JSON.stringify(cart),
          charges_: charges_,
          customer_po: customer_po,
          defs: defs,
          deposit_amt: deposit_amt,
          iddd: iddd,
          leads: leads,
          main_customer_name: main_customner_name,
          main_customer_id: main_customer_id,
          main_customer_number: main_customer_number,
          order_category: order_category,
          fisher_man_limit: fisher_man_limit,
          fisher_man_order_limit: fisher_man_order_limit,
          discount_id: discount_id,
          order_remarks: order_remarks,
          order_type_id: order_type_id,
          order_type_txt: order_type_txt,
          shipto_id: ship_to_customer_id,
          temp_order_number_to_oracle_order: temp_order_number_to_oracle_order,
          vat_percent: vat_percent,
          status: status,

          data: arraySystme_recipt,
          data_user: arrayUser_recipt,
          invoice_type: invoice_type,
          case_mark:case_mark,
          p_instructions:p_instructions,
          
          emirates_id:emirates_id,
          doc_ids:glo_doc_ids,
          glo_order_number:glo_order_number,
          quotation_number:$('#cust_quotations').val(),
          saletype:$('#selectSaleTypeId').val(),

          summary_content:$('#entry-new')[0].outerHTML,

          acs_lines_length:cart.filter(x=> x.barcode).filter(x=> x.item_type == 'ACC').length,
          order_type_selected:$('#order_type_lov_item_page').select2('data')[0],


        };                                  

        axios
          .post("/saleswores/insert_saleswores_order", apiData)
          .then(function (res) {
            HideDIV();

            if (res.data.om_order_no != null || trigger_workflow){
              try {
                createAcsOrder(apiData,res.data.header_id,trigger_workflow);
              } catch (error) {
                toastr.error(error);
              }
            }
            
            console.log(res);
            // console.log(res.data)
            // alert(res.data.data)
            //unblockUIEntirePage();
            if (res.data.status == "S") {
              var order_gone_to = "";
              if (shoppingCart.load_order_info("invoice_type") == 'CA'){
                order_gone_to = "Pending Payment Collection from Accountant !"
              }
              if (shoppingCart.load_order_info("invoice_type") == 'CR' && trigger_workflow) {
                if (res.data.message == 'E'){
                  var system_err  = `<div class="alert alert-danger alert-dismissible fade show">
                                      <button type="button" class="close" data-dismiss="alert">&times;</button>
                                      ${Object.values(res.data.credit_resp).join("<br>")}
                                  </div>`
                  $('#system_err').empty().append(system_err);
                  // toastr.error(Object.values(res.data.credit_resp).join("<br>") );
                  return;
                }

              }
              if (shoppingCart.load_order_info("invoice_type") == 'CR' && !trigger_workflow) {
                  
                
                
                
                if (res.data.om_order_no == null){
                  var system_err  = `<div class="alert alert-danger alert-dismissible fade show">
                                      <button type="button" class="close" data-dismiss="alert">&times;</button>
                                      ${Object.values(res.data.credit_resp).join("<br>")}
                                  </div>`
                  $('#system_err').empty().append(system_err);
                  // toastr.error(Object.values(res.data.credit_resp).join("<br>") );
                  toastr.success(`Order ${res.data.header_id} created with status 'DRAFT' !`);


                  $('#btn_order').prop('disabled',false);
                  $('#customer_receipt').html('');
                  glo_total_AMT_ASSIGNED=0;

                  glo_order_number = res.data.header_id;

                  
                  $('.pick_slip_options').show();
                  
                  $('#order_number').val(glo_order_number);
                  

                  var data = {targetTabKey:'addInvoice'+window.location.search.split("?")[1],text:'Edit Order #'+res.data.header_id};
                  var event = new CustomEvent('renameTab', {detail:data});
                  window.parent.document.dispatchEvent(event)


                  // get_draft_data(true);

                  return;
                }else {
                  // print_invoice(res.data.header_id);
                }
              }

              swal(
                {
                  title: trigger_workflow? "Order with request no."+res.data.header_id+" is sent for approval !": `Order is successfuly created with ${res.data.om_order_no ? "Order No. "+res.data.om_order_no : 'Request No.'+res.data.header_id } ${order_gone_to}`,
                  text: " ",
                  type: "success",
                  // showCancelButton: true,
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#d33",
                  confirmButtonText: "OK",
                },
                function () {
                  //force_clear_cart()
                  //document.querySelectorAll('.info-box')[1].click();
                  localStorage.setItem('salesRedirectTo', status );


                  try {
                    var event1 = new CustomEvent('closeTab', {
                      detail: ['addInvoice'+window.location.search.split("?")[1]]
                    })
                    
                    window.parent.document.dispatchEvent(event1);
                    var event2 = new CustomEvent('closeTab', {
                      detail: [window.location.search.split("=")[1]]
                    })
                    window.parent.document.dispatchEvent(event2);
                    
                  } catch (error) {
                    
                    window.location.reload();
                  }

                  
                  

                  //location.href = "checkout_page?ohid="+res.data.header_id;
                  //    swal(
                  //        'Done!',
                  //        'Moving to next  page.',
                  //        'success'
                  //       );

                  // initiate_payment(res.data.order_number)

                  //get_draft_data(res.data.order_number,1);
                }
              );
            } else if (res.data.status == "DRAFT") {

              if (glo_order_number != null){
                
                toastr.success(`Order ${res.data.header_id} saved ! !`);
              } else{

                toastr.success(`Order ${res.data.header_id} created with status 'DRAFT' !`);
              }

              glo_order_number = res.data.header_id;

              
              $('.pick_slip_options').show();
              
              $('#order_number').val(glo_order_number);
              

              var data = {targetTabKey:'addInvoice'+window.location.search.split("?")[1],text:'Edit Order #'+res.data.header_id};
              var event = new CustomEvent('renameTab', {detail:data});
              window.parent.document.dispatchEvent(event);

              thizz.disabled = false;
            } else {
              // show_errorss("res.data.message");
              toastr.error(res.data.message, "Error");
              $("#temp_order_number_to_oracle_order").val(res.data.order_number);
              thizz.disabled = false;
            }
          })
          .catch(function (error) {
            //unblockUIEntirePage();
            HideDIV();

              if (error.response.status == 500){
                toastr.error(error.response.data.message);
                $('#btn_order').prop('disabled',false);
              }

            // alert(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Something went wrong!',
              footer: ''
            })
            // show_errorss(error);
            
          });
  
}

function createAcsOrder(apiData,parent_header_id,trigger_workflow){
    var cart = JSON.parse(apiData.cart);
    cart = cart.filter(x=> x.barcode).filter(x=> x.item_type == 'ACC');
    
    var acsItemExists = cart.length;

    cart.map(x=>{
      delete x['type'];
      return x;
    });
    var total_vat =  0;
    var total_discount = 0;
    var grand_total =  0;
    var total_excl = 0 ;
    cart.forEach(function(item,i){
      grand_total +=   parseFloat(parseFloat(parseFloat(item.line_total).toFixedRound(6)).toFixedRound(2))   ;
      total_vat +=  parseFloat(parseFloat(parseFloat(item.vat).toFixedRound(6)).toFixedRound(2)) ;
      total_discount +=  parseFloat(parseFloat(parseFloat(item.discount).toFixedRound(6)).toFixedRound(2)) ;
      total_excl +=  parseFloat(parseFloat(parseFloat(item.gross_amount).toFixedRound(6)).toFixedRound(2));
    })
    cart.forEach(function(item,i){
      item['obj']['grand_total'] = grand_total;
      item['obj']['total_vat'] = total_vat;
      item['obj']['total_discount'] = total_discount;
      item['obj']['total_excl'] = total_excl;
    });

    apiData['acs_order'] = true;
    apiData['parent_header_id'] = parent_header_id;
    apiData['acs_lines_length'] = cart.length;
    apiData['glo_order_number'] = glo_acs_order_number;

    
    apiData.cart = JSON.stringify(cart);

    if (!acsItemExists) return;

    ShowDIV()

    axios
    .post("/saleswores/insert_saleswores_order", apiData)
    .then(function (res) {

      if (!trigger_workflow)
        toastr.success("Acccessories order created successfully !")
      else
        toastr.success("Acccessories order saved !")

      console.log(res);
      HideDIV();
    })
    .catch(function(err){
      toastr.error("Acccessories order creation failed !")
      HideDIV();

    })
}


var status_collapse = "Closed";

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
$("#demo").on("shown.bs.collapse", function () {
  console.log("Opened");
  status_collapse = "Opened";
});

$("#demo").on("hidden.bs.collapse", function () {
  console.log("Closed");
  status_collapse = "Closed";
});

//new changes 2 sep 2020

$(function () {
  $(".select2-filter").select2({
    ajax: {
      url: "manufacturer_list?defs=" + localStorage.getItem("defs"),
      dataType: "json",
      delay: 250,
      data: function (params) {
        if ($(".select2-results").find(".search-loader").length == 0) {
          $(".select2-results").append(
            '<div class="d-flex search-loader justify-content-center p-2">                                          <div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
          );
        }
        return {
          q: params.term, // search term
          type: $(this).attr("id"),
          //type: 'CUSTOMER_NUMBER',
          // page: params.page
        };
      },
      processResults: function (data, params) {
        $(".search-loader").remove();

        params.page = params.page || 1;

        return {
          results: data,
          // pagination: {
          //  more: (params.page * 30) < data.total_count
          // }
        };
      },
      cache: true,
    },

    //placeholder: 'Search for a customer',
    //minimumInputLength: 1,
    //templateResult:formatRepo,
    //templateSelection: formatRepoSelection_number_bill
  });
});

function update_reserved_stock(div_id, status, status_1 = "", all = "") {
  //blockDIV('body')
  console.log(status_1);
  ShowDIV();
  $("#" + div_id).show();

  axios
    .get(
      "reserved_stock?defs=" +
        localStorage.getItem("defs") +
        "&status=" +
        status +
        "&status_1=" +
        status_1 +
        "&all=" +
        all +
        "&from_date=" +
        localStorage.getItem("fromdate") +
        "&to_date=" +
        localStorage.getItem("todate")
    )
    .then(function (res) {
      console;
      // unblockUIEntirePage()
      if ($.fn.dataTable.isDataTable("#tbl_reserved_stock")) {
        $("#tbl_reserved_stock").DataTable().destroy();
        $("#tbl_reserved_stock")[0].innerHTML = "";

        if (status == "PDI") {
          updat_tbl_pdi("#tbl_reserved_stock", res);
        } else {
          updat_tbl("#tbl_reserved_stock", res);
        }
      } else {
        if (status == "PDI") {
          updat_tbl_pdi("#tbl_reserved_stock", res);
        } else {
          updat_tbl("#tbl_reserved_stock", res);
        }
      }
      HideDIV();
    })
    .catch(function () {});
}

function updat_tbl_pdi(id, res) {
  m = 0;
  var oTblReport = $(id);
  console.log(res.data);
  //data=res.data.data;
  table = oTblReport.DataTable({
    // "scrollX": true,
    data: res.data.data,
    columns: res.data.columns,

    order: [[2, "desc"]],
    //dom: 'Blfrtip',
    dom: "<'row'<'col-md-2'B><'col-md-2'l><' toolbar col-md-5 '><'col-md-3'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",

    // buttons: [ 'csv', 'excel'],
    buttons: [
      {
        text: "Acknowledge",
        className: "btn ",
        action: function (e, dt, node, config) {
          // alert( 'Button activated' );
          acknowledge_pdi();
        },
      },
      "csv",
      "excel",
    ],
    initComplete: function (settings, json) {
      for (
        var i = 0;
        i <
        document.querySelectorAll(
          "#counts_row > div > div > div > span.info-box-text"
        ).length;
        i++
      ) {
        if (
          document.querySelectorAll(
            "#counts_row > div > div > div > span.info-box-text"
          )[i].innerText == selected
        ) {
          document.querySelectorAll(
            "#counts_row > div > div > div > span.info-box-number"
          )[i].innerText = res.data.data.length;
        }
      }
    },
    columnDefs: [
      {
        targets: [0, 8, 9],
        render: function (data, type, row, meta) {
          console.log(row);
          console.log(data);
          console.log(meta);
          if (meta.col == 8) {
            if (data.toUpperCase() == "CANCELLED") {
              return (
                '<span    class="badge badge-warning" >' + data + "</span> "
              );
            }
            if (data.toUpperCase() == "SEND TO DESTINATION") {
              return (
                '<span    class="badge badge-success" >' + data + "</span> "
              );
            }
            if (data.toUpperCase() == "OPEN") {
              return '<span    class="badge badge-info" >' + data + "</span> ";
            }
            return '<span  class="badge badge-warning" >' + data + "</span> ";
          }
          if (meta.col == 9) {
            if (data.toUpperCase() == "CANCELLED") {
              return (
                '<span    class="badge badge-warning" >' + data + "</span> "
              );
            }
            if (data.toUpperCase() == "SEND TO DESTINATION") {
              return (
                '<span    class="badge badge-success" >' + data + "</span> "
              );
            }
            if (data.toUpperCase() == "OPEN") {
              return '<span    class="badge badge-info" >' + data + "</span> ";
            }
            return '<span  class="badge badge-warning" >' + data + "</span> ";
          }

          if (meta.col == 0) {
            if (row.line_status.toUpperCase().trim() == "SEND TO DESTINATION") {
              m++;
              m += Math.floor(Math.random() * 925441470 + 1);
              return (
                "<input  id=" + m + '    type="checkbox" class="row-checkbox" >'
              );
            }

            return " ";
          }
          return data;
        },
      },
    ],
  });
}

function request_pdi(thiz) {
  ShowDIV();
  header_id = thiz.id;
  var defs = localStorage.getItem("defs");
  axios
    .get("request_pdi?defs=" + defs + "&header_id=" + header_id)
    .then(function (res) {
      HideDIV();
      console.log(res);
      if (res.data.status == "S") {
        toaster_create(res.data.message);
        $("#pdi_req_modal").modal("hide");
      } else {
        console.log(res.data.message);
        toaster_create(res.data.message);
      }
    })
    .catch(function () {
      HideDIV();

      alert("some issue");
    });
}

function acknowledge_pdi() {
  var rowsData = $("#tbl_reserved_stock")
    .DataTable()
    .rows($("#tbl_reserved_stock tr.table-info"))
    .data();

  var header_id = "";
  var lines_to_submit = "";
  for (var i = 0; i < rowsData.length; i++) {
    var e = rowsData[i];
    var obj = {};

    console.log(e);
    if (i == 0) {
      header_id = e.header_id;
    }
    if (header_id != e.header_id) {
      alert("error please select one PDI request at a time");
      return "error please select one PDI request at a time";
    }
    if (e.line_status.toUpperCase() != "SEND TO DESTINATION") {
      alert("error line status issue");
      return "error line status issue";
    }

    obj["name"] = e.header_id;
    lines_to_submit += e.line_id + "|";
    //obj['organization_code'] = e.line_status;
  }

  var defs = localStorage.getItem("defs");
  axios
    .get(
      "acknowledge_pdi?defs=" +
        defs +
        "&header_id=" +
        header_id +
        "&lines_to_submit=" +
        lines_to_submit
    )
    .then(function (res) {
      console.log(res);
      if (res.data.status == "S") {
      } else {
        console.log(res.data.message);
      }
    })
    .catch(function () {});
}

function ascii_to_hex(str) {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
}

var m = 0;
function updat_tbl(id, res) {
  //alert('call')
  m = 0;
  var oTblReport = $(id);
  console.log(res.data);
  table = oTblReport.DataTable({
    // "scrollX": true,
    data: res.data.data,
    columns: res.data.columns,
    order: [[19, "desc"]],
    //dom: 'Blfrtip',
    dom: "<'row'<'col-md-2'B><'col-md-2'l><' toolbar col-md-5 '><'col-md-3'f>><'row'<'col-md-12't>><'row'<'col-md-3'i><'col-md-5'><'col-md-4'p>>",

    buttons: ["csv", "excel"],
    initComplete: function (settings, json) {
      //  for(var i=0;i<document.querySelectorAll("#counts_row > div > div > div > span.info-box-text").length;i++)
      // {
      //     if(document.querySelectorAll("#counts_row > div > div > div > span.info-box-text")[i].innerText==selected)
      //     {
      //         document.querySelectorAll("#counts_row > div > div > div > span.info-box-number")[i].innerText= res.data.data.length
      //     }
      // }
    },
    drawCallback: function (settings) {
      //alert( 'DataTables has redrawn the table' );
      //loop_for_timer()
    },
    columnDefs: [
      {
        targets: [0, 1, 2, 3, 8],
        render: function (data, type, row, meta) {
          // console.log(row)
          //console.log(data)
          //console.log('12312313123')
          // console.log(meta)
          // console.log(row.status)
          if (meta.col == 8) {
            if (data == "CANCELED")
              return (
                '<span    class="badge badge-danger" >' + data + "</span> "
              );
            else if (data == "ENTERED") {
              return (
                '<span    class="badge badge-warning" >' + data + "</span> "
              );
            } else
              return (
                '<span    class="badge badge-success" >' + data + "</span> "
              );
          }

          if (meta.col == 2) {
            if (data == "") {
              // data=row.order_header;
            }
            return data;
          }
          if (meta.col == 3) {
            var login_username = JSON.parse(localStorage.getItem("defs"))[
              "oracle_user_name"
            ];

            // return '<a target="_blank" href="https://hrdev.alyousuf.net/chatter/?756E616D65='+ascii_to_hex(login_username)+'&6474797065='+ascii_to_hex("Sales Order")+'&646E6F='+ascii_to_hex(""+row.order_header)+'" >'+row.order_header+'</a>';
            return (
              '<span  style="color: -webkit-link;cursor: pointer; text-decoration: underline;"  onclick="invoice_info(' +
              row.order_header +
              ')" >' +
              data +
              "</span> "
            );
          }

          if (row.status == "ENTERED") {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);
            var organization_name = JSON.parse(localStorage.getItem("defs"))[
              "organization_name"
            ];
            var abc = "";
            // if(row.actual_stock_location!=organization_name)
            // {
            //   abc='<a class="dropdown-item" href="javascript:void(0)"  onclick="inventory_trans(this,'+row.order_header+')">Inventory Trans</a>';

            // }

            // return '<div class="btn-group">\
            // <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
            //     <i class="ti-menu"></i>Action\
            // </button>\
            // <div class="dropdown-menu animated flipInY">\
            //     <a class="dropdown-item" href="javascript:void(0)" onclick="initiate_payment('+row.order_header+')" data-header-id="'+row.order_header+'">Draft Application</a>\
            //     <a class="dropdown-item" href="javascript:void(0)"  onclick="pdi_request(this,'+row.order_header_id+')">PDI</a>'+abc+'\
            //     <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver('+row.order_header+')" data-header-id="'+row.order_header+'">History</a>\
            //     <a class="dropdown-item" href="javascript:void(0)" onclick="cancel_order(this,'+row.order_header_id+','+row.oracle_order+','+row.org_id+')" data-header-id="'+row.order_header_id+'">Cancel Order</a>\
            //     <a class="dropdown-item" href="javascript:void(0)" onclick="modify_order(this,'+row.order_header+','+row.org_id+')" data-header-id="'+row.order_header_id+'">Edit Order</a>\
            // </div>\
            // </div>';

            return (
              '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
                <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">History</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="cancel_order(this,' +
              row.order_header +
              "," +
              row.order_header +
              "," +
              row.org_id +
              ')" data-header-id="' +
              row.order_header +
              '">Cancel Order</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="modify_order(this,' +
              row.order_header +
              "," +
              row.org_id +
              ')" data-header-id="' +
              row.order_header_id +
              '">Edit Order</a>\
            </div>\
            </div>'
            );

            //inventroy_t
          }
          if (row.status == "TEMP" || row.status == "") {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);
            return (
              '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
            <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">History</a>\
            <a class="dropdown-item" href="javascript:void(0)" onclick="modify_order(this,' +
              row.order_header +
              "," +
              row.org_id +
              ')" data-header-id="' +
              row.order_header_id +
              '">Edit Order</a>\
            </div>\
        </div>'
            );
          }
          if (
            row.status == "PENDING INTERNAL APPROVAL" ||
            row.status == "AWAITING PAYMENT CONFIRMATION" ||
            row.status == "CANCELLED"
          ) {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);

            return (
              '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
            <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">History</a>\
            </div>\
            </div>'
            );
          }
          if (row.status == "PAYMENT RECEIVED") {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);

            return (
              '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
            <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">History</a>\
            <a class="dropdown-item" href="javascript:void(0)" onclick="finalize_order(this,' +
              row.order_header +
              "," +
              row.order_header +
              "," +
              row.org_id +
              ')" data-header-id="' +
              row.order_header +
              '">Finalize Order</a>\
            <a class="dropdown-item" href="javascript:void(0)" onclick="cancel_order(this,' +
              row.order_header +
              "," +
              row.order_header +
              "," +
              row.org_id +
              ')" data-header-id="' +
              row.order_header +
              '">Cancel Order</a>\
            </div>\
            </div>'
            );
          }

          if (row.status == "BOOKED" || row.status == "RETURN INITIATED") {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);

            if (selected == "Return Orders") {
              if (row.line_status == "AWAITING_RETURN") {
                return (
                  '<div class="btn-group">\
                    <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                        <i class="ti-menu"></i>Action\
                    </button>\
                    <div class="dropdown-menu animated flipInY">\
                        <a class="dropdown-item" href="javascript:void(0)"  onclick="ret_receiving(this,' +
                  row.order_header_id +
                  ')">Return Receiving</a>\
                        <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                  row.order_header_id +
                  "," +
                  res.data.submenu_id +
                  ')" data-header-id="' +
                  row.order_header +
                  '">Print Invoice</a>\
                        <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                  row.order_header +
                  ')" data-header-id="' +
                  row.order_header +
                  '">History</a>\
                    </div>\
                    </div>'
                );
              } else if (row.line_status == "CLOSED") {
                console.log("line 4788");

                return (
                  '<div class="btn-group">\
                    <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                        <i class="ti-menu"></i>Action\
                    </button>\
                    <div class="dropdown-menu animated flipInY">\
                        <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                  row.order_header_id +
                  "," +
                  res.data.submenu_id +
                  ')" data-header-id="' +
                  row.order_header +
                  '">Print Invoice</a>\
                        <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                  row.order_header +
                  ')" data-header-id="' +
                  row.order_header +
                  '">History</a>\
                        </div>\
                    </div>'
                );
              } else if (row.line_status == "ENTERED") {
                return (
                  '<div class="btn-group">\
                    <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                        <i class="ti-menu"></i>Action\
                    </button>\
                    <div class="dropdown-menu animated flipInY">\
                    <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                  row.order_header +
                  ')" data-header-id="' +
                  row.order_header +
                  '">History</a>\
                        </div>\
                    </div>'
                );
              } else {
                return (
                  '<div class="btn-group">\
                    <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                        <i class="ti-menu"></i>Action\
                    </button>\
                    <div class="dropdown-menu animated flipInY">\
                    <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                  row.order_header +
                  ')" data-header-id="' +
                  row.order_header +
                  '">History</a>\
                        </div>\
                    </div>'
                );
              }
            }

            //AWAITING_RETURN
            else if (
              row.line_status == "CLOSED" ||
              row.line_status == "AWAITING_SHIPPING"
            ) {
              console.log("line 4831");
              return (
                '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                row.order_header_id +
                "," +
                res.data.submenu_id +
                ')" data-header-id="' +
                row.order_header +
                '">Print Invoice</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                row.order_header_id +
                "," +
                res.data.submenu_id +
                ",1," +
                row.order_header +
                ')" data-header-id="' +
                row.order_header +
                '">Email Invoice</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                row.order_header_id +
                "," +
                res.data.submenu_id +
                ",1," +
                row.order_header +
                ',2)" data-header-id="' +
                row.order_header +
                '">Send SMS</a>\
                <a class="dropdown-item" href="javascript:void(0)"  onclick="Ret_invoice(this,' +
                row.order_header_id +
                ')">Sales Return</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                row.order_header +
                ')" data-header-id="' +
                row.order_header +
                '">History</a>\
            </div>\
            </div>'
              );
            } else {
              console.log("line 4849");
              return (
                '<div class="btn-group">\
                <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
                </button>\
                <div class="dropdown-menu animated flipInY">\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
                row.order_header_id +
                "," +
                res.data.submenu_id +
                ')" data-header-id="' +
                row.order_header +
                '">Print Invoice</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
                row.order_header +
                ')" data-header-id="' +
                row.order_header +
                '">History</a>\
                </div>\
                </div>'
              );
            }
          } else {
            return (
              '<div class="btn-group">\
            <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                <i class="ti-menu"></i>Action\
            </button>\
            <div class="dropdown-menu animated flipInY">\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
              row.order_header_id +
              "," +
              res.data.submenu_id +
              ')" data-header-id="' +
              row.order_header +
              '">Print Invoice</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
              row.order_header_id +
              "," +
              res.data.submenu_id +
              ",1," +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">Email Invoice</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="print_invoice(' +
              row.order_header_id +
              "," +
              res.data.submenu_id +
              ",1," +
              row.order_header +
              ',2)" data-header-id="' +
              row.order_header +
              '">Send SMS</a>\
                <a class="dropdown-item" href="javascript:void(0)"  onclick="Ret_invoice(this,' +
              row.order_header_id +
              ')">Sales Return</a>\
                <a class="dropdown-item" href="javascript:void(0)" onclick="get_approver(' +
              row.order_header +
              ')" data-header-id="' +
              row.order_header +
              '">History</a>\
            </div>\
            </div>'
            );
          }
          if (row.status == "ADVANCE PAYMENT INITIATED") {
            m++;
            m += Math.floor(Math.random() * 925441470 + 1);
            return (
              '<div style="   display: inline-flex; "><span   class="badge badge-danger"  style="padding:6px;padding-top: 7px;  margin-left: 15px;    cursor: pointer;"   onclick="invoice_cancel(' +
              row.order_header +
              ')" ><i class="fa fa-window-close" aria-hidden="true"></i></span></div> Time left:  <span id="countdown_' +
              m +
              '" data-diff=' +
              row.diff +
              '     data-reservation="' +
              row.reservation_end_date_formate +
              '"    class="timer"></span>'
            );
          } else {
            return "";
          }
        },
      },
    ],
    rowId: function (d) {
      return d.order_header.split(" ").join("").trim();
    },

    rowCallback: function (row, data, index) {
      // console.log("row")
      // console.log(data.reservation_end_date)
      // console.log(row)
      var stock = data.diff;
      if (stock != "") {
        if (stock < 3) {
          $(row).addClass("forty_eight");
        }
        if (stock < 1) {
        }
      }
    },
  });
  $("div.toolbar").html(
    '<p id="date_filter"><input  id="fromdate"  style="    margin-right: 20px;"  class="form-control-sm"  autocomplete="off"  /><input class="form-control-sm"  autocomplete="off"  id="todate" />    <button class="btn bg-gradient-primary btn-xs" style="     margin-bottom: 3px;   height: 30px;"  onclick="updatedate()"   tabindex="0" aria-controls="tbl_reserved_stock" type="button"><span>Set Date</span></button></p>'
  );
  date_range();
}

function finalize_order(thizz, hid, oumber, org_id) {
  $(thizz).disabled = true;

  swal(
    {
      title: "Press OK to confirm and finalize order",
      text: "",
      type: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "OK",
    },
    function () {
      ShowDIV();
      axios
        .get(
          "finalize_order_create_in_oracle?order_number=" +
            oumber +
            "&org_id=" +
            org_id
        )
        .then(function (res) {
          HideDIV();
          //console.log(res)
          if (res.data.status == "S") {
            print_invoice(res.data.header_id, 1);
            toaster_create(res.data.message);
            document.querySelectorAll(".info-box")[2].click();
          } else {
            print_invoice(res.data.header_id, 1);
            console.log(res.data.message);
            toaster_create(res.data.message);
            document.querySelectorAll(".info-box")[2].click();
            $(thizz).disabled = false;
          }
        })
        .catch(function () {
          HideDIV();
          print_invoice(res.data.header_id, 1);
          console.log(res.data.message);
          toaster_create(res.data.message);
        });
    }
  );
}

function show_errorss(txt, error_type_class = "warning") {
  document.getElementById("error_area").innerHTML =
    // '<div class="alert alert-' +
    // error_type_class +
    // ' alert-dismissible fade show" role="alert"> '+ 
    `<button type="button" data-toggle="popover" title="" class="btn btn-outline-danger  pr-2 pl-2 " style="" data-original-title="Header Error" data-content="${txt}"><i class="right fas fa-exclamation-triangle"></i></button>`
    // +
    // txt +
    // ' <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button></div>';

    $('[data-toggle="popover"]').popover({ });
}
function ret_receiving(thizz, hid) {
  var defs = localStorage.getItem("defs");
  dataSet = [];
  axios
    .get("ret_receving?ohid=" + hid + "&defs=" + defs)
    .then(function (response) {
      //alert(response);
      console.log(response);

      //$.unblockUI()
      $("#ret_rec").modal("show");
      $("#ret_rec_body").html(response.data);

      //$("#sbtn").attr("disabled", "disabled");
      //document.getElementById('sales_type_list').onchange()
    })
    .catch(function (error) {
      console.log(error);
      //$.unblockUI()
    });
}

function ret_receving_btn() {
  ShowDIV();
  var order_header_id = $("#p_order_header_id").html();
  var defs = localStorage.getItem("defs");
  axios
    .get("insert_receving?ohid=" + order_header_id + "&defs=" + defs)
    .then(function (response) {
      HideDIV();
      console.log(response);
      if (response.data.status == "S") {
        alert(response.data.message);
        $("#ret_rec").modal("hide");
      }
    })
    .catch(function (error) {
      HideDIV();
      console.log(error);
      // $.unblockUI()
    });
}
var all_records;
function modify_order(e, order_number, org_id) {
  $("#btn_draft_it").prop("disabled", false);

  $("#clear-cart").prop("disabled", true);

  $("#temp_order_number_to_oracle_order").val("");
  document
    .querySelectorAll("#counts_row > div > div > div > span.info-box-text")[0]
    .click();
  // $("#headingTwo_1 > h2 > button").removeAttr("data-target");
  //$("#headingOne > h2 > button").removeAttr("data-target");
  //document.querySelector("#headingTwo > h2 > button").click();
  swal(
    {
      title: "Click Yes to Edit Order Number :" + order_number,
      text: "This action will clear cart .You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes !",
    },
    function () {
      shoppingCart.clearCart();
      var defs = localStorage.getItem("defs");
      dataSet = [];
      axios.defaults.xsrfCookieName = "csrftoken";
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
      axios.defaults.withCredentials = true;
      axios
        .get(
          "get_order_det_for_edit?order_number=" +
            order_number +
            "&defs=" +
            defs +
            "&org_id=" +
            org_id
        )
        .then(function (response) {
          console.log(response);
          all_records = response.data.data;

          for (var i = 0; i < all_records.length; i++) {
            var customer_name = all_records[i].customer_name;
            $("#sel_cust").html(customer_name);
            $("#selected_item").append(all_records[i].item_code);

            var obj = {};
            console.log(e);
            obj["name"] = all_records[i].name;
            obj["name"] = obj["name"].trim() + all_records[i].ship_from_org_id;
            obj["item_code"] = all_records[i].item_code;
            obj["organization_code"] = all_records[i].organization_code;
            obj["from_org_name"] = all_records[i].from_org_name;
            obj["serial_number"] = all_records[i].serial_number;
            obj["inventory_item_id"] = all_records[i].inventory_item_id;
            obj["subinventory"] = all_records[i].subinventory;
            obj["quantity"] = all_records[i].onhand_qty;
            obj["onhand_qty"] = all_records[i].onhand_qty;
            // obj['count'] = all_records[i].quantity;
            obj["color"] = all_records[i].color;
            obj["model_year"] = all_records[i].model_year;
            obj["uom"] = all_records[i].uom;
            obj["e"] = all_records[i];
            obj["barcode"] = all_records[i].barcode;
            obj["organization_id"] = all_records[i].ship_from_org_id;
            obj["price"] = parseFloat(
              all_records[i].unit_selling_price
            ).toFixedRound(2);

            $("#order_type_lov_item_page").val(
              all_records[0].transaction_type_id
            );
            inv_tot.vat_p = all_records[0].tax_percentage;

            var price = Number(0);
            console.log(obj);
            shoppingCart.addItemToCart(obj, price, all_records[i].quantity);
            // toaster_create(obj['item_code'] +' item added in cart click on  2. Fill Customer Details to view details ');
            //get_tax_();
          }

          var cartArray = shoppingCart.listCart();
          var totalqtyy = 0;
          for (var i in cartArray) {
            totalqtyy = +totalqtyy + +cartArray[i].count;
          }

          var el = document.querySelector("#qty_selected");
          el.setAttribute("data-count", totalqtyy);
          //customer_name

          // reload_customer();

          var data = {
            id: all_records[0].cust_account_id,
            text: all_records[0].customer_name,
            customer_number: all_records[0].account_number,
            customer_name: all_records[0].customer_name,
          };

          var newOption = new Option(data.text, data.id, false, false);

          $("#searchCust").append(newOption).trigger("change");

          $("#searchCust").trigger({
            type: "select2:select",
            params: {
              data: data,
            },
          });

          // 'data', {id: newID, text: newText}

          // $('#searchCust').select2('data',{id:all_records[0].cust_account_id,text:all_records[0].customer_name,customer_number:all_records[0].account_number,customer_name:all_records[0].customer_name})

          // $('#searchCust').select2({data:[{id:all_records[0].cust_account_id,text:all_records[0].customer_name,customer_number:all_records[0].account_number,customer_name:all_records[0].customer_name}]})

          //$('#searchCust').select2({data:[{customer_number:all_records[0].account_number,customer_name:all_records[0].customer_name}]})

          //$('#searchCust').append('<option value="'+all_records[0].cust_account_id+'">'+all_records[0].customer_name+'</option>')

          // $('#searchCust').append('<option value="'+all_records[0].cust_account_id+'">'+all_records[0].customer_name+'</option>')

          $("#customer").append(
            '<option value="' +
              all_records[0].ship_to_customer_id +
              '">' +
              response.data.ship_to_customer_name +
              "</option>"
          );

          $("#customer_bill").append(
            '<option value="' +
              all_records[0].bill_to_customer_id +
              '">' +
              response.data.bill_to_customer_name +
              "</option>"
          );

          // $("#order_type_lov_item_page").prop('disabled', true);
          //$('#btn_order').html('Create Order');
          //$('#clear-cart').css("display", "none");
          $("#new_customer_url").css("display", "none");
          $("#msg_for_edit_order").html(
            "<span style='color:red;'>This is temp order number : <b>" +
              order_number +
              "</b> after clicking on update it will create new oracle order&nbsp;&nbsp;&nbsp;&nbsp;</span>"
          ); //.insertBefore("#clear-cart");
          // $("#clear-cart").prepend();
          displayCart((hide_remove_btn = 1));
          //refresh_reservation_details();
          $("#temp_order_number_to_oracle_order").val(order_number);

          //

          $("#searchCust")
            .val(all_records[0].cust_account_id)
            .trigger("change");

          $("#searchCust").select2("data")[0]["customer_name"] =
            all_records[0].customer_name;
          $("#searchCust").select2("data")[0]["customer_number"] =
            all_records[0].account_number;

          // $('#searchCust').val(1).trigger('change')

          $("#customer").val(all_records[0].ship_to_customer_id);

          $("#customer_bill").val(all_records[0].bill_to_customer_id);

          $("#shiptocust").val(response.data.ship_to_customer_name);

          $("#billtocust").val(response.data.bill_to_customer_name);
          $("#customer_po").val(response.data.data[0].lpo_number);
          $("#order_remarks").val(response.data.data[0].order_note);

          // $("#searchCust").prop('disabled', true);
          // //$("#customer").prop('disabled', true);
          // $("#customer_bill").prop('disabled', true);

          // console.log(dataSet)

          // my_columns = [];
          // $.each( dataSet[0], function( key, value )
          // {
          //         var my_item = {};
          //         my_item.data = key;
          //         my_item.title = key;
          //         my_columns.push(my_item);
          // });
          // vDash.order_line_col= my_columns;
          // vDash.order_line_data=dataSet;

          // vDash.t =response.data.invs[0].invoice_total_excl_tax;
          // vDash.tv = response.data.invs[0].invoice_total_tax;
          // vDash.gt= response.data.invs[0].invoice_total;
          // vDash.vat_p= response.data.invs[0].tax_percentage;
          // vDash.td= response.data.invs[0].invoice_discount;
          // alert(vDash.t)

          // $('#edit_order').modal('show');
          // $("#sbtn").attr("disabled", "disabled");
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  );
}
function create_pdi_req_activities(thizz) {
  ShowDIV();
  $(thizz).disabled = true;
  var selected_line_id = vDash.pdi_line_id;
  var defs = localStorage.getItem("defs");
  var cart = JSON.stringify(get_activities("#pdi_line_act"));
  axios
    .get(
      "insert_pdi_lines_act?defs=" +
        defs +
        "&cart=" +
        cart +
        "&selected_line_id=" +
        selected_line_id
    )
    .then(function (res) {
      HideDIV();
      if (res.data.status == "S") {
        toaster_create(res.data.message);
      } else {
        console.log(res.data.message);
        $(thizz).disabled = false;
      }
    })
    .catch(function () {});
}
function get_activities(id) {
  var data = [];
  $(id + " tr").each(function (i, el) {
    if (i != 0) {
      var $tds = $(this).find("td");
      var row = [];

      $tds.each(function (i, el) {
        if (i == 2) {
          row.push($(this).find("select").val());
        } else {
          row.push($(this).text());
        }
      });

      if (row != "") {
        data.push(row);
      }
    }
  });

  console.log(data);
  return data;
}

function line_activity(thizz) {
  ShowDIV();
  pdi_line_id = thizz.id;
  var defs = localStorage.getItem("defs");
  dataSet = [];
  axios
    .get("pdi_lines_act?pdi_line_id=" + pdi_line_id + "&defs=" + defs)
    .then(function (response) {
      HideDIV();
      console.log(response);
      dataSet = response.data.invs;
      console.log(dataSet);

      my_columns = [];
      $.each(dataSet[0], function (key, value) {
        var my_item = {};
        my_item.data = key;
        my_item.title = key;
        my_columns.push(my_item);
      });
      //vDash.pdi_line_activities=dataSet;

      vDash.pdi_line_activities_lov = response.data.line_reason;
      vDash.pdi_line_id = pdi_line_id;

      $("#pdi_req_line_modal").modal("show");
      $("#pdi_req_line_modal_body").html(response.data.html);
    })
    .catch(function (error) {
      console.log(error);
      //$.unblockUI()
    });
}
function create_pdi_req_header() {
  ShowDIV();
  var defs = localStorage.getItem("defs");
  var cart = JSON.stringify(get("#pdi_main_tbl"));
  var order_number = $("#order_n").html();
  var required_date = $("#required_date").val();
  var desc = $("#desc").val();
  var order_id = $("#order_id").val();

  if (desc == "" || desc == " ") {
    HideDIV();
    alert("Please enter Desc at header level");
    return;
  }
  if (cart == "[]") {
    HideDIV();
    alert("Nothing Selected");
    return;
  }
  axios
    .get(
      "insert_pdi_lines?defs=" +
        defs +
        "&cart=" +
        cart +
        "&order_number=" +
        order_number +
        "&required_date=" +
        required_date +
        "&desc=" +
        desc
    )
    .then(function (res) {
      HideDIV();
      if (res.data.status == "S") {
        toaster_create(res.data.message);
        $("#pdi_req_modal").modal("hide");
        pdi_request("", order_id);
      } else {
        console.log(res.data.message);
      }
    })
    .catch(function () {});
}
function get(id) {
  var data = [];
  $(id + " tr").each(function (i, el) {
    if (i != 0) {
      var $tds = $(this).find("td");
      var row = [];

      $tds.each(function (i, el) {
        if (i == 0) {
          console.log($(this).find("input").prop("checked"));
          if (
            $(this).find("input").prop("checked") == false ||
            $(this).find("input").prop("checked") == undefined
          ) {
            return false;
          }
        }

        if (i == 13) {
          row.push($(this).find("input").val());
        } else if (i == 11) {
          row.push($(this).find("select").val());
        } else {
          row.push($(this).text());
        }
      });

      if (row != "") {
        data.push(row);
      }
    }
  });

  console.log(data);
  return data;
}

function inventory_trans(thizz, hid) {
  var defs = localStorage.getItem("defs");

  // var inventroy_t=localStorage.getItem('inventroy_t');
  var inventroy_t = [].slice
    .call(
      $(
        'li:contains("' +
          $("nav li.nav-item a.active")
            .closest("ul")
            .closest("li")
            .find("p")
            .text()
            .split("-Sales")[0] +
          '-Inventory") a'
      )
    )
    .map((x) => x.href)
    .filter((x) => x.includes("/sio/"))[0];

  window.open(inventroy_t + "&o=" + hid, "_blank");

  // window.open("invoice?rid="+rid+"&aid="+aid+"&mid="+mid+"&smid="+submenu_id+"&uid="+uid+"&ohid="+ohid, '_blank');
}

function pdi_request(thizz, hid) {
  ShowDIV();
  var defs = localStorage.getItem("defs");
  dataSet = [];
  axios
    .get("pdi_det?ohid=" + hid + "&defs=" + defs)
    .then(function (response) {
      HideDIV();
      console.log(response);
      dataSet = response.data.invs;
      console.log(dataSet);

      my_columns = [];
      $.each(dataSet[0], function (key, value) {
        var my_item = {};
        my_item.data = key;
        my_item.title = key;
        my_columns.push(my_item);
      });
      vDash.ret_line_col = my_columns;
      vDash.ret_line_data = dataSet;
      vDash.ret_type = response.data.type;
      vDash.ret_line_reason_lov = response.data.line_reason;
      vDash.ret_line_type = response.data.ret_line_type.data;

      $("#pdi_req_modal").modal("show");
      $("#process_type").html(response.data.process_type);
      $("#order_n").html(response.data.invs[0].om_order_number);
      $("#order_id").val(hid);

      $("#header_v2").html(response.data.header_v2);

      $("#required_date").datepicker({
        dateFormat: "dd-M-y",
        buttonImageOnly: true,
        showOn: "both",
        showButtonPanel: true,
        onClose: function (e) {
          var ev = window.event;
          if (ev.srcElement.innerHTML == "Clear") this.value = "";
        },
        closeText: "Clear",
        buttonText: "",
      });
      $("#required_date").datepicker("setDate", new Date());
    })
    .catch(function (error) {
      console.log(error);
      //$.unblockUI()
    });
}

$(document).on("shown.bs.modal", "#pdi_req_line_modal", function () {
  // alert("I want this to appear after the modal has opened!");
  dataSet = vDash.pdi_line_activities_lov;
  var out = "<select>";
  for (var i = 0; i < dataSet.length; i++) {
    out +=
      "<option  value=" +
      dataSet[i].activity_name +
      ">  " +
      dataSet[i].activity_desc +
      "    </option>";
  }
  out += "</select>";
  $("#pdi_select").html(out);
});

$(document).on("shown.bs.modal", "#pdi_req_modal", function () {
  //alert("I want this to appear after the modal has opened!");

  dataSet = vDash.ret_line_data;
  for (var i = 0; i < dataSet.length; i++) {
    $("#" + dataSet[i].line_number).datepicker({
      dateFormat: "dd-M-y",
      buttonImageOnly: true,
      showOn: "both",
      showButtonPanel: true,
      onClose: function (e) {
        var ev = window.event;
        if (ev.srcElement.innerHTML == "Clear") this.value = "";
      },
      closeText: "Clear",
      buttonText: "",
    });
    $("#" + dataSet[i].line_number).datepicker("setDate", new Date());
  }
  $("#myInput").trigger("focus");
});

function Ret_invoice(thizz, hid) {
  var defs = localStorage.getItem("defs");
  dataSet = [];
  axios
    .get("get_invoice_det?ohid=" + hid + "&defs=" + defs)
    .then(function (response) {
      //alert(response);
      console.log(response);
      dataSet = response.data.invs;
      console.log(dataSet);

      my_columns = [];
      $.each(dataSet[0], function (key, value) {
        var my_item = {};
        my_item.data = key;
        my_item.title = key;
        my_columns.push(my_item);
      });
      vDash.ret_line_col = my_columns;
      vDash.ret_line_data = dataSet;
      vDash.ret_type = response.data.type;
      vDash.ret_line_reason_lov = response.data.line_reason;
      vDash.ret_line_type = response.data.ret_line_type.data;
      //$.unblockUI()
      $("#ret_modal").modal("show");
      $("#sbtn").attr("disabled", "disabled");
      //document.getElementById('sales_type_list').onchange()
    })
    .catch(function (error) {
      console.log(error);
      //$.unblockUI()
    });
}

function receivedPurchase(arg) {
  //alert(2)
  var order_val = arg.getAttribute("data_val");
  var entered = $(arg).val();
  $("#sbtn_r").attr("disabled", "disabled");
  //alert(order_val)
  // alert(entered)
  if (parseInt(entered) > parseInt(order_val)) {
    document.getElementById(arg.id + "msg").innerHTML =
      "Return Qty is higher Than Sales Qty";
    return;
  } else {
    $("#" + arg.id + "msg").empty();
  }
  var flag = 0;
  var myTable = document.getElementById("firstTable").tBodies[0];
  for (var r = 0, n = myTable.rows.length; r < n; r++) {
    for (var c = 0, m = myTable.rows[r].cells.length; c < m; c++) {
      if (c == 2) {
        var orderd = myTable.rows[r].cells[c].innerHTML;
      }
      if (c == 4) {
        var entred = myTable.rows[r].cells[c].childNodes[0].value;
        if (entred == "" || entred == " ") {
          flag = 1;
          $("#sbtn_r").attr("disabled", "disabled");
        }
      }
    }

    if (parseInt(entred) > parseInt(orderd)) {
      flag = 1;
    }
  }
  if (flag == 0) {
    $("#sbtn_r").removeAttr("disabled");
  }
}

var myArray1 = [];
function savereturn() {
  ShowDIV();
  // blockDIV('#ret_modal .modal-content')
  var defs = localStorage.getItem("defs");
  var myTable = document.getElementById("firstTable").tBodies[0];
  myArray1 = [];
  for (var r = 0, n = myTable.rows.length; r < n; r++) {
    myArray1[r] = new Array(4);
    for (var c = 0, m = myTable.rows[r].cells.length; c < m; c++) {
      if (c == 0) {
        //line number
        myArray1[r][0] = myTable.rows[r].cells[c].innerHTML;
      }
      if (c == 4) {
        //entered quantity
        myArray1[r][1] = myTable.rows[r].cells[c].childNodes[0].value;
      }
      if (c == 5) {
        //selected reason
        myArray1[r][2] = myTable.rows[r].cells[c].childNodes[0].value;
      }
      if (c == 6) {
        //entered remarks
        myArray1[r][3] = myTable.rows[r].cells[c].childNodes[0].value;
        myArray1[r][4] = myTable.rows[r].cells[c].childNodes[1].value;
      }
      if (c == 7) {
        //entered remarks
        var asdf = myTable.rows[r].cells[c].childNodes[0].id;
        myArray1[r][7] = myTable.rows[r].cells[c].childNodes[0].value;
        myArray1[r][8] = $("#" + asdf + " option:selected").text();
      }
    }
  }

  var custom_table_oder_number = document.getElementById(
    "custom_table_oder_number"
  ).value;

  var custom_table_oder_header_id = document.getElementById(
    "custom_table_oder_header_id"
  ).value;

  var sales_type_list = document.getElementById("sales_type_list").value;
  var sales_type_list_text = $("#sales_type_list option:selected").text();

  console.log(myArray1);
  if (myArray1.length == 0) {
    alert("Enter Return qunatity");
    return;
  }
  return_item = JSON.stringify(myArray1);

  var defs = localStorage.getItem("defs");
  axios
    .get(
      "insert_sales_return?custom_table_oder_number=" +
        custom_table_oder_number +
        "&return_item=" +
        return_item +
        "&sales_type_list=" +
        sales_type_list +
        "&sales_type_list_text=" +
        sales_type_list_text +
        "&custom_table_oder_header_id=" +
        custom_table_oder_header_id +
        "&defs=" +
        defs
    )
    .then(function (response) {
      HideDIV();
      //$('#ret_modal .modal-content').unblock()
      //alert(response.data.cereate_sale_status)

      if (response.data.cereate_sale_status == "S") {
        alert("order number is created :" + response.data.message);

        $("#ret_modal").modal("hide");
        // str='CLOSED';
        // str1='BOOKED';
        // str2='ENTERED';
        // str3='REJECTED';
        // str4='CANCELLED';
        // str5='PENDING_INTERNAL_APPROVAL';
        // str6='RETURN INITIATED';
        // str7='';
        // var res =str+"'"+','+"'"+str1+"'"+','+"'"+str2+"'"+','+"'"+str3+"'"+','+"'"+str4+"'"+','+"'"+str5+"'"+','+"'"+str6
        // +"'"+','+"'"+str7;
        //update_reserved_stock('reserved_stock',res,1);
        document.querySelectorAll(".info-box")[4].click();
      } else {
        alert("message :" + response.data.message);
        $("#ret_modal").modal("hide");
        //update_reserved_stock('reserved_stock',res,1);
        document.querySelectorAll(".info-box")[3].click();
      }

      // window.location.href = "/sales/dash/";
    })
    .catch(function (error) {
      alert(error);
      HideDIV();
      // $('#ret_modal .modal-content').unblock()
    });
}

// function print_invoice(
//   ohid,
//   submenu_id = "",
//   email = "",
//   order_number = "",
//   sms = ""
// ) {
//   var queryString = window.location.search;
//   console.log(queryString);
//   var a = queryString.split("mid=")[1];
//   var uid = a.split("&")[0];
//   var mid = a.split("&s")[0];
//   var smid = queryString.split("smid=")[1].split("&")[0];
//   var rid = queryString.split("rid=")[1].split("&")[0];
//   var aid = queryString.split("aid=")[1];

//   if (email == "") {
//     window.open(
//       "invoice?rid=" +
//         rid +
//         "&aid=" +
//         aid +
//         "&mid=" +
//         mid +
//         "&smid=" +
//         smid +
//         "&uid=" +
//         uid +
//         "&ohid=" +
//         ohid +
//         "&email=" +
//         email,
//       "_blank"
//     );
//   } else {
//     ShowDIV();
//     axios
//       .get(
//         "/sales/customer_email_mobile?defs=" +
//           localStorage.getItem("defs") +
//           "&order_number=" +
//           order_number
//       )
//       .then(function (res) {
//         console.log(res);
//         var customer_name = res.data.customer_name;
//         var invoice_total = res.data.invoice_total;
//         var total_discount = res.data.total_discount;
//         console.log(res.data.mobile);
//         var input_val = res.data.email;
//         var heading_g = "Enter Customer Email Address";
//         if (sms != "") {
//           input_val = res.data.mobile;
//           heading_g = "Enter customer mobile number";
//         }

//         HideDIV();
//         console.log(res.data);
//         swal(
//           {
//             title: heading_g,
//             text: "",
//             type: "input",
//             inputValue: input_val,
//             showCancelButton: true,
//             closeOnConfirm: false,
//             animation: "slide-from-top",
//             inputPlaceholder: "Write something",
//           },
//           function (inputValue) {
//             if (inputValue === false) return false;
//             if (inputValue === "") {
//               return;
//             }

//             //alert(inputValue)
//             if (sms != "") {
//               sent_email_to_customer(
//                 ohid,
//                 inputValue,
//                 customer_name,
//                 invoice_total,
//                 total_discount,
//                 1
//               );
//             } else {
//               sent_email_to_customer(
//                 ohid,
//                 inputValue,
//                 customer_name,
//                 invoice_total,
//                 total_discount
//               );
//             }
//           }
//         );
//       })
//       .catch(function () {
//         HideDIV();
//       });
//   }
// }

function sent_email_to_customer(
  ohid,
  email,
  customer_name,
  invoice_total,
  total_discount,
  sms = ""
) {
  ShowDIV();
  defs = localStorage.getItem("defs");
  axios
    .get(
      "invoice?ohid=" +
        ohid +
        "&email=" +
        email +
        "&customer_name=" +
        customer_name +
        "&invoice_total=" +
        invoice_total +
        "&total_discount=" +
        total_discount +
        "&sms=" +
        sms
    )
    .then(function (response) {
      HideDIV();
      console.log(response);
      //alert(response.data.error_code)
      if (response.data.error_code == "S") {
        //alert('Order Number :' +order_number + ' Successfully canceled ');
        //swal('Order Number :' +order_number + ' Successfully canceled ')
        //document.querySelectorAll('.info-box')[1].click();
      } else {
        // alert(response.data.message);
        swal(response.data.message);
      }
    })
    .catch(function (error) {
      console.log(error);
    });

  //swal("Nice!", "You wrote: " + inputValue, "success");
}

function get_ret_line_type(thizz) {
  var order_header_type_id = thizz.value;
  //alert(order_header_type_id)
  ShowDIV();
  axios
    .get(
      "get_line_type_base_on_order_header_ret?o_typ_hdr_id=" +
        order_header_type_id
    )
    .then(function (res) {
      HideDIV();
      console.log(res.data);
      vDash.ret_line_type = res.data.data;

      // res.data.data
    })
    .catch(function () {});
}

function cancel_order(e, ohid, order_number, org_id) {
  swal(
    {
      title: "Cancel Order Number :" + order_number,
      text: "Reason",
      type: "input",
      showCancelButton: true,
      closeOnConfirm: false,
      animation: "slide-from-top",
      inputPlaceholder: "Write something",
    },
    function (inputValue) {
      if (inputValue === false) return false;

      if (inputValue === "") {
        swal.showInputError("You need to write something!");
        return false;
      }

      ShowDIV();
      // defs=localStorage.getItem('defs')
      axios
        .get(
          "cancel_order?order_header_id=" +
            ohid +
            "&order_number=" +
            order_number +
            "&org_id=" +
            org_id +
            "&remarks=" +
            inputValue
        )
        .then(function (response) {
          HideDIV();
          console.log(response);
          //alert(response.data.error_code)
          if (response.data.error_code == "S") {
            //alert('Order Number :' +order_number + ' Successfully canceled ');
            swal("Order Number :" + order_number + " Successfully canceled ");

            document.querySelectorAll(".info-box")[1].click();
          } else {
            // alert(response.data.message);
            swal(response.data.message);
          }
        })
        .catch(function (error) {
          console.log(error);
        });

      swal("Nice!", "You wrote: " + inputValue, "success");
    }
  );
  return;

  // let text =  swal({
  //     title: 'Cancel Order Number :'+order_number,
  //     input: 'textarea',
  //     inputPlaceholder: 'Cancel reason type here...',
  //     showCancelButton: true
  // })
  // if (text)
  // {

  // }
}

// async function cancel_order(e,ohid,order_number,org_id)
// {

// let text = await swal({
//     title: 'Cancel Order Number :'+order_number,
//     input: 'textarea',
//     inputPlaceholder: 'Cancel reason type here...',
//     showCancelButton: true
//   })
//   if (text)
//   {

//     defs=localStorage.getItem('defs')
//     axios.get("cancel_order?order_header_id="+ohid+"&order_number="+order_number+"&defs="+defs+"&org_id="+org_id+"&remarks="+text)
//     .then(function (response)
//     {
//     console.log(response)
//     //alert(response.data.error_code)
//     if(response.data.error_code=='S')
//     {
//          //alert('Order Number :' +order_number + ' Successfully canceled ');
//          swal('Order Number :' +order_number + ' Successfully canceled ')
//     }
//     else
//     {
//        // alert(response.data.message);
//         swal(response.data.message)
//     }
//     })
//     .catch(function (error)
//     {
//          console.log(error)
//     })

//   }
// return

//     swal({
//         title: 'Cancel Order Number :'+order_number,
//         text: "",
//         type: 'success',
//         input: 'textarea',
//         inputPlaceholder: 'Cancel reason type here...',
//         inputAttributes:
//         {
//           'aria-label': 'Type your message here'
//         },
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'OK'
//         },
//         function(text)
//         {

//             defs=localStorage.getItem('defs')
//             axios.get("cancel_order?order_header_id="+ohid+"&order_number="+order_number+"&defs="+defs+"&org_id="+org_id+"&remarks="+text)
//             .then(function (response)
//             {
//             console.log(response)
//             //alert(response.data.error_code)
//             if(response.data.error_code=='S')
//             {
//                  alert('Order Number :' +order_number + ' Successfully canceled ');

//             }
//             else
//             {
//                 alert(response.data.message);
//             }
//             })
//             .catch(function (error)
//             {
//                  console.log(error)
//             })
//         })

//     return

//  (async() => {

//   Swal({
//   input: 'textarea',
//   title: 'Cancel Order Number :'+order_number,
//   inputPlaceholder: 'Cancel reason type here...',
//   inputAttributes:
//   {
//     'aria-label': 'Type your message here'
//   },
//   showCancelButton: true
// })
// if (text)
// {
//     // $.blockUI({ css: {
//     //         border: 'none',
//     //         padding: '15px',
//     //         backgroundColor: '#000',
//     //         '-webkit-border-radius': '10px',
//     //         '-moz-border-radius': '10px',
//     //         opacity: .5,
//     //         color: '#fff'
//     // }});

//    defs=localStorage.getItem('defs')
//    axios.get("cancel_order?order_header_id="+ohid+"&order_number="+order_number+"&defs="+defs+"&org_id="+org_id+"&remarks="+text)
//   .then(function (response)
//   {
//         console.log(response)
//         //alert(response.data.error_code)
//         if(response.data.error_code=='S')
//         {

//              alert('Order Number :' +order_number + ' Successfully canceled ');
//             //  location.reload();
//             //  $.unblockUI()
//         }
//         else
//         {

//         //    $.unblockUI()
//            alert(response.data.message);

//         }

//   })
//   .catch(function (error)
//    {
//         console.log(error)
//         // $.unblockUI()
//   })

// }

// })();

// }

function create_sales_order(a) {
  swal(
    {
      title:
        "This action will create sales order in system. Press OK to continue",
      text: "",
      type: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "OK",
    },
    function () {
      ShowDIV();
      axios
        .get(
          "reservation_to_order?defs=" +
            localStorage.getItem("defs") +
            "&reservation_number=" +
            a
        )
        .then(function (res) {
          HideDIV();
          console.log(res.data);
          if (
            res.data.status == "S" ||
            res.data.status == "s" ||
            res.data.status == " "
          ) {
            swal(
              {
                title: "SUCCESS",
                text: res.data.message + res.data.header_id,
                type: "success",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Ok",
              },
              function () {
                str = "RESERVED";
                var res = str;
                update_reserved_stock("reserved_stock", res);
              }
            );
          } else {
            swal(
              {
                title: "SUCCESS",
                text: res.data.message,
                type: "success",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Ok",
              },
              function () {
                str = "RESERVED";
                var res = str;
                update_reserved_stock("reserved_stock", res);
              }
            );
          }
        })
        .catch(function () {
          HideDIV();
        });
    }
  );

  //  return true;
}

function date_range() {
  $("#fromdate").datepicker({ dateFormat: "d/mm/yy" });
  $("#todate").datepicker({ dateFormat: "d/mm/yy" });
  var d = new Date();
  var currMonth = d.getMonth();
  var currYear = d.getFullYear();
  var currday = d.getDate();
  var fromdate = localStorage.getItem("fromdate");
  var todate = localStorage.getItem("todate");
  if (fromdate != null && todate != null) {
    $("#todate").datepicker("setDate", todate);
    $("#fromdate").datepicker("setDate", fromdate);
  } else {
    var startDate = new Date(currYear, currMonth, currday);
    if (document.getElementById("todate").value == startDate) {
    } else if (document.getElementById("todate").value.trim() == "") {
      $("#todate").datepicker("setDate", startDate);
    }
    var startDate = new Date(currYear, currMonth, currday - 30);

    if (document.getElementById("fromdate").value == startDate) {
    } else if (document.getElementById("fromdate").value.trim() == "") {
      $("#fromdate").datepicker("setDate", startDate);
    } else {
    }
  }
  updatedate4();
}
function updatedate4() {
  localStorage.setItem("fromdate", document.getElementById("fromdate").value);
  localStorage.setItem("todate", document.getElementById("todate").value);
  // alert()
  if (localStorage.getItem("to" + moment().format("DD-MMM-YYYY")) == null) {
    // alert()
    localStorage.setItem("todate", moment().format("d/MM/YYYY"));
    var startDate = new Date();
    $("#todate").datepicker("setDate", startDate);
    localStorage.setItem("to" + moment().format("DD-MMM-YYYY"), "Y");
  }
}
function updatedate() {
  localStorage.setItem("fromdate", document.getElementById("fromdate").value);
  localStorage.setItem("todate", document.getElementById("todate").value);
  toastr.options.closeButton = true;
  toastr.success(
    "A new date selection was made: " +
      document.getElementById("fromdate").value +
      " to " +
      document.getElementById("todate").value
  );

  for (var i = 0; i < document.querySelectorAll(".info-box").length; i++) {
    if (
      document.querySelectorAll(".info-box")[i].style.background ==
      "rgb(160, 160, 160)"
    ) {
      document.querySelectorAll(".info-box")[i].click();
    }
  }
}

function loop_for_timer() {
  var a = document.querySelectorAll(".timer").length;

  for (var i = 0; i < a; i++) {
    //data-reservation='+row.reservation_end_date_formate+'
    var hours = document
      .querySelectorAll(".timer")
      [i].getAttribute("data-reservation");
    var id = document.querySelectorAll(".timer")[i].getAttribute("id");
    if (document.getElementById(id).innerHTML == "") {
      $("#" + id).fadeIn(1000);
      createCountDown(id, hours);
    }
  }
}

function createCountDown(elementId, hours_1) {
  var countDownDate = new Date(hours_1).getTime();
  var x = elementId;
  x = setInterval(function () {
    var now = new Date().getTime();
    //  countDownDate= d.getTime();
    var distance = countDownDate - now;
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (document.getElementById(elementId) != null) {
      document.getElementById(elementId).innerHTML =
        "&nbsp;&nbsp;" +
        days +
        "d " +
        hours +
        "h " +
        minutes +
        "m " +
        seconds +
        "s ";

      if (days < 2) {
        document.getElementById(elementId).style.color = "red";
      } else {
        document.getElementById(elementId).style.color = "black";
      }
    }
    if (distance < 0) {
      clearInterval(x);
      document.getElementById(elementId).innerHTML = "&nbsp;&nbsp;EXPIRED";
      document.getElementById(elementId).style.color = "red";
    }
  }, 1000);
}
function cancel_reservation() {
  var order_header_id = $("#reservation_number").html();
  var request_number = order_header_id;
  // AJAX request
  //blockDIV('body')
  $.ajax({
    url:
      "cancel_temp_reservation?defs=" +
      localStorage.getItem("defs") +
      "&order_number=" +
      request_number,
    type: "get",
    success: function (response) {
      //unblockUIEntirePage()
      HideDIV();
      str = "ENTERED";
      str1 = "ADVANCE PAYMENT INITIATED";
      str2 = "ADVANCE PAYMENT RECEIVED";
      // str3='CANCELED';
      var res = str + "'" + "," + "'" + str1 + "'" + ",+" + "'" + str2; //+"'"+',+'+"'"+str3;
      update_reserved_stock("reserved_stock", res);

      swal("Done!", response.data, "success");

      // Add response in Modal body
      //    $("#empModal_data").html(response);
      //    // Display Modal
      //    $("#empModal").modal("show");
    },
  });
}
function invoice_cancel(idd) {
  document.getElementById("cancel_reservation").style.display = "block";
  ShowDIV();
  //$("#empModal").modal("show");
  var request_number = idd;
  // AJAX request
  //blockDIV('body')
  $.ajax({
    url:
      "/sales/order_info?defs=" +
      localStorage.getItem("defs") +
      "&order_number=" +
      request_number,
    type: "get",
    success: function (response) {
      //unblockUIEntirePage()
      HideDIV();
      // Add response in Modal body
      $("#empModal_data").html(response);
      // Display Modal
      $("#empModal").modal("show");
    },
  });
}

function get_approver(order_number) {
  $.ajax({
    url:
      "get_approver?defs=" +
      localStorage.getItem("defs") +
      "&order_number=" +
      order_number,
    type: "get",
    success: function (response) {
      $("#time_lines_list").html(response);
      $("#approver_history").modal("show");
    },
  });
}
function invoice_info(idd) {
  //document.getElementById('cancel_reservation').style.display='none';
  ShowDIV();
  var request_number = idd;
  $.ajax({
    url:
      "/sales/order_info?defs=" +
      localStorage.getItem("defs") +
      "&order_number=" +
      request_number +
      "&type=view",
    type: "get",
    success: function (response) {
      //unblockUIEntirePage()
      HideDIV();
      // Add response in Modal body
      $("#empModal_data").html(response);
      // // Display Modal
      $("#empModal").modal("show");

      // $("#initiate_payment_modal_data").html(response);
      // $("#initiate_payment_modal_data_footer").html('<button type="button" class="btn btn-secondary" onclick="initiate_payment_to_accountant('+d+')">Submit Request</button>');

      //$("#initiate_payment_modal_data").html( $("#initiate_payment_modal_data").html()

      //advance_collection_type(d);

      // Display Modal
      // $("#initiate_payment_modal").modal("show");
    },
  });
}

function extends_reservation(idd) {
  var request_number = idd;

  $("#reservation_modal").modal("show");
  $("#res_number").html(request_number);
}
function extend_reser() {
  var days = $("#days").val();
  var remarks = $("#remarks").val();
  var request_number = $("#res_number").html();

  axios
    .get(
      "extend_reser?defs=" +
        localStorage.getItem("defs") +
        "&order_number=" +
        request_number +
        "&n_days=" +
        days
    )
    .then(function (res) {
      //unblockUIEntirePage()
      console.log(res.data);
      // alert(res.data)

      if (res.data == "S") {
        swal(
          "The reservation is extended for " + days + " Days",
          "",
          "success"
        );

        $("#reservation_modal").modal("hide");

        //update_reserved_stock('reserved_stock','ADVANCE PAYMENT RECEIVED','','all');

        str = "RESERVED";

        var res = str;
        update_reserved_stock("reserved_stock", res);
      }
    })
    .catch(function () {});
}

$("#search-tbl tbody tr").click(function () {
  console.log("clicked");
  $(this).addClass("selected").siblings().removeClass("selected");
});

var table;
function initiate_payment(d) {
  ShowDIV();
  var request_number = d;
  $.ajax({
    url:
      "order_info?defs=" +
      localStorage.getItem("defs") +
      "&order_number=" +
      request_number +
      "&type=edit",
    type: "get",
    success: function (response) {
      HideDIV();
      // Add response in Modal body
      //unblockUIEntirePage()
      $("#initiate_payment_modal_data").html(response);

      // $("#initiate_payment_modal_data_footer").html('<button type="button" class="btn btn-secondary" onclick="initiate_payment_to_accountant('+d+')">Submit Request</button>');

      //$("#initiate_payment_modal_data").html( $("#initiate_payment_modal_data").html()

      advance_collection_type(d);

      // Display Modal
      $("#initiate_payment_modal").modal("show");
      //document.getElementById('dept_line').style.display='flex';
    },
  });
}

function save_customer_mobile() {
  var email = $("#email1").val();
  var mobile = $("#mobile1").val();
  var order_number = $("#order_number_1").val();
  var customer_id = $("#customer_id_1").val();

  //alert(email)
  //alert(mobile);
  if (email == "" && mobile == "") {
    toaster_create("email or mobile number cannot be null");
    return;
  }

  axios
    .get(
      "/sales/update_customer_email_mobile?defs=" +
        localStorage.getItem("defs") +
        "&order_number=" +
        order_number +
        "&customer_id=" +
        customer_id +
        "&email=" +
        email +
        "&mobile=" +
        mobile
    )
    .then(function (res) {
      if (res.data == "success") {
        $("#form").modal("hide");
      } else {
        alert(res.data);
      }
      //submit_customer_req(params)
      console.log(res.data);
    })
    .catch(function () {});
}

function submit_customer_req() {
  ShowDIV();
  var order_header_id = $("#reservation_number").html();

  var params = {
    order_header_id: order_header_id,
    data: arraySystme_recipt,
    data_user: arrayUser_recipt,
    defs: localStorage.getItem("defs"),
  };
  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;
  axios
    .post("insert_draft_app", params)
    .then(function (res) {
      HideDIV();
      console.log(res);
      if (res.data.error_code == "E") {
        show_errors();
        toaster_create(res.data.message);
        var a = res.data.message;
        var out = "";
        for (var i = 0; i < a.length; i++) {
          out +=
            '<p  style="padding-left: 18px;">' +
            i +
            " :   " +
            a[i] +
            "<br><br></p>";
        }
        $("#error_tab").click();
        $("#error_content_t").html(out);
      } else {
        //  swal(res.data.message);
        $("#initiate_payment_modal").modal("hide");
        str = "ENTERED";
        var res = str;
        update_reserved_stock("reserved_stock", res);
      }

      //$("#initiate_payment_modal").modal("hide");

      //update_reserved_stock('reserved_stock','ENTERED','ADVANCE PAYMENT INITIATED');
    })
    .catch(function (error) {
      HideDIV();
    });
}

function hide_erroros(ab = "") {
  if (ab == "hide") {
    // ('#error_tab').click();
    var a = document.getElementById("error_content").style;
    if (a.display == "" || a.display == "none") {
    } else {
      $("#error_tab").click();
    }
  }
  var a = document.getElementById("error_content").style;
  if (a.display == "" || a.display == "none") {
    $("#error_tab").click();
  }
}
//         if(ab=='show')
//         {

//             document.getElementById('error_content').style.display='block'
//             $('error_tab').show()
//             return;

//         }

//         var a= document.getElementById('error_content').style;
//         if(a.display=="" || a.display=="none")
//         {
//             document.getElementById('error_content').style.display='block'
//             $('error_tab').show()
//             return;
//         }
//         else
//         {
//             document.getElementById('error_content').style.display='none'
//             $('error_tab').hide()
//             return;
//         }

//   }
function initiate_payment_to_accountant(d, amount = 0) {
  var advance_req = $("#" + d + "_advance_req").val();
  if ($("#advance_collection_type").val() == "2" && amount == 0) {
    //  alert(123)
    calculate_enable_sum();
    var order_header_id = $("#reservation_number").html();
    order_total = advance_req; //document.querySelector("#initiate_payment_modal_data > table.dataframe.order-total > tbody > tr > td:nth-child(4)").innerText;

    order_total = Number(order_total.replace(/[^0-9\.-]+/g, ""));
    console.log(order_total);

    result = arraySystme_recipt.reduce(function (r, a) {
      a.forEach(function (b, i) {
        r[i] = +(r[i] || 0) + +b;
      });
      return r;
    }, []);
    //alert(result[1])
    console.log(result);
    if (result.length == 0) {
    } else if (result[1] != advance_req) {
      //HideDIV();
      toaster_create(" Error enter amount is not matching");
      return;
    }
    var params = {
      //_draft_initilize:_draft_initilize,
      order_header_id: order_header_id,
      data: arraySystme_recipt,
      data_user: arrayUser_recipt,
      defs: localStorage.getItem("defs"),
    };
    //customer_email_mobile_update(order_header_id,params);
    console.log(params);
    submit_customer_req();
    return;
    // blockUIEntirePage();
  }
  if ($("#advance_collection_type").val() == "1") {
    alert("select customer balance option");
    return;
    console.log($("#" + d + "_advance").val());
    var advance_amount = $("#" + d + "_advance").val();
    if (amount != 0) {
      var a = JSON.parse(localStorage.getItem("defs"));
      advance_amount = a.reservation_amount;
    }

    if (advance_amount != advance_req) {
      HideDIV();
      toaster_create("Error enter amount is not matching");
      return;
    }
    axios
      .get(
        "initiate_payment_to_accountant?defs=" +
          localStorage.getItem("defs") +
          "&advance_amount=" +
          advance_amount +
          "&order_number=" +
          d
      )
      .then(function (res) {
        //unblockUIEntirePage()
        HideDIV();
        console.log(res.data.message);
        //alert(res.data.message);

        swal(
          "Please proceed to make the payment at Payment Counter. Reservation: # " +
            d,
          "",
          ""
        );

        $("#initiate_payment_modal").modal("hide");

        // update_reserved_stock('reserved_stock','ENTERED','ADVANCE PAYMENT INITIATED');

        str = "ENTERED";
        str1 = "ADVANCE PAYMENT INITIATED";
        str2 = "ADVANCE PAYMENT RECEIVED";
        //str3='CANCELED';
        var res = str + "'" + "," + "'" + str1 + "'" + ",+" + "'" + str2; //+"'"+',+'+"'"+str3;
        update_reserved_stock("reserved_stock", res);
      })
      .catch(function () {
        HideDIV();
      });
  }

  // alert($("#advance_collection_type").val())
  if ($("#advance_collection_type").val() == undefined) {
    submit_customer_req();
    return;
  }
}

function advance_collection_type(d) {
  axios
    .get(
      "/sales/advance_collection_type?defs=" +
        localStorage.getItem("defs") +
        "&order_number=" +
        d
    )
    .then(function (res) {
      //unblockUIEntirePage()
      console.log(res.data);
      $("#advance_collection_type").select2({
        data: res.data,
        width: "auto",
      });
      $("#" + d + "_advance").hide();
      $("#lbl_payment_collected").hide();
      $("#customer_receipt").html("");
      $("#customer_receipt").show();

      var order_number = $("#advance_collection_type").select2("data")[0]
        .order_number;
      //alert(order_number)
      //get_draft_data(order_number)
      initiate_payment_to_accountant(d, (amount = 1000));

      // alert(res.data.message)
    })
    .catch(function () {});

  $("#advance_collection_type").on("select2:select", function (e) {
    var select_val = $(e.currentTarget).val();
    console.log(select_val);
    if (select_val == 1) {
      $("#" + d + "_advance").show();
      $("#" + d + "_advance").val($("#" + d + "_advance_req").val());
      $("#lbl_payment_collected").show();
      $("#customer_receipt").hide();
      $("#customer_receipt").html("");
    } else {
      $("#" + d + "_advance").hide();
      $("#lbl_payment_collected").hide();
      $("#customer_receipt").html("");
      $("#customer_receipt").show();

      var order_number = $("#advance_collection_type").select2("data")[0]
        .order_number;
      //alert(order_number)
      // get_draft_data(order_number)
    }
  });
}


function destroyDT(selector){
  if ($.fn.dataTable.isDataTable(selector)){
      try {
          $(selector).DataTable().destroy();
          
      } catch (error) {
          console.log(error);
      }
      // $(selector).DataTable().destroy();
      $(selector).html("");
  }
}
var glo_total_AMT_ASSIGNED=0;
$(document).on('keydown keyup input change',"._AMT_ASSIGNED",function(){
  var trData = $(this).closest('table').DataTable().row($(this).closest('tr')).data();

  var location_avaible_amt = parseFloat(trData.LOC_AVLB_AMT);

  if (parseFloat(this.value) > location_avaible_amt ){
    this.value=location_avaible_amt;
  }

  glo_total_AMT_ASSIGNED = [].slice.call($('._AMT_ASSIGNED'))
    .filter(x=>!x.disabled)
    .map(x=>x.value)
    .filter(x=>!isNaN(x))
    .filter(x=>x!="")
    .reduce((a, b) => parseFloat(a) + parseFloat(b), 0);


    glo_total_AMT_ASSIGNED = parseFloat(glo_total_AMT_ASSIGNED.toFixedRound(6));

    
     
    
    // var tr_loc_avbl_amt = parseFloat(trData.LOV_AVBL_AMT);

    var full_total = parseFloat(itemLinesEntry.column_aggregates['line_total']);

    full_total = parseFloat(full_total.toFixedRound(6));
    
    if (glo_total_AMT_ASSIGNED >full_total){
      this.value   = 0;
      $('#remaining_amount').text(
        parseFloat(full_total).toFixedRound(2)
      );

    }
    



    $('._total_AMT_ASSIGNED').text(glo_total_AMT_ASSIGNED);

    var remaining_amount =  (parseFloat(full_total) - glo_total_AMT_ASSIGNED).toFixedRound(2);

   $('#remaining_amount').text(
    remaining_amount
    );


    if (remaining_amount == 0){
    }
    
    if (glo_total_AMT_ASSIGNED != full_total){
      $('#remaining_amount').css('color','red');
    }else{
      $('#remaining_amount').css('color','mediumseagreen');

    }



})
$(document).on('change',"._A1",function(){
  var full_total = parseFloat(itemLinesEntry.column_aggregates['line_total']);

  $(this).closest('tr').find('._AMT_ASSIGNED').prop('disabled',!this.checked);
  $('#remaining_amount').text( (parseFloat(full_total) -glo_total_AMT_ASSIGNED).toFixedRound(2) );
})

function initDraftAppTable(init){
  $("#customer_receipt").append(`<div class="table-responsive "><table id="initDraftAppTable" class="table table-sm text-nowrap table-bordered table-striped"></table></div>`);

  init.dt_data.columns = init.dt_data.columns.map((x,i) => { if (i>13) x['visible']=false; else x['visible']=true;  return x});

  destroyDT("#initDraftAppTable");
  $("#initDraftAppTable").DataTable({
      data:init.dt_data.data,
      columns:init.dt_data.columns,
      info:false,
      searching:false,
      paging:false,
      sorting:false,
      drawCallback:function(){
        $(this).find('tfoot').remove();
        $(this).append(`<tfoot id="dapp_tfoot"><tr>
                ${init.dt_data.columns.slice(0,14).map(x=>
                  `<td class="_total_${x.data}"></td>`
                ).join("") }
        </tr></tfoot>`);

        $(this).find('thead th:contains("Amt Assigned")').empty().append(`Amount Tally<br><span id="remaining_amount" style="color:red" >0.0</span>`)

        

      }

  });

}

$('#credit-order-get-bal-btn').append(`&nbsp;`);

function get_draft_data(canGetDraftForCash) {
  // ShowDIV();

  try {
    var ship_cust_id = $("#customer").select2("data")[0]["id"];
    var account_number = $("#searchCust").select2("data")[0]["customer_number"];

    var bill_to_id = $("#customer_bill").select2("data")[0]["id"];
  } catch (ex) {
    // toaster_create("customer not selected");
    // HideDIV();
    return;
  }

  if (!canGetDraftForCash) return;
 
  $('#credit-order-get-bal-btn').append(`<div class="get_bal_loader spinner-border spinner-border-sm text-light" role="status" style="">
  <span class="sr-only"> Loading...</span>
</div>`)

  var order_type_txt = shoppingCart.load_order_info("order_type_text");
  var order_type_id = shoppingCart.load_order_info("order_type_val");
  var cart = JSON.stringify(shoppingCart.listCart());
  axios.defaults.xsrfCookieName = "csrftoken";
  axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
  axios.defaults.withCredentials = true;
  glo_loading = true;
  axios
    .post("/sales/get_draft_reciept", {
      defs: localStorage.getItem("defs"),
      cust_ship_id: ship_cust_id,
      bill_to_id: bill_to_id,
      cart: cart,
      order_type_txt: order_type_txt,
      order_type_id: order_type_id,
      account_number:account_number,

      order_number:$('#order_number').val(),
    })
    //axios.get("/sales/get_draft_reciept?defs="+localStorage.getItem('defs')+'&cust_ship_id='+ship_cust_id+'&bill_to_id='+bill_to_id)
    .then(function (res) {
      $('.get_bal_loader').remove();
      glo_loading = false;
      // get_tax_();
      $("#p_rec_level_id").val(res.data["p_rec_level_id"]);
      HideDIV();
      //alert(res.data['invoice_type'])
      if (res.data["invoice_type"] == "CA") {
        $("#customer_receipt").html(res.data["html"]);
        shoppingCart.save_order_info("invoice_type", res.data["invoice_type"]);
        $("#btn_req_credit").hide();

       

        itemLinesEntry.setCollectionAmountForCA();
          calculate_enable_sum();

          
        return;
      }


      $("#order_type_input").val("Credit");

      //call_darft_order()

      $("#btn_req_credit").show();
      shoppingCart.save_order_info("invoice_type", "CR");

      // if(a==1  &&  typeof(temp1.data.data[0].receivable_level_id) !=   'undefined')
      // {

      //    initiate_payment_to_accountant(d,amount=1000);

      // }

      
      var e = res.data.data;
      $("#customer_receipt").html("");
       return initDraftAppTable(res.data);
      var col = res.data.columns;
      if (res.data == "") {
        $("#customer_receipt").append("No Record Found");
        $("#customer_receipt").append();
      }

      $("#customer_receipt").append('<div id="credit"></div>');
      // $("#error_dev")
      $("#customer_receipt").append("<br><br> ");
      var header =
        '<table id="datagrid" class="table-sm table dataframe tbl_font table-sm table-striped" ><thead><tr>';
      for (var i = 0; i < col.length; i++) {
        // alert(i)
        if (i == 0) {
          header += "<th>   </th>";
        } else if (i == 1) {
          header += '<th>AMOUNT ASSIGNED <span id="rem_amount_"></span></th>';
        } else if (i == 2) {
          header += "<th>VAT</th>";
        } else if (i == 5) {
          header += '<th style="display:none;">' + col[i] + "</th>";
        } else {
          header += "<th>" + col[i] + "</th>";
        }
      }
      header += '</tr></thead><tbody id="dataTable">';
      var dataTable = "";
      for (var i = 0; i < e.length; i++) {
        cloneIndex = (Math.random() * (10000 - 1584 + 1027) + 10).toFixedRound(0);
        var id = "clonedtr" + cloneIndex;

        //console.log(e[i][col[j]]);

        dataTable += '<tr data-id="1" id=' + id + ">";
        //console.log(col.length)
        for (var j = 0; j < col.length; j++) {
          if (j == 0) {
            dataTable +=
              '<td><input   onclick="line_enable_receipt(this)" type="checkbox" id="line_enable"  style="    zoom: 1.5;"  /></td>';
          } else if (j == 1) {
            dataTable +=
              '<td    data-field="amt_assigned" id="amt_assigned" ><input type="text"  style="width: 100%;" value="0"   onblur="onchange_amt_assigned(this)"   class="sum 5"  /><input type="hidden" value="' +
              e[i]["cash_receipt_id"] +
              '" />';
          } else if (j == 2) {
            dataTable +=
              '<td><input   class="sum 6" type="text" value=0 style="width: 100%"   disabled/></td>';
          } else if (j == 3) {
            dataTable += '<td class="sum 2" >' + e[i][col[j]] + "</td>";
          } else if (j == 4) {
            dataTable +=
              '<td class="sum 3"  data-field="avbl_balance"  id="avbl_balance"  >' +
              e[i][col[j]] +
              "</td>";
          } else if (j == 5) {
            dataTable +=
              '<td style="display:none" > <input  type="text"  style="width:70px" /></td>';
          } else if (j == 6) {
            dataTable += '<td  id="type" >' + e[i][col[j]] + "</td>";
          } else if (j == 8) {
            dataTable +=
              '<td  id="loc_available_balance" >' + e[i][col[j]] + "</td>";
          } else {
            dataTable += "<td>" + e[i][col[j]] + "</td>";
          }
        }
        dataTable += "</tr>";
      }
      var aaa =
        '<tr><td  style="text-align:right;">Total:</td><td class="total sum-5"></td><td class="total sum-6"></td><td class="total sum-2"></td><td class="total sum-3"></td><td class="total sum-4"></td><td></td></tr>';

      dataTable += aaa + "</tbody></table>";
      $("#customer_receipt").append(header + dataTable);
      line_enable_receipt();

      sumThisClass_html("3");
      sumThisClass_html("2");
      line_tsum = $(".line_tsum").text();
      $("#g_total").val(line_tsum);
    })
    .catch(function (err) {
      $('.get_bal_loader').remove();

      glo_loading = false;
      // HideDIV();
      toastr.error(" Unable to fetch customer balances. Please Contact ITS. ");

      toastr.error(err.response.data);

    });

  line_tsum = $(".line_tsum").text();
  $("#g_total").val(line_tsum);
}

function onchange_amt_assigned(a) {
  var e = document.getElementById(a.id);
  var parent_tr = a.closest("tr").id;
  console.log(parent_tr);
  var line_entered_amt = parseFloat(
    $("#" + parent_tr + "  >  #amt_assigned > input").val()
  );
  console.log(line_entered_amt);
  //parseFloat($("#"+parent_tr+"  >  #amt_assigned > input").val(line_entered_amt))

  //alert($("#"+parent_tr+"  >  #avbl_balance").html())
  // var avbl_balance=undo_formatCalculation($("#"+parent_tr+"  >  #avbl_balance").html());

  var avbl_balance = $("#" + parent_tr + "  >  #loc_available_balance").html();

  var type = $("#" + parent_tr + "  >  #type").html();

  if (type == "CREDIT MEMO" || type == "CREDIT LIMIT") {
    var avbl_balance = $(
      "#" + parent_tr + "  >  #loc_available_balance"
    ).html();
  }
  //alert(avbl_balance);

  if (isNaN(line_entered_amt)) {
    toastr.warning("Assign ammount is not a number", "error");
    $("#" + parent_tr + "  >  #amt_assigned > input").val(0);
    return;
  }
  if (line_entered_amt > avbl_balance) {
    toastr.warning("Assign ammount is greater then avl balance", "error");
    $("#" + parent_tr + "  >  #amt_assigned > input").val(avbl_balance);
    calculate_enable_sum();
    return;
  }

  sumThisClass("5");
  sumThisClass("6");
  calculate_enable_sum();

  // sumThisClass_html("4")
  sumThisClass_html("3");
  sumThisClass_html("2");
  //
  // amt_assigned
}

function sumThisClass_html(className) {
  var sumTotal = 0;
  $("." + className).each(function (index, el) {
    //var elValue = undo_formatCalculation($(el).html());
    var elValue = $(el).html();

    // alert(elValue)
    if (!isNaN(elValue)) {
      sumTotal = +elValue + +sumTotal;
      console.log(sumTotal);
    }
  });
  sumTotal = parseFloat(sumTotal).toFixedRound(2);

  $(".sum-" + className).text(sumTotal);
}
function sumThisClass(className) {
  var sumTotal = 0;
  $("." + className).each(function (index, el) {
    var elValue = $(el).val();
    if (!isNaN(elValue)) {
      sumTotal += parseFloat($(el).val());
      console.log(sumTotal);
    }
  });

  sumTotal = formatCalculation(sumTotal);
  $(".sum-" + className).text(parseFloat(sumTotal).toFixedRound(2));
  if (className == "6") {
    // document.getElementById('collected_total_vat').value=sumTotal;
  }
}
function line_enable_receipt(thizz = "") {
  var cash_collection = document.getElementById("datagrid");
  for (i = 1; i < cash_collection.rows.length; i++) {
    var objCells = cash_collection.rows.item(i).cells;
    for (var j = 0; j < objCells.length; j++) {
      if (
        j == 0 &&
        cash_collection.rows[i].cells[j].childNodes[0].checked == true
      ) {
        cash_collection.rows[i].cells[1].childNodes[0].disabled = false;
        cash_collection.rows[i].cells[1].childNodes[0].style.backgroundColor =
          "#ffff";
        cash_collection.rows[i].style.backgroundColor = "white";
      } else if (
        j == 0 &&
        cash_collection.rows[i].cells[j].childNodes[0].checked == false
      ) {
        cash_collection.rows[i].cells[1].childNodes[0].disabled = true;
      }
    }
  }
  calculate_enable_sum();
  sumThisClass("5");
  sumThisClass("6");
}

function getCurUrlGETObj() {
  return JSON.parse(
    '{"' +
      decodeURI(
        window.location.search
          .substring(1)
          .replace(/&/g, '","')
          .replace(/=/g, '":"')
      ) +
      '"}'
  );
}
var vProductTbl = new Vue({
  delimiters: ["[[", "]]"],
  el: "#vProductTbl",
  data: {
    columns: [],
    data: [],
  },
});

//function initDT(d){  }

function buildTheadTfoot(d) {
  var html = "<thead><tr>";
  d.forEach(function (e) {
    html += "<th>" + e.title + "</th>";
  });
  html += "</tr></thead><tfoot><tr>";
  d.forEach(function (e) {
    html +=
      '<th><input type="text" placeholder="Search ' +
      e.title +
      '" />' +
      "</th>";
  });
  console.log(html);
  return html + "</tr></tfoot>";
}

function show_errors() {
  var $sidebar = $(".control-sidebar");
  var $container = $("<div />", {
    class: "p-3 control-sidebar-content",
  });

  $sidebar.append($container);
  //$container.append('<h5>Sales Order Errors</h5><hr class="mb-2"/>')

  //$container.append('<div class="alert alert-warning alert-dismissible fade show" role="alert">\
  //    <strong>Holy guacamole!</strong> You should check in on some of those fields below.\
  //   <button type="button" class="close" data-dismiss="alert" aria-label="Close">\
  //    <span aria-hidden="true">&times;</span>\
  //    </button>\
  //    </div>');
}
