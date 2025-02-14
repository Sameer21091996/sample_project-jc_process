
var receipt_type_code = ''
var uploaded_files = []
var fileServerIdArr = []
var uploaded_error =[]


// Add a request interceptor
axios.interceptors.request.use(function (config) {
   //console.log('request started')
   config.timeout = 60000;
   return config;
 }, function (error) {
   return Promise.reject(error);
   HideLoading()
 });

// Add a response interceptor
axios.interceptors.response.use(function (response) {
   //console.log('request ended')
   return response;
 }, function (error) {
   console.log('request error--->',error)
   return Promise.reject(error);
   HideLoading()
 });

 
function initFilePond(){
   pond  = $('.pond').filepond();
   
   $('.pond').filepond('allowMultiple', true);
   $('.pond').filepond('labelIdle', 'Drop other files here<br><b>Document Upload is Optional</b>');
   $('.pond').filepond.setOptions({
       maxFileSize: '15MB',
       server: {
           url:window.location.origin ,
           process:  {
               url: '/fp/process/',
               headers: {"X-CSRFToken":csrf_token},
           },
           revert:  {
               url: '/fp/revert/',
               headers: {"X-CSRFToken":csrf_token},
           },
           fetch:  {
               url: '/fetch/?target=',
               headers: {"X-CSRFToken":csrf_token},
           },
           load:  {
               url: '/load/?target=',
               headers: {"X-CSRFToken":csrf_token},
           },
       },
       onprocessfile: function(error, file) {
           console.log('File added: [' + error + ']   file: [' + file.serverId + ']');
           current_entry = $("#current_entry").val()
           if(uploaded_files[current_entry]){
               uploaded_files[current_entry].push(file.serverId);
            }else{
               uploaded_files[current_entry] = [file.serverId];
            }
            $("#r_"+current_entry).parent().find('span').text('File uploaded')
            fileServerIdArr[file.id] = file.serverId
       },
       onremovefile: function(error, file) {
           console.log('File removed: [' + error + ']   file: [' + file.id + ']');
           console.log('full files--->',uploaded_files)
           console.log('fileServerIdArr----<',fileServerIdArr)
           current_entry = $("#current_entry").val()
           if(file.id in fileServerIdArr){
               file_server_id = fileServerIdArr[file.id]
               delete uploaded_files[current_entry][uploaded_files[current_entry].indexOf(file_server_id)] 
               delete fileServerIdArr[file.id]
           }

           if(uploaded_files[current_entry].length==0)
              $("#r_"+current_entry).parent().find('span').text('')

           console.log('full files--->',uploaded_files)
           console.log('fileServerIdArr----<',fileServerIdArr)
       },
       onerror: function(error, file, status) {
           console.log('File error: [' + error + ']   file: [' + file.id + '], status [' + status + ']');
           if(file.id in uploaded_files) {
               delete uploaded_files[file.id];
           }
           uploaded_error[file.id] = true;
           //updateButton();	    		
       }
   });
}

function ldStep(s,h,type){
   $(h).slideUp();
   $(s).slideDown();
   $("#current_entry").val(type)
   console.log('cur_entry',$("#current_entry").val())
   console.log(h)
   if(h=='#remittanceForm')
      $("#remit_footer").addClass('d-none')
   else
      $("#remit_footer").removeClass('d-none')
//    $('ul.filepond--list li').css({
//       'display': 'none'
//   }); 
}

function submit_remittance(){ 
//$('#remittanceForm').submit(function (event) {
   
   $('#remittanceForm').validate({
      ignore: [],
      errorElement: 'span',
      errorPlacement: function (error, element) {
        error.addClass('invalid-feedback');
        element.closest('.form-group').append(error);
      },
      highlight: function (element, errorClass, validClass) {
        $(element).addClass('is-invalid');
      },
      unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass('is-invalid');
      },
      invalidHandler: function(e,validator) {
          //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
          for (var i=0;i<validator.errorList.length;i++){
              invalid_tab = $(validator.errorList[i].element).closest('.tab-pane').data('tab')
              $(".tab-"+invalid_tab).trigger('click')
              break; 
          }
      }
  });
  $("#remitSubBtn").trigger('click')
}

function submit_deposit(){
   
   $('#depositForm').validate({
      ignore: [],
      errorElement: 'span',
      errorPlacement: function (error, element) {
        error.addClass('invalid-feedback');
        element.closest('.form-group').append(error);
      },
      highlight: function (element, errorClass, validClass) {
        $(element).addClass('is-invalid');
      },
      unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass('is-invalid');
      },
      invalidHandler: function(e,validator) {
          //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
          for (var i=0;i<validator.errorList.length;i++){
              invalid_tab = $(validator.errorList[i].element).closest('.tab-pane').data('tab')
              console.log('elem-->',$(validator.errorList[i].element))
              $(".tab-"+invalid_tab).trigger('click')
              break; 
          }
          console.log('invalod')
      }
  });
  totalDepActualAmt = $("#totalDepActualAmt").text().replace(/,/g, '')
  totalDepAmt = $("#totalDepAmt").text().replace(/,/g, '')
  if(parseFloat(totalDepActualAmt) > (parseFloat(totalDepAmt)+self.deposit_valid_amount)){
      Swal.fire('The Total Actual Amount cannot exceed '+self.deposit_valid_amount+'AED than the total amount')
  }else{
       $("#depositSubBtn").trigger('click')
  }

   //$('#receiptActionForm').addClass('was-validated');
}


$('#depositForm').validate({
   ignore: [],
   errorElement: 'span',
   errorPlacement: function (error, element) {
     error.addClass('invalid-feedback');
     element.closest('.form-group').append(error);
   },
   highlight: function (element, errorClass, validClass) {
     $(element).addClass('is-invalid');
   },
   unhighlight: function (element, errorClass, validClass) {
     $(element).removeClass('is-invalid');
   },
   invalidHandler: function(e,validator) {
       //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
       for (var i=0;i<validator.errorList.length;i++){
           invalid_tab = $(validator.errorList[i].element).closest('.tab-pane').data('tab')
           console.log('elem-->',$(validator.errorList[i].element))
           $(".tab-"+invalid_tab).trigger('click')
           break; 
       }
       console.log('invalod')
   }
});



