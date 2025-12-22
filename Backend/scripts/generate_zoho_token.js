const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const generateToken = async () => {
    try {
        const clientId = await question('Enter Client ID: ');
        const clientSecret = await question('Enter Client Secret: ');
        const code = await question('Enter Authorization Code: ');
        const redirectUri = 'http://localhost:5173/oauth/callback'; // Must match exactly

        const params = new URLSearchParams();
        params.append('client_id', clientId.trim());
        params.append('client_secret', clientSecret.trim());
        params.append('code', code.trim());
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', redirectUri);

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);

        if (response.data.error) {
            console.error('\nError from Zoho:', response.data.error);
        } else {
            }

    } catch (error) {
        console.error('\nRequest Failed:', error.response ? error.response.data : error.message);
    } finally {
        rl.close();
    }
};

generateToken();
