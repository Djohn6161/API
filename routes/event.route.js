const express = require('express');
const router = express.Router();

const {
    getEvents,
    getEventBySlug,
    attendeelogin,
    attendeelogout,
    eventRegistration,
    getRegistration
} = require('../controllers/event.controller');

router.get('/events',getEvents);
router.post('/login', attendeelogin);
router.post('/logout', attendeelogout);
router.get('/registration', getRegistration);
router.get('/organizers/:OrgSlug/events/:EveSlug',getEventBySlug);
router.post('/organizers/:OrgSlug/events/:EveSlug/registration', eventRegistration);


module.exports = router;