$(document).on('submit','#transferForm',function(event){
   
      event.preventDefault();
      if ($('#transferForm')[0].checkValidity() === false) {
         console.log('invalid')
         event.stopPropagation();
      } else {
         $('.subBtn').addClass('disabled')
         var formData = new FormData();
         let form_data = $('#transferForm').serializeArray().reduce((function (acc, val) {
            field_name = val.name.replace('[', '_').replace(']', '')
            acc[field_name] = val.value;
            formData.append(field_name,acc[field_name])
            return acc
         }), {});
         formData.append('selected_receipts',selected_receipts)
         receipt_amount_fields = []
         $(".amount_shared").get().forEach(function(entry, index, array) {
            receipt_amount_fields.push(entry.name)
         });
         formData.append('receipt_amount_fields',receipt_amount_fields)
         var url = '/receipt/create_levels_transfer';
         const headers = {
            'X-CSRFTOKEN': csrf_token,
         }

         ShowLoading([
            "Initiated Across Level Transfer"
         ])

         axios.post(url, formData, {
            headers: headers
         }).then(response => {
            message = response.data.message
            if(response.data.status=='success'){
               //toastr.success(message)
               HideLoading()
               console.log('1')
               //Swal.fire(message,'','success').then()

               Swal.fire({
                  title: message,
                  icon: 'success',
                  showCancelButton: false,
                  confirmButtonColor: '#3085d6'
                }).then((result) => {
                  if (result.isConfirmed) {
                     setTimeout(function(){
                        var data = ['/receipt' , 'receipt']
                        var event = new CustomEvent('refresTabPage', { detail: data })
                        window.parent.document.dispatchEvent(event)
                     },500)
                  }
                })
                $("#transferModal .close").click()
               
            }else{
               //toastr.error(message)
               HideLoading()
               $('.subBtn').removeClass('disabled')
               Swal.fire(message,'','error')
            }
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
            $('.subBtn').removeClass('disabled')   
         });
      } 
   });

   function submit_transfer(){
      $('#transferSub').trigger('click')
   }

   datatable_multiselect = true
   function handleClick(e){
      status = e.dataset.value
      setTimeout(function(){
         //table.search("^" + status + "$", true, false, true).draw();
         info = table.draw();
      },150)
   }

   function dateSearch(selectedDates,datesearchObj){
      console.log('---selectedDates---',selectedDates)
      d = new Date(datesearchObj)
      
      status = d.getFullYear()  + "-" + '0'+(d.getMonth()+1) + "-" + '0'+d.getDate()
      
      setTimeout(function(){
         table.search(status, true, false, true).draw();
      },150)
   }

 vAppProperties.data = Object.assign(vAppProperties.data, {
   update : false, reversal:false,view : false,
   reversal_category:[],
   reversal_reason:[],
   org_id : org_id,
   op_unit : op_unit,
   location_name : location_name,
   deposit_valid_amount : 10
 })

 vAppProperties.mounted = function () {
      self = this
      var url = '/receipt/get_reverse_meta';
      axios.get(url)
         .then(response => {
            self.reversal_category = response.data.reversal_category
            self.reversal_reason = response.data.reversal_reason
         })
         .catch(e => {
            console.log(e)
         });

      var self = this;
      var defs = localStorage.getItem('defs');
      var action = 'update'

      $('#receiptActionForm').validate({
            ignore: [],
            errorElement: 'span',
            errorPlacement: function (error, element) {
            error.addClass('invalid-feedback');
            element.closest('.form-group').append(error);
            },
            highlight: function (element, errorClass, validClass) {
            $(element).addClass('is-invalid');
            },
            unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass('is-invalid');
            },
            invalidHandler: function(e,validator) {
               //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
               for (var i=0;i<validator.errorList.length;i++){
                  invalid_tab = $(validator.errorList[i].element).closest('.tab-pane').data('tab')
                  console.log('elem-->',$(validator.errorList[i].element))
                  $(".tab-"+invalid_tab).trigger('click')
                  break; 
               }
            }
      });
      
      $('#receiptActionForm').submit(function (event) {
         event.preventDefault();
         if ($('#receiptActionForm')[0].checkValidity() === false) {
             console.log('invalid')
             event.stopPropagation();
         } else {
            $('.subBtn').addClass('disabled')   
            action = $("#action").val()
            //do your ajax submition here
            if(action=='update'){
               customer_id = $("#searchCust").val()
               post_data = {
                  customer_id : customer_id
               }
               ShowLoading([
                  "Updating Customer"
               ])
            }else if (action=='reversal'){
               post_data = {
                  reversal_category_code : $("#reversal_category_code").val(),
                  reversal_category_reason : $("#reversal_category_reason").val(),
                  reversal_comments : $("#reversal_comments").val(),
                  reversal_gl_date : $("#reversal_gl_date").val()
               }
               ShowLoading([
                  "Reversing receipt"
               ])
            }
            receipt_id = $("#receipt_id").val()
            var url = '/receipt/receipt_action/' + action+'/'+receipt_id+'/';
            const headers = {
               'X-CSRFTOKEN': csrf_token,
            }
            axios.post(url, post_data, {
               headers: headers
            }).then(response => {
               message = response.data.message
               if(response.data.status=='success'){
                  Swal.fire({
                     title: message,
                     icon: 'success',
                     showCancelButton: false,
                     confirmButtonColor: '#3085d6'
                   }).then((result) => {
                     if (result.isConfirmed) {
                        setTimeout(function(){
                           var data = ['/receipt' , 'receipt']
                           var event = new CustomEvent('refresTabPage', { detail: data })
                           window.parent.document.dispatchEvent(event)
                        },500)
                     }
                   })
                   HideLoading()
                   $("#exampleModalCenter .close").click()
                  
               }else{
                  HideLoading()
                  Swal.fire(message,'','error')
                  $('.subBtn').removeClass('disabled')   
               }
               
            })
            
            .catch(e => {
               console.log(e)
               $('.subBtn').removeClass('disabled')   
               HideLoading()
               toastr.error('Process failed')
            });
         }
         $('#receiptActionForm').addClass('was-validated');
      });

      $('.select2bs4').select2({})
     $('#searchCust').select2({
         ajax: {
             url: search_customer_url,
             dataType: 'json',
             delay: 250,
             data: function (params) {
                 if ($('.select2-results').find('.search-loader').length == 0) {
                     $('.select2-results').append(
                         '<div class="d-flex search-loader justify-content-center p-2"><div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
                     );
                 }
                 return {
                     q: params.term, // search term
                     type: 'all', //ocument.getElementById('serach_based_on_type').value,
                     page: params.page,
                     org_id: self.org_id
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
         templateResult: self.formatRepo,
         templateSelection: self.formatRepoSelection,
         //   dropdownAutoWidth : true
     });   
 }

   $(document).on('select2:select', '#searchCust', function (e) {
      var id = e.params.data.id;
      var customer_number = e.params.data.customer_number;
      document.getElementById('main_customer_number').value = customer_number;
   })
   vAppProperties.methods = Object.assign(vAppProperties.methods, {
      formatRepoSelection(repo) {
            return repo.text || repo.customer_name;
      },
      formatRepo(repo) {
            if (repo.loading) {
               return 'Searching for customer...';
            }
            var $container =
               '<table style="width: 100%;font-size:14px;"><tr> <th class="small" scope="row">Customer Name:</th>\
                        <td>' + repo.customer_name + '</td>\
                  </tr>\
                  <tr>\
                        <th class="small" scope="row">Telephone No:</th>\
                        <td>' + repo.default_phone_no + '</td>\
                  </tr>\
                  <tr>\
                        <th class="small" scope="row">Email:</th>\
                        <td>' + repo.additional_email_address + '</td>\
                  </tr>\
                  <tr>\
                        <th class="small" scope="row">Mobile No:</th>\
                        <td>' + repo.default_mobile_no + '</td>\
                  </tr>\
                  <tr>\
                        <th class="small" scope="row">Account No:</th>\
                        <td>' + repo.account_number + '</td>\
                  </tr>\
                  <tr>\
                        <th class="small" scope="row">TRN No:</th>\
                        <td>' + repo.trn_number + '</td>\
                  </tr>\
               </table>'

            var str = document.querySelector(
               "body > span > span > span.select2-search.select2-search--dropdown > input").value

            str = (str.toUpperCase()).trim()
            str_arr = str.split(' ');
            for (var i = 0; i < str_arr.length; i++) {
               str = str_arr[i]
               if (str != '') {
                  $container = $container.replaceAll(str,
                        "<span class='font-weight-bold' style='color: yellow;'>" + str + "</span>");
               }

            }
            return $($container);
      }
      
   })

   function complete_payment(receipt_id){
         tab_url = '/receipt/action/edit/'+receipt_id
         unique_name = 'orderreceipt'+receipt_id
         var data = ['createTab', 'Complete Payment '+receipt_id , tab_url, unique_name , true ]
         var event = new CustomEvent('addOpenIframePage', { detail: data })
         window.parent.document.dispatchEvent(event)
   }
   function cancel_payment(receipt_id){

            Swal.fire({
               title: 'Do you want to cancel this recepit and order ?',
               icon: 'warning',
               showCancelButton: false,
               confirmButtonColor: '#3085d6'
            }).then((result) => {
               if (result.isConfirmed) {
                  ShowLoading([
                     "cancelling the payment"
                  ])
                  url = '/receipt/cancel_payment/'+receipt_id
                  axios.get(url)
                        .then(response => {
                           data = response.data
                           HideLoading()
                           if(data.status == 'error'){
                              toastr.error(response.data.message)
                           }else{
                              toastr.success(response.data.message)
                              table.draw();
                           }
                           return response
                        })
                        .catch(e => {
                           console.log(e)
                           HideLoading()
                           toastr.error('Process failed')
                        });
               }
            })
            
         
   }
   
   var reverse_status = receipt_statuses.find(x => x.code=='REVERSED' ).meaning
   var deposit_created_status = receipt_statuses.find(x => x.code=='DEPOSIT_CREATED' ).meaning
   console.log('reverse_status---->',reverse_status)
   function action_dropdown(data,row_id){
         let actionCellHtml = ''
         actionCellHtml = '<div class="btn-group">\
                  <div class="btn-group">\
                           <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                              <i class="ti-menu"></i>Action\
                           </button>'
         actionCellHtml +=  '<div class="dropdown-menu animated flipInY">'

         if(data.receipt_creation_status=='oracle_inprogress' || data.receipt_creation_status=='oracle_failed'){
            actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)" onclick="finalize_receipt('+row_id+')">Refresh</a>'     
            actionCellHtml += "</div> </div>";
            return actionCellHtml;
         }else if(data.receipt_creation_status=='pending'){
               actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)" onclick="complete_payment('+row_id+')">Complete Payment</a>'
               actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)" onclick="cancel_payment('+row_id+')">Cancel Payment</a>'
               actionCellHtml += "</div> </div>";
               return actionCellHtml;
         }
         
         if (data.order_number==null) {
               if(data.customer_number ==null){      
                  actionCellHtml +=  '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="update_receipt('+row_id+')">Update</a>'
               }
               // if(data.receipt_status!='Reversed')
                  // actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="across_ledger_transfer('+row_id+')">Across Ledger Transfer</a>'
         }
         actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="download_pdf('+row_id+')">Download</a>'
         actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="view_pdf('+row_id+')">View</a>'
         
         if(data.receipt_creation_status!='pending' && data.receipt_status!=reverse_status)
               actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="reverse_receipt('+row_id+')">Reversal</a>'
         if(data.deposit_number!=null && data.deposit_number!='')
               actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="view_deposit('+row_id+')">View Deposit</a>'
         if(data.receipt_status=='Remittance Initiated' || (data.remit_batch!=null && data.remit_batch!=''))
               actionCellHtml += '<a class="dropdown-item cust_class" href="javascript:void(0)"  onclick="view_remittance('+data.cash_receipt_id+','+data.remit_batch+')">View Remittance</a>'
         actionCellHtml += "</div> </div>";
         return actionCellHtml;
   }

   function update_receipt(receipt_id){
         this.update = true
         this.view = false
         $("#receipt_id").val(receipt_id)
         $("#action").val('update')
         pdf_preview(receipt_id,'update')
   }
   function reverse_receipt(receipt_id){
      this.view = false
      this.update = true
      $("#receipt_id").val(receipt_id)
      $("#action").val('reversal')
      $('#reversal_gl_date').flatpickr({
         dateFormat: 'd-M-Y',
         //maxDate: new Date(),
         //defaultDate: d.setDate(d.getDate()),
         minDate: new Date(),
         allowInput: false
      });
      pdf_preview(receipt_id,'reversal');
   }
   function pdf_preview(receipt_id,action=null){
      
      var url = '/receipt/get_pdf_data/'+receipt_id ;
      axios.get(url)
            .then(response => {
               pdf_data = response.data.header_context
               axios({
                  method: 'post',
                  url: pdf_template_url,
                  data: pdf_data,
                  // responseType: 'blob'
                  }).then(function(response) {
                  if (response.data.html){
                        $('#print-div').removeClass('d-none')
                        $('#print-div').empty().append(response.data.html)
                        $(".select2bs4").val('').trigger('change')

                        $("#receiptActionForm").trigger('reset');
                        $(".rev_today").val(moment().format('DD-MMM-YYYY'))
                        //console.log('todayyyyy------->',moment().format('DD-MMM-YYYY'))
                        $('#exampleModalCenter').modal('show');
                        $('.subBtn').removeClass('disabled')   
                        $("#searchCust").empty().trigger('change')
                        
                        if(action!=null){
                           $(".view_action").removeClass('d-none')
                           $(".rec_action").addClass('d-none')
                           $(".rec_"+action+"").removeClass('d-none')
                        }
                        if(action=='view'){
                           $(".rec_action").addClass('d-none')
                           $(".view_action").addClass('d-none')
                           
                           if ($('#popupCloseBtn .fa-minus').length == 0) {
                              $("#popupCloseBtn").trigger('click')
                           }
                        }else{
                           $(".rec_"+action+"").removeClass('d-none')
                           if ($('#popupCloseBtn .fa-plus').length == 0) {
                              $("#popupCloseBtn").trigger('click')
                           }
                        }
                        $("#action_title").text('Receipt '+action)
                  }
                  else{ 
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'example.pdf');
                        document.body.appendChild(link);
                        link.click();
                  }
                  })
                  .catch(err=>{console.log('at 142', err.message, err);});
            })
            .catch(e => {
               console.log(e)
               HideLoading()
               toastr.error('Process failed')
            }); 
   }
   function view_pdf(receipt_id){
      this.view = true
      $("#receipt_id").val(receipt_id)
      //$("#action").val('reversal')
      pdf_preview(receipt_id,'view');
      
   }
   function download_pdf(receipt_id){
      ShowLoading([
         "Printing receipt"
      ])
      var url = '/receipt/get_pdf_data/'+receipt_id ;
      axios.get(url)
          .then(response => {
               if(response.data.status && response.data.status=='pending'){
                  HideLoading()
                  toastr.error(response.data.message)
                  return false
               }
               
               pdf_data = response.data.header_context
               
               // for (var j=0 ; j <100;j++)
               //    pdf_data.data_list[0].push(pdf_data.data_list[0][0]) 

              var file_name  = response.data.header_context.header_context.rec_numb+'_'+response.data.header_context.header_context.numb
              var div_width = pdf_data.header_context.process_type=='A' ? '850px': '730px'
              axios({
                  method: 'post',
                  url: pdf_template_url,
                  data: pdf_data,
                  // responseType: 'blob'
                  }).then(function(response) {
                     HideLoading()
                     if (response.data.html){
                        $('#print-div2').removeClass('d-none')
                        console.log('div_width--->',div_width)
                        $('#print-div2').empty().append(response.data.html)
                        $('#print-div2').find('img').css('width',div_width)
                        
                        printPDF(response.data.html, 'print-div2',file_name)
                     }
                     else{ 
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'example.pdf');
                        document.body.appendChild(link);
                        link.click();
                     }
                  }
                  )
                  .catch(err=>{console.log('at 142', err.message, err);HideLoading();});
          })
          .catch(e => {
              console.log(e)
              HideLoading()
              toastr.error('PDF creation failed')
          }); 
   }

   var selected_receipts = []
   function action_function(e){
     
      action  = $(e).data('value')
      selected_receipts = []
      var checkboxes = document.querySelectorAll('input[name=bulk_ids]:checked')
      for (var i = 0; i < checkboxes.length; i++) {
         selected_receipts.push(Number(checkboxes[i].value))
      }
      if(action=='remit'){
         remittance_form();
         
      }else if (action=='deposit'){
         deposit_form();
      }
   }
   function create_across_lines(lines){
         for (var i=0;i<lines.length;i++){
            initiate_date = moment(lines[i]['initiated_date']).format('DD-MMM-YYYY') 
            s_no = i+1
            refreshBtn = ''
            if(lines[i]['level_line_status__code']=='TRANSFER_INITIATED')
               refreshBtn = '<br><a class="btn-primary btn-sm" data-id='+lines[i]['line_id']+' onclick="refresh_line_data(this)"> Refresh </a>'
            $('#transfer_table tbody').append('<tr><td>'+s_no+'</td>\
                                             <td>'+lines[i]['to_rec_level']+'</td>\
                                             <td class="applied_amt">'+lines[i]['amt_to_share']+'</td>\
                                             <td class="txn_date">'+initiate_date+'</td>\
                                             <td class="dm_trx">'+lines[i]['source_reference']+'</td>\
                                             <td class="cm_trx">'+lines[i]['dest_reference']+'</td>\
                                             <td class="line_status">'+lines[i]['level_line_status__meaning']+'&nbsp;'+refreshBtn+'</td>\
                                          </tr>');
         }
   }
   function refresh_line_data(e){
      rec_id = $(e).data('id')
      var url = '/receipt/refresh_level_tranfer/' + rec_id;
      axios.get(url)
            .then(response => {
               data = response.data
               console.log('selected--->',data)
               if(data.status=='success'){
                  $(e).parent().parent().find('.dm_trx').text(data.source_reference)
                  $(e).parent().parent().find('.cm_trx').text(data.dest_reference)
                  // $(e).parent().parent().find('.tax_dm').text(data.tax_dm_trx_id)
                  // $(e).parent().parent().find('.tax_cm').text(data.tax_cm_trx_id)
                  $(e).parent().parent().find('.line_status').text(data.level_line_status)
               }else if(data.status == 'error'){
                  toastr.error(response.data.message)
               }else{
                  toastr.warning('Tranfer still in process')
               }
               HideLoading()
               return response
            })
            .catch(e => {
               console.log(e)
               HideLoading()
               toastr.error('Process failed')
            });

      
   }
   function across_ledger_transfer(receipt_id){
      $("#transfer_receipt_id").val(receipt_id)
      var url = '/receipt/get_receipt_info/' + receipt_id;
      axios.get(url)
            .then(response => {
               data = response.data
               console.log('selected--->',response)
               $("#transfer_cust_name").text(data.customer_name)
               $("#transfer_receipt_method").text(data.receipt_method_name)
               $("#transfer_receipt_number").text(data.receipt_number)
               $("#transfer_receipt_amount").text(data.receipt_amount)
               $("#transfer_receipt_unapplied_amount").text(data.unapplied_amount)
               
               return response
            })
            .catch(e => {
               console.log(e)
               HideLoading()
               toastr.error('Process failed')
            });

      var url = '/receipt/across_ledger_transfer_form/'+receipt_id;
      axios.get(url)
            .then(response => {
               data = response.data
               console.log('selected--->',response)
               $("#transfer_request_number").val(data.request_number)
               
               lines = data.lines
               console.log('lines.length--->',lines.length)
               if(lines.length > 0){
                  $("#addTransfer").removeClass('d-none')
               }else{
                  $("#addTransfer").addClass('d-none')
               }

               $('#transferModal').modal('show');
               $('.subBtn').removeClass('disabled')   

               setTimeout(function(){
                  $("#transfer_table tbody tr").remove(); 
                  if(lines.length>0){
                     create_across_lines(lines)
                  }else{
                     setTimeout(function(){
                        var counter=1;
                        $("#addTransfer").trigger('click')
                     },100);
                  }
               },300);
               return response
            })
            .catch(e => {
               console.log(e)
               HideLoading()
               toastr.error('Process failed')
            });

      $('#transferForm').validate({
         ignore: [],
         errorElement: 'span',
         errorPlacement: function (error, element) {
           error.addClass('invalid-feedback');
           element.closest('.form-group').append(error);
         },
         highlight: function (element, errorClass, validClass) {
           $(element).addClass('is-invalid');
         },
         unhighlight: function (element, errorClass, validClass) {
           $(element).removeClass('is-invalid');
         },
         invalidHandler: function(e,validator) {
             //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
             for (var i=0;i<validator.errorList.length;i++){
                 invalid_tab = $(validator.errorList[i].element).closest('.tab-pane').data('tab')
                 $(".tab-"+invalid_tab).trigger('click')
                 break; 
             }
         }
      });
   }
   
   function remittance_form(){
      uploaded_files = []
      fileServerIdArr = []
     
      //clear the existing fields
      $("#remittance_date").val()
      $("#remittanceForm #status").val('To Be Remitted')
      
      if(selected_receipts.length==0){
         Swal.fire('Please select receipts')
         return false
      }
      initFilePond()
      receipt_method_type = $(".receipt_method_type").val()
      var editor = $('#remit_table').DataTable({
         "processing": true,             
         "serverSide": true,    
         "bDestroy": true,   
         "autoWidth": false,
         "ajax": {                   
            url: "/receipt/selected_receipt_list", // json datasource
            headers: {
               'X-CSRFTOKEN': csrf_token,
           },
            data: {selected_receipts:JSON.stringify(selected_receipts)}, // Set the POST variable array and adds action: getTransactions
            type: 'post',  // method  , by default get      ,
            error: function (jqXHR, textStatus, errorThrown) {
               console.log('errorThrown--->',errorThrown)
            }             
         },
         columns: [
             { data: 'receipt_number' },
             { data: 'receipt_method_type' },
             { data: 'bank_account_name' },
             { data: 'bank_account_number' },
             {
                  data: 'id',
                  defaultContent: '',
                  render : function (data, type, full, meta) {
                     return '<div class="form-group"><select class="new_bank_account_name form-control" name="new_bank_account_name_'+data+'"></select></div>';
                  },
                  width: "30%"
            },
             { data: 'receipt_amount' },
             { data: 'receipt_method_name' },
             { data: 'receipt_date' },
             { data: 'gl_date' },
             {
                  data: 'id',
                  className: 'select-checkbox',
                  orderable: false,
                  searchable: false,
                  render : function (data, type, full, meta) {
                     return '<a class="btn btn-primary" href="#" data-receipt="r_'+ data +'" id="r_'+ data +'" onclick=ldStep("#upload_file","#remittanceForm",'+data+')> Upload </a> <br> <span> </span>';
                     }
             },
         ],
         'columnDefs': [{
                  "targets": 4,
                  createdCell: function(td, cellData, rowData, row, col) {
                         $(td).attr('data-name', 'bank_name[]');
                        $(td).attr('data-field-type', 'text');
                        $(td).attr('data-id', rowData['id']);
                        $(td).attr('class', 'editable');
                  },
                  width: "30%",
                  className: "no-wrap",
                  }],
         "drawCallback": function( settings ) {
            $('.new_bank_account_name').select2({
               ajax: {
                  url: '/receipt/receipt_bank_lov',
                  data: function (params) {
                    var query = {
                      q: params.term,
                      receipt_id: $(this).parent().parent().data('id')
                    }
                    // Query parameters will be ?search=[term]&type=public
                    return query;
                  },
                  processResults: function(data) {
                     return {
                       results: data.items
                     };
                   },
               },
               width: '100%'
            })
            var response = settings.json;
            if(response.status=='success'){
               receipt_type_code = response.receipt_type_code
               $("#receipt_method_type").val(response.receipt_type)
               $("#request_number").val(response.request_number)
               
               if(receipt_type_code=='CA' || receipt_type_code=='CC' || receipt_type_code=='CCWA'){
                  $("#common_attach").show()
                  $('#remit_table').DataTable().column(9).visible(false);
               }else{
                  $("#common_attach").hide()
               }   
               $('#remittanceModal').modal('show');
               $("#remittanceModal").find('.btn-primary').removeClass('d-none')
               $('.remit_date').val('').attr('readonly', false);
               $("#remit_batch_name").val('')
               ldStep('#remittanceForm','#upload_file')
               $('.subBtn').removeClass('disabled')  
               $('ul.filepond--list li').css({
                  'display': 'none'
              });

              var d = new Date();
               $('.remit_date').flatpickr({
                  dateFormat: 'd-M-Y',
                  maxDate: new Date(),
                  defaultDate: d.setDate(d.getDate()),
                  minDate: new Date(response.last_date),
                  allowInput: false
               });
               
            }else{
               Swal.fire(response.message,'','error')
            }
         },
         "bPaginate" : false,
         "ordering": false,
         "footerCallback": function ( row, data, start, end, display ) {
            var api = this.api(), data;
    
            // Remove the formatting to get integer data for summation
            var intVal = function ( i ) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '')*1 :
                    typeof i === 'number' ?
                        i : 0;
            };
            // Total over all pages
            total = api .column( 5 ).data().reduce( function (a, b) {
                                 return intVal(a) + intVal(b);
                              }, 0 );
                console.log('total-------->',total)
            // Update footer
            $( api.column( 5 ).footer() ).html( total.toFixed(2));
        }
      });
   }

   function deposit_form(){
      $("#depositModal").find('.btn-primary').removeClass('d-none')
      if(selected_receipts.length==0){
         Swal.fire('Please select receipts')
         return false
      }
      
      var dep_tabl = $('#deposit_table').DataTable({
         "processing": true,             
         "serverSide": true,    
         "bDestroy": true,         
         "ajax": {                   
            url: "/receipt/selected_deposit_receipt_list", // json datasource
            headers: {
               'X-CSRFTOKEN': csrf_token,
           },
            data: {selected_receipts:JSON.stringify(selected_receipts)}, // Set the POST variable array and adds action: getTransactions
            type: 'post',  // method  , by default get      ,
            error: function (jqXHR, textStatus, errorThrown) {
               console.log('errorThrown--->',errorThrown)
            } ,
            dataSrc: function(d){

               // TODO: Insert your code
               self.deposit_valid_amount = d.deposit_valid_amount
               if(d.data.length>0){
                  min_date = new Date(d.data[0].min_receipt_date)
                  $('.depositdate').flatpickr({
                     dateFormat: 'd-M-Y',
                     maxDate: new Date(),
                     minDate: min_date,
                     allowInput: false
                  });
               }

               return d.data;    
           }         
         },
         columns: [
               {
                  data: null,
                  defaultContent: '',
                  render : function (data, type, full, meta) {
                     return '';
                  }
            },
            {  data: 'remit_batch',
               render : function (data, type, full, meta) {
                  return '<div class="form-group"><input type="number" step="any" name="remit_batch"  step="any" class="form-control" value="'+data+'" readonly></div>';
               }
            },
             {
                  data: 'total_receipt_amount',
                  render : function (data, type, full, meta) {
                     return '<div class="form-group"><input type="number" step="any" name="total_receipt_amount_1"  step="any" class="form-control receipt_amt" value="'+data+'" readonly></div>';
                  }
            },
             {
                  data: 'total_receipt_amount',
                  render : function (data, type, full, meta) {
                     return '<div class="form-group"><input id="remit_actual_amount" type="number" step="any" name="actual_amount_1"  step="any" class="form-control actual_amount" value="'+data+'" required> <span class="error invalid-feedback"></span> </div>';
                  }
             }
         ],
         "drawCallback": function( settings ) {
            var response = settings.json;
            if(response.status=='success'){
               $("#deposit_number").val(response.deposit_number)
               $('#depositModal').modal('show');
               $('.subBtn').removeClass('disabled')  
            }else{
               alert(response.message)
            }
         },
         "bPaginate" : false,
         "ordering": false,
         "footerCallback": function ( row, data, start, end, display ) {
            var api = this.api(), data;
            // Remove the formatting to get integer data for summation
            var intVal = function ( i ) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '')*1 :
                    typeof i === 'number' ?
                        i : 0;
            };
            // Total over all pages
            total = api .column( 2 ).data().reduce( function (a, b) {
                                 return intVal(a) + intVal(b);
                              }, 0 );

                              // Update footer
            $( api.column( 2 ).footer() ).html( total.toFixed(2));
            actual_total = api .column( 3 ).data().reduce( function (a, b) {
               return intVal(a) + intVal(b);
            }, 0 );
            // Update footer
            $( api.column( 3 ).footer() ).html( actual_total.toFixed(2));
        }
      });
      counter = 2;
  }

