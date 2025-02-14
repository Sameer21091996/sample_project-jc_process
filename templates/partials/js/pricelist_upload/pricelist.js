if (!Number.prototype.toFixedRound) {
    Object.defineProperty(Number.prototype, 'toFixedRound', {
        value(precision) {
            var base = 10 ** precision;
            return (Math.round(this * base) / base).toFixed(precision);
        },
    })
    }

var gloPastingFlag =false;
function initACItems(e){

    $(e).autocomplete({
            clearButton: true,
            source: function(request, response) {
                const price_list_name = $('#price_list_name').val()
                if (!price_list_name){
                    toastr.error("Please select Price List")
                    return
                }
                // alert(window.gloPastingFlag);
                
                // alert();
                $( this.element[0] ).autocomplete( "option", "appendTo",  this.element[0].nodeName == 'INPUT'? $(this.element[0]).closest('div'): $(this.element[0]).closest('table'));
                var name = this.element[0].name === undefined ? this.element[0].dataset.field_name:this.element[0].name;

                   
                $.getJSON("/pricelist/api/search_pricelist_items?pricelist="+price_list_name+"&q="+request.term.toUpperCase(), {
                    autocomplete: true,
                }, response);

            },
            minLength: 1,
            select: function( event, ui ) {
                event.preventDefault();
                var display =  ui.item.item_code === undefined ? '':ui.item.item_code;


                console.log(ui.item);
                console.log(event);

                    var line = ui.item;
                    var position = $(event.target).closest('tr').index()+1;

                    var lastElementPosition = itemLinesEntry.lines_data.length-1;

                    console.log($(event).closest('tr'));
                    console.log(position);
                    console.log('^p');
                    console.log(itemLinesEntry.lines_data.length);
                
                    

                    var obj = itemLinesEntry.getEmptyLineObj();
                    obj["vat"] = '0';
                    obj["cur_price_vat"] = '0';
                    obj["discount_perc"] =  0.0;
                    obj["discount"] =  line['discount'] || 0.0;
                    obj["qty"] =  line['quantity'] || 1;
                    obj["gross_amount"] =  parseFloat(obj["qty"]) * parseFloat(line['price']);
                    obj["line_total"] =  obj["gross_amount"] - parseFloat(obj["discount"]) + obj["vat"] 
                    obj["unit_price"] =  line['price'];
                    obj["cur_price"] =  line['price'];
                    obj["avl_qty"] =  "";
                    obj["uom"] =  line['primary_unit_of_measure'];
                    obj["item_desc"] =  line['description'];
                    obj["item_code"] =  line['item_code'];
                    obj["inventory_item_enabled_flag"] =  line['inventory_item_enabled_flag'];
                    obj["inventory_item_id"] =  line['inventory_item_id'];

                    obj["unit_selling_price"] = line['price'];
                    // obj["unit_selling_price"] = (parseFloat(obj["gross_amount"] ) - parseFloat(obj["discount"]))/parseFloat(obj["qty"])


                    obj["barcode"] =  "";
                    obj["no_#"] =  $(event).closest('tr').index()+1;
                    obj["action"] =  "";
                    obj["line_error"] =  null;
                    obj["category"] = line['category'];
                    obj["related_flag"] = 'N';


                    var itemExists = itemLinesEntry.lines_data.filter((x,i)=> i !=  itemLinesEntry.lines_data.length-1 ).map(x=>x.item_code).includes(line['item_code'] );

                    if (itemExists && itemLinesEntry.lines_data.length != 1){
                        return toastr.error("Item already exists");
                    }

                    //existing line
                    if (position != itemLinesEntry.lines_data.length){

                        itemLinesEntry.lines_data[position] = obj;

                    }
                    // input line
                    if (position == itemLinesEntry.lines_data.length){

                        itemLinesEntry.lines_data.splice(lastElementPosition,0,obj);

                        itemLinesEntry.lines_data[itemLinesEntry.lines_data.length-1] = {};

                        // alert('input line')
                    }
                           
            },
        }).focus(function() {
            $(e).autocomplete("search", $(e).val());
    }).autocomplete( "instance" )._renderItem = function( ul, item ) {
        if (gloPastingFlag) return $( "<li>" );
        console.log(item);
        // <b> Barcode :</b> ${item.barcode}<br>
        return $( "<li>" )
            .append(
                    `<div >
                        <b> Item Code : </b> ${item.item_code}<br>
                        {% comment %} <b> Description : </b> ${item.description}<br> {% endcomment %}
                    </div>`
            // "<div>" + (item.field_display_desc === undefined ? '':item.field_display_desc) +"&nbsp;&nbsp;&nbsp;"+ item.field_display_value + "</div>" 
            )
            .appendTo( ul )   ;
    };
}




