

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function getCurrentDateTime() {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function showSubletModal(element) {
    const modal = document.getElementById('subletModal');
    modal.style.display = 'block';

    const clickedRow = element.closest('.sublet-row');
    const modalTbody = modal.querySelector('.table-wrapper table tbody');
    modalTbody.innerHTML = '';
    const supplierNames = await fetchDropdownOptions('SUPPLIER NAME');
    const pettyCashSuppliers = await fetchDropdownOptions('PETTY CASH SUPPLIER');
    const activityDescriptions = await fetchDropdownOptions('ACTIVITY DESCRIPTION');

    const activityLine = clickedRow.querySelector('td:nth-child(3)').textContent;
    const activityDesc = clickedRow.querySelector('td:nth-child(4)').textContent;
    const currentDate = getCurrentDate();
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>1</td>
        <td><select class="sublet-dropdown"></select></td>
        <td><select class="sublet-dropdown"></select></td>
        <td><select class="sublet-dropdown"></select></td>
        <td><input type="checkbox" class="checkbox" id="applyVat"></td>
        <td><input type="text" value="" id="transactionAmount" placeholder="Enter amount"></td>
        <td><input type="text" value="" placeholder="Enter invoice number"></td>
        <td><input type="date" value="${currentDate}"></td>
        <td>
            <div class="action-buttons">
                <button class="btn-info" onclick="showActionHistoryModal()">i</button>
                <button class="btn-print">Print GRN</button>
            </div>
        </td>
        <td><input type="checkbox" class="checkbox"></td>
        <td><input type="text" value="5" id="vatPercentage" readonly></td>
        <td><input type="text" value="" id="vatAmount" readonly></td>
        <td><input type="text" value="" id="totalAmount" readonly></td>
        <td><input type="text" value="Sublet"></td>
        <td><input type="text" value="AYM_AJMWS"></td>
    `;

    modalTbody.appendChild(newRow);
    await fetchAndDisplaySubletDetails();

    const vatCheckbox = newRow.querySelector('#applyVat');
    const transactionAmountInput = newRow.querySelector('#transactionAmount');
    const vatPercentageInput = newRow.querySelector('#vatPercentage');
    const vatAmountInput = newRow.querySelector('#vatAmount');
    const totalAmountInput = newRow.querySelector('#totalAmount');

    function calculateVAT() {
        const transactionAmount = parseFloat(transactionAmountInput.value) || 0;
        const vatPercentage = 5;

        if (vatCheckbox.checked) {
            const vatAmount = (transactionAmount * vatPercentage) / 100;
            const totalAmount = transactionAmount + vatAmount;

            vatAmountInput.value = vatAmount.toFixed(2);
            totalAmountInput.value = totalAmount.toFixed(2);
        } else {
            vatAmountInput.value = '';
            totalAmountInput.value = transactionAmount.toFixed(2);
        }
    }

    vatCheckbox.addEventListener('change', calculateVAT);
    transactionAmountInput.addEventListener('input', calculateVAT);

    const [supplierDropdown, pettyCashDropdown, activityDropdown] = newRow.querySelectorAll('select.sublet-dropdown');

    if (supplierDropdown) {
        supplierDropdown.innerHTML = supplierNames.map(name =>
            `<option value="${name}">${name}</option>`
        ).join('');
    }

    if (pettyCashDropdown) {
        pettyCashDropdown.innerHTML = pettyCashSuppliers.map(name =>
            `<option value="${name}">${name}</option>`
        ).join('');
    }

    if (activityDropdown) {
        activityDropdown.innerHTML = activityDescriptions.map(desc =>
            `<option value="${desc}">${desc}</option>`
        ).join('');
    }

    $('.sublet-dropdown').select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-sublet-container',
        dropdownCssClass: 'select2-sublet-dropdown'
    });

    const processButton = modal.querySelector('.actions .process');
    processButton.replaceWith(processButton.cloneNode(true));
    const newProcessButton = modal.querySelector('.actions .process');

    newProcessButton.addEventListener('click', async () => {
        newProcessButton.disabled = true;

        try {
            const row = modalTbody.querySelector('tr');
            const data = {
                supplier_name: row.querySelector('td:nth-child(2) select').value,
                petty_cash_supplier: row.querySelector('td:nth-child(3) select').value,
                activity_description: row.querySelector('td:nth-child(4) select').value,
                apply_vat: row.querySelector('#applyVat').checked,
                transaction_amount: parseFloat(row.querySelector('#transactionAmount').value),
                supplier_invoice_num: row.querySelector('td:nth-child(7) input').value,
                supplier_invoice_date: row.querySelector('td:nth-child(8) input').value,
                vat_percentage: 5,
                vat_amount: parseFloat(row.querySelector('#vatAmount').value),
                total_amount_incl_vat: parseFloat(row.querySelector('#totalAmount').value),
                operation_code: row.querySelector('td:nth-child(14) input').value,
                supplier_site_name: row.querySelector('td:nth-child(15) input').value
            };

            const response = await fetch('/api/servicerequest/sublet/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                showMessage('Sublet Processing program is Submitted');
                await fetchAndDisplaySubletDetails();
                await updateActualTableQuantities();
                
                // Store the AP invoice number for action history
                if (result.ap_invoice_number) {
                    localStorage.setItem('latest_ap_invoice_number', result.ap_invoice_number);
                }
                
                closeSubletModal();
            } else {
                showMessage('Error processing sublet: ' + result.error, false);
            }
        } catch (error) {
            showMessage('Error processing sublet: ' + error, false);
        } finally {
            newProcessButton.disabled = false;
        }
    });

    window.onclick = function (event) {
        if (event.target == modal) {
            closeSubletModal();
        }
    }
}


function closeSubletModal() {
    const modal = document.getElementById('subletModal');
    modal.style.display = 'none';
}

function showLaborModal() {
    const modal = document.getElementById('laborModal');
    modal.style.display = 'block';
    
    // Clear existing rows and add initial row with current datetime
    const tbody = modal.querySelector('.table-wrapper table tbody');
    tbody.innerHTML = '';
    addLaborRow();

    window.onclick = function (event) {
        if (event.target == modal) {
            closeLaborModal();
        }
    }
}


function closeLaborModal() {
    const modal = document.getElementById('laborModal');
    modal.style.display = 'none';
}

function addLaborRow() {
    const tbody = document.querySelector('#laborModal .table-wrapper table tbody');
    const newRow = document.createElement('tr');
    const currentDateTime = getCurrentDateTime();

    newRow.innerHTML = `
        <td>${tbody.children.length + 1}</td>
        <td>
            <select class="labor-dropdown">
                <option>WV0181</option>
            </select>
        </td>
        <td>
            <select class="labor-dropdown">
                <option>- Select -</option>
            </select>
        </td>
        <td>
            <select class="labor-dropdown">
                <option>- Select -</option>
            </select>
        </td>
        <td><input type="text"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td></td>
        <td>
            <div class="action-buttons">
                <button class="btn-delete" onclick="deleteLaborRow(this)">-</button>
            </div>
        </td>
    `;

    tbody.appendChild(newRow);
    $(newRow).find('.labor-dropdown').select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    });
}


function deleteLaborRow(button) {
    const row = button.closest('tr');
    row.remove();
    const tbody = document.querySelector('#laborModal .table-wrapper table tbody');
    Array.from(tbody.rows).forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}


function closeActionHistoryModal() {
    const modal = document.getElementById('actionHistoryModal');
    modal.style.display = 'none';
}

function toggleCreditTable() {
    const creditTable = document.getElementById('creditTableContainer');
    creditTable.style.display = creditTable.style.display === 'none' ? 'block' : 'none';
}
async function showConsumablesModal() {
    const modal = document.createElement('div');
    modal.id = 'consumablesModal';
    modal.className = 'modal';
    const currentDate = getCurrentDate();

    try {
        const urlParams = new URLSearchParams(window.location.search);
        // Corrected: Use 'service_request_id' instead of 'incident_number'
        const incidentNumber = urlParams.get('service_request_id');
        modal.setAttribute('data-incident-number', incidentNumber);

        const response = await fetch(`/api/servicerequest/consumables/${incidentNumber}`);
        const result = await response.json();

        if (result.status === "success") {
            const consumablesData = result.data;

            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal" onclick="closeConsumablesModal()">&times;</span>
                    <h2>Consumables</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Line</th>
                                <th>Operation Code</th>
                                <th>Actual Qty</th>
                                <th>Trans Qty *</th>
                                <th>Proc Qty</th>
                                <th>Returned Qty</th>
                                <th>Cons OH Qty</th>
                                <th>Tot Selling Price</th>
                                <th>Transaction Date</th>
                                <th>Return Qty</th>
                                <th>Return</th>
                            </tr>
                        </thead>
                        <tbody>
                ${consumablesData.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.component_code}</td>
                        <td>${item.actual_quantity}</td>
                        <td>
                            <input type="text" 
                                   value="${item.existing_trans_qty || 0}" 
                                   style="width: 50px;">
                        </td>
                        <td>${item.proc_qty || ''}</td>
                        <td>${item.returned_qty || ''}</td>
                        <td>${item.on_hand_quantity}</td>
                        <td>${item.tot_selling_price || 0}</td>
                        <td>${item.transaction_date || currentDate}</td>
                        <td>
                            <input type="text" 
                                   style="width: 50px;" 
                                   value="${item.existing_return_qty || 0}">
                        </td>
                        <td>
                            <input type="checkbox" 
                                   ${item.existing_return ? 'checked' : ''}>
                        </td>
                        ${item.id ? `<input type="hidden" class="consumable-id" value="${item.id}">` : ''}
                    </tr>
                `).join('')}
            </tbody>
                    </table>
                    <div class="actions">
                        <button class="process">Process Consumables</button>
                        <button class="return">Initiate Return</button>
                        <button class="close" onclick="closeConsumablesModal()">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

            // Add event listeners for process and return buttons
            const processButton = modal.querySelector('.process');
             if (processButton) {
                processButton.addEventListener('click', async () => {
                    processButton.disabled = true;
                    try {
                        await processConsumables();
                    } finally {
                        processButton.disabled = false;
                    }
                });
            }
            // const returnButton = modal.querySelector('.return');
            // returnButton.addEventListener('click', '');
        } else {
            console.error('Error loading consumables data:', result.message);
            showMessage('Error loading consumables data: ' + result.message, false);
        }
    } catch (error) {
        console.error('Error fetching consumables:', error);
        showMessage('Error loading consumables data', false);
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            closeConsumablesModal();
        }
    }
}