function actual_amount_total(){
   var tAmount=0;
      [].slice.call($('.actual_amount')).forEach(function (inp) {                    
         tAmount = tAmount + (isNaN(parseFloat(inp.value)) ? 0 : parseFloat(inp.value));
         return tAmount
      });
      console.log('actual_amount tAmount--->',tAmount)
      setTimeout(function(){
         $('#totalDepActualAmt').text(tAmount.toLocaleString());
      },150);
}

function add_new_deposit(counter,copy=false){
      if(copy==true){
         var new_line = $('#deposit_table tbody').find('tr:eq(0)').clone();
         new_line = new_line.html().replace('actual_amount_1', 'actual_amount_'+counter).replace('total_receipt_amount_1', 'total_receipt_amount_'+counter)
         $('#deposit_table tbody').append('<tr>'+new_line+'</tr>');
      }else{
         $('#deposit_table tbody').append("<tr><td><div class='form-group'><select name='deposit_receipt_number_"+counter+"' class='deposit_receipt_number form-control' required></select></div></td>\
         <td> <div class='form-group'><input readonly type='number' step='any' class='form-control receipt_batch' ></div> </td>\
         <td> <div class='form-group'><input readonly type='number' step='any' name='total_receipt_amount_"+counter+"' class='form-control receipt_amt' ></div></td>\
         <td><div class='form-group'><input  type='number' step='any' name='actual_amount_"+counter+"' class='form-control actual_amount' required><span class='error invalid-feedback' style='display: none;'></span></div></td></tr>");
      }
      $('.deposit_receipt_number').select2({
         ajax: {
            url: '/receipt/unapplied_receipt_lov',
            data: function (params) {
               var query = {
                  q: params.term,
                  selected_receipts: JSON.stringify(selected_receipts)
               }
               return query;
            },
            processResults: function(data) {
               return {
                  results: data.items
               };
               },
         },
         width: '100%'
      })
      setTimeout(function(){
         actual_amount_total()
      },50);
      
}

