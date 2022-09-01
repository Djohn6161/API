const e = require('express');
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
    const getEvents = `SELECT * FROM events, organizers 
    where organizers.id = events.organizer_id
    and organizers.slug = '${OrgSlug}'`;
    const sql = `SELECT events.id as event_id, events.name as event_name, events.slug as event_slug, events.date as event_date,
    channels.id as channel_id, channels.name as channel_name,
    event_tickets.id as event_ticket_id, event_tickets.name as event_ticket_name, event_tickets.cost as event_ticket_cost, event_tickets.special_validity as event_ticket_special_validity,
    rooms.id as room_id, rooms.name as room_name,
    sessions.id as session_id, sessions.title as session_title, sessions.description as session_description, sessions.speaker as session_speaker, sessions.start as session_start, sessions.end as session_end, sessions.type as session_type, sessions.cost as session_cost
    FROM sessions, rooms, channels, events, event_tickets, organizers
    WHERE organizers.id = events.organizer_id
    AND events.id = channels.event_id 
    AND events.id = event_tickets.event_id
    AND channels.id = rooms.channel_id 
    AND rooms.id = sessions.room_id 
    AND events.slug = '${EveSlug}'
    AND organizers.slug = '${OrgSlug}'`;
    Query(getEvents, (err, eventOrg) => {
        if(err){
            res.send(err);
            console.log('There is an error in ', __dirname);
        }else if(eventOrg.length === 0 ){
                console.log("Organizer not found");
                const message = {
                    "message": "organizer not found"
                }
                res.status(404).json(message);
        } else{
            Query(sql, (err, events) =>{
                if(err){
                    res.send(err);
                    console.log('There is an error in ', __dirname);
                }else if(events.length === 0 ){
                    console.log("Event not found");
                    const message = {
                        "message": "Event not found"
                    }
                    res.status(404).json(message);
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
    })
    
}
const attendeelogin = (req, res) => {
    const { lastname, registrationcode } = req.body;
    console.log(`The lastname is ${lastname} and registration code is ${registrationcode}`);
    const updateAttendee = `UPDATE attendees SET login_token = 'AUTHORIZATION_TOKEN' WHERE registration_code = '${registrationcode}'`;
    const selectAttendee = `SELECT * FROM attendees WHERE lastname = '${lastname}' AND attendees.registration_code = '${registrationcode}'`;
    // res.send(`The lastname is ${lastname} and registration code is ${registrationcode}`);
    Query(updateAttendee, (err, updateAttendee) => {
        if(err){
            console.log('Error from inserting login_token in', __dirname);
            console.log('The Error is ', err);
            res.send(err);
        }else{
            console.log('RESULT of the update: ', updateAttendee.message);
        }
    })
    Query(selectAttendee, (err, attendees) =>{
        if(err){
            res.send(err);
            console.log('There is an error in ', __dirname);
        }else if(attendees.length === 0){
            console.log("Invalid login");
                const message = {
                    "message": "Invalid login"
                }
                res.status(401).send(message)
        }else{
            const attendee = attendees.map((attendee) => {
                return {
                    firstname: attendee.firstname,
                    lastname: attendee.lastname,
                    username: attendee.username,
                    email: attendee.email,
                    token: attendee.login_token
                }
            })
            res.status(200).json(attendee);
            console.log('Login succesful');
        }
    })
}
const attendeelogout = (req, res) => {
    const {token} = req.query;
    console.log(`The token is ${token}`);
    const updateAttendee = `UPDATE attendees SET login_token = '' WHERE login_token = '${token}'`;
    const selectAttendee = `SELECT * FROM `
    // res.send(`The token is ${token}`);
    Query(updateAttendee, (err, status) => {
        if(err){
            console.log('Error from inserting login_token in', __dirname);
            console.log('The Error is ', err);
            res.send(err)
        }else if(status.affectedRows !== 0){
            console.log("Log out Success");
            const message = {
                'message': 'Logout Success'
            }
            res.status(200).json(message)
        }
        else{
            console.log('Log out Failed');
            console.log('RESULT of the update: ', status);
            const message = {
                'message': 'Invalid Token'
            }
            res.status(401).send(message);
        }
    })
}
const eventRegistration = (req, res) => {
    //The requests from clients
    const {token} = req.query;
    const {ticket_id, session_id, } = req.body;
    const {OrgSlug, EveSlug} = req.params
    const date = new Date();
    const current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+ date.getSeconds();

    //test if it contain
    console.log(`These are the params for organizer slug ${OrgSlug} and event${EveSlug}`);
    console.log(`These are the request in Body: ticket_id=${ticket_id} and session_id= ${session_id}`);
    console.log(`This is the Authprization token: ${token}`);

    //Queries
    const getEvent = `SELECT * FROM events, organizers
                    WHERE events.organizer_id = organizers.id
                    AND events.slug = '${EveSlug}' AND organizers.slug = '${OrgSlug}'`;
    const checkToken = `SELECT * FROM attendees WHERE login_token = '${token}'`;
    const checkEventRegistration = `SELECT events.name as event_name, CONCAT(attendees.lastname, ', ', attendees.firstname) as attendee_fullname
                    FROM attendees, registrations, event_tickets, events
                    WHERE attendees.id = registrations.id 
                    AND registrations.ticket_id = event_tickets.id
                    AND event_tickets.event_id = events.id 
                    AND events.slug = 'wsc-2019'
                    AND attendees.login_token = 'AUTHORIZATION_TOKEN'`;
    const stirngValidity = [];
    const jsonValidity = [];
    let filteredValidity;
    let flag = false;
    console.log(ticket_id);
    for (let i = 0; i < ticket_id.length; i++) {
        if (flag===true) break;
        const checkValidity = `SELECT special_validity FROM event_tickets WHERE id = '${ticket_id[0]}'`;
        Query(checkValidity, (error, validities)=> {
            if(error){
                console.log(error);
                res.send(error);
                flag=true;
                console.log("true");
            } else {
                // variable containers
                
                console.log("false ", validities);
                // convets the special validities array of objects into an array
                validities.map(validity => {
                    if(validity.special_validity!==null){
                        stirngValidity.push(validity.special_validity)
                    }
                })

                // converts the special validities that are string into json
                stirngValidity.map(validity => {
                    jsonValidity.push(JSON.parse(validity))
                })

                //filter the JSON file with type that are date
                filteredValidity = jsonValidity.filter(validity => {return(validity.type === "date")})
                res.status(401).json(filteredValidity);
                // if(current_date < filteredValidity[0].date){
                //     res.status(401).JSON({"message": "Ticket is no longer available"});
                // }
            }
        })
    }
    
    // res.send(`this is the params ${EveSlug}`)
    // const 
        // res.send(`this is the params ${EveSlug}`)
}

module.exports = {
    getEvents,
    getEventBySlug,
    attendeelogin,
    attendeelogout,
    eventRegistration
}