async function processConsumables() {
    const modal = document.getElementById('consumablesModal');
    const incidentNumber = modal.getAttribute('data-incident-number');
    
    const rows = modal.querySelectorAll('tbody tr');
    const consumablesData = [];

    rows.forEach((row, index) => {
        const id = row.querySelector('.consumable-id')?.value;
        const transQty = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        
        const rowData = {
            id: id || null,
            line: index + 1,
            operation_code: row.querySelector('td:nth-child(2)').textContent,
            actual_quantity: parseFloat(row.querySelector('td:nth-child(3)').textContent) || 0,
            trans_qty: transQty,
            return_qty: parseFloat(row.querySelector('td:nth-child(10) input').value) || 0,
            return: row.querySelector('td:nth-child(11) input').checked
        };

        if (transQty > 0) {
            consumablesData.push(rowData);
        }
    });

    console.log('Processed consumables data:', consumablesData);


    if (consumablesData.length > 0) {
        try {
            const response = await fetch('/api/servicerequest/consumables/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    consumables: consumablesData,
                    incident_number: incidentNumber
                })
            });
            console.log('Response received:', response);
            const result = await response.json();
            console.log('Response data:', result);

            if (result.status === "success") {
                showMessage('Consumables processed successfully');
                closeConsumablesModal();
                await updateActualTableQuantities();
                calculateConsumablesVAT(); 
                logConsumablesCalculations(); 
            } else {
                showMessage('Error: ' + result.message, false);
            }
        } catch (error) {
            console.error('Error in processConsumables:', error);
            showMessage('Error processing consumables: ' + error, false);
        }
    } else {
        console.log('No valid consumables data to process');
        showMessage('Please enter transaction quantities', false);
    }
}

