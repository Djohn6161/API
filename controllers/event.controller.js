const EventModel = require('../models/event.model');
const {
    Query,  
    removeDuplicates,
    deleteProperty} = require('../models/event.model')
const getEvents = (req, res) => {
    const sql = `SELECT e.id as eid, e.name as ename, e.slug as eslug, 
    e.date as edate, org.id orgid, org.name as orgname, org.slug as orgslug 
    FROM events as e, organizers as org where org.id = e.organizer_id`;
    Query(sql, (err, events) =>{
        if(err){
            res.send(err);
            console.log('There is an error in ', __dirname);
        }else{
            console.log('All Events: ', events);
            const event = events.map((event) => {
                return {
                        id: event.eid,
                        name: event.ename,
                        slug: event.eslug,
                        date: event.edate,
                        organizer: {
                            id: event.orgid,
                            name: event.orgname,
                            slug: event.orgslug
                        }
                }
            })
            res.status(200).json({'events': event});
        }
    })
};
const getEventBySlug = (req, res)=>{
    const {EveSlug, OrgSlug} = req.params;
    console.log(`get Event by event Slug ${EveSlug} and organizers slug ${OrgSlug}`);
    const sql = `SELECT events.id as event_id, events.name as event_name, events.slug as event_slug, events.date as event_date,
    channels.id as channel_id, channels.name as channel_name,
    event_tickets.id as event_ticket_id, event_tickets.name as event_ticket_name, event_tickets.cost as event_ticket_cost, event_tickets.special_validity as event_ticket_special_validity,
    rooms.id as room_id, rooms.name as room_name,
    sessions.id as session_id, sessions.title as session_title, sessions.description as session_description, sessions.speaker as session_speaker, sessions.start as session_start, sessions.end as session_end, sessions.type as session_type, sessions.cost as session_cost
    FROM sessions, rooms, channels, events, organizers, event_tickets
    WHERE organizers.id = events.organizer_id  
    AND events.id = channels.event_id 
    AND events.id = event_tickets.event_id
    AND channels.id = rooms.channel_id 
    AND rooms.id = sessions.room_id 
    AND events.slug = '${EveSlug}' 
    AND organizers.slug = '${OrgSlug}' ;`;

    Query(sql, (err, events) =>{
        if(err){
            res.send(err);
            console.log('There is an error in ', __dirname);
        }else{
            // console.log('All Events: ', events);
            //sessions 
            let sessions = events.map((event) => {
                return {
                    "room_id" : event.room_id,
                    "id": event.session_id, 
                    "title": event.session_title, 
                    "description": event.session_description, 
                    "speaker": event.session_speaker, 
                    "start": event.session_start,
                    "end": event.session_end,
                    "type": event.session_type,
                    "cost": event.session_cost
                        
                }
            });
            sessions = removeDuplicates(sessions);

            //rooms
            let rooms = events.map((event) => {
                session = [];
                // console.log(`room id ${event.room_id} and session_room_id ${sessions.room_id}`);
                for(let i=0; i<sessions.length; i++){
                    if(event.room_id === sessions[i].room_id){
                        session.push(sessions[i])
                    }
                }
                deleteProperty(session, 'room_id');
                return {
                    "channel_id": event.channel_id,
                    "id": event.room_id, 
                    "name": event.room_name,
                    "session": session
                }
            });
            rooms = removeDuplicates(rooms);

            //channels
            let channels = events.map((event) => {
                room = [];
                for(let i=0; i<rooms.length; i++){
                    if(event.channel_id === rooms[i].channel_id){
                        room.push(rooms[i])
                    }
                }
                deleteProperty(room, 'channel_id');
                return {
                    "event_id": event.event_id,
                    "id": event.channel_id, 
                    "name": event.channel_name,
                    "rooms": room,
                }
            })
            channels = removeDuplicates(channels);
            deleteProperty(channels,'event_id');
            //event_ticket
            const event_tickets = events.map((event) => {
                return {
                    "id": event.event_ticket_id,
                    "name": event.event_ticket_name,
                    "cost": event.event_ticket_cost,
                    "special_validity": event.event_ticket_special_validity
                }
            })
            const F_event_tickets = removeDuplicates(event_tickets);
            
            const single_event = {
                "id": events[0].event_id,
                "name": events[0].event_name,
                "slug": events[0].event_slug,
                "date": events[0].event_date,
                "channels": channels,
                "event_tickets": F_event_tickets
            }
            res.status(200).json(single_event);
        }
    })
}

module.exports = {
    getEvents,
    getEventBySlug,
}