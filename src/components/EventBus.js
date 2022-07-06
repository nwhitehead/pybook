import { createApp } from 'vue';

// Singleton event bus shared between all components

// The event bus is for application events that bypass the component hierarchy.
// It is currently used to pass focus clicks from deep children back to toplevel.
// Tightly coupled events from child->parent are not put on the event bus.
const EventBus = createApp();

export default EventBus;