function logConsumablesCalculations() {
    console.log('Raw Consumables Data:', document.querySelectorAll('.consumable-row'));
    
    const actualTable = document.querySelector('.actual-table');
    const consumableRows = actualTable.querySelectorAll('.consumable-row');
    console.log('=== Consumables Calculations ===');
    
    consumableRows.forEach((row, index) => {
        const netPriceCell = row.querySelector('td:nth-child(11)');
        const vatCell = row.querySelector('td:nth-child(15)');
        const finalAmountCell = row.querySelector('td:nth-child(16)');
        
        const netPrice = parseFloat(netPriceCell.textContent) || 0;
        const vat = parseFloat(vatCell.textContent) || 0;
        const finalAmount = parseFloat(finalAmountCell.textContent) || 0;
        
        console.log(`Row ${index + 1}:`);
        console.log(`- Net Price: ${netPrice}`);
        console.log(`- VAT (5%): ${vat}`);
        console.log(`- Final Amount: ${finalAmount}`);
    });
    
    // Log subtotal calculations
    const subtotalRow = actualTable.querySelector('.subtotal-row');
    if (subtotalRow) {
        const subtotalNet = parseFloat(subtotalRow.querySelector('.net-amount').textContent) || 0;
        const subtotalVat = parseFloat(subtotalRow.querySelector('.vat-amount').textContent) || 0;
        const subtotalFinal = parseFloat(subtotalRow.querySelector('.final-amount').textContent) || 0;
        
        console.log('\nSubtotal Calculations:');
        console.log(`- Total Net: ${subtotalNet}`);
        console.log(`- Total VAT: ${subtotalVat}`);
        console.log(`- Final Total: ${subtotalFinal}`);
    }
}


// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


async function fetchEstimateTotals() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!incidentNumber) {
        console.error('No incident number found in URL');
        return null;
    }

    try {
        const response = await fetch(`/api/servicerequest/estimate-total/${incidentNumber}`);
        if (!response.ok) {
            throw new Error('Failed to fetch estimate totals');
        }
        const result = await response.json();
        return result.data?.component_totals || null;
    } catch (error) {
        console.error('Error fetching estimate totals:', error);
        return null;
    }
}

function updateEstTotals(componentTotals) {
    if (!componentTotals) return;

    const actualTable = document.querySelector('.actual-table');
    if (!actualTable) return;

    // Update Sublet total
    const subletTotal = actualTable.querySelector('.subtotal-row.sublet-subtotal .est-total');
    if (subletTotal && componentTotals.Sublet) {
        subletTotal.textContent = componentTotals.Sublet;
    }

    // Update Consumables total
    const consumablesTotal = actualTable.querySelector('.subtotal-row.consumables-subtotal .est-total');
    if (consumablesTotal && componentTotals.Consumables) {
        consumablesTotal.textContent = componentTotals.Consumables;
    }

    // Update Labour total
    const labourTotal = actualTable.querySelector('.subtotal-row.labour-subtotal .est-total');
    if (labourTotal && componentTotals.Labour) {
        labourTotal.textContent = componentTotals.Labour;
    }

    // Recalculate variations after updating totals
    calculateEstVariation();
}


async function updateActualTableQuantities() {
    try {
        // Fetch sublet data
        const subletResponse = await fetch('/api/servicerequest/sublet/');
        const subletResult = await subletResponse.json();

        // Fetch consumables data
        const urlParams = new URLSearchParams(window.location.search);
        const incidentNumber = urlParams.get('service_request_id');
        
        console.log('Incident Number:', incidentNumber);
        const consumablesResponse = await fetch(`/api/servicerequest/consumables/${incidentNumber}`);
        const consumablesResult = await consumablesResponse.json();
        
        console.log('Consumables API Response:', consumablesResult);

        const actualTable = document.querySelector('.actual-table');

        // Update sublet rows
        if (subletResult.success && subletResult.data.length > 0) {
            const latestSublet = subletResult.data[subletResult.data.length - 1];
            const subletRows = actualTable.querySelectorAll('.sublet-row');
            subletRows.forEach(row => {
                const actQtyCell = row.querySelector('td:nth-child(9)');
                if (actQtyCell) {
                    actQtyCell.textContent = latestSublet.transaction_amount || '0';
                }
            });
        }

        // Update consumable rows
        if (consumablesResult.status === "success") {
            const consumablesData = consumablesResult.data;
            const consumableRows = actualTable.querySelectorAll('.consumable-row');
            
            consumableRows.forEach(row => {
                const componentCodeCell = row.querySelector('td:nth-child(5)');
                if (componentCodeCell) {
                    const componentCode = componentCodeCell.textContent;
                    const consumable = consumablesData.find(c => c.component_code === componentCode);
                    if (consumable) {
                        const actQtyCell = row.querySelector('td:nth-child(9)');
                        if (actQtyCell) {
                            actQtyCell.textContent = consumable.existing_trans_qty || '0';
                        }
                    }
                }
            });
        }

        // Recalculate all totals
        calculateNetPrice();
        updateSubletTotals();
        calculateVATAndFinalAmount();
        calculateEstVariation();

    } catch (error) {
        console.error('Error updating actual quantities:', error);
    }
}


