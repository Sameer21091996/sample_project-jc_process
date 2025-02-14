

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
        // First check if there are processed sublet records
        const processedResponse = await fetch(`/api/servicerequest/sublet-process/${incidentNumber}`);
        const processedResult = await processedResponse.json();

        // Get dropdown options regardless of which data we'll show
        const [supplierNames, pettyCashSuppliers, supplierSites] = await Promise.all([
            fetchDropdownOptions('SUPPLIER NAME'),
            fetchDropdownOptions('PETTY CASH SUPPLIER'),
            fetchDropdownOptions('SUPPLIER SITE NAME')
        ]);

        if (processedResult.status === 'success' && processedResult.data.length > 0) {
            console.log('Existing Sublet Records:', processedResult.data);
            for (let i = 0; i < processedResult.data.length; i++) {
                const record = processedResult.data[i];
                console.log('Processing Record:', record);
                console.log('Record ID:', record.id);
                console.log('Sublet ID:', record.sublet_id);
                const row = await createSubletRow({
                    index: i + 1,
                    record: {
                        id: record.id,
                        sublet_id: record.id,
                        activity_line: record.estimate_line?.activity_desc,
                        ...record
                    },
                    supplierNames: supplierNames.meanings,
                    pettyCashSuppliers: pettyCashSuppliers.meanings,
                    supplierSites: supplierSites.meanings
                });
                modalTbody.appendChild(row);

                // Set values for processed records
                $(row.querySelector('.supplier-name')).val(record.supplier_name).trigger('change');
                $(row.querySelector('.petty-cash')).val(record.petty_cash_supplier).trigger('change');
                $(row.querySelector('.supplier-site')).val(record.supplier_site_name).trigger('change');

                // Set other field values
                row.querySelector(`#transactionAmount-${i + 1}`).value = record.transaction_amount;
                row.querySelector(`#applyVat-${i + 1}`).checked = record.apply_vat;
                row.querySelector('input[placeholder="Enter invoice number"]').value = record.supplier_invoice_num;
                row.querySelector('input[type="date"]').value = record.supplier_invoice_date || getCurrentDate();
                row.querySelector(`#vatPercentage-${i + 1}`).value = record.vat_percentage;
                row.querySelector(`#vatAmount-${i + 1}`).value = record.vat_amount;
                row.querySelector(`#totalAmount-${i + 1}`).value = record.total_amount_incl_vat;

                // Set activity description if available
                if (record.activity_description) {
                    const activitySelect = row.querySelector('.activity-desc');
                    $(activitySelect).val(record.activity_description).trigger('change');
                }

                // Trigger VAT calculations
                setupVatCalculations(row, i + 1);
            }
        } else {
            // Show estimate lines if no processed records
            const [estimateResponse, activitiesResponse] = await Promise.all([
                fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`),
                fetch(`/api/servicerequest/sublet-activities/${incidentNumber}`)
            ]);

            const [estimateResult, activitiesData] = await Promise.all([
                estimateResponse.json(),
                activitiesResponse.json()
            ]);

            const subletRecords = estimateResult.data.filter(record =>
                record.component_type === 'Sublet'
            );

            if (subletRecords.length > 0) {
                for (let i = 0; i < subletRecords.length; i++) {
                    const row = await createSubletRow({
                        index: i + 1,
                        record: subletRecords[i],
                        supplierNames: supplierNames.meanings,
                        pettyCashSuppliers: pettyCashSuppliers.meanings,
                        supplierSites: supplierSites.meanings
                    });
                    modalTbody.appendChild(row);

                    // Initialize activity description dropdown
                    if (activitiesData.status === 'success') {
                        const activitySelect = row.querySelector('.activity-desc');
                        initializeSelect2Dropdown(activitySelect, activitiesData.activities);
                    }

                    // Setup VAT calculations for new rows
                    setupVatCalculations(row, i + 1);
                }
            } else {
                addEmptySubletRow(modalTbody, supplierNames.meanings, pettyCashSuppliers.meanings, supplierSites.meanings);
            }
        }

        // Add modal close handlers
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeSubletModal;
        }

        window.onclick = function (event) {
            if (event.target === modal) {
                closeSubletModal();
            }
        };

    } catch (error) {
        console.error('Error fetching sublet details:', error);
        showMessage('Error loading sublet details', false);
    }
}

async function createSubletRow({ index, record, supplierNames, pettyCashSuppliers, supplierSites }) {
    const newRow = document.createElement('tr');
    const currentDate = getCurrentDate();
    newRow.setAttribute('data-line-id', record.id);
    newRow.setAttribute('data-operation-code', record.activity_line); // Add operation code


    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (record.sublet_id) {
        newRow.setAttribute('data-sublet-id', record.sublet_id);
    }

    // Fetch sublet activities
    const activitiesResponse = await fetch(`/api/servicerequest/sublet-activities/${incidentNumber}`);
    const activitiesData = await activitiesResponse.json();

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
            <button class="btn-info" onclick="showActionHistoryModal()">i</button>
                <button class="btn-print">Print GRN</button>
            </div>
        </td>
        <td><input type="checkbox" class="checkbox"></td>
        <td><input type="text" value="5" id="vatPercentage-${index}" readonly></td>
        <td><input type="text" value="" id="vatAmount-${index}" readonly></td>
        <td><input type="text" value="" id="totalAmount-${index}" readonly></td>
        <td><input type="text" value="Sublet"></td>
        <td><select class="sublet-dropdown supplier-site"></select></td>
    `;

    const supplierNameSelect = newRow.querySelector('.supplier-name');
    const pettyCashSelect = newRow.querySelector('.petty-cash');
    const supplierSiteSelect = newRow.querySelector('.supplier-site');
    const applyVatCheckbox = newRow.querySelector(`#applyVat-${index}`);
    const transactionAmount = newRow.querySelector(`#transactionAmount-${index}`);
    const vatAmount = newRow.querySelector(`#vatAmount-${index}`);
    const totalAmount = newRow.querySelector(`#totalAmount-${index}`);
    const vatPercentage = newRow.querySelector(`#vatPercentage-${index}`);

    const activitySelect = newRow.querySelector('.activity-desc');
    if (activitiesData.status === 'success') {
        initializeSelect2Dropdown(activitySelect, activitiesData.activities);
    }

    initializeSelect2Dropdown(supplierNameSelect, supplierNames);
    initializeSelect2Dropdown(pettyCashSelect, pettyCashSuppliers);
    initializeSelect2Dropdown(supplierSiteSelect, supplierSites);

    // Handle VAT calculations
    function calculateVat() {
        if (applyVatCheckbox.checked) {
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

    // Event listeners
    transactionAmount.addEventListener('input', calculateVat);
    applyVatCheckbox.addEventListener('change', calculateVat);

    return newRow;
}




function initializeSelect2Dropdown(element, options) {
    // Handle cases where options might be undefined or have a different structure
    const dropdownData = (options || []).map(option => ({
        id: option.meaning || option.id || option, // Use 'meaning' or 'id' based on your API
        text: option.meaning || option.text || option
    }));

    $(element).select2({
        data: dropdownData, // Use mapped data
        width: '150px',
        dropdownAutoWidth: false,
        minimumResultsForSearch: 1,
        containerCssClass: 'select2-sublet-container',
        dropdownCssClass: 'select2-sublet-dropdown'
    });
}
function addEmptySubletRow(tbody, supplierNames, pettyCashSuppliers, supplierSites) {
    const newRow = document.createElement('tr');
    const currentDate = getCurrentDate();

    newRow.innerHTML = `
        <td>1</td>
        <td><select class="sublet-dropdown supplier-name"></select></td>
        <td><select class="sublet-dropdown petty-cash"></select></td>
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
        <td><select class="sublet-dropdown supplier-site"></select></td>
    `;
    tbody.appendChild(newRow);

    const supplierNameSelect = newRow.querySelector('.supplier-name');
    const pettyCashSelect = newRow.querySelector('.petty-cash');
    const supplierSiteSelect = newRow.querySelector('.supplier-site');

    initializeSelect2Dropdown(supplierNameSelect, supplierNames);
    initializeSelect2Dropdown(pettyCashSelect, pettyCashSuppliers);
    initializeSelect2Dropdown(supplierSiteSelect, supplierSites);
}




function setupVatCalculations(row, index) {
    const transactionAmount = row.querySelector(`#transactionAmount-${index}`);
    const vatPercentage = row.querySelector(`#vatPercentage-${index}`);
    const vatAmount = row.querySelector(`#vatAmount-${index}`);
    const totalAmount = row.querySelector(`#totalAmount-${index}`);
    const applyVat = row.querySelector(`#applyVat-${index}`);

    function calculateVat() {
        if (applyVat.checked) {
            const amount = parseFloat(transactionAmount.value) || 0;
            const percentage = parseFloat(vatPercentage.value) || 0;
            const vat = (amount * percentage) / 100;
            vatAmount.value = vat.toFixed(2);
            totalAmount.value = (amount + vat).toFixed(2);
        } else {
            vatAmount.value = '0.00';
            totalAmount.value = transactionAmount.value || '0.00';
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


function addLaborRow() {
    const tbody = document.querySelector('#laborModal .table-wrapper table tbody');
    const newRow = document.createElement('tr');
    const currentDateTime = getCurrentDateTime();
    const mainTable = document.querySelector('.actual-table');
    const rows = mainTable.querySelectorAll('tbody tr');
    newRow.classList.add('new-labor-row'); 

    // Get unique activity lines for operation code dropdown
    const uniqueActivityLines = [...new Set(Array.from(rows)
        .filter(row => {
            const value = row.cells[2].textContent.trim();
            return value && value !== '0.00' && isNaN(value);
        })
        .map(row => row.cells[2].textContent.trim()))];

    newRow.innerHTML = `
        <td>${tbody.children.length + 1}</td>
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
    fetchDropdownOptions('EMPLOYEE NAME').then(data => {
        if (data && data.meanings) {
            let lookupMap = {};
            data.meanings.forEach(meaning => {
                const empNumber = meaning.split('|')[1].trim();
                lookupMap[meaning] = empNumber;
            });

            const options = data.meanings.map(name =>
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
    });
}


function showLaborModal() {
    console.log("Starting showLaborModal function");
    
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    
    console.log("Found incident number:", incidentNumber);

    const modal = document.getElementById('laborModal');
    if (!modal) {
        console.error("Labor modal not found");
        return;
    }

    modal.setAttribute('data-incident-number', incidentNumber);
    modal.style.display = 'block';

    const tbody = modal.querySelector('.table-wrapper table tbody');
    const mainTable = document.querySelector('.actual-table');
    const rows = mainTable.querySelectorAll('tbody tr');
    
    console.log("Total rows found in main table:", rows.length);
    
    tbody.innerHTML = '';
    let rowIndex = 1;
    let isLabourSection = false;

    const uniqueActivityLines = [...new Set(Array.from(rows)
        .filter(row => {
            const value = row.cells[2].textContent.trim();
            return value && value !== '0.00' && isNaN(value);
        })
        .map(row => row.cells[2].textContent.trim()))];
    
    console.log("Unique activity lines:", uniqueActivityLines);

    fetch(`/api/servicerequest/labor/${incidentNumber}`)
        .then(response => response.json())
        .then(laborResponse => {
            console.log("Labor API Response:", laborResponse);
            
            fetchDropdownOptions('EMPLOYEE NAME').then(data => {
                if (data && data.meanings && data.lookup_values) {
                    let lookupMap = {};
                    data.meanings.forEach(meaning => {
                        const empNumber = meaning.split('|')[1].trim();
                        lookupMap[meaning] = empNumber;
                    });

                    console.log("Employee lookup map created:", lookupMap);

                    rows.forEach((row, index) => {
                        const componentType = row.cells[1].textContent.trim();
                        console.log(`Row ${index + 1} - Component Type: ${componentType}`);
                        
                        if (componentType === 'Labour') {
                            isLabourSection = true;
                            console.log("Entering Labour section at row:", index + 1);
                        }
                        else if (componentType && componentType !== 'Labour' && componentType !== '0.00') {
                            isLabourSection = false;
                            console.log("Exiting Labour section at row:", index + 1);
                        }

                        if (isLabourSection && row.cells[2].textContent.trim()) {
                            const componentCode = row.cells[2].textContent.trim();
                            const activityDesc = row.cells[3].textContent;
                            
                            if (componentCode && componentCode !== '0.00') {
                                console.log("Processing Labour row:", {
                                    rowIndex: index + 1,
                                    componentCode,
                                    activityDesc
                                });
                                
                                const matchingLaborData = laborResponse.data.filter(l => l.component_code === componentCode);
                                console.log("Matching labor data found:", matchingLaborData);
                                
                                if (matchingLaborData.length === 0) {
                                    matchingLaborData.push({
                                        component_code: componentCode,
                                        activity_desc: activityDesc
                                    });
                                }

                                matchingLaborData.forEach(laborData => {
                                    const newRow = createLaborRow(rowIndex, laborData, uniqueActivityLines, data.meanings, lookupMap);
                                    tbody.appendChild(newRow);
                                    initializeLaborRowDropdowns(newRow, lookupMap);
                                    rowIndex++;
                                });
                            }
                        }
                    });
                }
            });
        })
        .catch(error => console.error('Error fetching labor data:', error));

    window.onclick = function(event) {
        if (event.target == modal) {
            closeLaborModal();
        }
    };

    const processButton = modal.querySelector('.actions .process');
    processButton.addEventListener('click', processLaborEntries);
}



function showLabourModal(element) {
    // Reuse existing labor modal functionality
    showLaborModal();
}

function createLaborRow(rowIndex, laborData, uniqueActivityLines, employeeNames, lookupMap) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${rowIndex}</td>
        <td>
            <select class="operation-type-dropdown">
                <option value="">- Select Operation -</option>
                ${uniqueActivityLines.map(line =>
                    `<option value="${line}" ${laborData.component_code === line ? 'selected' : ''}>${line}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <select class="labor-dropdown employee-name-select">
                <option value="">- Select Employee -</option>
                ${employeeNames.map(name =>
                    `<option value="${name}" ${laborData.employee_name === name ? 'selected' : ''}>${name}</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="text" class="employee-number" readonly value="${laborData.employee_no || ''}"></td>
        <td><input type="text" value="${laborData.trx_qty || 1}"></td>
        <td><input type="datetime-local" value="${getCurrentDateTime()}" readonly></td>
        <td><input type="datetime-local" value="${getCurrentDateTime()}" readonly></td>
        <td><input type="datetime-local" value="${getCurrentDateTime()}" readonly></td>
        <td><input type="datetime-local" value="${getCurrentDateTime()}" readonly></td>
        <td>${laborData.status || 'open'}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-delete" onclick="deleteLaborRow(this)">-</button>
            </div>
        </td>
    `;

    if (laborData.id) {
        newRow.setAttribute('data-labor-id', laborData.id);
    }

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



function processLaborEntries() {
    const modal = document.getElementById('laborModal');
    const incidentNumber = modal.getAttribute('data-incident-number');
    const tbody = modal.querySelector('.table-wrapper table tbody');
    const rows = tbody.querySelectorAll('tr');
    const laborEntries = Array.from(rows).map((row, index) => {
        return {
            id: row.getAttribute('data-labor-id') || null,
            line: index + 1,
            operation_code: row.querySelector('.operation-type-dropdown').value,
            employee_name: row.querySelector('.employee-name-select').value,
            employee_no: parseInt(row.querySelector('.employee-number').value),
            trx_qty: parseInt(row.querySelector('td:nth-child(5) input').value),
            plan_start_date: row.querySelector('td:nth-child(6) input').value,
            plan_end_date: row.querySelector('td:nth-child(7) input').value,
            actual_start_date: row.querySelector('td:nth-child(8) input').value,
            actual_end_date: row.querySelector('td:nth-child(9) input').value,
            status: row.querySelector('td:nth-child(10)').textContent
        };
    });

    const requestData = {
        labor_entries: laborEntries,
        incident_number: incidentNumber
    };

    fetch('/api/servicerequest/labor/process/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        if (result.status === 'success') {
            showMessage('Labor entries processed successfully');
            closeLaborModal();
        } else {
            showMessage(result.message || 'Error processing labor entries', false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error processing labor entries', false);
    });
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


function showActionHistoryModal() {
    const modal = document.getElementById('actionHistoryModal');
    modal.style.display = 'block';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeActionHistoryModal()">&times;</span>
            <div class="container">
                <h2>Sublet action history</h2>
                <button class="btn btn-print">Print GRN</button>
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
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>1865560#SUBL#1#2#1#1</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.onclick = function (event) {
        if (event.target == modal) {
            closeActionHistoryModal();
        }
    }
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
    if (!modal) {
        showMessage('Modal not found', false);
        return;
    }

    const incidentNumber = modal.getAttribute('data-incident-number');
    if (!incidentNumber) {
        showMessage('Incident number not found', false);
        return;
    }
   
    const rows = modal.querySelectorAll('tbody tr');
    const consumablesData = [];

    rows.forEach((row, index) => {
        // Add null checks for all querySelector operations
        const idElement = row.querySelector('.consumable-id');
        const transQtyInput = row.querySelector('td:nth-child(4) input');
        const operationCodeElement = row.querySelector('td:nth-child(2)');
        const actualQuantityElement = row.querySelector('td:nth-child(3)');
        const returnQtyInput = row.querySelector('td:nth-child(10) input');
        const returnCheckbox = row.querySelector('td:nth-child(11) input');

        // Only proceed if we have the required elements
        if (transQtyInput && operationCodeElement) {
            const transQty = parseFloat(transQtyInput.value) || 0;
            
            const rowData = {
                id: idElement ? idElement.value : null,
                line: index + 1,
                operation_code: operationCodeElement.textContent.trim(),
                actual_quantity: actualQuantityElement ? (parseFloat(actualQuantityElement.textContent) || 0) : 0,
                trans_qty: transQty,
                return_qty: returnQtyInput ? (parseFloat(returnQtyInput.value) || 0) : 0,
                return: returnCheckbox ? returnCheckbox.checked : false
            };

            if (transQty > 0) {
                consumablesData.push(rowData);
            }
        }
    });

    if (consumablesData.length === 0) {
        showMessage('Please enter valid transaction quantities', false);
        return;
    }

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

        const result = await response.json();

        if (result.status === "success") {

            showMessage('Consumables processed successfully');
            
           

            closeConsumablesModal();
        } else {
            showMessage('Error: ' + (result.message || 'Processing failed'), false);
        }
    } catch (error) {
        console.error('Error in processConsumables:', error);
        showMessage('Error processing consumables: ' + error.message, false);
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








async function displayActualTableData(incidentNumber) {
    try {
        console.log('=== STARTING DATA LOAD ===');
        const [estimateResponse, componentResponse] = await Promise.all([
            fetch(`/api/servicerequest/Estimate-line/${incidentNumber}`),
            fetch(`/api/servicerequest/get-component-values/${incidentNumber}`)
        ]);

        const estimateResult = await estimateResponse.json();
        const componentValues = await componentResponse.json();

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
                finalAmount: 0
            };
            
            const subletAmounts = componentValues.data.sublet_values.map(sv => sv.transaction_amount);
            console.log('Sublet Amounts:', subletAmounts);

            let componentCounters = {
                Labour: 0,
                Sublet: 0,
                Consumables: 0
            };

            Object.entries(groupedData).forEach(([componentType, items]) => {
                console.log(`\nProcessing ${componentType} components (${items.length} items)`);
     
                let groupTotal = 0;                
                items.forEach((item, itemIndex) => {
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
                    groupTotal += netPrice;
                    console.log(`Calculated Values:
                        Selling Price: ${sellingPrice}
                        Actual Qty: ${actualQtyNum}
                        Net Price: ${netPrice}`);

                    // Create row HTML
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
                        <td class="editable-cell adjustment-cell" contenteditable="true">0.00</td>
                        <td class="editable-cell discount-cell" contenteditable="true">0.00</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${netPrice.toFixed(2)}</td>
                        <td>0.00</td>
                    `;

                    console.log(`Generated Row HTML:\n${rowHTML}`);
                    
                    const row = document.createElement('tr');
                    row.className = `${componentType.toLowerCase()}-row`;
                    row.innerHTML = rowHTML;
                    tbody.appendChild(row);
                });
      

            // Rest of your table creation code...

            if (items.length > 0) {
                const subtotalRow = document.createElement('tr');
                subtotalRow.className = 'subtotal-row';
                subtotalRow.innerHTML = `
                    <td colspan="10" class="inline-total">${componentType} Total</td>
                    <td>${groupTotal.toFixed(2)}</td>
                    <td class="editable-cell adjustment-cell" contenteditable="true">0.00</td>
                    <td class="editable-cell discount-cell" contenteditable="true">0.00</td>
                    <td>${groupTotal.toFixed(2)}</td>
                    <td>${(groupTotal * 0.05).toFixed(2)}</td>
                    <td>${(groupTotal * 1.05).toFixed(2)}</td>
                    <td>${groupTotal.toFixed(2)}</td>
                    <td>0.00</td>
                `;
                tbody.appendChild(subtotalRow);
            }
        });

        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td colspan="10" class="inline-total">TOTAL(s)</td>
            <td>${grandTotal.netPrice.toFixed(2)}</td>
            <td>${grandTotal.adjustment.toFixed(2)}</td>
            <td>${grandTotal.discount.toFixed(2)}</td>
            <td>${grandTotal.netAmount.toFixed(2)}</td>
            <td>${grandTotal.vat.toFixed(2)}</td>
            <td>${grandTotal.finalAmount.toFixed(2)}</td>
            <td>${grandTotal.netPrice.toFixed(2)}</td>
            <td>0.00</td>
        `;
        tbody.appendChild(totalRow);

        setupAdjustmentAndDiscountHandlers();
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

    rows.forEach(row => {
        console.log('Row Attributes:', {
            'data-line-id': row.getAttribute('data-line-id'),
            'data-sublet-id': row.getAttribute('data-sublet-id'),
            'data-operation-code': row.getAttribute('data-operation-code')
        });
    });

    rows.forEach(row => {
        
        const rowIndex = row.cells[0].textContent;
        const existingSubletId = row.getAttribute('data-sublet-id');
        console.log('Row Index:', rowIndex);
        console.log('Existing Sublet ID:', existingSubletId);
        
        const data = {
            line_id: row.getAttribute('data-line-id'),
            operation_code: row.getAttribute('data-operation-code'),
            supplier_name: $(row.querySelector('.supplier-name')).val(),
            petty_cash_supplier: $(row.querySelector('.petty-cash')).val(),
            activity_description: $(row.querySelector('.activity-desc')).val(),
            apply_vat: row.querySelector(`#applyVat-${rowIndex}`).checked,
            transaction_amount: row.querySelector(`#transactionAmount-${rowIndex}`).value || '0',
            supplier_invoice_num: row.querySelector('input[placeholder="Enter invoice number"]').value || '',
            supplier_invoice_date: row.querySelector('input[type="date"]').value || null,
            vat_percentage: row.querySelector(`#vatPercentage-${rowIndex}`).value || '0',
            vat_amount: row.querySelector(`#vatAmount-${rowIndex}`).value || '0',
            total_amount: row.querySelector(`#totalAmount-${rowIndex}`).value || '0',
            supplier_site_name: $(row.querySelector('.supplier-site')).val()
        };

        if (existingSubletId) {
            data.id = existingSubletId;
        }
        
        processData.push(data);
    });

    try {
        let response;
        const hasExistingRecords = processData.some(data => data.id);
        console.log('Process Data:', processData);
        
        if (hasExistingRecords) {
            console.log('Has Existing Records:', hasExistingRecords);
            response = await fetch(`/api/servicerequest/update-sublet/${processData[0].id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(processData)
            });
        } else {
            response = await fetch('/api/servicerequest/process-sublet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ sublets: processData })
                    });
        }

                const result = await response.json();
                if (result.status === 'success') {
            showMessage('Sublets processed successfully');
                    closeSubletModal();
            if (incidentNumber) {
                await displayActualTableData(incidentNumber);
            }
                } else {
                    showMessage(result.message || 'Error processing sublets', false);
                }
            } catch (error) {
                console.error('Process error:', error);
                showMessage('Error processing sublets', false);
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

                setupAdjustmentAndDiscountHandlers();
                 });
        }

        function setupAdjustmentAndDiscountHandlers() {
            const tbody = document.querySelector('.actual-table tbody');

            // Handle direct input
            tbody.addEventListener('input', function (e) {
                if (e.target.classList.contains('adjustment-cell') ||
                    e.target.classList.contains('discount-cell')) {

                    const row = e.target.closest('tr');
                    if (!row) return;

                    calculateRowValues(row);
                    calculateSubtotals();
                    calculateFinalTotals();
                }
            });

        // Handle paste events
        tbody.addEventListener('paste', function (e) {
            if (e.target.classList.contains('adjustment-cell') ||
                e.target.classList.contains('discount-cell')) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                const sanitizedText = text.replace(/[^\d.-]/g, '');
                e.target.textContent = sanitizedText;

                const row = e.target.closest('tr');
                calculateRowValues(row);
                calculateSubtotals();
                calculateFinalTotals();
            }
        });

        // Handle focus for better UX
        tbody.addEventListener('focus', function (e) {
            if (e.target.classList.contains('adjustment-cell') ||
                e.target.classList.contains('discount-cell')) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.target);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, true);
    }

function calculateRowValues(row) {


    // Get all required cells
    const netPriceCell = row.querySelector('td:nth-child(11)');
    const adjustmentCell = row.querySelector('.adjustment-cell');
    const discountCell = row.querySelector('.discount-cell');
    const netAmountCell = row.querySelector('td:nth-child(14)');
    const vatCell = row.querySelector('td:nth-child(15)');
    const finalAmountCell = row.querySelector('td:nth-child(16)');
    const estimateTotalCell = row.querySelector('td:nth-child(17)');
    const variationCell = row.querySelector('td:nth-child(18)');

    if (!netPriceCell || !adjustmentCell || !discountCell ||
        !netAmountCell || !vatCell || !finalAmountCell) return;

    // Get values and ensure they're numbers
    const netPrice = parseFloat(netPriceCell.textContent) || 0;
    const adjustment = parseFloat(adjustmentCell.textContent) || 0;
    const discount = parseFloat(discountCell.textContent) || 0;
    const estimateTotal = parseFloat(estimateTotalCell?.textContent) || 0;

    // Calculate all values
    let netAmount = netPrice + adjustment;
    if (discount > 0) {
        netAmount = netAmount * (1 - (discount / 100));
    }
    const vat = netAmount * 0.05;
    const finalAmount = netAmount + vat;
    const variation = finalAmount - estimateTotal;

    // Update all cells with formatted values
    netAmountCell.textContent = netAmount.toFixed(2);
    vatCell.textContent = vat.toFixed(2);
    finalAmountCell.textContent = finalAmount.toFixed(2);
    if (variationCell) {
        variationCell.textContent = variation.toFixed(2);
    }
}


function calculateSubtotals() {
    const tbody = document.querySelector('.actual-table tbody');
    const componentTypes = ['sublet', 'labour', 'consumable'];

    componentTypes.forEach(type => {
        const rows = tbody.querySelectorAll(`.${type}-row`);
        if (!rows.length) return;

        let subtotal = {
            netPrice: 0,
            adjustment: 0,
            discount: 0,
            netAmount: 0,
            vat: 0,
            finalAmount: 0,
            estimateTotal: 0
        };

        console.log(`Subtotal for ${type}:`, subtotal);
        rows.forEach(row => {
            const netPrice = parseFloat(row.querySelector('td:nth-child(11)')?.textContent) || 0;
            const adjustment = parseFloat(row.querySelector('.adjustment-cell')?.textContent) || 0;
            const discount = parseFloat(row.querySelector('.discount-cell')?.textContent) || 0;
            const estimateTotal = parseFloat(row.querySelector('td:nth-child(17)')?.textContent) || 0;

            subtotal.netPrice += netPrice;
            subtotal.adjustment += adjustment;
            subtotal.discount += discount;
            subtotal.estimateTotal += estimateTotal;

            let rowNetAmount = netPrice + adjustment;
            if (discount > 0) {
                rowNetAmount = rowNetAmount * (1 - (discount / 100));
            }

            subtotal.netAmount += rowNetAmount;
            const rowVat = rowNetAmount * 0.05;
            subtotal.vat += rowVat;
            subtotal.finalAmount += (rowNetAmount + rowVat);
        });

        const subtotalRow = Array.from(tbody.querySelectorAll('.subtotal-row')).find(row =>
            row.textContent.toLowerCase().includes(type)
        );

        if (subtotalRow) {
            const cells = {
                netPrice: subtotalRow.querySelector('td:nth-child(11)'),
                adjustment: subtotalRow.querySelector('.adjustment-cell'),
                discount: subtotalRow.querySelector('.discount-cell'),
                netAmount: subtotalRow.querySelector('td:nth-child(14)'),
                vat: subtotalRow.querySelector('td:nth-child(15)'),
                finalAmount: subtotalRow.querySelector('td:nth-child(16)'),
                estimateTotal: subtotalRow.querySelector('td:nth-child(17)'),
                variation: subtotalRow.querySelector('td:nth-child(18)')
            };

            Object.entries(cells).forEach(([key, cell]) => {
                if (cell) {
                    if (key === 'variation') {
                        const variation = subtotal.finalAmount - subtotal.estimateTotal;
                        cell.textContent = variation.toFixed(2);
                    } else {
                        cell.textContent = subtotal[key].toFixed(2);
                    }
                }
            });
        }
    });
}

function calculateFinalTotals() {
    const tbody = document.querySelector('.actual-table tbody');
    const subtotalRows = tbody.querySelectorAll('.subtotal-row');
    const totalRow = tbody.querySelector('.total-row');

    if (!totalRow) return;

    let finalTotal = {
        netPrice: 0,
        adjustment: 0,
        discount: 0,
        netAmount: 0,
        vat: 0,
        finalAmount: 0,
        estimateTotal: 0
    };

    console.log('Final Totals:', finalTotal);

    subtotalRows.forEach(row => {
        const netPrice = parseFloat(row.querySelector('td:nth-child(11)')?.textContent) || 0;
        const adjustment = parseFloat(row.querySelector('.adjustment-cell')?.textContent) || 0;
        const discount = parseFloat(row.querySelector('.discount-cell')?.textContent) || 0;
        const netAmount = parseFloat(row.querySelector('td:nth-child(14)')?.textContent) || 0;
        const vat = parseFloat(row.querySelector('td:nth-child(15)')?.textContent) || 0;
        const finalAmount = parseFloat(row.querySelector('td:nth-child(16)')?.textContent) || 0;
        const estimateTotal = parseFloat(row.querySelector('td:nth-child(17)')?.textContent) || 0;

        finalTotal.netPrice += netPrice;
        finalTotal.adjustment += adjustment;
        finalTotal.discount += discount;
        finalTotal.netAmount += netAmount;
        finalTotal.vat += vat;
        finalTotal.finalAmount += finalAmount;
        finalTotal.estimateTotal += estimateTotal;
    });

    const cells = {
        netPrice: totalRow.querySelector('td:nth-child(11)'),
        adjustment: totalRow.querySelector('td:nth-child(12)'),
        discount: totalRow.querySelector('td:nth-child(13)'),
        netAmount: totalRow.querySelector('td:nth-child(14)'),
        vat: totalRow.querySelector('td:nth-child(15)'),
        finalAmount: totalRow.querySelector('td:nth-child(16)'),
        estimateTotal: totalRow.querySelector('td:nth-child(17)'),
        variation: totalRow.querySelector('td:nth-child(18)')
    };

    Object.entries(cells).forEach(([key, cell]) => {
        if (cell) {
            if (key === 'variation') {
                const variation = finalTotal.finalAmount - finalTotal.estimateTotal;
                cell.textContent = variation.toFixed(2);
            } else {
                cell.textContent = finalTotal[key].toFixed(2);
            }
        }
    });
}


function initializeEditableCells() {
    const editableCells = document.querySelectorAll('.editable-cell');
    editableCells.forEach(cell => {
        cell.addEventListener('click', function () {
            this.contentEditable = true;
            this.focus();
        });

        cell.addEventListener('blur', function () {
            this.contentEditable = false;
            calculateFinalTotals();
            calculateSubtotals();
        });

        cell.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    setupAdjustmentAndDiscountHandlers();
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




