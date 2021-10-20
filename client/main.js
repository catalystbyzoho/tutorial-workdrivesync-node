const FOLDERID = 1824000000676872; //Enter your File Store Folder ID
function uploadfile() {
    debugger;
    var x = document.getElementById("fileupload").files[0];
    var filestore = catalyst.file;
    var folder = filestore.folderId(FOLDERID);
    var uploadPromise = folder.uploadFile(x).start();

    uploadPromise.then((response) => {
        var FileID = response.content.id;
        var FileName = response.content.file_name;
        var UploadedTime = response.content.created_time;
        var FileSize = response.content.file_size;
        var WorkDriveSync = 'In Progress';

        var details = [
            { FileID, WorkDriveSync, FileName, UploadedTime, FileSize }
        ];
        var datastore = catalyst.table;
        var table = datastore.tableId('WorkDriveFileID');
        var insertPromise = table.addRow(details);
        insertPromise
            .then((response) => {
                setTimeout(function () {
                    alert("File Uploaded Successfully");
                }, 3000);
                window.location.reload();
            })
            .catch((err) => {
                console.log(err);
                alert(err)
            });

    }).catch(err => {
        console.log(err);
        alert("Try again after Sometime");
    });
}


function getfiles() {
    catalyst.auth.isUserAuthenticated().then(result => {
        $.ajax({
            url: "/server/files/getFiles",
            type: "GET",
            success: function (respData) {
                debugger;
                var data = getRequiredData(respData);
                renderTable(data);
            },
            error: function (error) {
                alert(error.message);
            }
        });
    }).catch(err => {
        document.body.innerHTML = 'You are not logged in. Please log in to continue. Redirecting you to the login page..';
        setTimeout(function () {
            window.location.href = "login.html";
        }, 3000);
    });
}


function renderTable(respData) {
    debugger;
    var col = [];
    for (var i = 0; i < respData.length; i++) {
        for (var key in respData[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }
    var table = document.createElement("table");
    table.classList.add("ca-table-view");
    table.setAttribute('id', 'dataTable');

    var tr = table.insertRow(-1);

    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");
        th.innerHTML = col[i];
        tr.appendChild(th);
    }
    for (var i = 0; i < respData.length; i++) {

        tr = table.insertRow(-1);

        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            tabCell.innerHTML = respData[i][col[j]];
        }
    }
    debugger;
    var divContainer = document.getElementById("filestore");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
}

function getRequiredData(data) {

    var i;
    var resp = [];
    for (i = 0; i < data.length; i++) {
        var displayData = data[i];
        var gulp = {
            "File Name": displayData.FileName,
            "Uploaded Time": displayData.UploadedTime,
            "File Size": displayData.FileSize,
            "Filestore Upload": 'Completed',
            "WorkDrive Sync": displayData.WorkDriveSync,
            "<center>Download File</center>": '<center><a href="javascript:downloadfile(&quot;' + displayData.FileID + '&quot;)">&#x21e9;</a></center>'
        }
        if (displayData.WorkDriveSync === "In Progress") {
            gulp["<center>Delete File</center>"] = '<center><a href="javascript:showAlert()">&#128465;</a></center>'
        } else if (displayData.WorkDriveSync === "Completed") {
            gulp["<center>Delete File</center>"] = '<center><a href="javascript:showDeletePopup(&quot;' + displayData.FileID + '&quot;)">&#128465;</a></center>'
        }
        resp.push(gulp);
    }
    return resp;
}

function showAlert() {
    alert("WorkDrive Sync in Progress. Try Deleting the file Later.")
}

function logout() {
    var redirectURL = "https://workdrivesync-721459367.development.catalystserverless.com/app/login.html"; //Enter the app domain of your project
    var auth = catalyst.auth;
    auth.signOut(redirectURL);
}

function showDeletePopup(fileID) {
    debugger;
    $('#ModalDanger').modal('show');
    var deleteBtn = document.getElementById("delete-btn");
    deleteBtn.value = fileID;
}

function deleteFile() {
    var fileID = document.getElementById('delete-btn').value;
    $.ajax({
        url: "/server/files/deleteFile?fileID=" + fileID,
        type: "delete",
        success: function (data) {
            debugger;
            $('#ModalDanger').modal('toggle');
            $("#myModalLabel").html("<br>Success");
            $("#message").html("File Deleted Successfully");
            $('#myModal').modal('show');
            setTimeout(function () {
                location.reload();
            }, 3000);
        },
        error: function (error) {
            $("#myModalLabel").html("<br>Failure");
            $("#message").html("Please try again after Sometime");
            $('#myModal').modal('show');
        }
    });
}

function downloadfile(filedownloadid) {

    var filestore = catalyst.file;
    var folder = filestore.folderId(FOLDERID);
    var file = folder.fileId(filedownloadid);
    var downloadPromise = file.getDownloadLink();
    downloadPromise
        .then((response) => {
            var url = response.content.download_url;
            const link = document.createElement('a');
            link.href = url;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((err) => {
            alert("Error downloading file. Please try again after some time");
        });
}