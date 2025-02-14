function getFormValue(formId) {
    return [].slice
        .call($("#" + formId).find("input, select, textarea"))
        .filter((x) => x.value)
        .reduce(function (obj, item) {
            obj[item.name] = item.value?.trim() || '';
            return obj;
        }, {});
}


const saveInstallationChanges = async () => {
    ShowLoading(['Loading...',])
    const formData = new FormData();
    const attachmentInput = document.getElementById('installation-attachment');
    const attachmentFile = attachmentInput.files[0];
    const data = getFormValue('installation-update-form');
    if (( typeof attachmentFile == 'undefined' && $('#uploaded_attachment').length ==0 ) || !(data['usage_type'] && data['installation_date'])) {
        HideLoading();
        toastr.error("Usage type, Installation date and attachments are required!!!")
        throw new Error("Usage type, Installation date and attachments are required!!!")
    }

    if (typeof(attachmentFile) == 'undefined' && $('#uploaded_attachment').length){

    } else{
        formData.append('attachment', attachmentFile);
    }

    for (const key in data) {
        if (key != 'attachment') {
            formData.append(key, data[key]);
        }
    }
    try {
        const res = await axios.put(`/installation/api/update-installation/${data.order_number}/${data.so_unique_header_id}/`, formData, {
            headers: {
                "X-CSRFTOKEN": "{{ csrf_token }}",
                "Content-Type": "multipart/form-data",
            },
        });
        window.location.reload()
        toastr.success(res.data.msg);

    } catch (error) {
        HideLoading();
        console.error(error.response.data['msg']);
        toastr.error(`Failed to save changes. (${error.response.data['msg']})`);
    }
}


const acknowledgeInstallation = async(num, ele)=>{
    const data = getFormValue('installation-update-form');
    $(ele).remove()
    ShowLoading()
    try {
        const res = await axios.post(`/installation/api/acknowledge/${data.order_number}/${data.so_unique_header_id}/${num}/`, {
            order_number: data.order_number, 
            so_unique_header_id: data.so_unique_header_id,
            num,
        }, {
            headers: {
                "X-CSRFTOKEN": "{{ csrf_token }}",
                // "Content-Type": "multipart/form-data",
            },
        });
        window.location.reload()
        toastr.success(res.data.msg);

    } catch (error) {
        HideLoading();
        console.log(error)
        console.error(error.response.data['msg']);
        toastr.error(`Failed to save changes. (${error.response.data['msg']})`);
    }
}