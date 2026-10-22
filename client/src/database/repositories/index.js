import { BaseRepository } from './BaseRepository';

export const eventsRepo = new BaseRepository('events');
export const moiRecordsRepo = new BaseRepository('moiRecords');
export const guestsRepo = new BaseRepository('guests');
export const ledgersRepo = new BaseRepository('ledgers');
export const paymentsRepo = new BaseRepository('payments');
export const expensesRepo = new BaseRepository('expenses');
export const usersRepo = new BaseRepository('users');
export const settingsRepo = new BaseRepository('settings');
export const reportsRepo = new BaseRepository('reports');

// Special mapping for backwards compatibility with the API
// API calls /people, which maps to guestsRepo or moiRecords depending on context?
// Let's call it peopleRepo to match the backend 'Person' model.
// Wait, the DB setup has 'guests' but backend uses 'people'. I'll export peopleRepo to alias guestsRepo for now,
// or we should rename guests to people in dexie setup? The user asked for "Guests", but backend uses /people.
// Let's create an alias.
export const peopleRepo = new BaseRepository('guests');
