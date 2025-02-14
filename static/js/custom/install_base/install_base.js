vAppProperties.data = Object.assign(vAppProperties.data, {
    t1:null,
    detail_data:{},
    all_line_data: {},
    labels: {},
    line_labels: {},
    view_data: {},
    instance_line_data:{},
    current_instance_id : '',
    ou_lables:{},
    all_ou_data:{},
    instance_ou_data:{},
    current_all_data:{},
    all_line_detailed_data:{},
    all_ou_detailed_data : {},
    instance_action:null,
    current_save_data:{},
    new_item_data:{},
    party_types : {},
    cur_org_id:null,
    login_username:login_username,
    view_labels :{},
    labels_new:{}
})
vAppProperties.mounted = function () {
    // console.log('ereeeee')
    self = this
    // self.setPartyTypeLov()
    if(action!=undefined && action=='view')
        self.initializeVinTable()

    if(action!=undefined && action=='add')
        self.instance_action = 'add'
    $('#tabl_global_search').on( 'change blur', function () {
        self.t1.search( this.value ).draw();
    }); 

    $(document).on('click','.view_btn',function (e) {
        $(".submit_btn").prop("disabled", false);
        
        self.cur_org_id = self.view_data['INV_MASTER_ORGANIZATION_ID']
        let instace_id = $(e.target).data('instace_id')
        self.setCurInstanceData(instace_id)
        self.instance_action = 'view'
        let all_data = {
            "IB_HDR":[self.view_data],
            "ADD_UPD_DEL":"U",
            "IB_ASSOC":self.instance_line_detailed_data,
            "IB_OU":self.instace_ou_detailed_data,
        }
        self.current_all_data = all_data
        self.current_save_data = all_data
        console.log('self.current_all_data====>',self.current_all_data)
        self.ldStep("#view_div",".list_div",)
    })

    $(document).on('click','.edit_btn',function (e) {
        $(".submit_btn").prop("disabled", false);
        self.cancelOwnerUpdate()
        let instace_id = $(e.target).data('instace_id')
        self.setCurInstanceData(instace_id)
        self.instance_action = 'edit'
        let all_data = {
            "IB_HDR":[self.view_data],
            "ADD_UPD_DEL":"U",
            "IB_ASSOC":self.instance_line_detailed_data,
            "IB_OU":self.instace_ou_detailed_data,
        }
        self.cur_org_id = self.view_data['INV_MASTER_ORGANIZATION_ID']
        // console.log("self.cur_org_id=====>",self.view_data)
        self.initEditLovs()
        self.current_all_data = all_data
        self.current_save_data = all_data
        console.log('self.current_all_data====>',self.current_all_data)
        self.ldStep("#view_div",".list_div",)
        
        setTimeout(function(){
            $('.flat_datetimepicker_new').flatpickr({
                enableTime: true,
                dateFormat: "d-M-Y H:i:s"
            });
        }, 100);
        setTimeout(function(){
            self.initAndSelectLov()
        }, 200);
    })
    
    $('#back_to_list').on( 'click', function () {
        self.ldStep(".list_div","#view_div",)
    }); 
    
    
    $(document).on('select2:select','.partyselect',function (e) {
        
    })

    var d = new Date();
    self.initDatepicker('.asso_start_date',d)
    self.initDatepicker('.asso_end_date','')

    self.initLookupLov()
    
    // $(document).on('click','#save_op_unit',function (e) {
    //     self.save_op_unit()
    // })
    console.log('action=====>',action)

    if(action!=undefined && action=='add'){
        self.initAllCreationLovs()

        // $(document).on('select2:select', '.OWNER_NAME', function (e) {
        //     var id = e.params.data.id;
        //     var customer_name = e.params.data.customer_name;
        //     var customer_number = e.params.data.customer_number;
        //     var main_customer_id = e.params.data.id;
        //     $(".OWNER_ACCOUNT_NUMBER").val(customer_number)
        //     console.log('=======customer selected=====')
        //     self.get_cust_party_info(main_customer_id)
        // })

        $('.flat_datetimepicker_new').flatpickr({
            enableTime: true,
            dateFormat: "d-M-Y H:i:s"
        });

        $('.flat_datepicker').flatpickr({
            // enableTime: true,
            dateFormat: "d-M-Y"
        });
        
    }
    $('.flat_datetimepicker').flatpickr({
        enableTime: true,
        dateFormat: "d-M-Y H:i:s",
        defaultDate: new Date()
    });
    
    
    $('#InstanceForm').validate({
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
            
        }
    });

    $('#InstanceForm').submit(function (event) {
        $('#finalize').prop("disabled", true);
        
        event.preventDefault();
        if ($('#InstanceForm')[0].checkValidity() === false) {
            console.log('invalid')
            event.stopPropagation();
            $('#finalize').prop("disabled", false);
        } else {
            self.saveNewIb()
            //do your ajax submition here
            
        }
        $('#InstanceForm').addClass('was-validated');
    });


    $('#saveAssociationForm').submit(function (event) {
        console.log('save associa submit====>')
        $('#save_association').prop("disabled", true);
        
        event.preventDefault();
        if ($('#saveAssociationForm')[0].checkValidity() === false) {
            console.log('invalid')
            event.stopPropagation();
            $('#save_association').prop("disabled", false);
        } else {
            ShowLoading([
                'Updating'
            ])
            self.saveAssociationFn()
            //do your ajax submition here
        }
        $('#saveAssociationForm').addClass('was-validated');
    });
    
    self.initSelect2('.OPERATING_UNIT','/install_base/ou_lov')

    $('#addOpunitsForm').submit(function (event) {
        console.log('save associa submit====>')
        $('#save_op_unit').prop("disabled", true);
        
        event.preventDefault();
        if ($('#addOpunitsForm')[0].checkValidity() === false) {
            console.log('invalid')
            event.stopPropagation();
            $('#save_op_unit').prop("disabled", false);
        } else {
            ShowLoading([
                'Updating'
            ])
            self.save_op_unit()
            //do your ajax submition here
        }
        $('#addOpunitsForm').addClass('was-validated');
    });
    
    if(action!=undefined && action=='add'){
        self.initAddLovs()
        self.get_ou_info('new')
    }
    

    $(document).on('select2:select','.IB_OWNER',function (e) {
        account_id = e.target.value
        self.set_owner_cust_data(account_id,'OWNER')
    })

    setTimeout(function(){
        $(document).on('select2:select','.ADR_LOV',function (e) {
            let location_id =  e.target.value
            self.get_location_info(e,location_id)
        })
    }, 200);
    
}

