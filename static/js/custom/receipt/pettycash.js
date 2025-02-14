
var uploaded_files = []
var fileServerIdArr = []
var uploaded_error =[]
var init_filepond = false
vAppProperties.data = Object.assign(vAppProperties.data, {
    page:'',
    counter:1,
    t:null,
    action_type:action_type,
    header_id:header_id,
    edit_data:edit_data,
    attachment_validation : false,
    gl_acc_prof: JSON.parse(gl_acc_prof)
 })

vAppProperties.mounted = function () {
    ShowLoading([
        "Loading. . . . "
     ])
    self = this
    self.t =$('#petty_cash_lines').DataTable({
        "paging": false,
        "lengthChange": false,
        "searching": false,
        "ordering": false,
        "info": true,
        "autoWidth": false,
        "responsive": false,
        "destroy": true,
        "footerCallback": function ( row, data, start, end, display ) {
            // var api = this.api(), data;
            self.calculateAndDisplaySum()
            // Update footer
            // $( api.column( 6 ).footer() ).html( total);
        }
    });
    setTimeout(function(){
        if(self.action_type!=undefined)
            self.initLocations()
    }, 100);

    today_date = moment().format('DD-MMM-YYYY')
    $("#gl_date").val(today_date)

    $(document).on('select2:select', '.pc_location', function (e) {
        let location_id = $(e.target).val()
        $("#petty_cash_lines tbody tr").remove()
        self.get_location_amounts(location_id)
    })
    $(document).on('select2:select', '.supplier_id', function (e) {
        var selectedOption = $(e.target).select2('data')[0];
        var customParam = selectedOption.customParam;
        $(e.target).closest('tr').find('.supp_num').val(customParam)
    })
    $(document).on('select2:select', '.gl_account_desc', function (e) {
        let supplier_id = $(e.target).val()
        $(e.target).closest('tr').find('.gl_account').val(supplier_id)
        
        if(self.gl_acc_prof[supplier_id] !== undefined){
            if(self.gl_acc_prof[supplier_id]=='RECEIPT'){
                $(e.target).closest('tr').find('.po_receipt_num').prop('required',true)
                $(e.target).closest('tr').find('.po_receipt_num').prop('readonly',false)
                $(e.target).closest('tr').find('.jobcard_num').prop('readonly',true)
                $(e.target).closest('tr').find('.jobcard_num').prop('required',false)
            }else{
                $(e.target).closest('tr').find('.jobcard_num').prop('readonly',false)
                $(e.target).closest('tr').find('.jobcard_num').prop('required',true)
                $(e.target).closest('tr').find('.po_receipt_num').prop('required',false)
                $(e.target).closest('tr').find('.po_receipt_num').prop('readonly',true)
            }
        }
    })

    // CHANGING AMOUNT WHEN WHEN CHANGING RELATED FIELDS 
    $(document).on('keyup keydown change','.pc_amount',function(e) {
        let pc_amount = parseFloat($(e.target).val()); 
        if($(e.target).closest('tr').find('.vat_checkbox').is(":checked")) {
            let tax_amount = pc_amount * 0.05
            $(e.target).closest('tr').find('.bill_amount').val(pc_amount+tax_amount)
            let vat_amount = pc_amount * 0.05 
            $(e.target).closest('tr').find('.vat_amount').val(vat_amount.toFixed(2))
        }else{
            $(e.target).closest('tr').find('.bill_amount').val(pc_amount)
        }
        self.calculateAndDisplaySum()
    })

    $(document).on('change', '.vat_checkbox', function (e) {
        let pc_amount = parseFloat($(e.target).closest('tr').find('.pc_amount').val())
        let tax_amount = pc_amount!='' ? pc_amount * 0.05 : 0
        if($(e.target).is(":checked")) {
            $(e.target).closest('tr').find('.vat_tax').val('5')
            $(e.target).closest('tr').find('.vat_amount').val(tax_amount.toFixed(2))
            $(e.target).closest('tr').find('.bill_amount').val(pc_amount+tax_amount)
        }else{
            $(e.target).closest('tr').find('.vat_tax').val('')
            $(e.target).closest('tr').find('.vat_amount').val('')
            $(e.target).closest('tr').find('.bill_amount').val(pc_amount.toFixed(2))
        }
        self.calculateAndDisplaySum()
    })
    
    $(document).on('keyup keydown change','.bill_amount',function(e) {
        let bill_amount = parseFloat($(e.target).val()); 
        if($(e.target).closest('tr').find('.vat_checkbox').is(":checked")) {
            let pc_amount = bill_amount/1.05
            $(e.target).closest('tr').find('.pc_amount').val(pc_amount.toFixed(2))
            let vat_amount = pc_amount * 0.05 
            $(e.target).closest('tr').find('.vat_amount').val(vat_amount.toFixed(2))
        }else{
            $(e.target).closest('tr').find('.pc_amount').val(bill_amount.toFixed(2))
        }
        self.calculateAndDisplaySum()
    })

    $(document).on('select2:select', '.full_name', function (e) {
        var emp_num = $(e.target).val()
        $(e.target).closest('tr').find('.emp_num').val(emp_num)
    })

    $(document).on('click', '.upload_btn', function (e) {
        var serialnum = $(e.target).data('serialnum')
        $("#current_entry").val(serialnum)
        $('#fileuploadModal').modal('show');
        if(init_filepond==false)
            initFilePond()
    })

    $(document).on('click', '.delete_btn', function (e) {
        // console.log($(this).closest('tr').index())
        self.t
            .row($(this).parents('tr'))
            .remove()
         .draw();
    })
    

    if(self.action_type=='edit' || self.action_type=='preview'){
        self.editRows()
    }

    

    $('#pcForm').validate({
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
        invalidHandler: function(event, validator) {
            var errors = validator.numberOfInvalids(); // <- NUMBER OF INVALIDS
            console.log(errors);
        },
        showErrors: function(errorMap, errorList) {
            // $.each(errorMap, function(key, value) {
            //     console.log(key); // <- name of invalid field
            //     var parent = $('[name="' + key + '"]').parent();
            //     console.log(parent); // <- parent object
            // });
            this.defaultShowErrors(); // <- ENABLE default MESSAGES
        }
    });

    if(action_type=='edit'){
        self.get_location_amounts(location_id)
    }
    if(action_type=='preview'){
        self.get_header_details(header_id)
        if(self.action_type=='preview'){
            setTimeout(function(scope) { 
                $(".btn.action-btn").remove()       
            }, 2);
        }
    }
    

    if(action_type!='edit'&& action_type!='preview'){
        HideLoading()
    }
    

}

