import { Synapse } from '@pyrx/synapse';

interface Env { SYNAPSE_API_KEY: string; SYNAPSE_WORKSPACE_ID: string; }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const synapse = new Synapse({ baseUrl: env.SYNAPSE_API_URL || "https://synapse-api.pyrx.tech", apiKey: env.SYNAPSE_API_KEY, workspaceId: env.SYNAPSE_WORKSPACE_ID });
    const json = method === 'POST' || method === 'PUT' ? await request.json() as any : null;

    // Core
    if (path === '/api/track' && method === 'POST') return Response.json(await synapse.track({ externalId: json.userId, eventName: json.event, attributes: json.attributes }));
    if (path === '/api/track/batch' && method === 'POST') return Response.json(await synapse.trackBatch({ events: json.events }));
    if (path === '/api/identify' && method === 'POST') return Response.json(await synapse.identify({ externalId: json.userId, email: json.email, properties: json.properties }));
    if (path === '/api/identify/batch' && method === 'POST') return Response.json(await synapse.identifyBatch({ contacts: json.contacts }));
    if (path === '/api/send' && method === 'POST') return Response.json(await synapse.send({ templateSlug: json.templateSlug, to: json.to, attributes: json.attributes }));

    // Contacts
    if (path === '/api/contacts' && method === 'GET') return Response.json(await synapse.contacts.list({ page: Number(url.searchParams.get('page')) || 1, limit: Number(url.searchParams.get('limit')) || 20 }));
    const contactMatch = path.match(/^\/api\/contacts\/(.+)$/);
    if (contactMatch) {
      const id = contactMatch[1];
      if (method === 'GET') return Response.json(await synapse.contacts.get(id));
      if (method === 'PUT') return Response.json(await synapse.contacts.update(id, json));
      if (method === 'DELETE') { await synapse.contacts.delete(id); return Response.json({ success: true }); }
    }

    // Templates
    if (path === '/api/templates' && method === 'GET') return Response.json(await synapse.templates.list());
    if (path === '/api/templates' && method === 'POST') return Response.json(await synapse.templates.create(json));
    const previewMatch = path.match(/^\/api\/templates\/(.+)\/preview$/);
    if (previewMatch && method === 'POST') return Response.json(await synapse.templates.preview(previewMatch[1], { attributes: json.attributes }));
    const templateMatch = path.match(/^\/api\/templates\/(.+)$/);
    if (templateMatch) {
      const slug = templateMatch[1];
      if (method === 'GET') return Response.json(await synapse.templates.get(slug));
      if (method === 'PUT') return Response.json(await synapse.templates.update(slug, json));
      if (method === 'DELETE') { await synapse.templates.delete(slug); return Response.json({ success: true }); }
    }

    return new Response('Not found', { status: 404 });
  },
};
