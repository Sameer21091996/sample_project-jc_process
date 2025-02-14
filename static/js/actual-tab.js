

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
    const modalTbody = modal.querySelector('.table-wrapper table tbody');
    modalTbody.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    try {
        const [subletResponse, supplierNames, pettyCashSuppliers, supplierSites, activitiesResponse] = await Promise.all([
            fetch(`/api/servicerequest/sublet-process/${incidentNumber}`),
            fetchDropdownOptions('SUPPLIER NAME'),
            fetchDropdownOptions('PETTY CASH SUPPLIER'),
            fetchDropdownOptions('SUPPLIER SITE NAME'),
            fetch(`/api/servicerequest/sublet-activities/${incidentNumber}`)
        ]);

        const activitiesData = await activitiesResponse.json();
        const result = await subletResponse.json();

        if (result.status === "success") {
            const subletData = result.data;
            
            for (let i = 0; i < subletData.length; i++) {
                const row = await createSubletRow({
                    index: i + 1,
                    record: subletData[i],
                    supplierNames: supplierNames.meanings,
                    pettyCashSuppliers: pettyCashSuppliers.meanings,
                    supplierSites: supplierSites.meanings,
                    activities: activitiesData.activities || []
                });

                const returnCheckbox = row.querySelector('.return-sublet');
                if (returnCheckbox) {
                    returnCheckbox.checked = subletData[i].return_sublet;
                    if (subletData[i].return_sublet) {
                        returnCheckbox.disabled = true;
                        row.classList.add('returned-sublet');
                    }
                }
                modalTbody.appendChild(row);

                // Set values for existing records
                $(row.querySelector('.supplier-name')).val(subletData[i].supplier_name).trigger('change');
                $(row.querySelector('.petty-cash')).val(subletData[i].petty_cash_supplier).trigger('change');
                $(row.querySelector('.supplier-site')).val(subletData[i].supplier_site_name).trigger('change');
                $(row.querySelector('.activity-desc')).val(subletData[i].activity_description).trigger('change');

                row.querySelector(`#transactionAmount-${i + 1}`).value = subletData[i].transaction_amount || '0.00';
                row.querySelector(`#applyVat-${i + 1}`).checked = subletData[i].apply_vat || false;
                row.querySelector('input[placeholder="Enter invoice number"]').value = subletData[i].supplier_invoice_num || '';
                row.querySelector('input[type="date"]').value = subletData[i].supplier_invoice_date || getCurrentDate();
                row.querySelector(`#vatPercentage-${i + 1}`).value = subletData[i].vat_percentage || '5';
                row.querySelector(`#vatAmount-${i + 1}`).value = subletData[i].vat_amount || '0.00';
                row.querySelector(`#totalAmount-${i + 1}`).value = subletData[i].total_amount_incl_vat || '0.00';

                // Set data attributes
                if (subletData[i].id) {
                    row.setAttribute('data-sublet-id', subletData[i].id);
                }
                row.setAttribute('data-component-code', subletData[i].component_code);

                setupVatCalculations(row, i + 1);
            }

            if (subletData.length === 0) {
                addEmptySubletRow(modalTbody, 
                    supplierNames.meanings, 
                    pettyCashSuppliers.meanings, 
                    supplierSites.meanings,
                    activitiesData.activities || []
                );
            }
        }

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeSubletModal;
        }

        window.onclick = function(event) {
            if (event.target === modal) {
                closeSubletModal();
            }
        };

        // Add process button event listener
        const processButton = modal.querySelector('.process-button');
        if (processButton) {
            processButton.addEventListener('click', processSublet);
        }
        const returnButton = modal.querySelector('.return');
    if (returnButton) {
        returnButton.onclick = handleReturnSublet;
    }

    } catch (error) {
        console.error('Error fetching sublet details:', error);
        showMessage('Error loading sublet details', false);
    }
}


async function addSubletRow() {
    // Get incident number from URL at the start of function
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    const tbody = document.querySelector('#subletModal .table-wrapper table tbody');
    const currentRowCount = tbody.children.length;
    const newIndex = currentRowCount + 1;

    // Fetch required dropdown data
    const [supplierNames, pettyCashSuppliers, supplierSites, activitiesResponse] = await Promise.all([
        fetchDropdownOptions('SUPPLIER NAME'),
        fetchDropdownOptions('PETTY CASH SUPPLIER'),
        fetchDropdownOptions('SUPPLIER SITE NAME'),
        fetch(`/api/servicerequest/sublet-activities/${incidentNumber}`)
    ]);

    const activitiesData = await activitiesResponse.json();

    // Create new row using existing createSubletRow function
    const newRow = await createSubletRow({
        index: newIndex,
        record: {},
        supplierNames: supplierNames.meanings,
        pettyCashSuppliers: pettyCashSuppliers.meanings,
        supplierSites: supplierSites.meanings,
        activities: activitiesData.activities || []
    });

    // Mark this as a new row
    newRow.setAttribute('data-new-row', 'true');

    // Add the new row to table
    tbody.appendChild(newRow);

    // Initialize VAT calculations for new row
    setupVatCalculations(newRow, newIndex);

    // Initialize dropdowns with default empty values
    $(newRow.querySelector('.supplier-name')).val('').trigger('change');
    $(newRow.querySelector('.petty-cash')).val('').trigger('change');
    $(newRow.querySelector('.supplier-site')).val('').trigger('change');
    $(newRow.querySelector('.activity-desc')).val('').trigger('change');

    // Initialize activity line dropdown
    const activityLineSelect = newRow.querySelector('.operation-code-dropdown');
    if (activityLineSelect) {
        $(activityLineSelect).select2({
            width: '150px',
            dropdownAutoWidth: false,
            minimumResultsForSearch: 1,
            containerCssClass: 'select2-sublet-container',
            dropdownCssClass: 'select2-sublet-dropdown'
        });
    }

    return newRow;
}


function initializeSelect2Dropdown(element, options) {
    // Handle cases where options might be undefined or have a different structure
    let dropdownData;
    
    if (Array.isArray(options)) {
        dropdownData = options.map(option => ({
            id: option,
            text: option
        }));
    } else if (options && options.meanings) {
        dropdownData = options.meanings.map(option => ({
            id: option,
            text: option
        }));
    } else {
        dropdownData = [];
    }

    $(element).select2({
        data: dropdownData,
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-sublet-container',
        dropdownCssClass: 'select2-sublet-dropdown'
    });
}


async function createSubletRow({ index, record, supplierNames, pettyCashSuppliers, supplierSites }) {
    const newRow = document.createElement('tr');
    const currentDate = getCurrentDate();


    
    
    newRow.setAttribute('data-line-id', record.id || '');
    newRow.setAttribute('data-component-code', record.component_code || '');

    if (record.id) {
        newRow.setAttribute('data-sublet-id', record.id);
    }

    // Fetch sublet activities
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    const activitiesResponse = await fetch(`/api/servicerequest/sublet-activities/${incidentNumber}`);
    const activitiesData = await activitiesResponse.json();
    const activityLineResponse = await fetch(`/api/servicerequest/sublet-activityline/${incidentNumber}`);
    const activityLineData = await activityLineResponse.json();

    newRow.innerHTML = `
        <td>${index}</td>
        <td><select class="sublet-dropdown supplier-name"></select></td>
        <td><select class="sublet-dropdown petty-cash"></select></td>
        <td><select class="sublet-dropdown activity-desc"></select></td>
        <td><input type="checkbox" class="checkbox" id="applyVat-${index}"></td>
        <td><input type="text" value="" id="transactionAmount-${index}" placeholder="Enter amount"></td>
        <td><input type="text" value="" placeholder="Enter invoice number"></td>
        <td><input type="date" value="${currentDate}"></td>
        <td>
              <div class="action-buttons">
                <button class="btn-info" data-sublet-id="${record.id || ''}">i</button>
                <button class="btn-print">Print GRN</button>
            </div>
        </td>
        <td><input type="checkbox" class="checkbox return-sublet"></td>
        <td><input type="text" value="5" id="vatPercentage-${index}" readonly></td>
        <td><input type="text" value="" id="vatAmount-${index}" readonly></td>
        <td><input type="text" value="" id="totalAmount-${index}" readonly></td>
        <td>
            <select class="operation-code-dropdown">
                <option value="">Select Activity Line</option>
                ${activityLineData.activities.map(activity => 
                    `<option value="${activity}">${activity}</option>`
                ).join('')}
            </select>
        </td>
        <td><select class="sublet-dropdown supplier-site"></select></td>
    `;

    const supplierNameSelect = newRow.querySelector('.supplier-name');
    const pettyCashSelect = newRow.querySelector('.petty-cash');
    const supplierSiteSelect = newRow.querySelector('.supplier-site');
    const activitySelect = newRow.querySelector('.activity-desc');
    if (activitiesData.status === 'success') {
        initializeSelect2Dropdown(activitySelect, activitiesData.activities);
    }

    const activityLineSelect = newRow.querySelector('.operation-code-dropdown');

    if (activityLineData.status === 'success') {
        initializeSelect2Dropdown(activityLineSelect, activityLineData.activities);
    }

    initializeSelect2Dropdown(supplierNameSelect, supplierNames);
    initializeSelect2Dropdown(pettyCashSelect, pettyCashSuppliers);
    initializeSelect2Dropdown(supplierSiteSelect, supplierSites);

    setupVatCalculations(newRow, index);
    const infoButton = newRow.querySelector('.btn-info');
    infoButton.addEventListener('click', function() {
        showActionHistoryModal(this.getAttribute('data-sublet-id'));
    });

    

    return newRow;
}


