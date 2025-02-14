// Material Modal Functions
// function showMaterialModal(incidentNumber, componentCode) {
//     fetch(`/api/servicerequest/materials/${incidentNumber}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.status === "success") {
//                 populateMaterialTable(data.data);
//                 document.getElementById("materialModal").style.display = "block";
//             } else {
//                 showError(data.message);
//             }
//         })
//         .catch(error => showError(error));
// }

// function populateMaterialTable(materials) {
//     const tbody = document.getElementById("materialTableBody");
//     tbody.innerHTML = "";

//     materials.forEach(material => {
//         const row = document.createElement("tr");
//         row.innerHTML = `
//             <td>${material.line}</td>
//             <td>${material.requested_part}</td>
//             <td>${material.issued_part}</td>
//             <td>${material.req_qty}</td>
//             <td>${material.issued_qty}</td>
//             <td>${material.ack_qty}</td>
//             <td>${material.canc_qty || ''}</td>
//             <td>${material.returned_qty || ''}</td>
//             <td>${material.tot_selling_price}</td>
//             <td>${material.request_number}</td>
//             <td>${new Date(material.transaction_date).toLocaleString()}</td>
//             <td>${material.line_status}</td>
//             <td>${material.parts_status}</td>
//             <td>${material.cancel_status || ''}</td>
//             <td>${material.is_cancelled ? 'Yes' : 'No'}</td>
//             <td><button onclick="showActionHistory(${material.id})">View</button></td>
//         `;
//         tbody.appendChild(row);
//     });
// }


function showMaterialModal() {
    document.getElementById("materialModal").style.display = "block";
}

function openMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


function processMaterialChanges() {
    const materials = gatherMaterialData();
    const incidentNumber = getCurrentIncidentNumber();

    fetch('/api/servicerequest/materials/process/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            materials: materials,
            incident_number: incidentNumber
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                showSuccess("Materials processed successfully");
                closeMaterialModal();
                refreshActualTab();
            } else {
                showError(data.message);
            }
        })
        .catch(error => showError(error));
}

function openMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


// Initialize material-related event listeners
document.addEventListener('DOMContentLoaded', function () {
    const materialLinks = document.querySelectorAll('.material-link');
    const editIcons = document.querySelectorAll('.edit-icon[onclick*="showMaterialModal"]');

    materialLinks.forEach(link => {
        link.addEventListener('click', () => showMaterialModal());
    });

    editIcons.forEach(icon => {
        icon.addEventListener('click', () => showMaterialModal());
    });

    window.onclick = function (event) {
        const modal = document.getElementById('materialModal');
        if (event.target === modal) {
            closeMaterialModal();
        }
    };
});