
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get('image');
        const zoneId = formData.get('zoneId');
        const teamId = formData.get('teamId');

        if (!image || !zoneId || !teamId) {
            return NextResponse.json({ error: 'Missing image, zoneId, or teamId' }, { status: 400 });
        }

        // Construct the external URL
        // User requested: .../verify/zone_1, zone_2 etc.
        const externalUrl = `https://tinkerhub--treasure-hunt-zones-fastapi-app.modal.run/verify/zone_${zoneId}`;

        console.log(`Verifying Zone ${zoneId} for Team ${teamId} at ${externalUrl}...`);

        // Forward the request
        // We need to send it as multipart/form-data
        const backendFormData = new FormData();
        backendFormData.append('file', image); // External API likely expects 'file'
        backendFormData.append('team_id', teamId); // "send the zone, team and image" -> assuming 'team_id' or 'team' parameter name. I'll use 'team_id' to be safe standard snake_case for python backends.

        const backendRes = await fetch(externalUrl, {
            method: 'POST',
            body: backendFormData,
            // fetch automatically sets Content-Type boundary for FormData
        });

        // The external API returns success/failure
        if (!backendRes.ok) {
            const text = await backendRes.text();
            console.error('Verification Provider Error:', text);
            return NextResponse.json({ success: false, message: 'Verification Failed' }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        console.log('Verification Result:', data);

        // Assume backend returns { success: true/false } or similar
        // Adjust based on actual response if needed.
        // If the user says "it returns success or failure", we pass it through.
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Verify Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
