
// Add a request interceptor
axios.interceptors.request.use(function (config) {
    //console.log('request started')
    config.timeout = 70000;
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

function deleteRow(e) {
    $(e).closest('tr').remove();
    [].slice.call($('[name="receiptamount"]')).forEach(inp => tAmount=tAmount+(isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)));

    var diff = formCompnent.header.amount-tAmount;
    $('#advRemain').text(parseFloat(diff).toFixed(2));

    $('#taxTot').text([].slice.call($('[name="taxamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
    $('#baseTot').text([].slice.call($('[name="baseamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
} 

 async function loadTemplate(receipt_id,isDraft=false,pdf_name='receipt.pdf')  {
    ShowLoading([
                 "Printing receipt"
              ])
    var url = '/receipt/get_pdf_data/'+receipt_id ;
    var amount = $("#amount").val()
    var main_customer_number = $("#main_customer_number").val()
    await axios.get(url)
        .then(response => {
            pdf_status = response.data.status
            if(pdf_status=='pending'){
                toastr.warning(response.data.message)
                return false
            }
            pdf_data = response.data.header_context
            var div_width = pdf_data.header_context.process_type=='A' ? '850px': '730px'
            axios({
                method: 'post',
                url: get_pdf_template,
                data: pdf_data,
                // responseType: 'blob'
                }).then(function(response) {
                if (response.data.html){
                    $('#print-div').removeClass('d-none')
                    $("#print-div").empty()
                    if(isDraft==true)
                        $('#print-div').append('<p class="preview_watermark" style="transform: rotate(331deg);font-size: 9em;color: rgba(255, 5, 5, 0.17);position: absolute;text-transform: uppercase;padding-left: -7%;padding-top: 19%;z-index: 99999999;">DRAFT</p>')
                    $('#print-div').append(response.data.html)
                    //$('#print-div').find('img').css('width',$('#print-div table:first').width())
                    $('#print-div').find('img').css('width',div_width)
                    
                    console.log('print fn started')
                    setTimeout(() => {
                        printPDF(response.data.html, 'print-div',pdf_name)
                    }, 2000);
                    
                    console.log('print fn ended')
                    $("#pdfPrevBtn").html('PDF Preview')
                    
                    $("#amount").val(amount)
                    $("#main_customer_number").val(main_customer_number)
                    if(isDraft==true)
                        HideLoading()
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
                .catch(err=>{
                    console.log('at 142', err.message, err);
                    HideLoading()
                    toastr.error('Error in printing receipt')
                });

        })
        .catch(e => {
            HideLoading()
            toastr.error('Error in printing receipt')
            console.log(e)
        }); 
}

var customer_banks = receipt_methods
const d = new Date();
let batch_num = d.valueOf();

vAppProperties.data = Object.assign(vAppProperties.data, {
    'receipt_methods': receipt_methods,
    'receivable_levels': receivable_levels,
    'cash' : false, 'credit_card' : false,'bank' : true, 'cheque' : false, 'pdc' : false,'ati' : false,'bank_display' : true,'other_branch' : false,
    'receipt_attachments': receipt_attachments,
    'receipt_fields': receipt_fields,
    'required_fields':required_fields ,
    'org_id': org_id,
    'invoiceTotal' : 0,
    'invoiceReceiptData': {},
    'receipt_data' : receipt_data,
    'order_receipt' : order_receipt,
    'cc_machines' : cc_machines,
    'pdc_batch_number' : pdc_batch_number,
    'today_date' : moment().format('DD-MMM-YYYY'),
    'order_finalize_status' : [],
    'pdf_receipt_ids' : '',
    'customer_type': 'Internal',
    'bank_charges':false
})

vAppProperties.mounted = function () {

    $(document).on('select2:select','select',function (e) {
        $(this).valid();
    })
    //  $.LoadingOverlay("show",{
    //     text:'txttt'
    // });

    // // Hide it after 3 seconds
    // setTimeout(function(){
    //     $.LoadingOverlay("hide");
    // }, 3000);

    var self = this;
    var defs = localStorage.getItem('defs');
    //console.log(self.customer_banks,'------banks')
    
    $('.datepicker').flatpickr({
        dateFormat: 'd-M-Y',
        minDate: new Date(),
        allowInput: true
    });
    var date = new Date();
    $(".datepicker").val($.datepicker.formatDate("dd-M-yy", date))
    
    $('#receiptForm').validate({
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

  

    $('#receiptForm').submit(function (event) {
        $('#finalize').prop("disabled", true);
        
        event.preventDefault();
        if ($('#receiptForm')[0].checkValidity() === false) {
            console.log('invalid')
            event.stopPropagation();
            $('#finalize').prop("disabled", false);
        } else {
            order_number = $('#order_number').val()
            if($("#advRemain").length>0){
                if(parseFloat($("#advRemain").text())!=0){
                    toastr.error('Please enter full amount')
                    $('#finalize').prop("disabled", false);
                    event.stopPropagation();
                    return false
                // }else if($('.requesttype ').length>=2 && $('.requesttype:first').val()==$('.requesttype:last').val()){
                //     toastr.error('Only one Cash and One Credit card is allowed')
                //     $('#finalize').prop("disabled", false);
                }else{
                    console.log('amount is correct')
                    self.saveReceipt(true)
                }
            }else{
               self.saveReceipt(true)
            }
            //do your ajax submition here
            
        }
        $('#receiptForm').addClass('was-validated');
    });

    

    $('#receipt_type').select2({})
    
    $('#receivable_levels').select2({
        placeholder: 'Select receivable level'
    })
    
    setTimeout(function(scope) { 
        self.initialize_bank_lov('receiptmethod','rm')
    }, 3);
    $("#searchCustBank").select2({})
    
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

    $(document).on('select2:select', '#searchCust', function (e) {
        var id = e.params.data.id;
        var customer_name = e.params.data.customer_name;
        var customer_number = e.params.data.customer_number;
        var main_customer_id = e.params.data.id;
        //document.getElementById('main_cust').value = customer_name;
        document.getElementById('main_customer_number').value = customer_number;
        self.getPopulatedData();
    })


    $(document).on('select2:select', '#receipt_type', function (e) {
        customer_number = $('#main_customer_number').val()
        receipt_amount = $("#amount").val()

        var id = e.params.data.id;
        self.cash  = self.credit_card = self.bank = self.cheque = self.pdc = self.other_branch= false

        var bankdisplay = $("#receipt_type").select2().find(":selected").data("bankdisplay"); 

        self.bank_display =  bankdisplay=='Y'  ? true : false

        $("#credit_card_machine").select2().next().hide();
        $('#pdc_table').DataTable().clear().destroy();

        if (id == 22 || id == 23) {
            self.credit_card = true

            // setTimeout(function(scope) { 
            //     $('#credit_card_machine').select2({})
            // }, 1);
            setTimeout(function(scope) { 
                console.log('initialized cr table')
                self.initCaCrTable(true,'cr_table')
            }, 3);
        }else if(id == 24){
            self.bank = true
            //self.credit_card = true
            //cacc_table
        }else if(id == 25){
            self.cheque = true
            setTimeout(function(scope) { 
                self.initTable(true)
            }, 1);
        }else if(id == 26){
            self.pdc = true
            self.get_pdc_num()
            setTimeout(function(scope) { 
                self.initTable(false)
            }, 1);
        }else if(id == 31){
            self.order_receipt = true
            setTimeout(function(scope) { 
                self.intializeOrderReceipt()
            }, 1);
        }else{
            self.cash  = true
            setTimeout(function(scope) { 
                self.initCaCrTable(false,'ca_table')
            }, 3);
            //cacc_table
        }
        
        setTimeout(function(scope) { 
            $('.datepicker').flatpickr({
                dateFormat: 'd-M-Y',
                minDate: new Date(),
                allowInput: true
            });
            var date = new Date();
            if(id != 26){
                $(".datepicker").val($.datepicker.formatDate("dd-M-yy", date))
            }else{
                //$(".datepicker").val()
            }
            self.initialize_bank_lov('receiptmethod','rm')
            self.initialize_bank_lov()
        }, 2);

        setTimeout(function(){
            $("#main_customer_number").val(customer_number)
            $("#amount").val(receipt_amount)

            if(org_id=379){
                self.initReferenceLov()
            }
            
        }, 100);

    })

    setTimeout(function(scope) { 
        if($("#receivable_levels").val()!='')
            self.initialize_bank_lov()
    }, 2);
    

    $(document).on('select2:select', '#receivable_levels', function (e) {
        self.getPopulatedData()
        self.initialize_bank_lov('receiptmethod','rm')
        self.initialize_bank_lov()
    })

    $(document).on('select2:select', '#receiptmethod', function (e) {
        self.getPopulatedData()
        self.initialize_bank_lov()
        if(org_id == 379 && self.bank==true)
            self.check_bankcharges()
    })

    $(document).on('select2:select','.deposit_receipt_number',function (e) {
        self.initializeDestLocation()
    })

    $(document).on('select2:select','.ob_destination_location',function (e) {
        self.initializeRecLevels(e)
    })

    $(document).on('select2:select','.ob_customer_no',function (e) {
        
        var customer_number = e.params.data.customer_number;
        $(this).closest('tr').find('.ob_customer_account input').val(customer_number)
    })
    
    
    $("#receipt_div").removeClass('d-none')
    order_number = $("#order_number").val()
    
    if($("#receipt_type").val()==181){
        self.setJobCardData()
    }else if(order_number!=undefined){
        var url = '/receipt/get-sales-data/' + order_number;
        axios.get(url)
            .then(response => {
                this.invoiceReceiptData = response.data.invoiceReceiptData
                self.setSalesData(response.data.invoiceReceiptData)
                
            })
            .catch(e => {
                HideLoading()
                toastr.error('Error in getting sales data')
                console.log(e)
            });
    }
            
    if(org_id=379){
        self.initReferenceLov()
    }        
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
    async finalizeAndPrint(receipt_id){
        self = this
        last = 1
        $("#finalize").addClass('disabled')
        ShowLoading([
            "Creating Receipt "
        ])
        //$("#finalize").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Finalize');
        //for single receipts
        if(typeof receipt_id === 'string' || Number.isInteger(receipt_id) ) {
            await self.finalize(receipt_id,1,true).then(
                        (res) => {
                            //console.log('await 12')
                        })
            return Promise.resolve("Success");
        }else{//for finalizing single receipts
            last = 0
            for (let i = 0; i < receipt_id.length; i++) {
                rec_id = receipt_id[i]
                last = (i==(receipt_id.length-1)) ? 1 : 0
                console.log('finalize receipt_id--->',receipt_id,' --receipt index-- ', i)
                await self.finalize(rec_id,last,true).then(
                    (res) => {
                        //console.log('await 12')
                    })
                if(last==1){
                    return Promise.resolve("Success");
                    //HideLoading()
                }else{
                }
                
            }
            
        }
    },
    saveReceipt(isFinalize=false){
        self = this
        if ($('#receiptForm')[0].checkValidity() === false) {
            $("#receiptForm").valid();
            $('#finalize').prop("disabled", false);
            return false
        }else if(isFinalize==false){
            $('#finalize').prop("disabled", false);
            $("#pdfPrevBtn").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> PDF Preview');
        }
        var formData = new FormData();
        let form_data = $('#receiptForm').serializeArray().reduce((function (acc, val) {
            field_name = val.name.replace('[', '_').replace(']', '')
            field_val = val.value.replaceAll(',', ' ')
            if(field_name in acc)
                typeof acc[field_name] === 'string' ? acc[field_name] = [ acc[field_name] , field_val ] :  acc[field_name].push(field_val)
            else 
                acc[field_name] = field_val;
           
            formData.append(field_name,acc[field_name])
            return acc
        }), {});

        if(this.cheque!==false){

            this.receipt_attachments.forEach(element => {
                if($('#'+element.code).get(0).files.length!=0){
                    elm = $('#'+element.code).get(0).files[0];
                    formData.append(element.code, elm, elm.name);
                }
            });
        }
        formData.append('org_id',self.org_id)
        formData.append('is_finalize',isFinalize)
        if(isFinalize==false){
            formData.append('pdf_receipt_ids',self.pdf_receipt_ids)
        }
        

        axios.post(form_submit_url, formData, {
                headers: {
                    'X-CSRFTOKEN': csrf_token,
                },
            })
            .then(response => {
                res_status= response.data.status
                if(res_status=='success'){
                    var self = this;
                    receipt_id = response.data.receipt_id
                    if(receipt_id instanceof Array){
                        if(receipt_id.length>0)
                            $("#finalize").detach();
                        else
                            $('#finalize').prop("disabled", false);
                    }else{
                        int_receipt_id = Number(receipt_id)
                        if(int_receipt_id!=0 && isNaN(int_receipt_id)==false)
                            $("#finalize").detach();
                        else
                            $('#finalize').prop("disabled", false);
                    }
                    console.log('receipt_id---->',receipt_id)
                    $("#receipt_id").val(receipt_id)
                    message = response.data.message
                    $(".after-save").removeClass("d-none");
                    if(isFinalize===false){
                        pdf_receipts =self.pdf_receipt_ids
                        self.pdf_receipt_ids = pdf_receipts!='' ? pdf_receipts+','+receipt_id : receipt_id
                        console.log($("#amount").val())
                        loadTemplate(receipt_id,true)
                    }else{
                        var self = this;
                        self.finalizeAndPrint(receipt_id).then(
                            (res) => {
                                console.log('finalizeAndPrint res===>',res)
                                setTimeout(function(scope) { 
                                    finalize_status = $("#finalize_status").val()
                                    console.log('finalize_status-->',finalize_status)
                                    if(finalize_status=='success'){
                                        var event = new CustomEvent('closeTab', {
                                            detail: ['addreceipt',['/receipt','receipt'] ]
                                        })
                                       window.parent.document.dispatchEvent(event)
                                    }else{

                                    }
                                }, 6000);
                            }
                        )
                        
                    }
                }else{
                    toastr.options = {
                        timeOut: 0,
                        extendedTimeOut: 0
                    };
                    toastr.error(response.data.message)
                    $('#finalize').prop("disabled", false);
                    HideLoading()
                }
            })
            .catch(e => {
                console.log(e)
                toastr.error('Receipt creation failed')
                $('#finalize').prop("disabled", false);
                HideLoading()
                $("#finalize").removeClass('disabled')
                
            }); 
    },
    openPreview(removeActive=false) {
        receipt_id = $("#receipt_id").val()
        tab_title = 'Preview receipt ' + receipt_id
        tab_name = 'viewreceipt' + receipt_id
        template_name = 'pdc'
        tab_url =  `receipt/receipt_view/${template_name}/${receipt_id}` //'receipt/action/preview/' + receipt_id
        console.log('removeActive1--->',removeActive)
        this.addOpenIframePage(tab_url, tab_title, tab_name,'createTab',removeActive)
        
        //openViewInIFrame(['createTab', 'View Template' , `receipt/receipt_view/${template_name}/${receipt_id}`, receipt_id , true ])
    },
    addOpenIframePage(tab_url, tab_title, tab_name,method='createTab',removeActive) {
        var data = [method, tab_title, tab_url, tab_name, true,removeActive]
        var event = new CustomEvent('addOpenIframePage', {
            detail: data
        })
        window.parent.document.dispatchEvent(event)
    },
    async finalize(receipt_id='',last=1,print=false) {
        
        self = this
        receipt_id = (receipt_id=='') ? $("#receipt_id").val() : receipt_id
        
        order_number = $("#order_number").val()
        if(receipt_id!=''){
            var url = '/receipt/finalize_receipt/' + receipt_id+'/'+last;
            await axios.get(url)
                .then(async response => {

                    if(response.data.adv_tax_inv_number!=undefined){
                        $("#amount_before_vat").val(response.data.amount_before_vat)
                        $("#vat_amount").val(response.data.vat)
                        $("#adv_tax_inv_number").val(response.data.adv_tax_inv_number)
                        $("#tax_rate").val('5%')
                        $("#adv_receipt_status").val(response.data.adv_receipt_status)
                        $("#adv_receipt_status_msg").val(response.data.adv_tax_invoice_status)
                    }

                    receipt_id = response.data.receipt_id
                    message = response.data.message
                    toastr.options = {
                        timeOut: 0,
                        extendedTimeOut: 0
                    };
                    
                    if(response.data.status=='success'){
                        if(self.pdc==true && last==1){
                            toastr.success(message)
                        }else if(self.pdc!=true){
                            toastr.success(message)
                        }
                    }else{
                        if(self.pdc==true && last==1){
                            toastr.error(message)
                        }else if(self.pdc!=true){
                            toastr.error(message)
                        }
                    }
                    if(order_number!=''){
                        self.order_finalize_status.push(response.data.status)
                    }
                    let receipt_method_type = $("#receipt_type").val()
                    if(receipt_method_type==31 && order_number!='' && order_number!=undefined && last==1 && (self.order_finalize_status).includes('failed')==false){
                        self.finalize_order(order_number)
                        console.log('finalize order success1')
                        await new Promise(r => setTimeout(r, 5000));
                    }

                    if(print==true && response.data.status=='success' && (self.pdc!=true || (self.pdc==true && last==1)) ){
                        
                        msg_text = 'Receipt is created against receipt number '+ response.data.receipt_number.replace(',','')+'. Can I proceed for printing ?'
                        pdf_name = response.data.receipt_number.replace(',','') +'_'+response.data.doc_number
                        HideLoading()
                        

                        //let text = "Press a button!\nEither OK or Cancel.";
                        if (confirm(msg_text) == true) {
                            if(last==1)
                                $("#finalize_status").val('success')
                                
                            await loadTemplate(receipt_id,false,pdf_name);

                            $("#finalize").html('Finalize');
                        } else {
                            HideLoading()
                            return false;
                        }
                        
                    }else{
                        $("#finalize_status").val('failed')
                        //$("#finalize").removeClass('disabled')
                        $("#finalize").html('Finalize');
                        //Swal.fire(message,'','error')
                        if(self.pdc==true && last==1){
                            alert(message)
                        }else if(self.pdc!=true){
                            alert(message)
                        }
                        if(last==1)
                            HideLoading()
                        
                        console.log('finalize end')
                    }

                    /* $("#print").removeClass("d-none");
                    $("#save_btn").addClass("d-none");
                    $("#finalize").addClass("d-none"); */
                    
                    
                })
                .catch(e => {
                    console.log(e)
                    HideLoading()
                    toastr.error('Error in processing receipt')
                    //$("#finalize").removeClass('disabled')
                });
            }
    },
    loadFile(e){
        elm = $(e.target)
        const file = e.target.files[0];
        let objectURL = URL.createObjectURL(file);
        link_elm = elm.parent().find('a.link')
        link_elm.attr("download", file.name)
        link_elm.attr("href", objectURL)
        link_elm.parent().removeClass('d-none')
    },
    resetForm(){
        $("#receiptForm").trigger('reset');
        $("dd").text('');
        console.log('reset-form')
    },
    initTable(isCheque){

        let promise = new Promise(function (resolve, reject) {
        
                var t =$('#pdc_table').DataTable({
                    "paging": false,
                    "lengthChange": false,
                    "searching": false,
                    "ordering": false,
                    "info": true,
                    "autoWidth": false,
                    "responsive": true,
                    "destroy": true,

                });
                
                resolve(t);
          });
          let isChequeFlag = isCheque;
          let counter = 1
          function addRow(t,counter,isCheque=false){
            //console.log('customer_banks------>',this.customer_banks)
          
            ip_rows =  $("#input_rows").val() ? $("#input_rows").val() : 1 ;
            today_date = moment().format('DD-MMM-YYYY')
            gl_date_row = (isCheque==true) ? '<input type="text" class="form-control" name="gl_date[]" value="'+today_date+'"" required readonly>' : '<input type="text" class="form-control datepicker" name="gl_date[]" required>'
            is_bank_required = (isCheque==true) ? 'required' : ""
        
            for(var i = 0; i < ip_rows; i++){
                let rowArr = [   counter,
                            '<input type="text" class="form-control" name="receipt_number[]" required  maxlength="6" minlength="6">', 
                            '<input type="number"  min="0" class="form-control" name="amount[]"  step="any"  required>', 
                            gl_date_row, 
                            '<input type="text" class="form-control" name="comments[]" style="text-transform:uppercase"  required>'
                        ]
                        //rowArr.splice(4, 0, '<input type="text" class="form-control" name="customer_bank_name[]">');
                        rowArr.splice(4,0,'<div class="form-group"><select class="customer_bank form-control" name="customer_bank_name[]" '+is_bank_required+'><option value="">Select</option></select></div>')
                        //rowArr.splice(5, 0, '<input type="text" class="form-control" name="customer_bank_branch[]" >');
                        rowArr.splice(5,0,'<select class="customer_branch form-control"  name="customer_bank_branch[]" ><option value="">Select</option></select>')
                        t.row.add(rowArr).draw(false);
                        setTimeout(function(scope) { 
                            if(isCheque==false){
                                console.log('isCheque 2--->',isCheque)
                                $('.datepicker').flatpickr({
                                    dateFormat: 'd-M-Y',
                                    minDate: new Date(),
                                    allowInput: true
                                });
                            }
                            $('.customer_bank').select2({
                                ajax: {
                                  url: '/receipt/get_customer_bank/bank',
                                  processResults: function (data) {
                                    return {
                                      results: data.items
                                    };
                                  }                                    }
                            });
                            $('.customer_branch').select2({
                                ajax: {
                                  url: '/receipt/get_customer_bank/branch',
                                  processResults: function (data) {
                                    return {
                                      results: data.items
                                    };
                                  }                                    }
                            });
                        }, 1);
                        counter++
            }
          }
          

          promise.then((t) => {
                if(isChequeFlag==true){
                    addRow(t,counter,true)
                    console.log('add')
                    $(".tbl_gldate").prop('readonly', true);
                }else{

                    $('#addRow').on('click', function () {
                            addRow(t,counter);
                            counter++;
                    });
                    $('#removeRow').on('click', function () {
                        ip_rows =  $("#remove_rows").val();
                        $("#pdc_table tr").slice(-ip_rows).remove();
                    });
                    addRow(t,counter)
                    counter++;

                    $('#input_rows').on('keypress', function(e) {
                        var keyCode = e.keyCode || e.which;
                        if (keyCode === 13) { 
                          e.preventDefault();
                          ip_rows =  $("#input_rows").val();
                          addRow(t,counter);
                          return false;
                        }
                    });

                    $('#remove_rows').on('keypress', function(e) {
                        var keyCode = e.keyCode || e.which;
                        if (keyCode === 13) { 
                          e.preventDefault();
                          ip_rows =  $("#remove_rows").val();
                          $("#pdc_table tr").slice(-ip_rows).remove();
                          return false;
                        }
                    });

                }
          });
    },
    initCaCrTable(isCreditCard,table_name){
        
            t =table_name
            var counter = 1
            $("#"+table_name+" > tbody ").html(''); 
            self = this
            
            function addNewRow(table_name,counter,isCreditCard){
                //console.log('new row triggered')
                is_ccmachine_required = self.org_id!=379 ? 'required' : ''
                rec_number_row = (isCreditCard==true) ? '<div class="form-group"><input type="text" class="form-control" name="receipt_number[]" step="any" maxlength="6" minlength="6" required ></div>' : '<div class="form-group"><input type="text" class="form-control" name="receipt_number[]" readonly></div>'
                machine_col = (isCreditCard==true) ? '<td><div class="form-group"><select class="form-control credit_card_machine"  name="credit_card_machine[]" '+is_ccmachine_required+'></select></div></td>' : ''
                ip_rows = 1
                let rowArr = [
                            '<td>'+counter+'</td>',
                            '<td><div class="form-group"><input type="number"  min="0" class="form-control" name="amount[]"  step="any"  required></div></td>', 
                            '<td><div class="form-group">'+rec_number_row+'</td>', 
                            '<td><div class="form-group"><input type="text" class="form-control" name="comments[]" style="text-transform:uppercase"  required></div></td>',
                            machine_col,
                            '<td><div class="form-group"><a class="btn btn-xs btn-danger row_del"><i class="right fas fa-times"></i></a></div></td>'
                        ]
                
                if(self.other_branch==true){
                    let field_type =  self.customer_type=='Internal' ?  'disabled' : 'required'
                    console.log('field_type---->',field_type)
                    rowArr.splice(1,0,'<td><select class="form-control cus_type ob_destination_location" name="ob_destination_location[]"  '+ field_type +'><option value="">Select</option></select></td>')
                    rowArr.splice(2,0,'<td><select class="form-control cus_type ob_receivable_level" name="ob_receivable_level[]"   '+ field_type +'><option value="">Select</option></select></td>')
                    
                    rowArr.splice(3,0,'<td> <div class="form-group"><select class="form-control ob_customer_no ob_customer_no_'+counter+'" name="ob_customer_no[]" required><option value="">Select</option></select></div> </td>')
                    rowArr.splice(4,0,'<td class="ob_customer_account"><input type="text" class="form-control" disabled></td>')
                }

                var $selectors = $("#"+table_name+" > tbody ").append('<tr>'+rowArr.join()+'</tr>');    
                
                setTimeout(function(scope) { 
                    $("#"+table_name+" > tbody tr:last").find('.credit_card_machine').select2({});
                    self.initializeSeachCust(".ob_customer_no_"+(counter-1))
                    var options = $("#"+table_name+" > tbody tr:last").find('.credit_card_machine'); // $('.credit_card_machine');
                    options.append($("<option />").val('').text('Select'));
                    $.each(cc_machines, function() {
                        options.append($("<option />").val(this.merchant_id).text(this.merchant_label));
                    });
                    if(self.customer_type!='Internal'){
                        self.initializeDestLocation()
                    }
                    
                }, 3);
                counter++
            }

            $(document).off("click", '#addNew').on('click', '#addNew', function (e) {
                addNewRow(t,counter,isCreditCard);
                counter++;
            })
            
            addNewRow(t,counter,isCreditCard)
            counter++;

            $(document).off("click", '.row_del').on('click', '.row_del', function (e) {
                $(this).closest('tr').remove()
                counter--;
            })
         
    },
    async getPopulatedData(receipt_type=''){
        var level_id = $("#receivable_levels").val()
        if(level_id=='')
            return false
        if(receipt_type=='Cash')
            receipt_type = 21
        else if(receipt_type=='Credit Card')
            receipt_type = 22
        let receipt_type_id = (receipt_type!='') ? receipt_type :  $("#receipt_type").val()
        let receiptmethod =  $("#receiptmethod").val()
        var url = '/receipt/get_populated_values/' + level_id + '/' + receipt_type_id+ '/' + receiptmethod;
        let resp;
        data = await axios.get(url)
            .then(response => {
                receipt_method = response.data.receipt_method
                $("#receipt_method").val(receipt_method)
                $(".cur_date").val(moment().format('D-MMM-YY'))
                $("#receipt_method").val(receipt_method)
                $("#banking_status").val(response.data.banking_status)
                $("#settlement_status").val(response.data.settlement_status)
                resp = response.data
                return resp
            })
            .catch(e => {
                console.log(e)
            });
        console.log('data--->',data)
        return data;
    },
    intializeOrderReceipt(invoiceTotal){
        self = this
        self.invoiceTotal  = invoiceTotal
        console.log('invoiceTotal2--->',self.invoiceTotal)
        $(document).on('keyup keydown change','#receiptamount',function() {
            var thiz = this;
            var tr = $(thiz).closest('tr');
            
            setTimeout(function(){
                
                var vatValue = parseFloat(5) //parseFloat(localStorage.getItem('vatValue'));
                //console.log('vatValue---->',vatValue)
                var percent = 5 //localStorage.getItem('vatPercent')
                var baseamount = ((100/(100+vatValue))* parseFloat($(thiz).val())).toFixed(2)
                
                var taxamount = ((1- 100/(100+vatValue) )*parseFloat($(thiz).val())).toFixed(2)
                tr.find('#baseamount').val(isNaN(baseamount) ? '':baseamount);
                tr.find('#taxamount').val(isNaN(taxamount) ? '':taxamount);
                tr.find('#taxpercent').val(vatValue);
            },100) 
        });
        
        setTimeout(function(){
            console.log('22222')
                $('#taxTot').text([].slice.call($('[name="taxamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
                $('#baseTot').text([].slice.call($('[name="baseamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
                $('#advTot').text([].slice.call($('[name="receiptamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
            },350)

        $(document).on('select2:select','.requesttype',function (e) {
            var selected = {'selection':e.params.data};
            if (selected.selection.text == 'Cash'){
                $(this).closest('tr').find('#receiptno').val('');
                $(this).closest('tr').find('#receiptno').prop('readonly',true);
                $(this).closest('tr').find('#receiptno').prop('required',false);
            } else{
                $(this).closest('tr').find('#receiptno').prop('readonly',false);
                $(this).closest('tr').find('#receiptno').prop('required',true);
            }

            // console.log('selected.selection.text--->',selected.selection.text)
            // if (($(e.target).closest('table').find('.requesttype').length>1) && ($(e.target).closest('table').find('.requesttype').filter(function() { return $(this).val() ? $(this).val()==selected.selection.text : false; }).length > 0)) {
            //     // $(e.target).closest('td').find('.form-group').append('<span id="amount-error" class="error invalid-feedback">This field is required.</span>')
            //     console.log('value already exists--->')
            // }

            //var data = self.object_merge(this.invoiceReceiptData,selected);
    
            //data['uname'] = '{{uname}}';
            //data['so'] = '1';
            self.getPopulatedData(selected.selection.text)
                        .then(res_data => {
                            console.log('res.data.receipt_method-------->',res_data.receipt_method)
                            $(e.target).closest('tr').find('td:nth(9)').html(res_data.receipt_method);
                        });
           
        });
        

        $(document).on('input','[name="receiptamount"]',function(){
            var tAmount=0;
            
            //[].slice.call($('[name="receiptamount"]')).forEach(inp => tAmount=tAmount+(isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)));
            console.log('self.invoiceTotal1---->',self.invoiceTotal);
            [].slice.call($('[name="receiptamount"]')).forEach(function (inp) {   
                console.log('inp--->',inp.value)                 
                 tAmount = tAmount + (isNaN(parseFloat(inp.value)) ? 0 : parseFloat(inp.value));
                 return tAmount
            });
            console.log('tAmount---->',tAmount)
            console.log(self.invoiceTotal+'-'+tAmount)
            var diff = parseFloat(self.invoiceTotal-tAmount).toFixed(2);

            $('#advRemain').text(diff);
            console.log('diff====>',diff)
            if (diff < 0 ){
                $('#advRemain').closest('td').addClass('table-danger').removeClass('table-success');
                $(this).val(0)
            } else if( diff > 0 ){
                $('#advRemain').closest('td').addClass('table-danger').removeClass('table-success');
                
            } else{
                $('#advRemain').closest('td').removeClass('table-danger').addClass('table-success');
                
            }
            var tAmount=0;
            
            [].slice.call($('[name="receiptamount"]')).forEach(inp => tAmount=tAmount+(isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)));
            
            var diff = self.invoiceTotal-tAmount;
            console.log('diff2---->',diff)
            console.log('self.invoiceTotal1---->',self.invoiceTotal);
            setTimeout(function(){
    
                $('#advTot').text(tAmount.toLocaleString());
                $('#advRemain').text(parseFloat(diff).toFixed(2));
                
    
                $('#taxTot').text([].slice.call($('[name="taxamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
                $('#baseTot').text([].slice.call($('[name="baseamount"]')).map(inp=>isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)).reduce((a,b)=> a+b,0).toLocaleString())
                console.log('debug1')
            },150);
    
            //if (window.location.search.indexOf('order_number') == -1){
               // var tAmount=0;
    
               // [].slice.call($('[name="receiptamount"]')).forEach(inp => tAmount=tAmount+(isNaN(parseFloat(inp.value))?0:parseFloat(inp.value)));
                //self.invoiceTotal = tAmount;
               // console.log('self.invoiceTotal1---->',self.invoiceTotal);
            //}
        });
    },
    setJobCardData(){
        self=this
        
        $('select.select2').select2({
            "placeholder": "- Select -",
            "data": [
                {
                    "text": "Cash",
                    "id": "Cash"
                },
                {
                    "text": "Credit Card",
                    "id": "Credit Card"
                }
            ]
        }); 
        $('#trxdate').val(moment().format('DD-MMM-YYYY').toUpperCase());
        
        $('td:contains("Receipt No")').text("Authorization Code")
        

        self.invoiceTotal = $("#amount").val()
        self.intializeOrderReceipt(self.invoiceTotal)
        
        i = 0
        setTimeout(function(){

            $('#form-table tbody tr:nth('+i+') select').val('Cash').trigger('change').trigger({
                type: 'select2:select',
                params: {
                    data: {
                        'text':'Cash',
                        'id':'Cash'
                    }
                }
            });
            $('#form-table tbody tr:nth('+i+') #receiptamount').val(self.invoiceTotal).trigger('keyup').trigger('change');
           
        },150)
            
        
        setTimeout(function(){
            
            //$('tbody td:nth-child(1)').not('td:nth(0)').find('select option:contains("Credit Card")').remove();
        },2000)
    },
    setSalesData(salesData){
        self=this
        console.log('salesData----->',salesData)
        console.log(salesData.advLines);
        $('select.select2').select2({
            "placeholder": "- Select -",
            "data": [
                {
                    "text": "Cash",
                    "id": "Cash"
                },
                {
                    "text": "Credit Card",
                    "id": "Credit Card"
                }
            ]
        }); 
        $('#trxdate').val(moment().format('DD-MMM-YYYY').toUpperCase());
        
        $('td:contains("Receipt No")').text("Authorization Code")
        //getLOVsForAddress();
        //$('button:contains("Create Receipt")').text("Confirm Payment")
        console.log('invoiceTotal1--->',salesData.amount)
        self.intializeOrderReceipt(salesData.amount)
        salesData.advLines.forEach(function(x,i){
            
            if (i != 0){
                self.extraLine($('#extraLine')[0]);
            }
            setTimeout(function(){
                console.log('1111111111')
                if (x.types != '')
                    if(x.types=='CASH')
                        x.types='Cash'
                    else if(x.types=='CREDIT CARD')
                        x.types = 'Credit Card'
                    $('#form-table tbody tr:nth('+i+') select').val(x.types).trigger('change').trigger({
                        type: 'select2:select',
                        params: {
                            data: {
                                'text':x.types,
                                'id':x.types
                            }
                        }
                    });
                $('#form-table tbody tr:nth('+i+') #receiptamount').val(x.amount_assigned).trigger('keyup').trigger('change');
                if (x.credit_card_num != 'None')
                    $('#form-table tbody tr:nth('+i+') #receiptno').val(x.credit_card_num).trigger('keyup').trigger('change');
            },150)
            
        })
        
        setTimeout(function(){
            
            //$('tbody td:nth-child(1)').not('td:nth(0)').find('select option:contains("Credit Card")').remove();
        },2000)
    },
    object_merge(){
        var finalobj={};
        for (var i=0; i<arguments.length; i++)
            for (var a in arguments[i])
                finalobj[a] = arguments[i][a];
        return finalobj;
    },
    extraLine(e) {

        //failing add line if there are two rows
        table_rows = $('#form-table tbody tr').length
        // if(table_rows>=2){
        //     toastr.error('Only one Cash and one Credit card is allowed')
        //     return false
        // }

        first_receipt_type = $(".requesttype:first").val()
        lov_data = {}
        //try {
            lov_data['requesttype'] = {
                                            "placeholder": "- Select -",
                                            "data": [
                                                {
                                                    "text": "Cash",
                                                    "id": "Cash"
                                                },
                                                {
                                                    "text": "Credit Card",
                                                    "id": "Credit Card"
                                                }
                                            ]
                                        }
            //removing the already selected reciept type from lov
            //lov_data['requesttype'].data = lov_data['requesttype'].data.filter(x=>x.text!=first_receipt_type);

        thiz = e;
        try {
            $('select.select2').select2('destroy');
        }catch(err) {
            console.log('failed to destroy select2')
        }
        var node = $($('#form-table tbody tr')[0]).clone();

        $(node).find('.requesttype').trigger('change');

        for (var idx in node[0].cells){
            var field = node[0].cells[idx].firstChild;
            if (field != null){
                field.value = null;
            }
        }

        $(node).find('td:last-child').html('<button onclick="deleteRow(this)" class="btn btn-xs btn-danger">x</button>');
        
        $('#form-table tbody').append(node);
    
        setTimeout(() => {
            for (key in lov_data){

                $('[name="'+key+'"]').select2({
                    data: lov_data[key].data,
                    placeholder:lov_data[key].placeholder,
                    dropdownAutoWidth : true,
                }); 
                $('select.select2').select2({
                    placeholder: '- select - ',
                    dropdownAutoWidth : true,
                });

            }

            $(node).find('select').val($(node).find('select').val()).trigger('change').trigger({
                                    type: 'select2:select',
                                    params: {
                                        data: {
                                            'text':$(node).find('select').val(),
                                            'id':$(node).find('select').val()
                                        }
                                    }
                                });
        }, 150);
        
        $('.trxdate').val(moment().format('DD-MMM-YYYY').toUpperCase());
    
        if ([].slice.call($('#form-table tbody tr select').not(node)).map(x=> x.value).includes(first_receipt_type)    ) {
            $(node).find('select option:contains("'+first_receipt_type+'")').remove();
        }
        
        //disable add button if there are two rows
        table_rows = $('#form-table tbody tr').length
        // if(table_rows >= 2){
        //    $("#extraLine").addClass('disabled')
        // }

    },
    removeAddressField(t) {
        if(confirm('Are you sure you want to remove ?')){
            $(t).closest('.address-area').next().remove(); // removes <hr>
            $(t).closest('.address-area').remove();
        }

    },
    ati_receipt(){
        self = this
        customer_number = $('#main_customer_number').val()
        receipt_amount = $("#amount").val()
        var checkBox = document.getElementById("process_type");
        // If the checkbox is checked, display the output text
        if (checkBox.checked == true){
            self.ati = true
        } else {
            self.ati = false
        }
        setTimeout(function(){
            $("#main_customer_number").val(customer_number)
            $("#amount").val(receipt_amount)
        }, 100);
    },
    finalize_order(order_number){
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
                    toastr.error('Error in finalizing order')
                 })
    },
    other_branch_receipt(e){
        self = this
        var checkBox = document.getElementById("other_branch_check");
        // If the checkbox is checked, display the output text
        if (checkBox.checked == true){
            self.other_branch = true
            setTimeout(function(){
                self.initializeSeachCust('.ob_customer_no')

                console.log('oth branchh-----')
                $('#aly_division').select2({
                    ajax: {
                    url: '/receipt/division_lov',
                    data: function (params) {
                        var query = {
                            q: params.term
                        }
                        return query;
                    },
                    processResults: function (data) {
                        //There is my solution.Just directly manipulate the data
                        $.each(data.items, function(i, d) {
                        data.items[i]['id'] = d.flex_value_meaning;
                        data.items[i]['text'] = d.description;
                        });
                        return {
                            results: data.items
                        };
                    }
                    }
                })
                
            }, 10);

            self.getPopulatedData();
        } else {
            self.other_branch = false
            setTimeout(function(){
                self.initializeSeachCust()
            }, 10);
        }
        $('#cr_table > tbody > tr').remove();
        self.initCaCrTable(true,'cr_table')
    },
    initializeSeachCust(elm_id='#searchCust'){
        console.log('initialize search cust-->',elm_id)
        
        $(elm_id).select2({
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
    },
    initializeDestLocation(){
        var source_level = $("#receivable_levels").val()
        $('.ob_destination_location').select2({
            ajax: {
            url: '/receipt/to_dest_location_lov',
            data: function (params) {
                var query = {
                    q: params.term,
                    source_level: source_level
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.loc_code;
                });
                return {
                    results: data.items
                };
              }
            }
        })

    },
    change_customertype(e){
        customer_type  = e.target.value

        $('.cus_type').prop("disabled", true);

        if(customer_type=='Internal'){
            $('#aly_division').prop("disabled", false);
            
        }else{
            $('.ob_destination_location').prop("disabled", false);
            $('.ob_receivable_level').prop("disabled", false);
            self.initializeDestLocation()
        }
    },
    initializeAlyDivLov(){

    },
    initializeRecLevels(e){
        location_code  = e.target.value

        $('.ob_receivable_level').select2({
            ajax: {
            url: '/receipt/to_rec_level_lov',
            data: function (params) {
                var query = {
                    q: params.term,
                    loc_code: location_code
                }
                return query;
            },
            processResults: function (data) {
                return {
                    results: data.items
                };
              }
            }
        })
     },
     initialize_bank_lov(elm='remit_bank_id',lov_type='bank'){
        var level_id = $("#receivable_levels").val()
        var receipt_type_id = $("#receipt_type").val()
        var receiptmethod = $("#receiptmethod").val()
        console.log('lov_type---->',lov_type,'-',receiptmethod)
        if(level_id=='' || receipt_type_id=='' || (lov_type=='bank' && receiptmethod=='')){
            $("#"+elm).empty().trigger('change')
            $("#"+elm).select2();
        }else{
            if(lov_type=='bank' && receiptmethod==''){
                console.log('not trigger')
            }
            console.log('trigger change')
            $('#'+elm).val('')
            $('#'+elm).select2({
                ajax: {
                url: '/receipt/remit_bank_lov',
                data: function (params) {
                    var query = {
                    type_id: receipt_type_id,
                    level_id: level_id,
                    q: params.term,
                    lov_type: lov_type,
                    receiptmethod:receiptmethod
                    }
                    // Query parameters will be ?search=[term]&type=public
                    return query;
                },
                processResults: function(data) {
                    return {
                        results: $.map(data.items, function (item) {
                            return {
                                text: item.text,
                                id: item.id
                            }
                        })
                    };
                },
            },
                width: '100%'
            })

            if(lov_type=='bank'){
                axios.get('/receipt/remit_bank_lov',{ params: {lov_type: lov_type,  primary: 'Y',type_id: receipt_type_id,level_id: level_id,receiptmethod:receiptmethod } })
                    .then(response => {
                        primary_item = response.data.items[0]
                        var selectedOption = {
                            id: primary_item.id,
                            text:  primary_item.text
                        };
                        $('#remit_bank_id').append(new Option(selectedOption.text, selectedOption.id, true, true))
                    
                    })
                    .catch(e => {
                        console.log(e)
                    });
            }
        }
     },
     get_pdc_num(){
        self  = this
         axios.get("/receipt/get_next_pdc_number").then(function(res)
                  {        
                     self.pdc_batch_number = 'PDC'+res.data.new_pdc_num
                  }).catch(function()
                  { 
                     toastr.error('Error in getting pdc number')
                  })
      },
    check_bankcharges(){
        self = this
        let receiptmethod =  $("#receiptmethod").val()
        axios.get('/receipt/get_bankcharge/'+receiptmethod)
        .then(response => {
            self.bank_charges = response.data.status=='success' ? true : false            
        })
        .catch(e => {
            toastr.error('Error in getting bank charges checking')
        });

    },
    initReferenceLov(){
        $('#reference_receipt').select2({
            ajax: {
            url: '/receipt/reversed_receipts',
            data: function (params) {
                var query = {
                    q: params.term,
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.cash_receipt_id;
                  data.items[i]['text'] = d.receipt_number;
                });
                return {
                    results: data.items
                };
              }
            },
            minimumInputLength: 3,
            placeholder: 'Select reference receipt'
        })

    },
    
    
})