function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

var typewatch = function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    }  
}();  




function addCommas(x,minimumFractionDigits) {
        if (typeof(x) == 'undefined') x='0';
        if ((x).toString().trim() == "")
            return "";
        if (isNaN(x.toString().split(',').join(""))) return "";
        var number = new Number(parseFloat(x.toString().split(',').join("")).toFixedRound(2)).toLocaleString('en-US', {minimumFractionDigits: minimumFractionDigits});
        return number;
}

var itemLinesEntry = new Vue({
    'el':'#entry-new',
    delimiters:['[[',']]'],
    data:function(){
        return {
            'showPreview':false,
            "editable_fields":['item_code','disc_by','disc_value'],
            "comma_seperated_fields":['cur_price', 'cur_price_vat', 'disc_value', 'new_price', 'new_price_vat', ],
            "comma_seperated_fields_int":[],
            "disc_excluded":[],
            "isFreezed": false,
            "vatPerc": 5,
            "columns":[
                {
                    "data":"action",
                    "title":"",
                    "visible":true,
                    "col_class":"text-left",
                    "placeholder":"",
                    "hasAggregation":false,
                    "aggregate": "",
                    "aggregateValue":""
                },
                {
                    "data":"no_#",
                    "title":"No #",
                    "visible":true,
                    "col_class":"text-left",
                    "placeholder":"",
                    "hasAggregation":false,
                    "aggregate": "",
                    "aggregateValue":""
                },
                {
                    "data":"item_code",
                    "title":"Item Code",
                    "visible":true,
                    "col_class":"text-left",
                    "placeholder":"Enter the Item Code",
                    "hasAggregation":false,
                    "aggregate": "",
                    "aggregateValue":""
                },

                {
                    "data":"cur_price",
                    "title":"Current price",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":false,
                    "aggregate": "",
                    "aggregateValue":""
                },
                {
                    "data":"cur_price_vat",
                    "title":"VAT Amt",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"disc_by",
                    "title":"Disc By",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"disc_value",
                    "title":"Disc Value",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"new_price",
                    "title":"New price",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"new_price_vat",
                    "title":"New price VAT",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"price_list_start_date",
                    "title":"Start date",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },
                {
                    "data":"price_list_end_date",
                    "title":"End date",
                    "visible":true,
                    "col_class":"text-right",
                    "placeholder":"",
                    "hasAggregation":true,
                    "aggregate": "sum",
                },

            ],
            "lines_data":[
                {}
            ],
            "customer_vat_perc": 0,
            'needValidations': true,
            'header_error': {},
            'column_aggregates': {
                gross_amount: 0, 
                discount: 0, 
                discount_perc: 0, 
                vat: 0, 
                line_total: 0,
            },
            'column_aggregates_labels': {
                gross_amount: "Lines Total (Excl VAT)", 
                // discount: "Total Adjustments", 
                // discount_perc: "Total Discount Perc", 
                vat: "VAT", 
                line_total: "Total",
            }
        }
    },
    methods:{
        parseFloatRound(number){
            return parseFloat(parseFloat(Number(number).toFixedRound(6)).toFixedRound(2))
        },
        getLinesDataForPreview(){
            return this.lines_data.filter(x=>parseFloat(x.avl_qty) > 0 || x.inventory_item_enabled_flag == 'N').filter(x=>parseFloat(x.unit_price) > 0 || x.inventory_item_enabled_flag == 'N');
        },
        sanitizeNumber(num){
            console.log('insanitizeNumber(num)', num)
            return parseFloat(num.toString().replace(',', '').split('-').join(""))
        },
        updateAmountsOnCustChange(){
            itemLinesEntry.lines_data.slice(0,itemLinesEntry.lines_data.length-1).forEach(obj=> itemLinesEntry.onInputLineUSP(obj,obj.unit_selling_price));
        },
        
        updateGrossPriceForTable(){
            itemLinesEntry.needValidations= true;
            const self = this;
            if (self.lines_data.length > 1){
                self.lines_data.filter((x,i)=> i!= self.lines_data.length-1).forEach((line,i)=>{
                    if (line.unit_selling_price > 0){
                        line.gross_amount = line.qty * line.unit_selling_price;
                        if (!line.discount){
                            line.discount = 0
                            line.discount_perc = 0
                        }                     
                        line.vat = line.gross_amount * self.customer_vat_perc
                        // line.line_total = total_without_vat + line.vat;
                    }

                    this.$set(self.lines_data,i,line);
                });
            }
            console.log('updateGrossPriceForTable', self.lines_data)
        },
        refreshTotals(){
            var self =this;
            this.columns.forEach(col=>{
                self.applyAggregate(col);
            });

        },
        removeTr(obj,trIndex){
            if (this.lines_data.length > 1)
                this.lines_data.splice(this.lines_data.indexOf(obj),1);
        },
        applyAggregate(col, returnWithoutCommas=false){
            var colKey = col.data;
            var sum = 0;
            var self=this;
            if (col.aggregate == 'sum'){
                if (colKey == 'gross_amount'){
                    var dataa = this.lines_data.filter(x=> typeof(x.unit_price) !== 'undefined' && typeof(x.qty) !== 'undefined' ).filter(x=>x.unit_price!="" && x.qty!='' );
                    // debugger;
                    dataa.forEach(li=>{
                        sum += parseFloat(li.unit_selling_price) * parseFloat(li.qty)
                    })
                }
                else{
                    sum = self.lines_data.filter((x,i)=>i != self.lines_data.length-1).map(x=>x[colKey]).filter(x=> typeof(x) !== 'undefined' ).filter(x=>x!="").reduce((a,b)=> self.parseFloatRound(a) + self.parseFloatRound(b),0);
                }

                if (colKey == 'gross_amount'){
                    this.column_aggregates.gross_amount = sum;
                }
                if (colKey == 'vat'){
                    this.column_aggregates.vat = parseFloat(sum.toFixedRound(6)).toFixedRound(2);
                    sum = parseFloat(sum.toFixedRound(6)).toFixedRound(2);
                }
                if (colKey == 'line_total'){
                    this.column_aggregates.line_total =  parseFloat(sum.toFixedRound(6)).toFixedRound(2);
                    sum = parseFloat(sum.toFixedRound(6)).toFixedRound(2);

                }
            }
            if (col.aggregate == 'total_perc_discount'){
                var gross_total = 0;
                // this.lines_data.filter((x,i)=> i != this.lines_data.length-1).filter(x=> !this.disc_excluded.includes(x.category)).forEach(function(x){
                this.lines_data.filter((x,i)=> i != this.lines_data.length-1).forEach(function(x){
                    gross_total += (x.unit_price * x.qty)
                })
                var sp_total = 0;
                // this.lines_data.filter((x,i)=> i != this.lines_data.length-1).filter(x=> !this.disc_excluded.includes(x.category)).forEach(function(x){
                this.lines_data.filter((x,i)=> i != this.lines_data.length-1).forEach(function(x){
                    sp_total += (x.unit_selling_price * x.qty)
                })

                sum = (gross_total - sp_total)* 100 / gross_total   ;
            }
           
            if (this.comma_seperated_fields.includes(col.data)){
                sum = addCommas(sum,2);
            }
            else if (this.comma_seperated_fields_int.includes(col.data)){
                sum = addCommas(sum,0);
            }
            return sum;
        },
        
        applyDiscount(){
            var self = this;
            var discount_perc = parseFloat($('#cust_discount').val()||0 ) / 100;
            

            self.lines_data.filter((x,i)=> i != self.lines_data.length-1).forEach(line=>{
                if (!self.disc_excluded.includes(line.category)){
                    line.unit_selling_price =  parseFloat(line.unit_price- (line.unit_price *     discount_perc)).toFixedRound(6);
                    line.unit_selling_price = parseFloat(parseFloat(line.unit_selling_price).toFixedRound(2));

                }
            })

            self.$nextTick(function(){
                self.updateAmountsOnCustChange();
            })

        },
        applyListPrice(){
            var self = this;

            self.lines_data.filter((x,i)=> i != self.lines_data.length-1).forEach(line=>{
                if (!self.disc_excluded.includes(line.category)){
                    line.unit_selling_price =  parseFloat(line.unit_price).toFixedRound(6);
                    line.unit_selling_price = parseFloat(parseFloat(line.unit_selling_price).toFixedRound(2));

                }
            })

            self.$nextTick(function(){
                self.updateAmountsOnCustChange();
            })

        },
        removeNotFound(){
            var self = this;
            self.lines_data = self.lines_data.filter(x=>x.cur_price ).filter(x=> parseFloat(x.unit_price) != 0).concat(
                self.lines_data.filter(x=>x.inventory_item_enabled_flag == 'N')
            ).concat({})
        },
        getStockForItems(){
            
            if (this.lines_data.length-1 >500){
                return toastr.error("Max allowed items is 500 ! Please remove additional item to proceed. ");
            }

            var self=this;
            var items_str = self.lines_data.filter((x,i)=> i!= self.lines_data.length-1).filter(x=>Object.keys(x).includes('item_code')).map(x=> x.item_code +'~'+x.qty).join(",");
            if (items_str == ''){
                toastr.error("Please add atleast one item code")
                return
            }
            ShowDIV(['Getting stock details...']);

            axios.get("/sales/filtered_stock2?o="+$('#order_number').val()+"&defs=" + localStorage.getItem("defs") + "&inventory_item_id=" +encodeURIComponent(items_str))
            .then(function (res) {
                HideDIV();
                response= res.data.data;
                response.forEach(item=>{
                    self.lines_data.filter(x=>x.item_code == item.item_code)[0]['avl_qty'] = item['reservable_qty'] ;
                    self.lines_data.filter(x=>x.item_code == item.item_code)[0]['unit_price'] = item['sale_price'] ;
                    self.lines_data.filter(x=>x.item_code == item.item_code)[0]['related_flag'] = item['related_flag'] ;
                });
                
                itemLinesEntry.updateAmountsOnCustChange();

            })
            .catch(function (err) {
                HideDIV();
            })

        },
        afterRender(){
            var self = this;
            this.$nextTick(function(){
                self.initAutoComplete();
            })
        },
        initAutoComplete(){
            var tds = $('tbody td[data-column="item_code"]');
            var tds1 = $('tbody td[data-column="disc_by"]');

            tds.each(function(){
                initACItems(this);
            })                
            tds1.each(function(){
                initACItems(this);
            })                
        },
        generateTdClass(col,obj,trIndex){
            if (['unit_price','avl_qty'].includes(col.data)  && trIndex != this.lines_data.length-1){
                if (parseFloat(obj[col.data] ) == 0 && obj.inventory_item_enabled_flag =='N' ) {
                    return "  font-weight-bold ";

                }
                if (parseFloat(obj[col.data] ) == 0 ) {
                    return " text-danger font-weight-bold ";

                }
                else {
                    if (col.data == 'avl_qty' && parseFloat(obj.qty ||0) >parseFloat(obj.avl_qty ||0) ){
                        return " text-danger font-weight-bold ";
                    }
                    if (col.data == 'avl_qty' ){
                        return " text-success font-weight-bold ";
                    }

                }
                return "";
            }
            if (['item_code'].includes(col.data)  && trIndex != this.lines_data.length-1){
                return "";
            }
            if (['disc_by','disc_value'].includes(col.data)  && trIndex == this.lines_data.length-1){
                return "";
            }

            if (col.data == 'unit_selling_price' && this.disc_excluded.includes(obj.category) ){
                return " editable-td text-primary font-weight-bold ";
            }

            return (this.editable_fields.includes(col.data) && !this.showPreview ? ' editable-td ': '');
        },
        canbeEditable(col,obj,trIndex){

            // if (col.data == 'unit_selling_price' && this.disc_excluded.includes(obj.category) ){
            //     return false;
            // }

            if (col.data == 'item_code' && trIndex != this.lines_data.length-1){
                return false;
            }
            if (col.data == 'item_code'){
                return true;
            }
            if (trIndex == this.lines_data.length-1 ) {
                return false;
            } else {
                return true;
            }
        },
        getTDContent(col,obj,trIndex){

            var tdContent = obj[col.data];
            if (!tdContent){
                return '';
            }
            if ( !this.editable_fields.includes(col.data) ){
                if (this.comma_seperated_fields.includes(col.data)){
                    tdContent = addCommas(tdContent,2);
                }
                if (this.comma_seperated_fields_int.includes(col.data)){
                    tdContent = addCommas(tdContent,0);
                }
            }

            if (trIndex == this.lines_data.length-1) {
                return "";
            }

            return tdContent;
        },
        customerVatChange(){
            itemLinesEntry.needValidations= true;
            const self = this;
            if (self.lines_data.length > 1){
                self.lines_data.forEach(line => {
                    const amt_wo_vat = line.gross_amount - line.discount
                    line.vat = amt_wo_vat * self.customer_vat_perc
                    line.line_total = amt_wo_vat + line.vat
                })
            }
        },
        onInputLineUSP(obj, newValue){
            itemLinesEntry.needValidations= true;
            var self = this;
            // console.log('onInputLineUSP(){', newValue, obj.unit_price, self);

            obj.unit_selling_price = newValue || 0;

            if (parseFloat(newValue) >  parseFloat(obj.unit_price)){
                obj.unit_selling_price = parseFloat(obj.unit_price);
            }


            obj['sp_gross'] = parseFloat(obj.qty) * parseFloat(obj.unit_selling_price);
            
            
            obj.gross_amount = parseFloat(obj.qty) * parseFloat(obj.unit_selling_price);

            obj.discount = (parseFloat(obj.unit_price) - parseFloat(obj.unit_selling_price)    ) * parseFloat(obj.qty);


            obj.line_total = parseFloat(obj.gross_amount) - parseFloat(obj.discount);

            if ( (parseFloat(obj.unit_price) - parseFloat(obj.unit_selling_price))  >  0) {
                // debugger;
                obj.discount_perc =  ((
                        (parseFloat(obj.unit_price) - parseFloat(obj.unit_selling_price))
                        /parseFloat(obj.unit_price) 
                    ) *100)    || 0;
            } else {
                obj.discount_perc = 0;
            }



            // obj.discount = obj.discount < 0 ? 0 : -1 * obj.discount;
            obj.discount = -1 * obj.discount;

            obj.discount_perc = obj.discount_perc < 0 ? -1 * obj.discount_perc : obj.discount_perc;

            obj.vat = parseFloat(obj.sp_gross) * this.customer_vat_perc ;
            
            obj.line_total = obj.vat + parseFloat(obj.sp_gross) ;

            // setTimeout(function(){
            //     self.updateAmountsOnCustChange();
            // },250)
            
            
            this.setCollectionAmountForCA();
        },
        setCollectionAmountForCA(){
            $("#number0").val( parseFloat(itemLinesEntry.column_aggregates['line_total']).toFixedRound(2) );

            $('#rem_amount_').text('0.00');

        },
        // onInputLineDiscount(obj, newValue){
        //     itemLinesEntry.needValidations= true;
        //     var self = this;
        //     console.log('onInputLineDiscount(){', newValue, obj.unit_price, self);

        //     obj.discount = newValue || 0
        //     obj.discount_perc = (parseFloat(obj.discount)/parseFloat(obj.gross_amount))*100 || 0
        //     const total_without_vat = parseFloat(obj.gross_amount) - parseFloat(obj.discount);
        //     obj.vat = parseFloat(total_without_vat * self.customer_vat_perc)
        //     obj.line_total = total_without_vat + obj.vat;
        //     obj.unit_selling_price = (parseFloat(obj.gross_amount) - parseFloat(obj.discount))/parseFloat(obj.qty);
        // },
        onInputLineQty(obj, newValue){
            itemLinesEntry.needValidations= true;
            var self = this;
            obj.qty = newValue||1;

            if (obj.avl_qty != ""){
                if (parseFloat(obj.qty) > parseFloat(obj.avl_qty) && obj.inventory_item_enabled_flag != 'N'){
                    obj.qty = 1;
                }
            }
            obj.qty = parseFloat(newValue) < 0 ? 1 :newValue;


            // console.log('onInputLineQty(obj, newValue){', obj.qty, obj.unit_price);
            obj.gross_amount = obj.qty * parseFloat(obj.unit_price);
            obj.discount = (parseFloat(obj.unit_price) - parseFloat(obj.unit_selling_price)    ) * parseFloat(obj.qty);


            // obj.discount_perc = (parseFloat(obj.discount)/parseFloat(obj.gross_amount))*100 || 0;

            // obj.discount_perc = obj.discount_perc < 0 ? 0 :obj.discount_perc;


            const total_without_vat = parseFloat(obj.gross_amount) - parseFloat(obj.discount);
            obj.vat = parseFloat(total_without_vat * self.customer_vat_perc)
            obj.line_total = total_without_vat + obj.vat;

            // obj.unit_selling_price = (parseFloat(obj.gross_amount) - parseFloat(obj.discount))/parseFloat(obj.qty)

            // obj.unit_selling_price = parseFloat(obj.unit_selling_price.toFixedRound(2));
            setTimeout(function(){
                self.updateAmountsOnCustChange();
            },250)

            

            this.setCollectionAmountForCA();
        },
        lineDiscByChange(col,obj, trIndex, $event){
            obj[col.data] = $event.target.value;
            // var self = this;
            // this.lines_data.splice(trIndex, 1, obj)
            if (obj['cur_price'] && obj['disc_value']){
                const newDiscAmt = obj['disc_by'] == 'Amount' ? obj['disc_value'] : (parseFloat(obj['cur_price'])/100) *  obj['disc_value']
                obj.new_price = (parseFloat(obj['cur_price']) - parseFloat(newDiscAmt)).toFixedRound(2)
                obj.new_price_vat = (parseFloat(obj.new_price) + parseFloat(obj.cur_price_vat)).toFixedRound(2)

            }
            this.lines_data.splice(trIndex, 1, obj)
        },
        discValueChange(obj, newValue, trIndex){
            const vatRate = self.vatPerc / 100
            const itemVat =  parseFloat((parseFloat(obj['cur_price']) * vatRate)).toFixedRound(2)
            if (!newValue){
                obj.new_price = obj['cur_price']
                obj.new_price_vat = obj['cur_price']
                obj.vat = itemVat;
                obj.cur_price_vat = itemVat;
                obj.new_price_vat =  `${(parseFloat(obj.new_price) + parseFloat(itemVat)).toFixedRound(2)}`;

            } else {
                const newDiscAmt = obj['disc_by'] == 'Amount' ? newValue : (parseFloat(obj['cur_price'])/100) *  newValue

                console.log('newDiscAmt newDiscAmt newDiscAmt ', newDiscAmt)
                obj.new_price = (parseFloat(obj['cur_price']) - parseFloat(newDiscAmt)).toFixedRound(2)
                obj.new_price_vat = (parseFloat(obj['cur_price']) - parseFloat(newDiscAmt)).toFixedRound(2)
                obj["vat"] = itemVat;
                obj["cur_price_vat"] = itemVat;
                obj["new_price_vat"] =  `${(parseFloat(obj.new_price) + parseFloat(itemVat)).toFixedRound(2)}`;

            }
            this.lines_data.splice(trIndex, 1, obj)
        },
        lineOnChange(col,obj, trIndex, $event){
            obj[col.data] = $event.target.innerHTML;
            itemLinesEntry.needValidations= true;
            var self = this;
            this.$nextTick(function(){
                placeCaretAtEnd($event.target);
            })
            let newValue = $event.target.innerText;
            if (col.data == 'item_code'){
                obj.item_code = $event.target.innerText;
            }
            if (col.data == 'disc_value'){
                self.discValueChange(obj, self.sanitizeNumber(newValue), trIndex)
            }
        },
        getEmptyLineObj(){
            return this.columns.reduce((a,b)=> Object.assign({[b.data]:""} ,a) ,{});
        },
        addToLines(lines,offset){
            var self = this;

            self.lines_data  = self.lines_data.slice(0,-1);
            const vatRate = self.vatPerc/100
            lines.forEach((line,i)=>{
                var obj = self.getEmptyLineObj();
                if (self.lines_data.map(x=>x.item_code).includes(line.item_code))
                    return toastr.error(`Duplicate Item ${line.item_code} not allowed. Moving to next item`);
                const itemVat =  parseFloat((parseFloat(line['price']) * vatRate)).toFixedRound(2)

                obj["inventory_item_id"] =  line['inventory_item_id'];
                obj["action"] =  "";
                obj["no_#"] =  i+1;
                obj["item_code"] =  line['item_code'];
                obj["unit_price"] =  line['price'];
                obj["cur_price"] =  line['price'];
                obj["vat"] = itemVat;
                obj["cur_price_vat"] = itemVat;
                obj["line_error"] =  null;
                obj["new_price"] =  line['price'];
                obj["new_price_vat"] =  `${(parseFloat(line['price']) + parseFloat(itemVat)).toFixedRound(2)}`;
                obj["disc_by"] =  'Percentage';
                obj["disc_value"] =  '';
                obj["price_list_start_date"] =  '';
                obj["price_list_end_date"] =  '';
                
                self.lines_data.splice(i, 0, obj);
            });
            self.lines_data.push(self.getEmptyLineObj());
            

            self.$nextTick(function(){
                self.setCollectionAmountForCA();
            })
        },
        onPasteItemStock(col,obj,evt){
            const price_list_name = $('#price_list_name').val()
            if (!price_list_name){
                toastr.error("Please select Price List")
                return
            }
            // col;
            if(col.data != 'item_code') return;
            window.gloPastingFlag = true; 
            console.log(evt);
            var self = this;
            console.log('on paste', evt.clipboardData.getData('text'));

            pastedData = evt.clipboardData.getData('text');

            if (!pastedData.includes('\n')) {
                pastedData += '\n';
                // return;   
            }

          

            // debugger;
            var pastedArr = pastedData.split('\n').map((x,i)=>{
                var arr= x.replace("\r","").split("\t").map(x=>x.trim());
                var obj = {};
                // alert(arr.length);
                obj['item_code'] = arr[0];  
                if (arr.length > 1)
                    obj['qty'] = arr[1];
                else
                    obj['qty'] = 1;

                if (arr.length > 2)
                    obj['sp'] = arr[2].split(",").join("");
                else 
                    obj['sp'] = "";
                return obj;
            })




            var data = pastedData.split("\n").filter(x=> x!="").map(x=> !x.trim().includes("\t") ? x.trim()+'~1' :x.trim().split("") );


            items = pastedArr.filter(x=>x.item_code !="").map(x=> `${x.item_code}~${x.qty}`);

            quantity = items.map(text=> ({ [text.split("~")[0]]:{quantity:text.split("~")[1]} })).reduce ((a,b) => Object.assign(a,b),{})

            NewArray = items.filter(x=>true);


            
            ShowDIV(['Getting Item info...'])

            axios.get("/pricelist/api/search_pricelist_items?pricelist="+price_list_name+"&items="+encodeURIComponent(NewArray))
            .then(function(res)
            {
                HideDIV();
                setTimeout(function(){
                    window.gloPastingFlag = false; 
                },2000)

                res.data.data.forEach(obj=>{
                    obj.quantity = quantity[obj.item_code].quantity;
                });


                


                var lines_to_add = res.data.data.concat(
                    res.data.not_found.map(x=>({item_code:x, qty:  quantity[x] }))
                );


                var lines_to_add_in_seq =  pastedArr.slice(0,pastedArr.length-1).map((item,i)=> {
                    var obj = lines_to_add.filter(x=>x.item_code == item.item_code)[0];
                    obj['unit_selling_price'] = item.sp ;
                    obj['qty'] = quantity[obj.item_code].quantity;
                    return obj;
                });



                // debugger;
            
                
                HideDIV();
                self.addToLines(

                    lines_to_add_in_seq,
                    $(evt.target).closest('tr').index()
                )



                self.$nextTick(function(){
                    self.updateAmountsOnCustChange();
                    self.updateGrossPriceForTable();
                })
            })
            .catch(function(err)
            {
                
                HideDIV();
                window.gloPastingFlag = true; 
            })
        },
        relatedItems(obj){
            ShowDIV(['Get Related items...'])
            $('#related_item_tbl tbody tr').remove();
            let cur_item_invid = obj.inventory_item_id
            axios.get("/saleswores/get_related_item/"+cur_item_invid).then(function(res)
                        {
                            HideDIV();
                            console.log('res====>',res);
                            self.related_lines_data = res.data
                            console.log('self.related_lines_data=====>',self.related_lines_data)

                            self.related_lines_data.forEach(function (obj, tIndex) {
                                console.log('data---->', tIndex, obj);
                                $('#related_item_tbl tbody').append('<tr><td><button class="btn-sm btn-info replaceItem" data-itemcode="'+obj.ITEM_CODE+'" data-replaceitem="'+cur_item_invid+'" data-avlqty="'+obj.ONHAND_QTY+'" data-unitprice="'+obj.SALE_PRICE+'"> Replace </button></td>\
                                    <td>'+obj.ITEM_CODE+'</td>\
                                    <td>'+obj.ONHAND_QTY+'</td>\
                                    <td>'+obj.DESCRIPTION+'</td>\
                                    <td>'+obj.UOM_CODE+'</td>\
                                    <td>'+obj.SALE_PRICE+'</td></tr>');
                                
                            });

                                
                            $("#related_item_modal").show()
                        }).catch(function(){
                            HideDIV();
                        })
        },
        replaceItem(replaceitem,new_itemcode,avlqty,unitprice){
            const price_list_name = $('#price_list_name').val()
            if (!price_list_name){
                toastr.error("Please select Price List")
                return
            }
            ShowDIV(['Replacing item...'])
            axios.get("/pricelist/api/search_pricelist_items?pricelist="+price_list_name+"&items="+new_itemcode+'~1')
            .then(function(res)
            {
                HideDIV();
                let op_data = res.data.data
                $.each(op_data, function(index, value) {
                        
                    let line = value
                    line['price'] = unitprice
                    var obj = itemLinesEntry.getEmptyLineObj();
                    obj["vat"] = '0';
                    obj["cur_price_vat"] = '0';
                    obj["discount_perc"] =  0.0;
                    obj["discount"] =  line['discount'] || 0.0;
                    obj["qty"] =  line['quantity'] || 1;
                    obj["gross_amount"] =  parseFloat(obj["qty"]) * parseFloat(line['price']);
                    obj["line_total"] =  obj["gross_amount"] - parseFloat(obj["discount"]) + obj["vat"] 
                    obj["unit_price"] =  line['price'];
                    obj["cur_price"] =  line['price'];
                    obj["avl_qty"] =  avlqty;
                    obj["uom"] =  line['primary_unit_of_measure'];
                    obj["item_desc"] =  line['description'];
                    obj["item_code"] =  line['item_code'];
                    obj["inventory_item_enabled_flag"] =  line['inventory_item_enabled_flag'];
                    obj["inventory_item_id"] =  line['inventory_item_id'];

                    obj["unit_selling_price"] = line['price'];
                    // obj["unit_selling_price"] = (parseFloat(obj["gross_amount"] ) - parseFloat(obj["discount"]))/parseFloat(obj["qty"])
                    obj["barcode"] =  "";
                    obj["no_#"] =  $(event).closest('tr').index()+1;
                    obj["action"] =  "";
                    obj["line_error"] =  null;
                    obj["category"] = line['category'];
                    obj["related_flag"] = 'N';
                    console.log('obj=====>',obj)

                    let cur_item_index =  (itemLinesEntry.lines_data).findIndex(item => item.inventory_item_id == replaceitem);
                    itemLinesEntry.lines_data.splice(cur_item_index,1,obj);
                });
                
                
                $("#related_item_modal").hide()

            })
            .catch(function()
            {
                HideDIV();


            })
        }
    },
    mounted(){
        $('#entry-new').removeClass('d-none')
        self = this
        $(document).on('click','.replaceItem',function(e){
            let new_itemcode = $(e.target).data('itemcode')
            let replaceitem = $(e.target).data('replaceitem')
            let avlqty = $(e.target).data('avlqty')
            let unitprice = $(e.target).data('unitprice')
            
            self.replaceItem(replaceitem,new_itemcode,avlqty,unitprice)
        } );
        $(document).on('click','.related_modal_close',function(e){
            $("#related_item_modal").hide()
        } );

        
    
        
    }
})