function calculateNetPrice() {
    const actualTable = document.querySelector('.actual-table');
    const rows = actualTable.querySelectorAll('.sublet-row, .labor-row, .consumable-row');
    
    rows.forEach(row => {
        const actQtyCell = row.querySelector('td:nth-child(9)');
        const sellingPriceCell = row.querySelector('td:nth-child(10)');
        const netPriceCell = row.querySelector('td:nth-child(11)');
        
        if (actQtyCell && sellingPriceCell && netPriceCell) {
            const actQty = parseFloat(actQtyCell.textContent) || 0;
            const sellingPrice = parseFloat(sellingPriceCell.textContent) || 0;
            const netPrice = actQty * sellingPrice;
            
            netPriceCell.textContent = netPrice.toFixed(2);
        }
    });

    updateSubletTotals(); // Update subtotals and grand totals
}

function calculateVATAndFinalAmount() {
    const actualTable = document.querySelector('.actual-table');
    const rows = actualTable.querySelectorAll('.sublet-row, .labor-row, .consumables-row');
    
    // Calculate VAT for individual rows
    rows.forEach(row => {
        const netPriceCell = row.querySelector('td:nth-child(11)');
        const vatCell = row.querySelector('td:nth-child(15)'); // VAT amount cell
        const finalAmountCell = row.querySelector('td:nth-child(16)'); // Final amount cell
        
        if (netPriceCell && vatCell && finalAmountCell) {
            const netPrice = parseFloat(netPriceCell.textContent) || 0;
            const vatAmount = netPrice * 0.05; // 5% VAT
            const finalAmount = netPrice + vatAmount;
            
            vatCell.textContent = vatAmount.toFixed(2);
            finalAmountCell.textContent = finalAmount.toFixed(2);
        }
    });

    // Calculate VAT for subtotal rows
    const subtotalRows = actualTable.querySelectorAll('.subtotal-row');
    subtotalRows.forEach(row => {
        const netAmountCell = row.querySelector('.net-amount');
        const vatCell = row.querySelector('.vat-amount');
        const finalAmountCell = row.querySelector('.final-amount');
        
        if (netAmountCell && vatCell && finalAmountCell) {
            const netAmount = parseFloat(netAmountCell.textContent) || 0;
            const vatAmount = netAmount * 0.05; // 5% VAT
            const finalAmount = netAmount + vatAmount;
            
            vatCell.textContent = vatAmount.toFixed(2);
            finalAmountCell.textContent = finalAmount.toFixed(2);
        }
    });

    // Update grand total row
    const totalRow = actualTable.querySelector('.total-row');
    if (totalRow) {
        const totalNetAmount = parseFloat(totalRow.querySelector('td:nth-child(14)').textContent) || 0;
        const totalVatCell = totalRow.querySelector('td:nth-child(15)');
        const totalFinalAmountCell = totalRow.querySelector('td:nth-child(16)');
        
        const totalVat = totalNetAmount * 0.05;
        const totalFinalAmount = totalNetAmount + totalVat;
        
        totalVatCell.textContent = totalVat.toFixed(2);
        totalFinalAmountCell.textContent = totalFinalAmount.toFixed(2);
    }
    calculateEstVariation();    
}



