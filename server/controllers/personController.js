import Person from '../models/Person.js';
import EventEntry from '../models/EventEntry.js';
import PersonalLedger from '../models/PersonalLedger.js';

export const createPerson = async (req, res) => {
  try {
    const { name, village, notes } = req.body;

    // Check if person already exists (auto-interconnect entries for same person)
    const trimmedName = name.trim().toUpperCase();
    const trimmedVillage = village ? village.trim().toUpperCase() : '';
    const trimmedNotes = notes ? notes.trim() : '';

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let query = {
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      village: { $regex: new RegExp(`^${escapeRegex(trimmedVillage)}$`, 'i') },
      createdBy: req.user.id
    };

    if (trimmedNotes) {
      query.notes = { $regex: new RegExp(`^${escapeRegex(trimmedNotes)}$`, 'i') };
    } else {
      query.$or = [
        { notes: { $exists: false } },
        { notes: '' },
        { notes: null }
      ];
    }

    let existingPerson = await Person.findOne(query);

    if (existingPerson) {
      if (req.body.autoLink || req.query.autoLink) {
        return res.status(200).json({ message: 'Person retrieved', person: existingPerson });
      } else {
        return res.status(409).json({ message: 'A person with this exact Name, Village and Note already exists.' });
      }
    }

    let person = new Person({
      name: trimmedName,
      village: trimmedVillage,
      notes,
      createdBy: req.user.id,
    });

    await person.save();
    res.status(201).json({ message: 'Person added successfully', person });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPeople = async (req, res) => {
  try {
    const { search, village, page = 1, limit = 10 } = req.query;
    let query = { createdBy: req.user.id };

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { village: { $regex: escaped, $options: 'i' } },
        { notes: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (village && village !== 'All') {
      query.village = { $regex: `^${escapeRegex(village.trim())}$`, $options: 'i' };
    }

    const people = await Person.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Person.countDocuments(query);

    res.json({
      people,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPersonById = async (req, res) => {
  try {
    const person = await Person.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const eventEntries = await EventEntry.find({ personId: person._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    const personalLedgers = await PersonalLedger.find({ personId: person._id }).sort({
      date: -1,
    });

    res.json({
      person,
      eventEntries,
      personalLedgers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePerson = async (req, res) => {
  try {
    let person = await Person.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const { name, village, notes } = req.body;
    
    const uppercaseName = name ? name.trim().toUpperCase() : undefined;
    const uppercaseVillage = village !== undefined ? (village ? village.trim().toUpperCase() : '') : undefined;

    if (uppercaseName && uppercaseName !== person.name || uppercaseVillage !== undefined && uppercaseVillage !== person.village) {
      person.editHistory.push({
        name: person.name,
        village: person.village,
        notes: person.notes,
        updatedAt: new Date()
      });
    }

    if (uppercaseName) person.name = uppercaseName;
    if (uppercaseVillage !== undefined) person.village = uppercaseVillage;
    if (notes !== undefined) person.notes = notes;

    await person.save();
    res.json({ message: 'Person updated successfully', person });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePerson = async (req, res) => {
  try {
    const person = await Person.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Delete related entries
    await EventEntry.deleteMany({ personId: person._id });
    await PersonalLedger.deleteMany({ personId: person._id });

    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchPeople = async (req, res) => {
  try {
    const { query } = req.query;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escaped = escapeRegex(query.trim());

    const results = await Person.find(
      {
        createdBy: req.user.id,
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { village: { $regex: escaped, $options: 'i' } },
          { notes: { $regex: escaped, $options: 'i' } },
        ],
      },
      { name: 1, village: 1, notes: 1, totalReceived: 1, totalReturned: 1 }
    ).limit(10);

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const mergePeople = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId || sourceId === targetId) {
      return res.status(400).json({ message: 'Invalid source or target ID' });
    }

    const sourcePerson = await Person.findOne({ _id: sourceId, createdBy: req.user.id });
    const targetPerson = await Person.findOne({ _id: targetId, createdBy: req.user.id });

    if (!sourcePerson || !targetPerson) {
      return res.status(404).json({ message: 'One or both persons not found' });
    }

    // 1. Reassign Event Entries
    await EventEntry.updateMany({ personId: sourceId }, { $set: { personId: targetId } });

    // 2. Reassign Personal Ledger Entries
    await PersonalLedger.updateMany({ personId: sourceId }, { $set: { personId: targetId } });

    // 3. Aggregate Balances
    targetPerson.totalReceived += sourcePerson.totalReceived || 0;
    targetPerson.totalReturned += sourcePerson.totalReturned || 0;

    // Optional: merge notes or keep original
    if (sourcePerson.notes && !targetPerson.notes) {
      targetPerson.notes = sourcePerson.notes;
    } else if (sourcePerson.notes && targetPerson.notes) {
      targetPerson.notes += ` | Merged Note: ${sourcePerson.notes}`;
    }

    await targetPerson.save();

    // 4. Delete the source person
    await Person.deleteOne({ _id: sourceId });

    res.json({ message: 'People merged successfully', person: targetPerson });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const splitPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, source } = req.body;

    if (!transactionId || !source) {
      return res.status(400).json({ message: 'Transaction ID and source are required' });
    }

    const oldPerson = await Person.findOne({ _id: id, createdBy: req.user.id });
    if (!oldPerson) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const newVillage = oldPerson.village ? `${oldPerson.village} (splited)` : '(splited)';

    let newPerson = await Person.findOne({
      name: oldPerson.name,
      village: { $regex: new RegExp(`^${newVillage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      createdBy: req.user.id
    });

    if (!newPerson) {
      newPerson = new Person({
        name: oldPerson.name,
        village: newVillage,
        notes: oldPerson.notes,
        createdBy: req.user.id,
      });
      await newPerson.save();
    }

    let amount = 0;

    if (source === 'event') {
      const entry = await EventEntry.findOne({ _id: transactionId, personId: id });
      if (!entry) return res.status(404).json({ message: 'Event entry not found' });

      amount = entry.amount;
      entry.personId = newPerson._id;
      await entry.save();

      oldPerson.totalReceived = (oldPerson.totalReceived || 0) - amount;
      newPerson.totalReceived = (newPerson.totalReceived || 0) + amount;
    } else if (source === 'personal') {
      const ledger = await PersonalLedger.findOne({ _id: transactionId, personId: id });
      if (!ledger) return res.status(404).json({ message: 'Personal ledger entry not found' });

      amount = ledger.amount;
      ledger.personId = newPerson._id;
      await ledger.save();

      oldPerson.totalReturned = (oldPerson.totalReturned || 0) - amount;
      newPerson.totalReturned = (newPerson.totalReturned || 0) + amount;
    } else {
      return res.status(400).json({ message: 'Invalid source' });
    }

    if (oldPerson.totalReceived < 0) oldPerson.totalReceived = 0;
    if (oldPerson.totalReturned < 0) oldPerson.totalReturned = 0;

    await oldPerson.save();
    await newPerson.save();

    res.json({ message: 'Transaction separated successfully', newPersonId: newPerson._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
