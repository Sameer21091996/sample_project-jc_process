let newlyAddedRows = [];

function updateTotalNetPrice() {
    const tbody = document.querySelector('.estimate-table tbody');
    const rows = tbody.getElementsByTagName('tr');
    let total = 0;

    Array.from(rows).forEach(row => {
        const netPriceCell = row.cells[11];
        total += parseFloat(netPriceCell.textContent) || 0;
    });

    const totalCell = document.querySelector('.estimate-table tfoot td:last-child');
    if (totalCell) {
        totalCell.textContent = formatCurrency(total);
    }
}

function calculateRowNetPrice(row) {
    const actualQty = parseFloat(row.cells[8].textContent) || 0;
    const sellingPrice = parseFloat(row.cells[10].textContent) || 0;
    const netPrice = actualQty * sellingPrice;
    row.cells[11].textContent = formatCurrency(netPrice);
    updateTotalNetPrice();
}


function storeRowState(row) {
    return {
        html: row.innerHTML,
        componentType: $(row).find('.component-type-select').val(),
        activityLine: $(row).find('.activity-line-select').val(),
        componentCode: $(row).find('.component-code-select').val(),
        description: row.cells[5].textContent,
        status: row.cells[6].textContent,
        actualQty: row.cells[8].textContent,
        onHandQty: row.cells[9].textContent,
        sellingPrice: row.cells[10].textContent
    };
}
function storeEstimateState() {
    const tbody = document.querySelector('.estimate-table tbody');
    const newRows = tbody.querySelectorAll('tr.new-row');
    
    newlyAddedRows = Array.from(newRows).map(row => {
        return {
            html: row.innerHTML,
            componentType: $(row).find('.component-type-select').val(),
            activityLine: $(row).find('.activity-line-select').val(),
            componentCode: $(row).find('.component-code-select').val(),
            description: row.cells[5].textContent,
            status: row.cells[6].textContent,
            actualQty: row.cells[8].textContent,
            onHandQty: row.cells[9].textContent,
            sellingPrice: row.cells[10].textContent
        };
    });
}

async function loadEstimateLines() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!incidentNumber) {
        console.error('No incident number found in URL');
        return;
    }

    try {
        const response = await fetch(`/api/servicerequest/Estimate-only/${incidentNumber}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch estimate lines');
        }

        const result = await response.json();
        console.log('Estimate lines response:', result);

        if (result.status === 'success' && result.data) {
            displayEstimateLines(result.data);
            restoreNewlyAddedRows();
            updateEstimateTotal(result.data);
        }
    } catch (error) {
        console.error('Error loading estimate lines:', error);
    }
}

function restoreNewlyAddedRows() {
    const tbody = document.querySelector('.estimate-table tbody');
    
    newlyAddedRows.forEach(rowState => {
        const newRow = document.createElement('tr');
        newRow.classList.add('new-row');
        
        // Create the basic row structure
        newRow.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox"></td>
            <td>
                <select class="component-type-select" data-lookup="COMPONENT TYPE">
                    <option value=""></option>
                </select>
            </td>
            <td>
                <select class="activity-line-select">
                    <option value=""></option>
                </select>
            </td>
            <td>${rowState.activityDesc || ''}</td>
            <td>
                <select class="component-code-select">
                    <option value=""></option>
                </select>
            </td>
            <td>${rowState.description || ''}</td>
            <td>${rowState.status || ''}</td>
            <td></td>
            <td contenteditable="true">${rowState.actualQty || '0'}</td>
            <td>${rowState.onHandQty || '0'}</td>
            <td>${rowState.sellingPrice || '0.00'}</td>
            <td>0.00</td>
        `;
        
        tbody.appendChild(newRow);

        // Initialize and set values for dropdowns
        const componentTypeSelect = newRow.querySelector('.component-type-select');
        if (componentTypeSelect) {
            populateDropdown(componentTypeSelect, 'COMPONENT TYPE').then(() => {
                $(componentTypeSelect).val(rowState.componentType).trigger('change');
            });
        }

        const activityLineSelect = newRow.querySelector('.activity-line-select');
        if (activityLineSelect) {
            initializeActivityLineSelect(activityLineSelect).then(() => {
                $(activityLineSelect).val(rowState.activityLine).trigger('change');
            });
        }

        const componentCodeSelect = newRow.querySelector('.component-code-select');
        if (componentCodeSelect) {
            initializeComponentCodeSelect(componentCodeSelect).then(() => {
                $(componentCodeSelect).val(rowState.componentCode).trigger('change');
            });
        }

        calculateRowNetPrice(newRow);
    });
}