function addEmptySubletRow(tbody, supplierNames, pettyCashSuppliers, supplierSites) {
    const newRow = document.createElement('tr');
    const currentDate = getCurrentDate();

    newRow.innerHTML = `
        <td>1</td>
        <td><select class="sublet-dropdown supplier-name"></select></td>
        <td><select class="sublet-dropdown petty-cash"></select></td>
        <td><select class="sublet-dropdown activity-desc"></select></td>
        <td><input type="checkbox" class="checkbox" id="applyVat-1"></td>
        <td><input type="text" value="" id="transactionAmount-1" placeholder="Enter amount"></td>
        <td><input type="text" value="" placeholder="Enter invoice number"></td>
        <td><input type="date" value="${currentDate}"></td>
        <td>
            <div class="action-buttons">
                <button class="btn-info" onclick="showActionHistoryModal()">i</button>
                <button class="btn-print">Print GRN</button>
            </div>
        </td>
        <td><input type="checkbox" class="checkbox"></td>
        <td><input type="text" value="5" id="vatPercentage-1" readonly></td>
        <td><input type="text" value="" id="vatAmount-1" readonly></td>
        <td><input type="text" value="" id="totalAmount-1" readonly></td>
        <td><input type="text" value="Sublet" readonly></td>
        <td><select class="sublet-dropdown supplier-site"></select></td>
    `;

    tbody.appendChild(newRow);

    const supplierNameSelect = newRow.querySelector('.supplier-name');
    const pettyCashSelect = newRow.querySelector('.petty-cash');
    const supplierSiteSelect = newRow.querySelector('.supplier-site');
    const activitySelect = newRow.querySelector('.activity-desc');

    $(supplierNameSelect).val(defaultSupplier).trigger('change');
    $(pettyCashSelect).val(defaultPettyCash).trigger('change');
    $(supplierSiteSelect).val(defaultSupplierSite).trigger('change');
    
    // Initialize activities dropdown with first value
    if (activities.length > 0) {
        initializeSelect2Dropdown(activitySelect, activities);
        $(activitySelect).val(activities[0]).trigger('change');
    }

    initializeSelect2Dropdown(supplierNameSelect, supplierNames);
    initializeSelect2Dropdown(pettyCashSelect, pettyCashSuppliers);
    initializeSelect2Dropdown(supplierSiteSelect, supplierSites);
    initializeSelect2Dropdown(activitySelect, []);

    setupVatCalculations(newRow, 1);
}



function setupVatCalculations(row, index) {
    const transactionAmount = row.querySelector(`#transactionAmount-${index}`);
    const vatPercentage = row.querySelector(`#vatPercentage-${index}`);
    const vatAmount = row.querySelector(`#vatAmount-${index}`);
    const totalAmount = row.querySelector(`#totalAmount-${index}`);
    const applyVat = row.querySelector(`#applyVat-${index}`);

    // Set default VAT percentage
    vatPercentage.value = '5';

    function calculateVat() {
        if (applyVat.checked) {
            const amount = parseFloat(transactionAmount.value) || 0;
            const percentage = parseFloat(vatPercentage.value) || 0;
            const vat = (amount * percentage) / 100;
            vatAmount.value = vat.toFixed(2);
            totalAmount.value = (amount + vat).toFixed(2);
        } else {
            const amount = parseFloat(transactionAmount.value) || 0;
            vatAmount.value = '';
            totalAmount.value = amount.toFixed(2);
        }
    }

    transactionAmount.addEventListener('input', calculateVat);
    applyVat.addEventListener('change', calculateVat);
}



async function updateActualTableWithNewData(incidentNumber, subletData) {
    const tbody = document.querySelector('.actual-table tbody');
    const subletRows = tbody.querySelectorAll('.sublet-row');

    subletRows.forEach((row, index) => {
        if (subletData[index]) {
            const data = subletData[index];
            const actualQty = parseFloat(data.transaction_amount) || 0;
            const sellingPrice = parseFloat(data.estimate_line?.selling_price) || 0;

            const netPrice = actualQty * sellingPrice;
            const netAmount = netPrice;
            const vat = netAmount * 0.05;
            const finalAmount = netAmount + vat;

            // Update row values
            row.querySelector('td:nth-child(9)').textContent = actualQty.toFixed(2);
            row.querySelector('td:nth-child(11)').textContent = netPrice.toFixed(2);
            row.querySelector('td:nth-child(14)').textContent = netAmount.toFixed(2);
            row.querySelector('td:nth-child(15)').textContent = vat.toFixed(2);
            row.querySelector('td:nth-child(16)').textContent = finalAmount.toFixed(2);
        }
    });

    // Update totals
    calculateActualTabTotals();
}

function updateSubletModalRows(updatedData) {
    const tbody = document.querySelector('#subletModal .table-wrapper table tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        if (updatedData[index]) {
            const data = updatedData[index];
            const rowNum = index + 1;

            // Update all select2 dropdowns
            $(row.querySelector('.supplier-name')).val(data.supplier_name).trigger('change');
            $(row.querySelector('.petty-cash')).val(data.petty_cash_supplier).trigger('change');
            $(row.querySelector('.activity-desc')).val(data.activity_description).trigger('change');
            $(row.querySelector('.supplier-site')).val(data.supplier_site_name).trigger('change');

            // Update all input fields
            row.querySelector(`#transactionAmount-${rowNum}`).value = data.transaction_amount;
            row.querySelector(`#applyVat-${rowNum}`).checked = data.apply_vat;
            row.querySelector('input[placeholder="Enter invoice number"]').value = data.supplier_invoice_num;
            row.querySelector('input[type="date"]').value = data.supplier_invoice_date;
            row.querySelector(`#vatPercentage-${rowNum}`).value = data.vat_percentage;
            row.querySelector(`#vatAmount-${rowNum}`).value = data.vat_amount;
            row.querySelector(`#totalAmount-${rowNum}`).value = data.total_amount_incl_vat;
        }
    });
}

function calculateActualTabTotals() {
    const tbody = document.querySelector('.actual-table tbody');
    const subletRows = tbody.querySelectorAll('.sublet-row');

    let totalNetPrice = 0;
    let totalNetAmount = 0;
    let totalVat = 0;
    let totalFinalAmount = 0;

    subletRows.forEach(row => {
        const actualQty = parseFloat(row.querySelector('td:nth-child(9)').textContent) || 0;
        const sellingPrice = parseFloat(row.querySelector('td:nth-child(10)').textContent) || 0;

        const netPrice = actualQty * sellingPrice;
        const netAmount = netPrice;
        const vat = netAmount * 0.05;
        const finalAmount = netAmount + vat;

        totalNetPrice += netPrice;
        totalNetAmount += netAmount;
        totalVat += vat;
        totalFinalAmount += finalAmount;
    });

    // Update total row
    const totalRow = tbody.querySelector('.total-row');
    if (totalRow) {
        totalRow.querySelector('td:nth-child(11)').textContent = totalNetPrice.toFixed(2);
        totalRow.querySelector('td:nth-child(14)').textContent = totalNetAmount.toFixed(2);
        totalRow.querySelector('td:nth-child(15)').textContent = totalVat.toFixed(2);
        totalRow.querySelector('td:nth-child(16)').textContent = totalFinalAmount.toFixed(2);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    if (incidentNumber) {
        displayActualTableData(incidentNumber);
    }
});




function closeSubletModal() {
    const modal = document.getElementById('subletModal');
    modal.style.display = 'none';
}


async function fetchDropdownOptions(lookupName) {
    const encodedLookupName = encodeURIComponent(lookupName);
    const response = await fetch(`/api/servicerequest/dropdown-options/${encodedLookupName}`);

    if (!response.ok) {
        throw new Error('Failed to fetch dropdown options');
    }
    return await response.json();
}

async function populateDropdown(selectElement, lookupName) {
    try {
        const data = await fetchDropdownOptions(lookupName);
        const dropdownData = [];

        if (data && data.meanings) {
            data.meanings.forEach(meaning => {
                dropdownData.push({
                    id: meaning,
                    text: meaning
                });
            });
        }

        $(selectElement).select2({
            data: dropdownData,
            placeholder: 'Select an option',
            allowClear: true,
            width: '100%'
        });

        if (selectElement.value) {
            $(selectElement).val(selectElement.value).trigger('change');
        }

    } catch (error) {
        $(selectElement).select2({
            data: [],
            placeholder: 'Select an option',
            allowClear: true,
            width: '100%'
        });
    }
}

