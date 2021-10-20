'use strict';
const express = require('express');
var app = express();
const catalyst = require('zcatalyst-sdk-node');
app.use(express.json());
const FOLDERID = 1824000000676872; //Enter your File Store Folder ID
const axios = require('axios').default;

const credentials = {
	WorkDriveConnectorz: {
		client_id: '1000.SJP52ADYSZO48WLXCOMN7TPZ4HPIDK', //Enter your Client ID
		client_secret: 'd456eb652e2a015c3d681fd328c3932f19730065c2', //Enter your Client Secret
		auth_url: 'https://accounts.zoho.com/oauth/v2/token',
		refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
		refresh_token: '1000.8e1185ab7712dbef22e5ee0a423d1f4b.0ca150be3717987112f3d58d026ad4a9' //Enter your Refresh Token
	}
}

app.get('/getFiles', async (req, res) => {
	try {
		var catalystApp = catalyst.initialize(req);
		const query = 'SELECT * FROM WorkDriveFileID limit 1,100';
		const queryResult = await catalystApp.zcql().executeZCQLQuery(query);
		let resData = [];
		for (var i = 0; i < queryResult.length; i++) {
			const data = queryResult[i].WorkDriveFileID;
			resData.push(data);
		}
		res.status(200).send(resData);
	} catch (e) {
		console.log(e);
		res.status(500).send({ "error": "Internal server error occurred. Please try again in some time." });
	}
});

app.delete('/deleteFile', async (req, res) => {
	try {

		const FILEID = req.query.fileID;
		const catalystApp = catalyst.initialize(req);
		const query = 'SELECT * FROM WorkDriveFileID where FileID=' + FILEID;
		const queryResult = await catalystApp.zcql().executeZCQLQuery(query);
		const ROWID = queryResult[0].WorkDriveFileID.ROWID;
		const WorkDriveFileID = queryResult[0].WorkDriveFileID.WorkDriveFileID;
		const accessToken = await catalystApp.connection(credentials).getConnector('WorkDriveConnectorz').getAccessToken();

		const config = {
			method: 'PATCH',
			url: `https://workdrive.zoho.com/api/v1/files/`,
			headers: {
				'Authorization': `Zoho-oauthtoken ${accessToken}`,
				'Accept': 'application/vnd.api+json'
			},
			data: JSON.stringify({ "data": [{ "attributes": { "status": "51" }, "id": WorkDriveFileID, "type": "files" }] })
		};

		axios(config)
			.then(async function (response) {
				if (response.status == 200) {
					const folder = catalystApp.filestore().folder(FOLDERID);
					await folder.deleteFile(FILEID);
					const table = catalystApp.datastore().table('WorkDriveFileID');
					await table.deleteRow(ROWID);
					res.status(200).send({ message: "Deleted Successfully" });
				} else {
					console.log(error.response.status, error.response.statusText)
					res.status(response.status).send({ message: "Workdrive API Error" });
				}
			})
			.catch(function (error) {
				console.log(error)
				res.status(500).send({ message: "Workdrive API Error" });
			});

	} catch (e) {
		console.log(e);
		res.status(500).send({ "error": "Internal server error occurred. Please try again in some time." });
	}
});

module.exports = app;