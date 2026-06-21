import PersonalLedger from '../models/PersonalLedger.js';
import Person from '../models/Person.js';

export const createLedgerEntry = async (req, res) => {
  try {
    const { personId, eventName, amount, date, notes } = req.body;

    const person = await Person.findOne({
      _id: personId,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    let entry = new PersonalLedger({
      personId,
      eventName,
      amount,
      date,
      notes,
      createdBy: req.user.id,
    });

    await entry.save();

    // Update person's total returned
    person.totalReturned += amount;
    await person.save();

    res.status(201).json({ message: 'Ledger entry created successfully', entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLedgerEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, personId } = req.query;
    let query = { createdBy: req.user.id };

    if (personId) {
      query.personId = personId;
    }

    const entries = await PersonalLedger.find(query)
      .populate('personId', 'name village mobile')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PersonalLedger.countDocuments(query);

    res.json({
      entries,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPersonLedger = async (req, res) => {
  try {
    const { personId } = req.params;

    const person = await Person.findOne({
      _id: personId,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const entries = await PersonalLedger.find({ personId }).sort({ date: -1 });

    const monthlyStats = {};
    entries.forEach((entry) => {
      const monthKey = new Date(entry.date).toISOString().substring(0, 7);
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + entry.amount;
    });

    res.json({
      person,
      entries,
      totalReturned: entries.reduce((sum, entry) => sum + entry.amount, 0),
      monthlyStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLedgerEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { eventName, amount, date, notes } = req.body;

    const entry = await PersonalLedger.findOne({
      _id: entryId,
      createdBy: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const oldAmount = entry.amount;
    const oldEventName = entry.eventName;
    const oldDate = entry.date;
    const oldNotes = entry.notes;

    if (amount !== undefined && Number(amount) !== oldAmount || eventName !== undefined && eventName !== oldEventName || date !== undefined && date !== oldDate || notes !== undefined && notes !== oldNotes) {
      entry.editHistory.push({
        eventName: oldEventName,
        amount: oldAmount,
        date: oldDate,
        notes: oldNotes,
        updatedAt: new Date()
      });
    }

    entry.eventName = eventName !== undefined ? eventName : entry.eventName;
    entry.amount = amount !== undefined ? Number(amount) : entry.amount;
    entry.date = date !== undefined ? date : entry.date;
    entry.notes = notes !== undefined ? notes : entry.notes;

    await entry.save();

    // Update person's total returned if amount changed
    if (entry.amount !== oldAmount) {
      const person = await Person.findById(entry.personId);
      person.totalReturned = person.totalReturned - oldAmount + entry.amount;
      await person.save();
    }

    res.json({ message: 'Ledger entry updated successfully', entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

