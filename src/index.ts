import { Synapse } from '@pyrx/synapse';

interface Env { SYNAPSE_API_KEY: string; SYNAPSE_WORKSPACE_ID: string; SYNAPSE_API_URL?: string; }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const synapse = new Synapse({ baseUrl: env.SYNAPSE_API_URL || "https://synapse-api.pyrx.tech", apiKey: env.SYNAPSE_API_KEY, workspaceId: env.SYNAPSE_WORKSPACE_ID });

    try {
      const json = method === 'POST' || method === 'PUT' ? await request.json() as any : null;

      // Core
      if (path === '/api/track' && method === 'POST') return Response.json(await synapse.track({ externalId: json.userId, eventName: json.event, attributes: json.attributes }));
      if (path === '/api/track/batch' && method === 'POST') return Response.json(await synapse.trackBatch({ events: json.events }));
      if (path === '/api/identify' && method === 'POST') return Response.json(await synapse.identify({ externalId: json.userId, email: json.email, properties: json.properties }));
      if (path === '/api/identify/batch' && method === 'POST') return Response.json(await synapse.identifyBatch({ contacts: json.contacts }));
      if (path === '/api/send' && method === 'POST') return Response.json(await synapse.send({ templateSlug: json.templateSlug, to: json.to, attributes: json.attributes }));

      // Contacts
      if (path === '/api/contacts' && method === 'GET') return Response.json(await synapse.contacts.list({ page: Number(url.searchParams.get('page')) || 1, limit: Number(url.searchParams.get('limit')) || 20 }));
      const cm = path.match(/^\/api\/contacts\/(.+)$/);
      if (cm) {
        if (method === 'GET') return Response.json(await synapse.contacts.get(cm[1]));
        if (method === 'PUT') return Response.json(await synapse.contacts.update(cm[1], json));
        if (method === 'DELETE') { await synapse.contacts.delete(cm[1]); return Response.json({ success: true }); }
      }

      // Templates
      if (path === '/api/templates' && method === 'GET') return Response.json(await synapse.templates.list());
      if (path === '/api/templates' && method === 'POST') return Response.json(await synapse.templates.create(json));
      const pm = path.match(/^\/api\/templates\/(.+)\/preview$/);
      if (pm && method === 'POST') return Response.json(await synapse.templates.preview(pm[1], json));
      const tm = path.match(/^\/api\/templates\/(.+)$/);
      if (tm) {
        if (method === 'GET') return Response.json(await synapse.templates.get(tm[1]));
        if (method === 'PUT') return Response.json(await synapse.templates.update(tm[1], json));
        if (method === 'DELETE') { await synapse.templates.delete(tm[1]); return Response.json({ success: true }); }
      }

      return new Response('Not found', { status: 404 });
    } catch (e: any) {
      return Response.json({ error: e.message, status: e.status || 500 }, { status: e.status || 500 });
    }
  },
};
