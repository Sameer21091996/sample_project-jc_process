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
        const response = await fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`);
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
        cells[6].textContent = selectedItem.estimate_status || '';
    });
}

function initializeDropdowns() {
    $('.component-type-select').each(function() {
        const lookupName = $(this).data('lookup');
        populateDropdown(this, lookupName);
    });
}

async function handleDeleteEstimateLine(activityLine, row) {
    // Get the row ID from the data attribute
    const rowId = row.getAttribute('data-id');
    
    // Get the current incident number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!rowId || !incidentNumber) {
        console.error('Missing required IDs for deletion');
        alert('Error: Missing required information for deletion');
        return;
    }

    try {
        // First fetch the service request details to get the service_request_id
        const detailsResponse = await fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`);
        const detailsData = await detailsResponse.json();
        
        if (!detailsData.service_request_id) {
            throw new Error('Could not find service request ID');
        }

        // Now we have both IDs needed for deletion
        const serviceRequestId = detailsData.service_request_id;

        // Show confirmation dialog
        if (!confirm('Are you sure you want to delete this estimate line?')) {
            return;
        }

        // Make the delete request
        const deleteResponse = await fetch(`/api/servicerequest/delete/${serviceRequestId}/${rowId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await deleteResponse.json();

        if (result.status === 'success') {
            // Remove the row from the table
            row.remove();
            
            // Update the total
            updateTotalNetPrice();
            
            // Show success message
            alert('Estimate line deleted successfully');
            
            // Optionally refresh the entire table
            await loadEstimateLines();
        } else {
            throw new Error(result.error || 'Failed to delete estimate line');
        }
    } catch (error) {
        console.error('Delete Estimate Line Error:', error);
        alert(`Error: ${error.message}`);
    }
}

function displayEstimateLines(estimateLines) {
    const tbody = document.querySelector('.estimate-table tbody');
    tbody.innerHTML = '';

    const groupedLines = groupByActivityLine(estimateLines);

    Object.keys(groupedLines).forEach(activityLine => {
        let isFirstRow = true;

        groupedLines[activityLine].forEach(line => {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', line.id);

            newRow.innerHTML = `
                <td class="checkbox-cell">
                    <input type="checkbox">
                    <span class="delete-icon cursor-pointer ml-2" title="Delete">&times;</span>
                </td>
                <td>${isFirstRow ? line.activity_line : ''}</td>
                <td>${line.component_type || ''}</td>
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

            // Add event listeners
            const checkbox = newRow.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function () {
                newRow.classList.toggle('selected', this.checked);
            });

            const deleteIcon = newRow.querySelector('.delete-icon');
            deleteIcon.addEventListener('click', () => handleDeleteEstimateLine(line.activity_line, newRow));

            isFirstRow = false; // After first row, leave activity_line empty for grouped rows
        });
    });
}

