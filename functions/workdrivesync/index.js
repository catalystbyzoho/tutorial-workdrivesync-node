const catalyst = require('zcatalyst-sdk-node');
const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');

const credentials = {
	WorkDriveConnectorz: {
		client_id: '<YOUR_CLIENT_ID>', //Enter your Client ID
		client_secret: '<YOUR_CLIENT_SECRET>', //Enter your Client Secret
		auth_url: 'https://accounts.zoho.com/oauth/v2/token',
		refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
		refresh_token: '<YOUR_REFRESH_TOKEN>' //Enter your Refresh Token
	}
}
const FOLDERID = 'pc3e6aac8f3b9125f4841a20c4c71452d54d1'; //Enter your WorkDrive Folder ID

module.exports = async (event, context) => {
	try {
		const app = catalyst.initialize(context);
		const accessToken = await app.connection(credentials).getConnector('WorkDriveConnectorz').getAccessToken();
		let filestore = app.filestore();
		let folder = filestore.folder(event.data.folder_details);
		let downloadPromise = folder.downloadFile(event.data.id);
		downloadPromise.then(async (fileObject) => {

			fs.writeFileSync(__dirname + '/' + event.data.file_name, fileObject, 'utf-8');
			var data = new FormData();
			data.append('content', fs.createReadStream(__dirname + '/' + event.data.file_name));

			const config = {
				method: 'POST',
				url: `https://workdrive.zoho.com/api/v1/upload?filename=${event.data.file_name}&override-name-exist=true&parent_id=${FOLDERID}`,
				headers: {
					'Authorization': `Zoho-oauthtoken ${accessToken}`,
					...data.getHeaders()
				},
				data: data
			};
			console.log(config)
			axios(config)
				.then(async function (response) {
					const body = response.data;
					const WorkDriveFileID = body.data[0].attributes.resource_id;
					const WorkDriveSync = 'Completed';
					const query = `SELECT ROWID FROM WorkDriveFileID where FileID=${event.data.id}`;
					const queryResult = await app.zcql().executeZCQLQuery(query);
					const ROWID = queryResult[0].WorkDriveFileID.ROWID;
					const catalystTable = app.datastore().table('WorkDriveFileID');
					await catalystTable.updateRow({
						WorkDriveFileID,
						WorkDriveSync,
						ROWID
					});
					context.closeWithSuccess();

				})
				.catch(function (error) {
					console.log(error.response.status, error.response.statusText)
					context.closeWithFailure();
				});
		});
	} catch (e) {
		console.log(e);
		context.closeWithFailure();
	}
};
