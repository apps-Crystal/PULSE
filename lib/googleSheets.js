import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

        // Check if credentials are valid (basic check)
        if (!credentials.project_id) {
            console.warn("Missing GOOGLE_CREDENTIALS or invalid format. Sheets logging will be skipped.");
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        return sheets;
    } catch (error) {
        console.error("Error initializing Google Sheets client:", error);
        return null;
    }
}
