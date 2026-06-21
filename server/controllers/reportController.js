import Person from '../models/Person.js';
import Event from '../models/Event.js';
import EventEntry from '../models/EventEntry.js';
import PersonalLedger from '../models/PersonalLedger.js';

export const getBalanceReport = async (req, res) => {
  try {
    const { village, dateRange } = req.query;
    let query = { createdBy: req.user.id };

    if (village) {
      query.village = { $regex: village, $options: 'i' };
    }

    const people = await Person.find(query);

    const needToReturn = people
      .filter((p) => p.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const needToReceive = people
      .filter((p) => p.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    res.json({
      needToReturn: needToReturn.map((p) => ({
        id: p._id,
        name: p.name,
        village: p.village,
        amount: p.balance,
        lastTransaction: p.updatedAt,
      })),
      needToReceive: needToReceive.map((p) => ({
        id: p._id,
        name: p.name,
        village: p.village,
        amount: Math.abs(p.balance),
        lastTransaction: p.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { createdBy: req.user.id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.eventDate = { $gte: startDate, $lte: endDate };
    }

    const events = await Event.find(query).sort({ eventDate: -1 });

    const eventStats = await Promise.all(
      events.map(async (event) => {
        const entries = await EventEntry.find({ eventId: event._id });
        const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
        return {
          id: event._id,
          eventName: event.eventName,
          eventType: event.eventType,
          eventDate: event.eventDate,
          location: event.location,
          totalCollection: total,
          entryCount: entries.length,
        };
      })
    );

    res.json({ events: eventStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPersonReport = async (req, res) => {
  try {
    const people = await Person.find({ createdBy: req.user.id }).sort({ totalReceived: -1 });

    const personStats = people.map((person) => ({
      id: person._id,
      name: person.name,
      village: person.village,
      mobile: person.mobile,
      totalReceived: person.totalReceived,
      totalReturned: person.totalReturned,
      balance: person.balance,
      status: person.status,
    }));

    res.json({ people: personStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVillageReport = async (req, res) => {
  try {
    const people = await Person.find({ createdBy: req.user.id });

    const villageStats = {};
    people.forEach((person) => {
      if (!villageStats[person.village]) {
        villageStats[person.village] = {
          village: person.village,
          totalPeople: 0,
          totalReceived: 0,
          totalReturned: 0,
        };
      }
      villageStats[person.village].totalPeople += 1;
      villageStats[person.village].totalReceived += person.totalReceived;
      villageStats[person.village].totalReturned += person.totalReturned;
    });

    const villageArray = Object.values(villageStats).sort(
      (a, b) => b.totalReceived - a.totalReceived
    );

    res.json({ villages: villageArray });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const people = await Person.find({ createdBy: req.user.id });
    const events = await Event.find({ createdBy: req.user.id }).sort({ eventDate: -1 });
    const entries = await EventEntry.find({ createdBy: req.user.id }).populate('personId', 'name').populate('eventId', 'eventName');
    const ledgerEntries = await PersonalLedger.find({ createdBy: req.user.id }).populate('personId', 'name');

    const totalReceived = people.reduce((sum, p) => sum + p.totalReceived, 0);
    const totalReturned = people.reduce((sum, p) => sum + p.totalReturned, 0);
    const needToReturn = people.filter((p) => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
    const needToReceive = people
      .filter((p) => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);

    // Monthly stats
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const monthCollection = entries
      .filter((e) => e.createdAt >= monthStart && e.createdAt <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const yearStart = new Date(currentYear, 0, 1);
    const yearCollection = entries
      .filter((e) => e.createdAt >= yearStart)
      .reduce((sum, e) => sum + e.amount, 0);

    // Compute Active Events (Last 3)
    const activeEvents = events.slice(0, 3).map(event => {
      const eventEntries = entries.filter(e => e.eventId?._id.toString() === event._id.toString());
      const totalCol = eventEntries.reduce((sum, e) => sum + e.amount, 0);
      return {
        _id: event._id,
        eventName: event.eventName,
        eventDate: event.eventDate,
        totalEntries: eventEntries.length,
        currentBalance: totalCol,
        lastTransactionDate: eventEntries.length > 0 ? Math.max(...eventEntries.map(e => e.createdAt.getTime())) : event.createdAt
      };
    });

    // Compute Insights
    let mostActiveEvent = null;
    let highestCollectionEvent = null;
    let highestReturnEvent = null; // We can base this on ledgerEntries if we want, or skip it

    if (events.length > 0) {
      const eventStats = events.map(event => {
        const eventEntries = entries.filter(e => e.eventId?._id.toString() === event._id.toString());
        return {
          name: event.eventName,
          entries: eventEntries.length,
          collection: eventEntries.reduce((sum, e) => sum + e.amount, 0)
        };
      });

      if (eventStats.length > 0) {
        mostActiveEvent = eventStats.reduce((prev, current) => (prev.entries > current.entries) ? prev : current);
        highestCollectionEvent = eventStats.reduce((prev, current) => (prev.collection > current.collection) ? prev : current);
      }
    }

    // Recent activities
    const allActivities = [];
    
    // 1. Entries
    entries.forEach((e) => {
      allActivities.push({
        type: 'entry',
        personName: e.personId?.name || 'Unknown Person',
        eventName: e.eventId?.eventName || 'Unknown Event',
        description: `Received amount from event`,
        date: e.createdAt,
        amount: e.amount,
      });
    });

    // 2. Ledger Returns
    ledgerEntries.forEach((e) => {
      allActivities.push({
        type: 'ledger',
        personName: e.personId?.name || 'Unknown Person',
        description: `Returned amount for event`,
        date: e.createdAt,
        amount: e.amount,
      });
    });

    // 3. Event Creations
    events.forEach((e) => {
      allActivities.push({
        type: 'event_created',
        eventName: e.eventName,
        description: `New Event Created`,
        date: e.createdAt,
        amount: null
      });
    });

    const recentActivities = allActivities
      .sort((a, b) => b.date - a.date)
      .slice(0, 15);

    res.json({
      stats: {
        totalReceived,
        totalReturned,
        needToReturn,
        needToReceive,
        totalPeople: people.length,
        totalEvents: events.length,
        monthCollection,
        yearCollection,
      },
      activeEvents,
      insights: {
        mostActiveEvent,
        highestCollectionEvent
      },
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
