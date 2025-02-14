vAppProperties.data = Object.assign(vAppProperties.data, {
   checkedType:'unapp',
   t1:null,
   t3:null,
   source_details : {},
   open_inv_data : {},
   validation_trx_date : '',
   page : page,
   acrData : {},
   pastedData : []
})

vAppProperties.mounted = function () {
   var self = this;
   self.validation_trx_date = self.get_date_obj('30-Apr-2019')
   $('.range_date_picker').flatpickr({
            dateFormat: 'd-M-Y',
            mode: "range",
            defaultDate: "today"
   });

   $('.date_picker').flatpickr({
         dateFormat: 'd-M-Y'
   });

   $('.receivable_levels').select2({
      ajax: {
         url: '/receipt/user_receivable_levels_lov',
         processResults: function (data) {
            return {
               results: data.items
            };
         }
      },
      placeholder:'Search for level'
   });

   setTimeout(function(scope) { 
         self.initializeCustSearch()   
   }, 50);

 

   $(document).on('select2:select', '#customer_id', function (e) {
      var id = e.params.data.id;
      var customer_name = e.params.data.customer_name;
      var customer_number = e.params.data.customer_number;
      var main_customer_id = e.params.data.id;
      $("#customer_number").val(customer_number)
   })

   // Add event listener for opening and closing details
   $(document).on('click', '.dt-control', function (e) {
      let tr = e.target.closest('tr');
      let settle_type = $(e.target).data('type')
      let settlemethod = $(e.target).data('settlemethod')
      let row = self.checkedType=='unapp' ? self.t1.row(tr) : self.t2.row(tr);
      
      self.get_row_details(e,row,settle_type)
      var rowData= row.data();
      level_name = rowData.level_name
      customer_id = rowData.customer_id
      self.open_inv_data = {}
      
      $("#unapplied_amount").val(self.source_details['Source_unapplied_amount'])
      $("#receipt_txn_number").val(rowData.transaction_number)
      $("#unapplied_amount").attr('data-original',self.source_details['Source_unapplied_amount'])
     
      if(self.page!='across_transfer'){
         if(settle_type='settle' && settlemethod!='excel'){
            if(self.source_details['Source_txn_type']=='refund' && rowData['remitted_flag']!='Y' && self.source_details['Source_Type']!='Credit Memo'){
                  alert('Unremiited Receipt cannot be refunded');
                  return;
            }
            Object.assign($("#get_txns")[0].dataset,{'trx_number':rowData.transaction_number,'cust_id':rowData.customer_trx_id,})
            $(".excelPaste").addClass('d-none')
            self.getTransactions(rowData.transaction_number,rowData.customer_trx_id)
            self.initInvTabl(level_name,customer_id);
         }else{
            $(".excelPaste").removeClass('d-none')
            self.settleExcel(level_name,customer_id)
         }
      }else{
         self.across_ledger_transfer(rowData.customer_trx_id,rowData)
      }

      $('#exampleModalCenter').modal('show')
      $('#settlement_process').prop("disabled",false);
      
   });


   $(document).on('click', '.openInv', function (e) {
      level_name = $(this).data('level_name')
      customer_id = $(this).data('customer_id')
      $('#exampleModalCenter').modal('show')
      setTimeout(function(scope) { 
         self.initInvTabl(level_name,customer_id);
      }, 50);
   })

  
   $(document).on('click', '.selectInv2', function (e) {
      
      var $row = $(this).closest("tr");
      var row_data = []
      $row.find("td").each(function() {
         row_data.push(this.innerText)
      });

      var rowData = row_data; // Get the data for the clicked row
      var columns = self.t3.settings().init().columns;
   
      col_info = []
      for (var i = 0; i < columns.length; i++) {
         var columnName = columns[i].data;
         var columnData = rowData[i];
         col_info[columnName] = columnData
      }
      console.log('col_info--->',col_info)
      console.log('source_details--->',self.source_details)

      if(self.source_details['Source_txn_type']!='refund' && self.source_details['Source_Type']=='Credit Memo' && self.source_details['Source_segment_4']!=col_info['CCID_SEGMENT4']){
            toastr.error("Not a Valid Settlement.... 'Credit Memo '|| :TGW_HEADER.TRX_NUMBER||' receivable account segment4 does not match with  TRX_NUMBER |' receivable account segment4")
            return false
      }
      if(self.source_details['Source_txn_type']!='refund' &&  self.source_details['Source_Type']=='Credit Memo' && col_info['CLASS']=='INV'){
         source_trx_date = self.get_date_obj(self.source_details['Source_transaction_date'])
         inv_trx_date = self.get_date_obj(col_info['TRX_DATE'])
         if(source_trx_date<self.validation_trx_date && inv_trx_date>source_trx_date){
            toastr.error('Settlement is not allowed, because Across Ledger CM is found with Advance Receipt.')
            return false
         }
      }

      cur_index = $('#openInvTable tr').index($(this).closest('tr'))
      if($(this).prop('checked') == true){
         self.open_inv_data[cur_index] = col_info
      }else{
         delete self.open_inv_data[cur_index];
      }
      console.log('self.open_inv_data---->',self.open_inv_data)
      

      sel_date = $row.find(".applied_date").val()
      if(sel_date==''){
         $row.find(".applied_date").val(moment().format('DD-MMM-YYYY'))
      }
      if($row.find(".applied_amount").val()==''){
         let hdr_bal_unapplied_amount = Math.abs(parseFloat($("#balance_unapplied_amount").val()))
         let row_bal_due = Math.abs(parseFloat($row.find('.bal_due').text()))
         if(row_bal_due>hdr_bal_unapplied_amount)
            $row.find(".applied_amount").val(hdr_bal_unapplied_amount)
         else
            $row.find(".applied_amount").val(row_bal_due)
      }
      self.refresh_unapplied_amount()
      if($(this).prop('checked') == true && sel_date!=''){
         ShowLoading(["Verifying open period"])
         self.validate_openperiod(sel_date).then(data => {
            HideLoading()
            if(data.status!='success'){
               $row.find(".applied_date").val('')
                  toastr.error(data.message)
            }
         });
      }
   })

   row_counter = 1;
   // $(document).on('click', '.selectInv', function (e) {
   //    var $row = $(this).closest("tr");
   //    var row_data = []
   //    $row.find("td").each(function() {
   //       row_data.push(this.innerText)
   //    });

   //    var rowData = row_data; // Get the data for the clicked row
   //    var columns = self.t3.settings().init().columns;
      
   //    col_info = []
   //    for (var i = 0; i < columns.length; i++) {
   //       var columnName = columns[i].data;
   //       var columnData = rowData[i];
   //       col_info[columnName] = columnData
   //    }
   //    dest_amount = parseFloat(col_info['TOTAL'])
   //    unapplied_amount = parseFloat($("#unapplied_amount").val())
   //    if(Math.abs(unapplied_amount)>dest_amount){
   //       applied_amount = dest_amount;
   //       unapplied_amount = unapplied_amount+dest_amount;
   //       balance_due = 0
   //       $("#unapplied_amount").val(unapplied_amount);
   //    }else{
   //       applied_amount = Math.abs(unapplied_amount)
   //       balance_due = dest_amount - Math.abs(unapplied_amount)
   //       unapplied_amount = 0
   //       $("#unapplied_amount").val(unapplied_amount);
   //    }
      
   //    console.log('col_info---->',col_info)
   //    row_html  = '<tr>\
   //                   <td><input type="text" value="'+col_info['TRX_NUMBER']+'" name="trx_number_'+row_counter+'" readonly></td>\
   //                   <td>1 <input type="hidden" class="counter_number" value="'+row_counter+'"> </td>\
   //                   <td><input type="text" value="'+col_info['TRX_DATE']+'" class="apply_date flat_datepicker" name="apply_date_'+row_counter+'" ></td>\
   //                   <td><input type="text" data-total="'+col_info['TOTAL']+'" value="'+applied_amount+'" class="applied_amount" name="applied_amount_'+row_counter+'"></td>\
   //                   <td>0.00 \
   //                      <input type="hidden" value="'+col_info['CUSTOMER_TRX_ID']+'" name="customer_trx_id_'+row_counter+'">\
   //                      <input type="hidden" value="'+col_info['TRX_DATE']+'" name="trx_date_'+row_counter+'">\
   //                   </td>\
   //                   <td class="bal_due">'+balance_due+' </td>\
   //                   <td>AED<input type="hidden" value="'+col_info['CUST_ACCOUNT_ID']+'" name="cust_account_id_'+row_counter+'"></td>\
   //                   <td><input type="text" value="'+col_info['CUSTOMER_NAME']+'" name="cust_name_'+row_counter+'" readonly ></td>\
   //                   <td><input type="text" value="'+col_info['CUSTOMER_NUMBER']+'" name="cust_number_'+row_counter+'" readonly ></td>\
   //                   <td><input type="text" value="'+col_info['GL_DATE']+'" class="gl_date flat_datepicker" name="gl_date_'+row_counter+'" ></td>\
   //                   <td><a class="btn btn-xs btn-danger inv_del"><i class="right fas fa-times"></i></a></td>\
   //                </tr>';
   //    row_counter++;
   //    $(".opnDiv tr:last").after(row_html);
   //    console.log(col_info);
   //    $('.flat_datepicker').flatpickr({
   //       dateFormat: 'd-M-Y'
   //    });
   //    $('#exampleModalCenter').modal('hide');

   // })

   $(document).on('click', '.inv_del', function (e) {
      $(this).closest('tr').remove()
   })
   $(document).on('click', '#settlement_process', function (e) {
      self.submit_settlement()
   })
   $(document).on('click', '#settlement_validate', function (e) {
      self.validateData()
   })
   //unsettle action
   $('#applied_receipts').on('click', '.unsettle_btn', function (e) {
      let btn_dataset = $(e.target)[0].dataset
      let trx_date = self.get_date_obj(btn_dataset['trx_date'])
      console.log('cm_existing_flag--->',btn_dataset['cm_existing_flag'])
      if(trx_date<self.validation_trx_date  && btn_dataset['unset_type']=='CREDIT_MEMO'  && btn_dataset['cm_existing_flag']=='Y' && btn_dataset['cr_existing_flag']=='Y'){ //
         toastr.error('This CM is based on Advance tax receipt so unsettlement is not allowed.If you want to unsettled then please send your request to Mr. Yusuf Ghadiali with purpose and related documents.')
         return false
      }
      let tr = e.target.closest('tr');
      let row = self.t1.row(tr);
      if($(e).data('status')=='refresh'){
         alert('refresh')
      }else{
         self.unsettle_txn(e,row)
      }
      
   });
  
   $(document).on('click', '.progress_refresh', function (e) {
      request_id = $(this).data('request_id')
      var url = '/receipt/settlement_progress/' + request_id;
      axios.get(url)
         .then(async response => {
            request_data = response.data.progress_response
            for (const [key, value] of Object.entries(request_data)) {
               if(value['status_flag']=='P'){
                  $("#status_"+key).text('SUCCESS')
                  $(e.target).parent().text('SUCCESS')
                  toastr.success('Settlement is processed')
               }else if(value['status_flag']=='E'){
                  $("#status_"+key).text('ERROR - '+value['message'])
                  $(e.target).parent().text('ERROR')
                  toastr.error('Settlement is failed giving error - ',value['message'])
               }else{
                  toastr.warning('Settlement is in progress')
               }
               }
         })
         .catch(e => {
            console.log(e)
         });
   })

   $(document).on('change', '.applied_amount', function (e) {
      total = parseFloat($(this).data('total'))
      console.log('closest--->',$(e.target.closest('tr')))
      balance = parseFloat($(e.target.closest('tr')).find('.bal_due').text())
      cur_amount = $(e.target).val()
      if(cur_amount>balance){
         toastr.error('Applied amount exceeds balance due')
         $(e.target).val(0)
      }
      // bal_due = total - cur_amount
      // $(e.target.closest('tr')).find('td.bal_due').text(bal_due)

      cur_applied_amount = self.refresh_unapplied_amount()
      // if(cur_applied_amount<0){
      //    alert('Cannot overapply the amount')
      //    $(e.target).val(0)
      //    self.refresh_unapplied_amount()
      // }
   });

   $(document).on('click', '#get_txns', function (e) {
         trx_number = $("#get_txns")[0].dataset.trx_number
         cust_id = $("#get_txns")[0].dataset.cust_id
         self.getTransactions(trx_number,cust_id)
   })

   $('#openReceiptFilter').validate({
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
      }
  });
 
  $(document).on('click','#addTransfer',function(event){
      next_sno =  $('#transfer_table tbody tr').length+1;
      $('#transfer_table tbody').append('<tr><td>'+next_sno+'</td>\
                              <td><div class="form-group"><select name="to_rec_level_1" class="form-control to_rec_level" required></form></div></td>\
                              <td><div class="form-group"><input type="number" name="amount_to_be_shared_1"  step="any" class="form-control amount_shared" required></div></td>\
                              <td></td></td>\
                              <td></div></td>\
                              <td></td>\
                              <td></td></tr>');
         level_seq_number = $("#transfer_level_seq").val()
         $('.to_rec_level').select2({
            ajax: {
               url: '/receipt/to_rec_level_lov',
               data: function (params) {
                  var query = {
                     q: params.term,
                     receipt_id: level_seq_number
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
         // formData.append('selected_receipts',selected_receipts)
         receipt_amount_fields = []
         $(".amount_shared").get().forEach(function(entry, index, array) {
            receipt_amount_fields.push(entry.name)
         });
         formData.append('receipt_amount_fields',receipt_amount_fields)
         var url = '/receipt/create_levels_transfer';
         const headers = {
            'X-CSRFTOKEN': csrf_token,
         }
         for (const [key, value] of Object.entries(self.acrData)) {
            formData.append(key,value)
         }
         formData.append('online_receipt',true)
         ShowLoading([
            "Initiated Across Level Transfer"
         ])

        console.log('formData---/',formData)
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

   $(document).on('click','.alt_refresh',function(event){
      self.refresh_line_data(event)
   }); 

   $(document).on('input','.amount_shared',function(e){
      var sum = 0;
      $(".applied_amt").each(function(){
         sum += parseFloat($(this).text());
      });
      unapplied_amount = ($("#transfer_receipt_unapplied_amount").text())
      cur_value = parseFloat(this.value)
      console.log(cur_value +'>'+ unapplied_amount)
      console.log(cur_value > unapplied_amount)
      if(cur_value > unapplied_amount ){
         $(this).val('')
         toastr.error('Amount to share should not be greater than unapplied amount')
      }
   })
   

}


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
   },
   initializeReceiptTable(filter_data){
         let columns = [{ data: 'transaction_number' },
                     { data: 'receipt_method'},
                     { data: 'transaction_number' },
                     { data: 'receipt_amount' },
                     { data: 'applied_amount' },
                     { data: 'unapplied_amount' },
                     { data: 'receipt_type' },
                     { data: 'transaction_date' },
                     { data: 'GL_date' },
                     { data: 'customer_number' },
                     { data: 'customer_name' },
                     { data: 'document_number' },
                     { data: 'level_name' },
                     { data: 'settlement_status' },
                     {data : 'customer_trx_id' }]
                     // console.log('thead html--->',self.buildTheadTfoot(columns,'filters'))
                     $('#receipts thead').append(self.buildTheadTfoot(columns,'filters'))
         self = this
            const headers = {
               'Content-Type': 'application/json',
               "X-CSRFToken": csrf_token
            }
            ShowLoading([
               'Fetching open receipts'
            ])
         axios.post("/receipt/get_unapplied_receipts", filter_data, {
                  headers: headers
               })
            .then(async response => {
               HideLoading()
               request_data = response.data['data']
               // console.log('request_data---->',request_data)
               self.t1 = new DataTable('#receipts', {
                        data: request_data,
                        columns: columns,
                        columnDefs: [
                           {
                              targets: [0],
                              // className: 'dt-control',
                              orderable: false,
                              data: null,
                              defaultContent: '',
                              render: function (data, type, row, meta) {
                                 const row_id = data[Object.keys(data)[0]]
                                 actionCellHtml = self.action_dropdown(data,row_id)
                                 return actionCellHtml;
                              },
                           },
                           {
                              targets: [7,8],
                              orderable: false,
                              data: null,
                              defaultContent: '',
                              render: function (data, type, row, meta) {
                                 return (
                                    moment(data).format('DD-MMM-YYYY')
                                 );
                              },
                           },
                           { 
                              'searchable'    : true, 
                              'targets'       : [2,4,8,9] 
                           },
                        ],
                        searching: true,
                        // processing: true,
                        //serverSide: true,
                        destroy: true, 
                        bPaginate: true,
                        pageLength: 50,
                        initComplete: function () {
                           var api = this.api();
                           // For each column
                           api
                              .columns()
                              .eq(0)
                              .each(function (colIdx) {
                                    if(colIdx==0)
                                       return false
                                 // Set the header cell to contain the input element
                                 var cell = $('.filters th').eq(
                                       $(api.column(colIdx).header()).index()
                                 );
                                 var title = $(cell).text();
                                 title = 'Search'
                                 $(cell).html('<input type="text" placeholder="' + title + '" />');
                                    
                                 // On every keypress in this input
                                 $(
                                       'input',
                                       $('.filters th').eq($(api.column(colIdx).header()).index())
                                 )
                                       .off('keyup change')
                                       .on('change', function (e) {
                                          // Get the search value
                                          $(this).attr('title', $(this).val());
                                          var regexr = '({search})'; //$(this).parents('th').find('select').val();
               
                                          var cursorPosition = this.selectionStart;
                                          // Search the column for that value
                                          api
                                             .column(colIdx)
                                             .search(
                                                   this.value != ''
                                                      ? regexr.replace('{search}', '(((' + this.value + ')))')
                                                      : '',
                                                   this.value != '',
                                                   this.value == ''
                                             )
                                             .draw();
                                       })
                                       .on('keyup', function (e) {
                                          e.stopPropagation();
               
                                          $(this).trigger('change');
                                          // $(this)
                                          //    .focus()[0]
                                          //    .setSelectionRange(cursorPosition, cursorPosition);
                                       });
                              });

                           
                     }
                  });

            })
            .catch(e => {
               HideLoading()
               toastr.error('Error fetching receipts')
               console.log(e)
            });
         
   },
   initializeCreditMemoReceiptTable(filter_data){
      let columns = [
                     { data: 'transaction_number' },
                     { data: 'level_name'},
                     { data: 'customer_name' },
                     { data: 'customer_number' },
                     { data: 'receipt_type' },
                     { data: 'transaction_number' },
                     { data: 'transaction_date' },
                     { data: 'GL_date' },
                     { data: 'settlement_status' },
                     { data: 'unapplied_amount' },
                     {data : 'customer_trx_id' },
                     {data : 'cm_ccid_segment4'}
                  ]
                     // console.log('thead html--->',self.buildTheadTfoot(columns,'filters'))
                     $('#credit_memo_tbl thead').append(self.buildTheadTfoot(columns,'filters'))
         self = this
            const headers = {
               'Content-Type': 'application/json',
               "X-CSRFToken": csrf_token
            }
            ShowLoading([
               'Fetching open credit memos'
            ])
         axios.post("/receipt/get_unapplied_receipts", filter_data, {
                  headers: headers
               })
            .then(async response => {
               HideLoading()
               request_data = response.data['data']
               
               self.t2 = new DataTable('#credit_memo_tbl', {
                  data:request_data,
                  columns: columns,
                  columnDefs: [
                     {
                        targets: [0],
                        // className: 'dt-control',
                        orderable: false,
                        data: null,
                        defaultContent: '',
                        render: function (data, type, row, meta) {
                           const row_id = data[Object.keys(data)[0]]
                           actionCellHtml = self.action_dropdown(data,row_id)
                           return actionCellHtml;
                        },
                     },
                     {
                        targets: [6,7],
                        orderable: false,
                        data: null,
                        defaultContent: '',
                        render: function (data, type, row, meta) {
                           return (
                              moment(data).format('DD-MMM-YYYY')
                           );
                           },
                     }
                     ],
                  //processing: true,
                  //serverSide: true,
                  destroy: true, 
                  bPaginate: false,
                  initComplete: function () {
                     var api = this.api();
                     // For each column
                     api
                        .columns()
                        .eq(0)
                        .each(function (colIdx) {
                              if(colIdx==0)
                                 return false
                           // Set the header cell to contain the input element
                           var cell = $('.filters th').eq(
                                 $(api.column(colIdx).header()).index()
                           );
                           var title = $(cell).text();
                           title = 'Search'
                           $(cell).html('<input type="text" placeholder="' + title + '" />');
                              
                           // On every keypress in this input
                           $(
                                 'input',
                                 $('.filters th').eq($(api.column(colIdx).header()).index())
                           )
                                 .off('keyup change')
                                 .on('change', function (e) {
                                    // Get the search value
                                    $(this).attr('title', $(this).val());
                                    var regexr = '({search})'; //$(this).parents('th').find('select').val();
         
                                    var cursorPosition = this.selectionStart;
                                    // Search the column for that value
                                    api
                                       .column(colIdx)
                                       .search(
                                             this.value != ''
                                                ? regexr.replace('{search}', '(((' + this.value + ')))')
                                                : '',
                                             this.value != '',
                                             this.value == ''
                                       )
                                       .draw();
                                 })
                                 .on('keyup', function (e) {
                                    e.stopPropagation();
         
                                    $(this).trigger('change');
                                    // $(this)
                                    //    .focus()[0]
                                    //    .setSelectionRange(cursorPosition, cursorPosition);
                                 });
                        });

                     
                     }
            });
            })
            .catch(e => {
               HideLoading()
               toastr.error('Error fetching receipts')
               console.log(e)
            });
      self = this
      
            
   },
   onFind(){

      
      if ($("#openReceiptFilter").valid()) {
      self = this
      let filter_data = $('#openReceiptFilter').serializeArray().reduce((function (acc, val) {
         field_name = val.name
         acc[field_name] = val.value;
         return acc
      }), {});
      filter_data['type']= self.checkedType
      filter_data['level_id'] = $("#level_name").val()
      console.log('formData---->',filter_data)
      $('#receipts').DataTable().clear().destroy();
      $('#credit_memo_tbl').DataTable().clear().destroy();
      if(self.checkedType=='unapp'){
         self.initializeReceiptTable(filter_data)
      }else{
         self.initializeCreditMemoReceiptTable(filter_data)
      }
      
      } else {
         return false
      }
   },
   initializeCustSearch(){
      self = this
      $('#customer_id').select2({
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
                     org_id: org_id
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
   },
   get_open_receipts(receipt_number){
      //alert('receipt_number------>',receipt_number)
   },
   get_row_details(e,row,settle_type=null){
      //var clickedDT = $($(e).closest('tr')).closest('table').DataTable();
      var rowData= row.data();
      var tr = $(e).closest('tr');
      console.log('tr---->',tr)
      // var row = clickedDT.row( tr );
      var tdi = tr.find("i.mdi");
      var tid = rowData.transaction_number//(rowData.rownum)
      var unapplied_amount = rowData.unapplied_amount
      
      txn_date = new Date(rowData.transaction_date)
      gl_date = new Date(rowData.GL_date)
      
      self.source_details = {
         "Source_Customer_id": rowData.customer_id.toString().replace(/"/g, ''),
         "Source_cust_number":rowData.customer_number.toString().replace(/"/g, ''),
         "Source_customer_name":rowData.customer_name.toString().replace(/"/g, ''),
         "Source_customer_name":rowData.customer_name.toString().replace(/"/g, ''),
         "Source_Type":rowData.type.toString().replace(/"/g, ''),
         "Source_trx_id":rowData.customer_trx_id.toString().replace(/"/g, ''),
         "Source_Trx_Number":rowData.transaction_number.toString().replace(/"/g, ''),
         "Source_unapplied_amount":unapplied_amount.toString().replace(/"/g, ''),
         "Source_transaction_date": moment(txn_date ).format('DD-MMM-YYYY').toString().replace(/"/g, ''),
         "Source_gl_date":moment(gl_date ).format('DD-MMM-YYYY').toString().replace(/"/g, ''),
         "Source_segment_4":rowData.cm_ccid_segment4.toString().replace(/"/g, ''),
         "Source_txn_type" : settle_type
      }

   },
   destroyDT(selector){
      if ($.fn.dataTable.isDataTable(selector)){
            $(selector).DataTable().destroy();
            $(selector)[0].innerHTML = '';
      }
   },
   async validate_openperiod(give_date){
      url = '/receipt/validate_openperiod/'+give_date
      return axios.get('/receipt/validate_openperiod/'+give_date).then(response => response.data)
   },
   initInvTabl(level_name,customer_id,inv_data=null){
   
   filter_data = {"level_name":level_name,"customer_id":customer_id,"inv_data":inv_data}
   self.destroyDT("#openInvTable");
   
   search_arr = self.source_details['Source_txn_type']=='refund' ? {'search':'REFUND'} : {search:'^[0-9]',regex:true}
   // console.log('search_str--->',search_str)
   self.t3 = $("#openInvTable").DataTable({
      ajax: {
         headers: {'X-CSRFToken': csrf_token},
         url: '/receipt/get_open_invoices',
         "contentType": "application/json",
         "data": function (d) {
            return JSON.stringify(filter_data);
            },
         type: 'POST',
      },
      scrollX: true,
      scrollCollapse: true,
      scroller: true,
      //responsive: true,
      bFilter: false,
      searching: true,
      bPaginate:false,
      columns: [
         { sTitle:'Select',data: 'LEVEL_NAME' },
         { sTitle:'Applied Amount',data: 'TRX_NUMBER' },
         { sTitle:'Appy Date',data: 'TRX_NUMBER' },
         { sTitle:'Number',data: 'TRX_NUMBER' ,  'sSearch': null },
         { sTitle:'Class',data: 'CLASS' },
         { sTitle:'Cur',data: 'CURRENCY' },
         { sTitle:'Balance Due',data: 'UNAPPLIED_AMOUNT' },
         { sTitle:'Due Date',data: 'DUE_DATE' },
         { sTitle:'Customer Number',data: 'CUSTOMER_NUMBER' },
         { sTitle:'Customer Name',data: 'CUSTOMER_NAME' },
         { sTitle:'Account Desc',data: 'CUSTOMER_NAME' },
         { sTitle:'Amnt Due Orginal',data: 'TOTAL' },
         { sTitle:'Balance Due Functional',data: 'UNAPPLIED_AMOUNT' }, 
         { sTitle:'Level Name',data: 'LEVEL_NAME' },
         { sTitle:'TYPE',data: 'TYPE' },
         { sTitle:'Trx Date',data: 'TRX_DATE' },
         { sTitle:'GL Date',data: 'GL_DATE' },
         { sTitle:'DRS Category',data: 'DRS_CATEGORY' },
         { sTitle:'Cust ACCOUNT ID',data: 'CUST_ACCOUNT_ID' },
         { sTitle:'Cust TRX ID',data: 'CUSTOMER_TRX_ID' },
         { sTitle:'Org Id',data: 'ORG_ID' },
         { sTitle:'Level Id',data: 'RECEIVABLE_LEVEL'},
         { sTitle:'Segment 4',data: 'CCID_SEGMENT4'},
      ],
      'searchCols': [
         null,
         null,
         null,        
         search_arr,
         null,
         null,
         null,
         // {search:'Invalid date'}
       ],
      drawCallback:function(){
         // console.log(this); 
         // $(this.api().table().node()).css('width','')
      },
      initComplete:function(){
         self.refresh_unapplied_amount()

         self.t3.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            var data = this.data();
            $(this.node()).find('.applied_date').flatpickr({
               dateFormat: 'd-M-Y',
               minDate:moment(data.TRX_DATE).format('DD-MMM-YYYY'),
               onClose: function(selectedDates, dateStr, instance) {
                  if(dateStr==''){return false}
                  ShowLoading(["Verifying open period"])
                  self.validate_openperiod(dateStr).then(data => {
                     HideLoading()
                     if(data.status!='success'){
                           $(instance.input).val('')
                           toastr.error(data.message)
                        }
                  });
               },
            });

            if($(this.node()).find('.selectInv2').prop('checked')==true){
                  data.TRX_DATE = moment(data.TRX_DATE).format('DD-MMM-YYYY')
                  data.GL_DATE = moment(data.GL_DATE).format('DD-MMM-YYYY')
                  console.log('data---->',data)
                  self.open_inv_data[rowIdx+1] = data
                  
            }
         });
      },
      columnDefs:[
         {
            targets: [0],
            orderable: false,
            data: null,
            defaultContent: '',
            render: function (data, type, row, meta) {
               is_checked = (row.inv_number!=undefined&&row.CUSTOMER_NUMBER!= '') ? 'checked' : ''
               
               if(is_checked=='' && row.CUSTOMER_NUMBER== ''){
                  warning_str =  '<button  type="button" class="btn btn-outline-danger btn-xs pr-1 pl-1 " v-show="obj.line_error" data-toggle="popover" title="'+row.warning+'" ><i class="right fas fa-exclamation-triangle"></i></button>'
                  return ('<b style="color: red;"> INVALID </b>'+warning_str)
               }
               rowIndex = meta.row+1

               warning_str = ''
               if (row.inv_number!=undefined&&row.warning!=undefined&row.warning!=''){
                     is_checked = ''
                     warning_str =  '<button  type="button" class="btn btn-outline-danger btn-xs pr-1 pl-1 float-right" v-show="obj.line_error" data-toggle="popover" title="'+row.warning+'" ><i class="right fas fa-exclamation-triangle"></i></button>'
               }
                     
               return_str = '<input type="checkbox" name="open_inv" class="selectInv2" '+is_checked+'>'
               return_str += warning_str
               return (
                  return_str
               );
            },
         },
         {
            targets: [1],
            orderable: false,
            data: null,
            defaultContent: '',
            render: function (data, type, row, meta) {
               ap_amount = row.ap_amount!=undefined ? row.ap_amount : ''
               return (
               '<input type="number" step="any" name="applied_amount" style="width:100px" class="applied_amount" value="'+ap_amount+'">'
               );
            },
         },
         {
            targets: [2],
            orderable: false,
            data: null,
            defaultContent: '',
            render: function (data, type, row, meta) {
               ap_date = row.ap_date!=undefined ? row.ap_date : ''
               return (
               '<input type="text" name="applied_date" class="applied_date date_picker" style="width:100px" value="'+ap_date+'">'
               );
            },
         },
         {
            targets: [3],
            orderable: false,
            data: null,
            defaultContent: '',
            render: function (data, type, row, meta) {
               if(row.TYPE=='REFUND')
                  return ('REFUND');
               else
                  return data
            },
         },
         {
            targets: [2,7,15,16],
            orderable: false,
            data: null,
            defaultContent: '',
            render: function (data, type, row, meta) {
               return (
                  data!=null ? moment(data).format('DD-MMM-YYYY') : ''
               );
               },
         },
         {  
            targets: [ 6 ] ,
            className: "bal_due",
         }
      ],
      "createdRow": function( row, data, dataIndex){
            if( data[0] =  'INVALID'){
               $(row).addClass('red');
            }
      },
      "order": []
   });

   setTimeout(function(scope) { 
         $($.fn.dataTable.tables(true)).DataTable()
            .columns.adjust();
   }, 50);
   
   },
   submit_settlement(){
      self = this
      applied_total_amount = $("#applied_total_amount").val()
      unapplied_amount = Math.abs(parseFloat($("#unapplied_amount").val()))
      if(applied_total_amount>unapplied_amount){
         alert('Total applied amount greater than unapplied amount')
         return false
      }
      let formData = new FormData();    
      //let formData = {}
      formData.append('action','APP');
      formData.append('type','Invoice');
      formData.append('RECEIVABLE_APPLICATION_ID','');
      if(Object.keys(self.open_inv_data).length==0){
         alert('Please select at least one record')
         return false
      }
      counter_num = []
      error_flag = false
      Object.entries(self.open_inv_data).forEach(entry => {
         const [key, value] = entry;
         rowData = value
         counter = key
         formData.append("cust_account_id_"+counter,rowData.CUST_ACCOUNT_ID);
         formData.append("cust_number_"+counter,rowData.CUSTOMER_NUMBER);
         formData.append("cust_name_"+counter,rowData.CUSTOMER_NAME);
         formData.append("customer_trx_id_"+counter,rowData.CUSTOMER_TRX_ID);
         formData.append("applied_amount_"+counter,rowData.AMOUNT_APPLIED);
         formData.append("gl_date_"+counter,rowData.GL_DATE);
         formData.append("trx_date_"+counter, rowData.TRX_DATE);
         formData.append("trx_number_"+counter,rowData.TRX_NUMBER);
         formData.append("trx_amount_"+counter,rowData.TOTAL);

         applied_amount = $( "#openInvTable tr:eq("+key+")").find('.applied_amount').val()
         apply_date = $( "#openInvTable tr:eq("+key+")").find('.applied_date').val()
         if(applied_amount=='' || apply_date==''){
            if(error_flag==false)
               alert('Please fill apply date and amount for all the selected transactions')
            error_flag = true
            return false
         }
         formData.append( "applied_amount_"+counter, applied_amount);
         formData.append( "apply_date_"+counter, apply_date);
         counter_num.push(counter)
      })
      if(error_flag==true)
         return true
      Object.entries(self.source_details).forEach(entry => {
         const [key, value] = entry;
         formData.append(key, value );
      })

      
      formData.append('counter_number',counter_num.join(','));

      console.log('formData--->',formData)
      self.save_settlement(formData)

   },
   save_settlement(formData,type="A",elm=null){
      loading_message = (type=='A') ? 'Processing settlement' : 'Processing Unsettlment'
         ShowLoading([
            loading_message
         ])
      $('#settlement_process').prop("disabled",true);
      axios.post('/receipt/save_settlement', formData, {
            headers: {
               'X-CSRFTOKEN': csrf_token,
               'Content-Type': 'application/json'
            },
      })
      .then(response => {
            console.log(response.data)
            data = response.data
            if(data.status=='success'){
               $('#settlement_process').prop("disabled",true);
               toastr.success(response.data.message)
               let opened_tr = $(".dt-hasChild");
               let opened_row = self.checkedType=='unapp' ? self.t1.row(opened_tr) : self.t2.row(opened_tr);
               if (opened_row.child.isShown()){
                     opened_row.child.hide();
                  }
               console.log('type---->',type)
               if(type=="U"){
                  elm.text('Refresh')
                  elm.attr("data-status", "refresh");
                  elm.attr("data-request_id", data.batch_id);
                  elm.removeClass('unsettle_btn')
                  elm.addClass('progress_refresh')
               }
            }else if(data.status == 'error'){
               $('#settlement_process').prop("disabled",false);
               toastr.error(response.data.message)
            }
            HideLoading()

      })
      .catch(e => {
            HideLoading()
            $('#settlement_process').prop("disabled",false);
            console.log(e)
            toastr.error(e.response.data)
            
      });
   },
   initializeAppliedReceiptTable(filter_data){
      let columns = [
                     { data: 'RECEIPT_ID' },
                     { data: 'RECEIPT_ID'},
                     { data: 'RECEIPT_CM_TYPE' },
                     { data: 'RECEIPT_NUMBER' },
                     { data: 'RECEIPT_DATE' },
                     { data: 'RECEIPT_METHOD' },
                     { data: 'RECEIVABLE_LEVEL' },
                     { data: 'RECEIPT_CUSTOMER_NUMBER' },
                     { data: 'RECEIPT_CUSTOMER_NAME' },
                     { data: 'AMOUNT_APPLIED' },
                     { data: 'TRX_NUMBER' },
                     { data: 'TRX_DATE' },
                     { data: 'GL_DATE' },
                     { data: 'INVOICE_CUSTOMER_NUMBER' },
                     { data: 'INVOICE_CUSTOMER_NAME' },
                     { data: 'RECEIVABLE_APPLICATION_ID' },
                     { data: 'CREATED_BY' },
                     { data: 'APPLY_DATE' },
                     { data: 'ACTIVITY_DATE' },
                     { data: 'OPERATING_UNIT' },
                     { data: 'TRX_TYPE' },
                     { data: 'RECEIPT_ID'},
                     { data: 'RECEIPT_CUST_ACCOUNT_ID' },
                     { data: 'CUSTOMER_TRX_ID' },
                     { data: 'INVOICE_CUST_ACCOUNT_ID' },
                     { data: 'CM_EXISTS_FLAG','visible' : false },
                     { data: 'CR_EXISTS_FLAG' ,'visible' : false},
                  ]
         // console.log('thead html--->',self.buildTheadTfoot(columns,'filters'))
         $('#applied_receipts thead').append(self.buildTheadTfoot(columns,'filters'))
         self = this
         const headers = {
            'Content-Type': 'application/json',
            "X-CSRFToken": csrf_token
         }
         ShowLoading([
            'Fetching open receipts'
         ])
         axios.post("/receipt/get_applied_receipts", filter_data, {
                  headers: headers
               })
            .then(async response => {
               HideLoading()
               request_data = response.data['data']
               // console.log('request_data---->',request_data)
               self.t1 = new DataTable('#applied_receipts', {
                        data: request_data,
                        columns: columns,
                        columnDefs: [
                           {
                            targets: [0],
                            orderable: false,
                            data: null,
                            defaultContent: '',
                            render: function (data, type, row, meta) {
                               return (
                                 '<a class="unsettle_btn btn btn-info btn btn-sm" >Unsettle </a>'
                               );
                            },
                         },
                         {
                            targets: [1],
                            orderable: false,
                            data: null,
                            defaultContent: '',
                            render: function (data, type, row, meta) {
                               return (
                               '<input type="text" name="apply_date" class="apply_date  date_picker">'
                               );
                            },
                         },
                        ],
                        "createdRow": function (row, data, rowIndex) {
                             var elm = $(row).find('td:first a')
                              Object.assign(elm[0].dataset,{'status':'unsettle','unset_type':data['RECEIPT_CM_TYPE'],'cm_existing_flag':data['CM_EXISTS_FLAG'],'cr_existing_flag':data['CR_EXISTS_FLAG'],'trx_date':data['TRX_DATE']});
                        },
                        searching: true,
                        // processing: true,
                        //serverSide: true,
                        destroy: true, 
                        bPaginate: true,
                        pageLength: 50,
                        initComplete: function () {

                           setTimeout(function(scope) { 
                              self.t1.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
                                 var data = this.data();
                                 $(this.node()).find('.apply_date').flatpickr({
                                    dateFormat: 'd-M-Y',
                                    minDate:data.TRX_DATE,
                                    onClose: function(selectedDates, dateStr, instance) {
                                       if(dateStr==''){return false}
                                       ShowLoading(["Verifying open period"])
                                       self.validate_openperiod(dateStr).then(data => {
                                          HideLoading()
                                          if(data.status!='success'){
                                                $(instance.input).val('')
                                                toastr.error(data.message)
                                             }
                                       });
                                    },
                                 });
                              });
                           }, 100);
                           var api = this.api();
                           // For each column
                           api
                              .columns()
                              .eq(0)
                              .each(function (colIdx) {
                                    if(colIdx==0 || colIdx==1)
                                       return false
                                 // Set the header cell to contain the input element
                                 var cell = $('.filters th').eq(
                                       $(api.column(colIdx).header()).index()
                                 );
                                 var title = $(cell).text();
                                 title = 'Search'
                                 $(cell).html('<input type="text" placeholder="' + title + '" />');
                                    
                                 // On every keypress in this input
                                 $(
                                       'input',
                                       $('.filters th').eq($(api.column(colIdx).header()).index())
                                 )
                                       .off('keyup change')
                                       .on('change', function (e) {
                                          // Get the search value
                                          $(this).attr('title', $(this).val());
                                          var regexr = '({search})'; //$(this).parents('th').find('select').val();
               
                                          var cursorPosition = this.selectionStart;
                                          // Search the column for that value
                                          api
                                             .column(colIdx)
                                             .search(
                                                   this.value != ''
                                                      ? regexr.replace('{search}', '(((' + this.value + ')))')
                                                      : '',
                                                   this.value != '',
                                                   this.value == ''
                                             )
                                             .draw();
                                       })
                                       .on('keyup', function (e) {
                                          e.stopPropagation();
               
                                          $(this).trigger('change');
                                          // $(this)
                                          //    .focus()[0]
                                          //    .setSelectionRange(cursorPosition, cursorPosition);
                                       });
                              });

                           
                     }
                  });

            })
            .catch(e => {
               HideLoading()
               toastr.error('Error fetching receipts')
               console.log(e)
            });
      
                        
      
            
   },
   findSettled(){
      if ($("#openReceiptFilter").valid()) {
         self = this
         let filter_data = $('#openReceiptFilter').serializeArray().reduce((function (acc, val) {
            field_name = val.name
            acc[field_name] = val.value;
            return acc
         }), {});
         filter_data['level_id'] = $("#level_name").val()
         console.log('formData---->',filter_data)
         $('#applied_receipts').DataTable().clear().destroy();
         self.initializeAppliedReceiptTable(filter_data)
      }
   },
   unsettle_txn(e,row){
      var rowData= row.data();
      var apply_date = $(e.target).closest('tr').find('.apply_date').val()
      if(apply_date==''){
         $(e.target).closest('tr').find('.apply_date').parent('td').append('<span id="apply_date-error" class="error text-danger">This field is required.</span>')
         return false
      }
      var fd = new FormData();    
      fd.append('counter_number',1);
      fd.append('action','UNAPP');
      fd.append('type','Invoice');

      unsettle_details = {
         "Source_Customer_id": rowData.RECEIPT_CUST_ACCOUNT_ID,
         "Source_cust_number":rowData.RECEIPT_CUSTOMER_NUMBER,
         "Source_customer_name":rowData.RECEIPT_CUSTOMER_NAME,
         "Source_Type":rowData.RECEIPT_CM_TYPE,
         "Source_trx_id": rowData.RECEIPT_ID,
         "Source_Trx_Number":rowData.RECEIPT_NUMBER,
         "Source_unapplied_amount":rowData.AMOUNT_APPLIED,
         "Source_transaction_date":rowData.RECEIPT_DATE,
         "Source_gl_date": '',
         "cust_account_id_1": rowData.INVOICE_CUST_ACCOUNT_ID,
         "cust_number_1": rowData.INVOICE_CUSTOMER_NUMBER,
         "cust_name_1": rowData.INVOICE_CUSTOMER_NAME,
         "customer_trx_id_1": rowData.CUSTOMER_TRX_ID,
         "applied_amount_1": rowData.AMOUNT_APPLIED,
         "RECEIVABLE_APPLICATION_ID" : rowData.RECEIVABLE_APPLICATION_ID,
         "gl_date_1": rowData.GL_DATE,
         "trx_date_1": rowData.TRX_DATE,
         "trx_number_1": rowData.TRX_NUMBER,
         "apply_date_1": apply_date,
         "trx_amount_1": rowData.AMOUNT_APPLIED,
      }
      
      Object.entries(unsettle_details).forEach(entry => {
         const [key, value] = entry;
         fd.append(key, value );
      })
      self.save_settlement(fd,type='U',elm=$(e.target))
      
      return false;

   },
   check_type(){
      
      setTimeout(function(scope) { 
         $('.date_picker').flatpickr({
            dateFormat: 'd-M-Y',
            //  defaultDate: "today"
      });
   }, 10);
   },
   refresh_unapplied_amount(){
      orginal_unapplied  = parseFloat($("#unapplied_amount")[0].dataset.original)
      // orginal_unapplied_postve = Math.abs(orginal_unapplied)
      var applied_total = 0;
      $(".applied_amount").each(function() {
            if($(this).val()!='' && $(this).closest('tr').find('.selectInv2').prop('checked')==true )
               applied_total += parseFloat($(this).val());
      });
      $("#applied_total_amount").val(applied_total)
      if(Math.sign(orginal_unapplied)==-1)
         $("#balance_unapplied_amount").val(parseFloat((orginal_unapplied+applied_total).toFixed(2)))
      else
         $("#balance_unapplied_amount").val(parseFloat((orginal_unapplied-applied_total).toFixed(2)))
      
      // cur_applied_amount =  orginal_unapplied - applied_total
      // $("#unapplied_amount").val(cur_applied_amount)
      // return cur_applied_amount
   },
   getTransactions(transaction_number,customer_trx_id){
         $("#txn_history > tbody").html("");
         var post_data = new FormData();    
         post_data.append('source_trx_number',transaction_number);
         post_data.append('source_trx_id',customer_trx_id);
         const headers = {
            'Content-Type': 'application/json',
            "X-CSRFToken": csrf_token
         }
         axios.post("/receipt/get_existing_transactions", post_data, {
            headers: headers
         })
         .then((response) => {
            tr_data = response.data.data
            
            for (let i = 0; i < tr_data.length; i++) {
               console.log('tr_data--->',tr_data[i])
               newRowContent = '<tr>\
                              <td>'+tr_data[i].dest_trx_number+'</td>\
                              <td>'+moment(tr_data[i].apply_date).format('DD-MMM-YYYY')+'</td>\
                              <td>'+tr_data[i].trx_amount+'</td>\
                              <td>'+tr_data[i].source_customer_name+'</td>\
                              <td>'+tr_data[i].source_cust_number+'</td>\
                              <td>'+ (tr_data[i].gl_date!=null ? moment(tr_data[i].gl_date).format('DD-MMM-YYYY'):null) +'</td>';
               
               if(tr_data[i].status_flag=='SUCCESS') 
                  newRowContent += '<td>PROCESSED</td>'
               else if(tr_data[i].status_flag=='ERROR') 
                  newRowContent += '<td>ERROR - '+ tr_data[i].status_message + '</td>'
               else
                  newRowContent += '<td id="status_'+tr_data[i].unique_seq_id+'"><a class="btn btn-info btn btn-sm progress_refresh" data-request_id="'+tr_data[i].request_id+'"> Refresh </a></td>'
               newRowContent += ' <tr/>';
               $("#txn_history tbody").append(newRowContent);
               }
         })
         .catch((error) => {
            
         })
   },
   
   get_txns(status){
      $(".tab-pane.fade").removeClass('active show')
      $(".txn_div").addClass('active show')
      action_type = set_action;
      filter_data = {'status':status,'action_type':action_type}

      let columns = [
         { data: 'status_flag' },
         { data: 'status_message'},
         { data: 'source_type' },
         { data: 'source_trx_number' },
         { data: 'source_trx_date' },
         { data: 'source_cust_number' },
         { data: 'source_customer_name' },
         { data: 'trx_amount' },
         { data: 'apply_date' },
         {data : 'gl_date' },
         {data : 'dest_trx_number' },
         {data : 'dest_cust_number' },
         {data : 'dest_customer_name' },
         {data : 'request_id' },
         {data : 'application_id' }
      ]
      $('#applied_txns thead').append(self.buildTheadTfoot(columns,'filters'))
      d_tbl = new DataTable('#applied_txns', {
                  ajax: {
                     url: '/receipt/api/receivable_application_list/?format=datatables',
                     "contentType": "application/json",
                     "data": function (d) {
                        return $.extend(d, filter_data);
                        },
                  },
                  columns: columns,
                  columnDefs: [
                     {
                        targets: [0],
                        data: null,
                        render: function (data, type, row, meta) {
                           console.log('data--->',)
                           newRowContent = ''
                           if(row['status_flag']=='SUCCESS') 
                              newRowContent += 'PROCESSED'
                           else
                              newRowContent += '<a class="btn btn-info btn btn-sm progress_refresh" data-request_id="'+row['request_id']+'"> Refresh </a>'
                           
                           return (
                              newRowContent
                           );
                        },
                     },
                     {
                        targets: [4,8,9],
                        orderable: false,
                        data: null,
                        defaultContent: '',
                        render: function (data, type, row, meta) {
                           return (
                              data!=null ? moment(data).format('DD-MMM-YYYY') : ''
                           );
                           },
                     }
                     ],
                  processing: true,
                  language: {
                     processing: "Fetching Transactions..."
                   },
                  serverSide: true,
                  destroy: true, 
                  order: [[13, 'desc']],
                  initComplete: function () {
                        var api = this.api();
                        // For each column
                        api
                           .columns()
                           .eq(0)
                           .each(function (colIdx) {
                                 if(colIdx==0)
                                    return false
                              // Set the header cell to contain the input element
                              var cell = $('.filters th').eq(
                                    $(api.column(colIdx).header()).index()
                              );
                              var title = $(cell).text();
                              title = 'Search'
                              $(cell).html('<input type="text" placeholder="' + title + '" />');
                                 
                                 $('input',$('.filters th').eq($(api.column(colIdx).header()).index()))
                                    .off('keyup')
                                    .on('keyup', function (e) {
                                       console.log('e.key====>',$.key)
                                       if (e.key === 'Enter') {
                                          $(this).attr('title', $(this).val());
                                          var regexr = '({search})'; //$(this).parents('th').find('select').val();
                                          
                                          var cursorPosition = this.selectionStart;
                                          // Search the column for that value
                                          api
                                             .column(colIdx)
                                             .search(
                                                   this.value != ''
                                                      ? regexr.replace('{search}', '(((' + this.value + ')))')
                                                      : '',
                                                   this.value != '',
                                                   this.value == ''
                                             )
                                             .draw();
                                       }
                                    });
                                    // .on('keyup', function (e) {
                                    //    e.stopPropagation();
                                    //    $(this).trigger('change');
                                    // });
                           });

                        
                  }
                  // bPaginate: false
            });

      // $('#applied_txns .filters input').on('keyup', function(event) {
      //    if (event.key === 'Enter') {
      //       var columnIndex = $(this).closest('th').index();
      //       d_tbl.column(columnIndex).search(this.value).draw();
      //    }
      // });

      
   },
   buildTheadTfoot(d,className){
      $("."+className).remove()
      var html = ''
      //html += '<tfoot style="display: table-header-group;"><tr>';
      html = '<tr class="'+className+'">';
      d.forEach(function(e, i){
              //html += '<th>'+e.title+'</th>';
              //console.log('e.title--->',e.title)
              html += '<th data-column='+e.data+'></th>';
              return;
      });
      return html + '</tr>';
  
  },
  get_date_obj(datestr){
      return moment(datestr).utc()
  },
  create_across_lines(lines){
      for (var i=0;i<lines.length;i++){
         initiate_date = moment(lines[i]['initiated_date']).format('DD-MMM-YYYY') 
         s_no = i+1
         refreshBtn = ''
         if(lines[i]['level_line_status__code']=='TRANSFER_INITIATED')
            refreshBtn = '<br><a class="btn-primary btn-sm alt_refresh" data-id='+lines[i]['line_id']+' > Refresh </a>'
         $('#transfer_table tbody').append('<tr><td>'+s_no+'</td>\
                                          <td>'+lines[i]['to_rec_level']+'</td>\
                                          <td class="applied_amt">'+lines[i]['amt_to_share']+'</td>\
                                          <td class="txn_date">'+initiate_date+'</td>\
                                          <td class="dm_trx">'+lines[i]['source_reference']+'</td>\
                                          <td class="cm_trx">'+lines[i]['dest_reference']+'</td>\
                                          <td class="line_status">'+lines[i]['level_line_status__meaning']+'&nbsp;'+refreshBtn+'</td>\
                                       </tr>');
      }
   },
   across_ledger_transfer(cash_receipt_id,rowData){
      
      $("#transfer_receipt_id").val(cash_receipt_id)
      $("#transfer_cust_name").text(rowData.customer_name)
      $("#transfer_receipt_method").text(rowData.receipt_method)
      $("#transfer_receipt_number").text(rowData.transaction_number)
      $("#transfer_receipt_amount").text(rowData.receipt_amount)
      $("#transfer_receipt_unapplied_amount").text(rowData.unapplied_amount)
      $("#transfer_level_seq").val(rowData.receivable_level)
      self.acrData = {"cash_receipt_id": rowData.customer_trx_id, "level_name": rowData.level_name,"receivable_level_seq":rowData.receivable_level,
                        "cust_account_id":rowData.customer_id,"customer_number":rowData.customer_number,"customer_name":rowData.customer_name,
                        "receipt_number":rowData.transaction_number,"receipt_amount":rowData.receipt_amount,"unapplied_amount":rowData.unapplied_amount,
                        "document_number":rowData.document_number,"receipt_date":rowData.transaction_date
                     };
      var url = '/receipt/across_ledger_transfer_form/'+cash_receipt_id;
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
                     self.create_across_lines(lines)
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
   },
   submit_transfer(){
      $('#transferSub').trigger('click')
   },
   refresh_line_data(e){
      rec_id = $(e.target).data('id')
      var url = '/receipt/refresh_level_tranfer/' + rec_id;
      axios.get(url)
            .then(response => {
               data = response.data
               console.log('selected--->',data)
               if(data.status=='success'){
                  $(e.target).parent().parent().find('.dm_trx').text(data.source_reference)
                  $(e.target).parent().parent().find('.cm_trx').text(data.dest_reference)
                  // $(e).parent().parent().find('.tax_dm').text(data.tax_dm_trx_id)
                  // $(e).parent().parent().find('.tax_cm').text(data.tax_cm_trx_id)
                  $(e.target).parent().parent().find('.line_status').text(data.level_line_status)
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
   },
   get_acrlt_txns(status){
      $('#acrlt_txns').DataTable().destroy();
      $('#acrlt_txns tbody').empty();

      $(".tab-pane.fade").removeClass('active show')
      $(".txn_div").addClass('active show')
      filter_data = {'status':status}
      
      
            d_tbl = new DataTable('#acrlt_txns', {
                  ajax: {
                     url: ' /receipt/api/across_levels_list/?format=datatables',
                     "contentType": "application/json",
                     "data": function (d) {
                        $.extend(d, filter_data);
                     },
                  },
                  columns: [
                     { data: 'line_id' },
                     { data: 'receipt_number'},
                     { data: 'document_number' },
                     { data: 'receipt_date' },
                     { data: 'original_amount' },
                     { data: 'customer_name' },
                     { data: 'customer_number' },
                     { data: 'rec_level_from' },
                     { data: 'to_rec_level' },
                     {data : 'amt_to_share' },
                     {data : 'initiated_date' },
                     {data : 'source_reference' },
                     {data : 'dest_reference' },
                     {data : 'request_number' },
                     {data:'line_status','visible' : false },
                     {data:'line_status_code','visible' : false }
                  ],
                  columnDefs: [
                     {
                        targets: [0],
                        data: null,
                        className:'line_status',
                        render: function (data, type, row, meta) {
                           console.log('data--->',)
                           newRowContent = ''
                           if(row['line_status_code']=='TRANSFER_COMPLETED') 
                              newRowContent += 'TRANSFER COMPLETED'
                           else
                              newRowContent += '<a class="btn btn-info btn btn-sm alt_refresh" data-id="'+row['line_id']+'"> Refresh </a>'
                           
                           return (
                              newRowContent
                           );
                           },
                     },
                     {
                        targets: [3,10],
                        orderable: false,
                        data: null,
                        defaultContent: '',
                        render: function (data, type, row, meta) {
                           return (
                              moment(data).format('DD-MMM-YYYY')
                           );
                           },
                     }
                     ],
                  processing: true,
                  language: {
                     processing: "Fetching Transactions..."
                   },
                  serverSide: true,
                  destroy: true, 
                  order: [[0, 'desc']]
                  // bPaginate: true
            });
   },
   action_dropdown(data,row_id){
      let actionCellHtml = ''
      actionCellHtml = '<div class="btn-group">\
               <div class="btn-group">\
                        <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                           <i class="ti-menu"></i>Action\
                        </button>'

         
      actionCellHtml +=  '<div class="dropdown-menu animated flipInY">'
      if(self.page!='across_transfer'){
         actionCellHtml += '<a class="dropdown-item cust_class dt-control" href="javascript:void(0)" data-type="settle" > Settlement </a>'
         actionCellHtml += '<a class="dropdown-item cust_class dt-control" href="javascript:void(0)" data-type="settle" data-settlemethod="excel"> Settlement Excel</a>'
         actionCellHtml += '<a class="dropdown-item cust_class dt-control" href="javascript:void(0)" data-type="refund"> Refund </a>'
      }else{
         actionCellHtml += '<a class="dropdown-item cust_class dt-control" href="javascript:void(0)" data-type="across_level"> Across Level Transfer </a>'
      }
      actionCellHtml += "</div> </div>";
         return actionCellHtml;
   },
   settleExcel(level_name,customer_id){
      self.destroyDT("#openInvTable");
   },
   onPasteItemStock(evt){
      // col;
      // if(col.data != 'item_code') return;
      window.gloPastingFlag = true; 
      var self = this;
       pastedData = evt.clipboardData.getData('text');

      if (!pastedData.includes('\n')) {
          pastedData += '\n';
      }

      // debugger;
        pastedArr = pastedData.split('\n').map((x,i)=>{
          var arr= x.replace("\r","").split("\t").map(x=>x.trim());
          var obj = {};
          // alert(arr.length);
          obj['inv_number'] = arr[0];  
          if(obj['inv_number']=='')
             return null
          
          if (arr.length > 1)
              obj['ap_date'] = arr[1];
          else
              obj['ap_date'] = 1;

          if (arr.length > 2)
              obj['ap_amount'] = arr[2].split(",").join("");
          else 
              obj['ap_amount'] = "";
          return obj;
      })

      self.inv_data = pastedArr.filter(x => x != null)
      
      self.destroyDT("#openInvTable");
      $("#openInvTable").DataTable({
         "data": self.inv_data,
         bPaginate:false,
         columns: [
            { sTitle:'Select',data: 'inv_number' },
            { sTitle:'Applied Amount',data: 'ap_amount' },
            { sTitle:'Appy Date',data: 'ap_date' },
            { sTitle:'Number',data: 'inv_number' }
         ],
         columnDefs:[
            {
               targets: [0],
               orderable: false,
               data: null,
               defaultContent: '',
               render: function (data, type, row, meta) {
                  return (
                  '<input type="checkbox" name="open_inv" class="selectInv2" checked>'
                  );
               },
            },
         ]
      });
   },
   validateData(){
      ShowLoading([
         "Validating invoices"
      ])
      self.initInvTabl(level_name,customer_id,self.inv_data)
      HideLoading()
   },
   clearData(){
      self.destroyDT("#openInvTable");
   }
})