function finalize_receipt(receipt_id){
      self = this
      if(receipt_id!=''){
         ShowLoading([
            "Finalizing receipt"
         ])
          var url = '/receipt/finalize_receipt/' + receipt_id+'/1/0';
          axios.get(url)
              .then(response => {
               message = response.data.message
               toastr.options = {
                  timeOut: 0,
                  extendedTimeOut: 0
               };
               if(response.data.status=='success'){
                     toastr.success(message)
                     if(response.data.order_number!=undefined){
                        //finalize_order(response.data.order_number)
                     }
                     $("#transfersTabs li a.active").trigger('click')
               }else{
                     toastr.error(message)
               }
               HideLoading()
            })
            .catch(e => {
               HideLoading()
               toastr.error('Receipt finalizing failed')
            });
      }
}

function finalize_order(order_number){
   axios.get("/saleswores/finalize_order_create_in_oracle?order_number="+order_number).then(function(res)
            {        
               if(res.data.status=='S'){
                  toastr.success(res.data.order_status);      
               }else if(res.data.status=='E'){
                  toastr.success(res.data.credit_resp); 
               }
               else{
                  toastr.success(res.data.order_status); 
               } 
            }).catch(function()
            { 
               HideLoading()
            })
}

$(document).on('input',$('.actual_amount'),function(){
   actual_amount_total()
});
$(document).on('blur', '.actual_amount', function () {
      actual_amount = $(this).val();
      amount = $(this).closest('tr').find('.receipt_amt').val();
      if ($(this).attr('id') == 'remit_actual_amount' && (actual_amount > parseFloat(amount)+self.deposit_valid_amount  )) {
         $(this).val(0)
         $(this).closest('td').find('span:last').css({ display: "block" });
         $(this).closest('td').find('span:last').text('The Actual Amount cannot exceed or below '+self.deposit_valid_amount+'AED than the remittance batch amount');
         actual_amount_total()
       }else{
         $(this).closest('td').find('span:last').css({ display: "none" });
         $(this).closest('td').find('span:last').text('');
       }
});


 $(document).on('select2:select','.deposit_receipt_number',function (e) {
   var selected = {'selection':e.params.data};
   var url = '/receipt/get_receipt_info/' + selected.selection.id;
   let resp;
    axios.get(url)
         .then(response => {
            console.log('selected--->',response)
            $(this).closest('tr').find('.receipt_batch').val(response.data.remit_batch);
            $(this).closest('tr').find('.receipt_amt').val(response.data.receipt_amount);
            $(this).closest('tr').find('.actual_amount').val(response.data.receipt_amount);

            var tAmount=0;
            [].slice.call($('.receipt_amt')).forEach(function (inp) {                    
               tAmount = tAmount + (isNaN(parseFloat(inp.value)) ? 0 : parseFloat(inp.value));
               return tAmount
            });
         
            setTimeout(function(){
               $('#totalDepAmt').text(tAmount.toLocaleString());
            },150);
            
            return response
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         });
  
});


