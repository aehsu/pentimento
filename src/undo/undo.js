//TODO: group titles
//TODO: think about cases where methods on stack refer to things that no longer exist. Is this possible, or will the things
// be re-created before getting to that point on the stack?

var getUndoManager = function(groupTypes) {
    'use strict';

    var debug = false; // keeps track of whether debug mode is on or off

    // Displays a warning in the console if debug mode is on.
    // msg - the message to display in the warning
    // The console text will read "WARNING: " followed by msg.
    var displayDebugWarning = function(msg) {
        if (debug) {
            console.log("WARNING: " + msg);
        }
    }

    // These stacks hold objects that represent the actions that can be undone or redone.
    // The objects, referred to as action objects later on, should have the following properties:
    //      action - the function that will be called when the action object is pulled off one of the stacks
    //      title - the text that will be used in the GUI to describe this action 
    //      inGroups - an array of the hierarchy levels that the action was performed within
    //      atStartOfGroups - the groups that were started right before this action was performed
    //      atEndOfGroups - the groups that were ended right after this action was performed
    var undoStack = [];
    var redoStack = [];

    // show if the undoManager is currently undoing or redoing (or neither)
    var undoing = false;
    var redoing = false;

    var openGroups = []; // groups that have been started, but not ended
    var groupsJustStarted = []; // a group is 'just started' after it has been started and before any actions are performed

    var hierarchyOrder = []; // keeps track of the order groups are started in, to help prevent overlapping groups

    var group; // used in a few for loops. Increased scope to prevent it having to be created and destroyed many times.

    // Holds the subscribed listeners for each event type. The keys are the valid event types.
    var listeners = {
        actionPerformed: [],
        actionUndone: [],
        actionRedone: [],
        undoStatusChange: [],
        redoStatusChange: [],
        groupStarted: [],
        groupEnded: [],
        groupUndone: [],
        groupRedone: []
    };

    // Each event object has a 'type' property. The other properties an event object has are dependent on 
    // what type it is. propertiesList has each type as a key, and the values are arrays of the other properties 
    // the event object should have. The properties are from among the following:
    //      undoTitle - the title of the next action that can be undone after the event has occurred
    //      redoTitle - the title of the next action that can be redone after the event has occurred
    //      group - the name of the group that the event corresponds to. Will be null if the event pertains
    //               to the indiviual undo and redo actions.
    //      title - the title associated with the group
    //      enabled - a boolean as to whether the corresponding function (undo or redo) can be successfully 
    //                  performed after event has occurred
    //
    //TODO: may change events to poll-design, where the events don't have any other properties and the program
    // has to poll the undoManager to get more information.
    var propertiesList = {
        actionPerformed: ['undoTitle', 'redoTitle'],
        actionUndone: ['undoTitle', 'redoTitle'],
        actionRedone: ['undoTitle', 'redoTitle'],
        undoStatusChange: ['group', 'enabled'],
        redoStatusChange: ['group', 'enabled'],
        groupStarted: ['group', 'title'],
        groupEnded: ['group', 'title'],
        groupUndone: ['group', 'undoTitle', 'redoTitle'],
        groupRedone: ['group', 'undoTitle', 'redoTitle']
    }

    // Calls all the listeners subscribed to the event's type, with the event as the paramater.
    // evt - the event object. It should have a 'type' property as well as the properties listed
    // under that particular type in propertiesList.
    var fireEvent = function(evt) {  // event is a global variable in older IE browsers, so using evt instead
        if (!('type' in evt)) {
            throw noEventTypeError();
        }
        if (!(evt.type in listeners)) {
            throw invalidEventTypeError(evt.type);  
        }
        if (!(evt.type in propertiesList)) {
            displayDebugWarning(evt.type + " is not listed in propertiesList.");
        }
        else {
            // check that the event has all the required properties
            var properties = propertiesList[evt.type];
            for (var i in properties) {
                if (!(properties[i] in evt)) {
                    throw missingPropertyError(properties[i]);
                }
            }
            // note that an event can have more than the required properties
        }
        // iterate through and call each listener subscribed to this event type
        for (var i = 0; i < listeners[evt.type].length; i++) {
            listeners[evt.type][i](evt);
        }
    };

    // returns the next action object that can be undone
    var getNextUndo = function() {
        return undoStack[undoStack.length-1];
    };
    
    // returns the next action object that can be redone
    var getNextRedo = function() {
        return redoStack[redoStack.length-1];
    };
    
    // Keeps track of whether undo/redo functions are enabled.
    // The keys are group names (null for individual undo/redo), and the values are objects with
    // redoEnabled and undoEnabled boolean properties.
    var statuses = {null: {redoEnabled: false, undoEnabled: false}};   

    // populate statuses with each group
     for (var i in groupTypes) {
        statuses[groupTypes[i]] = {redoEnabled: false, undoEnabled: false};     
     }

    // Update the values in statuses based on what should currently be enabled.
    var updateStatuses = function() {
        // instead of writing two practically identical functions for undo and redo, loop over different references
        // params is an array that holds objects with these references
        var params = [{        
            stack: undoStack,   // the first object has the undo references
            getNext: getNextUndo, 
            eventType: 'undoStatusChange',
            statusType: 'undoEnabled'
        }, {
            stack: redoStack,   // the second object has the redo references
            getNext: getNextRedo, 
            eventType: 'redoStatusChange',
            statusType: 'redoEnabled'
        }];
        for (var i in params) {
            var param = params[i]; // the object with either undo or redo references
            for (var group in statuses) {
                var nextAction = null;  // will hold the next action that can be undone or redone, depending on the param object
                var index = -1; // the index of the group in the nextAction's inGroups array
                if (param.stack.length > 0) {             
                    nextAction = param.getNext();
                    if (group === 'null') {
                        index = 0; // the nextAction is eligible for individual undo/redo if it exists, so don't want index === -1
                        if (i == 1 && nextAction.atStartOfGroups.length > 0) {
                            index = -1;  // cannot individually redo actions that are at the start of a group, so set index to -1
                        }
                    }
                    else {
                        index = nextAction.inGroups.indexOf(group);  // will be -1 if the action is not part of the group
                    }
                }
                // if the enabled status is false, and the group is part of the nextAction, change the status to true
                if (!statuses[group][param.statusType]){
                    if (nextAction && index !== -1) {
                        statuses[group][param.statusType] = true;
                        fireEvent({type: param.eventType, group: group, enabled: true});
                    }
                }
                // if the enabled status is true, and there is no nextAction or the group is not part of the nextAction,
                // change the status to false
                else {
                    if (!nextAction || index === -1) {
                        statuses[group][param.statusType] = false;
                        fireEvent({type: param.eventType, group: group, enabled: false});                        
                    }
                }
            }
        }
    }

    // Holds the public functions of the undoManager, will be returned at the end of this getUndoManager() function
    // For chaining opportunities, the 'that' object is returned in any of these functions that wouldn't otherwise return anything.
    var that = {
        
        // Adds an action to the undo stack or the redo stack, depending on what mode the undoManager is in.
        // inverse: the function that would undo the actions just performed
        // title: describes the actions just performed   
        add: function(inverse, title) {
            if (undoing) { // if undoing, the action object should go on the redo stack
                redoStack.push({
                    action: inverse
                    // the title, inGroups, atStartOfGroups, and atEndOfGroups properties will be
                    // added before the end of the undo process, just not in this function.
                });
            }
            else { // if redoing or just performing an action, the action object should go on the undo stack
                undoStack.push({ 
                    action: inverse,
                    title: title,
                    inGroups: openGroups.slice(0),
                    atStartOfGroups: groupsJustStarted.slice(0),
                    atEndOfGroups: [] // will be changed later, if a group is ended right after this action
                });

                if (!redoing) {
                    redoStack = []; // can't redo anything after performing a new action

                    // Can only call updateStatuses() in this function for new actions. If the action isn't new,
                    // the action object properties aren't correctly defined yet , and updateStatuses() depends on them.
                    updateStatuses(); 

                    fireEvent({type: 'actionPerformed', undoTitle: title, redoTitle: ''});
                }

                

            }

            groupsJustStarted = []; // an action happened, so the groups are no longer 'just started'
            
            return that;
        },
        // Undoes the last action that was added to the undo stack.
        // hierMode - a boolean that is true when called from within a hierarchy-related function, should be falsy otherwise
        undo: function(hierMode) {
            if (undoStack.length === 0) {
                throw undoError();
            }

            undoing = true;

            var actionObj = undoStack.pop();
            actionObj.action(); // undoes the performed action

            // the relevant action object is now on the redo stack, but some properties haven't been defined yet.
            // they should be the same as they were before the action was undone.
            var nextRedo = getNextRedo();
            nextRedo['title'] = actionObj.title;
            nextRedo['inGroups'] = actionObj.inGroups;
            nextRedo['atStartOfGroups'] = actionObj.atStartOfGroups;
            nextRedo['atEndOfGroups'] = actionObj.atEndOfGroups;

            // If the end of a group has been individually undone, label the action before it as the end of the group.
            // This way, if the group is undone and redone, it will be exactly the way it was before it was undone.
            if (!hierMode && undoStack.length > 0) {
                var nextUndo = getNextUndo();
                for (var i in actionObj.atEndOfGroups) { // loop over all the groups that ended with the undone action
                    group = actionObj.atEndOfGroups[i];
                    if (actionObj.atStartOfGroups.indexOf(group) === -1) { // make sure it wasn't the start of the group
                        nextUndo.atEndOfGroups.push(group);
                    }
                }
            }

            undoing = false;

            // fire appropriate events

            updateStatuses();

            var title = '';
            if (undoStack.length > 0) {
                title = getNextUndo().title;
            }

            fireEvent({type: 'actionUndone', undoTitle: title, redoTitle: actionObj.title});
            
            return that;
        },
        // Redoes the last action added to the redo stack.
        // hierMode - a boolean that is true when called from within a hierarchy-related function, should be falsy otherwise
        redo: function(hierMode) {
            if (redoStack.length <= 0) {
                throw redoError();
            }
            if (!hierMode && getNextRedo().atStartOfGroups.length > 0) {
                throw redoError(); // can't individually redo the start of a group, must redo the entire group
            };

            redoing = true;

            var initialNextUndo;
            if (undoStack.length > 0) {
                initialNextUndo = getNextUndo();
            }

            var actionObj = redoStack.pop();
            actionObj.action(); // redoes the undone action

            // The relevant action object is now on the undo stack, but some properties were defined as if the action were
            // initially performed in the undoManager's current state. Instead, the properties should be the same as they were
            // before the action was redone.
            var currentNextUndo = getNextUndo();
            currentNextUndo.inGroups = actionObj.inGroups;
            currentNextUndo.atStartOfGroups = actionObj.atStartOfGroups;
            currentNextUndo.atEndOfGroups = actionObj.atEndOfGroups;         

            // fix some grouping things

            if (initialNextUndo) {
                // backwards for loop to avoid indexing problems with splicing
                for (var i = initialNextUndo.atEndOfGroups.length-1; i >= 0; i--) {
                    group = initialNextUndo.atEndOfGroups[i];
                    // if the action just redone is supposed to be in a group with initialNextUndo, 
                    // it should be made the current end of that group
                    if (currentNextUndo.inGroups.indexOf(group) !== -1 && currentNextUndo.atStartOfGroups.indexOf(group) === -1) {
                            unorderedSplice(initialNextUndo.atEndOfGroups, i, 1);
                            if (currentNextUndo.atEndOfGroups.indexOf(group) === -1) {
                                currentNextUndo.atEndOfGroups.push(group);
                            }
                    }
                }
            }

            // update the open groups to be those that the redone action is in
            openGroups = [];
            for (var i in actionObj.inGroups) {
                group = actionObj.inGroups[i];
                if (currentNextUndo.atEndOfGroups.indexOf(group) === -1) { // don't add the group if it ends at the redone action
                    openGroups.push(group);
                }
            }

            redoing = false; 

            // fire the appropriate events  

            var title = '';
            if (redoStack.length > 0) {
                title = getNextRedo().title;
            }         

            updateStatuses();

            fireEvent({type: 'actionRedone', undoTitle: actionObj.title, redoTitle: title});

            return that;
        },
        // Opens a group/hierarchy level
        // group - the name of the particular group that should be started
        startHierarchy: function(group) {
            // if the group has already been started, automatically end it and start a new one
            if (openGroups.indexOf(group) !== -1) {
                that.endHierarchy(group);
                displayDebugWarning(groupAutoClose(group));
            }

            // keep track of the fact that the group was started
            hierarchyOrder.push(group);
            openGroups.push(group);
            groupsJustStarted.push(group);

            fireEvent({type: 'groupStarted', group: group, title: ''}); //TODO: implement group titles

            return that;
        },
        // Closes a group/hiearchy level
        // group - the name of the particular group that should be ended
        endHierarchy: function(group) {
            // make sure the group has been started
            var groupOpen = false;
            if (undoStack.length > 0) {
                var nextUndo = getNextUndo();
                if (nextUndo.inGroups.indexOf(group) !== -1 && nextUndo.atEndOfGroups.indexOf(group) === -1) {
                    groupOpen = true;
                }
            }
            if (openGroups.indexOf(group) !== -1) {
                groupOpen = true;
            }
            if (!groupOpen) {
                throw groupEndError(group);
            }
            // if closing this group would result in overlapping groups, automatically close the inner groups as well.
            // (e.g. start1 start2 end1 end2 would be considered overlapping, it should be start1 start2 end2 end1 instead )
            var index = hierarchyOrder.indexOf(group);
            if (index !== -1) {
                if (index+1 < hierarchyOrder.length) {
                    that.endHierarchy(hierarchyOrder[index+1]); // will recursively end the groups from innermost to outermost
                    displayDebugWarning(groupAutoClose(group));
                }
                hierarchyOrder.pop(); //the group should be the last element by this point, can pop it instead of splicing
            }
            else {
                displayDebugWarning("The group '"+group+"' is not in hierarchyOrder, although it appears to be started.");
            }
            
            index = groupsJustStarted.indexOf(group);
            if (index === -1) {
                // keep track of the fact that the group was ended
                var i = openGroups.indexOf(group);
                unorderedSplice(openGroups, i, 1);
                getNextUndo().atEndOfGroups.push(group);
            }
            else {
                // the group was empty, so it is effectively closed without adding anything to the stack
                unorderedSplice(groupsJustStarted, index, 1);
                unorderedSplice(openGroups, index, 1);
            }          

            fireEvent({type: 'groupEnded', 'group': group, title: ''});

            return that;
        },
        // Undoes everything up to the start of the group, but only if the first action to be undone is part of the group.
        // group - the name of the particular group that should be undone
        undoHierarchy: function(group) {
            //make sure the first action to be undone is part of the group
            if (undoStack.length <= 0 || getNextUndo().inGroups.indexOf(group) === -1) {
                throw groupUndoError(group);
            }
            // if the group hasn't been ended yet, automatically do so
            if (getNextUndo().atEndOfGroups.indexOf(group) === -1) {
                that.endHierarchy(group);
                //TODO: should there be a warning here? I think this action is more expected that the others.
            }
            // undo each action until the start of the group is reached
            var reachedStart = false;
            while (!reachedStart) {
                if (getNextUndo().atStartOfGroups.indexOf(group) !== -1) {
                    reachedStart = true;
                }
                that.undo(true);
            }

            // Undoing the group may have undone part of other groups.
            // Make the next undo object the end of those groups.
            // TODO: desired? What if those groups hadn't been ended yet?
            // scenario1: s1 a1 a2 a3 s2 a4 a5 e2 e1 u2 --> s1 a1 a2 a3 e1 makes sense
            // scenario2: s1 a1 a2 a3 s2 a4 a5 e2 a6 a7 ua7 ua6 u2 --> would still want group1 open? No.
            // allow undoing of group2, but keep track of whether or not to end group 1
            if (undoStack.length > 0) {
                var nextUndo = getNextUndo();
                nextUndo.atEndOfGroups = nextUndo.inGroups;
            }

            fireEvent({type: 'groupUndone', group: group, undoTitle: '', redoTitle: ''});
            return that;
        },
        // Redoes the group such that it is exactly the way it was right before it was undone, (i.e. if part 
        // of the group was individually undone before the group was undone as a whole, that part will not 
        // appear after redoing the group), but only if the first action to be redone is part of the group. 
        // group - the name of the particular group that should be redone
        redoHierarchy: function(group) {
            //make sure the first action to be redone is part of the group
            if (redoStack.length <= 0 || getNextRedo().inGroups.indexOf(group) === -1) {
                throw groupRedoError(group);
            }

            // redo each action until the end of the group (as it was before the group was undone) is reached
            var reachedEnd = false;
            while (!reachedEnd) {
                if (getNextRedo().atEndOfGroups.indexOf(group) !== -1) {
                    reachedEnd = true;
                }
                that.redo(true);
            }

            fireEvent({type: 'groupRedone', group: group, undoTitle: '', redoTitle: ''});
            return that;
        },
        // Returns the keys of the listeners object.
        // These keys represent the different types of events a listener can subscribe to.
        getEventTypes: function() {
            var eventTypes = [];
            for (var type in listeners) {
                eventTypes.push(type);
            }
            return eventTypes;
        },
        // Adds a listener for the given event type.
        // Returns true if the listener is added successfully
        // eventType - the type of event that the listener should be called for
        // listener - a function that takes the event as a parameter
        addListener: function(eventType, listener) {
            if (!(eventType in listeners)) {
                throw invalidEventTypeError(eventType);
            }
            listeners[eventType].push(listener);
            return true;
        },
        // Removes a listener for the given event type.
        // Returns true if the listener is successfully removed.
        // eventType - the type of event that the listener was subscribed to
        // listener - the function that was subscribed
        removeListener: function(eventType, listener) {
            if (!(eventType in listeners)) {
                throw invalidEventTypeError(eventType);
            }
            var index = listeners[eventType].indexOf(listener); 
            if (index === -1) {
                throw listenerNotSubscribedError();
            }
            unorderedSplice(listeners[eventType], index, 1);
            return true;
        },
        // Switches the debug mode.
        // Returns a boolean indicating if it is now in debug mode.
        toggleDebugMode: function() {
            debug = !debug;
            return debug;
        },
        // Limits the undo and redo stacks to a certain number of operations.
        // maxLength - the length that the stacks should not exceed. When an operation pushes a stack past this length, 
        // the oldest operation will be dropped.
        setStackLimit: function(maxLength) {
            //TODO
        },

        //TODO: make listeners poll these instead of giving so much info in event.

        // Checks if the undoManager can currently perform the undo function for a particular group. 
        // group - specifies the group the undo function applies to. If undefined (or otherwise falsy), 
        // will check for the individual undo function.
        // Returns false if the undo function cannot be applied, returns the title of the group/action if it can.      
        canUndo: function(group) {
            //TODO: test and consider using for events.
            if (undoStack.length > 0) {
                if (!group) {
                    return nextUndo().title;
                }
            }
            else {
                return false;
            }
            if (nextUndo().inGroups.indexOf(group) !== -1) {
                //return nextUndo().groupTitle   //TODO
            }
            return false;
        },
        // Checks if the undoManager can currently perform the redo function for a particular group. 
        // group - specifies the group the redo function applies to. If undefined (or otherwise falsy), 
        // will check for the individual redo function.  
        // Returns false if the redo function cannot be applied, returns the title of the group/action if it can.      
        canRedo: function(group) {
            if (redoStack.length > 0) {
                if (!group && nextRedo().atStartOfGroups.length === 0) {
                    return nextRedo().title;
                }
            }
            else {
                return false;
            }
            if (nextRedo().inGroups.indexOf(group) !== -1) { //TODO: should this be inGroups or atStartOfGroups? 
                //return nextRedo().groupTitle //TODO
            }
            return false;
        },
        // Stops the undoManager from adding actions to the stacks. If a new action is performed or an old action is 
        // redone while the undoManager is suspended, it cannot be undone. If an old action is undone while the 
        // undoManager is suspended, it cannot be redone.
        suspend: function() {
            //TODO
        },
        // Allows the undoManager to continue adding actions to the stacks.
        resume: function() {
            //TODO
        },
        // Returns whether the undoManager is currently suspended.
        isSuspended: function() {
            //TODO
        },
        // Adds to the action at the beginning of the group on the undoStack, if the group is currently open.
        // group - the name of the group that started with the action that will be added to.
        // addendum - the method to concatenate with the already existing action.
        // Returns true if successfully added.
        addToStartOfGroup: function(group, addendum) {
            if (undoStack <= 0) {
                //TODO: error
            }
            if (getNextUndo().inGroups.indexOf(group) === -1) {
                //TODO error
            }
            var index = undoStack.length-1;
            while(undoStack[index].atStartOfGroups.indexOf(group) === -1) {
                index--;
            }
            undoStack[index].action = concatFunction(undoStack[index].action, addendum);
            return true;
        },

        // the following functions are used for testing

        // returns the length of the undo stack
        getUndoLength: function() {
            return undoStack.length;
        },
        // returns the length of the redo stack
        getRedoLength: function() {
            return redoStack.length;
        },
        // returns the title of the next action to be undone //TODO consider using the canUndo/Redo functions in the tests instead of these
        getUndoTitle: function() {
            if (undoStack.length > 0) {
                return getNextUndo().title;
            }
            return null;
        },
        // returns the title of the next action to be redone
        getRedoTitle: function() {
            if (redoStack.length > 0) {
                return getNextRedo().title;
            }
            return null;
        }
    };
    
    return that;  // return the public functions
};
