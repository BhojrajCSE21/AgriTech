const express = require('express');
const router = express.Router();
const Field = require('../models/Field');

router.get('/', async (req, res) => {
  try {
    const fields = await Field.find().sort({ createdAt: -1 });
    res.json(fields);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/', async (req, res) => {
  try {
    const newField = new Field(req.body);
    const field = await newField.save();
    res.json(field);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ msg: 'Field not found' });
    res.json(field);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!field) return res.status(404).json({ msg: 'Field not found' });
    res.json(field);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const field = await Field.findByIdAndDelete(req.params.id);
    if (!field) return res.status(404).json({ msg: 'Field not found' });
    res.json({ msg: 'Field deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;