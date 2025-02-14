let globalProductDataCache = {};

const searchProductWithFilters = () => {
  $("#product-view-tabs-container").addClass("d-none");
  var formData = {};
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  globalProductDataCache = { [inventory_item_id]: {} };
  $("#product-360-filter-form input").each(function () {
    formData[$(this).attr("name")] = $(this).val();
  });
  formData["tab"] = "part";
  ShowLoading(['Loading...',])
  $("#part-detail-tab-li").click();
  axios
    .post(`{% url 'product:item-360-detail-api'%}`, formData, {
      headers: {
        "X-CSRFTOKEN": "{{ csrf_token }}",
      },
    })
    .then(function (response) {
      $("#product-view-tabs-container").removeClass("d-none");
      $.each(response.data.data?.item_data, function (key, value) {
        $('#product-detail-view-form [name="' + key + '"]').val(value);
      });
      $.each(response.data.data?.item_data, function (key, value) {
        $('#product-main-fields-section [name="' + key + '"]').val(value);
      });
      $("#barcode-filter-input").val(response.data.data?.item_data?.barcode);
      $("#inventory_item_id-filter-input").val(
        response.data.data?.item_data?.item_code
      );
      $("#quantity-filter-input").val(response.data.data?.item_data?.quantity);
      initDataTable("#product-stock-price-list-table", {
        data: response.data.data?.item_data?.price_list,
        columns: response.data.columns?.columns_pricelist,
        searching: false,
        paging: false,
        info: false,
      });
      getRelationshipsTabData();
      HideLoading();

    })
    .catch(function (error) {
      HideLoading();

      toastr.error(error.response.data.msg);
      console.log("error in api call", error);
    });
};

const updateRemark = (e) => {
  const inventory_item_id = $("#inventory_item_id-inputtttt").val();
  const remarks = $("#product-remarks").val();
  ShowLoading(['Loading...',])

  axios
    .put(
      `{% url 'product:update_item_remarks' %}`,
      {
        remarks,
        inventory_item_id,
      },
      {
        headers: {
          "X-CSRFTOKEN": "{{ csrf_token }}",
        },
      }
    )
    .then((response) => {
      HideLoading();
      toastr.success(response.data.msg);

    })
    .catch((error) => {
      HideLoading();

      toastr.error(error.response.data.msg);
    });
};

const populateProductStockData = (data) => {
  $.each(data?.summary_data, function (key, value) {
    $('#product-stock-summary-container [name="' + key + '"]').val(value);
    $('#product-main-fields-section [name="' + key + '"]').val(value);
  });

  initDataTable("#product-stock-main-table", {
    columns: data.columns?.columns_main,
    data: data.data?.onhand_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
    columnDefs: [
      {
        targets: [0],
        render: (_, _1, row, meta) =>
          `<input class="form-control" onclick="getOnHandSubInventoryData()" type="radio" data-organization_id="${row.organization_id}" name="product_stock_select_flag" style="zoom: 0.5;" tabindex="-1" ></input>`,
      },
    ],
  });
  // initDataTable("#product-stock-pricelist-table", {
  //   columns: data.columns?.columns_pricelist,
  //   data: data.data?.pricelist_data,
  //   searching: false,
  //   paging: false,
  //   info: false,
  // });
  initDataTable("#product-stock-subinv-locator-table", {
    data: data.data?.subinv_locator_data,
    columns: data.columns?.columns_subinv_locator,
    searching: false,
    paging: false,
    info: false,
  });
  // initDataTable("#product-stock-default-subinv-locator", {
  //   data: data.data?.default_subinv_locator_data,
  //   columns: data.columns?.columns_default_subinv_locator,
  //   searching: false,
  //   paging: false,
  //   info: false,
  // });
};

const getStockTabData = (getStockFlag=false) => {

  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }

  if (!getStockFlag && typeof globalProductDataCache[inventory_item_id]["stock"] == "object") {
    return;
  }
  ShowLoading(['Loading...',])

  axios
    .post(
      `{% url 'product:item-360-detail-api'%}`,
      {
        tab: "stock",
        inventory_item_id,
        get_stock_flag: getStockFlag,
      },
      {
        headers: {
          "X-CSRFTOKEN": "{{ csrf_token }}",
        },
      }
    )
    .then(function (response) {
      globalProductDataCache[inventory_item_id]["stock"] = response.data;
      populateProductStockData(response.data);
      HideLoading();

    })
    .catch((err) => {
      HideLoading();
      console.log("errrrr 160", err);
    });
};