function calculateConsumablesVAT() {
    const actualTable = document.querySelector('.actual-table');
    
    const consumableRows = actualTable.querySelectorAll('.consumable-row');
    let consumableTotal = 0;

    consumableRows.forEach(row => {
        const netPriceCell = row.querySelector('td:nth-child(11)');
        const vatCell = row.querySelector('td:nth-child(15)');
        const finalAmountCell = row.querySelector('td:nth-child(16)');
        
        const netPrice = parseFloat(netPriceCell.textContent) || 0;
        const vatAmount = netPrice * 0.05; // 5% VAT
        const finalAmount = netPrice + vatAmount;
        
        vatCell.textContent = vatAmount.toFixed(2);
        finalAmountCell.textContent = finalAmount.toFixed(2);
        
        consumableTotal += netPrice;
    });

   // Update consumables subtotal row specifically
   const consumableSubtotalRow = actualTable.querySelector('.consumables-subtotal');
   if (consumableSubtotalRow) {
       const netAmountCell = consumableSubtotalRow.querySelector('.net-amount');
       const vatAmountCell = consumableSubtotalRow.querySelector('.vat-amount');
       const finalAmountCell = consumableSubtotalRow.querySelector('.final-amount');
       
       // Set net amount
       netAmountCell.textContent = consumableTotal.toFixed(2);
       
       // Calculate and set VAT
       const totalVat = consumableTotal * 0.05;
       vatAmountCell.textContent = totalVat.toFixed(2);
       
       // Calculate and set final amount
       const totalFinal = consumableTotal + totalVat;
       finalAmountCell.textContent = totalFinal.toFixed(2);
       
       // Update est-variation if needed
       const estTotalCell = consumableSubtotalRow.querySelector('.est-total');
       const estVariationCell = consumableSubtotalRow.querySelector('.est-variation');
       const estTotal = parseFloat(estTotalCell.textContent) || 0;
       const variation = totalFinal - estTotal;
       estVariationCell.textContent = variation.toFixed(2);
   }
}



function calculateEstVariation() {
    const actualTable = document.querySelector('.actual-table');
    const subletTotalRow = actualTable.querySelector('.subtotal-row');
    
    if (subletTotalRow) {
        const netAmountCell = subletTotalRow.querySelector('.net-amount');  // Changed from final-amount
        const estTotalCell = subletTotalRow.querySelector('.est-total');
        const estVariationCell = subletTotalRow.querySelector('.est-variation');
        
        const netAmount = parseFloat(netAmountCell.textContent) || 0;  // Now using net amount
        const estTotal = parseFloat(estTotalCell.textContent) || 0;
        
        const variation = netAmount - estTotal;  // Calculating variation using net amount
        estVariationCell.textContent = variation.toFixed(2);
    }
}


function recalculateAllTotals(editedCell) {
    const row = editedCell.closest('.subtotal-row');
    const netPriceTotal = parseFloat(row.querySelector('.net-price-total').textContent) || 0;
    const adjustment = parseFloat(row.querySelector('.adjustment-cell').textContent) || 0;
    const discount = parseFloat(row.querySelector('.discount-cell').textContent) || 0;
    
    // Calculate net amount after adjustments and discounts
    let netAmount = netPriceTotal + adjustment;
    netAmount = netAmount - (netAmount * discount / 100);
    
    // Update net amount
    row.querySelector('.net-amount').textContent = netAmount.toFixed(2);
    
    // Recalculate VAT and final amount
    calculateVATAndFinalAmount();
}


function initializeEditableCells() {
    const editableCells = document.querySelectorAll('.editable-cell');
    
    editableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const currentValue = this.textContent;
            this.contentEditable = true;
            this.focus();
        });

        cell.addEventListener('blur', function() {
            this.contentEditable = false;
            calculateTotals(cell.dataset.type);
        });

        cell.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { 
                e.preventDefault();
                this.blur();
            }
        });
    });
}


function initializeEditableCells() {
    const editableCells = document.querySelectorAll('.editable-cell');
    
    editableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const currentValue = this.textContent;
            this.contentEditable = true;
            this.focus();
        });

        cell.addEventListener('blur', function() {
            this.contentEditable = false;
            recalculateAllTotals(this);
        });

        cell.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });
}

function updateSubletTotals() {
    const actualTable = document.querySelector('.actual-table');
    const subletRows = actualTable.querySelectorAll('.sublet-row');
    let subletTotal = 0;
    
    subletRows.forEach(row => {
        const netPriceCell = row.querySelector('td:nth-child(11)');
        if (netPriceCell) {
            subletTotal += parseFloat(netPriceCell.textContent) || 0;
        }
    });

    const subletTotalRow = actualTable.querySelector('.subtotal-row');
    if (subletTotalRow) {
        const cells = {
            netPriceTotal: subletTotalRow.querySelector('.net-price-total'),
            netAmount: subletTotalRow.querySelector('.net-amount'),
            estTotal: subletTotalRow.querySelector('.est-total')
        };

        Object.values(cells).forEach(cell => {
            if (cell) {
                cell.textContent = subletTotal.toFixed(2);
            }
        });

        calculateVATAndFinalAmount();
    }
}

