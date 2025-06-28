export async function GET({ params, fetch }: { params: { route: string }, fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> }) {
    const response = await fetch(`https://internal-backend-service/api/${params.route}`, {
        headers: { Authorization: `Bearer ${process.env.VITE_INTERNAL_API_KEY}` }
    });

    if (!response.ok) {
        return new Response('Error fetching data', { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data));
}