async function addLaborRow() {
    const tbody = document.querySelector('#laborModal .table-wrapper table tbody');
    const currentRowCount = tbody.children.length;
    const newIndex = currentRowCount + 1;
    const currentDateTime = getCurrentDateTime();
    const mainTable = document.querySelector('.actual-table');
    const rows = mainTable.querySelectorAll('tbody tr');

    // Get unique activity lines for operation code dropdown
    const uniqueActivityLines = [...new Set(Array.from(rows)
        .filter(row => {
            const value = row.cells[2].textContent.trim();
            return value && value !== '0.00' && isNaN(value);
        })
        .map(row => row.cells[2].textContent.trim()))];

    const newRow = document.createElement('tr');
    newRow.classList.add('new-labor-row'); 
    newRow.setAttribute('data-new-row', 'true');

    newRow.innerHTML = `
        <td>${newIndex}</td>
        <td>
            <select class="operation-type-dropdown">
                <option value="">- Select Operation -</option>
                ${uniqueActivityLines.map(line =>
                    `<option value="${line}">${line}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <select class="labor-dropdown employee-name-select">
                <option value="">- Select Employee -</option>
            </select>
        </td>
        <td><input type="text" class="employee-number" readonly></td>
        <td><input type="text" value="1"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly style="background-color: #f0f0f0;"></td>
        <td>open</td>
        <td>
            <div class="action-buttons">
                <button class="btn-delete" onclick="deleteLaborRow(this)">-</button>
            </div>
        </td>
    `;

    tbody.appendChild(newRow);

    // Initialize Operation Type dropdown
    const operationSelect = newRow.querySelector('.operation-type-dropdown');
    $(operationSelect).select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    });

    // Initialize employee name dropdown with API data and link to employee number
    const employeeNameSelect = newRow.querySelector('.employee-name-select');
    const employeeData = await fetchDropdownOptions('EMPLOYEE NAME');
    
    if (employeeData && employeeData.meanings) {
        let lookupMap = {};
        employeeData.meanings.forEach(meaning => {
            const empNumber = meaning.split('|')[1].trim();
            lookupMap[meaning] = empNumber;
        });

        const options = employeeData.meanings.map(name =>
            `<option value="${name}">${name}</option>`
        ).join('');
        employeeNameSelect.innerHTML = `<option value="">- Select Employee -</option>${options}`;

        $(employeeNameSelect).select2({
            width: '150px',
            dropdownAutoWidth: false,
            minimumResultsForSearch: 1,
            containerCssClass: 'select2-labor-container',
            dropdownCssClass: 'select2-labor-dropdown'
        }).on('change', function() {
            const selectedEmployee = this.value;
            const employeeNumberField = newRow.querySelector('.employee-number');
            if (selectedEmployee) {
                employeeNumberField.value = lookupMap[selectedEmployee];
            }
        });
    }

    return newRow;
}

async function showLaborModal(element) {
    const modal = document.getElementById('laborModal');
    modal.style.display = 'block';
    const modalTbody = modal.querySelector('.table-wrapper table tbody');
    modalTbody.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    
    // Add this line to set the incident number attribute
    modal.setAttribute('data-incident-number', incidentNumber);

    try {
        const [laborResponse, employeeNames, activityLinesResponse] = await Promise.all([
            fetch(`/api/servicerequest/labor/${incidentNumber}`),
            fetchDropdownOptions('EMPLOYEE NAME'),
            fetch(`/api/servicerequest/labor-activities/${incidentNumber}`)
        ]);

        const activityLinesData = await activityLinesResponse.json();
        const result = await laborResponse.json();

        if (result.status === "success") {
            const laborData = result.data;
            
            for (let i = 0; i < laborData.length; i++) {
                const row = await createLaborRow({
                    index: i + 1,
                    record: laborData[i],
                    employeeNames: employeeNames.meanings,
                    activityLines: activityLinesData.activities || []
                });

                modalTbody.appendChild(row);

                // Set values for existing records
                $(row.querySelector('.employee-name-select')).val(laborData[i].employee_name).trigger('change');
                $(row.querySelector('.operation-type-dropdown')).val(laborData[i].operation_code).trigger('change');

                row.querySelector('.employee-number').value = laborData[i].employee_no || '';
                row.querySelector('input[type="text"]').value = laborData[i].trx_qty || '1';
                row.querySelector('input[type="datetime-local"]').value = laborData[i].plan_start_date || getCurrentDateTime();

                // Set data attributes
                if (laborData[i].id) {
                    row.setAttribute('data-labor-id', laborData[i].id);
                }
                row.setAttribute('data-component-code', laborData[i].component_code);
            }

            if (laborData.length === 0) {
                addEmptyLaborRow(modalTbody,
                    employeeNames.meanings,
                    activityLinesData.activities || []
                );
            }
        }

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeLaborModal;
        }

        window.onclick = function(event) {
            if (event.target === modal) {
                closeLaborModal();
            }
        };

        // Add process button event listener
        const processButton = modal.querySelector('.process-button');
        if (processButton) {
            // Remove any existing listeners
            processButton.replaceWith(processButton.cloneNode(true));
            
            // Add new listener
            modal.querySelector('.process-button').addEventListener('click', async () => {
                try {
                    await processLaborEntries();
                } catch (error) {
                    console.error('Process labor error:', error);
                    showMessage('Error processing labor entries', false);
                }
            });
        }

    } catch (error) {
        console.error('Error fetching labor details:', error);
        showMessage('Error loading labor details', false);
    }
}


// function showLaborModal() {
//     const modal = document.getElementById('laborModal');
//     modal.style.display = 'block';
//     const modalTbody = modal.querySelector('.table-wrapper table tbody');
//     modalTbody.innerHTML = '';
//     const urlParams = new URLSearchParams(window.location.search);
//     const incidentNumber = urlParams.get('service_request_id');
    
   
//     modal.setAttribute('data-incident-number', incidentNumber);
   

//     const tbody = modal.querySelector('.table-wrapper table tbody');
//     const mainTable = document.querySelector('.actual-table');
//     const rows = mainTable.querySelectorAll('tbody tr');
    
//     tbody.innerHTML = '';
//     let rowIndex = 1;

//     const uniqueActivityLines = [...new Set(Array.from(rows)
//         .filter(row => {
//             const value = row.cells[2].textContent.trim();
//             return value && value !== '0.00' && isNaN(value);
//         })
//         .map(row => row.cells[2].textContent.trim()))];

//     fetch(`/api/servicerequest/labor/${incidentNumber}`)
//         .then(response => response.json())
//         .then(laborResponse => {
//             fetchDropdownOptions('EMPLOYEE NAME').then(data => {
//                 if (data && data.meanings) {
//                     let lookupMap = {};
//                     data.meanings.forEach(meaning => {
//                         const empNumber = meaning.split('|')[1].trim();
//                         lookupMap[meaning] = empNumber;
//                     });

//                     // Create a Set to track unique component codes
//                     const processedCodes = new Set();

//                     rows.forEach((row) => {
//                         const componentType = row.cells[1].textContent.trim();
//                         if (componentType === 'Labour') {
//                             const componentCode = row.cells[2].textContent.trim();
                            
//                             // Only process if we haven't seen this component code
//                             if (componentCode && !processedCodes.has(componentCode)) {
//                                 processedCodes.add(componentCode);
                                
//                                 const matchingLaborData = laborResponse.data.filter(l => 
//                                     l.component_code === componentCode
//                                 );

//                                 if (matchingLaborData.length > 0) {
//                                     matchingLaborData.forEach(laborData => {
//                                         const newRow = createLaborRow(rowIndex, laborData, uniqueActivityLines, data.meanings, lookupMap);
//                                         tbody.appendChild(newRow);
//                                         initializeLaborRowDropdowns(newRow, lookupMap);
//                                         rowIndex++;
//                                     });
//                                 } else {
//                                     const emptyLaborData = {
//                                         component_code: componentCode,
//                                         activity_desc: row.cells[3].textContent.trim()
//                                     };
//                                     const newRow = createLaborRow(rowIndex, emptyLaborData, uniqueActivityLines, data.meanings, lookupMap);
//                                     tbody.appendChild(newRow);
//                                     initializeLaborRowDropdowns(newRow, lookupMap);
//                                     rowIndex++;
//                                 }
//                             }
//                         }
//                     });
//                 }
//             });
//         });

//     const processButton = modal.querySelector('.actions .process');
//     processButton.addEventListener('click', processLaborEntries);
// }


function showLabourModal(element) {
    // Reuse existing labor modal functionality
    showLaborModal();
}

async function createLaborRow({ index, record, employeeNames, activityLines }) {
    const newRow = document.createElement('tr');
    const currentDateTime = getCurrentDateTime();

    // Ensure activityLines is an array, even if empty
    const activityLineOptions = Array.isArray(activityLines) ? activityLines : [];

    newRow.innerHTML = `
        <td>${index}</td>
        <td>
            <select class="operation-type-dropdown">
                <option value="">- Select Operation -</option>
                ${activityLineOptions.map(line =>
                    `<option value="${line}" ${record.component_code === line ? 'selected' : ''}>${line}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <select class="labor-dropdown employee-name-select">
                <option value="">- Select Employee -</option>
                ${(employeeNames || []).map(name =>
                    `<option value="${name}" ${record.employee_name === name ? 'selected' : ''}>${name}</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="text" class="employee-number" readonly value="${record.employee_no || ''}"></td>
        <td><input type="text" value="${record.trx_qty || 1}"></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly></td>
        <td><input type="datetime-local" value="${currentDateTime}" readonly></td>
        <td>${record.status || 'open'}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-delete" onclick="deleteLaborRow(this)">-</button>
            </div>
        </td>
    `;

    if (record.id) {
        newRow.setAttribute('data-labor-id', record.id);
    }
    newRow.setAttribute('data-component-code', record.component_code || '');

    // Initialize select2 dropdowns
    const operationSelect = newRow.querySelector('.operation-type-dropdown');
    const employeeSelect = newRow.querySelector('.employee-name-select');

    $(operationSelect).select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    });

    $(employeeSelect).select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    });

    return newRow;
}


function initializeLaborRowDropdowns(row, lookupMap) {
    const operationSelect = row.querySelector('.operation-type-dropdown');
    const employeeSelect = row.querySelector('.employee-name-select');

    $(operationSelect).select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    });

    $(employeeSelect).select2({
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-labor-container',
        dropdownCssClass: 'select2-labor-dropdown'
    }).on('change', function() {
        const selectedEmployee = this.value;
        const employeeNumberField = row.querySelector('.employee-number');
        if (selectedEmployee) {
            employeeNumberField.value = lookupMap[selectedEmployee];
        }
    });
}

async function processLaborEntries() {
    const modal = document.getElementById('laborModal');
    const incidentNumber = modal.getAttribute('data-incident-number');
    
    if (!incidentNumber) {
        showMessage('No incident number found', false);
        return;
    }

    const tbody = modal.querySelector('.table-wrapper table tbody');
    const rows = tbody.querySelectorAll('tr');
    
    if (!rows.length) {
        showMessage('No labor entries to process', false);
        return;
    }

    const laborEntries = Array.from(rows).map((row, index) => {
        const entry = {
            id: row.getAttribute('data-labor-id') || null,
            line: index + 1,
            operation_code: row.querySelector('.operation-type-dropdown')?.value || '',
            employee_name: row.querySelector('.employee-name-select')?.value || '',
            employee_no: parseInt(row.querySelector('.employee-number')?.value) || 0,
            trx_qty: parseInt(row.querySelector('td:nth-child(5) input')?.value) || 0,
            plan_start_date: row.querySelector('td:nth-child(6) input')?.value || '',
            plan_end_date: row.querySelector('td:nth-child(7) input')?.value || '',
            actual_start_date: row.querySelector('td:nth-child(8) input')?.value || '',
            actual_end_date: row.querySelector('td:nth-child(9) input')?.value || '',
            status: row.querySelector('td:nth-child(10)')?.textContent || 'open',
            is_new_row: row.hasAttribute('data-new-row')
        };
        return entry;
    });

    try {
        const response = await fetch('/api/servicerequest/labor/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                labor_entries: laborEntries,
                incident_number: incidentNumber
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            showMessage('Labor entries processed successfully');
            closeLaborModal();
            await displayActualTableData(incidentNumber);
            updateComponentTotals('Labour');
            updateGrandTotal();
        } else {
            throw new Error(result.message || 'Processing failed');
        }
    } catch (error) {
        console.error('Error in processLaborEntries:', error);
        showMessage(error.message || 'Error processing labor entries', false);
    }
}



// async function processLaborEntries() {
//     const modal = document.getElementById('laborModal');
//     const incidentNumber = modal.getAttribute('data-incident-number');
//     const tbody = modal.querySelector('.table-wrapper table tbody');
//     const rows = tbody.querySelectorAll('tr');
   
//     const laborEntries = Array.from(rows).map((row, index) => ({
//         id: row.getAttribute('data-labor-id') || null,
//         line: index + 1,
//         operation_code: row.querySelector('.operation-type-dropdown').value,
//         employee_name: row.querySelector('.employee-name-select').value,
//         employee_no: parseInt(row.querySelector('.employee-number').value) || 0,
//         trx_qty: parseInt(row.querySelector('td:nth-child(5) input').value) || 0,
//         plan_start_date: row.querySelector('td:nth-child(6) input').value,
//         plan_end_date: row.querySelector('td:nth-child(7) input').value,
//         actual_start_date: row.querySelector('td:nth-child(8) input').value,
//         actual_end_date: row.querySelector('td:nth-child(9) input').value,
//         status: row.querySelector('td:nth-child(10)').textContent,
//         is_new_row: row.hasAttribute('data-new-row')
//     }));

//     try {
//         const response = await fetch('/api/servicerequest/labor/process', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken')
//             },
//             body: JSON.stringify({
//                 labor_entries: laborEntries,
//                 incident_number: incidentNumber
//             })
//         });

//         const result = await response.json();
//         if (result.status === 'success') {
//             showMessage('Labor entries processed successfully');
//             closeLaborModal();
//             await displayActualTableData(incidentNumber);
//             updateComponentTotals('Labour');
//             updateGrandTotal();
//         } else {
//             throw new Error(result.message || 'Processing failed');
//         }
//     } catch (error) {
//         console.error('Error in processLaborEntries:', error);
//         showMessage(error.message || 'Error processing labor entries', false);
//     }
// }



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



function closeLaborModal() {
    const modal = document.getElementById('laborModal');
    modal.style.display = 'none';
}




function deleteLaborRow(button) {
    const row = button.closest('tr');
    
    if (row.classList.contains('new-labor-row')) {
        row.remove();
        
        // Update row numbers after deletion
        const tbody = document.querySelector('#laborModal .table-wrapper table tbody');
        Array.from(tbody.rows).forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    }
}

// Function to show action history for a specific sublet
async function showActionHistoryModal(subletId) {
    if (!subletId) {
        showMessage('No action history available for unprocessed sublets', false);
        return;
    }

    const modal = document.getElementById('actionHistoryModal');
    modal.style.display = 'block';

    try {
        const response = await fetch(`/api/servicerequest/sublet-action-history/${subletId}`);
        const data = await response.json();

        if (data.status === "success") {
            const actionData = data.data;
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal" onclick="closeActionHistoryModal()">&times;</span>
                    <div class="container">
                        <h2>Sublet Action History</h2>
                        <button class="btn btn-print" onclick="printGRN('${subletId}')">Print GRN</button>
                        <table>
                            <thead>
                                <tr>
                                    <th>Requisition Number</th>
                                    <th>Purchase Order Number</th>
                                    <th>PO Receipts</th>
                                    <th>AP Invoice Number</th>
                                    <th>Return AP Invoice Number</th>
                                    <th>Status</th>
                                    <th>Output Msg</th>
                                    <th>Print Return</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${actionData.requisition_number || ''}</td>
                                    <td>${actionData.purchase_order_number || ''}</td>
                                    <td>${actionData.po_receipts || ''}</td>
                                    <td>${actionData.ap_invoice_number || ''}</td>
                                    <td>${actionData.return_ap_invoice_number || ''}</td>
                                    <td>${actionData.status || ''}</td>
                                    <td>${actionData.output_msg || ''}</td>
                                    <td>
                                        <input type="checkbox" 
                                               ${actionData.print_return ? 'checked' : ''} 
                                               onclick="togglePrintReturn('${subletId}', this.checked)">
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching action history:', error);
        showMessage('Error loading action history', false);
    }
}

// Function to print GRN


// Function to toggle print return status


function closeActionHistoryModal() {
    const modal = document.getElementById('actionHistoryModal');
    modal.style.display = 'none';
}



async function toggleCreditTable() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    const creditTable = document.getElementById('creditTableContainer');
    const actualCustomerName = document.getElementById('actualCustomer').value;

    if (!incidentNumber) {
        showMessage('Service Request ID is required', false);
        return;
    }

    if (creditTable.style.display === 'none') {
        try {
            const response = await fetch(`/api/servicerequest/customer-balance/${incidentNumber}`);
            const result = await response.json();
            const existingData = result.data;

            // Get the total row first before using it
            const totalRow = document.querySelector('.actual-table .total-row');
            let netAmount = 0;
            
            if (totalRow) {
                const allCells = Array.from(totalRow.cells);
                const totalCell = allCells.find(cell => cell.textContent.includes('TOTAL'));
                const startIndex = allCells.indexOf(totalCell);
                netAmount = parseFloat(allCells[startIndex + 4]?.textContent) || 0;
            }

            const tableHTML = `
                <table class="credit-table" data-incident-number="${incidentNumber}">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Type</th>
                            <th>Receipt Number</th>
                            <th>Credit memo</th>
                            <th>Original Amount</th>
                            <th>Utilized / Outstanding Amt</th>
                            <th>Loc Available Amt</th>
                            <th>Split %</th>
                            <th>Txn Amount <span class="txn-amount" style="color: red; margin-left: 5px;">(${netAmount.toFixed(2)})</span></th>
                            <th>Receivable Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${actualCustomerName}</td>
                            <td>
                                <select class="type-dropdown">
                                    <option value="">Select Type</option>
                                    <option value="current" ${existingData?.transaction_type === 'current' ? 'selected' : ''}>Current WS Level Credit Limit</option>
                                    <option value="external" ${existingData?.transaction_type === 'external' ? 'selected' : ''}>External Credit</option>
                                    <option value="internal" ${existingData?.transaction_type === 'internal' ? 'selected' : ''}>Internal Credit</option>
                                </select>
                            </td>
                            <td><input type="text" class="receipt-input" value="${existingData?.receipt_number || ''}"></td>
                            <td><input type="text" class="credit-memo-input" value="${existingData?.credit_memo || ''}"></td>
                            <td><input type="number" class="original-amount-input" value="${existingData?.original_amount || ''}" ${existingData ? 'readonly' : ''}></td>
                            <td><input type="number" class="utilized-amount-input" value="${existingData?.utilized_outstanding_amount || ''}" readonly></td>
                            <td><input type="number" class="available-amount-input" value="${existingData?.loc_available_amount || ''}" readonly></td>
                            <td>
                                <select class="split-select">
                                    <option value="">Select Split %</option>
                                    <option value="1" ${existingData?.split_percent === 1 ? 'selected' : ''}>1</option>
                                    <option value="2" ${existingData?.split_percent === 2 ? 'selected' : ''}>2</option>
                                    <option value="3" ${existingData?.split_percent === 3 ? 'selected' : ''}>3</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" class="txn-amount-input" value="${netAmount.toFixed(2)}">
                            </td>
                            <td>
                                <select class="receivable-level-dropdown">
                                    <option value="">Select Level</option>
                                    <option value="AY-AYM-AJM-GAR-GAR-AJMWS" ${existingData?.receivable_level === 'AY-AYM-AJM-GAR-GAR-AJMWS' ? 'selected' : ''}>AY-AYM-AJM-GAR-GAR-AJMWS</option>
                                    <option value="BY-BYM-BJM-GAR-GAR-BJMWS" ${existingData?.receivable_level === 'BY-BYM-BJM-GAR-GAR-BJMWS' ? 'selected' : ''}>BY-BYM-BJM-GAR-GAR-BJMWS</option>
                                    <option value="CY-CYM-CJM-GAR-GAR-CJMWS" ${existingData?.receivable_level === 'CY-CYM-CJM-GAR-GAR-CJMWS' ? 'selected' : ''}>CY-CYM-CJM-GAR-GAR-CJMWS</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <button class="finalize-button" onclick="saveCustomerBalance('${incidentNumber}')">Finalize Invoice</button>
            `;

            creditTable.innerHTML = tableHTML;
            setupTransactionAmountListener();

            const txnInput = creditTable.querySelector('.txn-amount-input');
            if (txnInput) {
                txnInput.value = netAmount.toFixed(2);
                txnInput.dispatchEvent(new Event('input'));
            }

            $('.type-dropdown, .split-select, .receivable-level-dropdown').select2({
                width: '150px',
                dropdownAutoWidth: false,
                minimumResultsForSearch: 1
            });

        } catch (error) {
            console.error('Error fetching customer balance:', error);
            showMessage('Error loading customer balance data', false);
        }
    }
    creditTable.style.display = creditTable.style.display === 'none' ? 'block' : 'none';
}

// changed for getting the value automatically in credit table 
function setupTransactionAmountListener() {
    const txnInput = document.querySelector('.txn-amount-input');
    const txnDisplay = document.querySelector('.txn-amount');
    const utilizedInput = document.querySelector('.utilized-amount-input');
    const availableInput = document.querySelector('.available-amount-input');
    const originalInput = document.querySelector('.original-amount-input');

    if (txnInput) {
        txnInput.addEventListener('input', function(e) {
            const txnAmount = parseFloat(e.target.value) || 0;
            const originalAmount = parseFloat(originalInput.value) || 0;

            // Calculate utilized and available amounts
            const utilizedAmount = txnAmount;
            const availableAmount = originalAmount - utilizedAmount;

            // Update the fields
            utilizedInput.value = utilizedAmount.toFixed(2);
            availableInput.value = availableAmount.toFixed(2);
            txnDisplay.textContent = `(${txnAmount.toFixed(2)})`;
        });
    }

    // Add original amount change handler
    if (originalInput) {
        originalInput.addEventListener('input', function(e) {
            const originalAmount = parseFloat(e.target.value) || 0;
            const txnAmount = parseFloat(txnInput.value) || 0;
            
            // Update available amount when original amount changes
            const availableAmount = originalAmount - txnAmount;
            availableInput.value = availableAmount.toFixed(2);
        });
    }
}

async function showConsumablesModal() {
    const modal = document.createElement('div');
    modal.id = 'consumablesModal';
    modal.className = 'modal';
    const currentDate = getCurrentDate();

    try {
        const urlParams = new URLSearchParams(window.location.search);
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
                        <td>${item.component_code || ''}</td>
                        <td>${parseFloat(item.actual_quantity || 0).toFixed(2)}</td>
                        <td>
                            <input type="text" 
                                   value="${parseFloat(item.existing_trans_qty || 0).toFixed(2)}"
                                   style="width: 50px;">
                        </td>
                        <td>${parseFloat(item.proc_qty || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.returned_qty || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.on_hand_quantity || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.tot_selling_price || 0).toFixed(2)}</td>
                        <td>${item.transaction_date || currentDate}</td>
                        <td>
                            <input type="text" 
                                   style="width: 50px;" 
                                   value="${parseFloat(item.existing_return_qty || 0).toFixed(2)}">
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

            const processButton = modal.querySelector('.process');
            if (processButton) {
                processButton.addEventListener('click', async () => {
                    try {
                        processButton.disabled = true;
                        await processConsumables();
                    } catch (error) {
                        console.error('Process button error:', error);
                        showMessage('Error processing consumables', false);
                    } finally {
                        processButton.disabled = false;
                    }
                });
            }
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
        const transQty = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        if (transQty > 0) {
            const rowData = {
                id: row.querySelector('.consumable-id')?.value,
                line: index + 1,
                operation_code: row.querySelector('td:nth-child(2)').textContent.trim(),
                actual_quantity: parseFloat(row.querySelector('td:nth-child(3)').textContent) || 0,
                trans_qty: transQty,
                return_qty: parseFloat(row.querySelector('td:nth-child(10) input').value) || 0,
                return: row.querySelector('td:nth-child(11) input').checked,
                incident_number: incidentNumber // Add incident number to each row
            };
            consumablesData.push(rowData);
        }
    });

    try {
        const response = await fetch('/api/servicerequest/consumables/process/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                consumables: consumablesData,
                incident_number: incidentNumber
            })
        });

        const result = await response.json();
        if (result.status === "success") {
            showMessage('Consumables processed successfully');
            closeConsumablesModal();
            await displayActualTableData(incidentNumber);
            updateComponentTotals('Consumables');
            updateGrandTotal();
        } else {
            throw new Error(result.message || 'Processing failed');
        }
    } catch (error) {
        console.error('Error in processConsumables:', error);
       
    }
}


function getCellContent(element) {
    if (!element) return '';
    return element.textContent.trim();
}

function closeConsumablesModal() {
    const modal = document.getElementById('consumablesModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

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

function updateGrandTotal() {
    const tbody = document.querySelector('.actual-table tbody');
    const subtotalRows = tbody.querySelectorAll('.subtotal-row');
    const totalRow = tbody.querySelector('.total-row');
    
    let grandTotal = {
        netPrice: 0,
        adjustment: 0,
        discount: 0,
        netAmount: 0,
        vat: 0,
        finalAmount: 0,
        estTotal: 0
    };

    // Calculate totals from each subtotal row
    subtotalRows.forEach(row => {
        // Get all cells in the row
        const allCells = Array.from(row.cells);
        
        // Find the cell containing the component total
        const totalCell = allCells.find(cell => cell.textContent.includes('Total'));
        const startIndex = allCells.indexOf(totalCell);
        
        // Add values to grand total
        grandTotal.netPrice += parseFloat(allCells[startIndex + 1]?.textContent) || 0;
        grandTotal.adjustment += parseFloat(allCells[startIndex + 2]?.textContent) || 0;
        grandTotal.discount += parseFloat(allCells[startIndex + 3]?.textContent) || 0;
        grandTotal.netAmount += parseFloat(allCells[startIndex + 4]?.textContent) || 0;
        grandTotal.vat += parseFloat(allCells[startIndex + 5]?.textContent) || 0;
        grandTotal.finalAmount += parseFloat(allCells[startIndex + 6]?.textContent) || 0;
        grandTotal.estTotal += parseFloat(allCells[startIndex + 7]?.textContent) || 0;

        const componentType = totalCell.textContent.split(' ')[0];
        localStorage.setItem(`subtotal_${componentType}`, JSON.stringify({
            netPrice: allCells[startIndex + 1]?.textContent,
            adjustment: allCells[startIndex + 2]?.textContent,
            discount: allCells[startIndex + 3]?.textContent,
            netAmount: allCells[startIndex + 4]?.textContent,
            vat: allCells[startIndex + 5]?.textContent,
            finalAmount: allCells[startIndex + 6]?.textContent,
            estTotal: allCells[startIndex + 7]?.textContent
        }));
    });

    localStorage.setItem('grandTotal', JSON.stringify(grandTotal));

    if (totalRow) {
        const allCells = Array.from(totalRow.cells);
        const totalCell = allCells.find(cell => cell.textContent.includes('TOTAL'));
        const startIndex = allCells.indexOf(totalCell);

        // Set the calculated values
        allCells[startIndex + 1].textContent = grandTotal.netPrice.toFixed(2);
        allCells[startIndex + 2].textContent = grandTotal.adjustment.toFixed(2);
        allCells[startIndex + 3].textContent = grandTotal.discount.toFixed(2);
        allCells[startIndex + 4].textContent = grandTotal.netAmount.toFixed(2);
        allCells[startIndex + 5].textContent = grandTotal.vat.toFixed(2);
        allCells[startIndex + 6].textContent = grandTotal.finalAmount.toFixed(2);
        // Est Total is already set from API
        allCells[startIndex + 8].textContent = (grandTotal.netAmount - grandTotal.estTotal).toFixed(2);

        // Store net amount instead of final amount
        totalRow.setAttribute('data-net-amount', grandTotal.netAmount.toFixed(2));

        const totalUpdatedEvent = new CustomEvent('totalUpdated', {
            detail: { netAmount: grandTotal.netAmount }
        });
        document.dispatchEvent(totalUpdatedEvent);
    }
}



function restoreStoredTotals() {
    const tbody = document.querySelector('.actual-table tbody');
    const subtotalRows = tbody.querySelectorAll('.subtotal-row');
    const totalRow = tbody.querySelector('.total-row');

    // Restore subtotals
    subtotalRows.forEach(row => {
        const componentType = row.querySelector('.inline-total').textContent.split(' ')[0];
        const storedSubtotal = JSON.parse(localStorage.getItem(`subtotal_${componentType}`) || '{}');
        
        if (storedSubtotal) {
            const allCells = Array.from(row.cells);
            const totalCell = allCells.find(cell => cell.textContent.includes('Total'));
            const startIndex = allCells.indexOf(totalCell);

            allCells[startIndex + 1].textContent = storedSubtotal.netPrice || '0.00';
            allCells[startIndex + 2].textContent = storedSubtotal.adjustment || '0.00';
            allCells[startIndex + 3].textContent = storedSubtotal.discount || '0.00';
            allCells[startIndex + 4].textContent = storedSubtotal.netAmount || '0.00';
            allCells[startIndex + 5].textContent = storedSubtotal.vat || '0.00';
            allCells[startIndex + 6].textContent = storedSubtotal.finalAmount || '0.00';
            allCells[startIndex + 7].textContent = storedSubtotal.estTotal || '0.00';
        }
    });

    // Restore grand total
    const storedGrandTotal = JSON.parse(localStorage.getItem('grandTotal') || '{}');
    if (storedGrandTotal && totalRow) {
        const allCells = Array.from(totalRow.cells);
        const totalCell = allCells.find(cell => cell.textContent.includes('TOTAL'));
        const startIndex = allCells.indexOf(totalCell);

        allCells[startIndex + 1].textContent = (storedGrandTotal.netPrice || 0).toFixed(2);
        allCells[startIndex + 2].textContent = (storedGrandTotal.adjustment || 0).toFixed(2);
        allCells[startIndex + 3].textContent = (storedGrandTotal.discount || 0).toFixed(2);
        allCells[startIndex + 4].textContent = (storedGrandTotal.netAmount || 0).toFixed(2);
        allCells[startIndex + 5].textContent = (storedGrandTotal.vat || 0).toFixed(2);
        allCells[startIndex + 6].textContent = (storedGrandTotal.finalAmount || 0).toFixed(2);
    }
}


// Call restoreStoredTotals when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    if (incidentNumber) {
        displayActualTableData(incidentNumber).then(() => {
            restoreComponentTotals();
            initializeEditableCells();
        });
    }
});

        async function displayActualTableData(incidentNumber) {
            try {
                console.log('=== STARTING DATA LOAD ===');
                const [estimateResponse, componentResponse, estimateTotalResponse] = await Promise.all([
                    fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`),
                    fetch(`/api/servicerequest/get-component-values/${incidentNumber}`),
                    fetch(`/api/servicerequest/estimate-total/${incidentNumber}`) // New API call
                ]);

                const estimateResult = await estimateResponse.json();
                const componentValues = await componentResponse.json();
                const estimateTotalResult = await estimateTotalResponse.json();
                console.log('Estimate API Response:', estimateResult);
                console.log('Component Values API Response:', componentValues);

                if (estimateResult.status === "success") {
                    const groupedData = groupDataByComponentType(estimateResult.data);
                    console.log('Grouped Data:', groupedData);

                    const tbody = document.querySelector('.actual-table tbody');
                    tbody.innerHTML = '';
                    let grandTotal = {
                        netPrice: 0,
                        adjustment: 0,
                        discount: 0,
                        netAmount: 0,
                        vat: 0,
                        finalAmount: 0,
                        
                    };
                    
                    const subletAmounts = componentValues.data.sublet_values.map(sv => sv.transaction_amount);
                    console.log('Sublet Amounts:', subletAmounts);

                    let componentCounters = {
                        Labour: 0,
                        Sublet: 0,
                        Consumables: 0
                    };

                    if (estimateTotalResult.status !== 'success') {
                        throw new Error('Failed to fetch estimate totals');
                    }
                    const componentTotals = estimateTotalResult.data.component_totals;
                    const grandTotalFromAPI = parseFloat(estimateTotalResult.data.grand_total) || 0;
                    Object.entries(groupedData).forEach(([componentType, items]) => {
                        console.log(`\nProcessing ${componentType} components (${items.length} items)`);
                        const estimateTotal = parseFloat(componentTotals[componentType]) || 0;

                        let groupTotal = 0;                
                        items.forEach((item, itemIndex) => {
                            const savedAdj = localStorage.getItem(`adj_${item.id}`) || '0.00';
                            const savedDisc = localStorage.getItem(`disc_${item.id}`) || '0.00';
    

    
        
        
                            console.log(`\nItem ${itemIndex + 1}:`, item);
                            
                            let actualQty = '';
                            switch(componentType) {
                                case 'Labour':
                                    actualQty = componentValues.data.labor_values[componentCounters.Labour]?.trx_qty || '';
                                    console.log(`Labour Value ${componentCounters.Labour}:`, 
                                        componentValues.data.labor_values[componentCounters.Labour]);
                                    componentCounters.Labour++;
                                    break;
                                case 'Sublet':
                                    actualQty = subletAmounts[componentCounters.Sublet] || '';
                                    console.log(`Sublet Value ${componentCounters.Sublet}:`, 
                                        subletAmounts[componentCounters.Sublet]);
                                    componentCounters.Sublet++;
                                    break;
                                case 'Consumables':
                                    actualQty = componentValues.data.consumable_values[componentCounters.Consumables]?.trans_qty|| '';
                                    console.log(`Consumable Value ${componentCounters.Consumables}:`, 
                                        componentValues.data.consumable_values[componentCounters.Consumables]);
                                    componentCounters.Consumables++;
                                    break;
                            }

                            console.log(`Determined Actual Qty: ${actualQty}`);
                            
                            const sellingPrice = parseFloat(item.selling_price) || 0;
                            const actualQtyNum = parseFloat(actualQty) || 0;
                            const netPrice = actualQtyNum * sellingPrice;
                            const adjustment = parseFloat(savedAdj);
                            const discountPercent = parseFloat(savedDisc);
                            groupTotal += netPrice;
                            console.log(`Calculated Values:
                                Selling Price: ${sellingPrice}
                                Actual Qty: ${actualQtyNum}
                                Net Price: ${netPrice}`);

                            const adjustedAmount = netPrice + adjustment;
                            const discountAmount = (adjustedAmount * discountPercent) / 100;
                            const netAmount = adjustedAmount - discountAmount;
                            const vat = netAmount * 0.05;
                            const finalAmount = netAmount + vat;
                        
                            const rowHTML = `
                                <td>${itemIndex === 0 ? `<span class="edit-icon" onclick="show${componentType}Modal(this)" style="cursor: pointer;">✎</span>` : ''}</td>
                                <td>${itemIndex === 0 ? `<span class="${componentType.toLowerCase()}-link" onclick="show${componentType}Modal(this)">${componentType}</span>` : ''}</td>
                                <td>${item.activity_line || ''}</td>
                                <td>${item.activity_desc || ''}</td>
                                <td>${item.component_code || ''}</td>
                                <td>${item.component_description || ''}</td>
                                <td>${item.estimate_status || ''}</td>
                                <td>${item.suggested_quantity || ''}</td>
                                <td>${actualQty}</td>
                                <td>${sellingPrice.toFixed(2)}</td>
                                <td>${netPrice.toFixed(2)}</td>
                                <td class="editable-cell adjustment-cell" contenteditable="true">${savedAdj}</td>
                                <td class="editable-cell discount-cell">${discountPercent.toFixed(2)}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>${item.estimate_total || ''}</td>
                                <td></td>
                            `;
                            
                            const row = document.createElement('tr');
                            row.setAttribute('data-line-id', item.id);
                            row.className = `${componentType.toLowerCase()}-row`;
                            row.innerHTML = rowHTML;
                            tbody.appendChild(row);
                        });
            

                
            
                    if (items.length > 0) {
                        const subtotalRow = document.createElement('tr');
                        const subtotalVariation = groupTotal - estimateTotal;
                        subtotalRow.className = 'subtotal-row';
                        subtotalRow.innerHTML = `
                            <td colspan="10" class="inline-total">${componentType} Total</td>
                            <td>${groupTotal.toFixed(2)}</td>
                            <td class="editable-cell adjustment-cell" >0.00</td>
                            <td class="editable-cell discount-cell">0.00</td>
                            <td>${groupTotal.toFixed(2)}</td>
                            <td>${(groupTotal * 0.05).toFixed(2)}</td>
                            <td>${(groupTotal * 1.05).toFixed(2)}</td>
                            <td>${estimateTotal.toFixed(2)}</td>
                            <td>${subtotalVariation.toFixed(2)}</td>
                        `;
                        tbody.appendChild(subtotalRow);
                        grandTotal.netPrice += groupTotal;
                        grandTotal.netAmount += groupTotal;
                        grandTotal.vat += groupTotal * 0.05;
                        grandTotal.finalAmount += groupTotal * 1.05;
                    }
                });

                if (estimateTotalResult.status !== 'success') {
                    throw new Error('Failed to fetch estimate totals');
                }

                const totalRow = document.createElement('tr');
                totalRow.className = 'total-row';
                totalRow.innerHTML = `
                    <td colspan="10" class="inline-total">TOTAL(s)</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>${grandTotalFromAPI.toFixed(2)}</td>
                    <td>0.00</td> 
                `;
                tbody.appendChild(totalRow);
                updateGrandTotal();

            
                initializeEditableCells();
                }
            } catch (error) {
                console.error('Error in displayActualTableData:', error);
                showMessage('Error loading actual table data', false);
            }
        }


        async function processSublet() {
            const tbody = document.querySelector('#subletModal .table-wrapper table tbody');
            const rows = tbody.querySelectorAll('tr');
    console.log('All Modal Rows:', rows);
            const processData = [];
            const urlParams = new URLSearchParams(window.location.search);
            const incidentNumber = urlParams.get('service_request_id');
        
            try {
                // Get existing sublet data first
                const existingResponse = await fetch(`/api/servicerequest/sublet-process/${incidentNumber}`);
                const existingData = await existingResponse.json();
                const existingSublets = existingData.data || [];
        
                Array.from(rows).forEach((row, index) => {
                    const rowIndex = row.cells[0].textContent;
                    const existingSublet = existingSublets[index];
                    const returnCheckbox = row.querySelector('input[type="checkbox"].return-sublet');
                    const isNewRow = row.hasAttribute('data-new-row');
                    
                    // Use existing ID if available, otherwise it's a new record
                    const data = {
                        id: existingSublet?.id || null,
                        operation_code: row.getAttribute('data-component-code') || 'Sublet',
                        supplier_name: $(row.querySelector('.supplier-name')).val(),
                        petty_cash_supplier: $(row.querySelector('.petty-cash')).val(),
                        activity_description: $(row.querySelector('.activity-desc')).val(),
                        apply_vat: row.querySelector(`#applyVat-${rowIndex}`).checked,
                        transaction_amount: row.querySelector(`#transactionAmount-${rowIndex}`).value,
                        supplier_invoice_num: row.querySelector('input[placeholder="Enter invoice number"]').value,
                        supplier_invoice_date: row.querySelector('input[type="date"]').value,
                        vat_percentage: row.querySelector(`#vatPercentage-${rowIndex}`).value,
                        vat_amount: row.querySelector(`#vatAmount-${rowIndex}`).value,
                        total_amount: row.querySelector(`#totalAmount-${rowIndex}`).value,
                        supplier_site_name: $(row.querySelector('.supplier-site')).val(),
                        return_sublet: returnCheckbox ? returnCheckbox.checked : false,
                        is_new_row: isNewRow
                    };
        
                    // Only include non-empty records
                    if (data.transaction_amount !== '0.00' && data.transaction_amount !== '0' && data.transaction_amount !== '') {
                        processData.push(data);
                    }
                });
        
                const response = await fetch('/api/servicerequest/sublet/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        sublets: processData,
                        incident_number: incidentNumber
                    })
                });
        
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage('Sublets processed successfully');
                    closeSubletModal();
                    await displayActualTableData(incidentNumber);
                    updateComponentTotals('Sublet');
                    updateGrandTotal();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Process error:', error);
                showMessage(error.message || 'Error processing sublets', false);
            }
        }
        
        async function handleReturnSublet() {
            console.log('Return button clicked');
            const tbody = document.querySelector('#subletModal .table-wrapper table tbody');
            const checkedBoxes = tbody.querySelectorAll('input[type="checkbox"].return-sublet:checked');
            
            if (!checkedBoxes.length) {
                showMessage('Please select at least one sublet to return', false);
                return;
            }
        
            // Check transaction amounts for selected rows
            const invalidRows = Array.from(checkedBoxes).filter(checkbox => {
                const row = checkbox.closest('tr');
                const rowIndex = row.cells[0].textContent;
                const transactionAmount = parseFloat(row.querySelector(`#transactionAmount-${rowIndex}`).value);
                return transactionAmount !== 0;
            });
        
            if (invalidRows.length > 0) {
                const confirmUpdate = confirm('Transaction amount must be 0.00 to process return. Would you like to set selected rows to 0.00?');
                
                if (confirmUpdate) {
                    invalidRows.forEach(checkbox => {
                        const row = checkbox.closest('tr');
                        const rowIndex = row.cells[0].textContent;
                        const transactionInput = row.querySelector(`#transactionAmount-${rowIndex}`);
                        transactionInput.value = '0.00';
                        // Trigger VAT recalculation
                        setupVatCalculations(row, rowIndex);
                    });
        
                    // Process sublet with updated values
                    const selectedRows = Array.from(checkedBoxes).map(checkbox => {
                        const row = checkbox.closest('tr');
                        const rowIndex = row.cells[0].textContent;
                        return {
                            id: row.getAttribute('data-sublet-id'),
                            return_sublet: true,
                            transaction_amount: '0.00',
                            vat_amount: '0.00',
                            total_amount_incl_vat: '0.00'
                        };
                    }).filter(data => data.id);
        
                    if (selectedRows.length) {
                        await processSublet();  // First process the updated values
                        await processReturnSublet(selectedRows); // Then process the return
                    }
                } else {
                    return;
                }
            } else {
                // If all rows already have 0.00 transaction amount
                const selectedRows = Array.from(checkedBoxes).map(checkbox => {
                    const row = checkbox.closest('tr');
                    return {
                        id: row.getAttribute('data-sublet-id'),
                        return_sublet: true,
                        transaction_amount: '0.00',
                        vat_amount: '0.00',
                        total_amount_incl_vat: '0.00'
                    };
                }).filter(data => data.id);
        
                if (selectedRows.length) {
                    await processReturnSublet(selectedRows);
                }
            }
        }
        
        
        // Separate processing function
        async function processReturnSublet(selectedRows) {
            const urlParams = new URLSearchParams(window.location.search);
            const incidentNumber = urlParams.get('service_request_id');
        
            try {
                const response = await fetch('/api/servicerequest/sublet/return/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        sublets: selectedRows,
                        incident_number: incidentNumber
                    })
                });
        
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage('Sublet returns processed successfully');
                    closeSubletModal();
                    await displayActualTableData(incidentNumber);
                } else {
                    throw new Error(result.message || 'Failed to process returns');
                }
            } catch (error) {
                console.error('Return processing error:', error);
                showMessage('Failed to process sublet returns', false);
            }
        }
            
        


        function initializeActualTab() {
            $(document).ready(async function () {
                $('.sublet-dropdown, .labor-dropdown').select2({
                    width: '150px',
                    dropdownAutoWidth: false,
                    minimumResultsForSearch: 1,
                    containerCssClass: 'select2-sublet-container',
                    dropdownCssClass: 'select2-sublet-dropdown'
                });

                initializeEditableCells();

                document.querySelectorAll('.sublet-row td:first-child, .sublet-link').forEach(trigger => {
                    trigger.addEventListener('click', function (e) {
                        showSubletModal(this);
                    });
                });

                document.querySelectorAll('.labor-row td:first-child').forEach(icon => {
                    icon.addEventListener('click', showLaborModal);
                });

                document.querySelectorAll('.consumable-row td:first-child').forEach(icon => {
                    icon.addEventListener('click', showConsumablesModal);
                });

                const editIcons = document.querySelectorAll('.sublet-row td:first-child, .labor-row td:first-child, .consumable-row td:first-child');
                editIcons.forEach(icon => {
                    icon.style.cursor = 'pointer';
                });

                const applyAdvanceBtn = document.querySelector('.actual-content .btn-green');
                if (applyAdvanceBtn) {
                    applyAdvanceBtn.addEventListener('click', toggleCreditTable);
                }

                document.querySelectorAll('.btn-info').forEach(button => {
                    button.addEventListener('click', showActionHistoryModal);
                });

                 });
        }


        function initializeEditableCells() {
            // const editableCells = document.querySelectorAll('tr:not(.subtotal-row):not(.total-row) .adjustment-cell, tr:not(.subtotal-row):not(.total-row) .discount-cell');
            const editableCells = document.querySelectorAll('tr:not(.subtotal-row):not(.total-row) .adjustment-cell');

            
            const discountCells = document.querySelectorAll('.discount-cell');
            discountCells.forEach(cell => {
                cell.setAttribute('contenteditable', 'false');
                cell.style.backgroundColor = '#f0f0f0';
                cell.style.textAlign = 'right';
                cell.style.paddingRight = ''; // Visual indicator that it's read-only
            });
    
            // Set numeric format for all cells in the table
            const numericCells = document.querySelectorAll(`
                td:nth-child(8), 
                td:nth-child(9), 
                td:nth-child(10), 
                td:nth-child(11), 
                td:nth-child(14), 
                td:nth-child(15), 
                td:nth-child(16), 
                td:nth-child(17), 
                td:nth-child(18),
                .subtotal-row td:not(:first-child),
                .total-row td:not(:first-child)
            `);
        
            numericCells.forEach(cell => {
                cell.style.textAlign = 'right';
                if (cell.textContent && !isNaN(parseFloat(cell.textContent))) {
                    cell.textContent = parseFloat(cell.textContent).toFixed(2);
                }
            });
            
            editableCells.forEach(cell => {
                cell.style.textAlign = 'right';
                
                cell.addEventListener('focus', function(e) {
                    const currentValue = this.textContent.trim();
                    if (currentValue) {
                        this.setAttribute('data-previous', currentValue);
                        this.textContent = currentValue.replace(/[^\d.-]/g, '');
                    }
                    this.style.outline = '2px solid #007bff';
                    this.style.outlineOffset = '-2px';
                    
                    // Select all text when focused
                    const range = document.createRange();
                    range.selectNodeContents(this);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
        
                cell.addEventListener('blur', function(e) {
                    let value = this.textContent.trim();
                    
                    if (!value && this.hasAttribute('data-previous')) {
                        value = this.getAttribute('data-previous');
                    }
                    
                    if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            this.textContent = numValue.toFixed(2);
                        } else {
                            this.textContent = '0.00';
                        }
                    } else {
                        this.textContent = '0.00';
                    }
                    
                    this.style.outline = 'none';
                    this.style.outlineOffset = '0';
                    
                    const row = this.closest('tr');
                    updateRowCalculations(row);
                    const componentType = getComponentType(row);
                    if (componentType) {
                        updateComponentTotals(componentType);
                    }
                });
        
                cell.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab' || e.key === 'Enter') {
                        e.preventDefault();

                        this.blur();
                        
                        const row = this.closest('tr');
                        const cells = Array.from(row.querySelectorAll('.adjustment-cell, .discount-cell'));
                        const currentIndex = cells.indexOf(this);
                        const nextCell = cells[currentIndex + 1] || 
                                        row.nextElementSibling?.querySelector('.adjustment-cell');
                        
                        if (nextCell) {
                            nextCell.focus();
                        }
                        
                        // Format current cell before moving
                        let value = this.textContent.trim();
                        if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                this.textContent = numValue.toFixed(2);
                            }
                        }
                    }
                    
                    // Allow numbers, decimal, navigation keys, and modifiers
                    const allowedKeys = [
                        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
                        'Tab', '.', '-', 'Home', 'End',
                        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
                    ];
                    
                    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                    }
                });
        
                cell.addEventListener('input', function(e) {
                    let value = this.textContent.replace(/[^\d.-]/g, '');
                    
                    // Handle multiple decimal points
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    
                    // Handle multiple minus signs
                    if (value.split('-').length > 2) {
                        value = '-' + value.replace(/-/g, '');
                    }
                    
                    this.textContent = value;
                });
        
                cell.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                    const numericValue = pastedText.replace(/[^\d.-]/g, '');
                    
                    if (!isNaN(parseFloat(numericValue))) {
                        this.textContent = numericValue;
                    }
                });
            });
        }
        
        
        function getComponentType(row) {
            if (row.classList.contains('sublet-row')) return 'Sublet';
            if (row.classList.contains('labour-row')) return 'Labour';
            if (row.classList.contains('consumables-row')) return 'Consumables';
            return null;
        }


        function updateRowCalculations(row) {
            if (!row || row.classList.contains('subtotal-row') || row.classList.contains('total-row')) return;
        
            const netPriceCell = row.querySelector('td:nth-child(11)');
            const adjustmentCell = row.querySelector('.adjustment-cell');
            const discountCell = row.querySelector('.discount-cell');
            const netAmountCell = row.querySelector('td:nth-child(14)');
            const vatCell = row.querySelector('td:nth-child(15)');
            const finalAmountCell = row.querySelector('td:nth-child(16)');
            const estimateTotalCell = row.querySelector('td:nth-child(17)');
            const variationCell = row.querySelector('td:nth-child(18)');
        
            const netPrice = parseFloat(netPriceCell.textContent) || 0;
            const adjustment = parseFloat(adjustmentCell.textContent) || 0;
            
            // Calculate discount percentage safely
            let discountPercent = 0;
            if (netPrice > 0) {
                discountPercent = (Math.abs(adjustment) / netPrice) * 100;
            }
            discountCell.textContent = discountPercent.toFixed(2);
            
            // Store values for persistence
            const rowId = row.getAttribute('data-line-id');
            if (rowId) {
                localStorage.setItem(`adj_${rowId}`, adjustment);
                localStorage.setItem(`disc_${rowId}`, discountPercent);
                // localStorage.setItem(`netPrice_${rowId}`, netPrice);
            }
        
            // Hide individual calculations
            netAmountCell.textContent = '';
            vatCell.textContent = '';
            finalAmountCell.textContent = '';
            variationCell.textContent = '';
        
            // Update component totals
            const componentType = getComponentType(row);
            if (componentType) {
                updateComponentTotals(componentType);
            }
        }
        
        function updateComponentTotals(componentType) {
            const rows = document.querySelectorAll(`tr.${componentType.toLowerCase()}-row:not(.subtotal-row)`);
            const subtotalRow = Array.from(document.querySelectorAll('.subtotal-row'))
                .find(row => row.querySelector('.inline-total')?.textContent.includes(`${componentType} Total`));
        
            let componentTotal = {
                netPrice: 0,
                adjustment: 0,
                discount: 0,
                netAmount: 0,
                vat: 0,
                finalAmount: 0,
                estTotal: 0
            };
        
            // Calculate totals from valid rows
            rows.forEach(row => {
                const netPrice = parseFloat(row.querySelector('td:nth-child(11)').textContent) || 0;
                const adjustment = parseFloat(row.querySelector('.adjustment-cell').textContent) || 0;
                const estimateTotal = parseFloat(row.querySelector('td:nth-child(17)').textContent) || 0;
        
                if (netPrice > 0) {
                    componentTotal.netPrice += netPrice;
                    componentTotal.adjustment += adjustment;
                    // Don't update estTotal here since it's from API
                    const netAmount = netPrice + adjustment;
                    componentTotal.netAmount += netAmount;
                    componentTotal.vat += netAmount * 0.05;
                    componentTotal.finalAmount += netAmount * 1.05;
                }
            });
        
            // Calculate total discount percentage safely
            componentTotal.discount = componentTotal.netPrice > 0 ? 
                ((Math.abs(componentTotal.adjustment) / componentTotal.netPrice) * 100) : 0;
        
            // Update subtotal row if exists
            if (subtotalRow) {
                const cells = subtotalRow.querySelectorAll('td');
                const startIndex = Array.from(cells).findIndex(cell => cell.classList.contains('inline-total'));
                const originalEstTotal = parseFloat(cells[startIndex + 7].textContent) || 0;

        
                cells[startIndex + 1].textContent = componentTotal.netPrice.toFixed(2);
                cells[startIndex + 2].textContent = componentTotal.adjustment.toFixed(2);
                cells[startIndex + 3].textContent = componentTotal.discount.toFixed(2);
                cells[startIndex + 4].textContent = componentTotal.netAmount.toFixed(2);
                cells[startIndex + 5].textContent = componentTotal.vat.toFixed(2);
                cells[startIndex + 6].textContent = componentTotal.finalAmount.toFixed(2);
                cells[startIndex + 7].textContent = originalEstTotal.toFixed(2);
        
                const variation = componentTotal.netAmount - originalEstTotal;
                cells[startIndex + 8].textContent = variation.toFixed(2);
        
                // Store updated totals
                localStorage.setItem(`${componentType.toLowerCase()}_totals`, JSON.stringify({
                    ...componentTotal,
                    estTotal: originalEstTotal
                }));
            }
        
            // Update grand total
            updateGrandTotal();
        }


        function restoreRowValues() {
            const rows = document.querySelectorAll('tr[data-line-id]');
            rows.forEach(row => {
                const rowId = row.getAttribute('data-line-id');
                if (rowId) {
                    const savedAdj = localStorage.getItem(`adj_${rowId}`);
                    const savedNetPrice = localStorage.getItem(`netPrice_${rowId}`);
                    
                    if (savedAdj) {
                        const adjustmentCell = row.querySelector('.adjustment-cell');
                        if (adjustmentCell) {
                            adjustmentCell.textContent = savedAdj;
                        }
                    }
                    
                    if (savedNetPrice) {
                        const netPriceCell = row.querySelector('td:nth-child(11)');
                        if (netPriceCell) {
                            netPriceCell.textContent = savedNetPrice;
                        }
                    }
                    
                    // Recalculate row after restoring values
                    updateRowCalculations(row);
                }
            });
        }
        
        
        function restoreComponentTotals() {
            ['Labour', 'Sublet', 'Consumables'].forEach(componentType => {
                const storedTotals = localStorage.getItem(`${componentType.toLowerCase()}_totals`);
                if (storedTotals) {
                    const totals = JSON.parse(storedTotals);
                    const subtotalRow = Array.from(document.querySelectorAll('.subtotal-row'))
                        .find(row => row.querySelector('.inline-total')?.textContent.includes(`${componentType} Total`));
                    
                    if (subtotalRow) {
                        const cells = subtotalRow.querySelectorAll('td');
                        const startIndex = Array.from(cells).findIndex(cell => cell.classList.contains('inline-total'));
                        
                        cells[startIndex + 1].textContent = totals.netPrice.toFixed(2);
                        cells[startIndex + 2].textContent = totals.adjustment.toFixed(2);
                        cells[startIndex + 3].textContent = totals.discount.toFixed(2);
                        cells[startIndex + 4].textContent = totals.netAmount.toFixed(2);
                        cells[startIndex + 5].textContent = totals.vat.toFixed(2);
                        cells[startIndex + 6].textContent = totals.finalAmount.toFixed(2);
                        cells[startIndex + 8].textContent = (totals.netAmount - totals.estTotal).toFixed(2);
                    }
                }
            });
            
            updateGrandTotal();
        }
     

        function calculateComponentTotals(rows) {
            let componentTotal = {
                netPrice: 0,
                adjustment: 0,
                discount: 0,
                netAmount: 0,
                vat: 0,
                finalAmount: 0
            };
        
            rows.forEach((row, index) => {
                const netPrice = parseFloat(row.querySelector('td:nth-child(11)').textContent) || 0;
                const adjustment = parseFloat(row.querySelector('.adjustment-cell').textContent) || 0;
                const discountPercent = parseFloat(row.querySelector('.discount-cell').textContent) || 0;
                
                const adjustedAmount = netPrice + adjustment;
                const discountAmount = (adjustedAmount * discountPercent) / 100;
                const rowNetAmount = adjustedAmount - discountAmount;
                const rowVat = rowNetAmount * 0.05;
                const rowFinalAmount = rowNetAmount + rowVat;
        
                componentTotal.netPrice += netPrice;
                componentTotal.adjustment += adjustment;
                componentTotal.netAmount += rowNetAmount;
                componentTotal.vat += rowVat;
                componentTotal.finalAmount += rowFinalAmount;
        
                console.log(`Row ${index + 1} calculations:`, {
                    netPrice,
                    adjustment,
                    discountPercent,
                    rowNetAmount,
                    rowVat,
                    rowFinalAmount
                });
            });
        
            return componentTotal;
        }
        
        

        
        
        
        document.addEventListener('DOMContentLoaded', () => {
            restoreRowValues();
            ['Sublet', 'Labour', 'Consumables'].forEach(type => {
                updateComponentTotals(type);
            });
            updateGrandTotal();
        });
        
        


        
        