async function fetchDropdownOptions(lookupName) {
    // URL encode the lookup name to handle spaces
    const encodedLookupName = encodeURIComponent(lookupName);
    const response = await fetch(`/api/servicerequest/dropdown-options/${encodedLookupName}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch dropdown options');
    }
    return await response.json();
}

async function fetchItemCodes() {
    try {
        const response = await fetch('/api/servicerequest/item-codes');
        if (!response.ok) {
            throw new Error('Failed to fetch item codes');
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching item codes:', error);
        return [];
    }
}
async function fetchActivityLineOptions() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    
    try {
        // Fetch from the operation lines endpoint instead
        const response = await fetch(`/api/servicerequest/operation-line/${incidentNumber}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            return result.data.map(item => ({
                activity_line: item.operation_code,
                activity_desc: item.problem,
                estimate_status: 'Created'
            }));
        }
    } catch (error) {
        console.error('Error fetching activity line options:', error);
    }
    return [];
}


async function populateDropdown(selectElement, lookupName) {
    try {
        const data = await fetchDropdownOptions(lookupName);
        const dropdownData = [];

        // Handle different response formats
        if (data && data.meanings) {
            data.meanings.forEach(meaning => {
                dropdownData.push({
                    id: meaning,
                    text: meaning
                });
            });
        }

        // Initialize Select2 with prepared data
        $(selectElement).select2({
            data: dropdownData,
            placeholder: 'Select an option',
            allowClear: true,
            width: '100%'
        });

        // Set value if exists
        if (selectElement.value) {
            $(selectElement).val(selectElement.value).trigger('change');
        }

    } catch (error) {
        console.log('Dropdown data:', data);
        // Initialize empty dropdown on error
        $(selectElement).select2({
            data: [],
            placeholder: 'Select an option',
            allowClear: true,
            width: '100%'
        });
    }
}

async function initializeComponentCodeSelect(selectElement) {
    const items = await fetchItemCodes();
    
    $(selectElement).select2({
        data: items.map(item => ({
            id: item.ITEM_CODE,
            text: item.ITEM_CODE,
            item: item
        })),
        placeholder: 'Select Component Code',
        allowClear: true,
        width: '100%'
    });

    $(selectElement).on('select2:select', function(e) {
        const selectedItem = e.params.data.item;
        const row = selectElement.closest('tr');
        const cells = row.getElementsByTagName('td');
        cells[5].textContent = selectedItem.DESCRIPTION || '';
        cells[9].textContent = selectedItem.OH_QUANTITY || '0';
        cells[10].textContent = formatCurrency(selectedItem.SELLING_PRICE) || '0.00';
        calculateRowNetPrice(row);

    });
}

async function initializeActivityLineSelect(selectElement) {
    const activityLines = await fetchActivityLineOptions();
    
    $(selectElement).select2({
        data: activityLines.map(item => ({
            id: item.activity_line,
            text: item.activity_line,
            item: item
        })),
        placeholder: 'Select Activity Line',
        allowClear: true,
        width: '100%'
    });

    $(selectElement).on('select2:select', function(e) {
        const selectedItem = e.params.data.item;
        const row = selectElement.closest('tr');
        const cells = row.getElementsByTagName('td');
        cells[3].textContent = selectedItem.activity_desc || '';
       
    });
}

function initializeDropdowns() {
    $('.component-type-select').each(function() {
        const lookupName = $(this).data('lookup');
        populateDropdown(this, lookupName);
    });
}

