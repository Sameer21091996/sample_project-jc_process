vAppProperties.data = Object.assign(vAppProperties.data, {
   testdata: 'test',
   action: null,
   header_data: {},
   main_header_id: null,
   line_cols: null,
   pending_tbl: null,
   charge_cols: null,
   selected_pos: [],
   uploadLineData: {},
   updateArr: {
      'upload_lines': {},
      'charge_lines': {}
   },
   header_labels: null,
   upload_line_count: 0,
   c_tbl: null,
   charge_newrows: [],
   addtnl_charge: {},
   deleted_charges:[],
   attachment_line_num: '',
   permissions:[]
})

vAppProperties.mounted = async function () {
   var self = this
   
   $(document).on('click', '.view_btn', function (e) {
      let rowid = $(e.target).data('rowid')
      console.log('rowid===>', rowid)
      self.view_lcm(rowid)
   })

   $(document).on('click', '.submit_to_accountant', function (e) {
      let rowid = $(e.target).data('rowid')
      self.submitToAccount(rowid)
      table.draw()
   })
   

   self.action = action
   console.log('self.action=====>', self.action)

   if (typeof upload_line_count !== 'undefined') {
      self.upload_line_count = upload_line_count
   }
   if (self.action == 'edit') {

      self.main_header_id = main_header_id
      self.line_cols = line_cols
      self.charge_cols = charge_cols
      // console.log('line_cols====>',line_cols)
      var url = '/lcm/get_header_data/' + self.main_header_id;
      axios.get(url)
         .then(response => {
            self = this
            data = response.data.data
            self.header_data = data
            self.header_labels = response.data.header_labels

            // console.log('selected--->', self.header_labels)
            HideLoading()
            self.disable_fields()
            return response
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         })
      uploaded_files = []
      uploaded_filedetails = []
      fileServerIdArr = []
      self.initFilePond()
      console.log('active_tab====>', active_tab)
      // $(".nav nav-pills").find('[href="#'+active_tab+'"]').trigger('click')
      // $(".nav.nav-pills").find('[href="#'+active_tab+'"]').trigger('click')

      if (typeof active_tab !== 'undefined' && active_tab!='None') {
         setTimeout(function () {
            self.$refs[active_tab].click();
         }, 150)
      }
      

   }
   if(typeof permissions!='undefined'){
      self.permissions = permissions
   }

   // $("#header_div").find("ul:nth-child(3)").prepend('<li> <button type="button" class="lcm_create btn btn-warning btn-sm" style="height: 88%; line-height: 100%; padding: 3px;">Create LCM</button> <span></span> &nbsp;&nbsp; </li>')

   // $(document).on('click', '.lcm_create', function (e) {
   //   self.create_lcm_page()
   // })

   if (action == 'lcm_template') {
      // self.initSelect2('.operating_unit', '/lcm/get_ou_lov', min = 0, post_params = {})

      // $(document).on('select2:select', '.operating_unit', function (e) {
      //    cust_data = self.get_ou_info(e.target.value)
      // })

   }


   self.initPendingReceivables()

   $(document).on('click', '.po_check', function (e) {
      let selected_val = $(e.target).val()
      if ($(e.target).is(':checked')) {
         $(".selected_pos ul").append('<li class="list-group-item list-group-item-primary" id="sel_' + selected_val + '" data-ponum="' + selected_val + '" > <b>' + selected_val + ' </b><i class="rm_po fas fa-times"></i></li>')
         self.selected_pos.push(selected_val)
      } else {
         $("#sel_" + selected_val).remove()
         self.selected_pos = self.selected_pos.filter(item => item !== selected_val);
      }
      console.log('self.selected_pos ====>', self.selected_pos)
   })


   $(document).on('click', '.rm_po', function (e) {
      let selected_val = $(e.target).closest('li').data('ponum')
      console.log('selected_val====>', selected_val)
      $("#sel_" + selected_val).remove()
      self.selected_pos = self.selected_pos.filter(item => item !== selected_val.toString());
      console.log('self.selected_pos ====>', self.selected_pos)
   })



   $('#header_data_form').validate({
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
      invalidHandler: function (e, validator) {
         console.log('invaliddddd')
         //validator.errorList contains an array of objects, where each object has properties "element" and "message".  element is the actual HTML Input.
         for (var i = 0; i < validator.errorList.length; i++) {
            console.log('elem-->', $(validator.errorList[i].element))
            break;
         }
         console.log('invalod')
      }
   });

   $('.flat_datepicker').flatpickr({
      dateFormat: 'd-M-Y',
      allowInput: true
   });


   $(document).on('click', '.add_value_btn', function (e) {
      let ch_line_id = $(e.target).data('ch_line_id')
      let cell = $(this).closest('td');
      let data = self.c_tbl.row($(cell).closest('tr')).data();
      $("input[name='line_num']").val(data['line_num'])
      // console.log('ch_line_id===>',data['charge_line']['supplier_po_no'])
      $("#supplier_po_number").val(data['charge_line']['supplier_po_no'])
      $("#supplier_inv_date").val(moment(data['charge_line']['sup_inv_date']).format('DD-MMM-YYYY'))
      $("#charge_dets").ControlSidebar('toggle');
      $('#charge_dets').css('top', '50px');
      $('#charge_dets').css('height', '500px');
   })

   setTimeout(function () {
      $('#upload_lines tbody').on('change', 'input', function () {
         let cell = $(this).closest('td');
         d_tbl.cell($(cell)).data($(this).val()).invalidate();
         let data = d_tbl.row($(cell).closest('tr')).data();
         
         self.updateArr['upload_lines'][data['group_id']] = data
         self.updateLineTotal()
      });

      

   }, 300)
   

   
   $('#charge_lines').on('change', 'input,select', function () {
      let cell = $(this).closest('td');

      if ($(this).is('select')) {

         let sel_text = $("option:selected", this).text()
         let sel_val = $(this).val()
         let sel_field_text = $(this).attr('name')
         let sel_field_val = $(this).data('val_field')

         // self.c_tbl.cell($(cell)).data(sel_val).invalidate();

         let clickedRowIndex = self.c_tbl.row($(this).closest('tr')).index();
         let rowData = self.c_tbl.row(clickedRowIndex).data();
         rowData[sel_field_val] = sel_val;
         rowData[sel_field_text] = sel_text;

         if (sel_field_text == 'third_party') {
            let splitData = sel_text.split("#");
            // Get the last element
            let lastElement = splitData[splitData.length - 1];
            rowData['third_party_site'] = lastElement;
         }
         self.c_tbl.row(clickedRowIndex).data(rowData).invalidate();
         $('.flat_datepicker').flatpickr({
            dateFormat: 'd-M-Y',
            allowInput: true
         });


         cell.find('select').find('option').remove();
         let newOption = $('<option>', {
            value: sel_val,
            text: sel_text
         });
         cell.find('select').append(newOption);

         self.initCommonSelect2()
      } else {
         self.c_tbl.cell($(cell)).data($(this).val()).invalidate();
      }
      let data = self.c_tbl.row($(cell).closest('tr')).data();
      self.updateArr['charge_lines'][data['charge_line']['charge_line_id']] = data
   });


   $(document).on('click', '.save_adtnl_charges', function (e) {
      self.saveAddCharges()
   })

   $(document).on('click', '.cancel_adtnl_charges', function (e) {
      self.cancelAddCharges()
   })

   // $(document).on('select2:select', 'select[name="third_party"]', function (e) {
   //   console.log('third_party=========>',e.target.value)
   //     //cust_data = self.get_ou_info(e.target.value)
   // })

   $('.date_field').flatpickr({
      dateFormat: 'd-M-Y',
      // allowInput: true
   });

   self.initCommonSelect2()

   $(document).on( 'click', '.delete_charge', function () {
      let deleted_data = self.c_tbl.row( $(this).parents('tr') ).data()
      self.deleted_charges.push(deleted_data.line_id)
      self.c_tbl
        .row( $(this).parents('tr') )
        .remove()
        .draw();
  } );

  $(document).on( 'click', '.upload_charge_attachment', function () {
   let uploading_row = self.c_tbl.row( $(this).parents('tr') ).data()
   self.attachment_line_num = uploading_row.line_num
   // console.log('uploading_row.line_id====>',)
   self.$refs['attachments'].click()
} );

   // console.log("self.testdata===>",self.testdata)
  if(self.testdata=='test'){
   HideLoading()
   // console.log(' $(".viewlcm_div")====>', $(".viewlcm_div").length)
   $(".viewlcm_div").removeClass('d-none')
  }
}
vAppProperties.methods = Object.assign(vAppProperties.methods, {
   uploaddata() {
      self = this
      var formData = new FormData();
      var imagefile = document.querySelector('#file');

      formData.append("image", imagefile.files[0]);
      ShowLoading([
         "Uploading data"
      ])
      axios.post('/lcm/', formData, {
         headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRFTOKEN': csrf_token,
         }
      }).then(function (res) {
         HideLoading()
         resp = res.data
         if (resp.status == 'success') {
            // var event = new CustomEvent('closeTab', {
            //   detail: ['lcm', ['/lcm', 'lcm']]
            // })
            // window.parent.document.dispatchEvent(event)
            toastr.success('Successfully Uploaded')
            location.reload(true);

         } else {
            toastr.error('Uploaded failed')
         }

         // $('#displayTbl').empty();
         // $('#displayTbl').append(res.data);
         //   self.gettempData()
      })

   },
   view_lcm(row_id, query_string = null) {
      console.log('view lcm=======>', row_id)
      tab_url = '/lcm/action/edit/' + row_id + '?' + query_string
      unique_name = 'edit' + row_id
      var data = ['createTab', 'View', tab_url, unique_name, true]
      var event = new CustomEvent('addOpenIframePage', {
         detail: data
      })
      window.parent.document.dispatchEvent(event)
      // this.show_data()
   },
   show_data() {
      var self = this
      console.log('self.testdata=======>1', self.testdata)
   },
   async viewHeaderdata() {

   },
   destroyDT(selector) {
      if ($.fn.dataTable.isDataTable(selector)) {
         try {
            $(selector).DataTable().destroy();

         } catch (error) {
            console.log(error);
         }
         // $(selector).DataTable().destroy();
         $(selector).after($(selector)[0].outerHTML);
         $('[id=' + selector.replace("#", "") + ']:nth(0)').remove();
         $(selector)[0].innerHTML = '';
      }
   },
   initLineViewTbl() {

      self = this

      if (self.upload_line_count == 0) {
         $("#action_btn_div").addClass('d-none')
         return false
      }


      if ($.fn.DataTable.isDataTable('#upload_lines')) {
         self.destroyDT('#upload_lines')
         // $('#upload_lines').DataTable().destroy();
      }
      $('#upload_lines tbody').empty();
      let line_columns = self.line_cols
      
      line_columns.forEach(function (column) {
         // console.log('column.visible===>', column.visible)
         if (column.visible === 'false') {
            column.visible = false;
         }
      });
      if(typeof line_columns[0]['name']=='undefined'){
         // line_columns.unshift({
         //                     data: 'group_id',
         //                     defaultContent: '<input type="checkbox" name="delete_ids">',
         //                     class_name: 'delete_row',
         //                     orderable: false,
         //                     title:'action',
         //                     name:'action'
         //                 })

      }
      // line_columns[0]['className'] = 'update_line'

      filter_data = {
         main_header_id: self.main_header_id
      }

      $('#upload_lines').append(self.buildTheadTfoot(line_columns))
      sum_row = ''
      line_columns.forEach(function (e, i) {
         sum_row += '<th data-column=' + e.data + '></th>';
         return;
      });
      $('#upload_lines tfoot th').each( function () {
         var name = $(this).data('name');
         var title = $(this).data('title');
         // console.log('title===>',title)
         if(name!='action')
            $(this).html( '<input type="text" class="form-control" placeholder="Search '+title+'" />' );
     } );
   //   $('#upload_lines tfoot').append('<tr class="tot_row">'+sum_row+'</tr>')
     console.log('line_columns===>',line_columns)
      d_tbl = new DataTable('#upload_lines', {
         ajax: {
            url: '/lcm/api/lcm_upload_lines/?format=datatables',
            "contentType": "application/json",
            "data": function (d) {
               $.extend(d, filter_data);
            },
         },
         columns: line_columns,
         columnDefs: [{
            targets: '_all',
            orderDataType: "dom-text",
            type: 'string',
            render: function (data, type, row, meta) {
               let meta_info = meta.settings.aoColumns[meta.col]
               is_editable = meta_info.type
               field = meta_info.field
               class_name = meta_info.class_name
               field_name = meta_info.field_name
               // console.log('field_name====>', field_name)
               // return $(data).val();
               if (is_editable === 'editable') {
                  if (data == null)
                     data = ''
                  if (field == 'select2_field')
                     return '<select class="select2_field '+class_name+'"> </select>';
                  else
                     return '<input class="form-control '+class_name+'" type="text" value="' + data + '">';
               }else if(class_name=='delete_row'){
                  return '<input type="checkbox" class="line_checkbox" name="line_checkbox" value="'+data+'" readonly>'
               }

               if(field_name=='error_message'){
                  if(row['validation_flag']=='E')
                     return '<button type="button" data-toggle="popover" title="'+data+'" class="btn btn-outline-danger btn-xs pr-1 pl-1 " style="" data-original-title="Line Error"><i class="right fas fa-exclamation-triangle"></i></button>'
               }
               if(field_name=='validation_flag'){
                  let font_color = (data=='E') ? 'red' : ((data=='Y') ? 'green' : 'blue') 
                  return '<b style="color:'+font_color+'">'+data+'</b>'                     
               }
               //
               if(data!=null)
                  return '<span class="numeric-column">' + data + '</td>';
               else
                  return data

            },
            // className: 'name-column'
            // minWidth: 100
         }],
         processing: true,
         language: {
            processing: "Fetching Transactions..."
         },
         serverSide: true,
         destroy: true,
         // dom: 'Bfrtip',
         order: [
            [2, 'asc']
         ],
         createdRow: function( row, data, dataIndex){
            // console.log('data["error_message"]===>',data['error_message'])
            if( data['error_message'] !='' && data['error_message'] !=null){
               $(row).addClass('redClass');
            }
            
         },
         drawCallback: function (settings) {
            $('#lineselectAll').on('change', function () {
               if ($(this).is(":checked")) {
                  console.log('checkedd')
                  $(".line_checkbox").prop("checked", true);
               } else {
                  $(".line_checkbox").prop("checked", false);
               }
            });

            if(self.header_data['status']=='REJECTED' || self.permissions.includes('LCM_APPROVE')){
               setTimeout(function () {
                  $("#upload_lines tbody").find('input').attr('readonly', true)
               }, 150)
               
            }
         },
         "footerCallback": function ( row, data, start, end, display ) {
            var api = this.api(), data;
            self.updateLineTotal()
            
        },
        headerCallback: function (thead, data, start, end, display) {
            // $(thead).find('th').eq(0).html('<input type="checkbox" id="lineselectAll"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');
         }
         // bPaginate: true
      });
      console.log('search colssss')
      // Apply the search
      d_tbl.columns().every( function () {
            var that = this;

            $( 'input', this.footer() ).on( 'change', function () {
               if ( that.search() !== this.value ) {
                  that
                        .search( this.value )
                        .draw();
               }
            } );


      } );

   },
   updateLineTotal() {
      // Remove the formatting to get integer data for summation
      var intVal = function ( i ) {
            return typeof i === 'string' ?
               i.replace(/[\$,]/g, '')*1 :
               typeof i === 'number' ?
                  i : 0;
      };
      // Total over all pages
      total = d_tbl .column( 10).data().reduce( function (a, b) {
                           return intVal(a) + intVal(b);
                        }, 0 );
            console.log('total-------->',total)
      // Update footer
      $( d_tbl.column( 10).footer() ).html( total.toFixed(2)+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      // Total over all pages
      total = d_tbl .column( 12 ).data().reduce( function (a, b) {
                           return intVal(a) + intVal(b);
                        }, 0 );
            console.log('total-------->',total)
      // Update footer
      $( d_tbl.column( 12).footer() ).html( total.toFixed(2));

    },
   combineObjects(obj1, obj2) {
      const result = {
         ...obj1
      };
      for (const key in obj2) {
         if (obj2.hasOwnProperty(key) && obj2[key] !== null) {
            result[key] = obj2[key];
         }
      }

      return result;
   },
   getChargeLines(status) {

      self = this

      if ($.fn.DataTable.isDataTable('#charge_lines')) {
         $('#charge_lines').DataTable().destroy();
      }
      $('#charge_lines tbody').empty();
      let line_charge_columns = []
      line_charge_columns = self.charge_cols

      let charge_data_cols = {}
      line_charge_columns.forEach(function (column) {
         if (column.visible === 'false') {
            column.visible = false;
         }
         charge_data_cols[column.data] = null
      });
      console.log('charge_data_cols===>', charge_data_cols)
      line_charge_columns = line_charge_columns.concat([{
         "data": "line_id",
         "title": "ACTION"
      }])

      console.log('line_columns====>', line_charge_columns)
      filter_data = {
         main_header_id: self.main_header_id
      }




      axios.get('/lcm/api/lcm_charge_lines/?format=datatables&main_header_id=' + self.main_header_id)
         .then(response => {


            self.c_tbl = new DataTable('#charge_lines', {
               data: response.data.data,
               columns: line_charge_columns,
               columnDefs: [{
                  targets: '_all',
                  orderDataType: "dom-text",
                  type: 'string',
                  render: function (data, type, row, meta) {
                     let meta_info = meta.settings.aoColumns[meta.col]
                     is_editable = meta_info.type
                     title = meta_info.title
                     field = meta_info.field
                     // return $(data).val();
                     if (is_editable === 'editable') {
                        field_name = meta_info.field_name
                        field_text = meta_info.field_text
                        field_text_val = meta_info.field_text_val
                        class_name = meta_info.class_name
                        if (data == null)
                           data = ''
                        if (field == 'select2_field') {
                           sel_html = ''
                           sel_html += '<select class="select2_field" data-val_field="' + field_text_val + '" name="' + field_name + '" style="width:100%">'
                           if (row[field_text_val] != '' && row[field_text_val] != null) {
                              sel_html += '<option value="' + row[field_text_val] + '">' + row[field_text] + '</option>'
                           }
                           sel_html += '</select>'
                           return sel_html;
                        } 
                        else if(field_name=='sup_inv_date') {
                           let sup_date = moment(data).format('DD-MMM-YYYY')
                           console.log('sup_date===>',sup_date)
                           return '<input class="form-control '+class_name+'" name="' + field_name + '" type="text" value="' + sup_date + '">';
                        }
                        else {
                           return '<input class="form-control '+class_name+'" name="' + field_name + '" type="text" value="' + data + '">';
                        }
                     }

                     if (title == 'ACTION') {
                        let action_html = '<a class="btn-sm btn-danger delete_charge" data-ch_line_id="' + data + '" >Delete</a> &nbsp;&nbsp;'
                        action_html +=  '<a class="btn-sm btn-info upload_charge_attachment" data-ch_line_id="' + data + '" >Upload</a>'
                        return action_html
                        //<a class="btn-sm btn-info add_value_btn" data-ch_line_id="' + data + '">Add Value</a>'
                     }
                     return data
                  }
               }],
               processing: true,
               language: {
                  processing: "Fetching Transactions..."
               },
               // serverSide: true,
               destroy: true,
               // order: [[13, 'desc']]
               // bPaginate: false

               drawCallback: function (settings) {
                  self.initCommonSelect2()
                  $('.flat_datepicker').flatpickr({
                     dateFormat: 'd-M-Y',
                     allowInput: true
                  });
               }
            });
         })
         .catch(e => {
            console.log(e)
            HideLoading()
         });




   },
   // buildTheadTfoot(d, className) {
   //   $("." + className).remove()
   //   var html = ''
   //   //html += '<tfoot style="display: table-header-group;"><tr>';
   //   html = '<tr class="' + className + '">';
   //   d.forEach(function (e, i) {
   //     //html += '<th>'+e.title+'</th>';
   //     //console.log('e.title--->',e.title)
   //     html += '<th data-column=' + e.data + '></th>';
   //     return;
   //   });
   //   return html + '</tr>';
   // },
   create_lcm_page() {
      tab_url = '/lcm/create_new_lcm'
      unique_name = 'createlcm'
      var data = ['createTab', 'Create', tab_url, unique_name, true]
      var event = new CustomEvent('addOpenIframePage', {
         detail: data
      })
      window.parent.document.dispatchEvent(event)
   },
   buildTheadTfoot(d) {
      var html = ''
      //html += '<tfoot style="display: table-header-group;"><tr>';
      html = '<tfoot class="show-footer-above" ><tr>';
      d.forEach(function (e, i) {
         html += '<th data-column=' + e.data + ' data-name='+ e.name + ' data-title='+ e.title + '></th>';
         return;
      });
      // console.log('html===>',html)
      return html + '</tr></tfoot>';

   },
   initPendingReceivables() {
      self = this
      filter_data = {
         'action_type': 'action_type'
      }
      columns = [{
            data: 'po_number'
         },
         {
            data: 'po_number'
         },
         {
            data: 'po_status'
         },
         {
            data: 'vendor_name'
         },
         {
            data: 'vendor_site_code'
         },
         {
            data: 'po_amount'
         },
         {
            data: 'org_name'
         },
         {
            data: 'po_type'
         },
         {
            data: 'po_qty'
         },
         {
            data: 'po_shipped_qty'
         },
         {
            data: 'po_received_qty'
         },
         {
            data: 'po_remaining_qty'
         },
      ]
      // console.log('self.buildTheadTfoot(columns)===>',self.buildTheadTfoot(columns))
      $('#pending_receivables').append(self.buildTheadTfoot(columns))
      var pending_tbl = new DataTable('#pending_receivables', {
         ajax: {
            url: '/lcm/api/pending_receivables_list/?format=datatables',
            "contentType": "application/json",
            "data": function (d) {
               return $.extend(d, filter_data);
            },
         },
         columns: columns,
         columnDefs: [{
            targets: [0],
            data: null,
            render: function (data, type, row, meta) {
               let newRowContent = '<input type="checkbox" name="po_check" class="po_check" value="' + data + '">'
               return newRowContent
               // newRowContent = ''
               // if(row['status_flag']=='SUCCESS') 
               //     newRowContent += 'PROCESSED'
               // else
               //     newRowContent += '<a class="btn btn-info btn btn-sm progress_refresh" data-request_id="'+row['request_id']+'"> Refresh </a>'

               // return (
               //     newRowContent
               // );
            },
         }],
         processing: true,
         language: {
            processing: "Fetching Transactions..."
         },
         serverSide: true,
         destroy: true,
         order: [
            [0, 'desc']
         ],
         searching: true,
         // bPaginate: false
         drawCallback: function (settings) {
            $(this).find('thead').after($(this).find('tfoot'))
            if ($(".dataTables_empty").length > 0) {
               //handle_empty_table();
            }
            // $(this).find('tbody').append(last_row)
            //if (show_header_filters) {
            this.api().columns().every(function (key, value) {
               var a = Math.floor(Math.random() * 11);
               var column = this;
               col_th = $(this.footer());
               search_input = col_th.find(".header_search");
               default_val = search_input.val();

               col_th.find(".select2").remove();
               col_th.find(".header_search").remove();
               if (col_th.data('column') == 'po_number') {
                  var select = $('<input type="text" placeholder="Search ' + col_th.text() + '" class="header_search ' + col_th.data('column') + '" id=' + key + a + ' style="width: 100% !important;">')
                     .appendTo($(column.footer())).on('change blur', function () {
                        var val = $.fn.dataTable.util.escapeRegex($(this).val());
                        console.log('blueeeeeee')
                        pending_tbl
                           .column(1)
                           .search(this.value)
                           .draw();

                     });
                  select.val(default_val);
               }
            });

         },
      });

      $(document).on("keyup", '#tabl_global_search', function (event) {
         pending_tbl.search(this.value).draw();
      });
   },
   initializeVinTable(filter_data = {}) {

      let columns = [{
            data: 'po_number'
         },
         {
            data: 'po_number'
         },
         {
            data: 'po_status'
         },
         {
            data: 'vendor_name'
         },
         {
            data: 'vendor_site_code'
         },
         {
            data: 'po_amount'
         },
         {
            data: 'org_name'
         },
         {
            data: 'po_type'
         },
         {
            data: 'po_qty'
         },
         {
            data: 'po_shipped_qty'
         },
         {
            data: 'po_received_qty'
         },
         {
            data: 'po_remaining_qty'
         },
      ]
      self = this
      const headers = {
         'Content-Type': 'application/json',
         "X-CSRFToken": csrf_token
      }
      ShowLoading([
         'Fetching vin list'
      ])
      axios.post("/lcm/get_vin_txns", filter_data, {
            headers: headers
         })
         .then(async response => {
            HideLoading()
            request_data = response.data['data']
            instance_details = response.data['vin_details']
            self.setAllListData(response)


            self.t1 = new DataTable('#vin_txns', {
               data: request_data,
               columns: columns,
               columnDefs: [{
                  targets: [0],
                  // className: 'dt-control',
                  orderable: false,
                  data: null,
                  defaultContent: '',
                  render: function (data, type, row, meta) {
                     const row_id = data[Object.keys(data)[0]]
                     actionCellHtml = self.action_dropdown(data, row_id)
                     return actionCellHtml;
                  },
               }],
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
                        if (title == 'Item' || title == 'Serial Number' || title == 'Owner Account Number') {
                           // Create input element
                           let input = document.createElement('input');
                           input.placeholder = title;
                           input.id = title.replace(/\s+/g, '_').toLowerCase();
                           column.footer().replaceChildren(input);

                           // Event listener for user input
                           input.addEventListener('change', (e) => {

                              if ($("#item").val() == '' && $("#serial_number").val() == '' && $("#owner_account_number").val() == '') {
                                 toastr.error('Please start search with any of these fields - Item, Serial Number or Owner account number')
                                 return false
                              }
                              if (column.search() !== this.value) {
                                 key = this.id
                                 val = this.value
                                 let filter_data = {
                                    "SERIAL_NUMBER": $("#serial_number").val(),
                                    "ITEM_CODE": $("#item").val(),
                                    "OWNER_ACCOUNT_NUMBER": $("#owner_account_number").val()
                                 }
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
   ldStep(s, h, type) {
      $(h).slideUp();
      $(s).slideDown();
   },
   nextStep() {
      self = this
      self.ldStep('#entry_body', '#listing_body')
      self.get_next_filename()
   },
   downloadTemplate(type) {

      if ($('#header_data_form')[0].checkValidity() === false) {
         $('#header_data_form').submit();
      } else {
         self = this
         var formData = new FormData();
         let form_data = $('#header_data_form').serializeArray()
         // form_data['type'] = form_data
         form_data.push({
            "name": "selected_pos",
            "value": JSON.stringify(self.selected_pos)
         })

         form_data[1]['value'] = $('.operating_unit option:selected').text().trim()
         console.log('form_data=====>', form_data)
         axios.post('/lcm/download_template', form_data, {
            headers: {
               'Content-Type': 'application/json',
               'X-CSRFTOKEN': csrf_token,
            },
            responseType: "blob"

         }).then(function (res) {

            // return false
            resp = res.data
            file_name = $("input[name='file_name']").val()
            excel_filename = file_name + '.xlsx'
            if (type == 'excel') {
               // return false
               const url = URL.createObjectURL(
                  new Blob([resp], {
                     type: "application/vnd.ms-excel"
                  })
               );
               const link = document.createElement("a");
               link.href = url;
               link.setAttribute("download", excel_filename);
               document.body.appendChild(link);
               link.click();
               toastr.success('Successfully downloaded')
               setTimeout(function () {
                  // var event = new CustomEvent('closeTab', {
                  //   detail: ['lcm', ['/lcm', 'lcm']]
                  // })
                  // window.parent.document.dispatchEvent(event)
                  self.view_lcm(file_name, 'tab=lines')
               }, 300)
               // 
               $(".new_lcm_btn").prop("disabled", true);
               HideLoading()
            } else {
               HideLoading()
               if (resp.status == 'success') {
                  $(".new_lcm_btn").prop("disabled", true);
                  toastr.success('Successfully downloaded')
               } else {
                  toastr.error('download failed')
               }
            }
            // $('#displayTbl').empty();
            // $('#displayTbl').append(res.data);
            //   self.gettempData()
         })
      }

   },
   get_next_filename() {
      var url = '/lcm/get_next_filename';
      axios.get(url)
         .then(response => {
            // self = this 
            let filename = response.data.filename
            $(".file_name").val(filename)
            return response
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         });
   },
   async initSelect2(elm, url, min = 0, post_params = {}) {
      // $(elm).select2('destroy')
      // post_params 
      $(elm).select2({
         ajax: {
            url: url,
            dataType: 'json',
            headers: {
               "X-CSRFToken": csrf_token
            },
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: function (term) {
               post_params['q'] = term.term
               return (JSON.stringify(post_params))
            },
            processResults: function (data) {
               //There is my solution.Just directly manipulate the data
               $.each(data.items, function (i, d) {
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
   get_ou_info(ou_id) {
      var url = '/lcm/get_ou_info/' + ou_id;
      let resp;
      data = axios.get(url)
         .then(response => {
            resp = response.data.data
            console.log('resp====>', resp)
            if (ou_id == 'new') {
               let selectedOption = {
                  'id': resp['operating_unit_id'],
                  'text': resp['name'],
               }
               $('.OPERATING_UNIT').append(new Option(selectedOption.text, selectedOption.id, true, true))
            }
            return resp
         })
         .catch(e => {
            console.log(e)
         });
   },
   submitToAccount(main_header_id) {
      self = this
      var url = '/lcm/submit_lcm_to_accountant/' + main_header_id;
      let resp;
      ShowLoading([
         "Submitting data"
      ])
      data = axios.get(url)
         .then(response => {
            resp = response.data

            if (resp['status'] == 'success') {
               toastr.success('Submitted successfully')
               // self.header_data.status = 'SUBMITTED'
            } else {
               toastr.error('Failed to submit')
            }
            HideLoading()
            // return resp
         })
         .catch(e => {
            HideLoading()
            console.log(e)
         });
   },
   sendToOracle() {
      self = this
      var url = '/lcm/submit_lcm_to_oracle/' + self.main_header_id;
      let resp;
      ShowLoading([
         "Confirming data"
      ])
      data = axios.get(url)
         .then(response => {
            resp = response.data
            if (resp['status'] == 'success') {
               toastr.success('confirmed successfully')
               oracle_resp = resp.oracle_resp
               self.header_data.status = oracle_resp['header_status']
               self.header_data.ship_number = oracle_resp['ship_num']
               self.header_data.ship_header_id = oracle_resp['ship_header_id']
            } else {
               toastr.error('Failed to confirm')
            }
            HideLoading()
         })
         .catch(e => {
            console.log(e)
            HideLoading()
         });
   },
   openChargeForm(rowData) {
      self.addNewChargeRow()
      // $('#chargeModal').modal('show');
      // self=this
      // self.uploadLineData = rowData
   },
   addCharge() {
      let form_data = $('#chargeForm').serializeArray()

      axios.post("/lcm/save_charges", form_data, {
            headers: {
               'Content-Type': 'application/json',
               'X-CSRFTOKEN': csrf_token,
            },
         })
         .then(async response => {
            resp = response.data
            if (resp['status'] == 'success') {
               $("#chargeModal .close").click()
               toastr.success('Updated successfully')
               self.initLineViewTbl()
            } else {
               toastr.error('Failed to update')
            }
         })

   },
   updateLcm() {
      self = this
      let upload_header_data = $("#headerData").serializeArray()
      let form_data = self.updateArr
      form_data['header_data'] = upload_header_data
      form_data['main_header_id'] = self.main_header_id
      form_data['uploaded_files'] = uploaded_files
      file_uploaded_details = {}
      for (const key in uploaded_filedetails) {
         file_uploaded_details[key] = uploaded_filedetails[key]; // key2 will appear with value null
       }
      form_data['uploaded_filedetails'] = file_uploaded_details
      form_data['deleted_charges'] = self.deleted_charges
      
      axios.post('/lcm/update_lcm', form_data, {
         headers: {
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': csrf_token,
         }
      }).then(function (res) {
         HideLoading()
         resp = res.data
         if (resp.status == 'success') {

            toastr.success('Successfully Updated')

            setTimeout(function () {
               self.refreshPage()
            }, 150)
         } else {
            toastr.error('Updation failed')
         }

         // $('#displayTbl').empty();
         // $('#displayTbl').append(res.data);
         //   self.gettempData()
      })

   },
   addNewChargeRow() {
      self = this
      var charge_counter = typeof charge_counter === 'undefined' ? parseInt($('#charge_lines tr:last td:first').text()) : charge_counter
      console.log('charge_counter===>', typeof charge_counter)
      if (isNaN(charge_counter)) {
         charge_counter = 0
      }
      charge_counter++

      let newData = {
         "line_id": 'new_' + charge_counter,
         "type": null,
         "third_party": null,
         "third_party_site": null,
         "amount": null,
         "currency": null,
         "line_num": charge_counter,
         "charge_line": {
            "charge_line_id": 'new_' + charge_counter
         },
         "charge_line.charge_line_id": 'new_' + charge_counter
      }

      let line_charge_columns = []
      line_charge_columns = self.charge_cols

      let charge_data_cols = {}
      line_charge_columns.forEach(function (column) {
         if (column.visible === 'false') {
            column.visible = false;
         }
         charge_data_cols[column.data] = null
      });

      let all_col_row_data = self.combineObjects(charge_data_cols, newData)

      self.c_tbl.row.add(all_col_row_data).draw(false)
      // self.c_tbl
   },
   initCommonSelect2() {

      $('select.select2_field').each(function () {

         if (!$(this).attr('data-select2-id')) {
            // console.log('this val---->',$(this).val())
            // console.log('action----<',$(this).attr('name'))
            // $(this).val()
            //$('.OPERATING_UNIT').append(new Option(selectedOption.text, selectedOption.id, true, true))

            $(this).select2({
               // placeholder: placeholder,
               dropdownAutoWidth: true,
               allowClear: true,
               language: {
                  inputTooShort: $("<div>Please select </div>"),
               },
               ajax: {
                  url: "/lcm/lovs",
                  type: "POST",
                  dataType: "json",
                  delay: 250,
                  beforeSend: function (xhr, settings) {
                     $(".select2-results__options").empty();
                     if (!this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrf_token);
                     }
                  },
                  data: function (params) {
                     // console.log('params====>',params)
                     return {
                        q: params.term, // search term
                        page: params.page,
                        text: $(this).data("text"),
                        id: $(this).data("id"),
                        action: this.attr("name"),
                        //sr_no: $(this).closest("tr").index() + 1,
                     };
                  },
                  cache: true,
                  processResults: function (data, params) {
                     return {
                        results: data.items,
                        pagination: {
                           more: params.page * 30 < data.total_count,
                        },
                     };
                  }
               }
            })
         }
      })
   },
   saveAddCharges() {
      $("#charge_dets").ControlSidebar('toggle');
      let clicked_line = parseInt($("#det_line_num").val())

      let firstColumnData = self.c_tbl.column(0).data().toArray();
      var rowIndex = firstColumnData.indexOf(clicked_line);
      let rowData = self.c_tbl.row(rowIndex).data();
      rowData['charge_line']['supplier_po_no'] = $("#supplier_po_number").val();
      rowData['charge_line']['sup_inv_date'] = $("#supplier_inv_date").val();
      self.c_tbl.row(rowIndex).data(rowData).invalidate();
      self.initCommonSelect2()
      console.log('rowData====>', rowData)
      self.updateArr['charge_lines'][rowData['charge_line']['charge_line_id']] = rowData

   },
   cancelAddCharges() {
      $("#charge_dets").ControlSidebar('toggle');
   },
   initFilePond() {
      pond = $('.pond').filepond();

      $('.pond').filepond('allowMultiple', true);
      $('.pond').filepond('labelIdle', 'Drop other files here<br><b>Document Upload is Optional</b>');
      $('.pond').filepond.setOptions({
         maxFileSize: '15MB',
         server: {
            url: window.location.origin,
            process: {
               url: '/fp/process/',
               headers: {
                  "X-CSRFToken": csrf_token
               },
            },
            revert: {
               url: '/fp/revert/',
               headers: {
                  "X-CSRFToken": csrf_token
               },
            },
            fetch: {
               url: '/fetch/?target=',
               headers: {
                  "X-CSRFToken": csrf_token
               },
            },
            load: {
               url: '/load/?target=',
               headers: {
                  "X-CSRFToken": csrf_token
               },
            },
         },
         onprocessfile: function (error, file) {
            console.log('File added: [' + error + ']   file: [' + file.serverId + ']');
            current_entry = $("#current_entry").val()
            if (uploaded_files[current_entry]) {
               uploaded_files[current_entry].push(file.serverId);
            } else {
               uploaded_files[current_entry] = [file.serverId];
            }
            uploaded_filedetails[file.serverId] = $.extend({}, uploaded_filedetails[file.serverId], { 'uploaded_doc_type': $(".document_type").val() });
            uploaded_filedetails[file.serverId] = $.extend({}, uploaded_filedetails[file.serverId], { 'uploaded_doc_comments': $(".document_comments").val() });
            uploaded_filedetails[file.serverId] = $.extend({}, uploaded_filedetails[file.serverId], { 'uploading_charge_line': $(".uploading_charge_line").val() });

            // uploaded_filedetails[file.serverId]['uploaded_doc_type'] =$(".document_type").val()
            // uploaded_filedetails[file.serverId]['uploaded_doc_comments'] =$(".document_comments").val()
            // $("#r_" + current_entry).parent().find('span').text('File uploaded')
            fileServerIdArr[file.id] = file.serverId
            self.updateLcm()
         },
         onremovefile: function (error, file) {
            console.log('File removed: [' + error + ']   file: [' + file.id + ']');
            console.log('full files--->', uploaded_files)
            console.log('fileServerIdArr----<', fileServerIdArr)
            current_entry = $("#current_entry").val()
            if (file.id in fileServerIdArr) {
               file_server_id = fileServerIdArr[file.id]
               delete uploaded_files[current_entry][uploaded_files[current_entry].indexOf(file_server_id)]
               delete fileServerIdArr[file.id]
               delete uploaded_filedetails[file.id]
            }

            // if (uploaded_files[current_entry].length == 0)
            //    $("#r_" + current_entry).parent().find('span').text('')

            console.log('full files--->', uploaded_files)
            console.log('fileServerIdArr----<', fileServerIdArr)
            console.log('uploaded_filedetails----<', uploaded_filedetails)
         },
         onerror: function (error, file, status) {
            console.log('File error: [' + error + ']   file: [' + file.id + '], status [' + status + ']');
            if (file.id in uploaded_files) {
               delete uploaded_files[file.id];
            }
            uploaded_error[file.id] = true;
            //updateButton();	    		
         }
      });
   },
   refreshPage() {
      self = this
      let active_tab = $('.nav.nav-pills').find('.active').attr('href')
      let updatedQueryString = '?tab=' + active_tab.replace('#', "");
      location.href = window.location.pathname + updatedQueryString;

   },
   validatelcm(){
      self =  this
      var url = '/lcm/validate_lcm/' + self.main_header_id;
      axios.get(url)
         .then(response => {
            self = this
            resp = response.data
            if (resp.status == 'success') {

               toastr.success('Validation done')
   
               setTimeout(function () {
                  self.refreshPage()
               }, 150)
            } else {
               toastr.error('Validation process failed')
            }
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         });
   },
   delete_upload_lines() {
      self = this
      var url = '/lcm/delete_upload_lines/'+self.main_header_id;
      axios.get(url)
         .then(response => {
            resp = response.data
            if (resp.status == 'success') {
               toastr.success('deleted all lines')
               setTimeout(function () {
                  self.refreshPage()
               }, 150)
            } else {
               toastr.error('Delete lines failed')
            }
         })
         .catch(e => {
            console.log(e)
            HideLoading()
            toastr.error('Process failed')
         });
   },
   download_upload_lines(){
      var url = '/lcm/download_upload_lines/'+self.main_header_id;
      axios.get(url, {
         headers: {
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': csrf_token,
         },
         responseType: "blob"

      }).then(function (res) {

         // return false
         resp = res.data
         file_name = $("input[name='file_name']").val()
         excel_filename = file_name + '.xlsx'
         let type = 'excel'
         // return false
         const url = URL.createObjectURL(
            new Blob([resp], {
               type: "application/vnd.ms-excel"
            })
         );
         const link = document.createElement("a");
         link.href = url;
         link.setAttribute("download", excel_filename);
         document.body.appendChild(link);
         link.click();
         toastr.success('Successfully downloaded')
         setTimeout(function () {
            // self.view_lcm(file_name, 'tab=lines')
         }, 300)
         // 
         // $(".new_lcm_btn").prop("disabled", true);
         HideLoading()
      })

   },
   async showLineErrors(){
      self = this
      await self.$refs['lines'].click()

      setTimeout(function () {
         $("#upload_lines > tfoot > tr > th:nth-child(1) > input").val('E')
         d_tbl.column(0).search('E').draw();
      }, 150)

   },
   poCorrectionForm(){
      $('#correctionModal').modal('show');
   },
   // handleFileChange(event){
   //    this.selectedCorrectionFile = event.target.files[0];
   // },
   sentForCorrection(){
      self = this
      const formData = new FormData();
      // formData.append('file', this.selectedFile);
      var correctionfile = document.querySelector('#po_correction_file');
      formData.append("po_correction_file", correctionfile.files[0]);

      formData.append('comments', $(".po_correction_remarks").val());
      formData.append('main_header_id', self.main_header_id);

      // let form_data = $('#correctionForm').serializeArray()

      axios.post('/lcm/sent_po_correction', formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
           'X-CSRFTOKEN': csrf_token,
         }
       })
       .then(response => {
            resp = response.data
            if (resp['status'] == 'success') {
               $("#correctionModal .close").click()
               toastr.success('Notified the user')
            } else {
               toastr.error('Failed to update')
            }
         // Handle the response as needed
       })
       .catch(error => {
         console.error('Error uploading file:', error);
         // Handle the error as needed
       });

   },
   rejectLCMForm(){
      $('#rejectModal').modal('show');
   },
   rejectLCM(){
      self = this
      const formData = new FormData();
      formData.append('comments', $(".reject_remarks").val());
      formData.append('main_header_id', self.main_header_id);

      // let form_data = $('#correctionForm').serializeArray()

      axios.post('/lcm/reject_lcm', formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
           'X-CSRFTOKEN': csrf_token,
         }
       })
       .then(response => {
            resp = response.data
            if (resp['status'] == 'success') {
               $("#rejectModal .close").click()
               toastr.success('Rejected')
               self.refreshPage()
            } else {
               toastr.error('Failed to update')
            }
         // Handle the response as needed
       })
       .catch(error => {
         console.error('Error uploading file:', error);
         // Handle the error as needed
       });
   },
   disable_fields(){
      self = this
      if(self.header_data['status']=='REJECTED' || self.permissions.includes('LCM_APPROVE')){
         console.log('rejected------>')
         setTimeout(function () {
            $("#headerData").find('input').attr('readonly', true)
         }, 150)
         
      }
   }
})


function action_dropdown(data, row_id) {
   self = this
   
   // vAppProperties.methods.test_here()
   let actionCellHtml = ''
   actionCellHtml = '<div class="btn-group">\
                 <div class="btn-group">\
                          <button type="button" class="btn btn-info btn-xs waves-effect waves-light dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                             <i class="ti-menu"></i>Action\
                          </button>'
   actionCellHtml += '<div class="dropdown-menu animated flipInY">'
   actionCellHtml += '<a class="dropdown-item view_btn" href="javascript:void(0)" data-rowid=' + row_id + '>View</a>'
   if (!self.permissions.includes('LCM_APPROVE')){
      if(data['status']=='VALIDATED' || data['status']=='REJECTED')
         actionCellHtml += '<a class="dropdown-item submit_to_accountant" href="javascript:void(0)" data-rowid=' + row_id + '>Submit to Account</a>'
   }
   actionCellHtml += "</div> </div>";
   return actionCellHtml;
}

function get_params() {
   $data = {
      "tab_status": $("#transfersTabs li a.active").data('value'),
      "filter_date_val": ($(".gl_picker").val() != '' ? $(".gl_picker").val() : '')
   };
   console.log('$data---->', $(".gl_picker").val())
   return $data;
}

function handleClick(e) {
   status = e.dataset.value
   setTimeout(function () {
      //table.search("^" + status + "$", true, false, true).draw();
      info = table.draw();
      console.log('testttt---------')
   }, 150)
}