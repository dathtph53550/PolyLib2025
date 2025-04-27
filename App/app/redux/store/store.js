import { configureStore } from '@reduxjs/toolkit';
import booksReducer from '../slices/booksSlice';
import categoriesReducer from '../slices/categoriesSlice';
import accountsReducer from '../slices/accountsSlice';
import registrationReducer from '../slices/registrationSlice';
import registrationsReducer from '../slices/registrationsSlice';
import registrationManagerReducer from '../slices/registrationManagerSlice';
import borrowTicketReducer from '../slices/borrowTicketSlice';
import borrowTicketsReducer from '../slices/borrowTicketsSlice';
import borrowTicketDetailReducer from '../slices/borrowTicketDetailSlice';
import borrowTicketManagerReducer from '../slices/borrowTicketManagerSlice';
import returnTicketManagerReducer from '../slices/returnTicketManagerSlice';
import notificationsReducer from '../slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    books: booksReducer,
    categories: categoriesReducer,
    accounts: accountsReducer,
    registration: registrationReducer,
    registrations: registrationsReducer,
    registrationManager: registrationManagerReducer,
    borrowTicket: borrowTicketReducer,
    borrowTickets: borrowTicketsReducer,
    borrowTicketDetail: borrowTicketDetailReducer,
    borrowTicketManager: borrowTicketManagerReducer,
    returnTicketManager: returnTicketManagerReducer,
    notifications: notificationsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