function calculateVATAndFinalAmount() {
    const actualTable = document.querySelector('.actual-table');
    const subletTotalRow = actualTable.querySelector('.subtotal-row');
    
    if (subletTotalRow) {
        const netAmountCell = subletTotalRow.querySelector('.net-amount');
        const vatCell = subletTotalRow.querySelector('.vat-amount');
        const finalAmountCell = subletTotalRow.querySelector('.final-amount');
        
        const netAmount = parseFloat(netAmountCell.textContent) || 0;
        const vatRate = 5;
        
        const vatAmount = (netAmount * vatRate) / 100;
        vatCell.textContent = vatAmount.toFixed(2);
        
        const finalAmount = netAmount + vatAmount;
        finalAmountCell.textContent = finalAmount.toFixed(2);

        // Calculate Est.Variation immediately after updating final amount
        calculateEstVariation();
    }
}


function recalculateAllTotals(editedCell) {
    const row = editedCell.closest('.subtotal-row');
    const netPriceTotal = parseFloat(row.querySelector('.net-price-total').textContent) || 0;
    const adjustment = parseFloat(row.querySelector('.adjustment-cell').textContent) || 0;
    const discount = parseFloat(row.querySelector('.discount-cell').textContent) || 0;
    
    // Calculate net amount after adjustments and discounts
    let netAmount = netPriceTotal + adjustment;
    netAmount = netAmount - (netAmount * discount / 100);
    
    // Update net amount
    row.querySelector('.net-amount').textContent = netAmount.toFixed(2);
    
    // Recalculate VAT and final amount
    calculateVATAndFinalAmount();
}

function closeConsumablesModal() {
    const modal = document.getElementById('consumablesModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const applyAdvanceBtn = document.querySelector('.actual-content .btn-green');
    if (applyAdvanceBtn) {
        applyAdvanceBtn.addEventListener('click', toggleCreditTable);
    }
});


// Add this function to show messages
function showMessage(message, isSuccess = true) {
    const messageDiv = document.createElement('div');
    const icon = isSuccess ? '✓' : '✕';

    messageDiv.style.cssText = `
        position: fixed;
        top: -50px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 13px;
        color: white;
        background-color: ${isSuccess ? '#4CAF50' : '#f44336'};
        z-index: 1000;
        transition: all 0.5s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    messageDiv.innerHTML = `
        <span style="font-size: 16px; font-weight: bold;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.top = '20px';
        messageDiv.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        messageDiv.style.top = '-50px';
        messageDiv.style.opacity = '0';
    }, 2500);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}






