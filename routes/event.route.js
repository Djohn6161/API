const express = require('express');
const router = express.Router();

const {
    getEvents,
    getEventBySlug,
    attendeelogin,
    attendeelogout,
    eventRegistration
} = require('../controllers/event.controller');

router.get('/events',getEvents);
router.get('/organizers/:OrgSlug/events/:EveSlug',getEventBySlug);
router.post('/login', attendeelogin);
router.post('/logout', attendeelogout);
router.post('/organizers/:OrgSlug/events/:EveSlug/registration', eventRegistration);

module.exports = router;