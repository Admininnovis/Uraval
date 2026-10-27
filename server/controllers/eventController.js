import Event from '../models/Event.js';
import EventEntry from '../models/EventEntry.js';
import Person from '../models/Person.js';

export const createEvent = async (req, res) => {
  return res.status(402).json({
    error: 'BOOKLET_PAYMENT_REQUIRED',
    message: 'Booklet creation requires ₹150 payment (incl. GST). Please initiate via /api/billing/booklet-purchase.',
  });
};

export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventType } = req.query;
    let query = {
      createdBy: req.user.id,
      $or: [
        { isPaid: true, status: 'active' },
        { isLegacy: true },
      ],
    };

    if (eventType) {
      query.eventType = eventType;
    }

    const events = await Event.find(query)
      .sort({ eventDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const entries = await EventEntry.find({ eventId: event._id });
        const totalCol = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const obj = event.toObject();
        obj.totalEntries = entries.length;
        obj.entryCount = entries.length;
        obj.totalCollection = totalCol;
        return obj;
      })
    );

    res.json({
      events: eventsWithCount,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isLegacy && (!event.isPaid || event.status !== 'active')) {
      return res.status(403).json({
        error: 'BOOKLET_PAYMENT_REQUIRED',
        message: 'Booklet creation payment is pending. Payment of ₹150 is required to open this booklet.',
        isPaid: false,
      });
    }

    const entries = await EventEntry.find({ eventId: event._id })
      .populate('personId', 'name village notes editHistory')
      .sort({ createdAt: -1 });

    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    const eventObj = event.toObject();
    eventObj.totalEntries = entries.length;
    eventObj.entryCount = entries.length;
    eventObj.totalCollection = total;

    res.json({
      event: eventObj,
      entries,
      stats: {
        totalEntries: entries.length,
        totalCollection: total,
        highestContribution: entries.length > 0 ? Math.max(...entries.map((e) => e.amount)) : 0,
        averageContribution: entries.length > 0 ? Math.round(total / entries.length) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { eventName, eventType, eventDate, location, description } = req.body;
    if (eventName) event.eventName = eventName.trim().toUpperCase();
    if (eventType) event.eventType = eventType;
    if (eventDate) event.eventDate = eventDate;
    if (location !== undefined) event.location = location ? location.trim().toUpperCase() : '';
    if (description !== undefined) event.description = description;

    await event.save();
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete related entries
    await EventEntry.deleteMany({ eventId: event._id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addEventEntry = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { personId, amount, notes } = req.body;

    const event = await Event.findOne({
      _id: eventId,
      createdBy: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isLegacy && (!event.isPaid || event.status !== 'active')) {
      return res.status(403).json({
        error: 'BOOKLET_PAYMENT_REQUIRED',
        message: 'Booklet creation payment is pending. Payment of ₹150 is required before adding entries.',
      });
    }

    const person = await Person.findOne({
      _id: personId,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const existingEntry = await EventEntry.findOne({
      eventId,
      personId,
      createdBy: req.user.id,
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'This person has already contributed to this event.' });
    }

    let entry = new EventEntry({
      personId,
      eventId,
      amount,
      notes,
      createdBy: req.user.id,
    });

    await entry.save();

    // Update person's total received
    person.totalReceived += amount;
    await person.save();

    // Update event's total collection
    event.totalCollection += amount;
    await event.save();

    res.status(201).json({ message: 'Entry added successfully', entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEventEntry = async (req, res) => {
  try {
    const { eventId, entryId } = req.params;
    const { amount, notes } = req.body;

    const entry = await EventEntry.findOne({
      _id: entryId,
      eventId,
      createdBy: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const oldAmount = entry.amount;
    const oldNotes = entry.notes;

    if (amount && Number(amount) !== oldAmount || notes !== undefined && notes !== oldNotes) {
      entry.editHistory.push({
        amount: oldAmount,
        notes: oldNotes,
        updatedAt: new Date()
      });
    }

    entry.amount = amount !== undefined ? Number(amount) : entry.amount;
    entry.notes = notes !== undefined ? notes : entry.notes;

    await entry.save();

    // Update person's total received if amount changed
    if (entry.amount !== oldAmount) {
      const person = await Person.findById(entry.personId);
      person.totalReceived = person.totalReceived - oldAmount + entry.amount;
      await person.save();

      // Update event's total collection
      const eventObj = await Event.findById(eventId);
      eventObj.totalCollection = eventObj.totalCollection - oldAmount + entry.amount;
      await eventObj.save();
    }

    res.json({ message: 'Event entry updated successfully', entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