document.addEventListener('DOMContentLoaded', function () {
    initializeEditableCells();

}); 


function groupDataByComponentType(data) {
    return data.reduce((groups, item) => {
        const type = item.component_type;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(item);
        return groups;
    }, {});
}






// // for saving the details of credit table 
// async function saveCustomerBalance(incidentNumber) {
//     const resolutionSummary = document.getElementById('resolutionSummary').value;
//     if (!resolutionSummary.trim()) {
//         showMessage('Resolution Summary is mandatory', false);
//         return;
//     }

//     // Show confirmation dialog
//     const confirmed = await showConfirmationDialog(
//         'Are you sure you want to proceed? This action is irreversible!',
//         'Proceed',
//         'Cancel'
//     );

//     if (!confirmed) {
//         return;
//     }

//     const creditTable = document.querySelector('.credit-table tbody tr');
//     const creditData = {
//         incident_number: incidentNumber,
//         customer: creditTable.querySelector('td:first-child').textContent,
//         transaction_type: creditTable.querySelector('.type-dropdown').value,
//         receipt_number: creditTable.querySelector('.receipt-input').value,
//         credit_memo: creditTable.querySelector('.credit-memo-input').value,
//         original_amount: parseFloat(creditTable.querySelector('.original-amount-input').value) || 0,
//         utilized_outstanding_amount: parseFloat(creditTable.querySelector('.utilized-amount-input').value) || 0,
//         loc_available_amount: parseFloat(creditTable.querySelector('.available-amount-input').value) || 0,
//         split_percent: parseFloat(creditTable.querySelector('.split-select').value) || 0,
//         txn_amount: parseFloat(creditTable.querySelector('.txn-amount-input').value) || 0,
//         receivable_level: creditTable.querySelector('.receivable-level-dropdown').value,
//         resolution_summary: resolutionSummary
//     };