var glo_related_item_exists = 0;

const populateProductRelationshipData = (data) => {
  initDataTable("#related-items-selection-table", {
    columns: [
      { title: "", data: "action" },
      { title: "Related Part", data: "item_code" },
    ],
    data: data.data?.related_item_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
    sorting: false,
    columnDefs: [
      {
        targets: [0],
        render: (_, _1, row, meta) =>
          `<input class="form-control" onclick="relatedItemSelectFn()" data-related-item_inventory="${row.rel_inventory_item_id}" type="radio" name="product_related_item_select_flag" style="zoom: 0.5;" tabindex="-1" ></input>`,
      },
    ],
  });
  initDataTable("#related-items-main-table", {
    columns: data.columns?.related_items_main_table_columns,
    data: [],
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
};

const getRelationshipsTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id]["relationships"] ==
    "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "relationships",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id]["relationships"] =
          response.data;
        populateProductRelationshipData(response.data);
        glo_related_item_exists = response.data.data.related_item_data.length;
        if (glo_related_item_exists){
          $('#related_item_indication_div').removeClass('d-none');
        } else {
          $('#related_item_indication_div').addClass('d-none');
        }
        HideLoading();

      })
      .catch((err) => {
        HideLoading();

        console.log("eeee 218", err);
      });
  }
};

const relatedItemSelectFn = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  const relatedItemSelectedRow = [].slice
    .call($('[name="product_related_item_select_flag"]'))
    .filter((e) => e.checked);

  const selectedRowData = $($(relatedItemSelectedRow).closest("table"))
    .DataTable()
    .row($(relatedItemSelectedRow).closest("tr"))
    .data();

  ShowLoading(['Loading...',])

  axios
    .get(
      `{% url 'product:relateditem-stocklist-api'%}?rel_inventory_item_id=${selectedRowData.rel_inventory_item_id}`,
      {
        headers: {
          "X-CSRFTOKEN": "{{ csrf_token }}",
        },
      }
    )
    .then(function (response) {
      console.log(response.data);
      initDataTable("#related-items-main-table", {
        columns:
          globalProductDataCache[inventory_item_id]["relationships"].columns
            ?.related_items_main_table_columns,
        data: response.data.results,
        searching: false,
        paging: false,
        info: false,
        fixedHeader: true,
      });
      HideLoading();

    })
    .catch((err) => {
      HideLoading();

      console.log("eeee 251", err);
    });
};

const getOnHandSubInventoryData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  const onHandSubSelectedRow = [].slice
    .call($('[name="product_stock_select_flag"]'))
    .filter((e) => e.checked);

  const selectedRowData = $($(onHandSubSelectedRow).closest("table"))
    .DataTable()
    .row($(onHandSubSelectedRow).closest("tr"))
    .data();

    ShowLoading(['Loading...',])

  axios
    .get(
      `{% url 'product:onhand-subinventory-list-api'%}?organization_id=${selectedRowData.organization_id}`,
      {
        headers: {
          "X-CSRFTOKEN": "{{ csrf_token }}",
        },
      }
    )
    .then(function (response) {
      console.log("response.data.results", response.data.results);
      initDataTable("#product-stock-subinv-locator-table", {
        columns:
          globalProductDataCache[inventory_item_id]["stock"].columns
            ?.columns_subinv_locator,
        data: response.data.results,
        searching: false,
        paging: false,
        info: false,
        fixedHeader: true,
      });
      HideLoading();

    })
    .catch((err) => {
      HideLoading();

      console.log("eeee 251", err);
    });
};

const populatePendingOrderTabData = (data) => {
  console.log("data in populatePendingOrderTabData", data);
  initDataTable("#product-po-pending-orders-table", {
    columns: data.columns?.po_pending_orders_table_columns,
    data: data.data?.po_pending_orders_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
  initDataTable("#product-srv-pending-orders-table", {
    columns: data.columns?.srv_pending_orders_table_columns,
    data: data.data?.srv_pending_orders_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
};

const getPendingOrdersTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id]["pendingorders"] ==
    "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "pendingorders",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id]["pendingorders"] =
          response.data;
        populatePendingOrderTabData(response.data);
        HideLoading();

      })
      .catch((err) => {
        HideLoading();

        console.log("eeee 218", err);
      });
  }
};

