const axios = require('axios');

const getAccessToken = async () => {
    try {
        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Zoho Access Token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to authenticate with Zoho');
    }
};

const getOrganizationId = async (accessToken) => {
    try {
        // Fetch user's organization details
        const response = await axios.get('https://meeting.zoho.com/api/v2/user.json', {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
        });

        if (response.data && response.data.userDetails) {
            const { zsoid, zuid } = response.data.userDetails;
            if (!zsoid) throw new Error('Could not retrieve ZSOID from Zoho');
            return { zsoid, zuid };
        } else {
            throw new Error('Could not retrieve user details from Zoho');
        }
    } catch (error) {
        console.error('Error getting ZSOID:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get Zoho Organization ID');
    }
};

const createMeeting = async (meetingDetails) => {
    try {
        const accessToken = await getAccessToken();
        const { zsoid, zuid } = await getOrganizationId(accessToken);
        // Format date for Zoho: "MMM dd, yyyy hh:mm aa"
        const dateObj = new Date(`${meetingDetails.date}T${meetingDetails.time}`);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = months[dateObj.getMonth()];
        const d = String(dateObj.getDate()).padStart(2, '0');
        const y = dateObj.getFullYear();
        let h = dateObj.getHours();
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        const zohoTime = `${m} ${d}, ${y} ${h}:${min} ${ampm}`;

        const payload = {
            session: {
                topic: meetingDetails.title,
                agenda: meetingDetails.description || "",
                presenter: parseInt(zuid) || 0, // Use actual ZUID
                startTime: zohoTime,
                timezone: "Africa/Lagos",
                duration: 60,
                participants: meetingDetails.attendees ? meetingDetails.attendees.map(email => ({ email })) : []
            }
        };

        const response = await axios.post(`https://meeting.zoho.com/api/v2/${zsoid}/sessions.json`, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.session) {
            return response.data.session.joinLink;
        } else {
            console.error('Unexpected Zoho response:', response.data);
            throw new Error('Invalid response from Zoho Meeting API');
        }

    } catch (error) {
        console.error('Error creating Zoho Meeting:', error.response ? JSON.stringify(error.response.data) : error.message);
        throw new Error('Failed to create Zoho Meeting: ' + (error.response?.data?.message || error.message));
    }
};

module.exports = { createMeeting };
