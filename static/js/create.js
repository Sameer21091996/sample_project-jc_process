
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Load operation lines first and cache them
        const operationLines = await loadOperationLines();

        // Then fetch other details
        await fetchServiceRequestDetails();

        initializeActualTab();
        const backButton = document.querySelector('.btn-red');
        backButton.addEventListener('click', function () {
            const serviceRequestId = getServiceRequestId();
            window.location.href = `/Service_request/jobCard/?incident=${serviceRequestId}`;
        });

        // Only populate dropdown for new rows
        const tbody = document.querySelector('#operationsTable tbody');
        if (!tbody.children.length) {
            await addRow();
        }

        // Initialize credit table toggle
        const applyAdvanceBtn = document.querySelector('.actual-content .btn.btn-green');
        if (applyAdvanceBtn) {
            applyAdvanceBtn.addEventListener('click', toggleCreditTable);
        }

    } catch (error) {
        console.error('Error during initialization:', error);
    }
});




let operationCode = 2;

// Function to fetch operation codes from API
async function fetchOperationCodes() {
    try {
        const response = await fetch('/api/servicerequest/lookup-values/OPERATION CODE');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching operation codes:', error);
        return [];
    }
}

// Function to populate operation code dropdown
async function populateOperationCodeDropdown(selectElement) {
    const operationCodes = await fetchOperationCodes();
    let options = '<option value=""></option>';
    options += operationCodes.map(code =>
        `<option value="${code.id}">${code.code} | ${code.value}</option>`
    ).join('');

    selectElement.innerHTML = options;
    selectElement.addEventListener('change', function () {
        handleOperationCodeChange(this);
    });
}

// Modified addRow function with API integration
async function addRow() {
    const table = document.getElementById('operationsTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td><button class="delete-btn" onclick="deleteRow(this)">X</button></td>
        <td><select class="operation-code-select no-arrow"></select></td>
        <td><input type="text" readonly></td>
        <td><input type="text" required></td>
        <td><input type="text"></td>
        <td><button class="save-btn">Save</button></td>
        <td><input type="text"></td>
    `;

    const saveBtn = newRow.querySelector('.save-btn');
    saveBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const operationSelect = newRow.querySelector('.operation-code-select');
        const problemInput = newRow.querySelector('td:nth-child(4) input');

        if (!operationSelect.value || !problemInput.value) {
            alert('Please fill in all required fields (Operation Code and Problem)');
            return;
        }
        saveOperationLine(this);
    });

    const selectElement = newRow.querySelector('.operation-code-select');
    await populateOperationCodeDropdown(selectElement);
    operationCode++;
}

document.addEventListener('DOMContentLoaded', function () {
    const initialSaveBtn = document.querySelector('.operations-table tbody .save-btn');
    if (initialSaveBtn) {
        initialSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const row = this.closest('tr');
            const operationSelect = row.querySelector('.operation-code-select');
            const problemInput = row.querySelector('td:nth-child(4) input');

            if (!operationSelect.value || !problemInput.value) {
                alert('Please fill in all required fields (Operation Code and Problem)');
                return;
            }
            saveOperationLine(this);
        });
    }
});

async function saveOperationLine(button) {
    try {
        const row = button.closest('tr');
        const operationSelect = row.querySelector('.operation-code-select');
        const selectedOption = operationSelect.options[operationSelect.selectedIndex];

        const urlParams = new URLSearchParams(window.location.search);
        const serviceRequestId = urlParams.get('service_request_id');

        const data = {
            service_request_id: serviceRequestId,
            operation_code: selectedOption.text,
            description: row.querySelector('td:nth-child(3) input').value || '',
            problem: row.querySelector('td:nth-child(4) input').value || '',
            correction: row.querySelector('td:nth-child(5) input').value || '',
            view_components: '',
            gift_voucher_scheme: '0.00'
        };

        const response = await fetch('/api/servicerequest/operation-line', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // Keep button enabled and active
        button.textContent = 'Save';
        button.style.backgroundColor = '#4CAF50';

        // Keep inputs enabled for multiple saves
        row.querySelectorAll('input, select').forEach(input => {
            input.disabled = false;
        });

        await loadOperationLines();
        alert('Operation line saved successfully!');

    } catch (error) {
        console.error('Error saving operation line:', error);
        alert(`Failed to save: ${error.message}`);
    }
}

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
}

document.addEventListener('DOMContentLoaded', function () {
    const backButton = document.querySelector('.btn-red');
    backButton.addEventListener('click', function () {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceRequestId = urlParams.get('service_request_id');
        window.location.href = `/Service_request/jobCard/?incident=${serviceRequestId}`;
    });
});

function disableRowInputs(row) {
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

function getServiceRequestId() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceRequestId = urlParams.get('service_request_id');
    if (!serviceRequestId) {
        console.error('No service request ID found in URL');
        return null;
    }
    return serviceRequestId;
}

function handleOperationCodeChange(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('td:nth-child(3) input');
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption.value) {
        const optionText = selectedOption.text;
        const parts = optionText.split('|');
        if (parts.length > 1) {
            descriptionInput.value = parts[1].trim();
        }
    } else {
        descriptionInput.value = '';
    }
}

function deleteRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

function selectTab(event, tabName) {
    const tabs = document.getElementsByClassName('tab');
    const tabContents = document.getElementsByClassName('tab-content');

    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
    // Add this condition to load estimate data when estimate tab is selected
    if (tabName === 'estimate') {
        loadEstimateLines();

    }
}

function toggleCreditTable() {
    const creditTable = document.getElementById('creditTableContainer');
    creditTable.style.display = creditTable.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await fetchServiceRequestDetails();
        await loadOperationLines();

        const initialSelect = document.querySelector('.operations-table tbody tr select');
        if (initialSelect) {
            await populateOperationCodeDropdown(initialSelect);
        }

        await loadOperationLines();

        const applyAdvanceBtn = document.querySelector('.actual-content .btn.btn-green');
        applyAdvanceBtn.addEventListener('click', toggleCreditTable);

    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

async function fetchServiceRequestDetails() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceRequestId = urlParams.get('service_request_id');

        if (!serviceRequestId) {
            throw new Error('No service request ID found in URL');
        }

        const response = await fetch(`/api/servicerequest/service-requests/${serviceRequestId}/`);
        if (!response.ok) {
            throw new Error('Failed to fetch service request details');
        }

        const data = await response.json();
        const fields = {
            'actualCustomer': data.customer_name,
            'incidentType': data.incident_type,
            'status': data.incident_status || 'Open',
            'problemSummary': data.problem_summary,
            'resolutionSummary': data.resolution_summary || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        });

    } catch (error) {
        console.error('Error fetching service request details:', error);
    }
}

async function loadOperationLines() {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');

    if (!incidentNumber) {
        console.error('No incident number found in URL');
        return;
    }

    try {
        const response = await fetch(`/api/servicerequest/operation-line/${incidentNumber}`);
        if (!response.ok) {
            throw new Error('Failed to fetch operation lines');
        }

        const result = await response.json();
        if (result.status === 'success' && result.data) {
            displayOperationLines(result.data);
        }
    } catch (error) {
        console.error('Error loading operation lines:', error);
    }
}

function displayOperationLines(operationLines) {
    const tbody = document.querySelector('#operationsTable tbody');
    tbody.innerHTML = '';

    operationLines.forEach(line => {
        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>${line.id || ''}</td>
            <td>
                <select class="operation-code-select" disabled>
                    <option value="${line.operation_code}">${line.operation_code}</option>
                </select>
            </td>
            <td><input type="text" value="${line.description || ''}" readonly></td>
            <td><input type="text" value="${line.problem || ''}" readonly></td>
            <td><input type="text" value="${line.correction || ''}" readonly></td>
            <td><button class="save-btn" disabled style="background-color: #808080;">Saved</button></td>
            <td><input type="text" value="${line.gift_voucher_scheme || '0.00'}" readonly></td>
        `;
    });

    addRow();
}

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentNumber = urlParams.get('service_request_id');
    if (incidentNumber) {
        displayActualTableData(incidentNumber);
    }
});

