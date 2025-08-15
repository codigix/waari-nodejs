// app/s/eventService.js
const EventEmitter = require("events");

class EventService extends EventEmitter {
  constructor() {
    super();

    // This is like Laravel's $listen array
    this.listen = {
      registered: ["sendEmailVerificationNotification"],
    };

    this.registerListeners();
  }

  registerListeners() {
    // Bind each event to its listeners
    Object.entries(this.listen).forEach(([event, listeners]) => {
      listeners.forEach((listener) => {
        const handler = require(`../listeners/${listener}`);
        this.on(event, handler);
      });
    });
  }

  boot() {
    console.log("EventService booted");
  }

  shouldDiscoverEvents() {
    return false; // Laravel equivalent
  }
}

module.exports = new EventService();