function displayEstimateLines(estimateLines) {
    const tbody = document.querySelector('.estimate-table tbody');
    tbody.innerHTML = '';

    // Filter out any records with record_type 'Actual'
    const estimateOnlyLines = estimateLines.filter(line => line.record_type !== 'Actual');

    estimateOnlyLines.forEach(line => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox"></td>
            <td>${line.component_type || ''}</td>
            <td>${line.activity_line || ''}</td>
            <td>${line.activity_desc || ''}</td>
            <td>${line.component_code || ''}</td>
            <td>${line.component_description || ''}</td>
            <td>${line.estimate_status || ''}</td>
            <td>${line.suggested_quantity || '0'}</td>
            <td>${line.actual_quantity || '0'}</td>
            <td>${line.on_hand_quantity || '0'}</td>
            <td>${formatCurrency(line.selling_price) || '0.00'}</td>
            <td>${formatCurrency(line.net_price) || '0.00'}</td>
        `;
        tbody.appendChild(newRow);
        calculateRowNetPrice(newRow);
    });
}


function updateEstimateTotal(estimateLines) {
    const total = estimateLines.reduce((sum, line) => sum + (parseFloat(line.net_price) || 0), 0);
    const totalCell = document.querySelector('.estimate-table tfoot td:last-child');
    if (totalCell) {
        totalCell.textContent = formatCurrency(total);
    }
}

function formatCurrency(value) {
    return parseFloat(value || 0).toFixed(2);
}

document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .estimate-table tr.new-row td:nth-child(2),
        .estimate-table tr.new-row td:nth-child(3),
        .estimate-table tr.new-row td:nth-child(5),
        .estimate-table tr.new-row td:nth-child(9)
        {
            background-color: #FFFFD4;
        }
        .total-row {
            background-color: #E8FFE8 !important;
        }
        .total-row td {
            background-color: #E8FFE8 !important;
        }
        .select2-container {
            width: 100% !important;
        }
    `;
    document.head.appendChild(style);

    initializeDropdowns();

    if (document.querySelector('.tab.active').textContent === 'ESTIMATE') {
        loadEstimateLines();
    }

    document.querySelector('.estimate-table tbody').addEventListener('input', function(e) {
        const cell = e.target.closest('td[contenteditable="true"]');
        const row = cell?.closest('tr');
        if (cell && row) {
            if (cell === row.cells[7] || cell === row.cells[8]) {
                calculateRowNetPrice(row);
                updateTotalNetPrice();
            }
        }
    });
    


    const createEstimateButton = document.querySelector('.btn-create-estimate');
    if (createEstimateButton) {
        createEstimateButton.addEventListener('click', handleCreateEstimate);
    }
});

    const btnFinalize = document.querySelector('.btn-finalize');
    if (btnFinalize) {
        btnFinalize.addEventListener('click', handleFinalizeEstimate);
    }
    
    const btnGetQty = document.querySelector('.btn-get-qty');
    if (btnGetQty) {
        btnGetQty.addEventListener('click', loadEstimateLines);
    }

    const plusIcon = document.querySelector('.plus-icon');
    if (plusIcon) {
        plusIcon.addEventListener('click', function() {
            const tbody = document.querySelector('.estimate-table tbody');
            const newRow = document.createElement('tr');
            newRow.classList.add('new-row');
            const rowHTML = `
                    <td class="checkbox-cell"><input type="checkbox"></td>
                    <td>
                        <select class="component-type-select" data-lookup="COMPONENT TYPE">
                            <option value=""></option>
                        </select>
                    </td>
                    <td>
                        <select class="activity-line-select">
                            <option value=""></option>
                        </select>
                    </td>
                    <td></td>
                    <td>
                        <select class="component-code-select">
                            <option value=""></option>
                        </select>
                    </td>
                    <td></td>
                    <td></td>
                    <td contenteditable="true">1</td>
                    <td contenteditable="true">0</td>
                    <td></td>
                    <td></td>
                    <td>0.00</td>
                `;

            
            newRow.innerHTML = rowHTML;
            tbody.appendChild(newRow);
    
            newlyAddedRows.push(rowHTML);
    
            const componentTypeSelect = newRow.querySelector('.component-type-select');
            populateDropdown(componentTypeSelect, 'COMPONENT TYPE');
    
            const activityLineSelect = newRow.querySelector('.activity-line-select');
            initializeActivityLineSelect(activityLineSelect);
    
            const componentCodeSelect = newRow.querySelector('.component-code-select');
            initializeComponentCodeSelect(componentCodeSelect);
            
         const newRowNetPriceCell = newRow.querySelector('td:last-child');
            calculateRowNetPrice(newRow);


            updateCreateEstimateButtonState();
        });
    }
    
    const minusIcon = document.querySelector('.minus-icon');
    if (minusIcon) {
        minusIcon.addEventListener('click', function() {
            const tbody = document.querySelector('.estimate-table tbody');
            const checkedBoxes = tbody.querySelectorAll('input[type="checkbox"]:checked');
            
            checkedBoxes.forEach(checkbox => {
                const row = checkbox.closest('tr');
                if (row.classList.contains('new-row')) {
                    const index = Array.from(tbody.children).indexOf(row);
                    if (index !== -1) {
                        newlyAddedRows.splice(index, 1);
                    }
                    row.remove();
                }
            });
            updateCreateEstimateButtonState();
        });
    }

    updateCreateEstimateButtonState();

    
    document.addEventListener('DOMContentLoaded', function() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                if (document.querySelector('.tab.active').textContent === 'ESTIMATE') {
                    storeEstimateState();
                }
                
                if (this.textContent === 'ESTIMATE') {
                    loadEstimateLines();
                }
            });
        });
    });
    
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.estimate-table tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
    // Update total after loading estimate lines
    const originalLoadEstimateLines = loadEstimateLines;
    loadEstimateLines = async function() {
        await originalLoadEstimateLines();
        updateTotalNetPrice();
    };