// for refreshing the page 
document.addEventListener('DOMContentLoaded', function () {
    // Get the refresh button
    const refreshButton = document.querySelector('.button-group .btn.btn-green:nth-of-type(4)');

    refreshButton.addEventListener('click', function () {
        // Store current active tab before refresh
        const activeTab = document.querySelector('.tab.active').textContent;
        localStorage.setItem('activeTab', activeTab);

        // Reload page
        window.location.reload();
    });

    // Restore active tab after page load
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        const tabToActivate = Array.from(document.querySelectorAll('.tab'))
            .find(tab => tab.textContent === savedTab);

        if (tabToActivate) {
            const tabName = savedTab.toLowerCase();
            selectTab({ currentTarget: tabToActivate }, tabName);
            localStorage.removeItem('activeTab'); // Clear stored tab
        }
    }
});


// for Downloading invoice 
async function downloadInvoice() {
    const button = document.getElementById('printInvoiceBtn');
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    try {
        btnText.textContent = 'Downloading...';
        btnLoader.style.display = 'inline-block';

        const urlParams = new URLSearchParams(window.location.search);
        const serviceRequestId = urlParams.get('service_request_id');
        await generateAndDownloadInvoice(serviceRequestId);

    } finally {
        btnText.textContent = 'Print Invoice';
        btnLoader.style.display = 'none';
    }
}


// for Downloading the perfoma invoice
async function downloadPerforma() {
    const button = document.getElementById('printPerformaBtn');
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    try {
        btnText.textContent = 'Downloading...';
        btnLoader.style.display = 'inline-block';

        const urlParams = new URLSearchParams(window.location.search);
        const serviceRequestId = urlParams.get('service_request_id');
        await generateAndDownloadPerforma(serviceRequestId);

    } finally {
        btnText.textContent = 'Print Performa';
        btnLoader.style.display = 'none';
    }
}