async function displayActualTableData(incidentNumber) {
    try {
        const [estimateResponse, componentResponse] = await Promise.all([
            fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`),
            fetch(`/api/servicerequest/get-component-values/${incidentNumber}`)
        ]);

        const estimateResult = await estimateResponse.json();
        const componentValues = await componentResponse.json();

        console.log('Component Values:', componentValues);

        if (estimateResult.status === "success") {
            const groupedData = groupDataByComponentType(estimateResult.data);
            const tbody = document.querySelector('.actual-table tbody');
       
            let grandTotal = {
                netPrice: 0,
                adjustment: 0,
                discount: 0,
                netAmount: 0,
                vat: 0,
                finalAmount: 0
            };

            const subletAmounts = componentValues.data.sublet_values.map(sv => sv.transaction_amount);
            let subletIndex = 0;

            Object.entries(groupedData).forEach(([componentType, items]) => {
                let isFirstRow = true;
                let groupTotal = 0;
                let subletIndex = 0; // Reset index per component type
            
                // Inside displayActualTableData function, modify the items.forEach loop:

                items.forEach(item => {
                    const row = document.createElement('tr');
                    row.className = componentType === 'Consumables' ? 'consumable-row' : `${componentType.toLowerCase()}-row`;
                    
                    // Calculate netPrice for the current item
                    const netPrice = parseFloat(item.net_price) || 0;
                    const sellingPrice = parseFloat(item.selling_price) || 0;
                    
                    let actualQty = '';
                    if (componentType === 'Labour' && componentValues.data.labor_values.length > 0) {
                        actualQty = componentValues.data.labor_values[0].trx_qty;
                    } else  if (componentType === 'Sublet') {
                        actualQty = subletAmounts[subletIndex] || '';
                        subletIndex++;
                    } else if (componentType === 'Consumables') {
                        const consumableValue = componentValues.data.consumable_values.find(c => 
                            c.component_code === item.component_code
                        );
                        actualQty = consumableValue ? consumableValue.trans_qty : '';
                    }

                    // Always set the net_price and est_total regardless of row position
                    row.innerHTML = `
                        <td>${isFirstRow ? `<span class="edit-icon" onclick="show${componentType}Modal(this)" style="cursor: pointer;">✎</span>` : ''}</td>
                        <td>${isFirstRow ? `<span class="${componentType.toLowerCase()}-link" onclick="show${componentType}Modal(this)">${componentType}</span>` : ''}</td>
                        <td>${item.activity_line}</td>
                        <td>${item.activity_desc}</td>
                        <td>${item.component_code}</td>
                        <td>${item.component_description}</td>
                        <td>${item.estimate_status}</td>
                        <td>${item.suggested_quantity}</td>
                        <td>${actualQty}</td>
                        <td>${sellingPrice.toFixed(2)}</td>
                        <td>${netPrice.toFixed(2)}</td>
                        <td class="editable-cell adjustment-cell"></td>
                        <td class="editable-cell discount-cell"></td>
                        <td class="net-amount">${netPrice.toFixed(2)}</td>
                        <td class="vat-amount"></td>
                        <td class="final-amount"></td>
                        <td class="est-total">${netPrice.toFixed(2)}</td>
                        <td class="est-variation"></td>
                    `;

                    tbody.appendChild(row);
                    isFirstRow = false;
                    groupTotal += netPrice;
                });


                // In your displayActualTableData function, update the subtotal row creation:
                const subtotalRow = document.createElement('tr');
                subtotalRow.className = `subtotal-row ${componentType.toLowerCase()}-subtotal`;

                // Calculate subtotal from all items in this group
                const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

                subtotalRow.innerHTML = `
                    <td colspan="10" style="text-align: right">${componentType} Total</td>
                    <td class="net-price-total">${subtotal.toFixed(2)}</td>
                    <td class="editable-cell adjustment-cell"></td>
                    <td class="editable-cell discount-cell"></td>
                    <td class="net-amount">${subtotal.toFixed(2)}</td>
                    <td class="vat-amount"></td>
                    <td class="final-amount">${subtotal.toFixed(2)}</td>
                    <td class="est-total">${componentTotals[componentType] || '0.00'}</td>
                    <td class="est-variation"></td>
                `;
                tbody.appendChild(subtotalRow);
                
                grandTotal.netPrice += groupTotal;
            });

            const totalRow = document.createElement('tr');
            totalRow.className = 'total-row';
            totalRow.innerHTML = `
                <td colspan="10" style="text-align: right">TOTAL(s)</td>
                <td>${grandTotal.netPrice.toFixed(2)}</td>
                <td>${grandTotal.adjustment.toFixed(2)}</td>
                <td>${grandTotal.discount.toFixed(2)}</td>
                <td>${grandTotal.netAmount.toFixed(2)}</td>
                <td>${grandTotal.vat.toFixed(2)}</td>
                <td>${grandTotal.finalAmount.toFixed(2)}</td>
                <td>${grandTotal.netPrice.toFixed(2)}</td>
                <td></td>
            `;
            tbody.appendChild(totalRow);
            const componentTotals = await fetchEstimateTotals();
            if (componentTotals) {
                updateEstTotals(componentTotals);
            }
            initializeEditableCells();
            calculateVATAndFinalAmount();
            calculateNetPrice();
            calculateVATAndFinalAmount();
            updateEstTotals(componentTotals);
        }
    } catch (error) {
        console.error('Error fetching actual table data:', error);
    }
}


function groupDataByComponentType(data) {
    return data.reduce((groups, item) => {
        const type = item.component_type;
        if (!groups[type]) groups[type] = [];
        groups[type].push(item); // Keep all line items
        return groups;
    }, {});
}



