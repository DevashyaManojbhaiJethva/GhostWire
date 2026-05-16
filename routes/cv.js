const express = require('express');
const { client } = require('../config/redis');
const { getIO } = require('../socket/socketServer');

const router = express.Router();

router.get('/:node_id', async (req, res) => {
  try {
    const { node_id } = req.params;
    const key = `cv:scene:${node_id}`;
    const scene = await client.get(key);

    if (!scene) {
      return res.status(404).json({ error: 'CV scene not found' });
    }

    return res.json(JSON.parse(scene));
  } catch (error) {
    console.log(`❌ GET /api/cv/scene/:node_id failed: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch CV scene' });
  }
});

router.post('/:node_id', async (req, res) => {
  try {
    const { node_id } = req.params;
    const key = `cv:scene:${node_id}`;
    const scene = {
      node_id,
      ...req.body,
      received_at: new Date().toISOString()
    };

    await client.set(key, JSON.stringify(scene), { EX: 300 });

    const io = getIO();
    if (io) {
      io.emit('cv_event', scene);
      console.log(`📡 CV event emitted for node ${node_id}`);
    }

    return res.status(201).json({ status: 'stored', scene });
  } catch (error) {
    console.log(`❌ POST /api/cv/scene/:node_id failed: ${error.message}`);
    return res.status(500).json({ error: 'Failed to store CV scene' });
  }
});

module.exports = router;
