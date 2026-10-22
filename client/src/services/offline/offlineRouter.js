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
        if (method === 'get' && id && !subAction) {
          const event = await eventsRepo.table.where('serverId').equals(id).first() || await eventsRepo.table.get(Number(id)) || await eventsRepo.table.get(id);
          const localEntries = await moiRecordsRepo.table.where('eventId').equals(id).toArray();
          const entriesWithPerson = await Promise.all(localEntries.map(async (entry) => {
            let person = null;
            if (entry.personId) {
              person = await peopleRepo.table.where('serverId').equals(entry.personId).first() || 
                       await peopleRepo.table.get(Number(entry.personId)) || 
                       await peopleRepo.table.get(entry.personId);
            }
            return {
              ...entry,
              _id: entry.serverId || ('offline_' + entry.localId),
              personId: person ? { ...person, _id: person.serverId || ('offline_' + person.localId) } : { _id: entry.personId, name: entry.personName || 'Guest', village: entry.village || '' }
            };
          }));
          return {
            status: 200,
            data: {
              event: event ? { ...event, _id: event.serverId || ('offline_' + event.localId) } : { _id: id, eventName: 'Event', totalCollection: localEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0) },
              entries: entriesWithPerson,
              stats: { totalEntries: localEntries.length, totalAmount: localEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0) }
            }
          };
        }
        return await handleResource(eventsRepo, method, id, config.data, subAction, subId);
      case 'people':
        if (method === 'get' && id === 'search') {
          const queryString = config.url.split('?')[1] || '';
          const params = new URLSearchParams(queryString);
          const query = (params.get('query') || '').toLowerCase();
          const allGuests = await peopleRepo.table.toArray();
          const filtered = allGuests.filter(g => 
            (g.name && g.name.toLowerCase().includes(query)) ||
            (g.village && g.village.toLowerCase().includes(query))
          ).map(g => ({
            ...g,
            _id: g.serverId || ('offline_' + g.localId)
          }));
          return { status: 200, data: { results: filtered } };
        }
        if (method === 'get' && id && !subAction) {
          const person = await peopleRepo.table.where('serverId').equals(id).first() || 
                         await peopleRepo.table.get(Number(id)) || 
                         await peopleRepo.table.get(id);
          const localEntries = await moiRecordsRepo.table.where('personId').equals(id).toArray();
          const localLedgers = await ledgersRepo.table.where('personId').equals(id).toArray();
          return {
            status: 200,
            data: {
              person: person ? { ...person, _id: person.serverId || ('offline_' + person.localId) } : { _id: id, name: 'Offline Person' },
              eventEntries: localEntries,
              personalLedgers: localLedgers,
            }
          };
        }
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
       return { 
         status: 201, 
         data: {
           ...newRecord,
           entry: newRecord,
           _id: newRecord.serverId || ('offline_' + newRecord.localId)
         } 
       };
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
    return {
      status: 201,
      data: {
        ...created,
        person: created,
        event: created,
        entry: created,
        ledger: created,
      },
    };
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
