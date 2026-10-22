import { eventsRepo, peopleRepo, ledgersRepo, moiRecordsRepo } from '../../database/repositories';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses the URL to determine the intended collection and operation.
 * Matches endpoints like `/api/events`, `/api/people/:id`, `/api/ledger`, etc.
 */
export const routeOfflineRequest = async (config) => {
  const method = config.method.toLowerCase();
  // Strip baseURL or leading api prefix if present
  let url = config.url.replace(/^(\/api|\/)/, ''); 
  
  const [collection, id, subAction, subId] = url.split('?')[0].split('/');
  
  // Example Routing Logic
  try {
    switch (collection) {
      case 'events':
        return await handleResource(eventsRepo, method, id, config.data, subAction, subId);
      case 'people':
        return await handleResource(peopleRepo, method, id, config.data, subAction, subId);
      case 'ledger':
        return await handleResource(ledgersRepo, method, id, config.data, subAction, subId);
      case 'reports':
        return { status: 200, data: { message: 'Reports unavailable offline' } };
      case 'auth':
        if (method === 'post' && id === 'login') {
          return { status: 200, data: { token: 'offline-token', user: { name: 'Offline User' } } };
        }
        if (method === 'post' && id === 'register') {
          const newUser = {
            _id: uuidv4(),
            name: parsedData.name || 'Offline User',
            email: parsedData.email,
          };
          // Optionally save to usersRepo here if needed
          return { status: 200, data: { token: 'offline-token', user: newUser } };
        }
        if (method === 'get' && id === 'me') {
          return { status: 200, data: { user: { name: 'Offline User' } } };
        }
        return { status: 200, data: {} };
      default:
        console.warn(`[OfflineRouter] Unhandled collection: ${collection}`);
        return { status: 200, data: [] };
    }
  } catch (err) {
    console.error('[OfflineRouter] Error handling request:', err);
    return { status: 500, data: { error: err.message } };
  }
};

/**
 * Generic handler for standard REST operations against a Dexie repository.
 */
async function handleResource(repo, method, id, data, subAction, subId) {
  // Parse data if it's a JSON string (sometimes axios stringifies early)
  let parsedData = data;
  if (typeof data === 'string') {
    try { parsedData = JSON.parse(data); } catch (e) {}
  }

  // Handle nested routes like /events/:id/entries
  if (subAction === 'entries') {
    // This is specific to MOI entries. We should map it to moiRecordsRepo
    if (method === 'get') {
       const entries = await moiRecordsRepo.table.where('eventId').equals(id).toArray();
       return { status: 200, data: entries };
    }
    if (method === 'post') {
       const newRecord = await moiRecordsRepo.create({ ...parsedData, eventId: id });
       return { status: 201, data: newRecord };
    }
    if (method === 'put' && subId) {
       const updated = await moiRecordsRepo.update(subId, parsedData);
       return { status: 200, data: updated };
    }
  }

  // Standard CRUD
  if (method === 'get') {
    if (id && id !== 'search') {
      const record = await repo.table.where('serverId').equals(id).first() || await repo.table.get(id);
      return { status: 200, data: record };
    } else {
      const allRecords = await repo.getAll();
      return { status: 200, data: allRecords };
    }
  }
  
  if (method === 'post') {
    const created = await repo.create(parsedData);
    return { status: 201, data: created };
  }
  
  if (method === 'put' && id) {
    const updated = await repo.update(id, parsedData);
    return { status: 200, data: updated };
  }
  
  if (method === 'delete' && id) {
    await repo.delete(id);
    return { status: 200, data: { message: 'Deleted locally' } };
  }

  return { status: 404, data: { message: 'Not found' } };
}