// Add function to check and update button state
function updateCreateEstimateButtonState() {
    const createEstimateButton = document.querySelector('.btn-create-estimate');
    if (createEstimateButton) {
        const newRows = document.querySelectorAll('tr.new-row');
        createEstimateButton.disabled = newRows.length === 0;
    }
}

async function handleCreateEstimate() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!incidentNumber) {
        alert('No incident number found in URL');
        return;
    }

    // Get only new rows
    const newRows = document.querySelectorAll('tr.new-row');
    
    if (newRows.length === 0) {
        alert('No new rows to create estimate');
        return;
    }

    const estimates = [];

    newRows.forEach(row => {
        const componentType = row.querySelector('.component-type-select')?.value || '';
        const activityLine = row.querySelector('.activity-line-select')?.value || '';
        const activityDesc = row.cells[3].textContent.trim();
        const componentCode = row.querySelector('.component-code-select')?.value || '';
        const componentDescription = row.cells[5].textContent.trim();
        const suggestedQty = parseFloat(row.cells[7].textContent) || 0;
        const onHandQty = parseFloat(row.cells[9].textContent) || 0;
        const actualQty = parseFloat(row.cells[8].textContent) || 0;
        const sellingPrice = parseFloat(row.cells[10].textContent) || 0;

        estimates.push({
            component_type: componentType,
            activity_line: activityLine,
            activity_desc: activityDesc,
            component_code: componentCode || null,
            component_description: componentDescription || null,
            estimate_status: 'Created',
            suggested_quantity: suggestedQty,
            actual_quantity: actualQty,
            on_hand_quantity:onHandQty ,
            selling_price: sellingPrice
        });
    });

    // Validate MATERIAL components
    const invalidRows = estimates.filter(est => 
        est.component_type === 'MATERIAL' && !est.component_code
    );

    if (invalidRows.length > 0) {
        alert('Component code is required for all MATERIAL type items');
        return;
    }

    try {
        const response = await fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                estimates,
                update_existing: true
            })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            alert('Estimate lines created successfully');
            newlyAddedRows = []; // Clear the newly added rows array
            await loadEstimateLines(); // Refresh the table
            updateCreateEstimateButtonState(); // Update button state after clearing rows
        } else {
            throw new Error(result.error || 'Failed to create estimates');
        }
    } catch (error) {
        console.error('Create Estimate Error:', error);
        alert(`Error: ${error.message}`);
    }
}


async function handleFinalizeEstimate() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!incidentNumber) {
        alert('No incident number found in URL');
        return;
    }

    // Get all existing rows (excluding new rows)
    const tbody = document.querySelector('.estimate-table tbody');
    const existingRows = Array.from(tbody.querySelectorAll('tr:not(.new-row)'));
    
    if (existingRows.length === 0) {
        alert('No estimate lines to finalize');
        return;
    }

    const estimates = existingRows.map(row => {
        return {
            component_type: row.cells[1].textContent.trim(),
            activity_line: row.cells[2].textContent.trim(),
            activity_desc: row.cells[3].textContent.trim(),
            component_code: row.cells[4].textContent.trim() || null,
            component_description: row.cells[5].textContent.trim(),
            estimate_status: 'Finalized', // Set status to Finalized
            suggested_quantity: 1,
            actual_quantity: parseFloat(row.cells[8].textContent) || 0,
            
            selling_price: parseFloat(row.cells[10].textContent) || 0
        };
    });

    try {
        const response = await fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                estimates,
                update_existing: true
            })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            alert('Estimate lines finalized successfully');
            await loadEstimateLines(); // Refresh the table
        } else {
            throw new Error(result.error || 'Failed to finalize estimates');
        }
    } catch (error) {
        console.error('Finalize Estimate Error:', error);
        alert(`Error: ${error.message}`);
    }
}