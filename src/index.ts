import { Synapse } from '@pyrx/synapse';

interface Env {
  SYNAPSE_API_KEY: string;
  SYNAPSE_WORKSPACE_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const synapse = new Synapse({ apiKey: env.SYNAPSE_API_KEY, workspaceId: env.SYNAPSE_WORKSPACE_ID });
    const body = await request.json() as Record<string, any>;

    if (url.pathname === '/api/track') {
      await synapse.track({ externalId: body.userId, eventName: body.event, attributes: body.attributes || {} });
      return Response.json({ success: true });
    }

    if (url.pathname === '/api/identify') {
      await synapse.identify({ externalId: body.userId, email: body.email, properties: body.properties || {} });
      return Response.json({ success: true });
    }

    return new Response('Not found', { status: 404 });
  },
};
