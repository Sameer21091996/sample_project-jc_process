function initDT(id, settings, { hiddenColumnsIndexes = [], renameColumnTitles = [], excelExport = false, requiredColumns = [] } = {}) {
  
  // renameColumnTitles.forEach((obj) => {
  //   settings.columns[obj.index].title = obj.title;
  // });
  if ($.fn.dataTable.isDataTable(id)) {
    var api = $(id).DataTable();
    try {
      api.clear().destroy();
    } catch (error) {
      //$(id).DataTable().fnDestroy();
      $(id).html('')
      console.log('COULDNT DESTROY')
    }
  }
  // if (settings.columnSearch) {
  //   settings.initComplete = function () {
  //     $(this).find("tfoot").remove();
  //     $(this).find("thead").after("<tfoot/>");
  //     $(this).find("tfoot").append("<tr/>");
  //     $(this)
  //       .find("tfoot tr")
  //       .append(
  //         settings.columns
  //           .map((x, i) =>
  //             hiddenColumnsIndexes.includes(i)
  //               ? ""
  //               : x.title.trim() == "Action"
  //                 ? "<th></th>"
  //                 : "<th>" +
  //                 '<input class="w-100" type="text" placeholder="Search" />' +
  //                 "</th>"
  //           )
  //           .join("")
  //       );
  //     $(this).find("tfoot").addClass("filters");
  //     var api = this.api();
  //     api
  //       .columns()
  //       .eq(0)
  //       .each(function (colIdx) {
  //         $(
  //           "input",
  //           $(".filters th").eq($(api.column(colIdx).header()).index())
  //         )
  //           .off("keyup change")
  //           .on("change", function (e) {
  //             $(this).attr("title", $(this).val());
  //             var regexr = "({search})";
  //             //  $(this).parents('th').find('select').val();

  //             api
  //               .column(colIdx)
  //               .search(
  //                 this.value != ""
  //                   ? regexr.replace("{search}", "(((" + this.value + ")))")
  //                   : "",
  //                 this.value != "",
  //                 this.value == ""
  //               )
  //               .draw();
  //           })
  //           .on("keyup", function (e) {
  //             e.stopPropagation();
  //             var cursorPosition = this.selectionStart;
  //             $(this).trigger("change");
  //             $(this)
  //               .focus()[0]
  //               .setSelectionRange(cursorPosition, cursorPosition);
  //           });
  //       });
  //   };
  // }

  // if (hiddenColumnsIndexes.length) {
  //   if (Object.keys(settings).includes("columnDefs")) {
  //     settings.columnDefs.push({ targets: hiddenColumnsIndexes, visible: false });
  //   } else {
  //     settings["columnDefs"] = [
  //       { targets: hiddenColumnsIndexes, visible: false },
  //     ];
  //   }
  // }
  // if (requiredColumns.length) {
  //   columns = columns.map(column => {
  //     if (requiredColumns.includes(column.title)) {
  //       return {
  //         ...column,
  //         title: column.title + " *"
  //       };
  //     }
  //     return column;
  //   });
  // }

  // if (excelExport) {
  //   settings = {
  //     ...settings,
  //     dom: "Bfrtip",
  //     buttons: [
  //       {
  //         extend: "excelHtml5",
  //         text: "Export excel",
  //         exportOptions: {
  //           columns: ":visible",
  //         },
  //         className: "btn btn-primary",
  //       },
  //     ],
  //   };
  // }
  $(id).DataTable(settings);


  $(id).DataTable().settings().init()['columns'] = settings.columns;

}

function newAddRowInDT(id, data, removeBtnId) {
  console.log(data);
  var table = $(`#${id}`).DataTable();
  table.rows.add([data,]).draw();

} 

function removeRowFromDataTable(button){
  var table = button.closest('table');
  var tr = button.closest('tr');
  tr.setAttribute('data-deleterow', 'TRUE');
  $(table).DataTable().row('tr[data-deleterow="TRUE"]').remove().draw();
}

function getFormValue(formId) {
  return [].slice
      .call($("#" + formId).find("input, select, textarea"))
      .filter((x) => x.value)
      .reduce(function (obj, item) {
          obj[item.name] = item.value?.trim() || '';
          return obj;
      }, {});
}

function getTableFieldsDataWithSelect(id) {
  var dtApi = $(id).DataTable()
  return [].slice.call($(id + " tbody tr")).map(function (e, i) {
    var rowData = dtApi.row(e).data();
    [].slice
      .call($(e).find("input,select"))
      .reduce(function (obj, item) {
        if (item.type === "checkbox") {
          if (item.checked) {
            rowData[item.name] = "Y";
          } else {
            rowData[item.name] = "N";
          }
        } else {
          rowData[item.name] = $(item).hasClass("select2") || $(item).hasClass('select2_field')
            ? $(item).select2("data")[0]
            : item.value;
        }
        return rowData;
      }, {});
      return rowData
  });
}

function initSelect2(){
  $('select').each(function(){
    if (!$(this).attr('data-select2-id')){
      $(this).select2()
    }
  })
}

function setSelectValues(formId, data) {
  $("#" + formId)
    .find("select")
    .each((index, item) => {
      let name = item.name;
      let value = data[name.toLowerCase()];
      let select = $(`select[name=${name}]`);
      let option = new Option(value, value, true, true);
      select.append(option).trigger("change");
      select.trigger({
        type: "select2:select",
        params: {
          data: { text: value, id: value },
        },
      });
    });
}