// Helper function to group lines by activity_line
function groupByActivityLine(estimateLines) {
    return estimateLines.reduce((groups, line) => {
        const key = line.activity_line || 'Other';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(line);
        return groups;
    }, {});
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
   

        .delete-icon {
            color: white; /* White "X" */
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #dc2626; /* Red background */
            border: 2px solid #991b1b; /* Dark red border */
            border-radius: 2px; /* Slightly rounded edges */
            transition: background 0.3s, border 0.3s;
        }
        .delete-icon:hover {
            background-color: #991b1b; /* Darker red on hover */
            border-color: #7f1d1d; /* Even darker border */
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
        plusIcon.addEventListener('click', async function() {  // Made this async
            const tbody = document.querySelector('.estimate-table tbody');
            const existingRows = tbody.getElementsByTagName('tr');
            
            // Get the last row if it exists
            const lastRow = existingRows.length > 0 ? existingRows[existingRows.length - 1] : null;
            
            const newRow = document.createElement('tr');
            newRow.classList.add('new-row');
            
            // If there's a last row, copy its data
            if (lastRow) {
                // Get values from the last row's dropdowns
                const lastRowComponentType = lastRow.cells[2].textContent.trim();
                const lastRowActivityLine = lastRow.cells[1].textContent.trim();
                const lastRowComponentCode = lastRow.cells[4].textContent.trim();
                
                const rowHTML = `
                    <td class="checkbox-cell">
                        <input type="checkbox">
                        <span class="delete-icon cursor-pointer ml-2 text-red-600" title="Delete">&times;</span>
                    </td>
                    <td>
                        <select class="activity-line-select">
                            <option value="${lastRowActivityLine}">${lastRowActivityLine}</option>
                        </select>
                    </td>
                    <td>
                        <select class="component-type-select" data-lookup="COMPONENT TYPE">
                            <option value="${lastRowComponentType}">${lastRowComponentType}</option>
                        </select>
                    </td>
                    
                    <td>${lastRow.cells[3].textContent || ''}</td>
                    <td>
                        <select class="component-code-select">
                            <option value="${lastRowComponentCode}">${lastRowComponentCode}</option>
                        </select>
                    </td>
                    <td>${lastRow.cells[5].textContent || ''}</td>
                    <td>${lastRow.cells[6].textContent || ''}</td>
                    <td>${lastRow.cells[7].textContent || ''}</td>
                    <td contenteditable="true">${lastRow.cells[8].textContent || '0'}</td>
                    <td>${lastRow.cells[9].textContent || '0'}</td>
                    <td>${lastRow.cells[10].textContent || '0.00'}</td>
                    <td>0.00</td>
                `;
                
                newRow.innerHTML = rowHTML;
                tbody.appendChild(newRow);
                
                // Initialize dropdowns with proper async handling
                try {
                    // Initialize component type dropdown
                    const componentTypeSelect = newRow.querySelector('.component-type-select');
                    await populateDropdown(componentTypeSelect, 'COMPONENT TYPE');
                    $(componentTypeSelect).val(lastRowComponentType).trigger('change');
    
                    // Initialize activity line dropdown
                    const activityLineSelect = newRow.querySelector('.activity-line-select');
                    await initializeActivityLineSelect(activityLineSelect);
                    setTimeout(() => {
                        $(activityLineSelect).val(lastRowActivityLine).trigger('change');
                    }, 100);  // Small delay to ensure dropdown is fully initialized
    
                    // Initialize component code dropdown
                    const componentCodeSelect = newRow.querySelector('.component-code-select');
                    await initializeComponentCodeSelect(componentCodeSelect);
                    setTimeout(() => {
                        $(componentCodeSelect).val(lastRowComponentCode).trigger('change');
                    }, 100);  // Small delay to ensure dropdown is fully initialized
                } catch (error) {
                    console.error('Error initializing dropdowns:', error);
                }
                
            } else {
                // If no last row exists, create empty row (original code)
                const rowHTML = `
                    <td class="checkbox-cell">
                        <input type="checkbox">
                        <span class="delete-icon cursor-pointer ml-2 text-red-600" title="Delete">&times;</span>
                    </td>
                    <td>
                        <select class="activity-line-select">
                            <option value=""></option>
                        </select>
                    </td>
                    <td>
                        <select class="component-type-select" data-lookup="COMPONENT TYPE">
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
                    <td></td>
                    <td contenteditable="true">0</td>
                    <td>0</td>
                    <td>0.00</td>
                    <td>0.00</td>
                `;
                
                newRow.innerHTML = rowHTML;
                tbody.appendChild(newRow);
                
                // Initialize empty dropdowns
                const componentTypeSelect = newRow.querySelector('.component-type-select');
                await populateDropdown(componentTypeSelect, 'COMPONENT TYPE');
                
                const activityLineSelect = newRow.querySelector('.activity-line-select');
                await initializeActivityLineSelect(activityLineSelect);
                
                const componentCodeSelect = newRow.querySelector('.component-code-select');
                await initializeComponentCodeSelect(componentCodeSelect);
            }
    
            // Add checkbox event listener
            const checkbox = newRow.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                newRow.classList.toggle('selected', this.checked);
            });
    
            // Calculate net price for the new row
            calculateRowNetPrice(newRow);
            
            // Store the new row state
            newlyAddedRows.push(storeRowState(newRow));
            
            // Update create estimate button state
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