$(document).on('submit','#remittanceForm',function(event){
      event.preventDefault();
      if ($('#remittanceForm')[0].checkValidity() === false) {
         console.log('invalid')
         event.stopPropagation();
      } else {
         attachment_status = true
         if(receipt_type_code=='CA' || receipt_type_code=='CC' || receipt_type_code=='CCWA'){
            if(uploaded_files["common"] == undefined || uploaded_files["common"].length == 0){
               Swal.fire('Please upload Attachment')
               attachment_status = false
            }
         }else{
             selected_receipts.forEach(function(item) {
               if(uploaded_files[item] == undefined || uploaded_files[item].length == 0){
                  Swal.fire('Please upload attachment for receipt '+item)
                  attachment_status = false
               }
            });
         }     

         if(attachment_status==false)
            return false
         $('.subBtn').addClass('disabled')
         ShowLoading([
               "Creating Receipt Remittance"
            ])

         var formData = new FormData();
         let form_data = $('#remittanceForm').serializeArray().reduce((function (acc, val) {
            field_name = val.name.replace('[', '_').replace(']', '')
            acc[field_name] = val.value;
            formData.append(field_name,acc[field_name])
            return acc
         }), {});
         formData.append('selected_receipts',selected_receipts)

         var form_upload_files = {}
         for (let prop of Object.keys(uploaded_files)){
            form_upload_files[prop] = uploaded_files[prop].filter(item => item).join(',')
            console.log('prop-->',form_upload_files[prop])
         }
         formData.append('uploaded_files',JSON.stringify(form_upload_files))

         var url = '/receipt/create_remittance_batch';
         
         const headers = {
            'X-CSRFTOKEN': csrf_token,
         }

         axios.post(url, formData, {
            headers: headers
         }).then(response => {
            message = response.data.message
            if(response.data.status=='success'){
               Swal.fire({
                  title: message,
                  icon: 'success',
                  showCancelButton: false,
                  confirmButtonColor: '#3085d6'
                }).then((result) => {
                  if (result.isConfirmed) {
                     setTimeout(function(){
                        var data = ['/receipt' , 'receipt']
                        var event = new CustomEvent('refresTabPage', { detail: data })
                        window.parent.document.dispatchEvent(event)
                     },500)
                  }
                })
               $("#remittanceModal .close").click()
            }else{
               Swal.fire(message,'','error')
               $('.subBtn').removeClass('disabled')
            }
            
            HideLoading()
            
         })
         
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
            $('.subBtn').removeClass('disabled')
         });
      }
   })

   $(document).on('click','#addRow',function(event){
      add_new_deposit(counter++)
   })
   $(document).on('click','#copyDeposit',function(event){
      add_new_deposit(counter++,copy=true)
   })

   var counter = 1
   $(document).on('click','#addTransfer',function(event){
      next_sno =  $('#transfer_table tbody tr').length+1;
      $('#transfer_table tbody').append('<tr><td>'+next_sno+'</td>\
                              <td><div class="form-group"><select name="to_rec_level_1" class="form-control to_rec_level" required></form></div></td>\
                              <td><div class="form-group"><input type="number" name="amount_to_be_shared_1"  step="any" class="form-control amount_shared" required></div></td>\
                              <td></td></td>\
                              <td></div></td>\
                              <td></td>\
                              <td></td></tr>');
         receipt_id = $("#transfer_receipt_id").val()
         $('.to_rec_level').select2({
            ajax: {
               url: '/receipt/to_rec_level_lov',
               data: function (params) {
                  var query = {
                     q: params.term,
                     receipt_id: receipt_id
                  }
                  return query;
               },
               processResults: function(data) {
                  return {
                     results: data.items
                  };
                  },
            },
            width: '100%'
         })
         $('#addTransfer').addClass('d-none')
   });               
   
   
    

   $(document).on('submit','#depositForm',function(event){
      event.preventDefault();
            if ($('#depositForm')[0].checkValidity() === false) {
               console.log('invalid')
               event.stopPropagation();
            } else {
               
               amnt_flag = true;
               [].slice.call($('.actual_amount')).forEach(function (inp) {                    
                  if(parseFloat(inp.value)==0)
                     amnt_flag = false
                  console.log(parseFloat(inp.value))
               });
               if(amnt_flag==false){
                  Swal.fire('Please enter valid actual amount')
                  return amnt_flag;
               }
               $('.subBtn').addClass('disabled')   
               ShowLoading([
                     "Creating Receipt Deposit"
                  ])
               var formData = new FormData();
               let form_data = $('#depositForm').serializeArray().reduce((function (acc, val) {
                  field_name = val.name.replace('[', '_').replace(']', '')
                  acc[field_name] = val.value;
                  formData.append(field_name,acc[field_name])
                  return acc
               }), {});

               formData.append('selected_receipts',selected_receipts)
               receipt_amount_fields = []
               $(".actual_amount").get().forEach(function(entry, index, array) {
                  console.log(entry.name)
                  receipt_amount_fields.push(entry.name)
               });
               formData.append('receipt_amount_fields',receipt_amount_fields)
            
               var url = '/receipt/create_deposit';
               const headers = {
                  'X-CSRFTOKEN': csrf_token,
               }
               axios.post(url, formData, {
                  headers: headers
               }).then(response => {
                  message = response.data.message
                  if(response.data.status=='success'){
                     //toastr.success(message)
                     Swal.fire({
                        title: message,
                        icon: 'success',
                        showCancelButton: false,
                        confirmButtonColor: '#3085d6'
                      }).then((result) => {
                        if (result.isConfirmed) {
                           setTimeout(function(){
                              var data = ['/receipt' , 'receipt']
                              var event = new CustomEvent('refresTabPage', { detail: data })
                              window.parent.document.dispatchEvent(event)
                           },500)
                        }
                      })
                     
                     $("#depositModal .close").click()
                  }else{
                     //toastr.error(message)
                     Swal.fire(message,'','error')
                     $('.subBtn').removeClass('disabled')   
                  }
                 

                  HideLoading()
               })
               .catch(e => {
                  console.log(e)
                  $('.subBtn').removeClass('disabled')   
                  HideLoading()
                  toastr.error('Process failed')
               });
            }
         })

         function get_params() {
            $data = {
                "tab_status": $("#transfersTabs li a.active").data('value'),
                "gl_date_val" : ($(".gl_picker").val()!='' ? $(".gl_picker").val() : '' )
            };
            console.log('$data---->',$(".gl_picker").val())
            return $data;
        }

   function view_deposit(receipt_id) {
      $('#depositModal').modal('show');
      $("#depositModal").find('.btn-primary').addClass('d-none')
      var url = "/receipt/deposit_view/" + receipt_id + '/';
      axios.get(url).then(response => {
            data = response.data.data
            $('.depositdate').val(moment(response.data.deposit_date).format('DD-MMM-YYYY')).attr('readonly', true);
            $("#deposit_number").val(response.data.deposit_number)
            $('#deposit_table').DataTable({
               "bDestroy": true,
               "data": data,
               columns: [{
                     data: 'receipt_number',
                     defaultContent: '',
                     render: function (data, type, full, meta) {
                        return data == 'null' ? '' : data;
                     }
                  },
                  { data: 'remit_batch_id'},
                  {data: 'amount'},
                  {data: 'actual_amount'}
               ],
               "bPaginate": false,
               "ordering": false,
               "footerCallback": function (row, data, start, end, display) {
                  var api = this.api(),
                     data;
                  // Remove the formatting to get integer data for summation
                  var intVal = function (i) {
                     return typeof i === 'string' ?
                        i.replace(/[\$,]/g, '') * 1 :
                        typeof i === 'number' ?
                        i : 0;
                  };
                  // Total over all pages
                  total = api.column(2).data().reduce(function (a, b) {
                     return intVal(a) + intVal(b);
                  }, 0);

                  // Update footer
                  $(api.column(2).footer()).html(total.toFixed(2));
                  actual_total = api.column(3).data().reduce(function (a, b) {
                     return intVal(a) + intVal(b);
                  }, 0);
                  // Update footer
                  $(api.column(3).footer()).html(actual_total.toFixed(2));
               }
            });
            HideLoading()
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         });
}
   
   function view_remittance(cash_receipt_id,remit_batch){
      axios.get('/receipt/view_remittance/'+cash_receipt_id+'/'+remit_batch+'/')
         .then(response => {
            resp = response.data
            $("#remittanceModal").find('.btn-primary').addClass('d-none')
            $('#remittance_date').val(moment(resp.remittance_date).format('DD-MMM-YYYY')).attr('readonly', true);
            $("#remit_batch_name").val(resp.remit_batch)
            $("#request_number").val(resp.request_number)
            $("#remittanceForm #status").val(resp.receipt_status)
            //$('.remit_date')
            $('#remittanceModal').modal('show');
            $('#remit_table').DataTable({
               "bDestroy": true,   
               "autoWidth": false,
               "data" : resp.data,
               columns: [
                  { data: 'receipt_number' },
                  { data: 'receipt_method_type' },
                  { data: 'bank_account_name' },
                  { data: 'bank_account_number' },
                  {data: 'new_bank_account_name'},
                  { data: 'receipt_amount' },
                  { data: 'receipt_method_name' },
                  { data: 'receipt_date' },
                  { data: 'gl_date' },
                  {
                        data: 'id',
                        className: 'select-checkbox',
                        orderable: false,
                        searchable: false,
                        render : function (data, type, full, meta) {
                           return '';
                           }
                  },
               ],
               "bPaginate" : false,
               "ordering": false,
               "footerCallback": function ( row, data, start, end, display ) {
                  var api = this.api(), data;
         
                  // Remove the formatting to get integer data for summation
                  var intVal = function ( i ) {
                     return typeof i === 'string' ?
                        i.replace(/[\$,]/g, '')*1 :
                        typeof i === 'number' ?
                              i : 0;
                  };
                  // Total over all pages
                  total = api .column( 5 ).data().reduce( function (a, b) {
                                       return intVal(a) + intVal(b);
                                    }, 0 );
                     console.log('total-------->',total)
                  // Update footer
                  $( api.column( 5 ).footer() ).html( total.toFixed(2));
            }
            });
         })
         .catch(e => {
            console.log(e)
         });

      
   }