const populatePOandSRVDetailTabData = (data) => {
  console.log("data in populatePendingOrderTabData", data);
  initDataTable("#product-po-orders-history-table", {
    columns: data.columns?.po_orders_history_table_columns,
    data: data.data?.po_orders_history_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
  initDataTable("#product-srv-orders-history-table", {
    columns: data.columns?.srv_orders_history_table_columns,
    data: data.data?.srv_orders_history_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
};

const getPOandSRVDetailTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id]["poandsrvdetails"] ==
    "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "poandsrvdetails",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id]["poandsrvdetails"] =
          response.data;
        populatePOandSRVDetailTabData(response.data);
        HideLoading();

      })
      .catch((err) => {
        HideLoading();

        console.log("eeee 218", err);
      });
  }
};

const populateSalesHistoryTabData = (data) => {
  console.log("data in populateSalesHistoryTabData", data);
  initDataTable("#product-sales-history-t1-table", {
    columns: data.columns?.sales_history_t1_columns,
    data: data.data?.sales_history_t1_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
  initDataTable("#product-sales-history-t2-table", {
    columns: data.columns?.sales_history_t1_columns.filter(col=>(col.data != 'organization_code')),
    data: data.data?.sales_by_year,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
};

const populateSalesHistoryWOSuperTabData = (data) => {
  console.log("data in populateSalesHistoryTabData", data);
  initDataTable("#product-sales-history-wosuper-t1-table", {
    columns: data.columns?.sales_history_t1_columns,
    data: data.data?.sales_history_t1_data,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
  initDataTable("#product-sales-history-wosuper-t2-table", {
    columns: data.columns?.sales_history_t1_columns.filter(col=>(col.data != 'organization_code')),
    data: data.data?.sales_by_year,
    searching: false,
    paging: false,
    info: false,
    fixedHeader: true,
  });
};

const getSalesHistoryTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id]["saleshistory"] == "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "saleshistory",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id]["saleshistory"] =
          response.data;
        populateSalesHistoryTabData(response.data);
        HideLoading();

      })
      .catch((err) => {
        console.log("eeee 218", err);
        HideLoading();

      });


  }
};

const getSalesHistoryWoSuperTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id][
      "saleshistorywosupersession"
    ] == "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "saleshistorywosupersession",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id][
          "saleshistorywosupersession"
        ] = response.data;
        populateSalesHistoryWOSuperTabData(response.data);
        HideLoading();

      })
      .catch((err) => {
        HideLoading();

        console.log("eeee 218", err);
      });
  }
};

const getTransactionTabData = () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  if (
    typeof globalProductDataCache[inventory_item_id]["transactions"] == "object"
  ) {
    return;
  } else {
    ShowLoading(['Loading...',])

    axios
      .post(
        `{% url 'product:item-360-detail-api'%}`,
        {
          tab: "transactions",
          inventory_item_id,
        },
        {
          headers: {
            "X-CSRFTOKEN": "{{ csrf_token }}",
          },
        }
      )
      .then(function (response) {
        globalProductDataCache[inventory_item_id]["transactions"] =
          response.data;
        initDataTable("#product-transactions-table", {
          columns: response.data.columns?.transaction_columns,
          data: [],
          searching: false,
          paging: false,
          info: false,
          fixedHeader: true,
        });
        HideLoading();

      })
      .catch((err) => {
        HideLoading();

        console.log("eeee 218", err);
      });
  }
};

const getTransactionsWithFilters = async () => {
  const inventory_item_id = $("#inventory_item_id-filter-input").val();
  if (inventory_item_id == "") {
    toastr.error("Item Code is required for search!!!");
    return;
  }
  const formData = {};
  $("#transaction-filters-container input").each(function () {
    formData[$(this).attr("name")] = $(this).val();
  });
  formData["tab"] = "transactions";
  formData["inventory_item_id"] = inventory_item_id;

  ShowLoading(['Loading...',])

  axios
    .post(`{% url 'product:transactions-list-api'%}`, formData, {
      headers: {
        "X-CSRFTOKEN": "{{ csrf_token }}",
      },
    })
    .then(function (response) {
      initDataTable("#product-transactions-table", {
        columns:
          globalProductDataCache[inventory_item_id]["transactions"].columns
            ?.transaction_columns,
        data: response.data,
        searching: false,
        paging: false,
        info: false,
        fixedHeader: true,
      });
      HideLoading();

    })
    .catch((err) => {
      HideLoading();

      console.log("eeee 218", err);
    });
};

const clearTransactionFilterForm = () => {
  $("#transaction-filters-container input").each(() => {
    $(this).val("");
  });
  getTransactionsWithFilters();
};