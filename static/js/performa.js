class PerformaGenerator {
    static async fetchInvoiceData(serviceRequestId) {
        const response = await fetch(`/api/servicerequest/invoice/${serviceRequestId}`);
        const data = await response.json();
        console.log('API Response:', data);
        return data;
    }

    static async fetchTemplate() {
        const response = await fetch('/Service_request/performa/');
        return await response.text();
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    static formatCurrency(amount) {
        if (!amount) return '0.00';
        return parseFloat(amount).toFixed(2);
    }

    static populateInvoiceDetails(templateHtml, details) {
        console.log('Performa Details:', details);
        const fields = {
            'bill-to': details.bill_to,
            'ship-to': details.ship_to,
            'address': details.address,
            'shipping_address': details.shipping_address,
            'unit_sale_date': this.formatDate(details.unit_sale_date),
            'invoice_date': this.formatDate(details.invoice_date),
            'unit_sale_order': details.unit_sale_order,
            'invoice_no': details.invoice_no,
            'unit_sale_loc': details.unit_sale_loc,
            'trn': details.trn,
            'job_card_type': details.job_card_type,
            'make': details.make,
            'model': details.model,
            'date_in': this.formatDate(details.date_in),
            'vin': details.vin,
            'ro_number': details.ro_number,
            'registration': details.registration,
            'mileage': details.mileage,
            'work_department': details.work_department,
            'lpo_wo_claim': details.lpo_wo_claim,
            'location': details.location,
            'customer_trn': details.customer_trn,
            'registered_bt': details.registered_bt,
            'receipt_no': details.receipt_no,
            'tel_no': details.tel_no,
            'pre_job_card': details.pre_job_card,
            'due_date': this.formatDate(details.due_date)
        };

        Object.entries(fields).forEach(([field, value]) => {
            const regex = new RegExp(`<td[^>]*data-field="${field}"[^>]*>.*?</td>`, 'g');
            templateHtml = templateHtml.replace(regex, `<td data-field="${field}">${value || ''}</td>`);
        });

        return templateHtml;
    }

    static generateLineItems(lineItems) {
        console.log('Line Items:', lineItems);
        let lineItemsHtml = '';
        let lineNumber = 1;

        Object.entries(lineItems).forEach(([key, data]) => {
            data.items.forEach(item => {
                lineItemsHtml += `
                    <tr>
                        <td>${lineNumber++}</td>
                        <td>${item.component_type}</td>
                                                <td>${item.component_description || ''}</td>
                        <td class="amount-cell">${this.formatCurrency(item.selling_price)}</td>
                        <td class="amount-cell">${item.actual_quantity || '1'}</td>
                        <td class="amount-cell">${this.formatCurrency(item.net_price)}</td>
                        <td class="amount-cell">${this.formatCurrency(item.adjustment)}</td>
                        <td class="amount-cell">${this.formatCurrency(item.net_amount)}</td>
                        <td class="amount-cell">5</td>
                        <td class="amount-cell">${this.formatCurrency(item.vat)}</td>
                        <td class="amount-cell">${this.formatCurrency(item.final_amount)}</td>
                    </tr>
                `;
            });
        });

        return lineItemsHtml;
    }

    static generateCustomerBalanceRows(balanceData, totals) {
        if (!balanceData) return '';

        const originalAmount = parseFloat(balanceData.original_amount) || 0;
        const locAvailableAmount = parseFloat(balanceData.loc_available_amount) || 0;
        const txnAmount = parseFloat(balanceData.txn_amount) || parseFloat(totals.net_total) || 0;
        const vatRate = 0.05;

        // Calculate VAT amounts
        const locAvailableVAT = locAvailableAmount * vatRate;
        const txnVAT = txnAmount * vatRate;

        return `
            <tr>
                <td rowspan="2">1</td>
                <td>Advance Received</td>
                <td rowspan="2">${balanceData.receipt_number || ''}</td>
                <td rowspan="2">${this.formatDate(new Date())}</td>
                <td rowspan="2"></td>
                <td rowspan="2"></td>
                <td>${this.formatCurrency(originalAmount)}</td>
                <td>${this.formatCurrency(locAvailableAmount)}</td>
                <td>${this.formatCurrency(txnAmount)}</td>
            </tr>
            <tr>
                <td>Tax Advance Invoice</td>
                <td>${this.formatCurrency(originalAmount * vatRate)}</td>
                <td>${this.formatCurrency(locAvailableVAT)}</td>
                <td>${this.formatCurrency(txnVAT)}</td>
            </tr>
            <tr class="adjustment-row">
                <td colspan="7">Adjustment for Advance</td>
                <td class="amount-cell">${this.formatCurrency(locAvailableAmount + locAvailableVAT)}</td>
                <td class="amount-cell">${this.formatCurrency(txnAmount + txnVAT)}</td>
            </tr>
        `;
    }



    static generateTotalRow(totals) {
        console.log('Totals:', totals);
        return `
            <tr class="total-row">
                <td colspan="5">Total</td>
                <td class="amount-cell">${this.formatCurrency(totals.gross_total)}</td>
                <td class="amount-cell">0.00</td>
                <td class="amount-cell">${this.formatCurrency(totals.net_total)}</td>
                <td></td>
                <td class="amount-cell">${this.formatCurrency(totals.vat_total)}</td>
                <td class="amount-cell">${this.formatCurrency(totals.gross_total)}</td>
            </tr>
        `;
    }

    static generateTotalSummary(totals, balanceData) {
        const vatExclTotal = this.formatCurrency(totals.net_total);
        const vatTotal = this.formatCurrency(totals.vat_total);

        // Calculate total invoice amount
        const totalInvoiceAmount = parseFloat(totals.net_total) + parseFloat(totals.vat_total);

        // Calculate advance adjustment total
        const txnAmount = parseFloat(balanceData?.txn_amount) || parseFloat(totals.net_total) || 0;
        const txnVAT = txnAmount * 0.05;
        const advanceAdjustmentTotal = txnAmount + txnVAT;

        // Calculate balance due
        const balanceDue = totalInvoiceAmount - advanceAdjustmentTotal;

        return `
            <table style="width: auto; margin-left: auto;">
                <tr>
                    <td>Total Invoice Value Excl. VAT</td>
                    <td class="amount-cell">${vatExclTotal}</td>
                </tr>
                <tr>
                    <td>VAT</td>
                    <td class="amount-cell">${vatTotal}</td>
                </tr>
                <tr>
                    <td>Balance Due</td>
                    <td class="amount-cell">${this.formatCurrency(balanceDue)}</td>
                </tr>
            </table>
        `;
    }



    static downloadPerforma(html, serviceRequestId) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performa_${serviceRequestId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

async function generateAndDownloadPerforma(serviceRequestId) {
    try {
        console.log('Generating performa for service request:', serviceRequestId);
        const invoiceData = await PerformaGenerator.fetchInvoiceData(serviceRequestId);
        let templateHtml = await PerformaGenerator.fetchTemplate();

        if (invoiceData.status === 'success') {
            templateHtml = PerformaGenerator.populateInvoiceDetails(templateHtml, invoiceData.data.invoice_details);
            const lineItemsHtml = PerformaGenerator.generateLineItems(invoiceData.data.line_items);
            const totalRowHtml = PerformaGenerator.generateTotalRow(invoiceData.data.totals);
            const customerBalanceHtml = PerformaGenerator.generateCustomerBalanceRows(invoiceData.data.customer_balance, invoiceData.data.totals);
            const totalSummaryHtml = InvoiceGenerator.generateTotalSummary(invoiceData.data.totals, invoiceData.data.customer_balance);

            console.log('Generated Customer Balance HTML:', customerBalanceHtml);

            const mainTableBody = templateHtml.match(/<tbody>[\s\S]*?<\/tbody>/);
            if (mainTableBody) {
                templateHtml = templateHtml.replace(mainTableBody[0], `<tbody>${lineItemsHtml}${totalRowHtml}</tbody>`);
            }

            const summaryTableBody = templateHtml.match(/<div class="summary-table">[\s\S]*?<tbody>[\s\S]*?<\/tbody>/);
            if (summaryTableBody) {
                templateHtml = templateHtml.replace(
                    /<div class="summary-table">[\s\S]*?<tbody>[\s\S]*?<\/tbody>/,
                    `<div class="summary-table"><table><thead><tr><th>SN</th><th>Particulars</th><th>Receipt No</th><th>Date</th><th>Ref No</th><th>PT Invoice No</th><th>Amount Collected</th><th>Unadjusted Advance</th><th>Advance Adjusted</th></tr></thead><tbody>${customerBalanceHtml}</tbody>`
                );
            }

            templateHtml = templateHtml.replace(
                /<table style="width: auto; margin-left: auto;">[\s\S]*?<\/table>/,
                totalSummaryHtml
            );

            PerformaGenerator.downloadPerforma(templateHtml, serviceRequestId);
            console.log('Performa generation completed successfully');
        }
    } catch (error) {
        console.error('Error generating performa:', error);
    }
}