function setFormValues(data, id) {

  var dates = [].slice
    .call($("#" + id).find("input.flatpickr-input"))
    .map((item) => {
      if (data[item["name"].toLowerCase()]) {
        console.log("First If me");
        data[item["name"].toLowerCase()].split(" ")[1] != "00:00:00"
          ? $(`input[name=${item.name}]`).val(
            moment(data[item["name"].toLowerCase()]).format(
              "DD-MMM-YYYY HH:mm:SS"
            )
          )
          : $(`input[name=${item.name}]`).val(
            moment(data[item["name"].toLowerCase()]).format("DD-MMM-YYYY")
          );
      } else {
        console.log("second if me");
        $(`input[name=${item.name}]`).val("");
      }
    });
  setSelectValues(id, data);

  var inputs = [].slice.call($("#" + id).find("input")).map((item) => {
    $(`input[name=${item.name}]`).val(data[item["name"].toLowerCase()]);
  });
  var textarea = [].slice.call($("#" + id).find("textarea")).map((item) => {
    var textarea = $(`textarea[name=${item.name}]`);
    textarea.val(data[item["name"].toLowerCase()]);

  });
}

function validateMandatorySelect2(id) {
  const mandatoryFields = [];
  const mandatoryFieldsInputs = [];
  var raiseError = false;
  Object.values(
    $(`${id} .text-danger`)
      .closest(".form-group:visible")
      .find("select")
      .map((i, x) => x.name)
  ).forEach((item) => {
    if (typeof item === "string") {
      const selectField = $(`select[name=${item}]`);
      const valueeeee = selectField.val();
      if (valueeeee == "") {
        raiseError = true;
        selectField.closest(".form-group").addClass("text-danger");
        !mandatoryFields.includes(item) && mandatoryFields.push(item);
        console.log(mandatoryFields, "Select wali list");
      }
      selectField.on("select2:select", function () {
        selectField.closest(".form-group").removeClass("text-danger");
      });
    }
  });

  Object.values(
    $(`${id} .text-danger`)
      .closest(".form-group:visible")
      .find("input")
      .map((i, x) => x.name)
  ).forEach((item) => {
    if (typeof item === "string") {
      const selectField = $(`input[name=${item}]`);
      if (!selectField.val()) {
        raiseError = true;
        selectField.closest(".form-group").addClass("text-danger");
        !mandatoryFieldsInputs.includes(item) &&
          mandatoryFieldsInputs.push(item);
      }
      selectField.on("input", function () {
        if (selectField.val()) {
          selectField.closest(".form-group").removeClass("text-danger");
        } else {
          selectField.closest(".form-group").addClass("text-danger");
        }
      });
    }
  });
  Object.values(
    $(`${id} .text-danger`)
      .closest(".form-group:visible")
      .find("textarea")
      .map((i, x) => x.name)
  ).forEach((item) => {
    if (typeof item === "string") {
      const selectField = $(`textarea[name=${item}]`);
      if (!selectField.val()) {
        raiseError = true;
        selectField.closest(".form-group").addClass("text-danger");
        !mandatoryFieldsInputs.includes(item) &&
          mandatoryFieldsInputs.push(item);
      }
      selectField.on("textarea", function () {
        if (selectField.val()) {
          selectField.closest(".form-group").removeClass("text-danger");
        } else {
          selectField.closest(".form-group").addClass("text-danger");
        }
      });
    }
  });
  return raiseError;
}

function initCommonSelect2(){
    console.log('from common/base.js initCommonSelect2');
    $('select.select2_field').each(function(){
     
      if (!$(this).attr('data-select2-id')){
        console.log('this val---->',$(this).val())
        console.log('action----<',$(this).attr('name'))
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
                  url: "/pricelist/lovs/",
                  type: "POST",
                  dataType: "json",
                  delay: 250,
                  beforeSend: function (xhr, settings) {
                    $(".select2-results__options").empty();
                    if (!this.crossDomain) {
                      xhr.setRequestHeader("X-CSRFToken",'{{ csrf_token }}');
                    }
                  },
                  data: function (params) {
                    if ($(".select2-results").find(".search-loader").length == 0) {
                      $(".select2-results").append(
                        '<div class="d-flex search-loader justify-content-center p-2"><div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div></div>'
                      );
                    }
                    let context;
                    if (typeof getSelect2ContextData == 'function'){
                      context = getSelect2ContextData(this)
                    }
                    else{
                      context = {}
                    }
                    context = JSON.stringify(context)
                    const name = this.attr("name");
                    const returnData = {
                      context: context,
                      q: params.term, // search term
                      page: params.page,
                      text: $(this).data("text"),
                      id: $(this).data("id"),
                      action: name,
                      //sr_no: $(this).closest("tr").index() + 1,
                    }
                    return returnData;
                  },
                  cache: true,
                  processResults: function (data, params) {
                    $(".search-loader").remove();
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
  }



  function ShowDIV(msgs)
  { 
    // $("body").addClass("loading"); 
  
    showloader();
  
    if (msgs !=undefined){
      var html = '<div class="dropping-texts"><div>'+msgs.join('</div><div>')+'</div></div>';
      // $('.jquery-loading-modal').css('display','block');
      $('.jquery-loading-modal__text').empty().append(html);
    }
  
  }    
  function HideDIV(msgs,callback,msgTimeout)
  {   
    if (msgs !=undefined){
      var html = '<div class="dropping-texts"><div>'+msgs.join('</div><div>')+'</div></div>';
      if (msgTimeout == undefined) msgTimeout = 2000;
      // $('.jquery-loading-modal').css('display','block');
      $('.jquery-loading-modal__text').empty().append(html);
        setTimeout(function(){
          hideloader()
          callback();
        },msgTimeout*msgs.length);
        return;
    }
  
      hideloader()
  
    // $("body").removeClass("loading"); 
  
  
  }