//     try {
//         // Check if record exists
//         const checkResponse = await fetch(`/api/servicerequest/customer-balance/${incidentNumber}`);
//         const existingData = await checkResponse.json();

//         const endpoint = existingData.data ?
//             `/api/servicerequest/customer-balance/update/${incidentNumber}` :
//             '/api/servicerequest/customer-balance/process/';

//         const method = existingData.data ? 'PUT' : 'POST';

//         const response = await fetch(endpoint, {
//             method: method,
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken')
//             },
//             body: JSON.stringify(creditData)
//         });

//         const result = await response.json();
//         if (result.status === 'success') {
//             showMessage('Credit details saved successfully');
//             document.getElementById('creditTableContainer').style.display = 'none';
//         } else {
//             showMessage(result.message || 'Error saving credit details', false);
//         }
//     } catch (error) {
//         console.error('Error saving credit details:', error);
//         showMessage('Error saving credit details', false);
//     }
// }
// // the end for saving the credit table 


//  changed for updating the incident status to Closed
async function saveCustomerBalance(incidentNumber) {
    const resolutionSummary = document.getElementById('resolutionSummary').value;
    if (!resolutionSummary.trim()) {
        showMessage('Resolution Summary is mandatory', false);
        return;
    }

    const confirmed = await showConfirmationDialog(
        'Are you sure you want to proceed? This action will close the incident and is irreversible!',
        'Proceed',
        'Cancel'
    );

    if (!confirmed) {
        return;
    }

    const creditTable = document.querySelector('.credit-table tbody tr');
    const creditData = {
        incident_number: incidentNumber,
        customer: creditTable.querySelector('td:first-child').textContent,
        transaction_type: creditTable.querySelector('.type-dropdown').value,
        receipt_number: creditTable.querySelector('.receipt-input').value,
        credit_memo: creditTable.querySelector('.credit-memo-input').value,
        original_amount: parseFloat(creditTable.querySelector('.original-amount-input').value) || 0,
        utilized_outstanding_amount: parseFloat(creditTable.querySelector('.utilized-amount-input').value) || 0,
        loc_available_amount: parseFloat(creditTable.querySelector('.available-amount-input').value) || 0,
        split_percent: parseFloat(creditTable.querySelector('.split-select').value) || 0,
        txn_amount: parseFloat(creditTable.querySelector('.txn-amount-input').value) || 0,
        receivable_level: creditTable.querySelector('.receivable-level-dropdown').value,
        resolution_summary: resolutionSummary
    };

    try {
        const response = await fetch('/api/servicerequest/customer-balance/process/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(creditData)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            showMessage('Credit details saved successfully and incident closed');
            document.getElementById('creditTableContainer').style.display = 'none';
            
            const statusElement = document.getElementById('incidentStatus');
            if (statusElement) {
                statusElement.textContent = 'Closed';
                statusElement.classList.add('status-closed');
            }

            // Disable all edit functionality
            const editButtons = document.querySelectorAll('.edit-icon, .sublet-link, .labor-link, .consumable-link');
            editButtons.forEach(button => button.style.pointerEvents = 'none');

            // Refresh page to reflect all changes
            window.location.reload();
        } else {
            throw new Error(result.message || 'Failed to process customer balance');
        }
    } catch (error) {
        console.error('Error saving credit details:', error);
        showMessage('Error saving credit details', false);
    }
}


