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
    let ticket_array = JSON.parse(ticket_id); // makes the content of ticket_id into a JSON
    const {OrgSlug, EveSlug} = req.params
    const date = new Date();
    const currentDateAndTime = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate()+" "+date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    const current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();

    let message;
    let condition;

    //test if it contain
    console.log(`These are the params for organizer slug ${OrgSlug} and event${EveSlug}`);
    console.log(`These are the request in Body: ticket_id=${ticket_id} and session_id= ${session_id}`);
    console.log(`This is the Authorization token: ${token}`);

    //Queries
    const getEvent = `SELECT * FROM events, organizers
                    WHERE events.organizer_id = organizers.id
                    AND events.slug = '${EveSlug}' AND organizers.slug = '${OrgSlug}'`;
    const checkToken = `SELECT * FROM attendees WHERE login_token = '${token}';`;
    let checkEventRegistration = `SELECT events.name as event_name, CONCAT(attendees.lastname, ', ', attendees.firstname) as attendee_fullname, event_tickets.name
                    FROM attendees JOIN registrations ON attendees.id = registrations.attendee_id 
                    JOIN event_tickets ON registrations.ticket_id = event_tickets.id 
                    JOIN events ON event_tickets.event_id = events.id`;
    for (let i = 0; i < ticket_array.length; i++) {
        // console.log(ticket_array.length);
        if(i==0){
            condition = `
                        WHERE events.slug = '${EveSlug}'
                        AND attendees.login_token = '${token}'
                        AND event_tickets.id = '${ticket_array[i]}'`;
        }else if(i==ticket_array.length-1){
            condition = ` OR events.slug = '${EveSlug}'
                        AND attendees.login_token = '${token}'
                        AND event_tickets.id = '${ticket_array[i]}'`;
                        console.log('2');
        } else {
            condition = ` OR events.slug = '${EveSlug}'
                        AND attendees.login_token = '${token}'
                        AND event_tickets.id = '${ticket_array[i]}'`;
                        console.log('3');
        }
        checkEventRegistration = checkEventRegistration + condition;
    }
    checkEventRegistration = checkEventRegistration + ';';
    //* makes a query that has the variables in the array of ticket id
    let checkValidity = 'SELECT * FROM EVENT_TICKETS'
    for (let i = 0; i < ticket_array.length; i++) {
        if(i==0){
            condition = ` WHERE event_tickets.id = ${ticket_array[i]}`
        } else {
            condition = ` OR event_tickets.id = ${ticket_array[i]}`
        }
        checkValidity = checkValidity + condition;
    }
    // console.log(checkEventRegistration);
    //*Check if user is not log in
    if(!token){
        message = {"message": "User not logged in"}
        console.log(message);
        res.status(401).json(message);
    }else {
        Query(checkToken +'\n'+ checkEventRegistration +'\n'+ checkValidity, (error, registration) => {
            if(error){
                console.log(error);
                res.json(error);
            }else {
                const attendee = registration[0];
                const events = registration[1];
                const Validity = registration[2];
    
                //* Check if Token is valid
                if(attendee.length===0){
                    console.log('attendee is', attendee);
                    message = {"message": "User not logged in"}
                    console.log(message);
                    res.status(401).json(message);
                }else{
                    const attendeeID = attendee[0].id;
                    if(events.length!==0){
                        // console.log('events are ', events);
                        message = {"message": "User Already registered"}
                        console.log(message);
                        res.status(401).json(message);
                    }else{
                        const jsonValidity = [];
                        let filteredValidity;    
                        Validity.map(validity => {
                            if(validity.special_validity!==null){
                                jsonValidity.push(JSON.parse(validity.special_validity))
                            }
                        })
                        filteredValidity = jsonValidity.filter(validity => {return(validity.type === "date")})
                        filteredValidity.map(validity => {
                            //! if you want to check if inserting data is possible you should invert the next condition
                            //! because it will always be true because the events are long time ago
                            if(current_date<validity.date){
                                message = {
                                    "message": "Ticket is no longer available"
                                };
                            }
                        })
                        if(message){
                            res.status(401).json(message)
                        }else{
                            let insertRegistration = `INSERT INTO registrations(attendee_id, ticket_id, registration_time)`;
                            for (let i = 0; i < ticket_array.length; i++) {
                                if(i==0){
                                    condition = ` VALUES ('${attendeeID}', '${ticket_array[i]}', '${currentDateAndTime}')`
                                } else {
                                    condition = `, ('${attendeeID}', '${ticket_array[i]}', '${currentDateAndTime}')`
                                }
                                insertRegistration = insertRegistration + condition;
                            }    
                            insertRegistration = insertRegistration + ';';
                            let insertSessionRegistration = ` INSERT INTO session_registrations(registration_id, session_id) 
                            SELECT registrations.id, sessions.id FROM registrations, sessions WHERE registrations.registration_time = '${currentDateAndTime}' AND sessions.id = ${session_id}`;
                            console.log(insertRegistration + insertSessionRegistration);
                            Query(insertRegistration + insertSessionRegistration, (error, status)=> {
                                if(error){
                                    console.log(error);
                                    res.json(error)
                                }else {
                                    message = {
                                        "message": "Registration Successful" 
                                    };

                                    res.status(200).json(message)
                                    console.log(message);
                                }
                            })
                        }
                    }
                }
            }
        })
    }
}
const getRegistration = (req, res) => {
    const {token} = req.query;
    const query = `SELECT events.id as event_id, events.name as event_name, events.slug events_slug, events.date as event_date, organizers.id as organizer_id, organizers.name as organizer_name, organizers.slug as organizer_slug, sessions.id as session_id
    FROM events JOIN organizers on organizers.id = events.organizer_id 
    JOIN event_tickets on events.id = event_tickets.event_id
    JOIN registrations on event_tickets.id = registrations.ticket_id
    JOIN attendees on registrations.attendee_id = attendees.id
    JOIN session_registrations on registrations.id = session_registrations.registration_id
    JOIN sessions on session_registrations.session_id = sessions.id
    WHERE attendees.login_token = '${token}'`
    console.log(token);
    Query(query, (error, registrations) => {
        if(error){
            console.log(error);
            res.send(error);
        }else {
            // console.log(query);
            if(registrations.length === 0){
                let message = {
                    'message': 'user not logged in'
                }
                console.log('the contents of registration is ', registrations);
                res.status(401).json(message);
            }else{
                let sessions = [];
                registrations.map(registration => {
                    sessions.push(registration.session_id)
                    sessions.push(registration.organizer_id)
                })
                const organizers = registrations.map(registration => {
                    let session = [];
                    for(let i = 0; i<sessions.length; i++){
                        if(i % 2 !== 0){
                            if(registration.organizer_id === sessions[i]){
                                session.push(sessions[i-1])
                            }
                        }
                    }
                    return {
                        event_id: registration.event_id,
                        id: registration.organizer_id,
                        name: registration.organizer_name,
                        session_ids: session
                    }
                })
                // const F_organizers = removeDuplicates(organizers)
                // console.log("organizers are ", organizers);
                const events = registrations.map(registration => {
                    let organizer;
                    for(let i=0;i<organizers.length;i++){
                        if(organizers[i].event_id == registration.event_id){
                            organizer = organizers[i];
                        }
                    }
                    delete organizer.event_id;
                    console.log("organizers are ", organizer);
                    return{
                        id: registration.event_id,
                        name: registration.event_name,
                        slug: registration.event_slug,
                        date: registration.events_date,
                        organizer: organizer
                    }
                })
                
                const F_events = removeDuplicates(events);
                // const organizers = registration.map
                // console.log(F_events);
                res.status(200).json(F_events);
            }
            
        }
    })
}


module.exports = {
    getEvents,
    getEventBySlug,
    attendeelogin,
    attendeelogout,
    eventRegistration,
    getRegistration
}