vAppProperties.methods = Object.assign(vAppProperties.methods, {
    calculateAndDisplaySum() {
        var total = 0;
        $('.pc_amount').each(function() {
            var inputValue = parseFloat($(this).val()) || 0;
            console.log('inputValue =====>',inputValue )
            total += inputValue;
        });
        $('#total_amount').text(total.toFixed(2));

        var bill_total = 0;
        $('.bill_amount').each(function() {
            var inputValue = parseFloat($(this).val()) || 0;
            bill_total += inputValue;
        });
        $('#bill_total_amount').text(bill_total.toFixed(2));

        
        var vat_total = 0;
        $('.vat_amount').each(function() {
            var inputValue = parseFloat($(this).val()) || 0;
            vat_total += inputValue;
        });
        $('#vat_total_amount').text(vat_total.toFixed(2));

        
        var paid_total = 0;
        $('.paid_amount').each(function() {
            var inputValue = parseFloat($(this).val()) || 0;
            paid_total += inputValue;
        });
        $('#paid_total_amount').text(paid_total.toFixed(2));

    },
    addRow(line_vals=null){
        location_val = $("#pc_location").val()
        if( location_val==null){
            alert('Please select location before creating line')
            return false
        }
        // self = this
        console.log('self.counter===>',self.counter)
        ip_rows = line_vals==null  ? $("#input_rows").val() : 1
        for(var i = 0; i < ip_rows; i++){
            serial_num = self.counter
            let rowArr = [ '<span class="serial_num" data-line_serialnum="'+serial_num+'">'+serial_num+' <input type="hidden" name="line_id_'+serial_num+'" value=""> </span>',
                        '<select style="width: 100%;" class="form-control full_name" name="full_name_'+serial_num+'"  > <option >  </option> </select>', 
                        '<input type="text" class="form-control emp_num" style="width:50px;" name="emp_num_'+serial_num+'"  readonly >',  
                        '<select style="width: 100%;" class="form-control supplier_id" name="supplier_id_'+serial_num+'"  required> <option >  </option> </select>', 
                        '<input type="text" class="form-control supp_num" style="width:75px;" name="supp_num_'+serial_num+'"   readonly required>', 
                        '<input type="text" class="form-control bill_date" style="width:115px;" name="bill_date_'+serial_num+'"  required >', 
                        '<input type="number" min="0" step="any" class="form-control pc_amount" style="width:100px;" name="amount_'+serial_num+'"  required >', 
                        '<input type="checkbox" class="form-control vat_checkbox" name="vat_flag_'+serial_num+'"   >', 
                        '<input type="number" min="0" step="any" class="form-control vat_tax" style="width:50px;" name="vat_tax_'+serial_num+'"  readonly >',  
                        '<input type="number" min="0" step="any" class="form-control vat_amount" style="width:90px;" name="vat_amount_'+serial_num+'"   readonly>',  
                        '<input type="number" min="0" step="any" class="form-control bill_amount" style="width:90px;" name="bill_amount_'+serial_num+'" required >',  
                        '<input type="text" class="form-control paid_amount" name="paid_amount_'+serial_num+'"  style="width:50px;"  readonly>',  
                        '<select style="width: 100%;" class="form-control gl_account_desc" name="gl_account_desc_'+serial_num+'"  required> <option >  </option> </select>',  
                        '<input type="text" class="form-control gl_account" name="gl_account_'+serial_num+'"  readonly required style="width:100px;">',  
                        '<input type="text" class="form-control" name="purpose_'+serial_num+'"  style="width:200px;" required >',  
                        '<select style="width: 100%;" class="form-control jobcard_num" name="jobcard_num_'+serial_num+'" ><option >  </option> </select>', 
                        '<input type="text" class="form-control po_receipt_num" name="po_receipt_num_'+serial_num+'"  style="width:150px;" >', 
                        '<input type="text" class="form-control inv_num" name="supplier_invoice_num_'+serial_num+'" required>',
                        '<button type="button" class="btn btn-info btn-xs waves-effect waves-light upload_btn" data-serialnum="'+serial_num+'" data-line_id="">Upload </button> <span id="r_'+serial_num+'"></span>' ,
                        '<button type="button" class="btn btn-danger btn-xs delete_btn" > Delete </button> <span id="act_'+serial_num+'"></span>' 
                    ]
                    self.t.row.add(rowArr);

                    if(ip_rows-1==i)
                        self.t.draw(false);
                    // setTimeout(function(scope) { 
                       
                    // }, 1);
                    self.init_lovs()
                    if(line_vals!=null){
                        $("#petty_cash_lines input[name='line_id_"+serial_num+"']").val(line_vals['line_id'])
                        if(line_vals['full_name']!=null)
                            $("#petty_cash_lines select[name='full_name_"+serial_num+"']").append('<option value="'+line_vals['employee_number']+'" selected="selected">'+line_vals['full_name']+'</option>');
                        $("#petty_cash_lines input[name='emp_num_"+serial_num+"']").val(line_vals['employee_number'])
                        // $("#petty_cash_lines [name='supplier_id_"+serial_num+"']").val(line_vals['suplier_id']).trigger('change')
                        $("#petty_cash_lines [name='supplier_id_"+serial_num+"']").append('<option value="'+line_vals['suplier_id']+'" selected="selected">'+line_vals['supplier_name']+'</option>');
                        $("#petty_cash_lines input[name='supp_num_"+serial_num+"']").val(line_vals['suplier_number'])
                        $("#petty_cash_lines input[name='bill_date_"+serial_num+"']").val(line_vals['bill_date'])
                        $("#petty_cash_lines input[name='amount_"+serial_num+"']").val(line_vals['base_amount'])
                        $("#petty_cash_lines input[name='bill_amount_"+serial_num+"']").val(line_vals['bill_amount'])
                        $("#petty_cash_lines select[name='gl_account_desc_"+serial_num+"']").append('<option value="'+line_vals['gl_account']+'" selected="selected">'+line_vals['gl_account_desc']+'</option>');
                        $("#petty_cash_lines input[name='gl_account_"+serial_num+"']").val(line_vals['gl_account'])
                        $("#petty_cash_lines input[name='purpose_"+serial_num+"']").val(line_vals['purpose'])
                        $("#petty_cash_lines input[name='purpose_"+serial_num+"']").attr('title',line_vals['purpose']) 
                        // $("#petty_cash_lines input[name='jobcard_num_"+serial_num+"']").val(line_vals['ro_job_car_no'])
                        $("#petty_cash_lines select[name='jobcard_num_"+serial_num+"']").append('<option value="'+line_vals['jobcard_id']+'" selected="selected">'+line_vals['ro_job_car_no']+'</option>');
                        $("#petty_cash_lines input[name='po_receipt_num_"+serial_num+"']").val(line_vals['attribute1'])
                        $("#petty_cash_lines input[name='supplier_invoice_num_"+serial_num+"']").val(line_vals['attribute15'])
                        $("#petty_cash_lines input[name='vat_tax_"+serial_num+"']").val(line_vals['vat_rate'])
                        $("#petty_cash_lines input[name='vat_amount_"+serial_num+"']").val(line_vals['vat_amount'])
                        if(line_vals['vat_applicable']=='Y')
                            $("#petty_cash_lines input[name='vat_flag_"+serial_num+"']").prop('checked', true);
                        
                    }

                    self.counter++
        }
    },
    editRows(){
        ShowLoading([
            "Fetching lines"
         ])
        header_id = self.header_id
        axios.get('/receipt/get_pc_lines/'+header_id)
        .then(function(response) {
            if (response.data.status='success'){
                lines  = response.data.data
                
                if(lines.length>0){
                    $.each(lines, function (i) {
                        let line_data = lines[i]
                        self.addRow(line_data)
                    });
                }
                if(self.action_type=='preview'){
                    setTimeout(function(scope) { 
                        $(".btn.btn-info").remove()       
                    }, 10);
                }
                setTimeout(function(scope) { 
                    self.calculateAndDisplaySum()
                }, 100);
            }
            else{ 
                toastr.error('Error in fetching lines')
            }
            HideLoading()
        })
        .catch(err=>{
            HideLoading()
            toastr.error('Error in fetching lines')
        });
    },
    removeRow(){
        // self = this
        var numberOfRowsToRemove = $("#remove_rows").val();; // Replace N with the number of rows you want to remove.
        for (let i = 0; i < numberOfRowsToRemove; i++) {
            self.t.row(self.t.data().length-1).remove().draw(false);  
        }
    },
    initLocations(){
        $('.pc_location').select2({
            ajax: {
            url: '/receipt/pc_location_lov',
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                //   data.items[i]['id'] = d.id;
                  data.items[i]['text'] = d.location;
                });
                return {
                    results: data.items
                };
              }
            }
        })
    },
    get_location_amounts(loc_id){
        ShowLoading([
            "Fetching balance"
         ])
        axios.get('/receipt/pc_get_location_amounts/'+loc_id)
            .then(function(response) {
                if (response.data.status='success'){
                    $("#cash_limit").val(response.data.cash_limit)
                    $("#available").val(response.data.available_cash)
                    $("#approver_name").val(response.data.approver_name)
                    $("#voucher_num").val(response.data.voucher_prefix+pc_header_id)
                    $("#approver_name").val(response.data.approver_name)
                    self.attachment_validation= response.data.attachment=='Y'? true : false
                }
                else{ 
                    toastr.error('Error in fetching balance')
                }
                HideLoading()
            })
            .catch(err=>{
                HideLoading()
                toastr.error('Error in fetching balance')
            });

    },
    save_pc(){
        if(self.attachment_validation=='Y'){
            if ($('.filepond--file').length == 0){
                toastr.error("Please select an attachment!")
                return false
            }
        }

        //custom validations
        let validFlag = true
        let vendor_inv = []
        let bill_amount = 0
        let av_amount = $("#available").val()
        
        if ($('#pcForm')[0].checkValidity() === false) {
            $("#pcForm").valid();
            validFlag = false
            toastr.error('Please fill the mandatory fields')
            return false
        }
        if(self.attachment_validation==true){
            console.log(uploaded_files['header_file'])
        }
        $("#petty_cash_lines tbody tr").each(function () {
           
            vendor_inv_val = $(this).find('.supp_num').val()+'-'+$(this).find('.inv_num').val() 
            if ($.inArray(vendor_inv_val, vendor_inv) != -1){ //combination should not duplicate
                alert('Duplicate vendor and invoice combination : '+vendor_inv_val)
                validFlag = false
                return false
            }
            vendor_inv.push(vendor_inv_val)
            bill_amount = bill_amount + parseFloat($(this).find('.bill_amount').val()) 

            if(bill_amount>av_amount){
                validFlag = false
                alert('Total bill amount is greater than avaiable amount')
                return false
            }
        });

        if(validFlag==false)
            return false
         
        $("#find_btn").addClass('disabled')
        ShowLoading([
            "Saving pettycash"
         ])
        let formData = $('#pcForm').serializeArray();
        let line_serialnum = []
        $(".serial_num").each(function (index) {
            line_serialnum.push($(this).data('line_serialnum'))
        });
        formData.push({name: 'line_serialnum', value: line_serialnum})
        formData.push({name: 'uploaded_files', value: uploaded_files})
        formData.push({name:'action_type',value:action_type})
        formData = JSON.stringify(formData);
        
        axios.post('/receipt/save_petty_cash', formData, {
            headers: {
                'X-CSRFTOKEN': csrf_token,
            },
        })
        .then(response => {
            res_status= response.data.status
            if(res_status=='success'){
                $("#find_btn").addClass('disabled')
                if ($('.filepond--file').length != 0){
                    self.save_attachment()
                }
                
                setTimeout(function(scope) { 
                    HideLoading()
                }, 20);
                toastr.success(response.data.message)
                let header_id = response.data.header_id
                window.location.href= '/receipt/pettycash/action/edit/'+header_id;
            }else{
                $("#find_btn").removeClass('disabled')
                toastr.error(response.data.message)
                HideLoading()
            }
        })
        .catch(e => {
            toastr.error('error')
            $("#find_btn").removeClass('disabled')
            HideLoading()
        }); 

    },
    send_approval(){
        if(confirm('Please confirm that voucher saved before sending for approval ?')){
            ShowLoading([
                "Sending pettycash"
             ])

            let voucher_num = $('#voucher_num').val();
            axios.get('/receipt/pc_send_for_approval/'+voucher_num)
            .then(response => {
                res_status= response.data.status
                if(res_status=='success'){
                    $("#find_btn").addClass('disabled')
                    $("#approval_btn").addClass('disabled')
                    toastr.success(response.data.message)
                }else{
                    toastr.error(response.data.message)
                    // $('#finalize').prop("disabled", false);
                }
                HideLoading()
            })
            .catch(e => {
                toastr.error('error')
                // $('#finalize').prop("disabled", false);
                HideLoading()
                
            }); 
        }
    },
    init_lovs(){
        if(action_type=='edit' | action_type=='preview'){
            loc_id = location_id
        }else{
            loc_id = $('#pc_location').val() 
        }
        
        $('.supplier_id').select2({
            ajax: {
            url: '/receipt/supplier_lov/'+loc_id,
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.sup_supplier_id;
                  data.items[i]['text'] = d.sup_vendor_name;
                  data.items[i]['customParam'] =  d.sup_segment1
                });
                return {
                    results: data.items
                };
              }
            },
            minimumInputLength: 3
        })

        $('.bill_date').flatpickr({
            dateFormat: 'd-M-Y',
            //minDate: new Date(),
            //allowInput: true
        });
        
        $('.gl_account_desc').select2({
            ajax: {
            url: '/receipt/gl_account_lov/'+loc_id,
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.flex_value;
                  data.items[i]['text'] = d.description;
                });
                return {
                    results: data.items
                };
              }
            },
            minimumInputLength: 3,
        })

        $('.full_name').select2({
            ajax: {
            url: '/receipt/employee_lov',
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.employee_number;
                  data.items[i]['text'] = d.full_name;
                //   data.items[i]['customParam'] =  d.segment1
                });
                return {
                    results: data.items
                };
              }
            }
        })

        $('.jobcard_num').select2({
            ajax: {
            url: '/receipt/jobcard_lov/'+loc_id,
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                  data.items[i]['id'] = d.id;
                  data.items[i]['text'] = d.incident_number;
                });
                return {
                    results: data.items
                };
              }
            },
            minimumInputLength: 3,
        })

    },
    toHex(str) {
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    },
    urlPrmsToObj(){
        voucher_num = $("#voucher_num").val()
        params= { 
                "756E616D65": self.toHex(username),
                "6474797065":"50455454595F43415348",
                "646E6F": self.toHex(voucher_num),
                "4352555345524E414D45":"",
                "484944" :  self.toHex(voucher_num),
            }
        return params
    },
    save_attachment(){
        if ($('.filepond--file').length == 0){
            return toastr.error("Please select an attachment!")
        }
        if ($('#doc_type').val() == 'Please Select'){
            return toastr.error("Please select document type!")
        }
    
    
        var files_ids = $('input[name=filepond]').closest('#fileuploadForm').serializeArray().filter(
            function(x){
                return x.name=='filepond';
            }
            );
        // blockDIV($('.modal-content'));
    
        var viewUplded = $(this).closest('div').find('.view-attachments')
    
        var data = {
                    'fileMeta':JSON.stringify(files_ids),
                    'urlprms':self.urlPrmsToObj(),
                    // 'doc_type':$('#doc_type').val(),
                    // 'doc_desc':$('#doc_desc').val(),
                }
        
            console.log('csrf_token====>',csrf_token)
            axios.post(chatter_url+"/chatter/sub-d",data)
            .then(function (res) {
                toastr.success('Successfully uploaded.','Success');
    
                // vChatter.msgs.push(res.data.row);
                // vChatter.$nextTick(function () {
                //     scrllToChatBottom();
                // })
                var files = [].slice.call(pond.filepond('getFiles'));
                var pond_ids = [];
                if (files.length != 0) {  
                    files.forEach(function(file) {
                        pond_ids.push(file.id);
                    });
                }
                pond.filepond('removeFiles',pond_ids)
            })
            .catch(function (error) {
                toastr.error('Error uploading files');
            });
    },
    get_header_details(header_id){
        header_id = self.header_id
        axios.get('/receipt/get_pc_header/'+header_id)
        .then(function(response) {
            if (response.data.status='success'){
                header  = response.data.data
                console.log('header===>',header)
                $("#gl_date").val(header['gl_date'])
                $("#approver_name").val(header['approver_name'])
                $("#status").val(header['status'])
                $("#cash_limit").val(header['cash_limit'])
                $("#available").val(header['available_amt'])
                // $("#gl_date").val(header['gl_date'])
            }
            else{ 
                toastr.error('Error in fetching lines')
            }
            HideLoading()
        })
        .catch(err=>{
            HideLoading()
            toastr.error('Error in fetching lines')
        });
    }
})



function initFilePond(){
    init_filepond = true
    pond  = $('.pond').filepond();
    
    $('.pond').filepond('allowMultiple', true);
    $('.pond').filepond('labelIdle', 'Drop other files here<br><b>Document Upload is Optional</b>');
    $('.pond').filepond.setOptions({
        maxFileSize: '15MB',
        server: {
            url: chatter_url, 
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
            //  $("#r_"+current_entry).parent().find('span').text('File uploaded')
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
        },
    });
 }

 