// Function to show a confirmation dialog
function showConfirmationDialog(message, confirmText, cancelText) {
    return new Promise((resolve) => {
        const dialogHTML = `
            <div class="confirmation-dialog">
                <div class="confirmation-content">
                    <p>${message}</p>
                    <div class="confirmation-buttons">
                        <button class="confirm-btn">${confirmText}</button>
                        <button class="cancel-btn">${cancelText}</button>
                    </div>
                </div>
            </div>
        `;

        const dialogElement = document.createElement('div');
        dialogElement.innerHTML = dialogHTML;
        document.body.appendChild(dialogElement);

        const dialog = dialogElement.querySelector('.confirmation-dialog');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(dialogElement);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialogElement);
            resolve(false);
        });
    });
}


// Enhanced total update event listener in credit table 
document.addEventListener('totalUpdated', (event) => {
    const creditTable = document.getElementById('creditTableContainer');
    if (creditTable && creditTable.style.display !== 'none') {
        const txnInput = creditTable.querySelector('.txn-amount-input');
        const txnDisplay = creditTable.querySelector('.txn-amount');
        const totalRow = document.querySelector('.actual-table .total-row');
        const netAmount = totalRow ? parseFloat(totalRow.querySelector('td:nth-child(14)').textContent) || 0 : 0;
        
        if (txnInput) {
            txnInput.value = netAmount.toFixed(2);
            txnDisplay.textContent = `(${netAmount.toFixed(2)})`;
            txnInput.dispatchEvent(new Event('input'));
        }
    }
});

