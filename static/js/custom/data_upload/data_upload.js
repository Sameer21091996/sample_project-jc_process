
vAppProperties.data = Object.assign(vAppProperties.data, {
  clkedRequestTr : null,
  trData:null,
  clickedtempid:null,
  clickedRow:null,
  datatypeOptions:null
})
vAppProperties.mounted = function () {
  self = this
  self.initTemplateLov()
  self.gettempData()
  self.gettempnameData()
  $(document).on('click', '#templateTbl tbody tr .view_upload', function () {
    self.trData = templatedeffTable.row($(this).closest('tr')).data();
    //  $(this).closest('table').DataTable().row($(this)).data();
    console.log('trData====>',self.trData)
    self.showData(self.trData)
  })

  
  $(document).on('click', '#templateTbl tbody tr .refresh_data', function () {
    self.trData = templatedeffTable.row($(this).closest('tr')).data();
    self.clkedRequestTr = self.trData
    //  $(this).closest('table').DataTable().row($(this)).data();
    console.log('trData====>',self.trData)
    self.getRequestStatus(self.trData)
  })
  

  $(document).on('click','#templatenameTbl tbody tr',function(){
      self.clickedRow = $(this)
      let tempTrData = $(this).closest('table').DataTable().row($(this)).data();
      console.log('tempTrData====>',tempTrData)
      self.clickedtempid=tempTrData.template_id;
      // ShowLoading(['Fetching'])
  })
}
vAppProperties.methods = Object.assign(vAppProperties.methods, {
  initTemplateLov() {
    $('#template').select2({
      ajax: {
        url: '/data_upload/template_lov',
        data: function (params) {
          var query = {
            q: params.term,
            //receipt_id: $(this).parent().parent().data('id')
          }
          // Query parameters will be ?search=[term]&type=public
          return query;
        },
        processResults: function (data) {
          console.log('data===>', data)
          return {
            results: data.items
          };
        },
      },
      width: '50%'
    })
  },
  // insertdata() {

  //   var formData = new FormData();
  //   var imagefile = document.querySelector('#file');
  //   var idd = $('#template').val();

  //   formData.append("image", imagefile.files[0]);
  //   formData.append("idd", idd);
  //   bUIEP();

  //   self =this
  //   axios.post('/data_upload/', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   }).then(function (res) {
  //     unbUIEP();
  //     // $('#displayTbl').empty();
  //     // $('#displayTbl').append(res.data);
  //     self.gettempData()
  //   })

  // },
  gettempData() {
    if ($.fn.dataTable.isDataTable('#templateTbl')) {
      var api = $('#templateTbl').DataTable();
      api.destroy();
    }
    ShowLoading([
      "Fetching upload requests"
    ])

    axios.get('/data_upload/get_temp_reqs')
      .then(function (response) {
        HideLoading()

        let columns = [{
            data: 'request_id'
          },
          {
            data: 'status'
          },
          {
            data: 'request_id'
          },
          {
            data: 'template_id'
          },
          {
            data: 'template_name'
          },
          {
            data: 'creation_date'
          },
          {
            data: 'last_update_date'
          },
          {
            data: 'created_by'
          }
        ]

        // loader.showTblLoader=false;
        templatedeffTable = $('#templateTbl').DataTable({
          columns: columns,
          data: response.data.data,
          "pageLength": 10,
          order: [],
          rowId: function (a) {
            return a.los_id;
          },
          columnDefs: [{
              targets: [0],
              render: function (data, type, row) {
                actionHtml =  '<button class="btn btn-info btn-sm view_upload">View</button>';
                if(row.status=='SENT')
                  actionHtml+='&nbsp; <button class="btn btn-warning btn-sm refresh_data">Refresh</button>';
                console
                return actionHtml
              }
            },
            {
              targets: [1],
              render: function (data, type, row) {
                // console.log('data===?', data)
                if (data == "SUCCESS") return '<span class="text-success">' + data + '</span>';
                if (data == "DRAFT") return '<span class="text-info">'+data+'</span>';
                return '<span class="text-danger">' + data + '</span>';
              }
            }
          ],
          buttons: ['csv', 'excel'],
        });
        console.log(response.data)
      })
      .catch(function (response) {
        HideLoading()
        // loader.showTblLoader=false;
      })
      .finally(function (response) {
        HideLoading()
      });

  },
  onfilterbuttonclick() {
    var idd = $('#template').val();
    window.location = '/data_upload/expxls/' + idd;
  },
  insertdata() {
    self = this
    var formData = new FormData();
    var imagefile = document.querySelector('#file');
    var idd = $('#template').val();

    formData.append("image", imagefile.files[0]);
    formData.append("idd", idd);
    ShowLoading([
      "Uploading data"
    ])


    axios.post('/data_upload/uploadingdocs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(function (res) {
      HideLoading()
      // $('#displayTbl').empty();
      // $('#displayTbl').append(res.data);
      self.gettempData()
    })

  },
  showData(trData) {
    
    ShowLoading(['Fetching data']);

    if ('SUCCESS' == trData.status) {
      kedit = false;
    } else {
      kedit = true;
    }

    console.log(trData);
    console.log(kedit);
    if (kedit)
      $('.kedit').show()
    else
      $('.kedit').hide()


    self.clkedRequestTr = trData

    self.getUploadData(trData.request_id,trData.status)
  },
  getUploadData(request_id,status='SUCCESS'){
    console.log('upload status--->',status)
    axios.get('/data_upload/uploadingdocs/'+request_id)
    .then(function (res) {
      HideLoading()
      $('#tempUploadModal').modal('show')
      if ($.fn.dataTable.isDataTable('#uploadedTbl')) {
        console.log('showwww')
        $('#uploadedTbl')[0].innerHTML = "";
        $('#uploadedTbl').DataTable().destroy();
      }
      
      // var api = $('#uploadedTbl').DataTable();
      // api.destroy();
      $('#uploadedTbl').DataTable({
        // "scrollY": 350,
        // "scrollX": true,
        columns: res.data.columns,
        data: res.data.data,
        pageLength: 50000,
        destroy:true,
        "order": [],
        drawCallback: function () {
          // initDatePickr();
          //this.api().columns.adjust().draw();

        },
        initComplete: function () {
          console.log('request status=====>',status)
          if (status == 'SUCCESS' | status == 'SENT' | status == 'FAILED'){
            $('#uploadedTbl input').prop('disabled', true);
            $('#validateBtn').addClass('d-none');
          }
          
          if (status == 'SUCCESS'){ 
           $('#finBtn').addClass('d-none');
           $('#validateBtn').addClass('d-none');
          }
          if (status == 'VALIDATED'){ 
            $('#finBtn').removeClass('d-none');
            $('#validateBtn').addClass('d-none');
          }
          if (status == 'DRAFT'){ 
            $('#validateBtn').removeClass('d-none');
          }
          setTimeout(function () {
            $('#uploadedTbl').DataTable().columns.adjust().draw();
          }, 200)
          

        }
      });

      // if (res.data.valid)
      //   $('#finBtn').removeClass('d-none');
      // else
      //   $('#finBtn').addClass('d-none');


      // $('#displayTbl').empty();
      // $('#displayTbl').append(res.data);
      console.log(res)
      // alert(123)
    })
  },
  validateData(){
    self = this
    var d = self.clkedRequestTr
    console.log('d=====>',d)
    $('#validateBtn').addClass('d-none');
    ShowLoading(['Validating data'])
    axios.post("/data_upload/validate_data",d)
    .then(function(res){
      HideLoading()
        toastr.remove()
        toastr.success("Processed successfully !");
        // toastr.info(res.data.status)
        console.log('res.data.status---->',res.data.request_status)
        self.getUploadData(d['request_id'],res.data.request_status)
        self.gettempData()
		window.location = window.loction.href;
        // clkedRequestTr.click()
        // $('#saveBtn').prop('disabled',true);
    }).catch(function(err){
        HideLoading()
        $('#validateBtn').removeClass('d-none');
    })
  },
  detailtableToExcel(table='uploadedTbl',name='Uploaded Data' , filename='Uploaded Data'){
    //table='templateTbl';
    var tbl = $('#'+table).clone();
    [].slice.call($(tbl).find('td')).forEach(function(td,i){
        $(td).html($(td).find('input').val());
        $(td).html($(td).find('select').val());
		$(td).css('width','100px')
    })
    console.log(tbl)


    let uri = 'data:application/vnd.ms-excel;base64,', 
    template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><title></title><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>', 
    base64 = function(s) { return window.btoa(decodeURIComponent(encodeURIComponent(s))) },         format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p];} )}
    
    var ctx = {worksheet: name || 'Worksheet', table: tbl[0].innerHTML}
    var link = document.createElement('a');
    link.download = filename;
    link.href = uri + base64(format(template, ctx));
    link.click(); 
  },
  finalizeData(){
    self = this
    var d = self.clkedRequestTr
    $('#finBtn').addClass('d-none');
    ShowLoading(['Finalizing data'])
    axios.post("/data_upload/finalize_data",d)
    .then(function(res){
      HideLoading()
        // toastr.remove()
        toastr.success("Processed successfully !");
		    // window.location = window.loction.href;
        self.getUploadData(d['request_id'],'SENT')
        self.gettempData()
    }).catch(function(err){
        HideLoading()
        $('#finBtn').removeClass('d-none');
    })
  },
  getRequestStatus(trData){
    self = this
    var d = self.clkedRequestTr
    console.log('d====>',d)
    ShowLoading(['Fetching data status'])
    axios.post("/data_upload/get_data_status",d)
    .then(function(res){
      self.gettempData()
      HideLoading()
        // toastr.remove()
        toastr.success("Processed successfully !");
        // toastr.info(res.data)
		    window.location = window.loction.href;
        // clkedRequestTr.click()
        // $('#saveBtn').prop('disabled',true);
    }).catch(function(err){
        HideLoading()        
    })
  },
  gettempnameData(){

    if ($.fn.dataTable.isDataTable('#templatenameTbl')){
            var api = $('#templatenameTbl').DataTable();
            api.destroy();
        }
        ShowLoading(['Fetching templated'])

        
        axios.post('/data_upload/get_templates')
        .then(function (response) {
            HideLoading()
            self.datatypeOptions = response.data.datatypeOptions;
            templatenameTable = $('#templatenameTbl').DataTable( {
                columns:response.data.columns,
                data:response.data.data,
                "pageLength": 10,
                order:[],
                rowId:function(a){
                    return a.los_id;
                },
                buttons: [ 'csv', 'excel' ],
            });
            console.log(response.data)
        })
        .catch(function (response) {
            HideLoading();
            
        })
        .finally(function (response) {
          HideLoading();
            
        });
        
    },

    getTempDetails(trData){
      
      axios.get('/data_upload/gettemplatedetails?tid='+trData.template_id)
      .then(function(res){
          HideLoading();
          $('#tempDefModal').modal('show');
          if ($.fn.dataTable.isDataTable('#templatedetailtbl')){
              var api = $('#templatedetailtbl').DataTable();
              api.destroy();
              $('#templatedetailtbl')[0].innerHTML  ="";
          }
          console.log(res.data)
          // $('#templatedetails').append(res.data);
          $('#templatedetailtbl').DataTable({
              columns:res.data.columns,
              data:res.data.data,
              pageLength:1000,
              "order": [],
              drawCallback:function(){
          //this.api().columns.adjust().draw();
                  // console.log(this);
                  $(this.api().table().body()).addClass("connectedSortable");
                  $tabs = $(".tabbable");
                  $( "tbody.connectedSortable" )
                      .sortable({
                          connectWith: ".connectedSortable",
                          items: "> tr[role=row]",
                          appendTo: $tabs,
                          helper:"clone",
                          zIndex: 999990,
                          start: function(){ 
                              $tabs.addClass("dragging") 
                          },
                          stop: function(){
                              $tabs.removeClass("dragging");
                              var d = {
                                  seq:[].slice.call($('#templatedetailtbl tr td:nth-child(1) ')).map(x=>$(x).text()),
                              };
                              axios.post("/excel_data_loader/updateTemplateSeq",d)
                              .then(function(res){
                                  toastr.success("Order updated")
                              })
                          }
                      })
                      .disableSelection()
                  ;
              }
          });

      })
    },
    addNewRow(){
      $('.dataTables_empty').remove()
      $('#templatedetails tbody').append('"\
      <tr class="newrow">\
          <td ><button class="btn btn-xs btn-danger" onclick="delTR(this)">x</button></td>\
          <td ><input type="text" name="name" placeholder=" - Enter Here -"/> </td>\
          <td ><select type="text" name="datatype" placeholder=" - Enter Here -">'+self.datatypeOptions+' </select></td>\
          <td ><input type="number" name="length" placeholder=" - Enter Here -"/> </td>\
          <td ><input type="checkbox" name="mandatory"/> </td>\
      </tr>"'
      );
    },
    delTR(e){
        $(e).closest('tr').remove();
    },
    templatedeffaddnewrow(){
        var entrynewrows = JSON.stringify(parseTableForm('#templatedetailtbl ','tr.newrow'))
        var formData = new FormData();

        formData.append("entrynewrows", entrynewrows);
        formData.append("clickedtempid", clickedtempid);
        formData.append("length", parseTableForm('#templatedetailtbl ',' tr:not(".newrow")').length+1);
        bUIEP();

        
        
        axios.post('/data_upload/templatedeffaddnewrow', formData).then(function(res){
            unbUIEP();
            // $('#displayTbl').empty();
            // $('#displayTbl').append(res.data);
            clickedRow.click();
        })

    }

})