const EventModel = require('../models/event.model');
const Query = require('../models/event.model')
const getEvents = (req, res) => {
    //console.log('here are the event list');
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

    const organizer_sql = `SELECT events.* FROM Events, organizers WHERE organizers.id = events.organizer_id and organizers.slug = '${OrgSlug}'`;
    const event_sql = `SELECT * FROM events WHERE events.slug = '${EveSlug}'`;
    const channel_sql = `SELECT channels.id, channels.name FROM channels WHERE channels.event_id = ?`;
    const room_sql = `SELECT rooms.id, rooms.name FROM rooms WHERE rooms.channel_id = ?`;
    const session_sql = `SELECT * FROM sessions WHERE sessions.room_id = ?`;
    const event_ticket_sql = `SELECT * FROM event_tickets WHERE event_tickets.event_id = ?`;

    
    // const sql = `SELECT events.id as event_id, events.name as event_name, events.slug as event_slug, events.date as event_date,
    // channels.id as channel_id, channels.name as channel_name,
    // rooms.id as room_id, rooms.name as room_name,
    // sessions.id as session_id, sessions.title as session_title, sessions.description as session_description, sessions.speaker as session_speaker, sessions.start as session_start, sessions.end as session_end, sessions.type as session_type, sessions.cost as session_cost
    // FROM sessions, rooms, channels, events, organizers 
    // WHERE organizers.id = events.organizer_id AND 
    // events.id = channels.event_id 
    // AND channels.id = rooms.channel_id 
    // AND rooms.id = sessions.room_id 
    // AND events.slug = '${EveSlug}' 
    // AND organizers.slug = '${OrgSlug}' ;`;
    Query(organizer_sql, (err, result)=>{
        if(err){
            res.send(err);
            console.log('Error while organizers by organizer slug', err);
        }else{
            console.log("Organizer not found");
            res.status(200).json({"data":result,"message": "organizer not found"});
        }
    })
}

module.exports = {
    getEvents,
    getEventBySlug,
}

// const event = {
//     "id": result[0].event_id,
//     "name": result[0].event_name,
//     "slug": result[0].event_slug,
//     "date": result[0].event_date,
//     "channels": "",
//     "tickets": ""
// }
// const channels = []
// const sessions = []
// const rooms = []
// result.map(event => {
//     const {session_id, session_title, session_description, session_speaker, session_end, session_type, session_start} = event
//     sessions.push({id: session_id, title: session_title, description: session_description, session_speaker, session_end, session_type, session_start});
// })
// rooms.sessions = sessions;
// channels.rooms = rooms;
// event.channels = channels;
// if(event.message !== undefined){
//     console.log(event.message);
//     res.status(404).json(result)
// }
// else{
//     console.log('Single Event data ', event);
//     res.status(200).json(event);
// }