vAppProperties.methods = Object.assign(vAppProperties.methods, {
    initCustomerLov(post_val_elm, post_key, target_sel_elm, selected_val=null,url_type ){
        let partysite_post_data = {}
        if(selected_val!=null){
            partysite_post_data[post_key] = selected_val==null ? $(post_val_elm+' option:selected').val() : selected_val
        }
        console.log('target_sel_elm===>',target_sel_elm)
        // console.log('post_data--->',post_data)
        self.initSelect2(target_sel_elm,'/install_base/get_customer_lov/'+url_type,0,partysite_post_data)
    },
    intiPartySiteLov(post_val_elm, post_key, target_sel_elm, selected_val=null,post_data=null ){
        let partysite_post_data = {}
        partysite_post_data[post_key] = selected_val==null ? $(post_val_elm+' option:selected').val() : selected_val
        if(post_data!=null){
            // partysite_post_data = partysite_post_data.concat(post_data);
            console.log('partysite_post_data===>',partysite_post_data)
            console.log('post_data===>',post_data)
            partysite_post_data = { ...partysite_post_data, ...post_data };
            console.log('partysite_post_data===>',partysite_post_data)

        }
        console.log('target_sel_elm===>',target_sel_elm)
        self.initSelect2(target_sel_elm,'/install_base/party_site_lov/number',0,partysite_post_data)
    },
    formatSections(jsonData) {
        jsonData = [jsonData]
        console.log('jsonData====>',jsonData)
        
        const formattedData = {};

        let currentSection;

        for (const item of jsonData) {
            for (const key in item) {
            if (key.startsWith("SECTION_")) {
                // Start a new section
                currentSection = key;
                formattedData[currentSection] = {};
            } else if (currentSection) {
                // Add properties to the current section
                formattedData[currentSection][key] = item[key];
            }
            }
        }
        // console.log('formattedData===>',formattedData)
        return formattedData;
      },
    setAllListData(response){
        self.detail_data = response.data['vin_details']
        self.labels = response.data['labels']
        // self.labels_new = response.data['labels']
        self.view_labels = self.formatSections(response.data['labels']);
        self.line_labels = response.data['line_labels']
        self.all_line_data = response.data['line_data']
        self.ou_lables = response.data['ou_label']
        self.all_ou_data = response.data['ou_data']
        self.all_line_detailed_data = response.data['line_detailed_data']
        self.all_ou_detailed_data = response.data['ou_detailed_data']
    },
    setCurInstanceData(instace_id){
        self.current_instance_id = instace_id
        self.view_data = self.detail_data[instace_id][0]
        self.instance_line_data = self.all_line_data[instace_id]
        self.instance_ou_data = self.all_ou_data[instace_id]
        self.instance_line_detailed_data = self.all_line_detailed_data[instace_id]
        self.instace_ou_detailed_data = (self.all_ou_detailed_data[instace_id] != undefined) ? self.all_ou_detailed_data[instace_id] : []
    },
    setNewCurInstanceData(instace_id,newData){
        self.current_instance_id = instace_id
        self.view_data = newData.vin_details[instace_id][0]
        self.instance_line_data = newData.line_data[instace_id]
        self.instance_line_detailed_data = newData.line_detailed_data[instace_id]
        self.instance_ou_data = newData.ou_data[instace_id]
        self.instace_ou_detailed_data = newData.ou_detailed_data[instace_id]

        let all_data = {
            "IB_HDR":[self.view_data],
            "ADD_UPD_DEL":"U",
            "IB_ASSOC":self.instance_line_detailed_data,
            "IB_OU":self.instace_ou_detailed_data,
        }
        self.current_all_data = all_data
        self.current_save_data = all_data

    },
    initializeVinTable(filter_data={}){
        console.log('table init ')

        let columns = [{ data: 'INSTANCE_ID' },
                { data: 'ITEM_DESCRIPTION'},
                { data: 'ITEM_CODE' },
                { data: 'INSTANCE_NUMBER' },
                { data: 'SERIAL_NUMBER' },
                { data: 'INSTANCE_STATUS_NAME' },
                { data: 'QUANTITY' },
                { data: 'OWNER_NAME' },
                { data: 'OWNER_ACCOUNT_NUMBER' },
                { data: 'ACTIVE_START_DATE' }]
        self = this
        const headers = {
            'Content-Type': 'application/json',
            "X-CSRFToken": csrf_token
        }
        ShowLoading([
            'Fetching vin list'
        ])
        axios.post("/install_base/get_vin_txns", filter_data, {
            headers: headers
        })
        .then(async response => {
            console.log('response=====>',response.data['data'])
            HideLoading()
            request_data = response.data['data']
            instance_details = response.data['vin_details']
            self.setAllListData(response)
            

            self.t1 = new DataTable('#vin_txns', {
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
                    }
                ],
                searching: true,
                // processing: true,
                //serverSide: true,
                destroy: true, 
                bPaginate: false,
                initComplete: function () {
                    this.api()
                        .columns()
                        .every(function () {
                            let column = this;
                            let title = column.footer().textContent;
                            if(title=='Item' || title=='Serial Number'  || title=='Owner Account Number' ){
                                // Create input element
                                let input = document.createElement('input');
                                input.placeholder = title;
                                input.id = title.replace(/\s+/g, '_').toLowerCase();
                                column.footer().replaceChildren(input);
                
                                // Event listener for user input
                                input.addEventListener('change', (e) => {
                                    
                                    if($("#item").val()==''&& $("#serial_number").val()==''&& $("#owner_account_number").val()==''){
                                        toastr.error('Please start search with any of these fields - Item, Serial Number or Owner account number')
                                        return false
                                    }
                                    if (column.search() !== this.value) {
                                        key = this.id
                                        val = this.value
                                        let filter_data  = {
                                            "SERIAL_NUMBER":$("#serial_number").val(),
                                            "ITEM_CODE": $("#item").val(),
                                            "OWNER_ACCOUNT_NUMBER": $("#owner_account_number").val()
                                          }
                                        console.log('filter_data====>',filter_data)
                                        self.initializeVinTable(filter_data)
                                        // column.search(input.value).draw();
                                    }
                                });
                            }
                            
                        });
                }
            });

        })
        .catch(e => {
        HideLoading()
        toastr.error('Error fetching install base')
        console.log(e)
        });
    },
    action_dropdown(data,row_id){
        let actionCellHtml = ''
        actionCellHtml = '<div class="btn-group">\
                 <div class="btn-group">\
                          <button type="button" class="btn btn-info btn-xs waves-effect waves-light view_btn" data-instace_id = "'+data+'" >\
                            </i>View\
                          </button></div><span> &nbsp; &nbsp; &nbsp; </span>'
        actionCellHtml += '<div class="btn-group"> <button type="button" class="btn btn-info btn-xs waves-effect waves-light edit_btn" data-instace_id = "'+data+'" >\
        </i>Edit\
      </button>'                  
          actionCellHtml += "</div> </div>";
        return actionCellHtml;
     },
    ldStep(s,h,type){
        $(h).slideUp();
        $(s).slideDown();
    },
    addAssociation(){
        self.ldStep("#add_association",".assoc_list")
        $("#save_association").prop("disabled", false);
        self.initSelect2('.ASSOC_PARTY_NAME','/install_base/party_lov/name',3)
        self.initSelect2('.ASSOC_PARTY_NUMBER','/install_base/party_lov/number',3)
    },
    initParty(elmCls){
        // $(elmCls).select2('destroy')

        $(elmCls).select2({
            ajax: {
            url: '/install_base/get_party_lov',
            data: function (params) {
                var query = {
                    q: params.term
                }
                return query;
            },
            processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                console.log('elmCls===>',elmCls)
                $.each(data.items, function(i, d) {
                    if(elmCls=='.OWNER_PARTY_NAME'){
                        data.items[i]['id'] = d.party_number;
                        data.items[i]['text'] = d.party_name;
                    }else{
                        data.items[i]['id'] = d.party_name;
                        data.items[i]['text'] = d.party_number;
                    }
                });
                console.log('data.items====>',data.items)
                return {
                    results: data.items
                };
              }
            },
            minimumInputLength: 3
        })
    },
    initLookupLov(){
        // console.log('set upppppppppp')
        self.lookupLov('PARTY_TYPE','.party_type')
        self.lookupLov('RELATIONSHIP_TYPE','.relationship_type')
        self.lookupLov('IB_OU_TYPE','.op_type')
        // self.lookupLov('PARTY_TYPE','.party_type')
    },
    lookupLov(type,elm,selectedVal=null){
        $(elm).select2();
        // Make an AJAX request to fetch data
        $.ajax({
            url: '/install_base/get_lookup_lov/'+type,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                const select = $(elm);
                data = data.items
               // select.append(new Option('Select an option', '', false, false)); // Add a default option
                data.forEach(function (item) {
                    select.append(new Option(item.meaning, item.code, false, false));
                });
                select.trigger('change');
                if(selectedVal!=null)
                    $(elm).val(selectedVal).trigger('change')
            },
            error: function (error) {
                console.error('Error fetching data: ' + error);
            }
        });
    },
    initDatepicker(elm,defaultDate){
        $(elm).flatpickr({
            dateFormat: 'd-M-Y H:i:s',
            defaultDate: defaultDate,
            allowInput: false,
            enableTime: true
        });
    },
    removeOp(){
        
    },
    async save_op_unit(){
        self = this
        var formData = new FormData();
        let form_data = $('#addOpunitsForm').serializeArray()
        console.log('form_data=====>',form_data)
        let new_batch_id =  await self.addingNewBatchID()
        const currentDate = moment();
        const formattedCurDate = currentDate.format('DD-MMM-YYYY HH:mm:ss');

        ouData = {
            "OPERATING_UNIT": $("#addOpunitsForm .OPERATING_UNIT option:selected").text() ,
            "TYPE1": $("#addOpunitsForm .op_type option:selected").text() ,
            "ACTIVE_START_DATE": formattedCurDate,
            "ACTIVE_END_DATE": null,
            "OBJECT_VERSION_NUMBER": null,
            "INSTANCE_OU_ID": null,
            "INSTANCE_ID": self.current_instance_id,
            "OPERATING_UNIT_ID": $("#addOpunitsForm .OPERATING_UNIT option:selected").val() ,
            "RELATIONSHIP_TYPE_CODE": $("#addOpunitsForm .op_type option:selected").val() ,
            'BATCH_ID' : new_batch_id,
            'ADD_UPD_DEL_FLAG_AUD' : 'A'
        }
        
        if (!self.current_save_data.hasOwnProperty('IB_OU')) {
            console.log('no current ib ou data')
            self.current_save_data['IB_OU'] = []
        }
        try{
            self.current_save_data['IB_OU'].push(ouData)
        }
        catch(err) {
            self.current_save_data['IB_OU'] = []
            self.current_save_data['IB_OU'].push(ouData)
        }
        
        let respData = await self.updateIb()
        resp = respData.data
        console.log('resp===>',resp)
        if(resp['status']=='success'){
            toastr.success(resp['message'])
            self.ldStep('#op_list','#add_opunits')
            // self.current_all_data['IB_OU'].push(ouData)
        }else{
            $('#save_association').prop("disabled", false);
            toastr.error(resp['message'])
        }
        HideLoading()
    },
    async addingNewBatchID(){
        try {
            self = this
            const get_new_batch_id = async () => {
                try {
                return await axios.get('/install_base/get_next_batchid')
                } catch (error) {
                console.error(error)
                }
            }
            created_by = self.login_username
            let new_batch_id = await get_new_batch_id()
            console.log('new_batch_id===>',new_batch_id.data)
            let batch_id = new_batch_id.data['new_batch_id']
            let page_action = ''
            if(self.instance_action=='add'){
                page_action = 'A'
            }else{
                page_action=  'U'
            }
            // let page_action= 'A'
            self.current_save_data['IB_HDR'].forEach(obj => {
                obj['BATCH_ID'] = batch_id;
                obj['ADD_UPD_DEL_FLAG_AUD'] = page_action;
            });
            self.current_save_data['IB_ASSOC'].forEach(obj => {
                obj['BATCH_ID'] = batch_id;
                obj['ADD_UPD_DEL_FLAG_AUD'] = page_action;
            });

            try{
                self.current_save_data['IB_OU'].forEach(obj => {
                    obj['BATCH_ID'] = batch_id;
                    obj['ADD_UPD_DEL_FLAG_AUD'] = page_action;
                });
            }
            catch(err) {
                self.current_save_data['IB_OU'] = []
                self.current_save_data['IB_OU'].forEach(obj => {
                    obj['BATCH_ID'] = batch_id;
                    obj['ADD_UPD_DEL_FLAG_AUD'] = page_action;
                });
            }
              
           
            self.current_save_data['BATCH_ID'] = batch_id
            return batch_id
        }
        catch(err) {
          HideLoading()
        }
    },
    async saveAssociationFn(){
        self = this
        var formData = new FormData();
        let form_data = $('#saveAssociationForm').serializeArray()
        console.log('form_data=====>',form_data)
        let new_batch_id =  await self.addingNewBatchID()
        const currentDate = moment();
        const formattedCurDate = currentDate.format('DD-MMM-YYYY HH:mm:ss');


        assocData = {
            "ASSOCIATION": $("#saveAssociationForm .relationship_type option:selected").text(),
            "ASSOCIATION_NAME": $("#saveAssociationForm .ASSOC_PARTY_NAME option:selected").text() ,
            "SOURCE": $("#saveAssociationForm .party_type option:selected").text() ,  
            "ASSOCIATION_NUMBER": $("#saveAssociationForm .ASSOC_PARTY_NUMBER option:selected").text(),
            "ACTIVE_FROM": formattedCurDate,
            "ACTIVE_TO": null,
            "CLASSIFICATION": null,
            "INSTANCE_ID": self.current_instance_id,
            "INSTANCE_PARTY_ID": "",
            "PARTY_SOURCE_TABLE": "HZ_PARTIES",
            "PARTY_ID":  $("#saveAssociationForm .ASSOC_PARTY_NAME option:selected").val() ,
            "RELATIONSHIP_TYPE_CODE": $("#saveAssociationForm .relationship_type option:selected").val(),
            "CONTACT_FLAG": "N",
            "CONTACT_IP_ID": null,
            "PRIMARY_FLAG": null,
            "PREFERRED_FLAG": "N",
            "CONTEXT": null,
            "ATTRIBUTE1": null,
            "ATTRIBUTE2": null,
            "ATTRIBUTE3": null,
            "ATTRIBUTE4": null,
            "ATTRIBUTE5": null,
            "ATTRIBUTE6": null,
            "ATTRIBUTE7": null,
            "ATTRIBUTE8": null,
            "ATTRIBUTE9": null,
            "ATTRIBUTE10": null,
            "ATTRIBUTE11": null,
            "ATTRIBUTE12": null,
            "ATTRIBUTE13": null,
            "ATTRIBUTE14": null,
            "ATTRIBUTE15": null,
            "CREATION_DATE": formattedCurDate,
            "OBJECT_VERSION_NUMBER": '',
            "RELATIONSHIP_DESCR": "ShipTo Party/Account/Contact",
            "BATCH_ID": new_batch_id,
            "ADD_UPD_DEL_FLAG_AUD": "A",
            "AYCONNECT_CREATED_BY": self.login_username,
        }
        
        self.current_save_data['IB_ASSOC'].push(assocData)
        
        let respData = await self.updateIb()
        console.log('respData===>',respData)

        resp = respData.data
        if(resp['status']=='success'){
            toastr.success(resp['message'])
            // self.current_all_data['IB_ASSOC'].push(assocData)
            self.ldStep('.assoc_list','#add_association')
        }else{
            $('#save_association').prop("disabled", false);
            toastr.error(resp['message'])
        }
        HideLoading()
    },
    async updateIb(){
        const headers = {
            'Content-Type': 'application/json',
            "X-CSRFToken": csrf_token
        }
        self = this
        form_data = self.current_save_data

        // const get_new_batch_id = async () => {
        //     try {
        //       return await axios.get('/install_base/get_next_batchid')
        //     } catch (error) {
        //       console.error(error)
        //     }
        // }
        console.log('form_data===>',form_data)
        return await axios.post("/install_base/save_ib_instance", form_data, {
                    headers: headers
                }).then(response => {
                    let resp = response
                    // if(resp['status']=='success')
                    //     toastr.success(resp['message'])
                    // else
                    //     toastr.error(resp['message'])
                    console.log('self.instance_action---->',self.instance_action)
                    if(Object.entries(response.data.instance_data).length > 0 && self.instance_action=='edit')
                        self.setNewCurInstanceData(self.current_instance_id,response.data.instance_data)
                    return resp
                })
    },
    refreshIB(){
        ShowLoading(['Refreshing data'])
        self = this
        axios.get("/install_base/get_ib_data/"+self.current_instance_id).then(response => {
            let resp = response
            self.setNewCurInstanceData(self.current_instance_id,response.data.instance_data)
            HideLoading()
            return resp
        })
        .catch(e => {
            HideLoading()
        });
        
    },
    initAllCreationLovs(){
        console.log('action=====> add')
        self = this
        
        self.initSelect2('.ITEM_CODE','/install_base/item_lov',3)
        self.initSelect2('.ASSOC_PARTY_NAME','/install_base/party_lov/name',3)
        self.initSelect2('.ASSOC_PARTY_NUMBER','/install_base/party_lov/number',3)
        self.initSelect2('.CURR_LOCN_PARTY_NUMBER','/install_base/party_lov/number',3)
        self.initSelect2('.CURR_LOCN_PARTY_NAME','/install_base/party_lov/name',3)
        // self.lookupLov('PARTY_TYPE','.party_type')
        
        // self.initializeSeachCust('.OWNER_NAME')

        
        
        $(document).on('select2:select','.cust_site',function (e) {
            cust_data =  self.get_custsite_info(e.target.value)
        })

        $(document).on('select2:select','.OPERATING_UNIT',function (e) {
            cust_data =  self.get_ou_info(e.target.value)
        })
        
        $(document).on('select2:select','.ITEM_CODE',function (e) {
            $('.SERIAL_NUMBER').val(null).trigger('change')
            self.initSerialNum()
            cust_data =  self.get_item_info(e.target.value)
        })
        
    },
    async initSelect2(elm,url,min=0,post_params={}){
        // $(elm).select2('destroy')
        // post_params 
        $(elm).select2({
            ajax: {
              url: url,
              dataType: 'json',
              headers: { "X-CSRFToken": csrf_token },
              contentType:"application/json; charset=utf-8",
              type: "POST",
              data: function (term) {
                  post_params['q']  = term.term
                  return (JSON.stringify(post_params))
              },      
              processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                    data.items[i]['id'] = d.val_id;
                    data.items[i]['text'] = d.text;
                });
                return {
                    results: data.items
                };
            }                          
            },
            minimumInputLength: min
        });
    },
    initializeSeachCust(elm_id='#searchCust'){
        console.log('initialize search cust-->',elm_id)
        // $(elm_id).select2('destroy')
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
    async get_party_info(party_id,type='OWNER',prefix='CURR'){
        var url = '/install_base/get_party_info/' + party_id;
        let resp;
        const data =  await axios.get(url)
            .then(response => {
                resp = response.data.data
                let selectedOption = {
                    id: resp.party_id,
                    text:  resp.party_name
                  };
                if(type=='OWNER'){
                    $('.ASSOC_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
                    selectedOption['text'] = resp.party_number
                    $('.ASSOC_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
                }else{
                    $('.'+prefix+'_LOCN_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
                    selectedOption['text'] = resp.party_number
                    console.log('selectedOption====>',selectedOption)
                    $('.'+prefix+'_LOCN_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
                }
                return resp
            })
            .catch(e => {
                console.log(e)
            });
        return data
    },
    async set_owner_cust_data(account_id,prefix='OWNER'){
        console.log('set customer data')
        var url = '/install_base/get_account_info/' + account_id;
        let resp;
        const data =  await axios.get(url)
            .then(response => {
                resp = response.data.data
                party_data = response.data.party_data
                let selectedOption = {
                    id: resp.cust_account_id,
                    text:  resp.account_name
                  };
                  
                  $('.'+prefix+'_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
                  selectedOption['text'] = resp.account_number
                  console.log('selc---->',selectedOption)
                  console.log('.'+prefix+'_ACCOUNT_NUMBER')
                  $('.'+prefix+'_ACCOUNT_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
                
                let partySelectedOption = {
                    id: party_data.party_id,
                    text:  party_data.party_name
                  };
                $('.'+prefix+'_PARTY_NAME').append(new Option(partySelectedOption.text, partySelectedOption.id, true, true))
                partySelectedOption['text'] = party_data.party_number
                $('.'+prefix+'_PARTY_NUMBER').append(new Option(partySelectedOption.text, partySelectedOption.id, true, true))
                
                let party_id = party_data.party_id
                self.get_party_info(party_id,'CUR_PARTY')
                $("[name='CURR_LOCN_SITE_NUMBER'], [name='CURR_LOCN_ADDRESS']").find('option').remove();
                $(".site_info, .full_addr").text('');
                let post_data = {'party_id':party_id }
                self.initSelect2("[name='CURR_LOCN_SITE_NUMBER']",'/install_base/party_site_lov/number',0,post_data)
                
                

                
                return resp
            })
            .catch(e => {
                console.log(e)
            });
        return data
    },
    get_ou_info(ou_id){
        var url = '/install_base/get_ou_info/' + ou_id;
        let resp;
        data = axios.get(url)
            .then(response => {
                resp = response.data.data
                console.log('resp====>',resp)
                if(ou_id=='new'){
                    let selectedOption = {
                        'id':resp['operating_unit_id'],
                        'text':resp['name'],
                    }
                    $('.OPERATING_UNIT').append(new Option(selectedOption.text, selectedOption.id, true, true))
                }
                return resp
            })
            .catch(e => {
                console.log(e)
            });
    },
    get_cust_party_info(cust_acc_id){
        var url = '/install_base/get_cust_party_info/' + cust_acc_id;
        let resp;
        data = axios.get(url)
            .then(response => {
                resp = response.data.data
                let selectedOption = {
                    id: resp.party_id,
                    text:  resp.party_name
                  };
                console.log('selectedOption====>',selectedOption)
                $('.ASSOC_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
                selectedOption['text'] = resp.party_number
                $('.ASSOC_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
                return resp
            })
            .catch(e => {
                console.log(e)
            });
    },
    get_cust_site_info(cust_acc_id){
        var url = '/install_base/get_cust_site_info/' + cust_acc_id;
        let resp;
        data = axios.get(url)
            .then(response => {
                resp = response.data.data
                let selectedOption = {
                    id: resp.party_id,
                    text:  resp.party_name
                  };
                console.log('selectedOption====>',selectedOption)
                $('.OWNER_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
                selectedOption['text'] = resp.party_number
                $('.OWNER_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
                return resp
            })
            .catch(e => {
                console.log(e)
            });
    },
    get_custsite_info(site_id){
        // var url = '/install_base/get_site_info/' + site_id;
        // let resp;
        // data = axios.get(url)
        //     .then(response => {
        //         resp = response.data.data
        //         let selectedOption = {
        //             id: resp.site_use_id,
        //             text:  resp.party_site_id
        //           };
        //         console.log('selectedOption====>',selectedOption)
        //         $('.CURR_LOCN_SITE_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
        //         selectedOption['text'] = resp.address1
        //         $('.PARTY_ADRESS').append(new Option(selectedOption.text, selectedOption.id, true, true))
        //         return resp
        //     })
        //     .catch(e => {
        //         console.log(e)
        //     });
    },
    get_item_info(inv_item_id){
        self = this
        var url = '/install_base/get_item_info/' + inv_item_id;
        let resp;
        data = axios.get(url)
            .then(response => {
                resp = response.data.data
                console.log('resp====>',resp)
                $(".ITEM_DESCRIPTION").val(resp.description)
                $(".UNIT_OF_MEASURE").val(resp.uom)
                $(".ITEM_TYPE").val(resp.item_type)
                self.new_item_data = resp
                return resp
            })
            .catch(e => {
                console.log(e)
            });
    },
    saveIbInstance(){
        self = this
        var formData = new FormData();
        let form_data = $('#InstanceForm').serializeArray()
        console.log('form_data=====>',form_data)
        const headers = {
            'Content-Type': 'application/json',
            "X-CSRFToken": csrf_token
        }
        axios.post("/install_base/save_ib_instance", form_data, {
            headers: headers
        })
        .then(async response => {
            
        })
    },
    updateAssocLine(instance_party_id){
        console.log('instance_party_id===>',instance_party_id)
    },
    async deleteAssocLine(instance_party_id){
        console.log('self.instance_line_detailed_data====>',self.instance_line_detailed_data)
        console.log('instance_party_id===>',instance_party_id)
        // self.current_all_data['IB_ASSOC'].push(assocData)
        const currentDate = moment();
        const formattedCurDate = currentDate.format('DD-MMM-YYYY HH:mm:ss');
        ShowLoading(['Deleting association line'])
        update_key_values = {
                'ADD_UPD_DEL_FLAG_AUD' : 'D',
                'ACTIVE_END_DATE':formattedCurDate
        }
        console.log('update_key_values====>',update_key_values)
        await self.findAndUpdate('INSTANCE_PARTY_ID',instance_party_id,self.current_all_data['IB_ASSOC'],'IB_ASSOC', update_key_values )
        let respData = await self.updateIb()
        resp = respData.data
        if(resp['status']=='success'){
            toastr.success(resp['message'])
        }else{
            $('#save_association').prop("disabled", false);
            toastr.error(resp['message'])
        }
        HideLoading()
    },
    async findAndUpdate(filter_key,targetValue,array,updateArrKey, update_key_values  ) {

        self.current_save_data = self.current_all_data
        let new_batch_id =  await self.addingNewBatchID()
        const foundItem = array.find(item => item[filter_key] === targetValue);
        const foundIndex = array.findIndex(item => item[filter_key] === targetValue);

        if (foundIndex !== -1) {
          // Insert a new key-value pair into the found element
          for (const [key, value] of Object.entries(update_key_values)) {
            console.log(`Key: ${key}, Value: ${value}`);
            array[foundIndex][key] = value;
          }
                    

          self.current_save_data[updateArrKey] = array
          

        } else {
          // Handle case where no matching key-value pair is found
          console.log('No matching key-value pair found.');
        }
        console.log('self.current_save_data[updateArrKey]====>',self.current_save_data[updateArrKey])
      },
    async deleteOu(instance_ou_id){
        console.log('self.instance_line_detailed_data====>',self.instance_line_detailed_data)
        console.log('instance_ou_id===>',instance_ou_id)
        // self.current_all_data['IB_ASSOC'].push(assocData)
        const currentDate = moment();
        const formattedCurDate = currentDate.format('DD-MMM-YYYY HH:mm:ss');
        ShowLoading(['Deleting opearting unit'])
        update_key_values = {
                'ADD_UPD_DEL_FLAG_AUD' : 'D',
                'ACTIVE_END_DATE':formattedCurDate
        }
        await self.findAndUpdate('INSTANCE_OU_ID',instance_ou_id,self.current_all_data['IB_OU'],'IB_OU', update_key_values )
        let respData = await self.updateIb()
        resp = respData.data
        if(resp['status']=='success'){
            toastr.success(resp['message'])
        }else{
            $('#save_association').prop("disabled", false);
            toastr.error(resp['message'])
        }
        HideLoading()
      },
      async initAndSelectLov(){
        const view_data = self.view_data
        let org_id = view_data['INV_MASTER_ORGANIZATION_ID']

        self.lookupLov('CSI_MU_BATCH_STATUSES','.INSTANCE_STATUS_NAME',view_data['INSTANCE_STATUS_NAME'])
        // Current location LOVs
        self.lookupLov('CSI_EIB_FIELD_LOCATION_TYPE','.curr_locn_type',view_data['CURR_LOCN_TYPE'])
        await self.initSelect2('.curr_locn_party_name','/install_base/party_lov/name',3).then(
            $('.curr_locn_party_name').append(new Option(view_data.CURR_LOCN_PARTY_NAME, view_data.CURR_LOCN_PARTY_NUMBER, true, true))
        )
        await self.initSelect2('.curr_locn_party_number','/install_base/party_lov/number',3).then(
            $('.curr_locn_party_number').append(new Option(view_data.CURR_LOCN_PARTY_NUMBER, view_data.CURR_LOCN_PARTY_NUMBER, true, true))
        )
        post_data = {'party_number':$('.curr_locn_party_number option:selected').text() }
        await self.initSelect2('.curr_locn_site_number','/install_base/party_site_lov/number',0,post_data).then(
            $('.curr_locn_site_number').append(new Option(view_data.CURR_LOCN_SITE_NUMBER, view_data.CURR_LOCATION_ID, true, true))
        )
        post_data = {'party_site_id':$('.curr_locn_party_number option:selected').val() }
        await self.initSelect2('.curr_locn_address','/install_base/location_lov',0,post_data).then(
            $('.curr_locn_address').append(new Option(view_data.CURR_LOCN_ADDRESS, view_data.CURR_LOCATION_ID, true, true))
        )

        // Install location LOVs
        self.lookupLov('CSI_EIB_FIELD_LOCATION_TYPE','.install_locn_type',view_data['INSTALL_LOCN_TYPE'])
        await self.initSelect2('.install_locn_party_name','/install_base/party_lov/name',3).then(
            $('.install_locn_party_name').append(new Option(view_data.INSTALL_LOCN_PARTY_NAME, view_data.INSTALL_LOCN_PARTY_NUMBER, true, true))
        )
        await self.initSelect2('.install_locn_party_number','/install_base/party_lov/number',3).then(
            $('.install_locn_party_number').append(new Option(view_data.INSTALL_LOCN_PARTY_NUMBER, view_data.INSTALL_LOCN_PARTY_NUMBER, true, true))
        )
        post_data = {'party_number':$('.install_locn_party_number option:selected').text() }
        await self.initSelect2('.install_locn_site_number','/install_base/party_site_lov/number',0,post_data).then(
            $('.install_locn_site_number').append(new Option(view_data.INSTALL_LOCN_SITE_NUMBER, view_data.INSTALL_LOCATION_ID, true, true))
        )
        post_data = {'party_site_id':$('.install_locn_site_number option:selected').val() }
        await self.initSelect2('.install_locn_address','/install_base/location_lov',0,post_data).then(
            $('.install_locn_address').append(new Option(view_data.INSTALL_LOCN_ADDRESS, view_data.INSTALL_LOCATION_ID, true, true))
        )

        // Bill to details
        post_data = {'site_party_type': 'BILL_TO','org_id':org_id }
        await self.initSelect2('.billto_locn_party_name','/install_base/party_lov/name',3,post_data).then(
            $('.billto_locn_party_name').append(new Option(view_data.BILL_TO_PARTY_NAME, view_data.BILL_TO_PARTY_ID, true, true))
        )
        await self.initSelect2('.billto_locn_party_number','/install_base/party_lov/number',3,post_data).then(
            $('.billto_locn_party_number').append(new Option(view_data.BILL_TO_PARTY_NUMBER, view_data.BILL_TO_PARTY_ID, true, true))
        )
        post_data = {'party_id':$('.billto_locn_party_number option:selected').val(),'site_party_type': 'BILL_TO','org_id':org_id }
        await self.initSelect2('.billto_locn_site_number','/install_base/party_site_lov/number',0,post_data).then(
            $('.billto_locn_site_number').append(new Option(view_data.BILL_TO_SITE_NUMBER, view_data.BILL_TO_PARTY_SITE_ID, true, true))
        )
        post_data = {'party_site_id':$('.billto_locn_site_number option:selected').val() }
        await self.initSelect2('.billto_locn_address','/install_base/location_lov',0,post_data).then(
            $('.billto_locn_address').append(new Option(view_data.BILL_TO_ADDRESS, view_data.BILL_TO_PARTY_SITE_ID, true, true))
        )

        // Ship to Details
        post_data = {'site_party_type': 'SHIP_TO','org_id':org_id }
        await self.initSelect2('.shipto_locn_party_name','/install_base/party_lov/name',3,post_data).then(
            $('.shipto_locn_party_name').append(new Option(view_data.SHIP_TO_PARTY_NAME, view_data.SHIP_TO_PARTY_ID, true, true))
        )
        await self.initSelect2('.shipto_locn_party_number','/install_base/party_lov/number',3,post_data).then(
            $('.shipto_locn_party_number').append(new Option(view_data.SHIP_TO_PARTY_NUMBER, view_data.SHIP_TO_PARTY_ID, true, true))
        )
        post_data = {'party_id':$('.shipto_locn_party_number option:selected').val(), 'site_party_type': 'SHIP_TO','org_id':org_id }
        await self.initSelect2('.shipto_locn_site_number','/install_base/party_site_lov/number',0,post_data).then(
            $('.shipto_locn_site_number').append(new Option(view_data.SHIP_TO_SITE_NUMBER, view_data.SHIP_TO_PARTY_SITE_ID, true, true))
        )
        post_data = {'party_site_id':$('.shipto_locn_site_number option:selected').val() }
        await self.initSelect2('.shipto_locn_address','/install_base/location_lov',0,post_data).then(
            $('.shipto_locn_address').append(new Option(view_data.SHIP_TO_ADDRESS, view_data.SHIP_TO_PARTY_SITE_ID, true, true))
        )


        //Owner details
        self.lookupLov('PARTY_TYPE','.OWNER_PARTY_TYPE',view_data['OWNER_PARTY_TYPE'])
        post_data = {} //{'org_id':org_id}
        await self.initSelect2('.OWNER_PARTY_NAME','/install_base/party_lov/name',3,post_data).then(
            $('.OWNER_PARTY_NAME').append(new Option(view_data.OWNER_PARTY_NAME, view_data.OWNER_PARTY_ID, true, true))
        )
        await self.initSelect2('.OWNER_PARTY_NUMBER','/install_base/party_lov/number',3,post_data).then(
            $('.OWNER_PARTY_NUMBER').append(new Option(view_data.OWNER_PARTY_NUMBER, view_data.OWNER_PARTY_ID, true, true))
        )
        post_data = {'party_id':$('.OWNER_PARTY_NUMBER option:selected').val() }
        await self.initSelect2('.OWNER_ACCOUNT_NUMBER','/install_base/get_customer_lov/number',0,{}).then(
            $('.OWNER_ACCOUNT_NUMBER').append(new Option(view_data.OWNER_ACCOUNT_NUMBER, view_data.OWNER_PARTY_ACCOUNT_ID, true, true))
        )
        await self.initSelect2('.OWNER_NAME','/install_base/get_customer_lov/name',0).then(
            $('.OWNER_NAME').append(new Option(view_data.OWNER_NAME, view_data.OWNER_PARTY_ACCOUNT_ID, true, true))
        )
      },
    async update_general_details(){
        ShowLoading(['Updating instance details'])
        let targetObject = self.view_data
        updateObject = {
                // "CURR_LOCN_TYPE": "HZ_PARTY_SITES",
                "CURR_LOCN_PARTY_NAME": $("#generalForm .curr_locn_party_name option:selected").text(),
                "CURR_LOCN_PARTY_NUMBER": $("#generalForm .curr_locn_party_number option:selected").text(),
                "CURR_LOCN_SITE_NUMBER": $("#generalForm .curr_locn_site_number option:selected").text(),
                "CURR_LOCN_ADDRESS": $("#generalForm .curr_locn_address option:selected").text(),
                "CURR_LOCATION_ID": $("#generalForm .curr_locn_site_number option:selected").val(),
                "INSTALL_LOCN_PARTY_NAME": $("#generalForm .install_locn_party_name option:selected").text(),
                "INSTALL_LOCN_PARTY_NUMBER": $("#generalForm .install_locn_party_number option:selected").text(),
                "INSTALL_LOCN_SITE_NUMBER": $("#generalForm .install_locn_site_number option:selected").text(),
                "INSTALL_LOCN_ADDRESS": $("#generalForm .install_locn_address option:selected").text(),
                "INSTALL_LOCATION_ID": $("#generalForm .install_locn_site_number option:selected").val(),
                "BILL_TO_PARTY_NAME": $("#generalForm .billto_locn_party_name option:selected").text(),
                "BILL_TO_PARTY_NUMBER": $("#generalForm .billto_locn_party_number option:selected").text(),
                "BILL_TO_SITE_NUMBER": $("#generalForm .billto_locn_site_number option:selected").text(),
                "BILL_TO_ADDRESS": $("#generalForm .billto_locn_address option:selected").text(),
                "BILL_TO_ADDRESS_ID": null,//$("#generalForm .billto_locn_site_number option:selected").val(),
                "SHIP_TO_PARTY_NAME": $("#generalForm .shipto_locn_party_name option:selected").text(),
                "SHIP_TO_PARTY_NUMBER": $("#generalForm .shipto_locn_party_number option:selected").text(),
                "SHIP_TO_SITE_NUMBER": $("#generalForm .shipto_locn_site_number option:selected").text(),
                "SHIP_TO_ADDRESS": $("#generalForm .shipto_locn_address option:selected").text(),
                "SHIP_TO_ADDRESS_ID": null, //$("#generalForm .shipto_locn_site_number option:selected").val(),
                "OWNER_NAME": $("#generalForm .OWNER_NAME option:selected").text(),
                "OWNER_ACCOUNT_NUMBER": $("#generalForm .OWNER_ACCOUNT_NUMBER option:selected").text(),
                "OWNER_PARTY_ACCOUNT_ID": $("#generalForm .OWNER_ACCOUNT_NUMBER option:selected").val(),
                "OWNER_PARTY_ID":  $("#generalForm .OWNER_PARTY_NAME option:selected").val(),
                "OWNER_PARTY_TYPE": $("#generalForm .OWNER_PARTY_TYPE option:selected").val(),
                "OWNER_PARTY_NAME": $("#generalForm .OWNER_PARTY_NAME option:selected").text(),
                "OWNER_PARTY_NUMBER": $("#generalForm .OWNER_PARTY_NUMBER option:selected").text(),
                "BILL_TO_PARTY_ID": $("#generalForm .billto_locn_party_number option:selected").val(),
                "SHIP_TO_PARTY_ID":$("#generalForm .shipto_locn_party_number option:selected").val(),
                "BILL_TO_PARTY_SITE_ID": $("#generalForm .billto_locn_site_number option:selected").val(),
                "SHIP_TO_PARTY_SITE_ID":$("#generalForm .shipto_locn_site_number option:selected").val(),
                "EXPIRATION_DATE": $("#generalForm .EXPIRATION_DATE").val(),
                "INSTANCE_STATUS_NAME": $("#generalForm .INSTANCE_STATUS_NAME").val(),
                "RETURN_BY_DATE": $("#generalForm .RETURN_BY_DATE").val(),
                "ACTUAL_RETURN_DATE": $("#generalForm .ACTUAL_RETURN_DATE").val(),
                
        }
        let new_target = self.overwriteValues(targetObject, updateObject);

        self.current_save_data['IB_HDR'] = [new_target]

        let new_batch_id =  await self.addingNewBatchID()
        
        
        // assocData = {
        //     "ASSOCIATION": 'PARTY',
        //     "ASSOCIATION_NAME":  $(".OWNER_PARTY_NAME option:selected").text(),
        //     "SOURCE": 'OWNER' ,  
        //     "ASSOCIATION_NUMBER":$(".OWNER_PARTY_NUMBER option:selected").text(),
        //     "ACTIVE_FROM": formattedCurDate,
        //     "ACTIVE_TO": null,
        //     "CLASSIFICATION": null,
        //     "INSTANCE_ID": null,
        //     "INSTANCE_PARTY_ID": null,
        //     "PARTY_SOURCE_TABLE": "HZ_PARTIES",
        //     "PARTY_ID":  $(".OWNER_PARTY_NUMBER option:selected").val() ,
        //     "RELATIONSHIP_TYPE_CODE": 'OWNER',
        //     "CONTACT_FLAG": "N",
        //     "CONTACT_IP_ID": null,
        //     "PRIMARY_FLAG": null,
        //     "PREFERRED_FLAG": "N",
        //     "CONTEXT": null,
        //     "ATTRIBUTE1": null,
        //     "ATTRIBUTE2": null,
        //     "ATTRIBUTE3": null,
        //     "ATTRIBUTE4": null,
        //     "ATTRIBUTE5": null,
        //     "ATTRIBUTE6": null,
        //     "ATTRIBUTE7": null,
        //     "ATTRIBUTE8": null,
        //     "ATTRIBUTE9": null,
        //     "ATTRIBUTE10": null,
        //     "ATTRIBUTE11": null,
        //     "ATTRIBUTE12": null,
        //     "ATTRIBUTE13": null,
        //     "ATTRIBUTE14": null,
        //     "ATTRIBUTE15": null,
        //     "CREATION_DATE": formattedCurDate,
        //     "OBJECT_VERSION_NUMBER": 1,
        //     "RELATIONSHIP_DESCR": "Owner Party/Account",
        //     "BATCH_ID": new_batch_id,
        //     "ADD_UPD_DEL_FLAG_AUD": "A",
        //     "AYCONNECT_CREATED_BY": "NCHALIL",
        // }
        
        // self.current_save_data['IB_ASSOC'].push(assocData)
        
        console.log('updateObject===>',updateObject)
        // return false
        let respData = await self.updateIb()
        resp = respData.data
        if(resp['status']=='success'){
            toastr.success(resp['message'])
        }else{
            // $('#save_association').prop("disabled", false);
            toastr.error(resp['message'])
        }
        HideLoading()
    },
    overwriteValues(target, updates) {
        for (const key in updates) {
          if (updates.hasOwnProperty(key)) {
            // Check if the key exists in the target object
            if (target.hasOwnProperty(key)) {
              // Update the value if the key already exists
              target[key] = updates[key];
            } else {
              // Add a new key-value pair if the key doesn't exist
              target[key] = updates[key];
            }
          }
        }
        return target
      },
    change_owner_view(){
        $("#change_owner").removeClass('d-none')
        $("#instance_update_div").addClass('d-none')
        self.ldStep('#details_div','#op_units')
        $("#update_type").val('owner')
        $("#update_title").text('Change Owner')
        $("#cancelOwner").removeClass('d-none')
    },
    cancelOwnerUpdate(){
        $("#change_owner").addClass('d-none')
        $("#instance_update_div").removeClass('d-none')
        self.ldStep('#details_div','#op_units')
        $("#update_type").val('instance')
        $("#update_title").text('Update Instance')
        $("#cancelOwner").addClass('d-none')
    },
    async saveNewIb(){
        ShowLoading(['Creating instance'])
        // Item_info = get_item_info
        const currentDate = moment();
        const formattedCurDate = currentDate.format('DD-MMM-YYYY HH:mm:ss');

        let hdr_data =  {
                    "ITEM_DESCRIPTION": self.new_item_data['description'],
                    "ITEM_CODE": $(".ITEM_CODE option:selected").text(),
                    "INSTANCE_NUMBER": null,
                    "SERIAL_NUMBER": $(".SERIAL_NUMBER option:selected").text(),
                    "INSTANCE_STATUS_NAME": $(".INSTANCE_STATUS_NAME").val(),
                    "QUANTITY": $(".QUANTITY").val(), 
                    "OWNER_NAME": $(".OWNER_NAME option:selected").text() ,
                    "OWNER_ACCOUNT_NUMBER": $(".OWNER_ACCOUNT_NUMBER").text(),
                    "ORGANIZATION_NAME": $(".OPERATING_UNIT option:selected").text(),
                    "ACTIVE_START_DATE": formattedCurDate,
                    "ACTIVE_END_DATE": null,
                    "LAST_VLD_ORGANIZATION_ID":$(".OPERATING_UNIT option:selected").val(),
                    "UNIT_OF_MEASURE": self.new_item_data['uom'],
                    "UNIT_OF_MEASURE_NAME": "Each",
                    "ITEM_TYPE": self.new_item_data['item_type'], 
                    "EXPIRATION_DATE": null,
                    "SHIPPED_ON_DATE": null,
                    "RETURN_BY_DATE": $(".RETURN_BY_DATE").val(),
                    "ACTUAL_RETURN_DATE": $(".ACTUAL_RETURN_DATE").val(),
                    "CURR_LOCN_TYPE": "HZ_PARTY_SITES",
                    "CURR_LOCN_PARTY_NAME": $(".CURR_LOCN_PARTY_NAME option:selected").text() ,
                    "CURR_LOCN_PARTY_NUMBER": $(".CURR_LOCN_PARTY_NUMBER option:selected").text() ,
                    "CURR_LOCN_SITE_NUMBER": $(".CURR_LOCN_SITE_NUMBER option:selected").text() ,
                    "CURR_LOCN_ADDRESS":$(".CURR_LOCN_ADDRESS option:selected").text() ,
                    "CURR_LOCATION_ID":$(".CURR_LOCN_SITE_NUMBER option:selected").val() ,
                    // "INSTALL_LOCN_TYPE": "HZ_PARTY_SITES",
                    // "INSTALL_LOCN_PARTY_NAME": $(".CURR_LOCN_PARTY_NAME option:selected").text() ,
                    // "INSTALL_LOCN_PARTY_NUMBER": $(".CURR_LOCN_PARTY_NUMBER option:selected").text() ,
                    // "INSTALL_LOCN_SITE_NUMBER": $(".CURR_LOCN_SITE_NUMBER option:selected").text() ,
                    // "INSTALL_LOCN_ADDRESS": $(".CURR_LOCN_ADDRESS option:selected").text() ,
                    // "INSTALL_LOCATION_ID": $(".CURR_LOCN_SITE_NUMBER option:selected").val() ,
                    // "BILL_TO_PARTY_NAME": "SAMUEL  11 EDITED",
                    // "BILL_TO_PARTY_NUMBER": "697399",
                    // "BILL_TO_SITE_NUMBER": "1025105",
                    // "BILL_TO_ADDRESS": "ADD",
                    // "SHIP_TO_PARTY_NAME": "SAMUEL  11 EDITED",
                    // "SHIP_TO_PARTY_NUMBER": "697399",
                    // "SHIP_TO_SITE_NUMBER": "1025106",
                    // "SHIP_TO_ADDRESS": "ADD",
                    "INSTANCE_ID": null,
                    "OWNER_NAME": $(".OWNER_NAME option:selected").text(),
                    "OWNER_ACCOUNT_NUMBER": $(".OWNER_ACCOUNT_NUMBER option:selected").text(),
                    "OWNER_PARTY_ACCOUNT_ID": $(".OWNER_ACCOUNT_NUMBER option:selected").val(),
                    "OWNER_PARTY_ID":  $(".OWNER_PARTY_NAME option:selected").val(),
                    "OWNER_PARTY_TYPE": $(".PARTY_TYPE option:selected").val(),
                    "OWNER_PARTY_NAME": $(".OWNER_PARTY_NAME option:selected").text(),
                    "OWNER_PARTY_NUMBER": $(".OWNER_PARTY_NUMBER option:selected").text(),
                    "TRANSFER_DATE": formattedCurDate,
                    "INVENTORY_ITEM_ID": self.new_item_data['inventory_item_id'],
                    "INSTANCE_STATUS_ID": 510,
                    "INV_MASTER_ORGANIZATION_ID": self.new_item_data['organization_id'],
                    "INV_ORGANIZATION_ID": $(".OPERATING_UNIT option:selected").val(),
                    "INSTANCE_PARTY_ID": null,
                    "IP_ACCOUNT_ID": null,
                    "PARTY_ACCOUNT_ID": null,
                    "RELATIONSHIP_TYPE_CODE": null,
                    "CIPA_OBJECT_VERSION_NUMBER": 1,
                    "BILL_TO_ADDRESS_ID": null,
                    "SHIP_TO_ADDRESS_ID": null,
                    "BILL_TO_PARTY_ID": null,
                    "SHIP_TO_PARTY_ID": null,
                    "CONTEXT": "CONTEXT",
                    "TELNET_SOLD_LOCATION":$(".TELNET_SOLD_LOCATION").val(),
                    "MAPPED_ORGANIZATION_NAME": $(".MAPPED_ORGANIZATION_NAME option:selected").text(),
                    "SALES_ORDER_NO": $(".SALES_ORDER_NO").val(),
                    "SALES_ORDER_DATE": $(".SALES_ORDER_DATE").val(),
                    "MAPPED_ORGANIZATION_ID": $(".MAPPED_ORGANIZATION_NAME option:selected").val(),
                    "INSTALL_DATE": $(".INSTALL_DATE").val(),
            }
            let hdr_install_locn = {}
            console.log('$(".CUR_LOCN_CHECKBOX").is(":checked")=====>',$(".CUR_LOCN_CHECKBOX").is(":checked"))
            if($(".CUR_LOCN_CHECKBOX").is(":checked")==true){
                console.log('cure location same as install')
                hdr_install_locn = {
                    "INSTALL_LOCN_TYPE": "HZ_PARTY_SITES",
                    "INSTALL_LOCN_PARTY_NAME": $(".CURR_LOCN_PARTY_NAME option:selected").text() ,
                    "INSTALL_LOCN_PARTY_NUMBER": $(".CURR_LOCN_PARTY_NUMBER option:selected").text() ,
                    "INSTALL_LOCN_SITE_NUMBER": $(".CURR_LOCN_SITE_NUMBER option:selected").text() ,
                    "INSTALL_LOCN_ADDRESS": $(".CURR_LOCN_ADDRESS option:selected").text() ,
                    "INSTALL_LOCATION_ID": $(".CURR_LOCN_SITE_NUMBER option:selected").val() ,
                }
                hdr_data =  {...hdr_data, ...hdr_install_locn};
            }else{
                if($(".INS_LOCN_TYPE").val()!=''){
                    hdr_install_locn = {
                        "INSTALL_LOCN_TYPE": "HZ_PARTY_SITES",
                        "INSTALL_LOCN_PARTY_NAME": $(".INS_LOCN_PARTY_NAME option:selected").text() ,
                        "INSTALL_LOCN_PARTY_NUMBER": $(".INS_LOCN_PARTY_NUMBER option:selected").text() ,
                        "INSTALL_LOCN_SITE_NUMBER": $(".INS_LOCN_SITE_NUMBER option:selected").text() ,
                        "INSTALL_LOCN_ADDRESS": $(".INS_LOCN_ADDRESS option:selected").text() ,
                        "INSTALL_LOCATION_ID": $(".INS_LOCN_SITE_NUMBER option:selected").val() ,
                    }
                    hdr_data =  {...hdr_data, ...hdr_install_locn};
                }
            }
            // console.log('hdr_data====>',hdr_data)
            // return false
            self.current_save_data = {
                "IB_HDR":[hdr_data],
                "ADD_UPD_DEL":"A",
                "IB_ASSOC":[],
                "IB_OU":[],
            }
            let new_batch_id =  await self.addingNewBatchID()
            
            assocData = {
                "ASSOCIATION": 'PARTY',
                "ASSOCIATION_NAME":  $(".OWNER_PARTY_NAME option:selected").text(),
                "SOURCE": 'OWNER' ,  
                "ASSOCIATION_NUMBER":$(".OWNER_PARTY_NUMBER option:selected").text(),
                "ACTIVE_FROM": formattedCurDate,
                "ACTIVE_TO": null,
                "CLASSIFICATION": null,
                "INSTANCE_ID": null,
                "INSTANCE_PARTY_ID": null,
                "PARTY_SOURCE_TABLE": "HZ_PARTIES",
                "PARTY_ID":  $(".OWNER_PARTY_NUMBER option:selected").val() ,
                "RELATIONSHIP_TYPE_CODE": 'OWNER',
                "CONTACT_FLAG": "N",
                "CONTACT_IP_ID": null,
                "PRIMARY_FLAG": null,
                "PREFERRED_FLAG": "N",
                "CONTEXT": null,
                "ATTRIBUTE1": null,
                "ATTRIBUTE2": null,
                "ATTRIBUTE3": null,
                "ATTRIBUTE4": null,
                "ATTRIBUTE5": null,
                "ATTRIBUTE6": null,
                "ATTRIBUTE7": null,
                "ATTRIBUTE8": null,
                "ATTRIBUTE9": null,
                "ATTRIBUTE10": null,
                "ATTRIBUTE11": null,
                "ATTRIBUTE12": null,
                "ATTRIBUTE13": null,
                "ATTRIBUTE14": null,
                "ATTRIBUTE15": null,
                "CREATION_DATE": formattedCurDate,
                "OBJECT_VERSION_NUMBER": 1,
                "RELATIONSHIP_DESCR": "Owner Party/Account",
                "BATCH_ID": new_batch_id,
                "ADD_UPD_DEL_FLAG_AUD": "A",
                "AYCONNECT_CREATED_BY": self.login_username,
            }
            
            self.current_save_data['IB_ASSOC'].push(assocData)
            
            ouData = {
                "OPERATING_UNIT": $(".OPERATING_UNIT option:selected").text() ,
                "TYPE1": 'Sold From' ,
                "ACTIVE_START_DATE": formattedCurDate,
                "ACTIVE_END_DATE": null,
                "OBJECT_VERSION_NUMBER": null,
                "INSTANCE_OU_ID": null,
                "INSTANCE_ID": null,
                "OPERATING_UNIT_ID": $(".OPERATING_UNIT option:selected").val() ,
                "RELATIONSHIP_TYPE_CODE": 'SOLD_FROM' ,
                'BATCH_ID' : new_batch_id,
                'ADD_UPD_DEL_FLAG_AUD' : 'A'
            }
            // 
            // self.current_save_data['IB_OU'].push(ouData)

            let respData = await self.updateIb()
            resp = respData.data
            console.log("resp['status']=====>",resp['status'])
            if(resp['status']=='success'){
                toastr.success(resp['message'])
                message = 'Created Instance Number '+ resp['INSTANCE_ID']
                alert(message)
                self.closePage()
            }else{
                // $('#save_association').prop("disabled", false);
                $('#finalize').prop("disabled", false);
                toastr.error(resp['message'])
                HideLoading()
            }
            
            
    },
    // setPartyTypeLov(){
    //     self - this
    //     $.ajax({
    //         url: '/install_base/get_lookup_lov/PARTY_TYPE',
    //         method: 'GET',
    //         dataType: 'json',
    //         success: function (data) {
    //             data = data.items
    //             const newArray = data.map(obj => {
    //                 console.log('obj---->',obj)
    //                 // return {
    //                 //   newKey1: obj.key1,
    //                 //   newKey2: obj.key2,
    //                 //   // Add more key-value pairs as needed
    //                 // };
    //               });
    //             self.party_types = data
    //         },
    //         error: function (error) {
    //             console.error('Error fetching data: ' + error);
    //         }
    //     });
    // }

    initEditLovs(){
        self = this
        //------------- cur party update lov changes starts here ------------
        $(document).on('select2:select','.curr_locn_party_number ',function (e) {
            $(".curr_locn_site_number").val(null).trigger("change"); 
            $(".curr_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_id':$('.curr_locn_party_number option:selected').val(), 'site_party_type': 'SHIP_TO','org_id':self.cur_org_id }
            self.initSelect2('.curr_locn_site_number','/install_base/party_site_lov/number',0,post_data)
        })

        $(document).on('select2:select','.curr_locn_site_number ',function (e) {
            $(".curr_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.curr_locn_site_number option:selected').val() }
            let sel_party_siteid =$('.curr_locn_site_number option:selected').val()
            self.populateSiteInfo(e,sel_party_siteid)
            self.initSelect2('.curr_locn_address ','/install_base/location_lov',0,post_data)
            
        })

        $(document).on('select2:select','.CUR_PARTY',function (e) {
            party_id = e.target.value
            $(".curr_locn_site_number").val(null).trigger("change"); 
            $(".curr_locn_address ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'CUR_PARTY')
            self.intiPartySiteLov('.curr_locn_party_number','party_id','.curr_locn_site_number',party_id)
        })
        //------------- cur party update lov changes ends here ------------


        //------------- install party update lov changes starts here ------------
        $(document).on('select2:select','.install_locn_party_number ',function (e) {
            $(".install_locn_site_number").val(null).trigger("change"); 
            $(".install_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_id':$('.install_locn_party_number option:selected').val() }
            self.initSelect2('.install_locn_site_number','/install_base/party_site_lov/number',0,post_data)
        })

        $(document).on('select2:select','.install_locn_site_number ',function (e) {
            $(".install_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.install_locn_site_number option:selected').val() }
            let sel_party_siteid = $('.curr_locn_site_number option:selected').val() 
            self.populateSiteInfo(e,sel_party_siteid)
            self.initSelect2('.install_locn_address ','/install_base/location_lov',0,post_data)
        })

        $(document).on('select2:select','.INS_PARTY',function (e) {
            party_id = e.target.value
            $(".install_locn_site_number").val(null).trigger("change"); 
            $(".install_locn_address ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'INS_PARTY','INSTALL')
            self.intiPartySiteLov('.install_locn_party_number','party_id','.install_locn_site_number',party_id)
        })
        //------------- install party update lov changes ends here ------------


        //------------- Bill to update lov changes starts here ------------
        // $(document).on('select2:select','.billto_locn_party_number ',function (e) {
        //     $(".billto_locn_site_number").val(null).trigger("change"); 
        //     $(".billto_locn_address ").val(null).trigger("change"); 
        //     let post_data = {'party_id':$('.billto_locn_party_number option:selected').val() }
        //     self.initSelect2('.billto_locn_site_number','/install_base/party_site_lov/number',0,post_data)
        // })

        $(document).on('select2:select','.billto_locn_site_number ',function (e) {
            $(".billto_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.billto_locn_site_number option:selected').val() }
            self.initSelect2('.billto_locn_address ','/install_base/location_lov',0,post_data)
        })

        $(document).on('select2:select','.BILL_PARTY',function (e) {
            console.log('BILL_PARTY lov intiated')
            party_id = e.target.value
            $(".billto_locn_site_number").val(null).trigger("change"); 
            $(".billto_locn_address ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'BILL_PARTY','BILL_TO')
            post_data = {'site_party_type': 'BILL_TO','org_id':self.cur_org_id}
            self.intiPartySiteLov('.billto_locn_party_number','party_id','.billto_locn_site_number',party_id,post_data)
        })
        //------------- Bill to  party update lov changes ends here ------------

        

        //------------- Ship to update lov changes starts here ------------
        // $(document).on('select2:select','.shipto_locn_party_number ',function (e) {
        //     $(".shipto_locn_site_number").val(null).trigger("change"); 
        //     $(".shipto_locn_address ").val(null).trigger("change"); 
        //     let post_data = {'party_id':$('.shipto_locn_party_number option:selected').val() }
        //     self.initSelect2('.shipto_locn_site_number','/install_base/party_site_lov/number',0,post_data)
        // })

        $(document).on('select2:select','.shipto_locn_site_number ',function (e) {
            $(".shipto_locn_address ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.shipto_locn_site_number option:selected').val() }
            self.initSelect2('.shipto_locn_address ','/install_base/location_lov',0,post_data)
        })

        $(document).on('select2:select','.SHIP_PARTY',function (e) {
            let party_id = e.target.value
            $(".shipto_locn_site_number").val(null).trigger("change"); 
            $(".shipto_locn_address ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'SHIP_PARTY','SHIP_TO')
            post_data = {'site_party_type': 'SHIP_TO','org_id':self.cur_org_id}
            self.intiPartySiteLov('.shipto_locn_party_number','party_id','.shipto_locn_site_number',party_id,post_data)
        })
        //------------- Ship to  party update lov changes ends here ------------

        //--- owner party
        $(document).on('select2:select','.OWNER_PARTY',function (e) {
            let party_id = e.target.value
            $(".OWNER_ACCOUNT_NUMBER").val(null).trigger("change"); 
            $(".OWNER_NAME ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'OWNER_PARTY','OW')
            
            self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_ACCOUNT_NUMBER',party_id,'number')
            self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_NAME',party_id,'name')
        })


        $(document).on('select2:select','.OWN_IB_PARTY',function (e) {
            ou_data =  self.get_party_info(e.target.value,'','ASSOC')
        })
    },
    async initAddLovs(){
        console.log('tetttttttttttttt')
        self.lookupLov('PARTY_TYPE','.OWNER_PARTY_TYPE')
        await self.initSelect2('.OWNER_PARTY_NAME','/install_base/party_lov/name',3)
        await self.initSelect2('.OWNER_PARTY_NUMBER','/install_base/party_lov/number',3)

        self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_ACCOUNT_NUMBER',null,'number')
        self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_NAME',null,'name')

        // Current location LOVs
        self.lookupLov('CSI_EIB_FIELD_LOCATION_TYPE','.CURR_LOCN_TYPE')
        await self.initSelect2('.CURR_LOCN_PARTY_NAME','/install_base/party_lov/name',3)
        await self.initSelect2('.CURR_LOCN_PARTY_NUMBER','/install_base/party_lov/number',3)

        // Install location LOVs
        self.lookupLov('CSI_EIB_FIELD_LOCATION_TYPE','.INS_LOCN_TYPE')
        await self.initSelect2('.INS_LOCN_PARTY_NAME','/install_base/party_lov/name',3)
        await self.initSelect2('.INS_LOCN_PARTY_NUMBER','/install_base/party_lov/number',3)

        self.initSelect2('.MAPPED_ORGANIZATION_NAME','/install_base/ou_lov')

        $(document).on('select2:select','.OWN_IB_PARTY',function (e) {
            let party_id = e.target.value
            $(".OWNER_ACCOUNT_NUMBER").val(null).trigger("change"); 
            $(".OWNER_NAME ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'OWNER_PARTY','OW')
            
            self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_ACCOUNT_NUMBER',party_id,'number')
            self.initCustomerLov('.OWNER_PARTY_NUMBER','party_id','.OWNER_NAME',party_id,'name')
            
            self.get_party_info(party_id,'CUR_PARTY')
            let post_data = {'party_id':party_id }
            self.initSelect2('.CURR_LOCN_SITE_NUMBER','/install_base/party_site_lov/number',0,post_data)

            // $('.CURR_LOCN_PARTY_NAME ').append(new Option(party_id, view_data.OWNER_PARTY_ACCOUNT_ID, true, true))
            // $('.CURR_LOCN_PARTY_NUMBER').append(new Option(party_id, view_data.OWNER_PARTY_ACCOUNT_ID, true, true))

        })


        //------------- cur party update lov changes starts here ------------
        $(document).on('select2:select','.CURR_LOCN_PARTY_NUMBER ',function (e) {
            $(".curr_locn_site_number").val(null).trigger("change"); 
            $(".CURR_LOCN_ADDRESS ").val(null).trigger("change"); 
            let post_data = {'party_id':$('.CURR_LOCN_PARTY_NUMBER option:selected').val() }
            self.initSelect2('.CURR_LOCN_SITE_NUMBER','/install_base/party_site_lov/number',0,post_data)
        })

        $(document).on('select2:select','.CURR_LOCN_SITE_NUMBER ',function (e) {
            $(".CURR_LOCN_ADDRESS ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.CURR_LOCN_SITE_NUMBER option:selected').val() }
            let sel_party_siteid = $('.CURR_LOCN_SITE_NUMBER option:selected').val()
            self.populateSiteInfo(e,sel_party_siteid)
            self.initSelect2('.CURR_LOCN_ADDRESS ','/install_base/location_lov',0,post_data)
        })

        $(document).on('select2:select','.CUR_PARTY',function (e) {
            party_id = e.target.value
            $(".CURR_LOCN_SITE_NUMBER").val(null).trigger("change"); 
            $(".CURR_LOCN_ADDRESS ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'CUR_PARTY')
            self.intiPartySiteLov('.CURR_LOCN_PARTY_NUMBER','party_id','.CURR_LOCN_SITE_NUMBER',party_id)
        })
        //------------- cur party update lov changes ends here ------------


        
        $(document).on('select2:select','.INS_LOCN_TYPE',function (e) {
            let party_type = e.target.value
            if(party_type=='HZ_PARTY_SITES'){
                $('.INS_FIELDS').removeClass('d-none')
            }else{
                $('.INS_FIELDS').addClass('d-none')
            }
            console.log(party_type+' selected')
        })

        
        //------------- install party update lov changes starts here ------------
        $(document).on('select2:select','.INS_LOCN_PARTY_NUMBER ',function (e) {
            $(".INS_LOCN_SITE_NUMBER").val(null).trigger("change"); 
            $(".INS_LOCN_ADDRESS ").val(null).trigger("change"); 
            let post_data = {'party_id':$('.INS_LOCN_PARTY_NUMBER option:selected').val() }
            self.initSelect2('.INS_LOCN_SITE_NUMBER','/install_base/party_site_lov/number',0,post_data)
        })

        $(document).on('select2:select','.INS_LOCN_SITE_NUMBER ',function (e) {
            $(".INS_LOCN_ADDRESS ").val(null).trigger("change"); 
            let post_data = {'party_site_id':$('.INS_LOCN_SITE_NUMBER option:selected').val() }
            self.initSelect2('.INS_LOCN_ADDRESS ','/install_base/location_lov',0,post_data)
        })

        $(document).on('select2:select','.INS_PARTY',function (e) {
            party_id = e.target.value
            $(".INS_LOCN_SITE_NUMBER").val(null).trigger("change"); 
            $(".INS_LOCN_ADDRESS ").val(null).trigger("change"); 
            let ou_data =  self.get_party_info(e.target.value,'','INS')
            self.intiPartySiteLov('.INS_LOCN_PARTY_NUMBER','party_id','.INS_LOCN_SITE_NUMBER',party_id)
        })
        //------------- cur party update lov changes ends here ------------
        
    },
    // async get_account_info(account_number,prefix='CURR'){
    //     var url = '/install_base/get_account_info/' + account_number;
    //     let resp;
    //     const data =  await axios.get(url)
    //         .then(response => {
    //             resp = response.data.data
    //             let selectedOption = {
    //                 id: resp.party_id,
    //                 text:  resp.party_name
    //               };
    //             if(type=='OWNER'){
    //                 $('.ASSOC_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
    //                 selectedOption['text'] = resp.party_number
    //                 $('.ASSOC_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
    //             }else{
    //                 $('.'+prefix+'_LOCN_PARTY_NAME').append(new Option(selectedOption.text, selectedOption.id, true, true))
    //                 selectedOption['text'] = resp.party_number
    //                 console.log('selectedOption====>',selectedOption)
    //                 $('.'+prefix+'_LOCN_PARTY_NUMBER').append(new Option(selectedOption.text, selectedOption.id, true, true))
    //             }
    //             return resp
    //         })
    //         .catch(e => {
    //             console.log(e)
    //         });
    //     return data
    // },
    initSerialNum(){
        let inv_item_id = $(".ITEM_CODE").val()
        let post_params = {}
        // $('.SERIAL_NUMBER').select2('destroy')
        $('.SERIAL_NUMBER').select2({
            ajax: {
              url: '/install_base/serial_num_lov',
              dataType: 'json',
              headers: { "X-CSRFToken": csrf_token },
              contentType:"application/json; charset=utf-8",
              type: "POST",
              data: function (term) {
                  post_params['q']  = term.term
                  post_params['inv_item_id'] = inv_item_id
                  return (JSON.stringify(post_params))
              },      
              processResults: function (data) {
                //There is my solution.Just directly manipulate the data
                $.each(data.items, function(i, d) {
                    data.items[i]['id'] = d.val_id;
                    data.items[i]['text'] = d.text;
                });
                return {
                    results: data.items
                };
            }                          
            },
            minimumInputLength: 0,
            tags: true
        });

    },
    addOpenIframePage(){
                
        var tabOpenKey = 'tab_open_count_install_base';
        
        if (localStorage.getItem(tabOpenKey) == null){
            localStorage.setItem(tabOpenKey,"1");
            var tabCount = 1;    
        } else {
            var i =  parseInt(localStorage.getItem(tabOpenKey));
            localStorage.setItem(tabOpenKey,++i);
            var tabCount = i;    
        }

       var data = ['createTab', 'Create Install Base'  , '/install_base/action/add' , 'addinstallbase' , true ]
       var event = new CustomEvent('addOpenIframePage', { detail: data })
       window.parent.document.dispatchEvent(event)
    //    alert();
    },
    closePage(){
        setTimeout(function(){
            data = ['/install_base','install_base']
            var event = new CustomEvent('refresTabPage', { detail: data })
            window.parent.document.dispatchEvent(event)
        }, 100);
        setTimeout(function(){
            var event = new CustomEvent('closeTab', {
                detail: ['addinstallbase',['/install_base/','install_base'] ]
            })
            window.parent.document.dispatchEvent(event)
        }, 150);
    },
    addOpUnit(){
        self.ldStep('#add_opunits','#op_list')
        $("#save_op_unit").prop("disabled", false);
    },
    get_location_info(e,loc_id){
        self = this
        var url = '/install_base/get_location_info/' + loc_id;
        let resp;
        data = axios.get(url)
            .then(response => {
                resp = response.data.data
                console.log('resp====>',resp)
                let full_address = resp['address1']+' '+resp['address2']+' '+resp['address3']+' '+resp['address4']+' '+resp['city']+' '+resp['country']
                if(self.instance_action=='edit'){
                    $(e.target).parent('dd').find('.full_addr').remove()
                    $(e.target).parent('dd').append('<span class="full_addr">'+full_address+'</span>')
               }else{
                    $(e.target).parent('div').find('.full_addr').remove()
                    $(e.target).parent('div').append('<span class="full_addr">'+full_address+'</span>')
               }
                return resp
            })
            .catch(e => {
                console.log(e)
            });
    },
    populateSiteInfo(e,sel_party_siteid){
        console.log($(e.target))
        self = this
        axios.get("/install_base/get_partysite_info/"+sel_party_siteid).then(response => {
            let resp_data = response.data
            $(e.target).parent().find('span.site_info').text(resp_data.site_use_code+' - '+resp_data.ou_name)
            return resp
        })
        .catch(e => {
            // HideLoading()
        });
    },
    refreshTbl(){
        window.location.reload(true);

        // self.initializeVinTable()
    }
})