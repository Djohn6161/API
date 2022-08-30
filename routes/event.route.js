const express = require('express');
const router = express.Router();

const {
    getEvents,
    getEventBySlug,
} = require('../controllers/event.controller');

router.get('/events',getEvents);
router.get('/organizers/:OrgSlug/events/:EveSlug',getEventBySlug);

module.exports = router;